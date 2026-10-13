import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { SignJWT } from "jose";

const RESPONSE_HEADERS = { "cache-control": "no-store" };
const ALLOWED_ORIGINS = ["https://www.febily.com", "https://febily.com"];

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

          if (process.env["VAPI_LAUNCH_ENABLED"] !== "true") {
            return json(
              { error: "Receptionist activation is still being configured." },
              503,
            );
          }

          const userId = authData.user.id;
          const [businessResult, subscriptionResult] = await Promise.all([
            supabase
              .from("businesses")
              .select("id")
              .eq("owner_id", userId)
              .limit(2),
            supabase
              .from("subscriptions")
              .select("id")
              .eq("user_id", userId)
              .eq("status", "active")
              .not("paddle_subscription_id", "is", null)
              .limit(2),
          ]);

          if (businessResult.error || subscriptionResult.error) {
            console.error("[vapi-token] Could not verify business or subscription", {
              businessError: businessResult.error?.message,
              subscriptionError: subscriptionResult.error?.message,
            });
            return json({ error: "Could not verify receptionist access." }, 500);
          }

          if (!businessResult.data?.length) {
            return json({ error: "Complete your business setup to continue." }, 403);
          }

          if (businessResult.data.length > 1 || subscriptionResult.data?.length !== 1) {
            return json(
              { error: "Could not verify a single business and active subscription." },
              403,
            );
          }

          if (!subscriptionResult.data.length) {
            return json({ error: "An active Febily subscription is required." }, 403);
          }

          const vapiPrivateKey = process.env["VAPI_PRIVATE_KEY"];
          const orgId = process.env["VAPI_ORG_ID"];
          const assistantId = process.env["VAPI_ASSISTANT_ID"];
          if (!vapiPrivateKey || !orgId || !assistantId) {
            console.error("[vapi-token] Vapi server configuration is missing");
            return json({ error: "Receptionist access is temporarily unavailable." }, 503);
          }

          const token = await new SignJWT({
            orgId,
            token: {
              tag: "public",
              restrictions: {
                enabled: true,
                allowedOrigins: ALLOWED_ORIGINS,
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