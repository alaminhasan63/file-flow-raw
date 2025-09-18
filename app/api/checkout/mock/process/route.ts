import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";

// Create admin client with service role key for bypassing RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId, filingId, success } = body;

    if (!sessionId || !filingId) {
      return NextResponse.json(
        { error: "Session ID and Filing ID are required" },
        { status: 400 }
      );
    }

    const supabase = await getServerSupabase();

    // Get the authenticated user (optional for mock payments)
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // For mock payments, we'll allow unauthenticated access but validate the filing exists
    // In production, this would require proper authentication

    if (success) {
      // Try to get filing details, create test data if not found
      let filing;
      const { data: existingFiling, error: filingError } = await supabase
        .from("filings")
        .select(
          "id, quoted_total_cents, business_id, businesses!inner(owner_id)"
        )
        .eq("id", filingId)
        .single();

      if (filingError || !existingFiling) {
        // For mock payments, create simple mock filing object for testing
        console.log(`Creating mock filing data for ${filingId}`);
        filing = {
          id: filingId,
          quoted_total_cents: 29900,
          business_id: `mock-business-${filingId}`,
          businesses: {
            owner_id: user?.id || "mock-user-id",
            legal_name: "Mock Test LLC",
            formation_state: "WY",
          },
        };
      } else {
        filing = existingFiling;
      }

      // If user is authenticated, verify they own this filing
      // For mock payments, we're more lenient but still validate filing exists
      if (user && (filing.businesses as any).owner_id !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }

      // Create payment records for both real and mock filings
      console.log(`Processing payment for filing ${filingId}`);

      try {
        console.log("Processing payment for filing:", filingId);

        // Create payment record using admin client (bypasses RLS)
        const { data: paymentData, error: paymentError } = await supabaseAdmin
          .from("payments")
          .insert({
            filing_id: filingId,
            status: "succeeded",
            provider: "stripe",
            provider_ref: sessionId,
            amount_cents: filing.quoted_total_cents || 0,
          })
          .select("id")
          .single();

        if (paymentError) {
          console.error("Payment creation error:", paymentError);
        } else {
          console.log("Payment record created:", paymentData.id);
        }

        // Update filing status to "ready" (payment processed) using admin client
        const { error: filingUpdateError } = await supabaseAdmin
          .from("filings")
          .update({
            paid_total_cents: filing.quoted_total_cents || 0,
            stage: "ready", // Changed from "queued" to "ready" to show "Payment Processed"
          })
          .eq("id", filingId);

        if (filingUpdateError) {
          console.error("Filing update error:", filingUpdateError);
        } else {
          console.log("Filing status updated to ready (payment processed)");
        }
      } catch (error) {
        console.error("Payment processing error:", error);
        // Continue anyway for testing
      }

      return NextResponse.json({
        success: true,
        redirectTo: `/app/filings/${filingId}?payment=success`,
      });
    } else {
      // Payment was cancelled
      return NextResponse.json({
        success: false,
        redirectTo: `/app/start?payment=cancelled`,
      });
    }
  } catch (error) {
    console.error("Mock payment processing error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
