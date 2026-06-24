
import React from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Mic,
  PhoneCall,
  Sparkles,
  ShieldCheck,
  Star,
  Bot,
  MessageSquareMore,
  LayoutGrid,
  Users,
  Headphones,
  ChevronRight,
  PlayCircle,
  Zap,
} from "lucide-react";

const DEMO_VIDEO_URL = "/demo.mp4";

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
    description: "Every call answered instantly — nights, weekends, and during busy chair time.",
  },
  {
    icon: CalendarDays,
    title: "Automatic Appointment Booking",
    description: "Lyrex books, reschedules, and confirms appointments without your team lifting a finger.",
  },
  {
    icon: LayoutGrid,
    title: "Real-Time Calendar Sync",
    description: "Live integration with Google Calendar so double-bookings never happen.",
  },
  {
    icon: Mic,
    title: "Natural Human-Like Voice",
    description: "Customers think they're talking to your best receptionist — not a robot.",
  },
  {
    icon: Sparkles,
    title: "Captures Every Lost Booking",
    description: "Turns missed calls into paying appointments while your chairs stay full.",
  },
  {
    icon: Bot,
    title: "Knows Your Shop",
    description: "Trained on your services, prices, stylists, and hours from day one.",
  },
];

const steps = [
  "Customer Calls",
  "AI Answers Instantly",
  "AI Checks Availability",
  "Appointment Gets Booked",
  "Booking Appears On Your Calendar",
];

const pricing = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "For solo barbers and small salons that want to stop missing calls.",
    features: [
      "AI Receptionist (business hours)",
      "Automatic Appointment Booking",
      "Google Calendar Integration",
      "Up to 100 calls / month",
      "Email Support",
    ],
    highlight: false,
  },
  {
    name: "Growth",
    price: "$79",
    period: "/month",
    description: "Most salons & barber shops pick this — covers 24/7 with room to scale.",
    features: [
      "Everything in Starter",
      "24/7 Call Handling",
      "Up to 500 calls / month",
      "Custom Services, Prices & Stylists",
      "SMS Booking Confirmations",
      "Priority Support",
    ],
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Premium",
    price: "$149",
    period: "/month",
    description: "For multi-chair shops and multi-location brands that need full control.",
    features: [
      "Everything in Growth",
      "Unlimited Calls",
      "Multi-Location Support",
      "Fully Custom AI Voice & Script",
      "Dedicated Onboarding Specialist",
      "Priority Feature Requests",
    ],
    highlight: false,
  },
];

const trustItems = [
  {
    icon: PhoneCall,
    title: "Never Miss Another Booking",
    description: "Every ring is answered — even if 5 customers call at once during your busiest hour.",
  },
  {
    icon: Clock3,
    title: "Available 24/7",
    description: "Late nights, lunch breaks, Sundays — Lyrex is always on the line.",
  },
  {
    icon: ShieldCheck,
    title: "Professional Customer Experience",
    description: "Polite, on-brand, and consistent every single call — no bad days.",
  },
  {
    icon: CalendarDays,
    title: "Real-Time Calendar Integration",
    description: "Books straight into Google Calendar with zero double-bookings.",
  },
  {
    icon: Zap,
    title: "Fast Setup",
    description: "Live in under 24 hours. No tech skills, no new hardware, no IT team.",
  },
  {
    icon: MessageSquareMore,
    title: "Handles Customer Questions",
    description: "Hours, pricing, services, directions — answered instantly, accurately.",
  },
];

const faqs = [
  {
    q: "Does the AI really answer calls 24/7?",
    a: "Yes. Lyrex picks up every call instantly, day or night, including weekends and holidays.",
  },
  {
    q: "Will it actually book into my calendar?",
    a: "Yes. Lyrex integrates directly with Google Calendar and books appointments in real time based on live availability.",
  },
  {
    q: "Does it work for salons and barber shops in the US?",
    a: "Absolutely. Lyrex is built specifically for US-based salons and barber shops with US phone numbers and English-speaking AI voices.",
  },
  {
    q: "How long does setup take?",
    a: "Most shops are fully live in under 24 hours. We handle setup, training the AI on your services, and forwarding your existing number.",
  },
  {
    q: "What happens if the AI can't answer something?",
    a: "Lyrex politely takes a message and forwards it to you by email or SMS — so you never lose the lead.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Yes. Month-to-month, no long-term contracts. Cancel anytime in one click.",
  },
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

export default function LyrexLandingPage() {
  const handleRequestDemo = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);

    const name = String(formData.get("name") || "").trim();
    const business = String(formData.get("business") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();

    const subject = encodeURIComponent(
      `Lyrex demo request${business ? ` — ${business}` : ""}`
    );

    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        `Business: ${business}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        "",
        `I'd like to see a demo of Lyrex for my salon/barber shop.`,
      ].join("\n")
    );

    window.location.href = `mailto:LyrexAI@gmail.com?subject=${subject}&body=${body}`;
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
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/10 shadow-lg shadow-white/5">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="text-lg font-semibold tracking-wide">Lyrex</div>
              <div className="text-xs text-white/45">AI Receptionists</div>
            </div>
          </div>

          <nav className="hidden items-center gap-8 text-sm text-white/70 md:flex">
            <a href="#demo" className="transition hover:text-white">Demo</a>
            <a href="#features" className="transition hover:text-white">Features</a>
            <a href="#pricing" className="transition hover:text-white">Pricing</a>
            <a href="#faq" className="transition hover:text-white">FAQ</a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-black transition hover:scale-[1.02]"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </a>
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
                Stop Losing Bookings to Missed Calls.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/75 sm:text-xl">
                Lyrex answers every call, books appointments straight into your calendar, and handles customer questions — 24/7. So your chairs stay full, even when you can't reach the phone.
              </p>

              <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </a>
                <a
                  href="#request-demo"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/25 hover:bg-white/[0.08]"
                >
                  Book Demo
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-3 text-sm text-white/65">
                {["Live in under 24 hours", "Google Calendar sync", "Cancel anytime"].map(
                  (item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2"
                    >
                      <CheckCircle2 className="h-4 w-4" /> {item}
                    </div>
                  )
                )}
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
                        <div className="text-sm text-white/50">Live receptionist</div>
                        <div className="text-lg font-semibold">Lyrex AI is active</div>
                      </div>
                    </div>
                    <div className="rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
                      Online
                    </div>
                  </div>

                  <div className="mt-8 space-y-4">
                    <div className="max-w-[82%] rounded-3xl rounded-tl-md border border-white/10 bg-white/7 p-4 text-sm text-white/88">
                      Thanks for calling Elite Fade Barbershop. How can I help you today?
                    </div>
                    <div className="ml-auto max-w-[82%] rounded-3xl rounded-tr-md border border-white/10 bg-white/12 p-4 text-sm text-white/85">
                      Can I get a fade tomorrow afternoon?
                    </div>
                    <div className="max-w-[82%] rounded-3xl rounded-tl-md border border-white/10 bg-white/7 p-4 text-sm text-white/88">
                      I have 3:30 PM open with Marcus. Want me to lock it in?
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Calls answered", value: "100%" },
                      { label: "Avg. pickup", value: "< 1s" },
                      { label: "Missed bookings", value: "$0" },
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

        {/* DEMO VIDEO */}
        <section id="demo" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="mx-auto max-w-3xl text-center">
            <SectionLabel>Watch The Demo</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              Hear Lyrex book a real appointment in 60 seconds.
            </h2>
            <p className="mt-4 text-white/65 leading-7">
              Watch a real customer call our AI receptionist, ask for an opening, and walk away with a booked appointment — all without a human picking up. This is exactly what your customers will experience.
            </p>
          </motion.div>

          <motion.div {...fadeUp} transition={{ duration: 0.8, delay: 0.1 }} className="mt-10">
            <Card className="relative overflow-hidden p-3 sm:p-4">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
                <video
                  className="aspect-video h-full w-full"
                  controls
                  playsInline
                  preload="metadata"
                  poster=""
                >
                  <source src={DEMO_VIDEO_URL} type="video/mp4" />
                </video>
              </div>
            </Card>

            <div className="mt-6 flex flex-wrap justify-center gap-3 text-sm text-white/70">
              {[
                "Real customer call",
                "Live calendar check",
                "Appointment confirmed",
              ].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2"
                >
                  <PlayCircle className="h-4 w-4" /> {item}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <a
                href="#pricing"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
              >
                Get Started <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#request-demo"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/25 hover:bg-white/[0.08]"
              >
                Book Demo
              </a>
            </div>
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
              Built specifically for US salons and barber shops that can't afford to miss another customer.
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
        </section>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              From ringing phone to booked appointment in seconds.
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-5 lg:grid-cols-5">
            {steps.map((step, index) => (
              <motion.div key={step} {...fadeUp} transition={{ duration: 0.65, delay: index * 0.05 }}>
                <Card className="relative h-full p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-black">
                    <span className="text-sm font-bold">0{index + 1}</span>
                  </div>
                  <div className="text-base font-medium text-white/88">{step}</div>
                  {index < steps.length - 1 && (
                    <ChevronRight className="absolute right-[-14px] top-1/2 hidden h-5 w-5 -translate-y-1/2 text-white/20 lg:block" />
                  )}
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* WHO WE SERVE */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <Card className="h-full p-7 sm:p-8">
                <SectionLabel>Who We Serve</SectionLabel>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                  Built for US salons and barber shops.
                </h2>
                <div className="mt-7 space-y-4">
                  {[
                    { icon: Users, text: "Hair Salons" },
                    { icon: Users, text: "Barber Shops" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                      <div
                        key={item.text}
                        className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-4"
                      >
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="text-lg font-medium">{item.text}</div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </motion.div>

            <motion.div {...fadeUp} transition={{ duration: 0.75, delay: 0.06 }}>
              <Card className="h-full p-7 sm:p-8">
                <SectionLabel>The Cost of a Missed Call</SectionLabel>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                  Every missed call = a booking your competitor takes.
                </h2>
                <p className="mt-4 leading-7 text-white/65">
                  The average salon misses 30% of incoming calls. At an average ticket of $45, that's thousands in lost revenue every month — and customers who book elsewhere instead.
                </p>
                <a
                  href="#pricing"
                  className="mt-7 inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
                >
                  Get Started <ArrowRight className="h-4 w-4" />
                </a>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* TRUST */}
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <SectionLabel>Why Shop Owners Trust Lyrex</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Reliable, professional, and always on.
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {trustItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  {...fadeUp}
                  transition={{ duration: 0.65, delay: index * 0.05 }}
                >
                  <Card className="h-full p-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/8">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-3 leading-7 text-white/60">{item.description}</p>
                  </Card>
                </motion.div>
              );
            })}
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
              Most shops make back their plan with just 1–2 saved bookings per month. No contracts. No setup fees.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 lg:grid-cols-3">
            {pricing.map((plan, index) => (
              <motion.div
                key={plan.name}
                {...fadeUp}
                transition={{ duration: 0.7, delay: index * 0.05 }}
              >
                <Card
                  className={`relative flex h-full flex-col p-7 sm:p-8 ${
                    plan.highlight
                      ? "border-white/30 bg-white/[0.07] shadow-[0_30px_120px_rgba(255,255,255,0.08)]"
                      : ""
                  }`}
                >
                  {plan.badge && (
                    <div className="absolute right-6 top-6 rounded-full border border-white/15 bg-white px-3 py-1 text-xs font-semibold text-black">
                      {plan.badge}
                    </div>
                  )}
                  <div className="text-lg font-medium">{plan.name}</div>
                  <div className="mt-4 flex items-end gap-1">
                    <div className="text-5xl font-semibold tracking-tight">{plan.price}</div>
                    <div className="pb-2 text-white/55">{plan.period}</div>
                  </div>
                  <p className="mt-4 text-white/60">{plan.description}</p>
                  <div className="mt-7 space-y-3">
                    {plan.features.map((item) => (
                      <div key={item} className="flex items-start gap-3 text-sm text-white/80">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <a
                    href="mailto:LyrexAI@gmail.com?subject=Lyrex%20-%20Get%20Started"
                    className={`mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold transition ${
                      plan.highlight
                        ? "bg-white text-black hover:scale-[1.01]"
                        : "border border-white/12 bg-white/5 text-white hover:border-white/25 hover:bg-white/[0.08]"
                    }`}
                  >
                    Get Started <ArrowRight className="h-4 w-4" />
                  </a>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center text-sm text-white/55">
            Not sure which plan? <a href="#request-demo" className="text-white underline-offset-4 hover:underline">Book a demo</a> and we'll recommend the right fit.
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
                    Want To See Lyrex In Action?
                  </h2>
                  <p className="mt-4 max-w-2xl text-white/65 leading-7">
                    Request a demo and we'll show you exactly how Lyrex answers calls, books appointments, and handles customer inquiries for your business.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {[
                      "Live walkthrough of your shop's setup",
                      "Hear the AI handle real calls",
                      "See bookings appear in Google Calendar",
                      "No pressure, no contracts",
                    ].map((item) => (
                      <div
                        key={item}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white/80"
                      >
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        <span className="text-sm">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Card className="p-6 sm:p-7">
                  <form onSubmit={handleRequestDemo} className="space-y-4">
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
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.01]"
                    >
                      Book Demo <ArrowRight className="h-4 w-4" />
                    </button>

                    <div className="text-center text-xs text-white/45">
                      We'll reach out within 1 business day to schedule your demo.
                    </div>
                  </form>
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
                <SectionLabel>Get Started Today</SectionLabel>
                <h2 className="mx-auto mt-5 max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                  Your next missed call could be your next best client.
                </h2>
                <p className="mx-auto mt-4 max-w-2xl leading-7 text-white/65">
                  Set up Lyrex in under 24 hours and never miss another booking.
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                  <a
                    href="#pricing"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
                  >
                    Get Started <ArrowRight className="h-4 w-4" />
                  </a>
                  <a
                    href="#request-demo"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/25 hover:bg-white/[0.08]"
                  >
                    Book Demo
                  </a>
                </div>
              </div>
            </Card>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-black/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div className="text-xl font-semibold">Lyrex</div>
              </div>
              <div className="mt-3 text-white/55">
                AI Receptionists for US Salons & Barber Shops
              </div>
            </div>
            <div className="text-sm text-white/45">
              <div>Email: <a href="mailto:LyrexAI@gmail.com" className="text-white/70 hover:text-white">LyrexAI@gmail.com</a></div>
              <div className="mt-2">© 2026 Lyrex. All Rights Reserved.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
