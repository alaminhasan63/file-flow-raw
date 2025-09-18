import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create admin client with service role key
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
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    console.log("Confirming user:", userId);

    // Confirm the user's email using admin API
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      {
        email_confirm: true,
      }
    );

    if (error) {
      console.error("User confirmation error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("User confirmed successfully:", userId);

    return NextResponse.json({
      success: true,
      user: data.user,
    });
  } catch (error) {
    console.error("Confirm user API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
