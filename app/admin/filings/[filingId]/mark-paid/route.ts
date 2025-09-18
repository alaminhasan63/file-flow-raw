import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function POST(_req: Request, { params }: { params: { filingId: string } }) {
  const admin = getAdminSupabase();
  const id = params.filingId;

  const { data: f } = await admin.from("filings").select("id, quoted_total_cents").eq("id", id).single();
  if (!f) return NextResponse.json({ error: "Filing not found" }, { status: 404 });

  const amount = f.quoted_total_cents ?? 29900;

  await admin.from("filings").update({ paid_total_cents: amount }).eq("id", id);
  await admin.from("messages").insert({ filing_id: id, body: `Payment recorded: $${(amount/100).toFixed(2)}` });

  return NextResponse.json({ ok: true });
}