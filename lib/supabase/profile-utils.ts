import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

type SupabaseClientType = SupabaseClient<Database>;

/**
 * Ensures a user profile exists in the profiles table.
 * This is required before creating any records that reference profiles.owner_id
 *
 * @param supabase - Supabase client instance
 * @param user - Authenticated user from supabase.auth.getUser()
 * @returns Promise that resolves to null on success, or error message on failure
 */
export async function ensureUserProfile(
  supabase: SupabaseClientType,
  user: { id: string; email?: string }
): Promise<string | null> {
  const { error } = await (supabase.from("profiles") as any).upsert(
    {
      id: user.id,
      email: user.email || "",
      role: "customer" as const,
    },
    {
      onConflict: "id",
    }
  );

  return error?.message || null;
}
