"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

type Filing = {
  id: string; stage: string; state_code: string; filing_type: string;
  quoted_total_cents: number; created_at: string; business_id: string;
};

const STAGES = ["intake", "ready", "queued", "submitting", "submitted", "approved", "rejected", "needs_info", "failed"];

export default function AdminFilingsPage() {
  const supabase = getBrowserSupabase();
  const [rows, setRows] = useState<Filing[]>([]);
  const [view, setView] = useState<"kanban" | "table">("kanban");
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("filings")
      .select("id,stage,state_code,filing_type,quoted_total_cents,created_at,business_id")
      .order("created_at", { ascending: false });
    setRows((data ?? []) as any);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    if (!q.trim()) return rows;
    const t = q.toLowerCase();
    return rows.filter(r =>
      r.id.toLowerCase().includes(t) ||
      r.filing_type.toLowerCase().includes(t) ||
      r.state_code.toLowerCase().includes(t)
    );
  }, [rows, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Filings</h1>
        <div className="flex gap-2">
          <input className="border rounded px-3 py-2 text-sm" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
          <button onClick={() => setView("kanban")} className={`rounded-lg border px-3 py-2 text-sm ${view === "kanban" ? "bg-accent" : ""}`}>Kanban</button>
          <button onClick={() => setView("table")} className={`rounded-lg border px-3 py-2 text-sm ${view === "table" ? "bg-accent" : ""}`}>Table</button>
        </div>
      </div>

      {view === "kanban" ? (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-4">
          {STAGES.map(stage => {
            const list = filtered.filter(r => r.stage === stage);
            return (
              <div key={stage} className="rounded-xl border">
                <div className="px-3 py-2 border-b text-sm font-medium">{stage} ({list.length})</div>
                <ul className="p-2 space-y-2">
                  {list.map(card => (
                    <li key={card.id} className="rounded border p-2 bg-card">
                      <a className="font-medium underline" href={`/admin/filings/${card.id}`}>#{card.id.slice(0, 8)}</a>
                      <div className="text-xs text-muted-foreground mt-1">{card.filing_type} • {card.state_code}</div>
                      <div className="text-xs">${(card.quoted_total_cents / 100).toFixed(2)}</div>
                    </li>
                  ))}
                  {list.length === 0 && <li className="text-xs text-muted-foreground">None</li>}
                </ul>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="p-3 text-left">Filing</th>
                <th className="p-3 text-left">Type</th>
                <th className="p-3 text-left">State</th>
                <th className="p-3 text-left">Stage</th>
                <th className="p-3 text-left">Quoted</th>
                <th className="p-3 text-left">Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} className="border-b hover:bg-accent/40">
                  <td className="p-3"><a className="underline" href={`/admin/filings/${r.id}`}>#{r.id.slice(0, 8)}</a></td>
                  <td className="p-3">{r.filing_type}</td>
                  <td className="p-3">{r.state_code}</td>
                  <td className="p-3">{r.stage}</td>
                  <td className="p-3">${(r.quoted_total_cents / 100).toFixed(2)}</td>
                  <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td className="p-3 text-muted-foreground" colSpan={6}>No results.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}