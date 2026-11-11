import {
  createServerSupabase,
  encryptRefreshToken,
  googleOAuthConfig,
  GOOGLE_CALENDAR_REQUIRED_SCOPES,
  GOOGLE_CALENDAR_SCOPES,
  requireOneActiveSubscription,
  sha256,
} from "@/lib/google-calendar-server";
import { createFileRoute } from "@tanstack/react-router";

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
};

function appRedirect(status: "connected" | "cancelled" | "error") {
  const base = process.env["APP_BASE_URL"];
  if (!base) {
    return new Response("Calendar connection completed. Configure APP_BASE_URL to return to Febily.", {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  }
  const url = new URL("/setup", base);
  url.searchParams.set("calendar", status);
  return Response.redirect(url, 303);
}

export const Route = createFileRoute("/api/calendar/google/callback")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const requestUrl = new URL(request.url);
        const state = requestUrl.searchParams.get("state");
        const code = requestUrl.searchParams.get("code");
        const googleError = requestUrl.searchParams.get("error");

        if (!state || state.length > 256) return appRedirect("error");

        try {
          const supabase = createServerSupabase();
          const now = new Date().toISOString();
          const { data: stateRecord, error: stateError } = await supabase
            .from("business_calendar_oauth_states")
            .update({ consumed_at: now })
            .eq("state_hash", sha256(state))
            .is("consumed_at", null)
            .gt("expires_at", now)
            .select("business_id,owner_id")
            .maybeSingle();

          if (stateError || !stateRecord) return appRedirect("error");
          if (googleError || !code || code.length > 4096) return appRedirect("cancelled");

          // The business owner or subscription may have changed while the
          // customer was on Google's consent screen. Re-check both before
          // storing any refresh token.
          const { data: ownedBusiness, error: ownershipError } = await supabase
            .from("businesses")
            .select("id")
            .eq("id", stateRecord.business_id)
            .eq("owner_id", stateRecord.owner_id)
            .maybeSingle();
          if (ownershipError || !ownedBusiness) return appRedirect("error");
          const stillSubscribed = await requireOneActiveSubscription(
            supabase,
            stateRecord.owner_id,
            stateRecord.business_id,
          );
          if (!stillSubscribed) return appRedirect("error");

          const config = googleOAuthConfig();
          const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "content-type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              code,
              client_id: config.clientId,
              client_secret: config.clientSecret,
              redirect_uri: config.redirectUri,
              grant_type: "authorization_code",
            }),
            signal: AbortSignal.timeout(15000),
          });
          const tokens = await tokenResponse.json().catch(() => null) as GoogleTokenResponse | null;
          if (!tokenResponse.ok || !tokens?.access_token) {
            console.error("[google-calendar-callback] Authorization code exchange failed", tokens?.error ?? tokenResponse.status);
            return appRedirect("error");
          }

          const identityResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
            headers: { authorization: `Bearer ${tokens.access_token}` },
            signal: AbortSignal.timeout(10000),
          });
          const identity = await identityResponse.json().catch(() => null) as { email?: string; email_verified?: boolean } | null;
          if (!identityResponse.ok || !identity?.email || identity.email_verified !== true) {
            console.error("[google-calendar-callback] Google account identity could not be verified");
            return appRedirect("error");
          }

          const grantedScopes = tokens.scope?.split(" ").filter(Boolean) ?? [];
          const missingScopes = GOOGLE_CALENDAR_REQUIRED_SCOPES.filter((scope) => !grantedScopes.includes(scope));
          if (missingScopes.length > 0) {
            console.error("[google-calendar-callback] Google did not grant the required Calendar scopes");
            return appRedirect("error");
          }

          const { data: existingConnection, error: existingError } = await supabase
            .from("business_calendar_connections")
            .select("refresh_token_encrypted,calendar_id,account_email")
            .eq("business_id", stateRecord.business_id)
            .maybeSingle();
          if (existingError) throw existingError;

          let refreshToken = tokens.refresh_token;
          const sameGoogleAccount = existingConnection?.account_email?.toLowerCase() === identity.email.toLowerCase();
          if (!refreshToken && sameGoogleAccount && existingConnection?.refresh_token_encrypted) {
            const helper = await import("@/lib/google-calendar-server");
            refreshToken = helper.decryptRefreshToken(existingConnection.refresh_token_encrypted);
          }
          if (!refreshToken) {
            console.error("[google-calendar-callback] Google did not return an offline refresh token for this account");
            return appRedirect("error");
          }
          const selectedCalendarId = sameGoogleAccount && existingConnection?.calendar_id
            ? existingConnection.calendar_id
            : "primary";

          const { error: saveError } = await supabase
            .from("business_calendar_connections")
            .upsert({
              business_id: stateRecord.business_id,
              provider: "google",
              calendar_id: selectedCalendarId,
              account_email: identity.email,
              refresh_token_encrypted: encryptRefreshToken(refreshToken),
              granted_scopes: grantedScopes,
              connection_status: "connected",
              connected_at: new Date().toISOString(),
              last_verified_at: new Date().toISOString(),
              last_error_code: null,
              updated_at: new Date().toISOString(),
            }, { onConflict: "business_id" });

          if (saveError) throw saveError;
          return appRedirect("connected");
        } catch (error) {
          console.error("[google-calendar-callback] Calendar connection failed", error instanceof Error ? error.message : "unknown");
          return appRedirect("error");
        }
      },
    },
  },
});
