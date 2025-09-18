"use client";

import {
  createClient as createSupabaseClient,
  SupabaseClient,
} from "@supabase/supabase-js";
import { DEV_SUPABASE_URL, DEV_SUPABASE_ANON_KEY } from "@/config/dev";

let _client: SupabaseClient | null = null;

export function getBrowserSupabase(): SupabaseClient {
  if (_client) return _client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || DEV_SUPABASE_URL;
  const anon =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEV_SUPABASE_ANON_KEY;

  _client = createSupabaseClient(url, anon, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      storageKey: "sb-tmf",
    },
  });

  return _client;
}

// Export alias for compatibility
export const createClient = getBrowserSupabase;
