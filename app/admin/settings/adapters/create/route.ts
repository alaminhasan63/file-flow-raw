import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const admin = getAdminSupabase();
  const body = await req.json().catch(() => ({}));
  const { state_code, filing_type, name, version } = body || {};
  if (!state_code || !filing_type || !name) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { error } = await admin.from("state_adapters").insert({
    state_code: String(state_code).toUpperCase(),
    filing_type: String(filing_type),
    name: String(name),
    version: version ? String(version) : null,
    enabled: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}