"use client";
import { DEV_SUPABASE_URL, DEV_SUPABASE_ANON_KEY } from "@/config/dev";

export function SupabaseEnvBanner() {
  const hasEnv =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  const hasFallback = Boolean(DEV_SUPABASE_URL) && Boolean(DEV_SUPABASE_ANON_KEY);

  // If we have either env or our dev fallback, show nothing.
  if (hasEnv || hasFallback) return null;

  // Only render if truly nothing is configured (should never happen now)
  return (
    <div className="w-full bg-yellow-100 text-yellow-900 text-sm px-3 py-2">
      Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
    </div>
  );
}