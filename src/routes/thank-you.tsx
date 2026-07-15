import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/thank-you")({
  head: () => ({
    meta: [
      { title: "Thank You — Febily" },
      {
        name: "description",
        content:
          "Thanks for your order. Our team will contact you within 24 hours to set up your AI receptionist.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ThankYouPage,
});

function ThankYouPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#030306] text-white selection:bg-white/90 selection:text-black">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.1),transparent),radial-gradient(ellipse_60%_50%_at_50%_120%,rgba(52,211,153,0.08),transparent)]" />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-5 py-20 text-center sm:px-6">
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-emerald-400/30 bg-emerald-400/[0.08] shadow-[0_0_0_1px_rgba(52,211,153,0.15)_inset,0_20px_80px_-16px_rgba(52,211,153,0.35)]">
          <div className="absolute inset-0 animate-pulse rounded-full bg-emerald-400/10 blur-xl" />
          <CheckCircle2 className="relative h-12 w-12 text-emerald-300" />
        </div>

        <h1 className="mt-10 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          Thank You!
        </h1>

        <p className="mt-5 max-w-xl text-[15px] leading-[1.7] text-white/65 sm:text-base sm:leading-7">
          We've received your order.
          <br />
          Our team will contact you within 24 hours to set up your AI
          receptionist.
        </p>

        <div className="mt-10 grid w-full max-w-md gap-2.5 text-left text-sm text-white/75">
          {[
            "Confirmation email on its way",
            "Onboarding call within 24 hours",
            "Live in under 24 hours after setup",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur-xl"
            >
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300/90" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <Link
          to="/"
          className="mt-10 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black shadow-[0_2px_24px_-4px_rgba(255,255,255,0.3)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_4px_32px_-4px_rgba(255,255,255,0.4)]"
        >
          Back to Home <ArrowRight className="h-4 w-4" />
        </Link>

        <p className="mt-8 text-xs text-white/40">
          Questions? Email{" "}
          <a
            href="mailto:support@febily.com"
            className="text-white/70 underline-offset-4 hover:underline"
          >
            support@febily.com
          </a>
        </p>
      </main>
    </div>
  );
}
