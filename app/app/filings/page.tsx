"use client";

import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

type Filing = {
  id: string;
  stage: string;
  state_code: string;
  filing_type: string;
  quoted_total_cents: number | null;
  created_at: string;
  business_id: string;
};

export default function FilingsListPage() {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const supabase = getBrowserSupabase();
  const router = useRouter();

  useEffect(() => {
    async function loadFilings() {
      try {
        // Check authentication first
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.replace("/sign-in?next=/app/filings");
          return;
        }

        // Load filings
        const { data: rows, error: filingsError } = await supabase
          .from("filings")
          .select("id, stage, state_code, filing_type, quoted_total_cents, created_at, business_id")
          .order("created_at", { ascending: false });

        if (filingsError) {
          console.error("Error loading filings:", filingsError);
          setError("Failed to load filings");
        } else {
          setFilings(rows || []);
        }
      } catch (err) {
        console.error("Unexpected error:", err);
        setError("An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    }

    loadFilings();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Your filings</h1>
        <div className="p-6">Loading filings...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-semibold">Your filings</h1>
        <div className="p-6 text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Your filings</h1>
      <div className="rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left p-3">Filing</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">State</th>
              <th className="text-left p-3">Stage</th>
              <th className="text-left p-3">Quoted</th>
              <th className="text-left p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {filings.map(r => (
              <tr key={r.id} className="border-b hover:bg-accent/40">
                <td className="p-3">
                  <a className="underline" href={`/app/filings/${r.id}`}>#{r.id.slice(0, 8)}</a>
                </td>
                <td className="p-3">{r.filing_type}</td>
                <td className="p-3">{r.state_code}</td>
                <td className="p-3">{r.stage}</td>
                <td className="p-3">${((r.quoted_total_cents ?? 0) / 100).toFixed(2)}</td>
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {filings.length === 0 && (
              <tr>
                <td className="p-6 text-muted-foreground" colSpan={6}>
                  No filings yet. <a className="underline" href="/app/start">Start a filing</a>.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}