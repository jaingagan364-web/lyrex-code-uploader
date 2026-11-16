import { randomBytes } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import {
  createServerSupabase,
  getSingleOwnedBusiness,
  googleOAuthConfig,
  GOOGLE_CALENDAR_SCOPES,
  requireOneActiveSubscription,
  requireUser,
  sha256,
} from "@/lib/google-calendar-server";

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export const Route = createFileRoute("/api/calendar/google/connect")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const bearer = request.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1];
        if (!bearer) return json({ error: "Sign in to connect a business calendar." }, 401);
        if (process.env["GOOGLE_CALENDAR_CONNECT_ENABLED"] !== "true") {
          return json({ error: "Google Calendar connection is not enabled for this Preview." }, 503);
        }

        try {
          const supabase = createServerSupabase();
          const user = await requireUser(supabase, request);
          if (!user || user.id === "") return json({ error: "Your sign-in session has expired." }, 401);

          const { business, reason } = await getSingleOwnedBusiness(supabase, user.id);
          if (!business) {
            return json({
              error: reason === "multiple"
                ? "Multiple businesses are linked to this account. Contact support."
                : "Save your business profile before connecting a calendar.",
            }, 409);
          }

          const eligible = await requireOneActiveSubscription(supabase, user.id, business.id);
          if (!eligible) return json({ error: "An active subscription linked to this business is required." }, 403);

          const config = googleOAuthConfig();
          const state = randomBytes(32).toString("base64url");
          const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

          const { error: stateError } = await supabase
            .from("business_calendar_oauth_states")
            .insert({
              state_hash: sha256(state),
              business_id: business.id,
              owner_id: user.id,
              expires_at: expiresAt,
            });
          if (stateError) throw stateError;

          const authorization = new URL("https://accounts.google.com/o/oauth2/v2/auth");
          authorization.searchParams.set("client_id", config.clientId);
          authorization.searchParams.set("redirect_uri", config.redirectUri);
          authorization.searchParams.set("response_type", "code");
          authorization.searchParams.set("scope", GOOGLE_CALENDAR_SCOPES.join(" "));
          authorization.searchParams.set("access_type", "offline");
          authorization.searchParams.set("prompt", "consent");
          authorization.searchParams.set("include_granted_scopes", "true");
          authorization.searchParams.set("state", state);

          return json({ authorizationUrl: authorization.toString() });
        } catch (error) {
          console.error("[google-calendar-connect] Failed to create OAuth request", error instanceof Error ? error.message : "unknown");
          return json({ error: "Could not start Google Calendar connection. Check the server configuration." }, 503);
        }
      },
    },
  },
});
