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

export async function POST(request: Request) {
  try {
    const {
      userId,
      userEmail,
      bizName,
      stateCode,
      addr1,
      city,
      region,
      postal,
      registeredAgent,
      customAgent,
      einService,
      mailForwarding,
      addons,
      totalAmountCents,
    } = await request.json();

    if (!userId || !bizName || !stateCode) {
      return NextResponse.json(
        { error: "User ID, business name, and state code are required" },
        { status: 400 }
      );
    }

    console.log("Creating business and filing for user:", userId);

    // First, ensure the user profile exists
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: userId,
        email: userEmail || "unknown@example.com",
        role: "customer",
      },
      {
        onConflict: "id",
      }
    );

    if (profileError) {
      console.error("Profile creation/update error:", profileError);
      return NextResponse.json(
        { error: `Profile setup failed: ${profileError.message}` },
        { status: 500 }
      );
    }

    console.log("Profile ensured for user:", userId);

    // Create business using admin client (bypasses RLS)
    const { data: newBiz, error: createBizErr } = await supabaseAdmin
      .from("businesses")
      .insert({
        owner_id: userId,
        legal_name: bizName,
        formation_state: stateCode,
        entity_type: "LLC",
      })
      .select("id")
      .single();

    if (createBizErr) {
      console.error("Business creation error:", createBizErr);
      return NextResponse.json(
        { error: `Business creation failed: ${createBizErr.message}` },
        { status: 500 }
      );
    }

    console.log("Business created:", newBiz.id);

    // Create filing using admin client (bypasses RLS)
    const { data: filing, error: filingErr } = await supabaseAdmin
      .from("filings")
      .insert({
        business_id: newBiz.id,
        state_code: stateCode,
        filing_type: "LLC_FORMATION",
        stage: "intake",
        quoted_total_cents: totalAmountCents,
        use_fileflow_registered_agent: registeredAgent === "fileflow",
        registered_agent_address:
          registeredAgent === "fileflow"
            ? "123 Main St, Cheyenne, WY 82001"
            : customAgent?.address || "",
        ein_service: einService,
        mail_forwarding: mailForwarding,
        external_ref: {
          addons: addons?.oa ? ["OperatingAgreement"] : [],
          address: { addr1, city, region, postal },
        },
      })
      .select("id")
      .single();

    if (filingErr) {
      console.error("Filing creation error:", filingErr);
      return NextResponse.json(
        { error: `Filing creation failed: ${filingErr.message}` },
        { status: 500 }
      );
    }

    console.log("Filing created:", filing.id);

    return NextResponse.json({
      success: true,
      business: newBiz,
      filing: filing,
    });
  } catch (error) {
    console.error("Create filing API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
