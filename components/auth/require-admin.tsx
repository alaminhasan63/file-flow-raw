"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const supabase = getBrowserSupabase();
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/sign-in?next=/admin"); return; }
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (error || !data || !["admin", "ops"].includes(String(data.role))) {
        router.replace("/app"); return;
      }
      if (mounted) setOk(true);
    })();
    return () => { mounted = false; };
  }, [router, supabase]);

  if (!ok) return null;
  return <>{children}</>;
}