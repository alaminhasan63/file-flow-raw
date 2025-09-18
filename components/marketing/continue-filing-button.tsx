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
        // Go directly to public filing wizard
        router.push("/start");
      } else {
        // If logged in, check for existing filings first
        const { data: existingFilings } = await supabase
          .from("filings")
          .select("id, stage")
          .eq("stage", "intake")
          .order("created_at", { ascending: false })
          .limit(1);

        if (existingFilings && existingFilings.length > 0) {
          // Continue existing filing in authenticated area
          router.push("/app/start");
        } else {
          // Start new filing in authenticated area
          router.push("/app/start");
        }
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