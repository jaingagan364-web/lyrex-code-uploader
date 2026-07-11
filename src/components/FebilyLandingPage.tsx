import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Mic,
  PhoneCall,
  Sparkles,
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
  { role: "ai", text: "Absolutely! I have 3:30 PM available with Marcus. Would that work?" },
  { role: "customer", text: "Perfect." },
  { role: "ai", text: "Great — you're booked for 3:30 PM tomorrow. You'll get a confirmation text shortly." },
];

const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium tracking-[0.24em] text-white/70 uppercase backdrop-blur">
    <span className="h-1.5 w-1.5 rounded-full bg-white" />
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
      className={`rounded-3xl border border-white/10 bg-white/[0.04] shadow-[0_20px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl ${className}`}
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
      className="mt-8 h-[340px] space-y-3 overflow-y-auto pr-1 [scrollbar-width:thin] [-ms-overflow-style:none] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/10"
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
                ? "max-w-[82%] rounded-3xl rounded-tl-md border border-white/10 bg-white/7 p-4 text-sm text-white/88"
                : "ml-auto max-w-[82%] rounded-3xl rounded-tr-md border border-white/10 bg-white/12 p-4 text-sm text-white/85"
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
          "We couldn't submit your request. Please try again or email febilysupport@gmail.com.";
        setFormError(message);
        setFormStatus("error");
      }
    } catch {
      setFormError("Network error. Please check your connection and try again.");
      setFormStatus("error");
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050505] text-white selection:bg-white selection:text-black">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-[-12rem] h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute right-[-8rem] top-[22rem] h-[28rem] w-[28rem] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-8rem] h-[30rem] w-[30rem] rounded-full bg-white/5 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.07),_transparent_30%),linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent)]" />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-8">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="flex items-center gap-2 rounded-full bg-white/95 px-3.5 py-1.5 shadow-sm ring-1 ring-white/10 transition hover:bg-white sm:px-4 sm:py-2">
            <img
              src="/febily-logo.png"
              alt="Febily"
              width="112"
              height="35"
              className="h-6 w-auto sm:h-7"
              draggable={false}
            />
          </a>

          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#demo" className="transition hover:text-white">Demo</a>
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={scrollToForm}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-semibold text-black transition hover:scale-[1.02] sm:gap-2 sm:px-5 sm:py-2.5 sm:text-sm"
            >
              Book My Demo <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="mx-auto max-w-7xl px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <motion.div {...fadeUp}>
              <SectionLabel>AI Receptionists for US Salons & Barber Shops</SectionLabel>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                Never Miss Another Booking.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75 sm:text-xl">
                Febily is a human-like AI receptionist that answers every call, books appointments directly into your Google Calendar, and turns missed calls into paying clients—24/7.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <button
                  onClick={scrollToForm}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
                >
                  Get My AI Receptionist <ArrowRight className="h-4 w-4" />
                </button>
                <button
                  onClick={scrollTo("demo")}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/25 hover:bg-white/[0.08]"
                >
                  Hear AI Demo
                </button>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-2 text-sm text-white/70 sm:flex sm:flex-wrap sm:gap-3">
                {heroTrust.map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5"
                  >
                    <CheckCircle2 className="h-4 w-4 text-emerald-300/90" /> {item}
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div {...fadeUp} transition={{ duration: 0.8, ease: "easeOut" as const, delay: 0.1 }}>
              <Card className="relative overflow-hidden p-5 sm:p-7 lg:p-8">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_30%)]" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
                        <Headphones className="h-6 w-6" />
                      </div>
                      <div>
                        <div className="text-sm text-white/50">Live call · Elite Fade Barbershop</div>
                        <div className="text-lg font-semibold">Febily AI is on the line</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                      Live
                    </div>
                  </div>

                  <HeroChat />

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Calls answered", value: "100%" },
                      { label: "Avg. pickup", value: "< 1s" },
                      { label: "Lost bookings", value: "Zero" },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-3xl border border-white/10 bg-white/[0.04] p-4">
                        <div className="text-sm text-white/45">{stat.label}</div>
                        <div className="mt-2 text-xl font-semibold">{stat.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* AUDIO DEMO */}
        <section id="demo" className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="text-center">
            <SectionLabel>Live Sample</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Hear Febily in Action
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/65 leading-7">
              Listen to a real AI receptionist answering a customer call and booking an appointment automatically.
            </p>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.8, ease: "easeOut" as const, delay: 0.1 }} className="mt-10">
            <FebilyAudioPlayer />
            <p className="mt-5 text-center text-sm text-white/55">
              This is a real AI conversation powered by Febily's AI receptionist.
            </p>
          </motion.div>
        </section>

        {/* FEATURES */}
        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <SectionLabel>Features</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything a busy shop needs to turn calls into bookings.
            </h2>
            <p className="mt-4 text-white/60">
              One smart receptionist that handles your phones, your calendar, and your customers — built specifically for US salons and barber shops.
            </p>
          </motion.div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  {...fadeUp}
                  transition={{ duration: 0.65, delay: index * 0.05 }}
                >
                  <Card className="h-full p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.055]">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/8">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">{feature.title}</h3>
                    <p className="mt-3 leading-7 text-white/60">{feature.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          <motion.div
            {...fadeUp}
            className="mt-10 grid gap-3 rounded-3xl border border-white/10 bg-white/[0.03] p-5 sm:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { icon: Lock, text: "Secure booking process" },
              { icon: ShieldCheck, text: "No long-term contracts" },
              { icon: Zap, text: "Fast 24-hour onboarding" },
              { icon: MapPin, text: "Built for US salons & barbers" },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.text} className="flex items-center gap-3 text-sm text-white/75">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                    <Icon className="h-4 w-4" />
                  </div>
                  {item.text}
                </div>
              );
            })}
          </motion.div>
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              From ringing phone to booked appointment in seconds.
            </h2>
            <p className="mt-4 text-white/60">
              Five simple steps. No new hardware, no apps for your customers to download.
            </p>
          </motion.div>

          <div className="relative mt-12">
            <div className="pointer-events-none absolute left-0 right-0 top-[34px] hidden h-px bg-gradient-to-r from-transparent via-white/15 to-transparent lg:block" />

            <div className="relative grid gap-6 lg:grid-cols-5 lg:gap-4">
              {steps.map((step, index) => (
                <motion.div
                  key={step.title}
                  {...fadeUp}
                  transition={{ duration: 0.65, delay: index * 0.08 }}
                  className="relative"
                >
                  <div className="flex flex-col items-start">
                    <div className="relative z-10 flex h-[68px] w-[68px] items-center justify-center rounded-2xl border border-white/15 bg-[#0a0a0a] shadow-[0_10px_40px_rgba(255,255,255,0.06)]">
                      <span className="text-lg font-bold tracking-tight">0{index + 1}</span>
                    </div>
                    <h3 className="mt-5 text-base font-semibold text-white/90">{step.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/55">{step.description}</p>
                  </div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="absolute right-[-12px] top-[22px] hidden h-6 w-6 text-white/30 lg:block" />
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple monthly pricing. Cancel anytime.
            </h2>
            <p className="mt-4 text-white/65">
              Most shops cover their plan with just 1–2 saved bookings per month. No contracts. No setup fees.
            </p>
          </motion.div>

          <div className="mt-14 grid gap-6 lg:grid-cols-3 lg:items-stretch">
            {pricing.map((plan, index) => (
              <motion.div
                key={plan.name}
                {...fadeUp}
                transition={{ duration: 0.7, delay: index * 0.05 }}
                className={plan.highlight ? "lg:-mt-4" : ""}
              >
                <Card
                  className={`relative flex h-full flex-col p-7 sm:p-8 ${
                    plan.highlight
                      ? "border-white/30 bg-white/[0.07] shadow-[0_30px_120px_rgba(255,255,255,0.1)] ring-1 ring-white/15"
                      : ""
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-black shadow-lg shadow-white/10">
                      {plan.badge}
                    </div>
                  )}
                  <div className="text-lg font-medium">{plan.name}</div>
                  <div className="mt-4 flex items-end gap-1">
                    <div className="text-5xl font-semibold tracking-tight">{plan.price}</div>
                    <div className="pb-2 text-white/55">{plan.period}</div>
                  </div>
                  <p className="mt-4 leading-6 text-white/60">{plan.description}</p>
                  <div className="mt-7 space-y-3.5">
                    {plan.features.map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm text-white/85">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/90" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-8">
                    <button
                      className={`inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition ${
                        plan.highlight
                          ? "bg-white text-black hover:scale-[1.01]"
                          : "border border-white/12 bg-white/5 text-white hover:border-white/25 hover:bg-white/[0.08]"
                      }`}
                    >
                      {plan.cta} <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/55">
            <span className="inline-flex items-center gap-2"><Lock className="h-4 w-4" /> Secure checkout</span>
            <span className="inline-flex items-center gap-2"><ShieldCheck className="h-4 w-4" /> Cancel anytime</span>
            <span className="inline-flex items-center gap-2"><Zap className="h-4 w-4" /> Live in 24 hours</span>
          </div>

          <div className="mt-6 text-center text-sm text-white/55">
            Not sure which plan? <button onClick={scrollToForm} className="text-white underline-offset-4 hover:underline">Book a demo</button> and we'll recommend the right fit.
          </div>
        </section>

        {/* DEMO REQUEST FORM */}
        <section id="request-demo" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp}>
            <Card className="relative overflow-hidden p-8 sm:p-10 lg:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_30%)]" />
              <div className="relative z-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                <div>
                  <SectionLabel>Book Demo</SectionLabel>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Get Your Personalized AI Demo.
                  </h2>
                  <p className="mt-4 max-w-2xl text-white/65 leading-7">
                    Fill out the form and we'll contact you within one business day to schedule your personalized AI receptionist demo.
                  </p>

                  <div className="mt-8 space-y-3">
                    {[
                      "Personalized AI receptionist demo",
                      "See real customer conversations",
                      "Google Calendar booking integration",
                      "Tailored to your business",
                      "No obligation or long-term contract",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-white/85"
                      >
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-400/15">
                          <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                        </div>
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/45">
                    <span className="inline-flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Your info stays private</span>
                  </div>
                </div>

                <Card className="p-6 sm:p-7">
                  {formStatus === "success" ? (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-400/20">
                        <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      </div>
                      <h3 className="mt-6 text-xl font-semibold">Thank you!</h3>
                      <p className="mt-3 text-white/65">
                        Your demo request has been received. We'll contact you within one business day.
                      </p>
                      <button
                        onClick={() => setFormStatus("idle")}
                        className="mt-6 inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3 text-sm font-semibold text-white/90 transition hover:border-white/25 hover:bg-white/[0.08]"
                      >
                        Submit Another Request
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleRequestDemo} noValidate className="space-y-4">
                      {formStatus === "error" && formError && (
                        <div className="rounded-2xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300">
                          {formError}
                        </div>
                      )}

                      <div>
                        <label htmlFor="name" className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-white/55">Full Name</label>
                        <input
                          id="name"
                          name="name"
                          required
                          maxLength={100}
                          placeholder="Jordan Smith"
                          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
                        />
                      </div>

                      <div>
                        <label htmlFor="business" className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-white/55">Business Name</label>
                        <input
                          id="business"
                          name="business"
                          required
                          maxLength={120}
                          placeholder="Elite Fade Barbershop"
                          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
                        />
                      </div>

                      <div>
                        <label htmlFor="email" className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-white/55">Email Address</label>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          required
                          maxLength={255}
                          placeholder="you@yourshop.com"
                          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
                        />
                      </div>

                      <div>
                        <label htmlFor="phone" className="mb-2 block text-xs font-medium uppercase tracking-[0.18em] text-white/55">Phone Number</label>
                        <input
                          id="phone"
                          name="phone"
                          type="tel"
                          required
                          maxLength={20}
                          placeholder="(555) 123-4567"
                          className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={formStatus === "submitting"}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.01] disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        {formStatus === "submitting" ? "Submitting..." : "Book My Demo"}
                        {formStatus !== "submitting" && <ArrowRight className="h-4 w-4" />}
                      </button>

                      <div className="text-center text-xs text-white/45">
                        We'll reach out within 1 business day to schedule your demo.
                      </div>
                    </form>
                  )}
                </Card>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* FAQ */}
        <section id="faq" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <SectionLabel>FAQ</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Frequently asked questions.
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            {faqs.map((item, index) => (
              <motion.details
                key={item.q}
                {...fadeUp}
                transition={{ duration: 0.6, delay: index * 0.04 }}
                className="group rounded-3xl border border-white/10 bg-white/[0.035] p-6 open:bg-white/[0.05]"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-medium outline-none">
                  {item.q}
                  <ChevronRight className="h-5 w-5 shrink-0 text-white/45 transition duration-300 group-open:rotate-90" />
                </summary>
                <p className="mt-4 max-w-2xl leading-7 text-white/60">{item.a}</p>
              </motion.details>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp}>
            <Card className="relative overflow-hidden p-8 sm:p-10 lg:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_30%)]" />
              <div className="relative z-10 text-center">
                <SectionLabel>Start Today</SectionLabel>
                <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                  Your next missed call could be your next best client.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/65">
                  Set up Febily in under 24 hours and never miss another booking.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <button
                    onClick={scrollToForm}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
                  >
                    Get My AI Receptionist <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={scrollTo("demo")}
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/25 hover:bg-white/[0.08]"
                  >
                    Hear Febily Live
                  </button>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-black/40">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="text-xl font-semibold">Febily</div>
              </div>
              <p className="mt-3 text-sm text-white/55">
                AI Receptionists for US Salons &amp; Barber Shops.
              </p>
              <p className="mt-2 text-sm text-white/45">
                Built for salons &amp; barber shops across the United States.
              </p>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Explore</div>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li><a href="#pricing" onClick={scrollTo("pricing")} className="hover:text-white">Pricing</a></li>
                <li><a href="#demo" onClick={scrollTo("demo")} className="hover:text-white">Demo</a></li>
                <li><a href="#faq" onClick={scrollTo("faq")} className="hover:text-white">FAQ</a></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Legal</div>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li><Link to="/privacy" className="hover:text-white">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white">Terms of Service</Link></li>
                <li><Link to="/refund" className="hover:text-white">Refund Policy</Link></li>
              </ul>
            </div>

            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">Contact</div>
              <ul className="mt-4 space-y-2 text-sm text-white/70">
                <li>
                  Email:{" "}
                  <a href="mailto:febilysupport@gmail.com" className="text-white/90 hover:text-white">
                    febilysupport@gmail.com
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/5 pt-6 text-center text-xs text-white/40">
            © 2026 Febily. All Rights Reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
