import { createHmac } from "crypto";
import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

export const Route = createFileRoute("/api/paddle/checkout-identity")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get("authorization");
        const match = authorization?.match(/^Bearer\s+(\S+)$/i);
        const accessToken = match?.[1];
        if (!accessToken) return json({ error: "A signed-in session is required." }, 401);

        const supabaseUrl = process.env["SUPABASE_URL"];
        const supabaseSecretKey = process.env["SUPABASE_SECRET_KEY"];
        const identitySigningSecret = process.env["PADDLE_IDENTITY_SIGNING_SECRET"];

        if (
          !supabaseUrl ||
          !supabaseSecretKey ||
          !identitySigningSecret ||
          identitySigningSecret.length < 32
        ) {
          console.error("[paddle-checkout-identity] Server configuration is missing");
          return json({ error: "Secure checkout is temporarily unavailable." }, 503);
        }

        const supabase = createClient(supabaseUrl, supabaseSecretKey, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        });

        const { data, error } = await supabase.auth.getUser(accessToken);
        if (error || !data.user) {
          return json({ error: "Your sign-in session is invalid or expired." }, 401);
        }

        // The signature proves this user ID was issued by our authenticated
        // server endpoint. Browser-supplied custom_data alone is not trusted.
        const userId = data.user.id;
        const signature = createHmac("sha256", identitySigningSecret)
          .update(`febily:checkout-user:v1:${userId}`)
          .digest("hex");

        return json({ userId, signature });
      },
    },
  },
});
