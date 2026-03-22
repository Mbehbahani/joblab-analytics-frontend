import { createClient } from "@supabase/supabase-js";

// Server-side Supabase client (for API routes)
// Uses service_role key - never expose to browser
export function createServerClient() {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key);
}

// Client-side Supabase client (for browser, uses anon key)
// Safe for browser - limited by RLS policies
let clientInstance: ReturnType<typeof createClient> | null = null;

export function createBrowserClient() {
  if (clientInstance) return clientInstance;
  
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  clientInstance = createClient(url, key);
  return clientInstance;
}
