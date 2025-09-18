"use client";

export function EnvAlert() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (url && key) return null;
  
  return (
    <div className="bg-yellow-100 text-yellow-900 text-sm px-4 py-2">
      Supabase not configured. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local
    </div>
  );
}