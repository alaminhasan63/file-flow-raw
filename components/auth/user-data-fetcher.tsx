import { getServerSupabase } from "@/lib/supabase/server";

export async function UserDataFetcher() {
  try {
    const supabase = getServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    return user?.email || null;
  } catch (error) {
    // If there's an error fetching user data, return null
    console.error('Error fetching user data:', error);
    return null;
  }
}