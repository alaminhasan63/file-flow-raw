import { redirect } from "next/navigation";
import { getServerSupabase } from "@/lib/supabase/server";

export async function requireAuth() {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireAdminOrOps() {
  const user = await requireAuth();
  const supabase = getServerSupabase();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();
  if (!profile || !["admin", "ops"].includes(profile.role)) {
    redirect("/app/dashboard");
  }
  return { user, email: profile.email, role: profile.role };
}
