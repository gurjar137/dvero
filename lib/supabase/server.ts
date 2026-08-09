import { createClient, SupabaseClient } from '@supabase/supabase-js';

let defaultServerClient: SupabaseClient | null = null;

export function getSupabaseServerClient(token?: string | null): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (token) {
    return createClient(url, key, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  if (defaultServerClient) return defaultServerClient;
  defaultServerClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
  return defaultServerClient;
}

export const supabaseServer = getSupabaseServerClient();
