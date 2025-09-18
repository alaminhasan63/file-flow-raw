import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ runId: string }> }
) {
  const admin = getAdminSupabase();
  const { outcome } = await req.json().catch(() => ({}));
  if (!["succeeded", "failed"].includes(outcome)) {
    return NextResponse.json({ error: "Invalid outcome" }, { status: 400 });
  }

  const resolvedParams = await params;
  const { data: run, error: rErr } = await admin
    .from("filing_runs")
    .select("id, filing_id")
    .eq("id", resolvedParams.runId)
    .single();
  if (rErr || !run)
    return NextResponse.json({ error: "Run not found" }, { status: 404 });

  const now = new Date().toISOString();
  await admin
    .from("filing_runs")
    .update({ status: outcome, finished_at: now })
    .eq("id", run.id);

  // optional: append a message on success/failure
  await admin.from("messages").insert({
    filing_id: run.filing_id,
    body:
      outcome === "succeeded"
        ? "Run completed successfully."
        : "Run failed during automation.",
  });

  return NextResponse.json({ ok: true });
}
