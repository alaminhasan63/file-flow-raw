import { getServerSupabase } from "@/lib/supabase/server";

export default async function BillingPage() {
  const supabase = await getServerSupabase();
  const { data: rows } = await supabase
    .from("payments")
    .select("id, filing_id, status, provider, amount_cents, created_at")
    .order("created_at", { ascending: false });

  const total = (rows ?? [])
    .filter(r => r.status === "succeeded")
    .reduce((acc, r) => acc + (r.amount_cents ?? 0), 0);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Billing</h1>
      <div className="rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left p-3">Filing</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Provider</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map(r => (
              <tr key={r.id} className="border-b">
                <td className="p-3"><a className="underline" href={`/app/filings/${r.filing_id}`}>#{String(r.filing_id).slice(0, 8)}</a></td>
                <td className="p-3">{r.status}</td>
                <td className="p-3">{r.provider}</td>
                <td className="p-3">${((r.amount_cents ?? 0) / 100).toFixed(2)}</td>
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {(!rows || rows.length === 0) && <tr><td className="p-3 text-muted-foreground" colSpan={5}>No payments yet.</td></tr>}
          </tbody>
          <tfoot>
            <tr>
              <td className="p-3 font-medium" colSpan={3}>Total paid</td>
              <td className="p-3 font-medium">${(total / 100).toFixed(2)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}