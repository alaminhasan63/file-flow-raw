import { NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await getServerSupabase();

    // Get current user (admin check)
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "ops"].includes(profile.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find filings without payment records
    const { data: filings } = await supabase
      .from("filings")
      .select(
        `
        id,
        quoted_total_cents,
        stage,
        businesses (
          owner_id,
          legal_name
        )
      `
      )
      .not("quoted_total_cents", "is", null)
      .gt("quoted_total_cents", 0);

    if (!filings) {
      return NextResponse.json({ error: "No filings found" }, { status: 404 });
    }

    // Check which filings have payments
    const filingIds = filings.map((f) => f.id);
    const { data: existingPayments } = await supabase
      .from("payments")
      .select("filing_id")
      .in("filing_id", filingIds);

    const paidFilingIds = new Set(
      (existingPayments || []).map((p) => p.filing_id)
    );
    const unpaidFilings = filings.filter((f) => !paidFilingIds.has(f.id));

    // Create payment records for unpaid filings
    const paymentInserts = unpaidFilings.map((filing) => ({
      filing_id: filing.id,
      status: "succeeded" as const,
      provider: "backfill" as const,
      provider_ref: "admin-fix",
      amount_cents: filing.quoted_total_cents || 0,
    }));

    if (paymentInserts.length > 0) {
      const { error: insertError } = await supabase
        .from("payments")
        .insert(paymentInserts);

      if (insertError) {
        return NextResponse.json(
          { error: `Failed to create payments: ${insertError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Created ${paymentInserts.length} payment records`,
      filingsChecked: filings.length,
      paymentsCreated: paymentInserts.length,
      unpaidFilings: unpaidFilings.map((f) => ({
        id: f.id,
        amount: f.quoted_total_cents,
        business: (f.businesses as any)?.legal_name,
      })),
    });
  } catch (error) {
    console.error("Fix payments error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
