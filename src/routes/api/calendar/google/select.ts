import {
  createServerSupabase,
  getBusinessCalendarAccess,
  getSingleOwnedBusiness,
  googleCalendarRequest,
  requireOneActiveSubscription,
  requireUser,
} from "@/lib/google-calendar-server";
import { createFileRoute } from "@tanstack/react-router";

type CalendarListResponse = {
  items?: Array<{ id: string; accessRole?: string; primary?: boolean }>;
};

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export const Route = createFileRoute("/api/calendar/google/select")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const supabase = createServerSupabase();
          const user = await requireUser(supabase, request);
          if (!user) return json({ error: "Sign in to select a calendar." }, 401);
          const body = await request.json().catch(() => null) as { calendarId?: unknown } | null;
          if (!body || typeof body.calendarId !== "string" || body.calendarId.length < 1 || body.calendarId.length > 512) {
            return json({ error: "Select a valid Google Calendar." }, 400);
          }

          const { business } = await getSingleOwnedBusiness(supabase, user.id);
          if (!business) return json({ error: "A single business profile is required." }, 409);
          if (!(await requireOneActiveSubscription(supabase, user.id, business.id))) {
            return json({ error: "An active subscription linked to this business is required." }, 403);
          }

          const { accessToken } = await getBusinessCalendarAccess(supabase, business.id);
          const result = await googleCalendarRequest<CalendarListResponse>(
            "/users/me/calendarList?maxResults=250",
            accessToken,
          );
          const chosen = (result.items ?? []).find((item) =>
            item.id === body.calendarId &&
            (item.accessRole === "owner" || item.accessRole === "writer" || item.primary === true)
          );
          if (!chosen) return json({ error: "That calendar is not writable by the connected Google account." }, 403);

          const { error } = await supabase
            .from("business_calendar_connections")
            .update({ calendar_id: chosen.id, updated_at: new Date().toISOString() })
            .eq("business_id", business.id);
          if (error) throw error;
          return json({ success: true, calendarId: chosen.id });
        } catch (error) {
          const code = error instanceof Error && "code" in error ? String(error.code) : "calendar_select_failed";
          if (code === "reconnect_required") return json({ error: "Reconnect Google Calendar to continue.", reconnectRequired: true }, 409);
          console.error("[google-calendar-select] Failed", error instanceof Error ? error.message : "unknown");
          return json({ error: "Could not save the selected calendar." }, 500);
        }
      },
    },
  },
});
