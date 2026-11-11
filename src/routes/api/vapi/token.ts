import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { SignJWT } from "jose";

const RESPONSE_HEADERS = { "cache-control": "no-store" };
const PRODUCTION_ALLOWED_ORIGINS = ["https://www.febily.com", "https://febily.com"];

function getAllowedOrigins(): string[] {
  const origins = new Set(PRODUCTION_ALLOWED_ORIGINS);

  // Vercel supplies the branch alias and unique deployment hostname at runtime.
  // Permit those exact HTTPS hosts only in Preview. Production JWTs never trust
  // arbitrary request Origin values or Vercel preview domains.
  if (process.env["VERCEL_ENV"] === "preview") {
    for (const hostname of [
      process.env["VERCEL_BRANCH_URL"],
      process.env["VERCEL_URL"],
    ]) {
      if (!hostname) continue;
      try {
        const url = new URL(hostname.startsWith("https://") ? hostname : `https://${hostname}`);
        if (
          url.protocol === "https:" &&
          url.hostname.endsWith(".vercel.app") &&
          !url.port &&
          url.pathname === "/" &&
          !url.search &&
          !url.hash
        ) {
          origins.add(url.origin);
        }
      } catch {
        // Ignore malformed system values; canonical production origins remain.
      }
    }
  }

  return [...origins];
}

function json(body: Record<string, unknown>, status: number) {
  return Response.json(body, { status, headers: RESPONSE_HEADERS });
}

export const Route = createFileRoute("/api/vapi/token")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get("authorization");
        const bearerMatch = authorization?.match(/^Bearer\s+(\S+)$/i);
        const accessToken = bearerMatch?.[1];
        if (!accessToken) {
          return json({ error: "A valid sign-in session is required." }, 401);
        }

        const supabaseUrl = process.env["SUPABASE_URL"];
        const supabaseSecretKey = process.env["SUPABASE_SECRET_KEY"];
        if (!supabaseUrl || !supabaseSecretKey) {
          console.error("[vapi-token] Supabase server configuration is missing");
          return json({ error: "Receptionist access is temporarily unavailable." }, 503);
        }

        // Safe diagnostic: this public project reference lets us verify that
        // the Preview server and the Supabase dashboard point to the same
        // project without exposing any credentials.
        let databaseProjectRef: string | null = null;
        try {
          databaseProjectRef = new URL(supabaseUrl).hostname.split(".")[0] || null;
        } catch {
          databaseProjectRef = null;
        }

        try {
          const supabase = createClient(supabaseUrl, supabaseSecretKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
          });

          const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
          if (authError || !authData.user) {
            return json({ error: "Your sign-in session is invalid or expired." }, 401);
          }

          const userId = authData.user.id;
          const { data: businesses, error: businessError } = await supabase
            .from("businesses")
            .select("id,vapi_assistant_id,vapi_provisioning_status")
            .eq("owner_id", userId)
            .limit(2);

          if (businessError) {
            console.error("[vapi-token] Could not verify business ownership", businessError.message);
            return json({ error: "Could not verify receptionist access." }, 500);
          }

          if (!businesses?.length) {
            return json({ error: "Complete your business setup to continue." }, 403);
          }

          if (businesses.length !== 1) {
            return json({ error: "A single business profile is required for receptionist access." }, 403);
          }

          const now = new Date().toISOString();
          const { data: subscriptions, error: subscriptionError } = await supabase
            .from("subscriptions")
            .select("id,paddle_subscription_id,current_period_end,business_id")
            .eq("user_id", userId)
            .eq("business_id", businesses[0].id)
            .eq("status", "active")
            .not("paddle_subscription_id", "is", null)
            .gt("current_period_end", now)
            .limit(2);

          if (subscriptionError) {
            console.error("[vapi-token] Could not verify subscription ownership", subscriptionError.message);
            return json({ error: "Could not verify receptionist access." }, 500);
          }

          if (!subscriptions?.length) {
            return json(
              { error: "A verified, unexpired Febily subscription linked to this business is required." },
              403,
            );
          }

          if (subscriptions.length !== 1) {
            return json(
              {
                error: `The connected database returned ${subscriptions.length} eligible active subscriptions for this business; exactly one is required.`,
                databaseProjectRef,
                subscriptionDiagnostics: subscriptions.map((subscription) => ({
                  paddleSubscriptionSuffix:
                    typeof subscription.paddle_subscription_id === "string"
                      ? subscription.paddle_subscription_id.slice(-6)
                      : null,
                  currentPeriodEnd: subscription.current_period_end,
                  businessLinkMatches: subscription.business_id === businesses[0].id,
                })),
              },
              403,
            );
          }

          const business = businesses[0];
          if (
            business.vapi_provisioning_status !== "provisioned" ||
            typeof business.vapi_assistant_id !== "string" ||
            !business.vapi_assistant_id.trim()
          ) {
            return json(
              {
                error: "Your receptionist is not provisioned yet. Your subscription and business setup are saved; activation is pending.",
                provisioningStatus: business.vapi_provisioning_status ?? "pending",
              },
              503,
            );
          }

          if (process.env["VAPI_LAUNCH_ENABLED"] !== "true") {
            return json(
              { error: "Your receptionist is provisioned, but voice launch is not enabled yet." },
              503,
            );
          }

          const vapiPrivateKey = process.env["VAPI_PRIVATE_KEY"];
          const orgId = process.env["VAPI_ORG_ID"];
          if (!vapiPrivateKey || !orgId) {
            console.error("[vapi-token] Vapi server configuration is missing");
            return json({ error: "Receptionist access is temporarily unavailable." }, 503);
          }

          const assistantId = business.vapi_assistant_id;
          const token = await new SignJWT({
            orgId,
            token: {
              tag: "public",
              restrictions: {
                enabled: true,
                allowedOrigins: getAllowedOrigins(),
                allowedAssistantIds: [assistantId],
                allowTransientAssistant: false,
              },
            },
          })
            .setProtectedHeader({ alg: "HS256" })
            .setIssuedAt()
            .setExpirationTime("5m")
            .sign(new TextEncoder().encode(vapiPrivateKey));

          return json({ token, assistantId }, 200);
        } catch (error) {
          console.error("[vapi-token] Request failed", error);
          return json({ error: "Could not verify receptionist access." }, 500);
        }
      },
    },
  },
});