"use client";

import { useEffect, useState, useCallback } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Adapter = { id: string; state_code: string; filing_type: string; name: string; version: string | null; enabled: boolean; created_at: string };

export default function AdapterSettingsPage() {
  const supabase = getBrowserSupabase();
  const [rows, setRows] = useState<Adapter[]>([]);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ state_code: "WY", filing_type: "formation", name: "Wyoming Formation v1", version: "1.0.0" });

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("state_adapters")
      .select("id,state_code,filing_type,name,version,enabled,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data as any) ?? []);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function toggle(id: string, enabled: boolean) {
    setBusy(true);
    const res = await fetch(`/admin/settings/adapters/${id}/toggle`, { method: "POST", body: JSON.stringify({ enabled }) });
    if (!res.ok) console.error("toggle failed");
    setBusy(false);
    load();
  }

  async function createAdapter() {
    setBusy(true);
    const res = await fetch(`/admin/settings/adapters/create`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    if (!res.ok) console.error("create failed");
    setBusy(false);
    setForm({ state_code: "WY", filing_type: "LLC_FORMATION", name: "Wyoming LLC Formation v1", version: "1.0.0" });
    load();
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle>State adapters</CardTitle></CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-4 gap-3 mb-4">
            <Input placeholder="State code" value={form.state_code} onChange={e => setForm({ ...form, state_code: e.target.value.toUpperCase() })} />
            <Input placeholder="Filing type" value={form.filing_type} onChange={e => setForm({ ...form, filing_type: e.target.value })} />
            <Input placeholder="Name" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Version" value={form.version} onChange={e => setForm({ ...form, version: e.target.value })} />
          </div>
          <Button onClick={createAdapter} loading={busy} className="btn-primary">Create</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Existing</CardTitle></CardHeader>
        <CardContent>
          <table className="text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="p-2 text-left">State</th>
                <th className="p-2 text-left">Type</th>
                <th className="p-2 text-left">Name</th>
                <th className="p-2 text-left">Version</th>
                <th className="p-2 text-left">Enabled</th>
                <th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(a => (
                <tr key={a.id} className="border-b">
                  <td className="p-2">{a.state_code}</td>
                  <td className="p-2">{a.filing_type}</td>
                  <td className="p-2">{a.name}</td>
                  <td className="p-2">{a.version ?? "—"}</td>
                  <td className="p-2">{a.enabled ? "Yes" : "No"}</td>
                  <td className="p-2">
                    <Button onClick={() => toggle(a.id, !a.enabled)} disabled={busy}>
                      {a.enabled ? "Disable" : "Enable"}
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td className="p-2 muted" colSpan={6}>No adapters yet.</td></tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}