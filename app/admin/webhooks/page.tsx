import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminWebhooksPage() {
  const db = await getServerSupabase();
  const { data } = await db
    .from("webhooks")
    .select("id,event,status,filing_id,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Webhooks</h1>
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left p-3">Event</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Filing</th>
              <th className="text-left p-3">When</th>
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map(w => (
              <tr key={w.id} className="border-b">
                <td className="p-3">{w.event}</td>
                <td className="p-3">{w.status}</td>
                <td className="p-3">{w.filing_id ? <a className="underline" href={`/admin/filings/${w.filing_id}`}>#{String(w.filing_id).slice(0, 8)}</a> : "—"}</td>
                <td className="p-3">{new Date(w.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {(!data || data.length === 0) && <tr><td className="p-3 text-muted-foreground" colSpan={4}>No webhooks yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}