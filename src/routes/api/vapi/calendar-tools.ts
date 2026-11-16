import { createFileRoute } from "@tanstack/react-router";
import { createServerSupabase } from "@/lib/google-calendar-server";
import {
  authorizeCalendarToolRequest,
  dispatchCalendarTool,
  fetchVapiAssistant,
  getCalendarBusiness,
} from "@/lib/vapi-calendar-tools";

type ToolCall = {
  id?: unknown;
  name?: unknown;
  arguments?: unknown;
  function?: {
    name?: unknown;
    arguments?: unknown;
  };
};

type JsonRecord = Record<string, unknown>;

function json(body: JsonRecord, status = 200) {
  return Response.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

function parseArguments(value: unknown) {
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as unknown;
    } catch {
      return null;
    }
  }
  return value;
}

export const Route = createFileRoute("/api/vapi/calendar-tools")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (process.env["VAPI_CALENDAR_TOOLS_ENABLED"] !== "true") {
          return json({ error: "Calendar tools are not enabled for this environment." }, 503);
        }

        if (!authorizeCalendarToolRequest(request)) {
          return json({ error: "Unauthorized calendar tool request." }, 401);
        }

        const orgId = process.env["VAPI_ORG_ID"];
        if (!orgId) return json({ error: "Calendar tool server configuration is incomplete." }, 503);

        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          return json({ error: "Invalid Vapi tool request." }, 400);
        }

        if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
          return json({ error: "Invalid Vapi tool request." }, 400);
        }

        const root = payload as JsonRecord;
        const message = root["message"];
        if (!message || typeof message !== "object" || Array.isArray(message)) {
          return json({ error: "Missing Vapi tool message." }, 400);
        }

        const messageRecord = message as JsonRecord;
        if (messageRecord["type"] !== "tool-calls" || !Array.isArray(messageRecord["toolCallList"])) {
          return json({ error: "Unsupported Vapi webhook message." }, 400);
        }

        const call = messageRecord["call"];
        if (!call || typeof call !== "object" || Array.isArray(call)) {
          return json({ error: "Missing Vapi call context." }, 400);
        }

        const callRecord = call as JsonRecord;
        const assistantId = typeof callRecord["assistantId"] === "string"
          ? callRecord["assistantId"]
          : null;
        const callOrgId = typeof callRecord["orgId"] === "string"
          ? callRecord["orgId"]
          : null;
        const callId = typeof callRecord["id"] === "string"
          ? callRecord["id"]
          : null;

        if (!assistantId || !callId || callOrgId !== orgId) {
          return json({ error: "Vapi call identity could not be verified." }, 403);
        }

        try {
          // Verify that this assistant still belongs to the configured Vapi
          // organization and carries a Febily business ownership marker.
          const { businessId } = await fetchVapiAssistant(assistantId);
          const supabase = createServerSupabase();
          const business = await getCalendarBusiness(supabase, businessId, assistantId);

          const calls = messageRecord["toolCallList"] as ToolCall[];
          if (calls.length < 1 || calls.length > 5) {
            return json({ error: "Invalid number of tool calls." }, 400);
          }

          const results: Array<{ toolCallId: string; result?: string; error?: string }> = [];
          for (const toolCall of calls) {
            const toolCallId = typeof toolCall.id === "string" ? toolCall.id : "";
            // Current Vapi ServerMessageToolCalls uses function.name and
            // function.arguments. Accept the older flattened variant too so
            // deployments during the schema transition remain compatible.
            const toolFunction = toolCall.function;
            const name = typeof toolFunction?.name === "string"
              ? toolFunction.name
              : typeof toolCall.name === "string"
                ? toolCall.name
                : "";
            const rawArguments = toolFunction?.arguments ?? toolCall.arguments;
            if (!toolCallId || !name) {
              results.push({
                toolCallId: toolCallId || "unknown",
                error: "The tool call identifier or function name was missing.",
              });
              continue;
            }

            const outcome = await dispatchCalendarTool(
              supabase,
              business,
              {
                id: toolCallId,
                name,
                arguments: parseArguments(rawArguments),
              },
              callId,
            );

            if (!outcome.ok) {
              results.push({ toolCallId, error: outcome.message });
            } else {
              results.push({
                toolCallId,
                result: JSON.stringify({
                  message: outcome.message,
                  ...(outcome.data ? { data: outcome.data } : {}),
                }),
              });
            }
          }

          return json({ results });
        } catch (error) {
          console.error(
            "[vapi-calendar-tools] Tool request failed",
            error instanceof Error ? error.message : "Unknown error",
          );
          return json({
            results: (messageRecord["toolCallList"] as ToolCall[]).map((toolCall) => ({
              toolCallId: typeof toolCall.id === "string" ? toolCall.id : "unknown",
              error: "Febily could not safely complete this calendar request. Do not claim an appointment was booked.",
            })),
          });
        }
      },
    },
  },
});
