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

type CalendarErrorReason =
  | "missing_state"
  | "state_database_error"
  | "state_invalid_or_expired"
  | "google_consent_denied"
  | "missing_authorization_code"
  | "business_ownership_check_failed"
  | "subscription_not_eligible"
  | "oauth_configuration_error"
  | "token_exchange_failed"
  | "google_identity_verification_failed"
  | "required_calendar_scope_missing"
  | "refresh_token_missing"
  | "connection_record_lookup_failed"
  | "refresh_token_decryption_failed"
  | "token_encryption_failed"
  | "connection_save_failed"
  | "unexpected_callback_error";

function appRedirect(
  status: "connected" | "cancelled" | "error",
  reason?: CalendarErrorReason,
) {
  const base = process.env["APP_BASE_URL"];
  if (!base) {
    return new Response("Calendar connection completed. Configure APP_BASE_URL to return to Febily.", {
      status: 503,
      headers: { "cache-control": "no-store" },
    });
  }
  const url = new URL("/setup", base);
  url.searchParams.set("calendar", status);
  // A short, non-sensitive diagnostic makes Preview failures actionable without
  // exposing OAuth codes, access/refresh tokens, client secrets, or state values.
  if (reason) url.searchParams.set("calendar_reason", reason);
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

        if (!state || state.length > 256) {
          console.error("[google-calendar-callback] Missing or invalid OAuth state");
          return appRedirect("error", "missing_state");
        }

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

          if (stateError) {
            console.error("[google-calendar-callback] OAuth state database operation failed", stateError.code ?? "unknown");
            return appRedirect("error", "state_database_error");
          }
          if (!stateRecord) {
            console.error("[google-calendar-callback] OAuth state was not found, was expired, or was already consumed");
            return appRedirect("error", "state_invalid_or_expired");
          }
          if (googleError) {
            console.error("[google-calendar-callback] Google consent returned an error", googleError);
            return appRedirect("cancelled", "google_consent_denied");
          }
          if (!code || code.length > 4096) {
            console.error("[google-calendar-callback] Google callback did not include a valid authorization code");
            return appRedirect("error", "missing_authorization_code");
          }

          // The business owner or subscription may have changed while the
          // customer was on Google's consent screen. Re-check both before
          // storing any refresh token.
          const { data: ownedBusiness, error: ownershipError } = await supabase
            .from("businesses")
            .select("id")
            .eq("id", stateRecord.business_id)
            .eq("owner_id", stateRecord.owner_id)
            .maybeSingle();
          if (ownershipError || !ownedBusiness) {
            console.error("[google-calendar-callback] Business ownership re-check failed", ownershipError?.code ?? "no_matching_business");
            return appRedirect("error", "business_ownership_check_failed");
          }

          let stillSubscribed = false;
          try {
            stillSubscribed = await requireOneActiveSubscription(
              supabase,
              stateRecord.owner_id,
              stateRecord.business_id,
            );
          } catch (error) {
            console.error("[google-calendar-callback] Subscription re-check failed", error instanceof Error ? error.message : "unknown");
            return appRedirect("error", "subscription_not_eligible");
          }
          if (!stillSubscribed) {
            console.error("[google-calendar-callback] Exactly one eligible active subscription was not found");
            return appRedirect("error", "subscription_not_eligible");
          }

          let config: ReturnType<typeof googleOAuthConfig>;
          try {
            config = googleOAuthConfig();
          } catch (error) {
            console.error("[google-calendar-callback] OAuth configuration is incomplete or invalid", error instanceof Error ? error.message : "unknown");
            return appRedirect("error", "oauth_configuration_error");
          }

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
            return appRedirect("error", "token_exchange_failed");
          }

          const identityResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
            headers: { authorization: `Bearer ${tokens.access_token}` },
            signal: AbortSignal.timeout(10000),
          });
          const identity = await identityResponse.json().catch(() => null) as { email?: string; email_verified?: boolean } | null;
          if (!identityResponse.ok || !identity?.email || identity.email_verified !== true) {
            console.error("[google-calendar-callback] Google account identity could not be verified", identityResponse.status);
            return appRedirect("error", "google_identity_verification_failed");
          }

          const grantedScopes = tokens.scope?.split(" ").filter(Boolean) ?? [];
          const missingScopes = GOOGLE_CALENDAR_REQUIRED_SCOPES.filter((scope) => !grantedScopes.includes(scope));
          if (missingScopes.length > 0) {
            console.error("[google-calendar-callback] Google did not grant all required Calendar scopes", missingScopes);
            return appRedirect("error", "required_calendar_scope_missing");
          }

          const { data: existingConnection, error: existingError } = await supabase
            .from("business_calendar_connections")
            .select("refresh_token_encrypted,calendar_id,account_email")
            .eq("business_id", stateRecord.business_id)
            .maybeSingle();
          if (existingError) {
            console.error("[google-calendar-callback] Existing calendar connection lookup failed", existingError.code ?? "unknown");
            return appRedirect("error", "connection_record_lookup_failed");
          }

          let refreshToken = tokens.refresh_token;
          const sameGoogleAccount = existingConnection?.account_email?.toLowerCase() === identity.email.toLowerCase();
          if (!refreshToken && sameGoogleAccount && existingConnection?.refresh_token_encrypted) {
            try {
              const helper = await import("@/lib/google-calendar-server");
              refreshToken = helper.decryptRefreshToken(existingConnection.refresh_token_encrypted);
            } catch (error) {
              console.error("[google-calendar-callback] Existing refresh token could not be decrypted", error instanceof Error ? error.message : "unknown");
              return appRedirect("error", "refresh_token_decryption_failed");
            }
          }
          if (!refreshToken) {
            console.error("[google-calendar-callback] Google did not return an offline refresh token for this account");
            return appRedirect("error", "refresh_token_missing");
          }
          const selectedCalendarId = sameGoogleAccount && existingConnection?.calendar_id
            ? existingConnection.calendar_id
            : "primary";

          let encryptedRefreshToken: string;
          try {
            encryptedRefreshToken = encryptRefreshToken(refreshToken);
          } catch (error) {
            console.error("[google-calendar-callback] Refresh-token encryption failed", error instanceof Error ? error.message : "unknown");
            return appRedirect("error", "token_encryption_failed");
          }

          const { error: saveError } = await supabase
            .from("business_calendar_connections")
            .upsert({
              business_id: stateRecord.business_id,
              provider: "google",
              calendar_id: selectedCalendarId,
              account_email: identity.email,
              refresh_token_encrypted: encryptedRefreshToken,
              granted_scopes: grantedScopes,
              connection_status: "connected",
              connected_at: new Date().toISOString(),
              last_verified_at: new Date().toISOString(),
              last_error_code: null,
              updated_at: new Date().toISOString(),
            }, { onConflict: "business_id" });

          if (saveError) {
            console.error("[google-calendar-callback] Encrypted calendar connection could not be saved", saveError.code ?? "unknown");
            return appRedirect("error", "connection_save_failed");
          }
          return appRedirect("connected");
        } catch (error) {
          console.error("[google-calendar-callback] Unexpected callback failure", error instanceof Error ? error.message : "unknown");
          return appRedirect("error", "unexpected_callback_error");
        }
      },
    },
  },
});
