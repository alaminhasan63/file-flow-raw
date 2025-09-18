"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { DocumentsPanel } from "@/components/filings/documents-panel";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";

type Filing = {
  id: string;
  business_id: string | null;
  state_code: string;
  filing_type: string;
  stage: string | null;
  created_at: string;
};

export default function AdminFilingPage({ params }: any) {
  const router = useRouter();
  const supabase = getBrowserSupabase();
  const filingId = params.filingId;

  const [filing, setFiling] = useState<Filing | null>(null);
  const [adapter, setAdapter] = useState<any | null>(null);
  const [runs, setRuns] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  // --- NEW: user feedback state
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  const pollTimer = useRef<NodeJS.Timeout | null>(null);

  async function load() {
    setLoading(true);

    const { data: f, error: fErr } = await supabase
      .from("filings")
      .select("id,business_id,state_code,filing_type,stage,created_at")
      .eq("id", filingId)
      .maybeSingle();

    setFiling(f || null);

    if (f && !fErr) {
      const { data: a } = await supabase
        .from("state_adapters")
        .select("id,name,version,enabled")
        .eq("state_code", f.state_code)
        .eq("filing_type", f.filing_type)
        .eq("enabled", true)
        .order("created_at", { ascending: false })
        .limit(1);
      setAdapter(a?.[0] || null);
    } else {
      setAdapter(null);
    }

    const { data: r } = await supabase
      .from("filing_runs")
      .select("*")
      .eq("filing_id", filingId)
      .order("created_at", { ascending: false });

    setRuns(r ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    return () => { if (pollTimer.current) clearInterval(pollTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filingId]);

  // --- NEW: helper to poll runs briefly after actions
  function startShortPoll(seconds = 9, everyMs = 1500) {
    if (pollTimer.current) clearInterval(pollTimer.current);
    const started = Date.now();
    pollTimer.current = setInterval(async () => {
      await load();
      if (Date.now() - started > seconds * 1000) {
        if (pollTimer.current) clearInterval(pollTimer.current);
      }
    }, everyMs);
  }

  async function queueRun() {
    if (!adapter) { setNotice({ kind: "err", text: "No enabled adapter for this filing." }); return; }
    setBusy(true); setNotice(null);
    try {
      const res = await fetch(`/admin/filings/${filingId}/run`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setNotice({ kind: "ok", text: `Queued run ${data?.run?.id ?? ""}`.trim() });
      await load();
      startShortPoll(); // watch it update briefly
    } catch (e: any) {
      setNotice({ kind: "err", text: `Queue failed: ${e?.message || e}` });
    } finally {
      setBusy(false);
    }
  }

  async function simulate(outcome: "succeeded" | "failed") {
    if (!runs[0]) { setNotice({ kind: "err", text: "No run to simulate. Queue a run first." }); return; }
    setBusy(true); setNotice(null);
    try {
      const res = await fetch(`/admin/runs/${runs[0].id}/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ outcome }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setNotice({ kind: "ok", text: `Simulated ${outcome}.` });
      await load();
      startShortPoll();
    } catch (e: any) {
      setNotice({ kind: "err", text: `Simulation failed: ${e?.message || e}` });
    } finally {
      setBusy(false);
    }
  }

  async function markPaid() {
    setBusy(true); setNotice(null);
    try {
      const res = await fetch(`/admin/filings/${filingId}/mark-paid`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      setNotice({ kind: "ok", text: "Marked as paid." });
      await load(); startShortPoll();
    } catch (e: any) {
      setNotice({ kind: "err", text: `Mark paid failed: ${e?.message || e}` });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Loading…</div>;
  if (!filing) {
    return (
      <div className="p-6">
        <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          Filing not found.{" "}
          <button className="underline" onClick={() => router.push("/admin/catalog")}>Go back</button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Filing #{filing.id.slice(0, 8)}</h1>

      {notice && (
        <div
          className={`rounded border p-3 text-sm ${notice.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-red-200 bg-red-50 text-red-800"
            }`}
        >
          {notice.text}
        </div>
      )}

      <Card>
        <CardHeader>Details</CardHeader>
        <CardBody>
          <div>State: <span className="font-medium">{filing.state_code}</span></div>
          <div>Type: <span className="font-medium">{filing.filing_type}</span></div>
          <div>Stage: <span className="font-medium">{filing.stage ?? "—"}</span></div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-4 gap-2">
        <Button onClick={queueRun} disabled={!adapter || busy}>
          {busy ? "…" : "Queue run"}
        </Button>
        <Button onClick={() => simulate("succeeded")} disabled={!runs.length || busy}>
          Simulate success
        </Button>
        <Button onClick={() => simulate("failed")} disabled={!runs.length || busy}>
          Simulate failure
        </Button>
        <Button onClick={markPaid} disabled={busy} className="btn">Mark paid</Button>
      </div>

      <Card>
        <CardHeader>Runs</CardHeader>
        <CardBody className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="p-2 text-left">Status</th>
                <th className="p-2 text-left">Started</th>
                <th className="p-2 text-left">Finished</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((r) => (
                <tr key={r.id} className="border-b">
                  <td className="p-2">{r.status}</td>
                  <td className="p-2">{r.started_at ? new Date(r.started_at).toLocaleString() : "—"}</td>
                  <td className="p-2">{r.finished_at ? new Date(r.finished_at).toLocaleString() : "—"}</td>
                </tr>
              ))}
              {runs.length === 0 && (
                <tr>
                  <td className="p-2 text-muted-foreground" colSpan={3}>No runs yet.</td>
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