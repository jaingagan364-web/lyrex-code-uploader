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

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function toolErrorResponse(toolCalls: unknown, message: string) {
  const calls = Array.isArray(toolCalls) ? toolCalls.slice(0, 5) : [];
  return json({
    results: calls.map((call) => ({
      toolCallId: isRecord(call) && typeof call.id === "string" ? call.id : "unknown",
      error: message,
    })),
  });
}

export const Route = createFileRoute("/api/vapi/calendar-tools")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let payload: unknown;
        try {
          payload = await request.json();
        } catch {
          // Function-tool webhooks must receive HTTP 200 with a matching error
          // result; a non-2xx response is treated as a failed webhook delivery.
          return json({ results: [] });
        }

        if (!isRecord(payload)) return json({ results: [] });

        const root = payload;
        const message = root["message"];
        const messageRecord = isRecord(message) ? message : null;
        const calls = messageRecord?.["toolCallList"];

        if (!authorizeCalendarToolRequest(request)) {
          return toolErrorResponse(calls, "Unauthorized calendar tool request.");
        }

        if (process.env["VAPI_CALENDAR_TOOLS_ENABLED"] !== "true") {
          return toolErrorResponse(calls, "Calendar tools are not enabled for this environment.");
        }

        const orgId = process.env["VAPI_ORG_ID"];
        if (!orgId) {
          return toolErrorResponse(calls, "Calendar tool server configuration is incomplete.");
        }

        if (!messageRecord) {
          return json({ results: [] });
        }

        if (messageRecord["type"] !== "tool-calls" || !Array.isArray(calls)) {
          return toolErrorResponse(calls, "Unsupported Vapi tool message.");
        }

        const call = messageRecord["call"];
        if (!isRecord(call)) {
          return toolErrorResponse(calls, "Missing Vapi call context.");
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
          return toolErrorResponse(calls, "Vapi call identity could not be verified.");
        }

        try {
          // Verify that this assistant still belongs to the configured Vapi
          // organization and carries a Febily business ownership marker.
          const { businessId } = await fetchVapiAssistant(assistantId);
          const supabase = createServerSupabase();
          const business = await getCalendarBusiness(supabase, businessId, assistantId);

          const toolCalls = calls as ToolCall[];
          if (toolCalls.length < 1 || toolCalls.length > 5) {
            return toolErrorResponse(calls, "Invalid number of tool calls.");
          }

          const results: Array<{ toolCallId: string; result?: string; error?: string }> = [];
          for (const toolCall of toolCalls) {
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
            results: (calls as ToolCall[]).map((toolCall) => ({
              toolCallId: typeof toolCall.id === "string" ? toolCall.id : "unknown",
              error: "Febily could not safely complete this calendar request. Do not claim an appointment was booked.",
            })),
          });
        }
      },
    },
  },
});
