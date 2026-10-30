import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SIGNATURE_TOLERANCE_SECONDS = 5;

type PaddleData = {
  id?: string;
  customer_id?: string | null;
  subscription_id?: string | null;
  status?: string;
  custom_data?: Record<string, unknown> | null;
  current_billing_period?: { ends_at?: string | null } | null;
  items?: Array<{ status?: string; price?: { id?: string } | null; price_id?: string }> | null;
};

type PaddleEvent = {
  event_id?: string;
  event_type?: string;
  occurred_at?: string;
  data?: PaddleData;
};

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

class PermanentWebhookError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PermanentWebhookError";
  }
}

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

function verifyPaddleSignature(
  signatureHeader: string | null,
  rawBody: string,
  secret: string,
): boolean {
  if (!signatureHeader) return false;

  let timestamp: string | undefined;
  const signatures: string[] = [];

  for (const part of signatureHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const key = part.slice(0, separator).trim();
    const value = part.slice(separator + 1).trim();

    if (key === "ts") timestamp = value;
    if (key === "h1" && value) signatures.push(value);
  }

  if (!timestamp || !/^\d+$/.test(timestamp) || signatures.length === 0) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isSafeInteger(timestampSeconds)) return false;
  if (Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const expected = createHmac("sha256", secret)
    .update(`${timestamp}:${rawBody}`)
    .digest();

  return signatures.some((signature) => {
    if (!/^[0-9a-f]{64}$/i.test(signature)) return false;
    const received = Buffer.from(signature, "hex");
    return received.length === expected.length && timingSafeEqual(expected, received);
  });
}

function extractUserId(data: PaddleData, signingSecret: string): string | null {
  const candidate = data.custom_data?.user_id;
  const signature = data.custom_data?.user_id_signature;

  if (
    typeof candidate !== "string" ||
    !UUID_RE.test(candidate) ||
    typeof signature !== "string" ||
    !/^[0-9a-f]{64}$/i.test(signature)
  ) {
    return null;
  }

  const expected = createHmac("sha256", signingSecret)
    .update(`febily:checkout-user:v1:${candidate}`)
    .digest();
  const received = Buffer.from(signature, "hex");

  return received.length === expected.length && timingSafeEqual(expected, received)
    ? candidate
    : null;
}

function extractPriceId(data: PaddleData): string | null {
  const items = data.items ?? [];
  const activeItem = items.find((item) => item.status === "active") ?? items[0];
  return activeItem?.price?.id ?? activeItem?.price_id ?? null;
}

function createAdminClient(): SupabaseClient {
  const url = process.env["SUPABASE_URL"];
  const secretKey = process.env["SUPABASE_SECRET_KEY"];

  if (!url || !secretKey) {
    throw new Error("Supabase server configuration is missing");
  }

  return createClient(url, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

async function updateTransactionReference(
  supabase: SupabaseClient,
  data: PaddleData,
  signingSecret: string,
): Promise<void> {
  if (!data.id || !data.subscription_id) return;

  const { data: existing, error: selectError } = await supabase
    .from("subscriptions")
    .select("id,user_id,business_id")
    .eq("paddle_subscription_id", data.subscription_id)
    .maybeSingle();

  if (selectError) throw selectError;
  // transaction.paid can arrive before subscription.created. The later
  // subscription event creates the subscription row and carries custom_data.
  if (!existing) return;

  const incomingUserId = extractUserId(data, signingSecret);
  if (existing.user_id && incomingUserId && existing.user_id !== incomingUserId) {
    throw new PermanentWebhookError("Transaction custom_data does not match subscription owner");
  }

  const resolvedUserId = existing.user_id ?? incomingUserId;
  const update: Record<string, unknown> = {
    paddle_transaction_id: data.id,
    updated_at: new Date().toISOString(),
  };

  if (data.customer_id) update.paddle_customer_id = data.customer_id;
  if (!existing.user_id && resolvedUserId) update.user_id = resolvedUserId;

  if (!existing.business_id && resolvedUserId) {
    const { data: businesses, error } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", resolvedUserId)
      .limit(2);

    if (error) throw error;
    if (businesses?.length === 1) update.business_id = businesses[0].id;
  }

  const { error: updateError } = await supabase
    .from("subscriptions")
    .update(update)
    .eq("id", existing.id);

  if (updateError) throw updateError;
}

export const Route = createFileRoute("/api/paddle/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const webhookSecret = process.env["PADDLE_WEBHOOK_SECRET"];
        if (!webhookSecret) {
          console.error("[paddle-webhook] PADDLE_WEBHOOK_SECRET is not configured");
          return json({ error: "Webhook not configured" }, 500);
        }

        let rawBody: string;
        try {
          rawBody = await request.text();
        } catch {
          return json({ error: "Could not read request body" }, 400);
        }

        if (!verifyPaddleSignature(request.headers.get("paddle-signature"), rawBody, webhookSecret)) {
          console.warn("[paddle-webhook] Rejected: invalid signature or timestamp");
          return json({ error: "Invalid signature" }, 401);
        }

        let event: PaddleEvent;
        try {
          event = JSON.parse(rawBody) as PaddleEvent;
        } catch {
          return json({ error: "Invalid payload" }, 400);
        }

        const eventId = event.event_id;
        const eventType = event.event_type;
        const occurredAt = event.occurred_at ? new Date(event.occurred_at) : null;

        if (
          typeof eventId !== "string" ||
          !eventId.startsWith("evt_") ||
          typeof eventType !== "string" ||
          !occurredAt ||
          Number.isNaN(occurredAt.getTime())
        ) {
          return json({ error: "Webhook event is missing a valid event_id, event_type, or occurred_at" }, 400);
        }

        let supabase: SupabaseClient;
        try {
          supabase = createAdminClient();
        } catch (error) {
          console.error("[paddle-webhook] Server configuration error", error);
          return json({ error: "Database not configured" }, 500);
        }

        const { data: claim, error: claimError } = await supabase.rpc("claim_paddle_webhook_event", {
          p_event_id: eventId,
          p_event_type: eventType,
          p_occurred_at: occurredAt.toISOString(),
        });

        if (claimError) {
          console.error("[paddle-webhook] Could not claim event", claimError);
          return json({ error: "Webhook event could not be claimed" }, 500);
        }

        if (claim === "processed") return json({ received: true, duplicate: true });
        if (claim !== "claimed") {
          // Do not acknowledge a concurrent in-flight event: Paddle should retry
          // if the original execution crashes before persisting completion.
          return json({ error: "Event is currently being processed" }, 503);
        }

        try {
          const data = event.data ?? {};

          if (SUBSCRIPTION_EVENTS.has(eventType)) {
            if (!data.id || !data.status) {
              throw new Error("Subscription event is missing data.id or data.status");
            }

            const { data: result, error } = await supabase.rpc("apply_paddle_subscription_event", {
              p_paddle_subscription_id: data.id,
              p_user_id: extractUserId(data, webhookSecret),
              p_paddle_customer_id: data.customer_id ?? null,
              p_status: data.status,
              p_price_id: extractPriceId(data),
              p_current_period_end: data.current_billing_period?.ends_at ?? null,
              p_event_occurred_at: occurredAt.toISOString(),
            });

            if (error) throw error;

            const outcome = result as { accepted?: boolean; reason?: string; stale?: boolean } | null;
            if (!outcome?.accepted) {
              const reason = outcome?.reason ?? "subscription_update_rejected";
              await supabase
                .from("paddle_webhook_events")
                .update({
                  processing_status: "failed",
                  last_error: reason,
                })
                .eq("event_id", eventId);

              console.error("[paddle-webhook] Subscription event quarantined", {
                event_id: eventId,
                event_type: eventType,
                reason,
              });
              // This is a data-integrity/ownership conflict, not a transient
              // network failure. Acknowledge it to stop blind retries; the
              // failed event remains available for operator review/replay.
              return json({ received: true, quarantined: true }, 200);
            }
          } else if (TRANSACTION_EVENTS.has(eventType)) {
            await updateTransactionReference(supabase, data, webhookSecret);
          }

          const { error: completeError } = await supabase
            .from("paddle_webhook_events")
            .update({
              processing_status: "processed",
              processed_at: new Date().toISOString(),
              last_error: null,
            })
            .eq("event_id", eventId);

          if (completeError) throw completeError;

          return json({ received: true, processed: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown webhook processing error";
          console.error("[paddle-webhook] Event processing failed", {
            event_id: eventId,
            event_type: eventType,
            error: message,
          });

          await supabase
            .from("paddle_webhook_events")
            .update({
              processing_status: "failed",
              last_error: message.slice(0, 1000),
            })
            .eq("event_id", eventId);

          if (error instanceof PermanentWebhookError) {
            return json({ received: true, quarantined: true }, 200);
          }

          return json({ error: "Webhook processing failed" }, 500);
        }
      },
    },
  },
});
