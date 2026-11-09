import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

function supabaseUrl(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!value) throw new Error("Missing Supabase URL. Connect Supabase in Hostinger and set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL.");
  return value;
}

export function getSupabasePublicKey(): string {
  const value = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.SUPABASE_ANON_KEY
    || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!value) throw new Error("Missing Supabase publishable/anon key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY.");
  return value;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (adminClient) return adminClient;

  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SECRET_KEY
    || process.env.SUPABASE_SERVICE_KEY;

  if (!secret) {
    throw new Error("Missing server-only Supabase key. Set SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SECRET_KEY) in Hostinger Environment Variables.");
  }

  adminClient = createClient(supabaseUrl(), secret, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });

  return adminClient;
}

export function getSupabaseUrl(): string {
  return supabaseUrl();
}
