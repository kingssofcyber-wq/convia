import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/admin";

export interface VerifiedAdsAdmin {
  id: string;
  email: string;
}

export async function requireAdsAdmin(request: NextRequest): Promise<VerifiedAdsAdmin> {
  const header = request.headers.get("authorization") || "";
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new Error("AUTH_REQUIRED");

  const allowedEmails = (process.env.CONVIA_ADS_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  if (allowedEmails.length === 0) {
    throw new Error("ADMIN_ALLOWLIST_NOT_CONFIGURED");
  }

  const authClient = createClient(getSupabaseUrl(), getSupabasePublicKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  const { data, error } = await authClient.auth.getUser(match[1]);
  if (error || !data.user?.email) throw new Error("AUTH_REQUIRED");

  const email = data.user.email.toLowerCase();
  if (!allowedEmails.includes(email)) throw new Error("ADMIN_NOT_ALLOWED");

  return { id: data.user.id, email };
}

export function authErrorResponse(error: unknown): { status: number; message: string } {
  const code = error instanceof Error ? error.message : "";
  if (code === "AUTH_REQUIRED") return { status: 401, message: "Please sign in again." };
  if (code === "ADMIN_NOT_ALLOWED") return { status: 403, message: "This Supabase account is not in CONVIA_ADS_ADMIN_EMAILS." };
  if (code === "ADMIN_ALLOWLIST_NOT_CONFIGURED") return { status: 503, message: "Set CONVIA_ADS_ADMIN_EMAILS in your environment variables." };
  return { status: 500, message: "Admin authentication is not configured correctly." };
}
