"use client";

import { useEffect, useState, useCallback } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { DocumentsPanel } from "@/components/filings/documents-panel";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Props = { filingId: string; state: string; filingType: string };

export function AdminFilingClient({ filingId, state, filingType }: Props) {
  const supabase = getBrowserSupabase();
  const [runs, setRuns] = useState<any[]>([]);
  const [adapter, setAdapter] = useState<any | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setErr(null);
    const { data: a } = await supabase
      .from("state_adapters")
      .select("id,name,version,enabled")
      .eq("state_code", state)
      .eq("filing_type", filingType)
      .eq("enabled", true)
      .order("created_at", { ascending: false })
      .limit(1);
    setAdapter(a?.[0] || null);

    const { data: r } = await supabase
      .from("filing_runs")
      .select("*")
      .eq("filing_id", filingId)
      .order("created_at", { ascending: false });
    setRuns(r ?? []);
  }, [supabase, state, filingType, filingId]);

  useEffect(() => { load(); }, [load]);

  async function queueRun() {
    if (!adapter) { setErr("No enabled adapter for this filing."); return; }
    setBusy(true); setErr(null);
    const res = await fetch(`/admin/filings/${filingId}/run`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(data?.error || "Failed to queue run"); return; }
    await load();
  }

  async function simulate(outcome: "succeeded" | "failed") {
    if (!runs[0]) { setErr("No run to simulate. Queue a run first."); return; }
    setBusy(true); setErr(null);
    const res = await fetch(`/admin/runs/${runs[0].id}/simulate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ outcome }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setErr(data?.error || "Simulation failed"); return; }
    await load();
  }

  return (
    <div className="space-y-6">
      {err && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {err}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <Button onClick={queueRun} disabled={!adapter || busy} variant="default">
          {busy ? "..." : "Queue run"}
        </Button>
        <Button onClick={() => simulate("succeeded")} disabled={!runs.length || busy} variant="outline">
          Simulate success
        </Button>
        <Button onClick={() => simulate("failed")} disabled={!runs.length || busy} variant="outline">
          Simulate failure
        </Button>
      </div>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Runs</h3>
        </CardHeader>
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Started</th>
                <th className="text-left p-3 font-medium">Finished</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/50">
                  <td className="p-3">{r.status}</td>
                  <td className="p-3">{r.started_at ? new Date(r.started_at).toLocaleString() : "—"}</td>
                  <td className="p-3">{r.finished_at ? new Date(r.finished_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-muted-foreground" colSpan={3}>
                    No runs yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardBody>
      </Card>

      <DocumentsPanel filingId={filingId} />
    </div>
  );
}