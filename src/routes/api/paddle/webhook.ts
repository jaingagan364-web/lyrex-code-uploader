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

  const parts = new Map<string, string>();
  for (const pair of signatureHeader.split(";")) {
    const idx = pair.indexOf("=");
    if (idx === -1) continue;
    parts.set(pair.slice(0, idx).trim(), pair.slice(idx + 1).trim());
  }

  const ts = parts.get("ts");
  const h1 = parts.get("h1");
  if (!ts || !h1) return false;

  const expected = createHmac("sha256", secret)
    .update(`${ts}:${rawBody}`)
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(h1, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export const Route = createFileRoute("/api/paddle/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["PADDLE_WEBHOOK_SECRET"];
        if (!secret) {
          console.error("[paddle-webhook] PADDLE_WEBHOOK_SECRET is not configured");
          return new Response("Webhook not configured", { status: 500 });
        }

        // Read the raw body BEFORE any parsing — signature depends on it.
        const rawBody = await request.text();
        const signature = request.headers.get("paddle-signature");

        if (!verifyPaddleSignature(signature, rawBody, secret)) {
          console.warn("[paddle-webhook] Rejected: missing or invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }

        let event: {
          event_id?: string;
          event_type?: string;
          data?: Record<string, unknown> & {
            id?: string;
            customer_id?: string;
            subscription_id?: string;
            transaction_id?: string;
          };
        };
        try {
          event = JSON.parse(rawBody);
        } catch {
          return new Response("Invalid payload", { status: 400 });
        }

        const eventId = event.event_id ?? "unknown";
        const eventType = event.event_type ?? "unknown";
        const data = event.data ?? {};

        // Idempotency: acknowledge duplicates without reprocessing.
        if (eventId !== "unknown" && !rememberEvent(eventId)) {
          console.log(`[paddle-webhook] Duplicate delivery ignored: ${eventId}`);
          return Response.json({ received: true, duplicate: true });
        }

        // Server-side debug logging only — never exposed to the client.
        console.log("[paddle-webhook] Verified event", {
          event_id: eventId,
          event_type: eventType,
          entity_id: data.id,
          customer_id: data.customer_id,
          subscription_id: data.subscription_id,
          transaction_id: data.transaction_id,
        });

        // Acknowledge promptly so Paddle does not retry.
        return Response.json({ received: true });
      },
    },
  },
});
