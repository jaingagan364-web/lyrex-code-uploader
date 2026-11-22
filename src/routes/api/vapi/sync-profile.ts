import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";
import {
  buildBusinessFirstMessage,
  buildBusinessReceptionistPrompt,
} from "@/lib/vapi-assistant-prompt";
import { getBusinessCalendarAccess } from "@/lib/google-calendar-server";
import {
  buildCalendarFunctionDefinitions,
  buildCalendarFunctionTools,
} from "@/lib/vapi-calendar-tools";

const RESPONSE_HEADERS = { "cache-control": "no-store" };
const VAPI_API_BASE = "https://api.vapi.ai";

type JsonRecord = Record<string, unknown>;

type BusinessProfile = {
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

function json(body: JsonRecord, status = 200) {
  return Response.json(body, { status, headers: RESPONSE_HEADERS });
}

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

  const raw = await response.text();
  let body: unknown = null;
  try {
    body = raw ? JSON.parse(raw) : null;
  } catch {
    body = null;
  }

  if (!response.ok) {
    throw new Error(`Vapi assistant update failed with status ${response.status}.`);
  }

  return body as T;
}

export const Route = createFileRoute("/api/vapi/sync-profile")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const bearer = request.headers
          .get("authorization")
          ?.match(/^Bearer\s+(\S+)$/i)?.[1];
        if (!bearer) return json({ error: "A signed-in session is required." }, 401);

        if (process.env["VAPI_PROVISIONING_ENABLED"] !== "true") {
          return json({ error: "Receptionist profile sync is not enabled for this Preview." }, 503);
        }

        const supabaseUrl = process.env["SUPABASE_URL"];
        const supabaseSecretKey = process.env["SUPABASE_SECRET_KEY"];
        const privateKey = process.env["VAPI_PRIVATE_KEY"];
        const orgId = process.env["VAPI_ORG_ID"];
        if (!supabaseUrl || !supabaseSecretKey || !privateKey || !orgId) {
          console.error("[vapi-sync-profile] Server configuration is incomplete.");
          return json({ error: "Receptionist profile sync is temporarily unavailable." }, 503);
        }

        try {
          const supabase = createClient(supabaseUrl, supabaseSecretKey, {
            auth: {
              persistSession: false,
              autoRefreshToken: false,
              detectSessionInUrl: false,
            },
          });

          const { data: authData, error: authError } = await supabase.auth.getUser(bearer);
          if (authError || !authData.user) {
            return json({ error: "Your sign-in session is invalid or expired." }, 401);
          }

          const userId = authData.user.id;
          const { data: businesses, error: businessError } = await supabase
            .from("businesses")
            .select("id,owner_id,business_name,business_type,phone,email,address,timezone,receptionist_instructions,opening_hours,services,staff,faqs,vapi_assistant_id,vapi_provisioning_status")
            .eq("owner_id", userId)
            .limit(2);

          if (businessError) throw businessError;
          if (!businesses?.length) {
            return json({ error: "Complete business setup before syncing the receptionist." }, 403);
          }
          if (businesses.length !== 1) {
            return json({ error: "Exactly one business profile is required." }, 409);
          }

          const business = businesses[0] as BusinessProfile;
          if (
            business.vapi_provisioning_status !== "provisioned" ||
            typeof business.vapi_assistant_id !== "string" ||
            !business.vapi_assistant_id.trim()
          ) {
            return json({ error: "This business does not have a provisioned receptionist yet." }, 409);
          }

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
          if (subscriptions?.length !== 1) {
            return json({ error: "Exactly one verified, unexpired subscription linked to this business is required." }, 403);
          }

          const assistant = await vapiRequest<JsonRecord>(
            `/assistant/${encodeURIComponent(business.vapi_assistant_id)}`,
            privateKey,
          );

          const metadata = isRecord(assistant.metadata) ? assistant.metadata : {};
          if (
            assistant.id !== business.vapi_assistant_id ||
            assistant.orgId !== orgId ||
            metadata["febilyBusinessId"] !== business.id
          ) {
            console.error("[vapi-sync-profile] Assistant ownership metadata did not match the signed-in business.");
            return json({ error: "The receptionist ownership check failed. Contact support before updating it." }, 409);
          }

          const model = isRecord(assistant.model) ? assistant.model : null;
          if (!model || typeof model.provider !== "string" || typeof model.model !== "string") {
            return json({ error: "The existing receptionist has an invalid model configuration." }, 409);
          }

          const modelTools = Array.isArray(model.tools) ? model.tools : [];
          const febilyCalendarToolNames = new Set([
            "calendar_availability",
            "calendar_slots",
            "calendar_set_appointment",
          ]);

          let updatedTools: JsonRecord[];
          let attachedCalendarTools = false;

          if (modelTools.length === 0) {
            // A business assistant may have been provisioned before the
            // calendar webhook credential and Google Calendar connection
            // were ready. In that case, Sync is responsible for attaching
            // the three Febily tools for the first time.
            const configuredTools = buildCalendarFunctionTools();
            if (!configuredTools?.length) {
              return json({
                error: "Calendar tools are not configured on this Preview. Configure the Vapi calendar webhook credential and Preview server settings, then redeploy before syncing again.",
              }, 503);
            }

            try {
              // Fail closed: never attach live booking tools until this
              // business's own encrypted Google Calendar connection works.
              await getBusinessCalendarAccess(supabase, business.id);
            } catch {
              return json({
                error: "This business's Google Calendar connection is not ready. Reconnect and select its calendar in Business Setup before syncing.",
              }, 409);
            }

            updatedTools = configuredTools;
            attachedCalendarTools = true;
          } else {
            const existingToolNames = modelTools.map((tool) => {
              if (!isRecord(tool) || !isRecord(tool.function)) return "";
              return typeof tool.function.name === "string" ? tool.function.name : "";
            });
            const hasOnlyFebilyCalendarTools =
              modelTools.length === 3 &&
              existingToolNames.every((name) => febilyCalendarToolNames.has(name)) &&
              febilyCalendarToolNames.size === new Set(existingToolNames).size;
            if (!hasOnlyFebilyCalendarTools) {
              return json({
                error: "The assistant has tools that Febily cannot safely modify. No assistant settings were changed.",
              }, 409);
            }

            // Refresh only the three known Febily function schemas. Keep
            // each existing server URL, credentialId, and tool ID intact.
            const latestDefinitions = buildCalendarFunctionDefinitions();
            const latestFunctions = new Map<string, JsonRecord>();
            for (const definition of latestDefinitions) {
              const definitionFunction = isRecord(definition["function"])
                ? definition["function"]
                : null;
              const definitionName = typeof definitionFunction?.["name"] === "string"
                ? definitionFunction["name"]
                : "";
              if (definitionName && definitionFunction) {
                latestFunctions.set(definitionName, definitionFunction);
              }
            }

            updatedTools = modelTools.map((tool) => {
              if (!isRecord(tool) || !isRecord(tool["function"])) {
                throw new Error("An existing calendar tool has an invalid function schema. No assistant settings were changed.");
              }
              const existingFunction = tool["function"];
              const functionName = typeof existingFunction["name"] === "string"
                ? existingFunction["name"]
                : "";
              const latestFunction = latestFunctions.get(functionName);
              if (!latestFunction) {
                throw new Error("An existing calendar tool could not be matched to the current Febily schema. No assistant settings were changed.");
              }
              return {
                ...tool,
                function: {
                  ...existingFunction,
                  description: latestFunction["description"],
                  parameters: latestFunction["parameters"],
                },
              };
            });
          }

          const updatedModel: JsonRecord = {
            ...model,
            messages: [
              {
                role: "system",
                content: buildBusinessReceptionistPrompt(business, true),
              },
            ],
            tools: updatedTools,
          };

          const currentServerMessages = Array.isArray(assistant.serverMessages)
            ? assistant.serverMessages.filter((item): item is string => typeof item === "string")
            : [];
          const currentClientMessages = Array.isArray(assistant.clientMessages)
            ? assistant.clientMessages.filter((item): item is string => typeof item === "string")
            : [];

          const updated = await vapiRequest<JsonRecord>(
            `/assistant/${encodeURIComponent(business.vapi_assistant_id)}`,
            privateKey,
            {
              method: "PATCH",
              body: JSON.stringify({
                model: updatedModel,
                firstMessage: buildBusinessFirstMessage(business.business_name),
                // Vapi requires these message subscriptions for server-based
                // Function tools to reach tool.server.url and for the Web SDK
                // to receive the associated tool-calls client message.
                serverMessages: [...new Set([...currentServerMessages, "tool-calls"])],
                clientMessages: [...new Set([...currentClientMessages, "tool-calls"])],
              }),
            },
          );

          if (updated.id !== business.vapi_assistant_id) {
            throw new Error("Vapi did not confirm the expected assistant update.");
          }

          return json({
            success: true,
            message: attachedCalendarTools
              ? "Your receptionist profile is synchronized and the three Febily Google Calendar tools are now attached to this business assistant."
              : "Your receptionist profile and existing Febily booking tool schemas are synchronized. Existing calendar connections and credentials were preserved.",
          });
        } catch (error) {
          console.error(
            "[vapi-sync-profile] Request failed",
            error instanceof Error ? error.message : "Unknown error",
          );
          return json({
            error: error instanceof Error
              ? error.message
              : "Could not update the receptionist profile.",
          }, 500);
        }
      },
    },
  },
});
