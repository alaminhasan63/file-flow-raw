"use client";
import { useEffect, useState, useCallback } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Row = { name: string; created_at: string; size: number };

export function DocumentsPanel({ filingId }: { filingId: string }) {
  const supabase = getBrowserSupabase();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(false);
  const prefix = `filings/${filingId}/`;

  const load = useCallback(async () => {
    const { data, error } = await supabase.storage.from("docs").list(prefix);
    if (!error) setRows((data ?? []) as any);
  }, [supabase, prefix]);

  useEffect(() => { load(); }, [load]);

  async function upload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    const path = `${prefix}${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("docs").upload(path, file, { upsert: true });
    setBusy(false);
    if (!error) load();
  }

  async function download(name: string) {
    const path = `${prefix}${name}`;
    const { data } = await supabase.storage.from("docs").createSignedUrl(path, 60);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold">Documents</h3>
      </CardHeader>
      <CardBody className="space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="file"
            onChange={upload}
            disabled={busy}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
          {busy && <span className="text-sm text-muted-foreground">Uploading...</span>}
        </div>
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-3 font-medium">Name</th>
                <th className="text-left p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.name} className="border-b hover:bg-muted/50">
                  <td className="p-3">{r.name}</td>
                  <td className="p-3">
                    <Button
                      onClick={() => download(r.name)}
                      variant="outline"
                      size="sm"
                    >
                      Download
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td className="p-6 text-center text-muted-foreground" colSpan={2}>
                    No documents yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>
  );
}