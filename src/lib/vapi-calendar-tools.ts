import { createHash, timingSafeEqual } from "node:crypto";
import {
  getBusinessCalendarAccess,
  googleCalendarRequest,
  type ServerSupabase,
} from "@/lib/google-calendar-server";

type JsonRecord = Record<string, unknown>;

type BusinessCalendarProfile = {
  id: string;
  owner_id: string;
  business_name: string;
  timezone: string | null;
  opening_hours: unknown;
  services: unknown;
  vapi_assistant_id: string | null;
  vapi_provisioning_status: string | null;
};

type CalendarEvent = {
  id?: string;
  summary?: string;
  status?: string;
  start?: { dateTime?: string; date?: string; timeZone?: string };
  end?: { dateTime?: string; date?: string; timeZone?: string };
  extendedProperties?: { private?: Record<string, string> };
};

type CalendarEventsResponse = {
  items?: CalendarEvent[];
  nextPageToken?: string;
};

type CalendarFunctionCall = {
  id?: string;
  name?: string;
  arguments?: unknown;
};

const GOOGLE_EVENTS_BASE = "/calendars/";
const VAPI_API_BASE = "https://api.vapi.ai";
const SLOT_STEP_MINUTES = 15;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function safeString(value: unknown, maxLength = 200): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= maxLength ? trimmed : null;
}

function jsonError(message: string) {
  return { ok: false as const, message };
}

/**
 * Normalize a caller-confirmed callback number to E.164.
 * Ten-digit and eleven-digit NANP numbers are normalized to +1; an explicitly
 * supplied international country code is preserved and validated.
 */
function normalizeCustomerPhone(value: unknown): string | null {
  const raw = safeString(value, 40);
  if (!raw) return null;

  const compact = raw.replace(/[().\\s-]/g, "");
  if (!/^\\+?\\d+$/.test(compact)) return null;

  let normalized = compact;
  if (!normalized.startsWith("+")) {
    if (normalized.length === 10) normalized = "+1" + normalized;
    else if (normalized.length === 11 && normalized.startsWith("1")) normalized = "+" + normalized;
    else return null;
  }

  return /^\\+[1-9]\\d{7,14}$/.test(normalized) ? normalized : null;
}

function localParts(instant: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const values: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== "literal") values[part.type] = part.value;
  }
  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function sameLocalMinute(
  instant: Date,
  date: string,
  time: string,
  timeZone: string,
) {
  const parts = localParts(instant, timeZone);
  const expectedDate = date.split("-").map(Number);
  const expectedTime = time.split(":").map(Number);
  return (
    parts.year === expectedDate[0] &&
    parts.month === expectedDate[1] &&
    parts.day === expectedDate[2] &&
    parts.hour === expectedTime[0] &&
    parts.minute === expectedTime[1] &&
    parts.second === 0
  );
}

/**
 * Resolve a wall-clock time in an IANA timezone. DST gaps and folds are
 * rejected rather than silently shifting an appointment to another time.
 */
function resolveLocalDateTime(date: string, time: string, timeZone: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return { instant: null, reason: "invalid_format" as const };
  }

  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (
    !year || !month || !day ||
    month < 1 || month > 12 ||
    day < 1 || day > 31 ||
    hour < 0 || hour > 23 ||
    minute < 0 || minute > 59
  ) {
    return { instant: null, reason: "invalid_format" as const };
  }

  const desiredUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  const normalized = new Date(desiredUtc);
  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day
  ) {
    return { instant: null, reason: "invalid_format" as const };
  }

  let guess = desiredUtc;
  try {
    for (let i = 0; i < 5; i += 1) {
      const seen = localParts(new Date(guess), timeZone);
      const seenAsUtc = Date.UTC(
        seen.year,
        seen.month - 1,
        seen.day,
        seen.hour,
        seen.minute,
        seen.second,
      );
      const adjustment = desiredUtc - seenAsUtc;
      if (adjustment === 0) break;
      guess += adjustment;
    }

    const candidates: number[] = [];
    // Searching around the converged instant detects repeated wall-clock
    // times during DST fall-back without assuming a one-hour transition.
    for (let offset = -180; offset <= 180; offset += 15) {
      const candidate = guess + offset * 60_000;
      if (sameLocalMinute(new Date(candidate), date, time, timeZone)) {
        candidates.push(candidate);
      }
    }

    const unique = [...new Set(candidates)];
    if (unique.length === 0) {
      return { instant: null, reason: "nonexistent_local_time" as const };
    }
    if (unique.length > 1) {
      return { instant: null, reason: "ambiguous_local_time" as const };
    }
    return { instant: new Date(unique[0]), reason: null };
  } catch {
    return { instant: null, reason: "invalid_timezone" as const };
  }
}

function parseClock(value: string): number | null {
  const text = value.trim();
  const match = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;
  let hour = Number(match[1]);
  const minute = Number(match[2] ?? "0");
  const suffix = match[3]?.toLowerCase();
  if (minute > 59 || hour > 23) return null;
  if (suffix) {
    if (hour < 1 || hour > 12) return null;
    if (suffix === "am" && hour === 12) hour = 0;
    if (suffix === "pm" && hour !== 12) hour += 12;
  }
  return hour * 60 + minute;
}

function parseHoursRange(value: unknown): { open: number; close: number } | null {
  if (typeof value !== "string") return null;
  if (/^\s*(closed|off|none)\s*$/i.test(value)) return null;
  const match = value.match(
    /(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)\s*(?:-|to|until)\s*(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i,
  );
  if (!match) return null;
  const open = parseClock(match[1]);
  const close = parseClock(match[2]);
  if (open === null || close === null || close <= open) return null;
  return { open, close };
}

function openingHoursForDate(openingHours: unknown, date: string, timeZone: string) {
  if (!isRecord(openingHours)) return null;
  const dayName = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
  }).format(new Date(date + "T12:00:00Z"));
  const key = Object.keys(openingHours).find(
    (item) => item.toLowerCase() === dayName.toLowerCase(),
  );
  if (!key) return null;
  return parseHoursRange(openingHours[key]);
}

type ServiceInfo = {
  name: string;
  durationMinutes: number;
};

function serviceFromObject(value: unknown): ServiceInfo | null {
  if (!isRecord(value)) return null;
  const name =
    safeString(value.name) ??
    safeString(value.service) ??
    safeString(value.title);
  const durationValue =
    value.durationMinutes ??
    value.duration_minutes ??
    value.duration;
  const duration = typeof durationValue === "number"
    ? durationValue
    : typeof durationValue === "string" && /^\d+$/.test(durationValue)
      ? Number(durationValue)
      : null;
  if (!name || duration === null || !Number.isInteger(duration) || duration < 5 || duration > 480) {
    return null;
  }
  return { name, durationMinutes: duration };
}

function serviceFromText(value: string): ServiceInfo | null {
  const durationMatch = value.match(/(\d{1,3})\s*(?:min|mins|minutes)\b/i);
  if (!durationMatch) return null;
  const durationMinutes = Number(durationMatch[1]);
  if (!Number.isInteger(durationMinutes) || durationMinutes < 5 || durationMinutes > 480) {
    return null;
  }
  const name = value
    .split(/\s*[-|]\s*/)
    .map((item) => item.trim())
    .find(Boolean);
  if (!name) return null;
  return { name, durationMinutes };
}

function findService(services: unknown, requestedName: string): ServiceInfo | null {
  const entries = Array.isArray(services)
    ? services
    : typeof services === "string"
      ? services.split(/\r?\n/).filter(Boolean)
      : [];
  const found: ServiceInfo[] = [];
  for (const entry of entries) {
    const info = typeof entry === "string"
      ? serviceFromText(entry)
      : serviceFromObject(entry);
    if (info) found.push(info);
  }
  const normalized = requestedName.trim().toLocaleLowerCase("en-US");
  return found.find((item) => item.name.trim().toLocaleLowerCase("en-US") === normalized) ?? null;
}

function localDateAtOffset(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return value.toISOString().slice(0, 10);
}

function formatLocalTime(instant: Date, timeZone: string) {
  return new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(instant);
}

async function listEvents(
  accessToken: string,
  calendarId: string,
  timeMin: Date,
  timeMax: Date,
  extraParams: Record<string, string> = {},
) {
  const events: CalendarEvent[] = [];
  let pageToken: string | undefined;
  let pageCount = 0;

  do {
    pageCount += 1;
    if (pageCount > 20) {
      // Never treat a partially listed day as free. A heavily booked calendar
      // must fail closed rather than silently omit later pages.
      throw new Error("Google Calendar returned too many pages for this date.");
    }

    const params = new URLSearchParams({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      singleEvents: "true",
      orderBy: "startTime",
      maxResults: "250",
      ...extraParams,
    });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await googleCalendarRequest<CalendarEventsResponse>(
      GOOGLE_EVENTS_BASE + encodeURIComponent(calendarId) + "/events?" + params.toString(),
      accessToken,
    );
    events.push(...(response.items ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return events.filter((event) => event.status !== "cancelled");
}

function eventRange(event: CalendarEvent, timeZone: string) {
  if (event.start?.dateTime && event.end?.dateTime) {
    const start = new Date(event.start.dateTime);
    const end = new Date(event.end.dateTime);
    if (Number.isFinite(start.getTime()) && Number.isFinite(end.getTime())) {
      return { start, end };
    }
  }
  if (event.start?.date && event.end?.date) {
    const start = resolveLocalDateTime(event.start.date, "00:00", timeZone).instant;
    const end = resolveLocalDateTime(event.end.date, "00:00", timeZone).instant;
    if (start && end) return { start, end };
  }
  return null;
}

function hasOverlap(
  events: CalendarEvent[],
  start: Date,
  end: Date,
  timeZone: string,
) {
  return events.some((event) => {
    const range = eventRange(event, timeZone);
    return Boolean(range && range.start < end && range.end > start);
  });
}

function dayBounds(date: string, timeZone: string) {
  const nextDate = localDateAtOffset(date, 1);
  const start = resolveLocalDateTime(date, "00:00", timeZone);
  const end = resolveLocalDateTime(nextDate, "00:00", timeZone);
  if (!start.instant || !end.instant) throw new Error("Could not resolve this business-local date.");
  return { start: start.instant, end: end.instant };
}

function slotFitsOpeningHours(
  date: string,
  time: string,
  durationMinutes: number,
  timeZone: string,
  openingHours: unknown,
) {
  const hours = openingHoursForDate(openingHours, date, timeZone);
  if (!hours) return false;
  const minute = parseClock(time);
  if (minute === null) return false;
  return minute >= hours.open && minute + durationMinutes <= hours.close;
}

function formatSlots(slots: Array<{ time: string; label: string }>) {
  if (slots.length === 0) return "No available appointment times were found for that date and service.";
  return "Available times: " + slots.map((slot) => slot.label).join(", ") + ".";
}

export function calendarToolConfiguration() {
  if (process.env["VAPI_CALENDAR_TOOLS_ENABLED"] !== "true") return null;
  const credentialId = safeString(process.env["VAPI_CALENDAR_TOOL_CREDENTIAL_ID"], 200);
  const appBaseUrl = safeString(
    process.env["APP_BASE_URL"],
    500,
  );
  const token = safeString(process.env["VAPI_CALENDAR_TOOL_TOKEN"], 500);
  if (!credentialId || !token) return null;

  let baseUrl = appBaseUrl;
  if (process.env["VERCEL_ENV"] === "preview") {
    // Prefer the stable branch alias so a later deployment does not leave
    // Vapi tools pinned to a one-off deployment hostname.
    const runtimeHost =
      process.env["VERCEL_BRANCH_URL"] ??
      process.env["VERCEL_URL"];
    if (runtimeHost && runtimeHost.endsWith(".vercel.app")) {
      baseUrl = "https://" + runtimeHost;
    }
  }
  if (!baseUrl) return null;

  try {
    const parsed = new URL(baseUrl);
    if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".vercel.app") && parsed.hostname !== "febily.com" && parsed.hostname !== "www.febily.com") {
      return null;
    }

    const webhookUrl = new URL("/api/vapi/calendar-tools", parsed.origin);
    if (process.env["VERCEL_ENV"] === "preview") {
      // Vapi calls this endpoint server-to-server, so it cannot carry the
      // browser's Vercel-auth cookie. Use Vercel's dedicated automation
      // bypass secret only on Preview deployments. The route still checks
      // the separate VAPI_CALENDAR_TOOL_TOKEN bearer credential.
      const bypassSecret = safeString(
        process.env["VERCEL_AUTOMATION_BYPASS_SECRET"],
        500,
      );
      if (!bypassSecret) return null;
      webhookUrl.searchParams.set("x-vercel-protection-bypass", bypassSecret);
    }

    return { credentialId, webhookUrl: webhookUrl.toString(), token };
  } catch {
    return null;
  }
}

export function buildCalendarFunctionTools() {
  const config = calendarToolConfiguration();
  if (!config) return null;

  const server = {
    url: config.webhookUrl,
    credentialId: config.credentialId,
  };

  return [
    {
      type: "function",
      function: {
        name: "calendar_availability",
        description: "Check whether a specific business-local appointment time is free. Use the exact service name from the saved services list. The date must be YYYY-MM-DD and time must be 24-hour HH:mm in the business timezone.",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            date: { type: "string", description: "Requested business-local date, YYYY-MM-DD." },
            time: { type: "string", description: "Requested business-local start time, HH:mm in 24-hour format." },
            service_name: { type: "string", description: "Exact service name as configured by the business." },
          },
          required: ["date", "time", "service_name"],
        },
      },
      server,
    },
    {
      type: "function",
      function: {
        name: "calendar_slots",
        description: "Find real available appointment start times for one service on a business-local date. Use this when a caller asks what times are available. Never invent slots; report only the returned times.",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            date: { type: "string", description: "Requested business-local date, YYYY-MM-DD." },
            service_name: { type: "string", description: "Exact service name as configured by the business." },
          },
          required: ["date", "service_name"],
        },
      },
      server,
    },
    {
      type: "function",
      function: {
        name: "calendar_set_appointment",
        description: "Book a confirmed appointment in the business's selected Google Calendar. Only call after the caller has agreed to the exact service, date, time, name, and callback phone number. Pass the confirmed phone number in E.164 format. Use an exact configured service name. The function rechecks availability and may refuse a time that has just been taken.",
        parameters: {
          type: "object",
          additionalProperties: false,
          properties: {
            date: { type: "string", description: "Agreed business-local date, YYYY-MM-DD." },
            time: { type: "string", description: "Agreed business-local start time, HH:mm in 24-hour format." },
            service_name: { type: "string", description: "Exact service name as configured by the business." },
            customer_name: { type: "string", description: "Customer name to identify the calendar appointment." },
            customer_phone: { type: "string", description: "Caller-confirmed callback phone number in E.164 format, for example +12125550194." },
          },
          required: ["date", "time", "service_name", "customer_name", "customer_phone"],
        },
      },
      server,
    },
  ] as JsonRecord[];
}

function sameSecret(received: string, expected: string) {
  const left = Buffer.from(received);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right);
}

export function authorizeCalendarToolRequest(request: Request) {
  const expected = process.env["VAPI_CALENDAR_TOOL_TOKEN"];
  const authorization = request.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  return Boolean(expected && match?.[1] && sameSecret(match[1], expected));
}

export async function fetchVapiAssistant(assistantId: string) {
  const privateKey = process.env["VAPI_PRIVATE_KEY"];
  const orgId = process.env["VAPI_ORG_ID"];
  if (!privateKey || !orgId) throw new Error("Vapi server configuration is incomplete.");

  const response = await fetch(VAPI_API_BASE + "/assistant/" + encodeURIComponent(assistantId), {
    headers: { authorization: "Bearer " + privateKey },
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error("Could not verify the Vapi assistant.");
  const assistant = await response.json() as JsonRecord;
  if (assistant.id !== assistantId || assistant.orgId !== orgId) {
    throw new Error("The Vapi assistant organization check failed.");
  }
  const metadata = isRecord(assistant.metadata) ? assistant.metadata : {};
  const businessId = safeString(metadata["febilyBusinessId"], 80);
  if (!businessId) throw new Error("The Vapi assistant is not linked to a Febily business.");
  return { assistant, businessId };
}

export async function getCalendarBusiness(
  supabase: ServerSupabase,
  businessId: string,
  assistantId: string,
) {
  const { data: businesses, error } = await supabase
    .from("businesses")
    .select("id,owner_id,business_name,timezone,opening_hours,services,vapi_assistant_id,vapi_provisioning_status")
    .eq("id", businessId)
    .eq("vapi_assistant_id", assistantId)
    .eq("vapi_provisioning_status", "provisioned")
    .limit(2);
  if (error) throw error;
  if (!businesses || businesses.length !== 1) {
    throw new Error("This assistant is not linked to exactly one active Febily business.");
  }

  const business = businesses[0] as BusinessCalendarProfile;
  const now = new Date().toISOString();
  const { data: subscriptions, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", business.owner_id)
    .eq("business_id", business.id)
    .eq("status", "active")
    .not("paddle_subscription_id", "is", null)
    .gt("current_period_end", now)
    .limit(2);
  if (subscriptionError) throw subscriptionError;
  if (subscriptions?.length !== 1) {
    throw new Error("Exactly one verified and unexpired subscription linked to this business is required.");
  }

  if (!business.timezone) throw new Error("The business timezone is not configured.");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: business.timezone }).format();
  } catch {
    throw new Error("The saved business timezone is invalid. Update the business profile.");
  }

  return business;
}

export async function dispatchCalendarTool(
  supabase: ServerSupabase,
  business: BusinessCalendarProfile,
  call: CalendarFunctionCall,
  callId: string,
) {
  const name = safeString(call.name, 100);
  const callToolId = safeString(call.id, 200);
  if (!name || !callToolId) return jsonError("This calendar request is missing its tool identifier.");
  if (!isRecord(call.arguments)) return jsonError("The calendar request arguments were invalid.");

  const args = call.arguments;
  const date = safeString(args["date"], 10);
  const serviceName = safeString(args["service_name"], 100);
  if (!date || !serviceName || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return jsonError("Please provide a valid date and an exact configured service name.");
  }

  const service = findService(business.services, serviceName);
  if (!service) {
    return jsonError("That service or its appointment duration is not configured. Ask the business owner to add the exact service and its duration in minutes.");
  }

  let calendarAccess: Awaited<ReturnType<typeof getBusinessCalendarAccess>>;
  try {
    calendarAccess = await getBusinessCalendarAccess(supabase, business.id);
  } catch {
    return jsonError("This business's Google Calendar connection needs attention. The owner must reconnect it before checking appointments.");
  }

  let day: { start: Date; end: Date };
  try {
    day = dayBounds(date, business.timezone as string);
  } catch {
    return jsonError("That business-local date could not be resolved.");
  }

  if (name === "calendar_slots") {
    const hours = openingHoursForDate(business.opening_hours, date, business.timezone as string);
    if (!hours) return { ok: true as const, message: "The business is closed or its opening hours are not configured for that date." };

    let events: CalendarEvent[];
    try {
      events = await listEvents(calendarAccess.accessToken, calendarAccess.calendarId, day.start, day.end);
    } catch {
      return jsonError("Google Calendar could not be checked right now. Please try again.");
    }

    const slots: Array<{ time: string; label: string }> = [];
    for (
      let minute = hours.open;
      minute + service.durationMinutes <= hours.close;
      minute += SLOT_STEP_MINUTES
    ) {
      const time = String(Math.floor(minute / 60)).padStart(2, "0") + ":" + String(minute % 60).padStart(2, "0");
      const resolved = resolveLocalDateTime(date, time, business.timezone as string);
      if (!resolved.instant || resolved.instant <= new Date()) continue;
      const end = new Date(resolved.instant.getTime() + service.durationMinutes * 60_000);
      if (!hasOverlap(events, resolved.instant, end, business.timezone as string)) {
        slots.push({ time, label: formatLocalTime(resolved.instant, business.timezone as string) });
      }
    }
    return {
      ok: true as const,
      message: formatSlots(slots),
      data: { date, service: service.name, slots: slots.slice(0, 16).map((slot) => slot.label) },
    };
  }

  const time = safeString(args["time"], 5);
  if (!time || !/^\d{2}:\d{2}$/.test(time)) {
    return jsonError("Please provide a valid business-local time in 24-hour HH:mm format.");
  }
  const resolved = resolveLocalDateTime(date, time, business.timezone as string);
  if (!resolved.instant) {
    if (resolved.reason === "ambiguous_local_time") return jsonError("That time occurs twice because of a daylight-saving clock change. Please offer a different time.");
    if (resolved.reason === "nonexistent_local_time") return jsonError("That local time does not exist because of a daylight-saving clock change. Please offer a different time.");
    return jsonError("That date and time could not be interpreted in the business timezone.");
  }

  const start = resolved.instant;
  const end = new Date(start.getTime() + service.durationMinutes * 60_000);
  if (start <= new Date()) return jsonError("That appointment time is in the past.");
  if (start > new Date(Date.now() + 120 * 24 * 60 * 60_000)) {
    return jsonError("Appointments can only be scheduled up to 120 days ahead.");
  }
  if (!slotFitsOpeningHours(date, time, service.durationMinutes, business.timezone as string, business.opening_hours)) {
    return jsonError("That service does not fit within the business's configured opening hours.");
  }

  if (name === "calendar_availability") {
    try {
      const events = await listEvents(calendarAccess.accessToken, calendarAccess.calendarId, day.start, day.end);
      const available = !hasOverlap(events, start, end, business.timezone as string);
      return {
        ok: true as const,
        message: available
          ? "That time is currently available. Do not say it is booked until the booking function confirms it."
          : "That time is not available. Offer another time returned by the slots function.",
        data: { available, date, time, durationMinutes: service.durationMinutes },
      };
    } catch {
      return jsonError("Google Calendar could not be checked right now. Please try again.");
    }
  }

  if (name !== "calendar_set_appointment") {
    return jsonError("Unknown calendar function.");
  }

  const customerName = safeString(args["customer_name"], 100);
  if (!customerName) return jsonError("A customer name is required before booking.");

  const customerPhone = normalizeCustomerPhone(args["customer_phone"]);
  if (!customerPhone) {
    return jsonError("A valid customer callback phone number is required. Ask for the full number, read it back, and get the caller's confirmation before booking.");
  }

  const idempotencyKey = createHash("sha256")
    .update(callId + ":" + callToolId)
    .digest("hex");

  try {
    const dayEvents = await listEvents(calendarAccess.accessToken, calendarAccess.calendarId, day.start, day.end, {
      privateExtendedProperty: "febilyBookingKey=" + idempotencyKey,
    });
    const existingEvent = dayEvents.find(
      (event) => event.extendedProperties?.private?.["febilyBookingKey"] === idempotencyKey,
    );
    if (existingEvent) {
      return {
        ok: true as const,
        message: "This appointment is already confirmed in the business calendar. Do not create another booking.",
      };
    }
  } catch {
    return jsonError("Google Calendar could not be checked before booking. No appointment was created.");
  }

  const initialEvents = await listEvents(calendarAccess.accessToken, calendarAccess.calendarId, day.start, day.end).catch(() => null);
  if (!initialEvents) return jsonError("Google Calendar could not be checked before booking. No appointment was created.");
  if (hasOverlap(initialEvents, start, end, business.timezone as string)) {
    return jsonError("That time has just become unavailable. Please offer another time.");
  }

  const { data: reservation, error: reservationError } = await supabase.rpc(
    "reserve_business_calendar_booking",
    {
      p_business_id: business.id,
      p_owner_id: business.owner_id,
      p_idempotency_key: idempotencyKey,
      p_starts_at: start.toISOString(),
      p_ends_at: end.toISOString(),
      p_lease_seconds: 180,
    },
  );

  if (reservationError || !isRecord(reservation)) {
    return jsonError("The booking could not be reserved safely. No appointment was created.");
  }

  const reservationState = reservation["state"];
  if (reservationState === "already_booked") {
    return {
      ok: true as const,
      message: "This appointment has already been confirmed. Do not create another booking.",
    };
  }
  if (reservationState === "in_progress") {
    return {
      ok: true as const,
      message: "This appointment request is already being processed. Do not submit it again; check the result before speaking to the caller.",
    };
  }
  if (reservationState === "time_conflict") {
    return jsonError("That time conflicts with another Febily booking. Please offer another time.");
  }
  if (reservationState !== "claimed" || typeof reservation["bookingId"] !== "string") {
    return jsonError("The booking was not reserved. No appointment was created.");
  }

  const bookingId = reservation["bookingId"];

  // Persist the caller-confirmed contact details in the server-only booking
  // ledger before creating the external calendar event. Never create an event
  // when the customer contact record could not be saved.
  const { data: contactSaved, error: contactSaveError } = await supabase.rpc(
    "set_business_calendar_booking_contact",
    {
      p_business_id: business.id,
      p_booking_id: bookingId,
      p_customer_name: customerName,
      p_customer_phone_e164: customerPhone,
    },
  );

  if (contactSaveError || contactSaved !== true) {
    await supabase.rpc("release_business_calendar_booking", {
      p_business_id: business.id,
      p_booking_id: bookingId,
    });
    return jsonError("Customer contact details could not be saved securely. No appointment was created.");
  }

  // Re-read Google Calendar after the database hold is secured. This narrows
  // the race with appointments created outside Febily.
  const latestEvents = await listEvents(calendarAccess.accessToken, calendarAccess.calendarId, day.start, day.end).catch(() => null);
  if (!latestEvents) {
    await supabase.rpc("release_business_calendar_booking", {
      p_business_id: business.id,
      p_booking_id: bookingId,
    });
    return jsonError("Google Calendar could not be rechecked. No appointment was created.");
  }
  if (hasOverlap(latestEvents, start, end, business.timezone as string)) {
    await supabase.rpc("release_business_calendar_booking", {
      p_business_id: business.id,
      p_booking_id: bookingId,
    });
    return jsonError("That time has just become unavailable. Please offer another time.");
  }

  const event = {
    summary: service.name + " appointment — " + customerName,
    description:
      "Appointment booked through the business's Febily receptionist.\\n" +
      "Customer phone: " + customerPhone,
    start: { dateTime: start.toISOString(), timeZone: business.timezone },
    end: { dateTime: end.toISOString(), timeZone: business.timezone },
    extendedProperties: {
      private: {
        febilyBookingKey: idempotencyKey,
        febilyBusinessId: business.id,
        febilyBookingId: bookingId,
        customerName,
        customerPhoneE164: customerPhone,
      },
    },
  };

  let createdEvent: CalendarEvent;
  try {
    createdEvent = await googleCalendarRequest<CalendarEvent>(
      GOOGLE_EVENTS_BASE + encodeURIComponent(calendarAccess.calendarId) + "/events",
      calendarAccess.accessToken,
      { method: "POST", body: JSON.stringify(event) },
    );
  } catch {
    await supabase.rpc("release_business_calendar_booking", {
      p_business_id: business.id,
      p_booking_id: bookingId,
    });
    return jsonError("Google Calendar could not create the appointment. No confirmation was issued.");
  }

  if (!createdEvent.id) {
    // Keep the overlap hold in place if Google may have created the event but
    // returned an unexpected response. The private extended property lets a
    // retry identify the event rather than create a duplicate.
    return jsonError("Google Calendar may have accepted the appointment but did not return its event ID. Do not retry with a new booking; ask the owner to verify the calendar.");
  }

  const { data: completed, error: completionError } = await supabase.rpc(
    "complete_business_calendar_booking",
    {
      p_business_id: business.id,
      p_owner_id: business.owner_id,
      p_booking_id: bookingId,
      p_google_event_id: createdEvent.id,
    },
  );

  if (completionError || completed !== true) {
    // Do not release the hold: the event may already exist. A retry with the
    // same toolCallId will discover the private extended property above.
    return jsonError("The calendar event may have been created but Febily could not finish its confirmation record. Do not promise a confirmed booking; the owner must verify the calendar.");
  }

  return {
    ok: true as const,
    message: "The appointment is confirmed in the business's Google Calendar for " +
      formatLocalTime(start, business.timezone as string) + " on " + date + ".",
    data: {
      confirmed: true,
      date,
      time: formatLocalTime(start, business.timezone as string),
      service: service.name,
      durationMinutes: service.durationMinutes,
    },
  };
}

export function vapiToolCallIdempotency(callId: unknown, toolCallId: unknown) {
  const call = safeString(callId, 200);
  const tool = safeString(toolCallId, 200);
  if (!call || !tool) return null;
  return createHash("sha256").update(call + ":" + tool).digest("hex");
}
