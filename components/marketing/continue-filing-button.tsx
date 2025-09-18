"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function ContinueFilingButton() {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const [busy, setBusy] = useState(false);

  async function go() {
    setBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/sign-in?next=/app/start");
      } else {
        router.push("/app/start");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button onClick={go} loading={busy} variant="primary">
      Continue your filing
    </Button>
  );
}