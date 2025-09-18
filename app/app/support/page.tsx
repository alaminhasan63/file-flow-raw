"use client";
import { useEffect, useState, useCallback } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function SupportPage() {
  const supabase = getBrowserSupabase();
  const [rows, setRows] = useState<any[]>([]);
  const [body, setBody] = useState("");

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("messages")
      .select("id, body, from_role, created_at")
      .is("filing_id", null)
      .order("created_at", { ascending: true });
    setRows(data ?? []);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  async function send() {
    const uid = (await supabase.auth.getUser()).data.user?.id;
    if (!uid || !body.trim()) return;
    const { error } = await supabase.from("messages").insert({
      filing_id: null,
      from_role: "customer",
      sender_id: uid,
      body,
    });
    if (!error) { setBody(""); load(); }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Support</h1>
      <div className="rounded border max-h-[50vh] overflow-auto">
        <ul className="text-sm divide-y">
          {rows.map(m => (
            <li key={m.id} className="p-3">
              <div className="text-xs text-muted-foreground">{new Date(m.created_at).toLocaleString()} — {m.from_role}</div>
              <div>{m.body}</div>
            </li>
          ))}
          {rows.length === 0 && <li className="p-3 text-muted-foreground">No messages yet.</li>}
        </ul>
      </div>
      <div className="flex gap-2">
        <input className="flex-1 border rounded px-3 py-2 text-sm" value={body} onChange={e => setBody(e.target.value)} placeholder="Describe your issue…" />
        <button onClick={send} className="rounded-lg border px-3 py-2 text-sm">Send</button>
      </div>
    </div>
  );
}