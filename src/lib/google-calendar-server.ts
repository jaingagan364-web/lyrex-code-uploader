import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type ServerSupabase = SupabaseClient;

export function createServerSupabase(): ServerSupabase {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SECRET_KEY"];
  if (!url || !key) throw new Error("Supabase server configuration is incomplete.");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getBearerToken(request: Request): string | null {
  return request.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null;
}

export async function requireUser(supabase: ServerSupabase, request: Request) {
  const token = getBearerToken(request);
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function getSingleOwnedBusiness(supabase: ServerSupabase, ownerId: string) {
  const { data, error } = await supabase
    .from("businesses")
    .select("id,owner_id,business_name,timezone")
    .eq("owner_id", ownerId)
    .limit(2);
  if (error) throw error;
  if (!data?.length) return { business: null, reason: "not_found" as const };
  if (data.length !== 1) return { business: null, reason: "multiple" as const };
  return { business: data[0], reason: null };
}

export async function requireOneActiveSubscription(
  supabase: ServerSupabase,
  ownerId: string,
  businessId: string,
) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", ownerId)
    .eq("business_id", businessId)
    .eq("status", "active")
    .not("paddle_subscription_id", "is", null)
    .gt("current_period_end", now)
    .limit(2);
  if (error) throw error;
  return data?.length === 1;
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function encryptionKey(): Buffer {
  const encoded = process.env["GOOGLE_TOKEN_ENCRYPTION_KEY"];
  if (!encoded) throw new Error("Google Calendar token encryption is not configured.");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }
  return key;
}

export function encryptRefreshToken(refreshToken: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(refreshToken, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptRefreshToken(payload: string): string {
  const [version, ivText, tagText, dataText] = payload.split(".");
  if (version !== "v1" || !ivText || !tagText || !dataText) {
    throw new Error("Stored Google Calendar credential has an unsupported format.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivText, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function googleOAuthConfig() {
  const clientId = process.env["GOOGLE_OAUTH_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_OAUTH_CLIENT_SECRET"];
  const redirectUri = process.env["GOOGLE_OAUTH_REDIRECT_URI"];
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google Calendar OAuth is not configured.");
  }
  const parsed = new URL(redirectUri);
  if (
    parsed.protocol !== "https:" &&
    process.env["VERCEL_ENV"] !== "development"
  ) {
    throw new Error("Google Calendar OAuth redirect URI must use HTTPS.");
  }
  return { clientId, clientSecret, redirectUri };
}

export function validateIanaTimezone(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}


export async function refreshGoogleAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = googleOAuthConfig();
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => null) as
    | { access_token?: string; expires_in?: number; error?: string }
    | null;
  if (!response.ok || !payload?.access_token) {
    const errorCode = payload?.error === "invalid_grant" ? "reconnect_required" : "token_refresh_failed";
    throw Object.assign(new Error("Google Calendar authorization must be renewed."), { code: errorCode });
  }
  return payload.access_token;
}

export async function googleCalendarRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`https://www.googleapis.com/calendar/v3${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    signal: init?.signal ?? AbortSignal.timeout(15000),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const code = response.status === 401 ? "reconnect_required" : "calendar_api_error";
    throw Object.assign(new Error("Google Calendar request failed."), { code, status: response.status });
  }
  return payload as T;
}

export async function getBusinessCalendarAccess(
  supabase: ServerSupabase,
  businessId: string,
) {
  const { data: connection, error } = await supabase
    .from("business_calendar_connections")
    .select("refresh_token_encrypted,calendar_id,connection_status,account_email")
    .eq("business_id", businessId)
    .maybeSingle();
  if (error) throw error;
  if (!connection || connection.connection_status !== "connected") {
    throw Object.assign(new Error("A Google Calendar must be connected first."), { code: "not_connected" });
  }

  const refreshToken = decryptRefreshToken(connection.refresh_token_encrypted);
  try {
    const accessToken = await refreshGoogleAccessToken(refreshToken);
    await supabase
      .from("business_calendar_connections")
      .update({ last_verified_at: new Date().toISOString(), last_error_code: null })
      .eq("business_id", businessId);
    return { accessToken, calendarId: connection.calendar_id, accountEmail: connection.account_email };
  } catch (error) {
    const code = error instanceof Error && "code" in error ? String(error.code) : "token_refresh_failed";
    if (code === "reconnect_required") {
      await supabase
        .from("business_calendar_connections")
        .update({ connection_status: "reconnect_required", last_error_code: code, updated_at: new Date().toISOString() })
        .eq("business_id", businessId);
    }
    throw error;
  }
}

export const GOOGLE_CALENDAR_REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.events.freebusy",
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
];

export const GOOGLE_CALENDAR_SCOPES = [
  "openid",
  "email",
  ...GOOGLE_CALENDAR_REQUIRED_SCOPES,
];
