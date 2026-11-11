import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export type ServerSupabase = SupabaseClient;

export function createServerSupabase(): ServerSupabase {
  const url = process.env["SUPABASE_URL"];
  const key = process.env["SUPABASE_SECRET_KEY"];
  if (!url || !key) throw new Error("Supabase server configuration is incomplete.");
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

export function getBearerToken(request: Request): string | null {
  return request.headers.get("authorization")?.match(/^Bearer\s+(\S+)$/i)?.[1] ?? null;
}

export async function requireUser(supabase: ServerSupabase, request: Request) {
  const token = getBearerToken(request);
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user;
}

export async function getSingleOwnedBusiness(supabase: ServerSupabase, ownerId: string) {
  const { data, error } = await supabase
    .from("businesses")
    .select("id,owner_id,business_name,timezone")
    .eq("owner_id", ownerId)
    .limit(2);
  if (error) throw error;
  if (!data?.length) return { business: null, reason: "not_found" as const };
  if (data.length !== 1) return { business: null, reason: "multiple" as const };
  return { business: data[0], reason: null };
}

export async function requireOneActiveSubscription(
  supabase: ServerSupabase,
  ownerId: string,
  businessId: string,
) {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("user_id", ownerId)
    .eq("business_id", businessId)
    .eq("status", "active")
    .not("paddle_subscription_id", "is", null)
    .gt("current_period_end", now)
    .limit(2);
  if (error) throw error;
  return data?.length === 1;
}

export function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function encryptionKey(): Buffer {
  const encoded = process.env["GOOGLE_TOKEN_ENCRYPTION_KEY"];
  if (!encoded) throw new Error("Google Calendar token encryption is not configured.");
  const key = Buffer.from(encoded, "base64");
  if (key.length !== 32) {
    throw new Error("GOOGLE_TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes.");
  }
  return key;
}

export function encryptRefreshToken(refreshToken: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(refreshToken, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();
  return [
    "v1",
    iv.toString("base64url"),
    tag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptRefreshToken(payload: string): string {
  const [version, ivText, tagText, dataText] = payload.split(".");
  if (version !== "v1" || !ivText || !tagText || !dataText) {
    throw new Error("Stored Google Calendar credential has an unsupported format.");
  }
  const decipher = createDecipheriv(
    "aes-256-gcm",
    encryptionKey(),
    Buffer.from(ivText, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(tagText, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(dataText, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function googleOAuthConfig() {
  const clientId = process.env["GOOGLE_OAUTH_CLIENT_ID"];
  const clientSecret = process.env["GOOGLE_OAUTH_CLIENT_SECRET"];
  const redirectUri = process.env["GOOGLE_OAUTH_REDIRECT_URI"];
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("Google Calendar OAuth is not configured.");
  }
  const parsed = new URL(redirectUri);
  if (
    parsed.protocol !== "https:" &&
    process.env["VERCEL_ENV"] !== "development"
  ) {
    throw new Error("Google Calendar OAuth redirect URI must use HTTPS.");
  }
  return { clientId, clientSecret, redirectUri };
}

export function validateIanaTimezone(value: unknown): value is string {
  if (typeof value !== "string" || !value.trim()) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value }).format();
    return true;
  } catch {
    return false;
  }
}
