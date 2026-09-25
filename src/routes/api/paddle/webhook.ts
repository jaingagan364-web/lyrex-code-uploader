import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";

// Paddle webhook endpoint.
// Security model: Paddle is an external caller, so this lives under
// Authenticity is enforced here by verifying the Paddle-Signature HMAC over
// the exact raw request body before parsing the event.

// Best-effort idempotency: remember recently processed event IDs so duplicate
// deliveries are acknowledged without reprocessing. Module-level cache is
// per-instance and ephemeral; for strict guarantees persist event IDs in a DB.
const processedEventIds = new Set<string>();
const MAX_TRACKED_EVENTS = 5000;

function rememberEvent(eventId: string): boolean {
  if (processedEventIds.has(eventId)) return false;
  if (processedEventIds.size >= MAX_TRACKED_EVENTS) {
    const oldest = processedEventIds.values().next().value;
    if (oldest !== undefined) processedEventIds.delete(oldest);
  }
  processedEventIds.add(eventId);
  return true;
}

/**
 * Verify a Paddle-Signature header of the form:
 *   ts=1704067200;h1=<hex-hmac-sha256>
 * Signed payload: `${ts}:${rawBody}` with the webhook secret as key.
 */
function verifyPaddleSignature(
  signatureHeader: string | null,
  rawBody: string,
  secret: string,
): boolean {
  if (!signatureHeader) return false;

  let ts: string | undefined;
  const h1s: string[] = [];
  for (const pair of signatureHeader.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    const k = pair.slice(0, idx).trim();
    const v = pair.slice(idx + 1).trim();
    if (k === "ts") ts = v;
    else if (k === "h1" && v) h1s.push(v);
  }
  if (!ts || h1s.length === 0) return false;

  const expected = Buffer.from(
    createHmac("sha256", secret).update(`${ts}:${rawBody}`).digest("hex"),
    "utf8",
  );
  return h1s.some((h1) => {
    const b = Buffer.from(h1, "utf8");
    return b.length === expected.length && timingSafeEqual(expected, b);
  });
}

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type PaddleData = {
  id?: string;
  customer_id?: string | null;
  subscription_id?: string | null;
  status?: string;
  custom_data?: Record<string, unknown> | null;
  current_billing_period?: { ends_at?: string | null } | null;
  items?: Array<{ status?: string; price?: { id?: string } | null; price_id?: string }> | null;
};

function extractUserId(d: PaddleData): string | undefined {
  const v = d.custom_data?.["user_id"];
  return typeof v === "string" && UUID_RE.test(v) ? v : undefined;
}

function extractPriceId(d: PaddleData): string | undefined {
  const items = d.items ?? [];
  const active = items.find((i) => i.status === "active") ?? items[0];
  return active?.price?.id ?? active?.price_id ?? undefined;
}

// Drop undefined fields so existing DB values are preserved.
function clean(obj: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null));
}

const SUBSCRIPTION_EVENTS = new Set([
  "subscription.created",
  "subscription.activated",
  "subscription.updated",
  "subscription.past_due",
  "subscription.paused",
  "subscription.resumed",
  "subscription.canceled",
]);
const TRANSACTION_EVENTS = new Set([
  "transaction.completed",
  "transaction.paid",
  "transaction.payment_failed",
]);

async function upsertBySubscriptionId(subscriptionId: string, fields: Record<string, unknown>) {
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(process.env["SUPABASE_URL"]!, process.env["SUPABASE_SECRET_KEY"]!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const now = new Date().toISOString();

  const { data: existing, error: selErr } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("paddle_subscription_id", subscriptionId)
    .limit(1)
    .maybeSingle();
  if (selErr) throw selErr;

  if (existing) {
    const { error } = await supabase
      .from("subscriptions")
      .update({ ...fields, updated_at: now })
      .eq("paddle_subscription_id", subscriptionId);
    if (error) throw error;
    return;
  }

  const { error } = await supabase
    .from("subscriptions")
    .insert({ ...fields, paddle_subscription_id: subscriptionId, created_at: now, updated_at: now });
  if (error) {
    // Concurrent duplicate delivery inserted first — fall back to update.
    if ((error as { code?: string }).code === "23505") {
      const { error: upErr } = await supabase
        .from("subscriptions")
        .update({ ...fields, updated_at: now })
        .eq("paddle_subscription_id", subscriptionId);
      if (upErr) throw upErr;
      return;
    }
    throw error;
  }
}

export const Route = createFileRoute("/api/paddle/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const secret = process.env["PADDLE_WEBHOOK_SECRET"];
          if (!secret) {
            console.error("[paddle-webhook] PADDLE_WEBHOOK_SECRET is not configured");
            return json({ error: "Webhook not configured" }, 500);
          }

          const rawBody = await request.text();
          const signature = request.headers.get("paddle-signature");
          if (!verifyPaddleSignature(signature, rawBody, secret)) {
            console.warn("[paddle-webhook] Rejected: missing or invalid signature");
            return json({ error: "Invalid signature" }, 401);
          }

          let event: { event_id?: string; event_type?: string; data?: PaddleData };
          try {
            event = JSON.parse(rawBody);
          } catch {
            return json({ error: "Invalid payload" }, 400);
          }

          const eventId = event.event_id ?? "unknown";
          const eventType = event.event_type ?? "unknown";
          const data = event.data ?? {};

          if (eventId !== "unknown" && processedEventIds.has(eventId)) {
            return json({ received: true, duplicate: true });
          }

          console.log("[paddle-webhook] Verified event", {
            event_id: eventId,
            event_type: eventType,
            entity_id: data.id,
            customer_id: data.customer_id,
            subscription_id: data.subscription_id,
          });

          if (!process.env["SUPABASE_URL"] || !process.env["SUPABASE_SECRET_KEY"]) {
            console.error("[paddle-webhook] SUPABASE_URL or SUPABASE_SECRET_KEY missing");
            return json({ error: "Database not configured" }, 500);
          }

          try {
            if (SUBSCRIPTION_EVENTS.has(eventType) && data.id) {
              await upsertBySubscriptionId(
                data.id,
                clean({
                  paddle_customer_id: data.customer_id,
                  status: data.status,
                  user_id: extractUserId(data),
                  current_period_end: data.current_billing_period?.ends_at,
                  price_id: extractPriceId(data),
                }),
              );
            } else if (TRANSACTION_EVENTS.has(eventType) && data.id) {
              if (data.subscription_id) {
                // Status intentionally NOT set here — subscription events control status.
                await upsertBySubscriptionId(
                  data.subscription_id,
                  clean({
                    paddle_transaction_id: data.id,
                    paddle_customer_id: data.customer_id,
                    user_id: extractUserId(data),
                  }),
                );
              } else {
                console.log("[paddle-webhook] Transaction without subscription_id; not stored", data.id);
              }
            }
          } catch (dbErr) {
            console.error("[paddle-webhook] Database error", dbErr);
            return json({ error: "Database error" }, 500);
          }

          if (eventId !== "unknown") rememberEvent(eventId);
          return json({ received: true });
        } catch (err) {
          console.error("[paddle-webhook] Unexpected error", err);
          return json({ error: "Internal error" }, 500);
        }
      },
    },
  },
});
