import { createClient } from "@supabase/supabase-js";

const DEV_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mfwgplusymrrmdrvnulw.supabase.co";
const DEV_SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getAdminSupabase() {
  if (!DEV_URL || !DEV_SERVICE) throw new Error("Missing Supabase service env");
  // Never used on the client; route handlers only.
  return createClient(DEV_URL, DEV_SERVICE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}