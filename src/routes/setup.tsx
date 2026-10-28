import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
});
function parseOpeningHoursField(value: string) {
  const text = value.trim();
  if (!text) return {};

  if (text.startsWith("{")) {
    const parsed = JSON.parse(text);
    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      throw new Error("Opening hours must be a JSON object.");
    }
    return parsed;
  }

  const entries = text.split(/\r?\n/).filter(Boolean).map((line) => {
    const i = line.indexOf(":");
    if (i <= 0 || !line.slice(i + 1).trim()) {
      throw new Error(
        "Use one entry per line, e.g. Monday: 9 AM - 5 PM."
      );
    }
    return [line.slice(0, i).trim(), line.slice(i + 1).trim()];
  });

  return Object.fromEntries(entries);
}

function parseListField(value: string) {
  const text = value.trim();
  if (!text) return [];

  if (text.startsWith("[") || text.startsWith("{")) {
    return JSON.parse(text);
  }

  return text.split(/\r?\n/)
    .map((line) => line.trim().replace(/^[-•]\s*/, ""))
    .filter(Boolean);
}

function parseFaqsField(value: string) {
  const text = value.trim();
  if (!text) return [];

  if (text.startsWith("[") || text.startsWith("{")) {
    return JSON.parse(text);
  }

  return text.split(/\r?\n/).filter(Boolean).map((line) => {
    const i = line.indexOf("|");
    if (i <= 0 || !line.slice(i + 1).trim()) {
      throw new Error("Enter each FAQ as question | answer.");
    }
    return {
      question: line.slice(0, i).trim(),
      answer: line.slice(i + 1).trim(),
    };
  });
}
function SetupPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("salon");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("");
  const [instructions, setInstructions] = useState("");
  const [openingHours, setOpeningHours] = useState("");
const [services, setServices] = useState("");
const [staff, setStaff] = useState("");
const [faqs, setFaqs] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadBusiness() {
      try {
        const { data: auth, error: authError } =
          await supabase.auth.getUser();

        if (authError || !auth.user) {
          window.location.href = "/account";
          return;
        }

        const { data, error } = await supabase
          .from("businesses")
        .select(
         "id,business_name,business_type,phone,email,address,timezone,receptionist_instructions,opening_hours,services,staff,faqs"
          )
          .eq("owner_id", auth.user.id)
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (cancelled) return;

        if (data) {
          setBusinessId(data.id);
          setBusinessName(data.business_name ?? "");
          setBusinessType(data.business_type ?? "salon");
          setPhone(data.phone ?? "");
          setEmail(data.email ?? "");
          setAddress(data.address ?? "");
          setTimezone(data.timezone ?? "");
          setInstructions(data.receptionist_instructions ?? "");
          setOpeningHours(
  data.opening_hours && typeof data.opening_hours === "object"
    ? Object.entries(data.opening_hours as Record<string, unknown>)
        .map(([day, hours]) => `${day}: ${String(hours)}`)
        .join("\n")
    : String(data.opening_hours ?? "")
);

setServices(
  data.services == null
    ? ""
    : Array.isArray(data.services) && data.services.every((item: unknown) => typeof item === "string")
      ? data.services.join("\n")
      : JSON.stringify(data.services, null, 2)
);

setStaff(
  data.staff == null
    ? ""
    : Array.isArray(data.staff) && data.staff.every((item: unknown) => typeof item === "string")
      ? data.staff.join("\n")
      : JSON.stringify(data.staff, null, 2)
);

setFaqs(
  data.faqs == null
    ? ""
    : JSON.stringify(data.faqs, null, 2)
);
        }
      } catch (error) {
       if (!cancelled) {
  const detail =
    typeof error === "object" &&
    error !== null &&
    "message" in error
      ? String(error.message)
      : error instanceof Error
        ? error.message
        : String(error);

  setMessage(`Could not load your business details: ${detail}`);
}
        
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadBusiness();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const { data: auth, error: authError } =
        await supabase.auth.getUser();

      if (authError || !auth.user) {
        window.location.href = "/account";
        return;
      }

      const payload = {
        owner_id: auth.user.id,
        business_name: businessName.trim(),
        business_type: businessType,
        phone: phone.trim() || null,
        email: email.trim() || null,
        address: address.trim() || null,
        timezone: timezone.trim(),
        receptionist_instructions: instructions.trim() || null,
        opening_hours: parseOpeningHoursField(openingHours),
services: parseListField(services),
staff: parseListField(staff),
faqs: parseFaqsField(faqs),
        updated_at: new Date().toISOString(),
      };

      const result = businessId
        ? await supabase
            .from("businesses")
            .update(payload)
            .eq("id", businessId)
            .select("id")
            .single()
        : await supabase
            .from("businesses")
            .insert(payload)
            .select("id")
            .single();

      if (result.error) throw result.error;

      setBusinessId(result.data.id);
      setMessage(
        "Business details saved. Subscription verification and receptionist activation are still pending."
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not save your business details."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#030306] px-5 py-12 text-white">
      <section className="mx-auto max-w-xl rounded-2xl border border-white/10 bg-white/[0.03] p-7">
        <a href="/" className="text-sm text-white/60 hover:text-white">
          ← Back to Febily
        </a>

        <h1 className="mt-7 text-3xl font-semibold">
          Set up your salon
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/60">
          Add your business details so we can prepare your personalized AI
          receptionist.
        </p>

        {loading ? (
          <p className="mt-6 text-sm text-white/70">
            Loading your business details...
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-7 space-y-4">
            <label className="block text-sm">
              Business name *
              <input
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400"
                placeholder="Your salon or barbershop"
              />
            </label>

            <label className="block text-sm">
              Business type *
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-[#101014] px-4 py-3 outline-none focus:border-emerald-400"
              >
                <option value="salon">Salon</option>
                <option value="barbershop">Barbershop</option>
                <option value="other">Other</option>
              </select>
            </label>

            <label className="block text-sm">
              Business phone
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400"
                placeholder="+1..."
              />
            </label>

            <label className="block text-sm">
              Business email
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400"
                placeholder="Your business email"
              />
            </label>

            <label className="block text-sm">
              Business address
              <input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400"
                placeholder="Street, city, state"
              />
            </label>

            <label className="block text-sm">
              Time zone *
              <input
                required
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400"
                placeholder="e.g. America/New_York"
              />
            </label>

            <label className="block text-sm">
              Receptionist instructions
              <textarea
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                rows={4}
                className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400"
                placeholder="Services, booking rules, and how the receptionist should greet callers"
              />
            </label>

            <label className="block text-sm">
  Opening hours
  <textarea
    value={openingHours}
    onChange={(e) => setOpeningHours(e.target.value)}
    rows={4}
    className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400"
    placeholder={"Monday: 9 AM - 5 PM\nTuesday: 9 AM - 5 PM\nWednesday: Closed"}
  />
</label>

<label className="block text-sm">
  Services and prices
  <textarea
    value={services}
    onChange={(e) => setServices(e.target.value)}
    rows={4}
    className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400"
    placeholder={"Haircut - $25\nBeard trim - $15"}
  />
</label>

<label className="block text-sm">
  Staff members
  <textarea
    value={staff}
    onChange={(e) => setStaff(e.target.value)}
    rows={3}
    className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400"
    placeholder={"John - Barber\nSarah - Stylist"}
  />
</label>

<label className="block text-sm">
  Frequently asked questions
  <textarea
    value={faqs}
    onChange={(e) => setFaqs(e.target.value)}
    rows={4}
    className="mt-2 w-full rounded-xl border border-white/15 bg-black/30 px-4 py-3 outline-none focus:border-emerald-400"
    placeholder={"Do you accept walk-ins? | Yes, subject to availability."}
  />
</label><button
              type="submit"
              disabled={saving}
              className="w-full rounded-xl bg-white px-4 py-3 font-semibold text-black disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save business details"}
            </button>
          </form>
        )}

        {message && (
          <p role="status" className="mt-5 break-words text-sm text-emerald-300">
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
