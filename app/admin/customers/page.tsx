import { getServerSupabase } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function AdminCustomersPage() {
  const db = await getServerSupabase();
  const { data: profiles } = await db
    .from("profiles")
    .select("id, email, full_name, phone, created_at")
    .eq("role", "customer")
    .order("created_at", { ascending: false });

  // counts per customer
  const { data: filings } = await db.from("filings").select("id, business_id");
  const { data: businesses } = await db.from("businesses").select("id, owner_id");

  const counts = new Map<string, number>();
  (businesses ?? []).forEach(b => {
    const userId = (b as any).owner_id as string;
    const c = (filings ?? []).filter(f => (f as any).business_id === b.id).length;
    counts.set(userId, (counts.get(userId) ?? 0) + c);
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Customers</h1>
      <div className="rounded-xl border overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/40">
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Name</th>
              <th className="text-left p-3">Phone</th>
              <th className="text-left p-3"># Filings</th>
              <th className="text-left p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map(p => (
              <tr key={p.id} className="border-b hover:bg-accent/40">
                <td className="p-3">{p.email}</td>
                <td className="p-3">{p.full_name ?? "—"}</td>
                <td className="p-3">{p.phone ?? "—"}</td>
                <td className="p-3">{counts.get(p.id) ?? 0}</td>
                <td className="p-3">{new Date(p.created_at).toLocaleString()}</td>
              </tr>
            ))}
            {(!profiles || profiles.length === 0) && <tr><td className="p-3 text-muted-foreground" colSpan={5}>No customers yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}