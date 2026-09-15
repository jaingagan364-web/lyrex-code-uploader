import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";

export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030306] text-white selection:bg-white/90 selection:text-black">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.08),transparent),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(59,130,246,0.05),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.015)_0%,transparent_40%,transparent_100%)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030306]/70 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_32px_-8px_rgba(0,0,0,0.6)] backdrop-blur-2xl backdrop-saturate-150 max-md:bg-[#030306]/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <span className="flex items-center rounded-full bg-white/[0.97] px-3.5 py-1.5 ring-1 ring-white/20 sm:px-4 sm:py-2">
              <img
                src="/febily-logo.png"
                alt="Febily"
                width="112"
                height="35"
                className="h-6 w-auto sm:h-7"
                draggable={false}
              />
            </span>
            <span className="hidden text-xs text-white/45 sm:block">AI Receptionists</span>
          </Link>
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2 text-sm font-medium text-white/85 transition hover:border-white/25 hover:bg-white/[0.08]"
          >
            <ArrowLeft className="h-4 w-4" /> Back to home
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium tracking-[0.24em] text-white/70 uppercase backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-white" />
          Legal
        </div>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-3 text-sm text-white/45">Last updated: {updated}</p>

        <div className="mt-10 rounded-3xl border border-white/[0.08] bg-white/[0.03] p-6 shadow-[0_20px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-9">
          <div className="prose prose-invert max-w-none space-y-6 leading-7 text-white/75 [&_h2]:mt-10 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_p]:text-white/70 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6 [&_a]:text-white [&_a]:underline-offset-4 hover:[&_a]:underline">
            {children}
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] bg-black/40">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-white/45 sm:flex-row">
            <div>© 2026 Febily. All Rights Reserved.</div>
            <div className="flex gap-5">
              <Link to="/privacy" className="hover:text-white">Privacy</Link>
              <Link to="/terms" className="hover:text-white">Terms</Link>
              <Link to="/refund" className="hover:text-white">Refund</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
