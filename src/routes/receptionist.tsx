import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import type VapiClient from "@vapi-ai/web";
import { supabase } from "@/lib/supabase";

type Phase =
  | "checking"
  | "signed-out"
  | "idle"
  | "loading"
  | "provisioning"
  | "connecting"
  | "in-call"
  | "ending"
  | "error";

type TokenResponse = {
  token?: string;
  assistantId?: string;
  error?: string;
  databaseProjectRef?: string | null;
  subscriptionDiagnostics?: Array<{
    paddleSubscriptionSuffix: string | null;
    currentPeriodEnd: string | null;
    businessLinkMatches: boolean;
  }>;
  provisioningStatus?: string;
};

type ProvisionResponse = {
  success?: boolean;
  provisioningStatus?: string;
  message?: string;
  error?: string;
};

type SyncProfileResponse = {
  success?: boolean;
  message?: string;
  error?: string;
};

type TranscriptLine = {
  id: number;
  role: "user" | "assistant";
  text: string;
};

export const Route = createFileRoute("/receptionist")({
  component: ReceptionistPage,
});

function ReceptionistPage() {
  const [phase, setPhase] = useState<Phase>("checking");
  const [message, setMessage] = useState("");
  const [muted, setMuted] = useState(false);
  const [canProvision, setCanProvision] = useState(false);
  const [canSyncProfile, setCanSyncProfile] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const vapiRef = useRef<VapiClient | null>(null);
  const isMountedRef = useRef(true);
  const transcriptIdRef = useRef(0);
  const callStartFailureRef = useRef<string | null>(null);

  useEffect(() => {
    isMountedRef.current = true;
    let cancelled = false;

    void supabase.auth.getUser().then(({ data, error }) => {
      if (cancelled) return;
      setPhase(error || !data.user ? "signed-out" : "idle");
    });

    return () => {
      cancelled = true;
      isMountedRef.current = false;
      const client = vapiRef.current;
      vapiRef.current = null;
      if (client) {
        client.removeAllListeners();
        void client.stop();
      }
    };
  }, []);

  async function startCall() {
    if (phase === "loading" || phase === "connecting" || phase === "in-call") {
      return;
    }

    setPhase("loading");
    setMessage("");
    setTranscript([]);
    setMuted(false);

    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !sessionData.session?.access_token) {
        if (isMountedRef.current) setPhase("signed-out");
        return;
      }

      const response = await fetch("/api/vapi/token", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: "{}",
      });

      const result = (await response.json().catch(() => ({}))) as TokenResponse;
      if (!response.ok) {
        if (
          result.provisioningStatus === "pending" ||
          result.provisioningStatus === "failed"
        ) {
          setCanProvision(true);
        }
        const subscriptionDetails = result.subscriptionDiagnostics?.map((item, index) => {
          const suffix = item.paddleSubscriptionSuffix
            ? `Paddle ID ending ${item.paddleSubscriptionSuffix}`
            : "No Paddle subscription ID";
          const expiry = item.currentPeriodEnd
            ? `expires ${item.currentPeriodEnd}`
            : "no period-end date";
          const link = item.businessLinkMatches
            ? "linked to this business"
            : "business link mismatch";
          return `Record ${index + 1}: ${suffix}, ${expiry}, ${link}.`;
        }) ?? [];
        const databaseDetails = result.databaseProjectRef
          ? [`Preview server Supabase project: ${result.databaseProjectRef}`]
          : [];
        throw new Error(
          [result.error || "Your receptionist is not ready to launch yet.", ...databaseDetails, ...subscriptionDetails].join(" | "),
        );
      }
      if (!result.token || !result.assistantId) {
        throw new Error("The secure voice session response was incomplete.");
      }
      setCanSyncProfile(true);

      // Load the SDK only after an authenticated user explicitly starts a call.
      // The browser receives a short-lived, assistant-restricted public JWT,
      // never the private Vapi API key.
      const { default: Vapi } = await import("@vapi-ai/web");
      if (!isMountedRef.current) return;

      const client = new Vapi(result.token);
      vapiRef.current = client;
      callStartFailureRef.current = null;

      client.on("call-start-failed", (event) => {
        const stage =
          typeof event?.stage === "string" ? event.stage : "call setup";
        const reason =
          typeof event?.error === "string" && event.error.trim()
            ? event.error.trim().slice(0, 240)
            : "Vapi could not complete the browser call setup.";
        callStartFailureRef.current = `Vapi failed during ${stage}: ${reason}`;
      });

      client.on("call-start", () => {
        if (!isMountedRef.current) return;
        setPhase("in-call");
        setMessage("Connected. You can speak with your Febily receptionist.");
      });

      client.on("call-end", () => {
        if (!isMountedRef.current) return;
        client.removeAllListeners();
        if (vapiRef.current === client) vapiRef.current = null;
        setPhase("idle");
        setMuted(false);
        setCanSyncProfile(true);
        setMessage("The voice session has ended.");
      });

      client.on("message", (event) => {
        if (!isMountedRef.current || event?.type !== "transcript") return;
        if (event.transcriptType && event.transcriptType !== "final") return;
        if (
          (event.role !== "user" && event.role !== "assistant") ||
          typeof event.transcript !== "string" ||
          !event.transcript.trim()
        ) {
          return;
        }
        transcriptIdRef.current += 1;
        setTranscript((current) =>
          [
            ...current,
            {
              id: transcriptIdRef.current,
              role: event.role,
              text: event.transcript.trim(),
            },
          ].slice(-24),
        );
      });

      client.on("error", () => {
        // Tear down a failed call so a retry cannot leave a hidden microphone
        // session running behind the next attempt.
        client.removeAllListeners();
        if (vapiRef.current === client) vapiRef.current = null;
        void client.stop();
        if (!isMountedRef.current) return;
        setMuted(false);
        setPhase("error");
        setMessage("The voice connection failed and was stopped. You can safely try again.");
      });

      setPhase("connecting");
      const call = await client.start(result.assistantId);
      if (!call && isMountedRef.current) {
        throw new Error(
          callStartFailureRef.current ||
            "Vapi could not create a browser voice session. Check the Preview origin allowlist and Vapi call-start logs.",
        );
      }
    } catch (error) {
      const client = vapiRef.current;
      vapiRef.current = null;
      if (client) {
        client.removeAllListeners();
        void client.stop();
      }
      if (!isMountedRef.current) return;
      setPhase("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not start the voice session. Please try again.",
      );
    }
  }

  async function createReceptionist() {
    if (phase === "provisioning") return;

    setPhase("provisioning");
    setMessage("Creating your business-specific receptionist...");
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        setPhase("signed-out");
        return;
      }

      const response = await fetch("/api/vapi/provision", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: "{}",
      });
      const result = (await response.json().catch(() => ({}))) as ProvisionResponse;
      if (!response.ok) {
        throw new Error(result.error || "Could not create your receptionist.");
      }

      setCanProvision(false);
      setCanSyncProfile(true);
      setPhase("idle");
      setMessage(
        result.message ||
          "Your dedicated receptionist has been created. Live calendar booking is not connected yet.",
      );
    } catch (error) {
      setPhase("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not create your receptionist. Please try again.",
      );
      setCanProvision(true);
    }
  }

  async function syncReceptionistProfile() {
    if (phase === "in-call" || phase === "connecting" || phase === "ending") {
      return;
    }

    setPhase("loading");
    setMessage("Updating your receptionist with the latest saved business details...");
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();
      if (sessionError || !sessionData.session?.access_token) {
        setPhase("signed-out");
        return;
      }

      const response = await fetch("/api/vapi/sync-profile", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${sessionData.session.access_token}`,
        },
        body: "{}",
      });
      const result = (await response.json().catch(() => ({}))) as SyncProfileResponse;
      if (!response.ok) {
        throw new Error(result.error || "Could not sync the receptionist profile.");
      }

      setPhase("idle");
      setMessage(
        result.message ||
          "The existing receptionist was updated with the saved business profile.",
      );
    } catch (error) {
      setPhase("error");
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not sync the receptionist profile. Please try again.",
      );
    }
  }

  function endCall() {
    const client = vapiRef.current;
    if (!client) {
      setPhase("idle");
      return;
    }
    setPhase("ending");
    setMessage("Ending the voice session...");
    void client.stop();
  }

  function toggleMute() {
    const client = vapiRef.current;
    if (!client || phase !== "in-call") return;
    const nextMuted = !client.isMuted();
    client.setMuted(nextMuted);
    setMuted(nextMuted);
  }

  const isBusy =
    phase === "checking" ||
    phase === "loading" ||
    phase === "provisioning" ||
    phase === "connecting";
  const isInCall = phase === "in-call" || phase === "ending";

  return (
    <main className="min-h-screen bg-[#050509] px-5 py-12 text-white">
      <section className="mx-auto w-full max-w-3xl">
        <a href="/" className="text-sm text-white/60 hover:text-white">
          ← Back to Febily
        </a>

        <div className="mt-8 rounded-3xl border border-white/10 bg-white/[0.035] p-6 shadow-2xl sm:p-9">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-300">
                Febily receptionist
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                Your AI receptionist
              </h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-white/60">
                Start a private browser voice session with the assistant assigned
                to your business.
              </p>
            </div>
            <span
              className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70"
              aria-live="polite"
            >
              {phase === "in-call"
                ? "Connected"
                : phase === "connecting"
                  ? "Connecting"
                  : phase === "loading"
                    ? "Checking access"
                    : phase === "ending"
                      ? "Ending"
                      : phase === "signed-out"
                        ? "Sign in required"
                        : phase === "error"
                          ? "Needs attention"
                          : phase === "checking"
                            ? "Checking session"
                            : "Ready when activated"}
            </span>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {isInCall ? (
              <>
                <button
                  type="button"
                  onClick={toggleMute}
                  disabled={phase === "ending"}
                  className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:opacity-50"
                >
                  {muted ? "Unmute microphone" : "Mute microphone"}
                </button>
                <button
                  type="button"
                  onClick={endCall}
                  disabled={phase === "ending"}
                  className="rounded-xl bg-rose-500 px-5 py-3 text-sm font-semibold text-white hover:bg-rose-400 disabled:opacity-50"
                >
                  End session
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={startCall}
                disabled={isBusy || phase === "signed-out"}
                className="rounded-xl bg-emerald-400 px-5 py-3 text-sm font-semibold text-black hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {phase === "checking"
                  ? "Checking sign-in..."
                  : phase === "loading"
                    ? "Checking access..."
                    : phase === "connecting"
                      ? "Connecting..."
                      : phase === "provisioning"
                        ? "Creating receptionist..."
                        : "Start voice session"}
              </button>
            )}
            {canProvision && phase !== "signed-out" && !isInCall && (
              <button
                type="button"
                onClick={createReceptionist}
                disabled={isBusy}
                className="rounded-xl border border-emerald-300/40 px-5 py-3 text-sm font-semibold text-emerald-200 hover:bg-emerald-300/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {phase === "provisioning"
                  ? "Creating receptionist..."
                  : "Create my receptionist"}
              </button>
            )}
            {canSyncProfile && phase !== "signed-out" && !isInCall && (
              <button
                type="button"
                onClick={syncReceptionistProfile}
                disabled={isBusy}
                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {phase === "loading"
                  ? "Updating profile..."
                  : "Sync saved business details"}
              </button>
            )}
            {phase === "signed-out" && (
              <a
                href="/account"
                className="rounded-xl border border-white/15 px-5 py-3 text-sm font-semibold text-white hover:bg-white/10"
              >
                Sign in to Febily
              </a>
            )}
          </div>

          {message && (
            <p
              className="mt-5 rounded-xl border border-white/10 bg-black/25 p-4 text-sm leading-6 text-white/80"
              role="status"
              aria-live="polite"
            >
              {message}
            </p>
          )}

          <div className="mt-8 rounded-2xl border border-white/10 bg-black/25 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold">Conversation transcript</h2>
              <span className="text-xs text-white/40">
                Visible only during this browser session
              </span>
            </div>
            {transcript.length === 0 ? (
              <p className="mt-4 text-sm text-white/45">
                Your conversation will appear here after the receptionist starts
                speaking.
              </p>
            ) : (
              <ol className="mt-4 space-y-3" aria-live="polite">
                {transcript.map((line) => (
                  <li key={line.id} className="text-sm leading-6">
                    <span className="mr-2 font-semibold text-emerald-300">
                      {line.role === "assistant" ? "Febily" : "You"}
                    </span>
                    <span className="text-white/80">{line.text}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="mt-6 space-y-2 text-xs leading-5 text-white/45">
            <p>
              Access is checked by Febily's server on every launch. The browser
              receives only a short-lived token restricted to the assistant
              assigned to your business.
            </p>
            <p>
              This is the website voice-session layer. Phone-number activation,
              per-business calendar connections, and assistant provisioning
              must be completed before customer production use.
            </p>
          </div>
        </div>

        <p className="mt-5 text-center text-sm text-white/50">
          Need to finish your business profile?{" "}
          <a href="/setup" className="text-white underline underline-offset-4">
            Open business setup
          </a>
        </p>
      </section>
    </main>
  );
}
