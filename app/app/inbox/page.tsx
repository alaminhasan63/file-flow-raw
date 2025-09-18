"use client";
import { useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

type Row = { id:string; kind:string; title:string; body:string|null; filing_id:string|null; created_at:string; read_at:string|null };

export default function InboxPage() {
  const supabase = getBrowserSupabase();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid) return;
    const { data } = await supabase
      .from("notifications")
      .select("id,kind,title,body,filing_id,created_at,read_at")
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(200);
    setRows((data ?? []) as any);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function markRead(id:string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    setRows(prev => prev.map(r => r.id===id ? { ...r, read_at: new Date().toISOString() } : r));
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Inbox</h1>
      <div className="rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left p-3">Title</th>
              <th className="text-left p-3">Filing</th>
              <th className="text-left p-3">When</th>
              <th className="text-left p-3">Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.id} className="border-b">
                <td className="p-3">
                  <div className="font-medium">{r.title}</div>
                  {r.body && <div className="text-muted-foreground">{r.body}</div>}
                </td>
                <td className="p-3">{r.filing_id ? <a className="underline" href={`/app/filings/${r.filing_id}`}>View</a> : "—"}</td>
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
                <td className="p-3">{r.read_at ? "Read" : "Unread"}</td>
                <td className="p-3">
                  {!r.read_at && <button onClick={()=>markRead(r.id)} className="rounded-lg border px-2 py-1 text-xs">Mark read</button>}
                </td>
              </tr>
            ))}
            {rows.length===0 && !loading && <tr><td className="p-3 text-muted-foreground" colSpan={5}>Nothing here yet.</td></tr>}
            {loading && <tr><td className="p-3" colSpan={5}>Loading…</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}