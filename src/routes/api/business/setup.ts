import { createClient } from "@supabase/supabase-js";
import { createFileRoute } from "@tanstack/react-router";

const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: { "cache-control": "no-store" } });

type SetupPayload = {
  business_name?: unknown;
  business_type?: unknown;
  phone?: unknown;
  email?: unknown;
  address?: unknown;
  timezone?: unknown;
  receptionist_instructions?: unknown;
  opening_hours?: unknown;
  services?: unknown;
  staff?: unknown;
  faqs?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function optionalText(value: unknown, field: string, maxLength: number): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.length > maxLength) {
    throw new Error(`${field} is invalid or too long.`);
  }
  return value.trim() || null;
}

function validateJsonValue(value: unknown, field: string): unknown {
  if (value == null) return field === "opening_hours" ? {} : [];
  if (typeof value !== "object") throw new Error(`${field} must be structured JSON data.`);
  if (JSON.stringify(value).length > 20000) throw new Error(`${field} is too large.`);
  return value;
}

function validateTimezone(value: unknown): string {
  if (typeof value !== "string" || value.trim().length > 100) {
    throw new Error("Enter a valid IANA time zone, such as America/New_York.");
  }
  const timezone = value.trim();
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone });
  } catch {
    throw new Error("Enter a valid IANA time zone, such as America/New_York.");
  }
  return timezone;
}

export const Route = createFileRoute("/api/business/setup")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const authorization = request.headers.get("authorization");
        const match = authorization?.match(/^Bearer\s+(\S+)$/i);
        const accessToken = match?.[1];
        if (!accessToken) return json({ error: "A signed-in session is required." }, 401);

        const contentLength = Number(request.headers.get("content-length") ?? "0");
        if (contentLength > 64 * 1024) return json({ error: "Setup data is too large." }, 413);

        const supabaseUrl = process.env["SUPABASE_URL"];
        const supabaseSecretKey = process.env["SUPABASE_SECRET_KEY"];
        if (!supabaseUrl || !supabaseSecretKey) {
          console.error("[business-setup] Supabase server configuration is missing");
          return json({ error: "Business setup is temporarily unavailable." }, 503);
        }

        try {
          const payload = (await request.json()) as SetupPayload;
          const businessName = optionalText(payload.business_name, "Business name", 120);
          if (!businessName) return json({ error: "Business name is required." }, 400);

          const businessType = payload.business_type;
          if (businessType !== "salon" && businessType !== "barbershop" && businessType !== "other") {
            return json({ error: "Select a valid business type." }, 400);
          }

          const timezone = validateTimezone(payload.timezone);
          const openingHours = validateJsonValue(payload.opening_hours, "Opening hours");
          if (!isRecord(openingHours)) return json({ error: "Opening hours must be an object." }, 400);

          const services = validateJsonValue(payload.services, "Services");
          const staff = validateJsonValue(payload.staff, "Staff");
          const faqs = validateJsonValue(payload.faqs, "FAQs");

          const phone = optionalText(payload.phone, "Business phone", 40);
          const email = optionalText(payload.email, "Business email", 254);
          if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return json({ error: "Enter a valid business email address." }, 400);
          }

          const address = optionalText(payload.address, "Business address", 500);
          const instructions = optionalText(
            payload.receptionist_instructions,
            "Receptionist instructions",
            4000,
          );

          const supabase = createClient(supabaseUrl, supabaseSecretKey, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
          });

          const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
          if (authError || !authData.user) {
            return json({ error: "Your sign-in session is invalid or expired." }, 401);
          }

          const userId = authData.user.id;
          const { data: existingBusinesses, error: businessLookupError } = await supabase
            .from("businesses")
            .select("id")
            .eq("owner_id", userId)
            .limit(2);

          if (businessLookupError) throw businessLookupError;
          if ((existingBusinesses?.length ?? 0) > 1) {
            return json({ error: "Multiple business profiles exist for this account. Contact support before continuing." }, 409);
          }

          const businessPayload = {
            owner_id: userId,
            business_name: businessName,
            business_type: businessType,
            phone,
            email,
            address,
            timezone,
            receptionist_instructions: instructions,
            opening_hours: openingHours,
            services,
            staff,
            faqs,
            updated_at: new Date().toISOString(),
          };

          let businessId: string;
          if (existingBusinesses?.[0]) {
            const { data, error } = await supabase
              .from("businesses")
              .update(businessPayload)
              .eq("id", existingBusinesses[0].id)
              .eq("owner_id", userId)
              .select("id")
              .single();
            if (error) throw error;
            businessId = data.id;
          } else {
            const { data, error } = await supabase
              .from("businesses")
              .insert(businessPayload)
              .select("id")
              .single();
            if (error) throw error;
            businessId = data.id;
          }

          const now = new Date().toISOString();
          const { data: activeSubscriptions, error: subscriptionError } = await supabase
            .from("subscriptions")
            .select("id,business_id")
            .eq("user_id", userId)
            .eq("status", "active")
            .not("paddle_subscription_id", "is", null)
            .gt("current_period_end", now)
            .limit(2);

          if (subscriptionError) throw subscriptionError;

          if (!activeSubscriptions?.length) {
            return json({
              success: true,
              businessId,
              subscriptionLinked: false,
              pending: true,
              message: "Business details saved. We are waiting for Paddle to confirm an active, unexpired subscription before activating your receptionist.",
            });
          }

          if (activeSubscriptions.length !== 1) {
            return json({
              success: true,
              businessId,
              subscriptionLinked: false,
              pending: true,
              message: "Business details saved. More than one eligible subscription needs review before receptionist activation.",
            });
          }

          const subscription = activeSubscriptions[0];
          if (subscription.business_id && subscription.business_id !== businessId) {
            return json({
              success: true,
              businessId,
              subscriptionLinked: false,
              pending: true,
              message: "Business details saved, but the subscription is already linked to a different business. Contact support before activation.",
            });
          }

          if (!subscription.business_id) {
            const { data: linked, error: linkError } = await supabase
              .from("subscriptions")
              .update({ business_id: businessId, updated_at: new Date().toISOString() })
              .eq("id", subscription.id)
              .eq("user_id", userId)
              .is("business_id", null)
              .select("id")
              .maybeSingle();

            if (linkError) throw linkError;

            if (!linked) {
              const { data: reloaded, error: reloadError } = await supabase
                .from("subscriptions")
                .select("business_id")
                .eq("id", subscription.id)
                .eq("user_id", userId)
                .maybeSingle();

              if (reloadError) throw reloadError;
              if (reloaded?.business_id !== businessId) {
                return json({
                  success: true,
                  businessId,
                  subscriptionLinked: false,
                  pending: true,
                  message: "Business details saved, but the subscription link changed concurrently. Please contact support before activation.",
                });
              }
            }
          }

          return json({
            success: true,
            businessId,
            subscriptionLinked: true,
            pending: false,
            message: "Business details saved and linked to your verified active subscription. Receptionist provisioning is the next step.",
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Could not save business details.";
          console.error("[business-setup] Request failed", message);
          return json({ error: message }, 400);
        }
      },
    },
  },
});
