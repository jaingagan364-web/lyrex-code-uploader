import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";

export const Route = createFileRoute("/setup")({
  component: SetupPage,
});

function SetupPage() {
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("salon");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [timezone, setTimezone] = useState("");
  const [instructions, setInstructions] = useState("");
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
            "id,business_name,business_type,phone,email,address,timezone,receptionist_instructions"
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
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(
            error instanceof Error
              ? error.message
              : "Could not load your business details."
          );
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

            <button
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
