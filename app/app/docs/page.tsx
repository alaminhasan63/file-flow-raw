"use client";
import { useEffect, useState, useCallback } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

export default function DocsVaultPage() {
  const supabase = getBrowserSupabase();
  const [docs, setDocs] = useState<any[]>([]);
  const [q, setQ] = useState("");

  const loadDocs = useCallback(async () => {
    const { data } = await supabase
      .from("documents")
      .select("id, name, doc_type, storage_path, created_at, filing_id")
      .order("created_at", { ascending: false });
    setDocs(data ?? []);
  }, [supabase]);

  useEffect(() => {
    loadDocs();
  }, [loadDocs]);

  const filtered = docs.filter(d => d.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Documents</h1>
      <input className="border rounded px-3 py-2 text-sm" placeholder="Search…" value={q} onChange={e => setQ(e.target.value)} />
      <ul className="rounded border divide-y">
        {filtered.map(d => (
          <li key={d.id} className="p-3 flex justify-between text-sm">
            <div>
              <div className="font-medium">{d.name}</div>
              <div className="text-muted-foreground">Type: {d.doc_type} • {new Date(d.created_at).toLocaleString()}</div>
            </div>
            <a className="underline"
              href={supabase.storage.from("docs").getPublicUrl(d.storage_path).data.publicUrl}
              target="_blank">View</a>
          </li>
        ))}
        {filtered.length === 0 && <li className="p-3 text-muted-foreground">No documents.</li>}
      </ul>
    </div>
  );
}