import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function FilingsListPage() {
  const supabase = getServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rows } = await supabase
    .from("filings")
    .select("id, stage, state_code, filing_type, quoted_total_cents, created_at, business_id")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Your filings</h1>
      <div className="rounded-xl border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left p-3">Filing</th>
              <th className="text-left p-3">Type</th>
              <th className="text-left p-3">State</th>
              <th className="text-left p-3">Stage</th>
              <th className="text-left p-3">Quoted</th>
              <th className="text-left p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map(r => (
              <tr key={r.id} className="border-b hover:bg-accent/40">
                <td className="p-3">
                  <a className="underline" href={`/app/filings/${r.id}`}>#{r.id.slice(0,8)}</a>
                </td>
                <td className="p-3">{r.filing_type}</td>
                <td className="p-3">{r.state_code}</td>
                <td className="p-3">{r.stage}</td>
                <td className="p-3">${((r.quoted_total_cents ?? 0)/100).toFixed(2)}</td>
                <td className="p-3">{new Date(r.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {(!rows || rows.length===0) && (
              <tr><td className="p-6 text-muted-foreground" colSpan={6}>No filings yet. <a className="underline" href="/app/start">Start a filing</a>.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}