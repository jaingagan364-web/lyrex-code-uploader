import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import { buildBusinessFirstMessage, buildBusinessReceptionistPrompt } from "@/lib/vapi-assistant-prompt";

const RESPONSE_HEADERS = { "cache-control": "no-store" };
const VAPI_API_BASE = "https://api.vapi.ai";

type JsonRecord = Record<string, unknown>;

type BusinessForProvisioning = {
  id: string;
  owner_id: string;
  business_name: string;
  business_type: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  timezone: string | null;
  receptionist_instructions: string | null;
  opening_hours: unknown;
  services: unknown;
  staff: unknown;
  faqs: unknown;
  vapi_assistant_id: string | null;
  vapi_provisioning_status: string | null;
};

type VapiAssistant = {
  id?: string;
  orgId?: string;
  name?: string;
  metadata?: unknown;
  model?: JsonRecord;
  [key: string]: unknown;
};

function json(body: JsonRecord, status = 200) {
  return Response.json(body, { status, headers: RESPONSE_HEADERS });
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assistantName(businessName: string) {
  const suffix = " | Febily";
  const available = Math.max(1, 40 - suffix.length);
  return `${businessName.trim().slice(0, available).trim() || "Business"}${suffix}`;
}

function copyIfDefined(source: JsonRecord, target: JsonRecord, key: string) {
  const value = source[key];
  if (value !== undefined && value !== null) target[key] = value;
}

function stripProviderSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stripProviderSecrets);
  if (!isRecord(value)) return value;
  const safe: JsonRecord = {};
  for (const [key, child] of Object.entries(value)) {
    if (/^(credentialIds?|api[_-]?key|access[_-]?token|refresh[_-]?token|secret|password)$/i.test(key)) {
      continue;
    }
    safe[key] = stripProviderSecrets(child);
  }
  return safe;
}

function createAssistantPayload(
  template: VapiAssistant,
  business: BusinessForProvisioning,
) {
  const templateModel = isRecord(template.model) ? template.model : {};
  if (
    typeof templateModel.provider !== "string" ||
    typeof templateModel.model !== "string"
  ) {
    throw new Error("The Vapi template is missing its model provider or model name.");
  }

  // Explicit allow-list: deliberately do not copy model.tools, assistant.server,
  // phone-number bindings, tool credentials, credential IDs, or the demo prompt.
  const model: JsonRecord = {
    provider: templateModel.provider,
    model: templateModel.model,
    messages: [{ role: "system", content: buildBusinessReceptionistPrompt(business) }],
  };

  for (const key of [
    "temperature",
    "maxTokens",
    "emotionRecognitionEnabled",
    "numFastTurns",
  ]) {
    copyIfDefined(templateModel, model, key);
  }

  const safeTranscriber = stripProviderSecrets(template.transcriber);
  const safeVoice = stripProviderSecrets(template.voice);
  if (!isRecord(safeTranscriber) || !isRecord(safeVoice)) {
    throw new Error("The Vapi template must include a valid voice and transcriber configuration.");
  }

  const payload: JsonRecord = {
    name: assistantName(business.business_name),
    model,
    transcriber: safeTranscriber,
    voice: safeVoice,
    firstMessage: buildBusinessFirstMessage(business.business_name),
    firstMessageMode:
      typeof template.firstMessageMode === "string"
        ? template.firstMessageMode
        : "assistant-speaks-first",
    clientMessages: [
      "conversation-update",
      "model-output",
      "speech-update",
      "status-update",
      "transcript",
      "user-interrupted",
    ],
    serverMessages: [],
    metadata: {
      febilyBusinessId: business.id,
      febilyProvisioningVersion: 1,
      febilyTemplateAssistantId: template.id ?? null,
    },
  };

  for (const key of [
    "maxDurationSeconds",
    "backgroundSound",
    "startSpeakingPlan",
    "stopSpeakingPlan",
    "artifactPlan",
    "backgroundSpeechDenoisingPlan",
    "voicemailDetection",
    "endCallMessage",
    "endCallPhrases",
  ]) {
    copyIfDefined(template, payload, key);
  }

  return payload;
}

async function vapiRequest<T>(
  path: string,
  privateKey: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${VAPI_API_BASE}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${privateKey}`,
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    signal: AbortSignal.timeout(20000),
  });

  const text = await response.text();
  let parsed: unknown = null;
  try {
    parsed = text ? JSON.parse(text) : null;
  } catch {
    parsed = null;
  }

  if (!response.ok) {
    // Do not return upstream bodies: they can contain account details.
    throw new Error(`Vapi API request failed with status ${response.status}.`);
  }

  return parsed as T;
}

async function findExistingProvisionedAssistant(
  businessId: string,
  privateKey: string,
  orgId: string,
): Promise<VapiAssistant | null> {
  const assistants = await vapiRequest<unknown>("/assistant?limit=1000", privateKey);
  if (!Array.isArray(assistants)) {
    throw new Error("Vapi returned an unexpected assistant list response.");
  }

  const matches = assistants.filter((candidate): candidate is VapiAssistant => {
    if (!isRecord(candidate) || !isRecord(candidate.metadata)) return false;
    return (
      candidate.metadata["febilyBusinessId"] === businessId &&
      candidate.orgId === orgId &&
      typeof candidate.id === "string"
    );
  });

  if (matches.length > 1) {
    throw new Error("More than one Vapi assistant is tagged to this business; manual review is required.");
  }

  return matches[0] ?? null;
}

export const Route = createFileRoute("/api/vapi/provision")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get("authorization");
        const bearer = authorization?.match(/^Bearer\s+(\S+)$/i)?.[1];
        if (!bearer) return json({ error: "A signed-in session is required." }, 401);

        if (process.env["VAPI_PROVISIONING_ENABLED"] !== "true") {
          return json({ error: "Assistant provisioning is not enabled for this Preview yet." }, 503);
        }

        const supabaseUrl = process.env["SUPABASE_URL"];
        const supabaseSecretKey = process.env["SUPABASE_SECRET_KEY"];
        const privateKey = process.env["VAPI_PRIVATE_KEY"];
        const orgId = process.env["VAPI_ORG_ID"];
        const templateAssistantId = process.env["VAPI_TEMPLATE_ASSISTANT_ID"];

        if (!supabaseUrl || !supabaseSecretKey || !privateKey || !orgId || !templateAssistantId) {
          console.error("[vapi-provision] Required server configuration is missing");
          return json({ error: "Assistant provisioning is not fully configured." }, 503);
        }

        if (!/^[0-9a-f-]{36}$/i.test(templateAssistantId)) {
          return json({ error: "The configured Vapi template assistant ID is invalid." }, 503);
        }

        const supabase = createClient(supabaseUrl, supabaseSecretKey, {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        });

        try {
          const { data: authData, error: authError } = await supabase.auth.getUser(bearer);
          if (authError || !authData.user) {
            return json({ error: "Your sign-in session is invalid or expired." }, 401);
          }

          const userId = authData.user.id;
          const { data: businesses, error: businessError } = await supabase
            .from("businesses")
            .select(
              "id,owner_id,business_name,business_type,phone,email,address,timezone,receptionist_instructions,opening_hours,services,staff,faqs,vapi_assistant_id,vapi_provisioning_status",
            )
            .eq("owner_id", userId)
            .limit(2);

          if (businessError) throw businessError;
          if (!businesses?.length) {
            return json({ error: "Complete your business setup before provisioning." }, 403);
          }
          if (businesses.length !== 1) {
            return json({ error: "Exactly one business profile is required for assistant provisioning." }, 409);
          }

          const business = businesses[0] as BusinessForProvisioning;
          const now = new Date().toISOString();
          const { data: subscriptions, error: subscriptionError } = await supabase
            .from("subscriptions")
            .select("id")
            .eq("user_id", userId)
            .eq("business_id", business.id)
            .eq("status", "active")
            .not("paddle_subscription_id", "is", null)
            .gt("current_period_end", now)
            .limit(2);

          if (subscriptionError) throw subscriptionError;
          if (!subscriptions?.length) {
            return json({ error: "A verified, unexpired subscription linked to this business is required." }, 403);
          }
          if (subscriptions.length !== 1) {
            return json({ error: "Exactly one verified, unexpired subscription is required." }, 409);
          }

          const { data: claim, error: claimError } = await supabase.rpc(
            "claim_vapi_assistant_provisioning",
            { p_business_id: business.id, p_owner_id: userId },
          );
          if (claimError) {
            console.error("[vapi-provision] Provisioning lock failed", claimError.message);
            return json({ error: "Assistant provisioning is not ready. Apply the Vapi provisioning migration first." }, 503);
          }

          const state = isRecord(claim) ? claim["state"] : null;
          if (state === "already_provisioned") {
            return json({ success: true, provisioningStatus: "provisioned", message: "Your business already has its own receptionist." });
          }
          if (state === "in_progress") {
            return json({ success: true, provisioningStatus: "provisioning", message: "Your receptionist is already being created." }, 202);
          }
          if (state !== "claimed") {
            return json({ error: "Could not reserve assistant provisioning for this business." }, 409);
          }

          try {
            // Recover an assistant created by an earlier request whose database
            // completion was interrupted. Metadata is the idempotency marker.
            const existing = await findExistingProvisionedAssistant(business.id, privateKey, orgId);
            let assistant = existing;

            if (!assistant) {
              const template = await vapiRequest<VapiAssistant>(
                `/assistant/${encodeURIComponent(templateAssistantId)}`,
                privateKey,
              );
              if (template.orgId && template.orgId !== orgId) {
                throw new Error("The Vapi template belongs to a different organization.");
              }

              const payload = createAssistantPayload(template, business);
              assistant = await vapiRequest<VapiAssistant>("/assistant", privateKey, {
                method: "POST",
                body: JSON.stringify(payload),
              });
            }

            if (!assistant?.id) throw new Error("Vapi did not return an assistant ID.");

            const { data: completion, error: completionError } = await supabase.rpc(
              "complete_vapi_assistant_provisioning",
              {
                p_business_id: business.id,
                p_owner_id: userId,
                p_assistant_id: assistant.id,
              },
            );

            if (completionError || !isRecord(completion) || completion["accepted"] !== true) {
              console.error("[vapi-provision] Assistant created but database completion failed", completionError?.message ?? "RPC rejected completion");
              throw new Error("The assistant was created but could not be linked to the business. Retry safely or contact support.");
            }

            return json({
              success: true,
              provisioningStatus: "provisioned",
              assistantName: assistant.name ?? assistantName(business.business_name),
              message: "Your dedicated receptionist was created. Live calendar booking is not connected yet.",
            });
          } catch (error) {
            const safeError = error instanceof Error ? error.message : "Unknown provisioning error";
            await supabase
              .from("businesses")
              .update({
                vapi_provisioning_status: "failed",
                vapi_provisioning_error: safeError.slice(0, 500),
                vapi_provisioning_started_at: null,
                updated_at: new Date().toISOString(),
              })
              .eq("id", business.id)
              .eq("owner_id", userId)
              .eq("vapi_provisioning_status", "provisioning");

            throw error;
          }
        } catch (error) {
          console.error("[vapi-provision] Request failed", error instanceof Error ? error.message : "Unknown error");
          return json({
            error: error instanceof Error
              ? error.message
              : "Could not provision the business receptionist.",
          }, 500);
        }
      },
    },
  },
});
