import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  const db = getServerSupabase();
  const { data, error } = await db
    .from("state_pricing")
    .select("id,state_code,package_id,govt_fee_cents,surcharge_cents,created_at")
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data ?? []);
}