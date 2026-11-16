import {
  createServerSupabase,
  getBusinessCalendarAccess,
  getSingleOwnedBusiness,
  requireOneActiveSubscription,
  requireUser,
  googleCalendarRequest,
} from "@/lib/google-calendar-server";
import { createFileRoute } from "@tanstack/react-router";

type CalendarListResponse = {
  items?: Array<{
    id: string;
    summary?: string;
    primary?: boolean;
    timeZone?: string;
    accessRole?: string;
  }>;
  nextPageToken?: string;
};

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export const Route = createFileRoute("/api/calendar/google/calendars")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const supabase = createServerSupabase();
          const user = await requireUser(supabase, request);
          if (!user) return json({ error: "Sign in to view calendars." }, 401);
          const { business } = await getSingleOwnedBusiness(supabase, user.id);
          if (!business) return json({ error: "A single business profile is required." }, 409);
          if (!(await requireOneActiveSubscription(supabase, user.id, business.id))) {
            return json({ error: "An active subscription linked to this business is required." }, 403);
          }

          const { accessToken, calendarId } = await getBusinessCalendarAccess(supabase, business.id);
          const result = await googleCalendarRequest<CalendarListResponse>(
            "/users/me/calendarList?maxResults=250",
            accessToken,
          );
          const calendars = (result.items ?? [])
            .filter((item) => item.accessRole === "owner" || item.accessRole === "writer" || item.primary === true)
            .map((item) => ({
              id: item.id,
              name: item.summary || item.id,
              primary: item.primary === true,
              timeZone: item.timeZone ?? null,
              selected: item.id === calendarId,
              accessRole: item.accessRole ?? "reader",
            }));
          return json({ calendars });
        } catch (error) {
          const code = error instanceof Error && "code" in error ? String(error.code) : "calendar_list_failed";
          if (code === "reconnect_required") return json({ error: "Reconnect Google Calendar to continue.", reconnectRequired: true }, 409);
          console.error("[google-calendar-calendars] Failed", error instanceof Error ? error.message : "unknown");
          return json({ error: "Could not load calendars for this business." }, 500);
        }
      },
    },
  },
});
