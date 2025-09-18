import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function POST(
  _req: Request,
  { params }: { params: { filingId: string } }
) {
  const admin = getAdminSupabase();
  const filingId = params.filingId;

  const { data: filing, error: fErr } = await admin
    .from("filings")
    .select("id, state_code, filing_type")
    .eq("id", filingId)
    .single();

  if (fErr || !filing) {
    return NextResponse.json({ error: "Filing not found" }, { status: 404 });
  }

  const { data: adapters, error: aErr } = await admin
    .from("state_adapters")
    .select("id")
    .eq("state_code", filing.state_code)
    .eq("filing_type", filing.filing_type)
    .eq("enabled", true)
    .order("created_at", { ascending: false })
    .limit(1);

  if (aErr || !adapters?.[0]) {
    return NextResponse.json({ error: "No enabled adapter" }, { status: 400 });
  }

  const adapterId = adapters[0].id;

  const { data: run, error: rErr } = await admin
    .from("filing_runs")
    .insert({
      filing_id: filing.id,
      adapter_id: adapterId,
      status: "queued",
      log: [{ at: new Date().toISOString(), msg: "Queued by admin" }],
    })
    .select("*")
    .single();

  if (rErr) return NextResponse.json({ error: rErr.message }, { status: 400 });

  return NextResponse.json({ ok: true, run });
}