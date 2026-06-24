
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
} from "lucide-react";

const DEMO_VIDEO_URL = "/demo.mp4";

const fadeUp = {
  initial: { opacity: 0, y: 28 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.25 },
  transition: { duration: 0.7, ease: "easeOut" },
};

const features = [
  {
    icon: PhoneCall,
    title: "24/7 Call Answering",
    description: "Never miss another customer call, even outside business hours.",
  },
  {
    icon: CalendarDays,
    title: "Appointment Booking",
    description: "Automatically schedule appointments directly into your calendar.",
  },
  {
    icon: LayoutGrid,
    title: "Google Calendar Integration",
    description: "Real-time availability checking and appointment management.",
  },
  {
    icon: Mic,
    title: "Natural Human-Like Conversations",
    description: "Professional AI voices that interact naturally with customers.",
  },
  {
    icon: Sparkles,
    title: "Reduce Missed Bookings",
    description: "Capture opportunities that would otherwise be lost.",
  },
  {
    icon: Bot,
    title: "Custom Business Knowledge",
    description: "The AI learns your services, pricing, and business information.",
  },
];

const steps = [
  "Customer Calls",
  "AI Answers Instantly",
  "AI Checks Availability",
  "Appointment Gets Booked",
  "Booking Appears On Your Calendar",
];

const benefits = [
  "Available 24/7",
  "Never Miss A Lead",
  "Save Staff Time",
  "Increase Appointment Bookings",
  "Professional Customer Experience",
  "Fast Setup",
  "Affordable Pricing",
  "Scalable For Growing Businesses",
];

const pricing = [
  {
    name: "Starter",
    price: "$29",
    period: "/month",
    description: "Perfect for small salons and barbershops getting started.",
    features: [
      "AI Receptionist",
      "Appointment Scheduling",
      "Calendar Integration",
      "Basic Business Information",
      "Email Support",
    ],
    highlight: false,
  },
  {
    name: "Growth",
    price: "$79",
    period: "/month",
    description: "Best for businesses ready to capture more bookings 24/7.",
    features: [
      "Everything in Starter",
      "24/7 Call Handling",
      "Advanced Appointment Management",
      "Customized Business Knowledge",
      "Priority Support",
      "Enhanced Conversation Flows",
    ],
    highlight: true,
    badge: "Most Popular",
  },
  {
    name: "Premium",
    price: "$149",
    period: "/month",
    description: "For multi-location brands and teams that need more control.",
    features: [
      "Everything in Growth",
      "Fully Customized AI Assistant",
      "Advanced Scheduling Workflows",
      "Multi-Location Support",
      "Dedicated Setup Assistance",
      "Priority Feature Requests",
    ],
    highlight: false,
  },
];

const outcomes = [
  {
    icon: ShieldCheck,
    title: "More trust",
    description: "Premium UX and clear messaging make Lyrex feel reliable at first glance.",
    stat: "Professional",
  },
  {
    icon: Clock3,
    title: "Faster response",
    description: "Customers get answers instantly instead of waiting for a callback.",
    stat: "24/7",
  },
  {
    icon: MessageSquareMore,
    title: "Clearer conversations",
    description: "The receptionist handles simple questions and booking flow naturally.",
    stat: "Human-like",
  },
];

const faqs = [
  {
    q: "Does the AI answer calls 24/7?",
    a: "Yes, Lyrex operates around the clock.",
  },
  {
    q: "Can it book appointments automatically?",
    a: "Yes, appointments are scheduled directly into your calendar.",
  },
  {
    q: "Does it work for salons and barber shops?",
    a: "Absolutely. Lyrex is designed for appointment-based businesses.",
  },
  {
    q: "Is setup complicated?",
    a: "No. We handle the setup process for you.",
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
    const volume = String(formData.get("volume") || "").trim();
    const message = String(formData.get("message") || "").trim();

    const subject = encodeURIComponent(
      `Lyrex demo request${business ? ` — ${business}` : ""}`
    );

    const body = encodeURIComponent(
      [
        `Name: ${name}`,
        `Business: ${business}`,
        `Email: ${email}`,
        `Phone: ${phone}`,
        `Monthly call volume: ${volume}`,
        "",
        `Message:`,
        message,
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
            <a href="#demo" className="transition hover:text-white">
              Demo
            </a>
            <a href="#features" className="transition hover:text-white">
              Features
            </a>
            <a href="#pricing" className="transition hover:text-white">
              Pricing
            </a>
            <a href="#faq" className="transition hover:text-white">
              FAQ
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <a
              href="#request-demo"
              className="hidden rounded-full border border-white/10 px-4 py-2 text-sm text-white/80 transition hover:border-white/20 hover:bg-white/5 sm:inline-flex"
            >
              Request Demo
            </a>
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
        <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
            <motion.div {...fadeUp}>
              <SectionLabel>24/7 AI Receptionists for Salons & Barber Shops</SectionLabel>
              <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-balance sm:text-6xl lg:text-7xl">
                Never Miss Another Booking
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/72 sm:text-xl">
                AI receptionists that answer calls, schedule appointments, and support your customers 24/7.
              </p>
              <p className="mt-5 max-w-2xl text-base leading-7 text-white/55 sm:text-lg">
                Your customers deserve instant responses. Lyrex answers calls, schedules appointments, and manages inquiries even when you&apos;re closed.
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
                  Request Demo
                </a>
              </div>

              <div className="mt-10 flex flex-wrap gap-3 text-sm text-white/65">
                {["Professional setup", "Calendar sync", "Built for appointment businesses"].map(
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

            <motion.div {...fadeUp} transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}>
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
                      Thank you for calling Elite Fade Barbershop. How can I help you today?
                    </div>
                    <div className="ml-auto max-w-[82%] rounded-3xl rounded-tr-md border border-white/10 bg-white/12 p-4 text-sm text-white/85">
                      I need to book a haircut for tomorrow afternoon.
                    </div>
                    <div className="max-w-[82%] rounded-3xl rounded-tl-md border border-white/10 bg-white/7 p-4 text-sm text-white/88">
                      I can help with that. I checked availability and found a 3:30 PM slot. Would you like me to confirm it?
                    </div>
                  </div>

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {[
                      { label: "Answering calls", value: "24/7" },
                      { label: "Appointments booked", value: "Instantly" },
                      { label: "Missed calls", value: "Reduced" },
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

        <section id="demo" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] lg:items-stretch">
            <motion.div {...fadeUp}>
              <Card className="h-full p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <Star className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm uppercase tracking-[0.24em] text-white/45">
                      Demo
                    </div>
                    <h2 className="text-2xl font-semibold sm:text-3xl">
                      See Lyrex handle a real booking flow.
                    </h2>
                  </div>
                </div>

                <div className="mt-6 overflow-hidden rounded-3xl border border-white/10 bg-black">
                  <video
                    className="h-full w-full"
                    controls
                    playsInline
                    preload="metadata"
                    poster=""
                  >
                    <source src={DEMO_VIDEO_URL} type="video/mp4" />
                  </video>
                </div>

                <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/65">
                  {[
                    "Customer asks for availability",
                    "AI checks calendar",
                    "Appointment gets booked",
                  ].map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2"
                    >
                      <CheckCircle2 className="h-4 w-4" /> {item}
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>

            <motion.div {...fadeUp} transition={{ duration: 0.75, delay: 0.05 }}>
              <Card className="h-full p-6 sm:p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10">
                    <MessageSquareMore className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-sm uppercase tracking-[0.24em] text-white/45">
                      Demo script
                    </div>
                    <h3 className="text-2xl font-semibold">What the customer hears</h3>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/85">
                    Customer: Hi, I&apos;d like to book a haircut tomorrow.
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/85">
                    Lyrex: Absolutely. Let me check availability.
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/85">
                    Lyrex: I have openings at 2:00 PM and 3:30 PM. Which time works best?
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/85">
                    Customer: 3:30 PM works.
                  </div>
                  <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-white/85">
                    Lyrex: Perfect. Your appointment is booked for 3:30 PM tomorrow.
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <SectionLabel>Features</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Everything you need to convert more calls into bookings.
            </h2>
            <p className="mt-4 text-white/60">
              A premium AI receptionist built for busy salon and barber shop teams that need a polished customer experience.
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

        <section id="how-it-works" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <SectionLabel>How It Works</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple for your team. Seamless for your customers.
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

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div {...fadeUp}>
              <Card className="h-full p-7 sm:p-8">
                <SectionLabel>Who We Serve</SectionLabel>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                  Built for appointment-driven businesses.
                </h2>
                <div className="mt-7 space-y-4">
                  {[
                    { icon: Users, text: "Salons" },
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
                <SectionLabel>Why Choose Lyrex?</SectionLabel>
                <h2 className="mt-5 text-3xl font-semibold tracking-tight">
                  Premium value that helps you book more clients.
                </h2>
                <div className="mt-7 grid gap-3 sm:grid-cols-2">
                  {benefits.map((item) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-white/80"
                    >
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <SectionLabel>Trust</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Designed to feel premium and clear from the first visit.
            </h2>
          </motion.div>

          <div className="mt-10 grid gap-5 lg:grid-cols-3">
            {outcomes.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.title}
                  {...fadeUp}
                  transition={{ duration: 0.65, delay: index * 0.05 }}
                >
                  <Card className="h-full p-6">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/8">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-medium text-white/65">
                        {item.stat}
                      </div>
                    </div>
                    <h3 className="mt-5 text-xl font-semibold">{item.title}</h3>
                    <p className="mt-3 leading-7 text-white/60">{item.description}</p>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp} className="max-w-2xl">
            <SectionLabel>Pricing</SectionLabel>
            <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
              Simple pricing that scales as you grow.
            </h2>
            <p className="mt-4 text-white/60">Choose the plan that fits your booking volume and team size.</p>
          </motion.div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {pricing.map((plan, index) => (
              <motion.div
                key={plan.name}
                {...fadeUp}
                transition={{ duration: 0.7, delay: index * 0.05 }}
              >
                <Card
                  className={`relative h-full p-7 sm:p-8 ${
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
                      <div key={item} className="flex items-center gap-3 text-sm text-white/80">
                        <CheckCircle2 className="h-4 w-4 shrink-0" />
                        {item}
                      </div>
                    ))}
                  </div>
                  <a
                    href="#request-demo"
                    className={`mt-8 inline-flex w-full items-center justify-center rounded-full px-5 py-3.5 text-sm font-semibold transition ${
                      plan.highlight
                        ? "bg-white text-black hover:scale-[1.01]"
                        : "border border-white/12 bg-white/5 text-white hover:border-white/25 hover:bg-white/[0.08]"
                    }`}
                  >
                    Get Started
                  </a>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        <section id="request-demo" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp}>
            <Card className="relative overflow-hidden p-8 sm:p-10 lg:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_30%)]" />
              <div className="relative z-10 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
                <div>
                  <SectionLabel>Request Demo</SectionLabel>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Ready To Automate Your Bookings?
                  </h2>
                  <p className="mt-4 max-w-2xl text-white/60 leading-7">
                    Contact us today and see how Lyrex can help your business save time and capture more appointments.
                  </p>

                  <div className="mt-8 grid gap-4 sm:grid-cols-2">
                    {[
                      "Available 24/7",
                      "Never miss a lead",
                      "Professional customer experience",
                      "Fast setup for businesses",
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
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        name="name"
                        required
                        placeholder="Full name"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
                      />
                      <input
                        name="business"
                        required
                        placeholder="Business name"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
                      />
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        name="email"
                        type="email"
                        required
                        placeholder="Email address"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
                      />
                      <input
                        name="phone"
                        type="tel"
                        required
                        placeholder="Phone number"
                        className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
                      />
                    </div>

                    <input
                      name="volume"
                      placeholder="Monthly call volume"
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
                    />

                    <textarea
                      name="message"
                      rows={5}
                      placeholder="Tell us about your salon or barber shop and what you'd like Lyrex to handle."
                      className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
                    />

                    <button
                      type="submit"
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.01]"
                    >
                      Request Demo <ArrowRight className="h-4 w-4" />
                    </button>

                    <div className="text-center text-xs text-white/45">
                      This will open your email app with the demo request filled in.
                    </div>
                  </form>
                </Card>
              </div>
            </Card>
          </motion.div>
        </section>

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

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <motion.div {...fadeUp}>
            <Card className="relative overflow-hidden p-8 sm:p-10 lg:p-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.14),_transparent_30%)]" />
              <div className="relative z-10 grid gap-10 lg:grid-cols-[1.3fr_0.7fr] lg:items-center">
                <div>
                  <SectionLabel>Contact</SectionLabel>
                  <h2 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Ready To Automate Your Bookings?
                  </h2>
                  <p className="mt-4 max-w-2xl leading-7 text-white/60">
                    Contact us today and see how Lyrex can help your business save time and capture more appointments.
                  </p>

                  <div className="mt-8 flex flex-col gap-4 sm:flex-row">
                    <a
                      href="mailto:LyrexAI@gmail.com"
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black transition hover:scale-[1.02]"
                    >
                      Get Started <ArrowRight className="h-4 w-4" />
                    </a>
                    <a
                      href="mailto:LyrexAI@gmail.com"
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/5 px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:border-white/25 hover:bg-white/[0.08]"
                    >
                      Email LyrexAI@gmail.com
                    </a>
                  </div>
                </div>

                <Card className="p-6 sm:p-7">
                  <div className="text-sm uppercase tracking-[0.24em] text-white/45">Email</div>
                  <div className="mt-3 text-2xl font-semibold">LyrexAI@gmail.com</div>
                  <div className="mt-6 border-t border-white/10 pt-6">
                    <div className="text-sm uppercase tracking-[0.24em] text-white/45">
                      Primary Action
                    </div>
                    <div className="mt-3 text-xl font-medium">Get Started</div>
                  </div>
                </Card>
              </div>
            </Card>
          </motion.div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-black/40">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div>
              <div className="text-xl font-semibold">Lyrex</div>
              <div className="mt-2 text-white/55">
                AI Receptionists For Modern Salon & Barber Businesses
              </div>
            </div>
            <div className="text-sm text-white/45">
              <div>Email: LyrexAI@gmail.com</div>
              <div className="mt-2">© 2026 Lyrex. All Rights Reserved.</div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

