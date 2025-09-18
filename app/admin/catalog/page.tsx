"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export default function AdminCatalogPage() {
  const supabase = getBrowserSupabase();
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [stage, setStage] = useState("");

  const load = useCallback(async () => {
    let query = supabase.from("filings").select("id,state_code,filing_type,stage,created_at").order("created_at", { ascending: false }).limit(200);
    if (state) query = query.eq("state_code", state.toUpperCase());
    if (stage) query = query.eq("stage", stage);
    const { data } = await query;
    const data2 = (data ?? []).filter(r => !q || (r.id + r.filing_type + r.stage).toLowerCase().includes(q.toLowerCase()));
    setRows(data2);
  }, [supabase, state, stage, q]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>Filings</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <Input placeholder="Search id/type/stage" value={q} onChange={e => setQ(e.target.value)} />
            <Input placeholder="State (e.g., WY)" value={state} onChange={e => setState(e.target.value)} />
            <Input placeholder="Stage (draft|ready|done)" value={stage} onChange={e => setStage(e.target.value)} />
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="p-2 text-left">ID</th>
                <th className="p-2 text-left">State</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Stage</th>
                <th className="p-2 text-left">Created</th>
                <th className="p-2 text-left">Open</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b hover:bg-muted/50">
                  <td className="p-2 font-mono">{r.id.slice(0, 8)}…</td>
                  <td className="p-2">{r.state_code}</td>
                  <td className="p-2">{r.filing_type}</td>
                  <td className="p-2">{r.stage}</td>
                  <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-2">
                    <Link className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-1 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors" href={`/admin/filings/${r.id}`}>Open</Link>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="p-2 text-muted-foreground" colSpan={6}>No results.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}