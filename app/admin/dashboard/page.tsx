import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const db = await getServerSupabase();

  const [revToday, newFilingsToday, approvalsToday, failuresToday, webhooks] = await Promise.all([
    (async () => {
      try {
        return await db.rpc("sum_payments_today").select("*").maybeSingle();
      } catch {
        // fallback: sum succeeded payments created today
        const start = new Date(); start.setHours(0, 0, 0, 0);
        const { data } = await db.from("payments")
          .select("amount_cents,status,created_at")
          .gte("created_at", start.toISOString());
        const total = (data ?? []).filter(r => r.status === "succeeded").reduce((a, r) => a + (r.amount_cents ?? 0), 0);
        return { data: { total_cents: total } } as any;
      }
    })(),
    (async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data } = await db.from("filings").select("id,created_at").gte("created_at", start.toISOString());
      return { data: { count: (data ?? []).length } } as any;
    })(),
    (async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data } = await db.from("filings").select("id,stage,created_at").eq("stage", "approved").gte("created_at", start.toISOString());
      return { data: { count: (data ?? []).length } } as any;
    })(),
    (async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const { data } = await db.from("filings").select("id,stage,created_at").eq("stage", "failed").gte("created_at", start.toISOString());
      return { data: { count: (data ?? []).length } } as any;
    })(),
    db.from("webhooks").select("id,event,status,created_at").order("created_at", { ascending: false }).limit(10),
  ]);

  const cents = revToday?.data?.total_cents ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Admin dashboard</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Revenue today</div>
          <div className="text-2xl font-bold">${(cents / 100).toFixed(2)}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">New filings</div>
          <div className="text-2xl font-bold">{newFilingsToday?.data?.count ?? 0}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Approvals</div>
          <div className="text-2xl font-bold">{approvalsToday?.data?.count ?? 0}</div>
        </div>
        <div className="rounded-xl border p-4">
          <div className="text-sm text-muted-foreground">Failures</div>
          <div className="text-2xl font-bold">{failuresToday?.data?.count ?? 0}</div>
        </div>
      </div>

      <div className="rounded-xl border">
        <div className="p-4 border-b font-medium">Recent webhooks</div>
        <ul className="text-sm divide-y">
          {(webhooks.data ?? []).map((w: any) => (
            <li key={w.id} className="p-3 flex justify-between">
              <span>{w.event}</span>
              <span className="text-muted-foreground">{w.status} • {new Date(w.created_at).toLocaleString()}</span>
            </li>
          ))}
          {(!webhooks.data || webhooks.data.length === 0) && <li className="p-3 text-muted-foreground">Nothing yet.</li>}
        </ul>
      </div>
    </div>
  );
}