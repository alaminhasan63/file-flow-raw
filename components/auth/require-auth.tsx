"use client";
import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const supabase = getBrowserSupabase();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function check() {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!data.session) {
        const next = typeof window !== "undefined" ? window.location.pathname : "/app/start";
        router.replace(`/sign-in?next=${encodeURIComponent(params.get("next") ?? next)}`);
      } else {
        setReady(true);
      }
    }

    // initial check
    check();

    // subscribe to auth state changes to avoid race conditions
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) setReady(true);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, [router, supabase, params, pathname]);

  if (!ready) return null;
  return <>{children}</>;
}