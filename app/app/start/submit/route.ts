import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { ensureUserProfile } from "@/lib/supabase/profile-utils";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { step1, step3, quoted_total_cents } = body || {};

  const supabase = await getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Ensure user profile exists before creating business
  const profileErr = await ensureUserProfile(supabase, user);
  if (profileErr)
    return NextResponse.json({ error: profileErr }, { status: 400 });

  const { data: biz, error: bizErr } = await supabase
    .from("businesses")
    .insert({
      owner_id: user.id,
      legal_name: step1?.legal_name,
      dba: step1?.dba ?? null,
      formation_state: step1?.formation_state ?? "WY",
      entity_type: step1?.entity_type ?? "LLC",
      status: "draft",
    })
    .select("id")
    .single();
  if (bizErr || !biz)
    return NextResponse.json(
      { error: bizErr?.message || "Business create failed" },
      { status: 400 }
    );

  const { data: filing, error: fErr } = await supabase
    .from("filings")
    .insert({
      business_id: biz.id,
      stage: "ready",
      state_code: step1?.formation_state ?? "WY",
      filing_type: "LLC_FORMATION",
      quoted_total_cents: Number(quoted_total_cents || 0),
      external_ref: body,
    })
    .select("id")
    .single();
  if (fErr || !filing)
    return NextResponse.json(
      { error: fErr?.message || "Filing create failed" },
      { status: 400 }
    );

  if (step3?.members?.length) {
    const rows = step3.members.map((m: any) => ({
      business_id: biz.id,
      name: m.name,
      role: m.role,
      ownership_percent: Number(m.ownership_percent) || 0,
      email: m.email ?? null,
      phone: m.phone ?? null,
    }));
    await supabase.from("business_owners").insert(rows);
  }

  await supabase.from("filing_tasks").insert([
    {
      filing_id: filing.id,
      code: "NAME_CHECK",
      label: "Check name availability",
    },
    {
      filing_id: filing.id,
      code: "STATE_PORTAL_CREATE",
      label: "Create state portal account",
    },
    {
      filing_id: filing.id,
      code: "PAY_STATE_FEES",
      label: "Pay government fees",
    },
    {
      filing_id: filing.id,
      code: "DOWNLOAD_RECEIPT",
      label: "Download receipt",
    },
    {
      filing_id: filing.id,
      code: "UPLOAD_ARTICLES",
      label: "Upload Articles of Organization",
    },
  ]);

  await supabase.from("payments").insert({
    filing_id: filing.id,
    status: "succeeded",
    provider: "test",
    provider_ref: "mock",
    amount_cents: Number(quoted_total_cents || 0),
  });

  await supabase.from("intake_drafts").delete().eq("owner_id", user.id);

  return NextResponse.json({
    ok: true,
    redirectTo: `/app/filings/${filing.id}?payment=success`,
  });
}
