import { NextResponse } from "next/server";
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filingId = searchParams.get("filingId");

    if (!filingId) {
      return NextResponse.json(
        { error: "Filing ID is required" },
        { status: 400 }
      );
    }

    console.log("Fetching filing data for:", filingId);

    // Fetch filing data using admin client (bypasses RLS)
    const { data, error } = await supabaseAdmin
      .from("filings")
      .select(
        `
        id,
        quoted_total_cents,
        business_id,
        state_code,
        filing_type,
        stage,
        businesses (
          legal_name,
          formation_state,
          entity_type
        )
      `
      )
      .eq("id", filingId)
      .single();

    if (error) {
      console.error("Filing data fetch error:", error);
      return NextResponse.json(
        { error: "Failed to load filing data" },
        { status: 404 }
      );
    }

    console.log("Filing data fetched successfully:", data.id);

    return NextResponse.json({
      success: true,
      filing: data,
    });
  } catch (error) {
    console.error("Filing data API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
