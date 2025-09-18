import { NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/supabase/admin";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ adapterId: string }> }
) {
  const admin = getAdminSupabase();
  const { enabled } = await req.json().catch(() => ({}));
  if (typeof enabled !== "boolean")
    return NextResponse.json(
      { error: "enabled must be boolean" },
      { status: 400 }
    );
  const resolvedParams = await params;
  const { error } = await admin
    .from("state_adapters")
    .update({ enabled })
    .eq("id", resolvedParams.adapterId);
  if (error)
    return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
