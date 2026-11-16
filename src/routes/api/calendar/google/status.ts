import { createServerSupabase, getSingleOwnedBusiness, requireOneActiveSubscription, requireUser } from "@/lib/google-calendar-server";
import { createFileRoute } from "@tanstack/react-router";

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "cache-control": "no-store" } });
}

export const Route = createFileRoute("/api/calendar/google/status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const supabase = createServerSupabase();
          const user = await requireUser(supabase, request);
          if (!user) return json({ error: "Sign in to view calendar status." }, 401);
          const { business, reason } = await getSingleOwnedBusiness(supabase, user.id);
          if (!business) return json({ error: reason === "multiple" ? "Multiple business profiles need review." : "Business profile not found." }, 409);
          const eligible = await requireOneActiveSubscription(supabase, user.id, business.id);
          if (!eligible) return json({ error: "An active subscription linked to this business is required." }, 403);

          const { data, error } = await supabase
            .from("business_calendar_connections")
            .select("account_email,calendar_id,connection_status,connected_at,last_verified_at,last_error_code")
            .eq("business_id", business.id)
            .maybeSingle();
          if (error) throw error;
          return json({
            connected: Boolean(data && data.connection_status === "connected"),
            accountEmail: data?.account_email ?? null,
            calendarId: data?.calendar_id ?? null,
            connectionStatus: data?.connection_status ?? "not_connected",
            connectedAt: data?.connected_at ?? null,
            lastVerifiedAt: data?.last_verified_at ?? null,
            reconnectRequired: data?.connection_status === "reconnect_required",
          });
        } catch (error) {
          console.error("[google-calendar-status] Failed", error instanceof Error ? error.message : "unknown");
          return json({ error: "Could not load Google Calendar connection status." }, 500);
        }
      },
    },
  },
});
