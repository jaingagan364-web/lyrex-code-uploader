import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Mic,
  PhoneCall,
  
  ShieldCheck,
  Bot,
  MessageSquareMore,
  LayoutGrid,
  Headphones,
  ChevronRight,
  Zap,
  Lock,
  MapPin,
} from "lucide-react";
import FebilyAudioPlayer from "@/components/FebilyAudioPlayer";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.7, ease: "easeOut" as const },
};

const features = [
  {
    icon: PhoneCall,
    title: "24/7 Call Answering",
    description: "Every call answered instantly — nights, weekends, and during your busiest hours.",
  },
  {
    icon: CalendarDays,
    title: "Automatic Booking",
    description: "Febily schedules, reschedules, and confirms appointments without lifting a finger.",
  },
  {
    icon: LayoutGrid,
    title: "Google Calendar Sync",
    description: "Live two-way sync. Double-bookings become a thing of the past.",
  },
  {
    icon: Mic,
    title: "Natural Conversations",
    description: "Customers hear a friendly, professional voice — not a robotic menu.",
  },
  {
    icon: MessageSquareMore,
    title: "Answers Customer Questions",
    description: "Hours, pricing, directions, services — handled instantly and accurately.",
  },
  {
    icon: Bot,
    title: "Trained On Your Shop",
    description: "Knows your services, stylists, prices, and policies from day one.",
  },
];

const steps = [
  { title: "Customer Calls", description: "Your existing number rings — no new hardware." },
  { title: "AI Answers Instantly", description: "Picked up in under a second with a friendly greeting." },
  { title: "AI Checks Availability", description: "Pulls live openings from your Google Calendar." },
  { title: "Appointment Booked", description: "Customer is confirmed on the call." },
  { title: "Syncs To Your Calendar", description: "Booking appears in your calendar instantly." },
];

const pricing = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "For solo barbers and small salons ready to stop missing calls.",
    features: [
      "AI Receptionist (business hours)",
      "Automatic Appointment Booking",
      "Google Calendar Integration",
      "Up to 150 AI minutes per month",
      "Email Support",
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$79",
    period: "/month",
    description: "Full 24/7 coverage with the capacity most shops need to never miss a booking again.",
    features: [
      "Everything in Starter",
      "24/7 Call Handling",
      "Up to 600 AI minutes per month",
      "Custom Services, Prices & Stylists",
      "SMS Booking Confirmations",
      "Priority Support",
    ],
    cta: "Get Started",
    highlight: true,
    badge: "Best Value",
  },
  {
    name: "Premium",
    price: "$149",
    period: "/month",
    description: "For multi-chair shops and multi-location brands.",
    features: [
      "Everything in Growth",
      "Up to 1200 AI minutes per month",
      "Multi-Location Support",
      "Fully Custom AI Voice & Script",
      "Dedicated Onboarding Specialist",
      "Priority Feature Requests",
    ],
    cta: "Get Started",
    highlight: false,
  },
];

const faqs = [
  {
    q: "Does the AI really answer calls 24/7?",
    a: "Yes. Febily picks up every call instantly, day or night, including weekends and holidays.",
  },
  {
    q: "Will it book directly into my calendar?",
    a: "Yes. Febily integrates with Google Calendar and books appointments based on your real-time availability.",
  },
  {
    q: "Is this built for US salons and barber shops?",
    a: "Yes. Febily is designed specifically for US-based salons and barber shops with US phone numbers and English-speaking AI.",
  },
  {
    q: "How long does setup take?",
    a: "Most shops go live in under 24 hours. We handle everything — training the AI and forwarding your number.",
  },
  {
    q: "What if the AI can't answer something?",
    a: "Febily takes a message and forwards it to you by email or SMS — so you never lose the lead.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Month-to-month pricing with no long-term contracts. Cancel in one click.",
  },
];

const heroTrust = [
  "Live in under 24 hours",
  "Google Calendar Sync",
  "No Contracts",
  "Human-like AI Receptionist",
  "No new hardware required",
];

const chatScript: { role: "ai" | "customer"; text: string }[] = [
  { role: "customer", text: "Hi, I'd like a haircut tomorrow afternoon." },
  { role: "ai", text: "I have 3:30 PM with Marcus. Would that work?" },
  { role: "customer", text: "Perfect." },
];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-xs font-medium tracking-[0.24em] text-white/75 uppercase shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_8px_32px_-8px_rgba(0,0,0,0.5)] backdrop-blur-xl max-md:px-3.5 max-md:py-1.5 max-md:text-[10px] max-md:tracking-[0.2em]">
    <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-br from-blue-400 to-violet-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]" />
    {children}
  </div>
);

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.07] via-white/[0.03] to-white/[0.01] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_32px_100px_-20px_rgba(0,0,0,0.75),0_0_80px_-30px_rgba(99,102,241,0.08)] backdrop-blur-2xl max-md:rounded-2xl max-md:border-white/[0.1] max-md:from-white/[0.06] max-md:via-white/[0.025] max-md:shadow-[0_0_0_1px_rgba(255,255,255,0.05)_inset,0_20px_60px_-16px_rgba(0,0,0,0.8)] ${className}`}
    >
      {children}
    </div>
  );
}

const scrollTo = (id: string) => (e: React.MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
  e.preventDefault();
  const element = document.getElementById(id);
  if (element) {
    element.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const scrollToForm = scrollTo("request-demo");

function HeroChat() {
  const [visible, setVisible] = useState(1);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (visible >= chatScript.length) return;
    const t = setTimeout(() => setVisible((v) => v + 1), 1400);
    return () => clearTimeout(t);
  }, [visible]);

  useEffect(() => {
    if (visible === chatScript.length) {
      const t = setTimeout(() => setVisible(1), 4500);
      return () => clearTimeout(t);
    }
  }, [visible]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [visible]);

  return (
    <div
      ref={scrollRef}
      className="mt-6 h-[232px] space-y-2.5 overflow-y-auto pr-1 [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10"
    >
      <AnimatePresence initial={false}>
        {chatScript.slice(0, visible).map((msg, i) => (
          <motion.div
            key={`${visible}-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className={
              msg.role === "ai"
                ? "max-w-[82%] rounded-3xl rounded-tl-md border border-white/[0.1] bg-white/[0.06] p-4 text-sm text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_8px_24px_-8px_rgba(0,0,0,0.4)] backdrop-blur-sm max-md:p-3.5 max-md:text-[13px]"
                : "ml-auto max-w-[82%] rounded-3xl rounded-tr-md border border-blue-400/15 bg-blue-500/[0.08] p-4 text-sm text-white/88 shadow-[0_0_0_1px_rgba(96,165,250,0.06)_inset,0_8px_24px_-8px_rgba(0,0,0,0.4)] backdrop-blur-sm max-md:p-3.5 max-md:text-[13px]"
            }
          >
            <div className="mb-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/40">
              {msg.role === "ai" ? "Febily AI" : "Customer"}
            </div>
            {msg.text}
          </motion.div>
        ))}
        {visible === chatScript.length && (
          <motion.div
            key="booked"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="ml-auto inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300"
          >
            <CheckCircle2 className="h-3.5 w-3.5" /> Booked & synced to Google Calendar
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FebilyLandingPage() {
  const [formStatus, setFormStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [formError, setFormError] = useState<string | null>(null);
useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://cdn.paddle.com/paddle/v2/paddle.js";
  script.async = true;

  script.onload = () => {
    // @ts-ignore
    window.Paddle.Initialize({
      token: "live_29dd363e7d44cdfef734b1949b3",
    });
  };

  document.body.appendChild(script);
}, []);

const checkout = (priceId: string) => {
  // @ts-ignore
  if (!window.Paddle) return;

  // @ts-ignore
  window.Paddle.Checkout.open({
    items: [
      {
        priceId,
        quantity: 1,
      },
    ],
  });
};
  const handleRequestDemo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (formStatus === "submitting") return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const business = String(formData.get("business") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();

    if (!name || !business || !email || !phone) {
      setFormStatus("error");
      setFormError("Please fill in all fields before submitting.");
      return;
    }

    setFormStatus("submitting");
    setFormError(null);

    try {
      const response = await fetch("https://formspree.io/f/mzdlrbbr", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ name, business, email, phone }),
      });

      if (response.ok) {
        setFormStatus("success");
        form.reset();
      } else {
        const payload = await response.json().catch(() => null);
        const message =
          (payload && Array.isArray(payload.errors) && payload.errors[0]?.message) ||
          "We couldn't submit your request. Please try again or email support@febily.com.";
        setFormError(message);
        setFormStatus("error");
      }
    } catch {
      setFormError("Network error. Please check your connection and try again.");
      setFormStatus("error");
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#030306] text-white selection:bg-white/90 selection:text-black">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(99,102,241,0.08),transparent),radial-gradient(ellipse_60%_40%_at_100%_0%,rgba(59,130,246,0.05),transparent)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.015)_0%,transparent_40%,transparent_100%)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-[#030306]/70 shadow-[0_1px_0_0_rgba(255,255,255,0.04)_inset,0_8px_32px_-8px_rgba(0,0,0,0.6)] backdrop-blur-2xl backdrop-saturate-150 max-md:bg-[#030306]/85">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 max-md:px-4 max-md:py-3 sm:px-6 sm:py-4 lg:px-8">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-2 rounded-full bg-white/[0.97] px-3.5 py-1.5 shadow-[0_2px_16px_-2px_rgba(255,255,255,0.15)] ring-1 ring-white/20 transition hover:bg-white sm:px-4 sm:py-2">
            <img
              src="/febily-logo.png"
              alt="Febily"
              width="112"
              height="35"
              className="h-6 w-auto sm:h-7"
              draggable={false}
            />
          </a>

          <nav className="hidden items-center gap-8 text-sm text-white/60 md:flex">
            <a href="#demo" className="transition-colors duration-200 hover:text-white">Demo</a>
            <a href="#features" className="transition-colors duration-200 hover:text-white">Features</a>
            <a href="#pricing" className="transition-colors duration-200 hover:text-white">Pricing</a>
            <a href="#faq" className="transition-colors duration-200 hover:text-white">FAQ</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={scrollToForm}
              className="hidden shrink-0 items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-white/85 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07] sm:inline-flex sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Contact Sales
            </button>
            <button
              onClick={scrollToForm}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black shadow-[0_2px_20px_-2px_rgba(255,255,255,0.25)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_4px_28px_-2px_rgba(255,255,255,0.35)] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm max-md:px-4 max-md:py-2.5 max-md:text-[13px] max-md:active:scale-[0.98]"
            >
              Get Started <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[-20%] h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.18)_0%,rgba(59,130,246,0.08)_35%,transparent_70%)] blur-3xl max-md:left-1/2 max-md:top-[-10%] max-md:h-[420px] max-md:w-[110%] max-md:-translate-x-1/2 max-md:bg-[radial-gradient(circle,rgba(99,102,241,0.14)_0%,rgba(59,130,246,0.06)_40%,transparent_72%)]" />
            <div className="absolute right-[-10%] top-[15%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.1)_0%,transparent_65%)] blur-3xl max-md:right-[-25%] max-md:top-[8%] max-md:h-[280px] max-md:w-[280px] max-md:opacity-80" />
            <div className="absolute bottom-[-15%] left-[-5%] h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.07)_0%,transparent_65%)] blur-3xl max-md:bottom-[-8%] max-md:left-[-15%] max-md:h-[240px] max-md:w-[240px]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(3,3,6,0.4)_85%,#030306_100%)] max-md:bg-[linear-gradient(to_bottom,transparent_0%,rgba(3,3,6,0.5)_90%,#030306_100%)]" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 pb-20 pt-14 max-md:px-5 max-md:pb-14 max-md:pt-10 sm:px-6 lg:px-8 lg:pb-28 lg:pt-24">
          <div className="grid items-center gap-14 max-md:gap-8 lg:grid-cols-2 lg:gap-20">
            <motion.div {...fadeUp}>
              <SectionLabel>AI Receptionists for US Salons & Barber Shops</SectionLabel>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-[-0.03em] text-balance text-white max-md:mt-4 max-md:text-[2.125rem] max-md:leading-[1.1] sm:text-6xl lg:text-7xl">
                Never Miss Another Booking.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/70 max-md:mt-4 max-md:text-[15px] max-md:leading-[1.65] max-md:text-white/75 sm:text-xl">
                Febily is a human-like AI receptionist that answers every call, books appointments directly into your Google Calendar, and turns missed calls into paying clients—24/7.
              </p>

              <div className="mt-8 flex flex-col gap-3 max-md:mt-6 max-md:gap-2.5 sm:flex-row sm:gap-4">
                <button
                  onClick={scrollToForm}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black shadow-[0_2px_24px_-4px_rgba(255,255,255,0.3)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_4px_32px_-4px_rgba(255,255,255,0.4)] max-md:py-4 max-md:text-[15px] max-md:active:scale-[0.98] sm:w-auto"
                >
                  Get My AI Receptionist <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={scrollTo("demo")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] backdrop-blur-sm transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07] max-md:py-4 max-md:text-[15px] max-md:active:bg-white/[0.1] sm:w-auto"
                >
                  Hear AI Demos
                </button>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-2 text-sm text-white/65 max-md:mt-6 max-md:gap-2 max-md:text-[12.5px] sm:flex sm:flex-wrap sm:gap-2.5">
                {heroTrust.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] backdrop-blur-sm max-md:justify-center max-md:px-2.5 max-md:py-2"
                  >
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-300/90" /> <span className="min-w-0">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ duration: 0.8, ease: "easeOut" as const, delay: 0.1 }}>
              <Card className="relative overflow-hidden p-5 sm:p-7 lg:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.15)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_left,rgba(59,130,246,0.08)_0%,transparent_45%)]" />
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between max-md:gap-3">
                    <div className="flex items-center gap-3 max-md:min-w-0">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/[0.1] bg-gradient-to-br from-white/[0.1] to-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] max-md:h-11 max-md:w-11">
                        <Headphones className="h-6 w-6 max-md:h-5 max-md:w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm text-white/50 max-md:text-xs">Live call · Elite Fade Barbershop</div>
                        <div className="text-lg font-semibold max-md:text-base">Febily AI is on the line</div>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/[0.08] px-3 py-1 text-xs font-medium text-emerald-300 shadow-[0_0_20px_-4px_rgba(52,211,153,0.3)]">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      Live
                    </div>
                  </div>

                  <HeroChat />

                  <div className="mt-8 grid grid-cols-3 gap-3 max-md:mt-5 max-md:gap-2 sm:grid-cols-3 sm:gap-4">
                    {[
                      { label: "Calls answered", value: "100%" },
                      { label: "Avg. pickup", value: "< 1s" },
                      { label: "Lost bookings", value: "Zero" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] max-md:rounded-xl max-md:p-2.5">
                        <div className="text-sm text-white/45 max-md:text-[10px] max-md:leading-tight">{stat.label}</div>
                        <div className="mt-2 text-xl font-semibold tracking-tight max-md:mt-1 max-md:text-base">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
          </div>
        </section>

        {/* AUDIO DEMO */}
        <section id="demo" className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.12)_0%,rgba(99,102,241,0.05)_40%,transparent_70%)] blur-3xl max-md:h-[360px] max-md:w-[120%] max-md:bg-[radial-gradient(circle,rgba(139,92,246,0.1)_0%,transparent_65%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(3,3,6,0)_0%,rgba(3,3,6,0.3)_50%,rgba(3,3,6,0)_100%)]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-violet-400/20 to-transparent" />
          </div>
          <div className="relative z-10 mx-auto max-w-5xl px-4 py-28 max-md:px-5 max-md:py-16 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <motion.div {...fadeUp} className="text-center">
            <SectionLabel>Live Sample</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl lg:text-5xl">
              Hear Febily in Action
            </h2>
            <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/60 max-md:mt-3 max-md:text-[15px] max-md:leading-[1.65] max-md:text-white/70">
              Listen to a real AI receptionist answering a customer call and booking an appointment automatically.
            </p>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.8, ease: "easeOut" as const, delay: 0.1 }} className="mt-10 max-md:mt-8">
            <FebilyAudioPlayer />
            <p className="mt-5 text-center text-sm text-white/50 max-md:mt-4 max-md:text-[13px] max-md:text-white/60">
              This is a real AI conversation powered by Febily's AI receptionist.
            </p>
          </motion.div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-10%] top-[20%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.1)_0%,transparent_65%)] blur-3xl max-md:left-[-30%] max-md:top-[10%] max-md:h-[280px] max-md:w-[280px]" />
            <div className="absolute right-[-5%] bottom-[10%] h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.08)_0%,transparent_65%)] blur-3xl max-md:right-[-25%] max-md:bottom-[5%] max-md:h-[240px] max-md:w-[240px]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.01)_0%,transparent_50%,rgba(255,255,255,0.008)_100%)]" />
            <div className="absolute inset-0 opacity-[0.35] [background-image:radial-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] [background-size:24px_24px] max-md:opacity-[0.2] max-md:[background-size:20px_20px]" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-28 max-md:px-5 max-md:py-16 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <motion.div {...fadeUp} className="max-w-2xl">
            <SectionLabel>Features</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              Everything a busy shop needs to turn calls into bookings.
            </h2>
            <p className="mt-4 text-white/55 max-md:text-[15px] max-md:leading-[1.65] max-md:text-white/65">
              One smart receptionist that handles your phones, your calendar, and your customers — built specifically for US salons and barber shops.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 sm:gap-5 xl:grid-cols-3 max-md:mt-8 max-md:gap-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  {...fadeUp}
                  transition={{ duration: 0.65, delay: index * 0.05 }}
                >
                  <Card className="group h-full p-5 transition-all duration-300 hover:-translate-y-1 hover:border-white/[0.14] hover:shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_40px_100px_-20px_rgba(0,0,0,0.8),0_0_60px_-20px_rgba(99,102,241,0.12)] sm:p-6 max-md:p-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/[0.1] bg-gradient-to-br from-blue-500/[0.12] to-violet-500/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset] transition-colors duration-300 group-hover:border-white/[0.15] max-md:h-10 max-md:w-10 max-md:rounded-xl">
                      <Icon className="h-5 w-5 text-white/90 max-md:h-4 max-md:w-4" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold sm:text-xl max-md:mt-3 max-md:text-[17px]">{feature.title}</h3>
                    <p className="mt-2 text-[15px] leading-6 text-white/55 max-md:text-[14px] max-md:leading-[1.6] max-md:text-white/65">{feature.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            {...fadeUp}
            className="mt-10 grid gap-3 rounded-3xl border border-white/[0.08] bg-gradient-to-r from-white/[0.04] via-white/[0.02] to-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset,0_24px_60px_-20px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:grid-cols-2 lg:grid-cols-4 max-md:mt-8 max-md:gap-2.5 max-md:rounded-2xl max-md:p-4"
          >
            {[
              { icon: Lock, text: "Secure booking process" },
              { icon: ShieldCheck, text: "No long-term contracts" },
              { icon: Zap, text: "Fast 24-hour onboarding" },
              { icon: MapPin, text: "Built for US salons & barbers" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center gap-3 text-sm text-white/70 max-md:gap-2.5 max-md:text-[13px] max-md:text-white/75">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] max-md:h-8 max-md:w-8">
                    <Icon className="h-4 w-4 max-md:h-3.5 max-md:w-3.5" />
                  </div>
                  {item.text}
                </div>
              );
            })}
          </motion.div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-x-0 top-1/2 h-[1px] -translate-y-1/2 bg-gradient-to-r from-transparent via-blue-400/15 to-transparent max-md:hidden" />
            <div className="absolute left-1/2 top-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(59,130,246,0.08)_0%,transparent_70%)] blur-3xl max-md:h-[260px] max-md:w-[110%]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(3,3,6,0.5)_0%,transparent_30%,transparent_70%,rgba(3,3,6,0.5)_100%)] max-md:bg-[linear-gradient(to_bottom,rgba(3,3,6,0.6)_0%,transparent_25%,transparent_75%,rgba(3,3,6,0.6)_100%)]" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-28 max-md:px-5 max-md:py-16 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <motion.div {...fadeUp} className="max-w-2xl">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              From ringing phone to booked appointment in seconds.
            </h2>
            <p className="mt-4 text-white/55 max-md:text-[15px] max-md:leading-[1.65] max-md:text-white/65">
              Five simple steps. No new hardware, no apps for your customers to download.
            </p>
          </motion.div>

          <div className="relative mt-14 max-md:mt-10">
            <div className="pointer-events-none absolute left-0 right-0 top-[34px] hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block" />

            <div className="relative grid gap-6 max-md:gap-4 lg:grid-cols-5 lg:gap-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  {...fadeUp}
                  transition={{ duration: 0.65, delay: index * 0.08 }}
                  className="relative max-md:rounded-2xl max-md:border max-md:border-white/[0.06] max-md:bg-white/[0.02] max-md:p-4 max-md:shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset]"
                >
                  <div className="flex flex-col items-start max-md:flex-row max-md:items-start max-md:gap-4">
                    <div className="relative z-10 flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-2xl border border-white/[0.12] bg-gradient-to-b from-[#0f0f14] to-[#08080c] shadow-[0_0_0_1px_rgba(255,255,255,0.04)_inset,0_16px_48px_-12px_rgba(0,0,0,0.6),0_0_40px_-12px_rgba(99,102,241,0.15)] max-md:h-14 max-md:w-14 max-md:rounded-xl">
                      <span className="bg-gradient-to-b from-white to-white/70 bg-clip-text text-lg font-bold tracking-tight text-transparent max-md:text-base">0{index + 1}</span>
                    </div>
                    <div className="max-md:min-w-0 max-md:flex-1">
                    <h3 className="mt-5 text-base font-semibold text-white/90 max-md:mt-0 max-md:text-[15px]">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/50 max-md:mt-1 max-md:text-[13px] max-md:leading-[1.6] max-md:text-white/60">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="absolute right-[-12px] top-[22px] hidden h-6 w-6 text-white/25 lg:block" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-[30%] h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.1)_0%,rgba(139,92,246,0.05)_35%,transparent_65%)] blur-3xl max-md:top-[20%] max-md:h-[400px] max-md:w-[120%]" />
            <div className="absolute right-[-8%] bottom-[5%] h-[350px] w-[350px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.07)_0%,transparent_65%)] blur-3xl max-md:right-[-20%] max-md:h-[200px] max-md:w-[200px]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-violet-400/10 to-transparent" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-28 max-md:px-5 max-md:py-16 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              Simple monthly pricing. Cancel anytime.
            </h2>
            <p className="mt-4 text-white/55 max-md:text-[15px] max-md:leading-[1.65] max-md:text-white/65">
              Most shops cover their plan with just 1–2 saved bookings per month. No contracts. No setup fees.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-5 max-md:mt-10 max-md:gap-4 lg:grid-cols-3 lg:items-stretch lg:gap-6">
            {pricing.map((plan, index) => (
              <motion.div
                key={plan.name}
                {...fadeUp}
                transition={{ duration: 0.7, delay: index * 0.05 }}
                className={plan.highlight ? "lg:-mt-4" : ""}
              >
                <Card
                  className={`relative flex h-full flex-col p-6 sm:p-7 max-md:p-5 ${
                    plan.highlight
                      ? "relative border-white/[0.18] bg-gradient-to-b from-white/[0.1] via-white/[0.05] to-white/[0.02] shadow-[0_0_0_1px_rgba(255,255,255,0.08)_inset,0_40px_120px_-20px_rgba(0,0,0,0.7),0_0_80px_-20px_rgba(99,102,241,0.2)] ring-1 ring-white/[0.1] before:pointer-events-none before:absolute before:inset-x-8 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent before:content-['']"
                      : ""
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-black shadow-[0_4px_24px_-4px_rgba(255,255,255,0.4)]">
                      {plan.badge}
                    </div>
                  )}
                  <div className="text-lg font-medium max-md:text-base">{plan.name}</div>
                  <div className="mt-3 flex items-end gap-1">
                    <div className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl max-md:text-[2.25rem]">{plan.price}</div>
                    <div className="pb-1.5 text-white/50 max-md:text-[13px] max-md:text-white/55">{plan.period}</div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-white/55 max-md:text-[13px] max-md:leading-[1.6] max-md:text-white/60">{plan.description}</p>
                  <div className="mt-5 space-y-2.5 max-md:space-y-2">
                    {plan.features.map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm text-white/80 max-md:text-[13px]">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/90" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-6 max-md:pt-5">
                    <button
                     
  onClick={() => {
    if (plan.name === "Starter") {
      checkout("pri_01kx87tjr05yndbsnfgdwee46v");
    } else if (plan.name === "Growth") {
      checkout("pri_01kx882g8nv2xmxwn8h611pwvp");
    } else if (plan.name === "Premium") {
      checkout("pri_01kx88gp65gwkh5d65hwtf0tyg");
    }
  }}
  className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-all duration-200 max-md:py-3.5 max-md:text-[15px] max-md:active:scale-[0.98] ${
    plan.highlight
      ? "bg-white text-black shadow-[0_2px_24px_-4px_rgba(255,255,255,0.3)] hover:scale-[1.01] hover:shadow-[0_4px_32px_-4px_rgba(255,255,255,0.4)]"
      : "border border-white/[0.12] bg-white/[0.04] text-white shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] hover:border-white/20 hover:bg-white/[0.07] max-md:active:bg-white/[0.1]"
  }`}
>
  {plan.cta}
  <ArrowRight className="h-4 w-4" />
</button>
                    
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/50 max-md:mt-8 max-md:gap-x-4 max-md:gap-y-2.5 max-md:text-[13px] max-md:text-white/55">
            <span className="inline-flex items-center gap-2"><Lock className="h-4 w-4 max-md:h-3.5 max-md:w-3.5" /> Secure checkout</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4 max-md:h-3.5 max-md:w-3.5" /> Cancel anytime</span>
            <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4 max-md:h-3.5 max-md:w-3.5" /> Live in 24 hours</span>
          </div>

          <div className="mt-6 text-center text-sm text-white/50 max-md:mt-5 max-md:text-[13px] max-md:text-white/55">
            Not sure which plan? <button onClick={scrollToForm} className="text-white underline-offset-4 transition-colors hover:underline">Book a demo</button> and we'll recommend the right fit.
          </div>
          </div>
        </section>

        {/* DEMO REQUEST FORM */}
        <section id="request-demo" className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-[-5%] top-[20%] h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,rgba(59,130,246,0.1)_0%,transparent_65%)] blur-3xl max-md:left-[-25%] max-md:top-[10%] max-md:h-[280px] max-md:w-[280px]" />
            <div className="absolute right-[-5%] bottom-[10%] h-[450px] w-[450px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.08)_0%,transparent_65%)] blur-3xl max-md:right-[-25%] max-md:bottom-[5%] max-md:h-[240px] max-md:w-[240px]" />
            <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(99,102,241,0.03)_0%,transparent_40%,rgba(59,130,246,0.02)_100%)]" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-28 max-md:px-5 max-md:py-16 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <motion.div {...fadeUp}>
            <Card className="relative overflow-hidden p-6 max-md:p-4 sm:p-10 lg:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(99,102,241,0.12)_0%,transparent_50%),radial-gradient(ellipse_at_bottom_right,rgba(59,130,246,0.08)_0%,transparent_45%)]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-400/20 to-transparent" />
              <div className="relative z-10 grid gap-10 max-md:gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                <div>
                  <SectionLabel>Book Demo</SectionLabel>
                  <h2 className="mt-5 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl max-md:text-[1.75rem]">
                    Get Your Personalized AI Demo.
                  </h2>
                  <p className="mt-4 max-w-2xl leading-7 text-white/55 max-md:mt-3 max-md:text-[15px] max-md:leading-[1.65] max-md:text-white/65">
                    Fill out the form and we'll contact you within one business day to schedule your personalized AI receptionist demo.
                  </p>

                  <div className="mt-8 space-y-3 max-md:mt-6 max-md:space-y-2">
                    {[
                      "Personalized AI receptionist demo",
                      "See real customer conversations",
                      "Google Calendar booking integration",
                      "Tailored to your business",
                      "No obligation or long-term contract",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] max-md:rounded-xl max-md:px-3.5 max-md:py-3"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-400/15 max-md:h-6 max-md:w-6">
                          <CheckCircle2 className="h-4 w-4 text-emerald-300 max-md:h-3.5 max-md:w-3.5" />
                        </div>
                        <span className="text-sm max-md:text-[13px]">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/40 max-md:mt-6 max-md:text-[11px] max-md:text-white/50">
                    <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Your info stays private</span>
                  </div>
                </div>

                <Card className="p-6 max-md:p-5 sm:p-7">
                  {formStatus === "success" ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      </div>
                      <h3 className="mt-6 text-xl font-semibold">Thank you!</h3>
                      <p className="mt-3 text-white/65 max-md:text-white/75">
                        Your demo request has been received. We'll contact you within one business day.
                      </p>
                      <button
                        onClick={() => setFormStatus("idle")}
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-6 py-3 text-sm font-semibold text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07] max-md:py-3.5 max-md:active:bg-white/[0.1]"
                      >
                        Submit Another Request
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleRequestDemo} noValidate className="space-y-3 max-md:space-y-4">
                      {formStatus === "error" && formError && (
                        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
                          {formError}
                        </div>
                      )}

                      <div>
                        <label htmlFor="name" className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-white/55 max-md:text-white/65">Full Name</label>
                        <input
                          id="name"
                          name="name"
                          required
                          maxLength={100}
                          placeholder="Jordan Smith"
                          className="w-full rounded-2xl border border-white/[0.1] bg-[#08080c]/80 px-4 py-2.5 text-sm text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] outline-none placeholder:text-white/30 transition-colors focus:border-blue-400/30 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] max-md:rounded-xl max-md:px-4 max-md:py-3.5"
                        />
                      </div>

                      <div>
                        <label htmlFor="business" className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-white/55 max-md:text-white/65">Business Name</label>
                        <input
                          id="business"
                          name="business"
                          required
                          maxLength={120}
                          placeholder="Elite Fade Barbershop"
                          className="w-full rounded-2xl border border-white/[0.1] bg-[#08080c]/80 px-4 py-2.5 text-sm text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] outline-none placeholder:text-white/30 transition-colors focus:border-blue-400/30 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] max-md:rounded-xl max-md:px-4 max-md:py-3.5"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-white/55 max-md:text-white/65">Email Address</label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          maxLength={255}
                          placeholder="you@yourshop.com"
                          className="w-full rounded-2xl border border-white/[0.1] bg-[#08080c]/80 px-4 py-2.5 text-sm text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] outline-none placeholder:text-white/30 transition-colors focus:border-blue-400/30 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] max-md:rounded-xl max-md:px-4 max-md:py-3.5"
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="mb-1.5 block text-xs font-medium uppercase tracking-[0.18em] text-white/55 max-md:text-white/65">Phone Number</label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          maxLength={20}
                          placeholder="(555) 123-4567"
                          className="w-full rounded-2xl border border-white/[0.1] bg-[#08080c]/80 px-4 py-2.5 text-sm text-white shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset] outline-none placeholder:text-white/30 transition-colors focus:border-blue-400/30 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.08)] max-md:rounded-xl max-md:px-4 max-md:py-3.5"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={formStatus === "submitting"}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black shadow-[0_2px_24px_-4px_rgba(255,255,255,0.3)] transition-all duration-200 hover:scale-[1.01] hover:shadow-[0_4px_32px_-4px_rgba(255,255,255,0.4)] disabled:cursor-not-allowed disabled:opacity-70 max-md:mt-2 max-md:py-4 max-md:text-[15px] max-md:active:scale-[0.98]"
                      >
                        {formStatus === "submitting" ? "Submitting..." : "Book My Demo"}
                        {formStatus !== "submitting" && <ArrowRight className="h-4 w-4" />}
                      </button>

                      <div className="text-center text-xs text-white/45 max-md:pt-1 max-md:text-white/55">
                        We'll reach out within 1 business day to schedule your demo.
                      </div>
                    </form>
                  )}
                </Card>
              </div>
            </Card>
          </motion.div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 bottom-0 h-[400px] w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(ellipse,rgba(139,92,246,0.06)_0%,transparent_70%)] blur-3xl max-md:h-[240px] max-md:w-[110%]" />
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_0%,rgba(3,3,6,0.4)_100%)] max-md:bg-[linear-gradient(to_bottom,transparent_0%,rgba(3,3,6,0.5)_100%)]" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-28 max-md:px-5 max-md:py-16 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <motion.div {...fadeUp} className="max-w-2xl">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl max-md:text-[1.75rem]">
              Frequently asked questions.
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-3 max-md:mt-8 max-md:gap-2.5 lg:grid-cols-2 lg:gap-4">
            {faqs.map((item, index) => (
              <motion.details
                key={item.q}
                {...fadeUp}
                transition={{ duration: 0.6, delay: index * 0.04 }}
                className="group rounded-2xl border border-white/[0.08] bg-gradient-to-b from-white/[0.04] to-white/[0.01] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)_inset,0_16px_48px_-16px_rgba(0,0,0,0.5)] backdrop-blur-sm open:border-white/[0.12] open:from-white/[0.06] open:to-white/[0.02] sm:rounded-3xl sm:p-6 max-md:p-4"
              >
                <summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-lg font-medium outline-none max-md:text-[15px] max-md:leading-6">
                  <span className="min-w-0 flex-1">{item.q}</span>
                  <ChevronRight className="h-5 w-5 shrink-0 text-white/40 transition duration-300 group-open:rotate-90 max-md:mt-0.5 max-md:h-4 max-md:w-4" />
                </summary>
                <p className="mt-4 max-w-2xl leading-7 text-white/55 max-md:mt-3 max-md:pr-1 max-md:text-[14px] max-md:leading-[1.65] max-md:text-white/65">{item.a}</p>
              </motion.details>
            ))}
          </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.14)_0%,rgba(59,130,246,0.06)_40%,transparent_70%)] blur-3xl max-md:h-[360px] max-md:w-[120%]" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-400/20 to-transparent" />
          </div>
          <div className="relative z-10 mx-auto max-w-7xl px-4 py-28 max-md:px-5 max-md:py-16 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <motion.div {...fadeUp}>
            <Card className="relative overflow-hidden p-6 sm:p-10 lg:p-12 max-md:p-5">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.15)_0%,transparent_55%),radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.1)_0%,transparent_45%)]" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
              <div className="relative z-10 text-center">
                <SectionLabel>Start Today</SectionLabel>
                <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-[-0.02em] sm:text-4xl lg:text-5xl max-md:text-[1.75rem] max-md:leading-[1.15]">
                  Your next missed call could be your next best client.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/55 max-md:mt-3 max-md:text-[15px] max-md:leading-[1.65] max-md:text-white/65">
                  Set up Febily in under 24 hours and never miss another booking.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 max-md:mt-6 max-md:gap-2.5 sm:flex-row">
                  <button
                    onClick={scrollToForm}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black shadow-[0_2px_24px_-4px_rgba(255,255,255,0.3)] transition-all duration-200 hover:scale-[1.02] hover:shadow-[0_4px_32px_-4px_rgba(255,255,255,0.4)] max-md:py-4 max-md:text-[15px] max-md:active:scale-[0.98] sm:w-auto"
                  >
                    Get My AI Receptionist <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={scrollTo("demo")}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.04] px-6 py-3.5 text-sm font-semibold text-white/90 shadow-[0_0_0_1px_rgba(255,255,255,0.03)_inset] transition-all duration-200 hover:border-white/20 hover:bg-white/[0.07] max-md:py-4 max-md:text-[15px] max-md:active:bg-white/[0.1] sm:w-auto"
                  >
                    Hear AI Demo
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
          </div>
        </section>
      </main>

      <footer className="relative border-t border-white/[0.06] bg-[#020205]/80 shadow-[0_-1px_0_0_rgba(255,255,255,0.03)_inset] backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        <div className="mx-auto max-w-7xl px-4 py-12 max-md:px-5 max-md:py-10 sm:px-6 lg:px-8">
          <div className="grid gap-10 max-md:gap-8 md:grid-cols-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.97] px-3.5 py-1.5 shadow-[0_2px_16px_-2px_rgba(255,255,255,0.1)] ring-1 ring-white/20">
                <img src="/febily-logo.png" alt="Febily" width="112" height="35" className="h-6 w-auto" draggable={false} />
              </div>
              <p className="mt-3 text-sm text-white/50 max-md:text-[13px] max-md:text-white/55">
                AI Receptionists for US Salons &amp; Barber Shops.
              </p>
              <p className="mt-2 text-sm text-white/40 max-md:text-[12px] max-md:text-white/45">
                Built for salons &amp; barber shops across the United States.
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45 max-md:text-[11px] max-md:text-white/50">Explore</div>
              <ul className="mt-4 space-y-2 text-sm text-white/60 max-md:space-y-2.5 max-md:text-[13px] max-md:text-white/65">
                <li><a href="#pricing" onClick={scrollTo("pricing")} className="hover:text-white">Pricing</a></li>
                <li><a href="#demo" onClick={scrollTo("demo")} className="hover:text-white">Demo</a></li>
                <li><a href="#faq" onClick={scrollTo("faq")} className="hover:text-white">FAQ</a></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45 max-md:text-[11px] max-md:text-white/50">Legal</div>
              <ul className="mt-4 space-y-2 text-sm text-white/60 max-md:space-y-2.5 max-md:text-[13px] max-md:text-white/65">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/refund" className="hover:text-white">Refund Policy</Link></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45 max-md:text-[11px] max-md:text-white/50">Contact</div>
              <ul className="mt-4 space-y-2 text-sm text-white/60 max-md:space-y-2.5 max-md:text-[13px] max-md:text-white/65">
                <li>
                  Email:{" "}
                  <a href="mailto:support@febily.com" className="text-white/90 hover:text-white">
                    support@febily.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/[0.06] pt-6 text-center text-xs text-white/35 max-md:mt-8 max-md:pt-5 max-md:text-[11px] max-md:text-white/40">
            © 2026 Febily. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
