import { createServerSupabase, encryptRefreshToken, googleOAuthConfig, sha256 } from "@/lib/google-calendar-server";
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

          let refreshToken = tokens.refresh_token;
          if (!refreshToken) {
            // Google may omit a refresh token on an account that has already
            // granted consent. Preserve its existing encrypted token; never
            // replace a working connection with an empty refresh credential.
            const { data: existing, error: existingError } = await supabase
              .from("business_calendar_connections")
              .select("refresh_token_encrypted")
              .eq("business_id", stateRecord.business_id)
              .maybeSingle();
            if (existingError) throw existingError;
            if (existing?.refresh_token_encrypted) {
              const helper = await import("@/lib/google-calendar-server");
              // Re-encrypt is not required; the ciphertext remains bound to this business.
              refreshToken = helper.decryptRefreshToken(existing.refresh_token_encrypted);
            }
          }
          if (!refreshToken) {
            console.error("[google-calendar-callback] Google did not return an offline refresh token");
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

          const { error: saveError } = await supabase
            .from("business_calendar_connections")
            .upsert({
              business_id: stateRecord.business_id,
              provider: "google",
              calendar_id: "primary",
              account_email: identity.email,
              refresh_token_encrypted: encryptRefreshToken(refreshToken),
              granted_scopes: tokens.scope?.split(" ").filter(Boolean) ?? [],
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
