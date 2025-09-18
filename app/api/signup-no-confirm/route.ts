import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Create admin client with service role key for bypassing email confirmation
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
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Create user with admin client (bypasses email confirmation)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        created_via: "filing_wizard",
      },
    });

    if (error) {
      console.error("Admin signup error:", error);

      // Handle existing user case
      if (
        error.message.includes("already registered") ||
        error.message.includes("already been taken")
      ) {
        return NextResponse.json(
          {
            error: "already_exists",
            message: "Account already exists with this email",
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (!data.user) {
      return NextResponse.json(
        { error: "User creation failed" },
        { status: 500 }
      );
    }

    // Create profile using admin client (bypasses RLS)
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(
      {
        id: data.user.id,
        email: email,
        role: "customer",
      },
      {
        onConflict: "id",
      }
    );

    if (profileError) {
      console.error("Profile creation error:", profileError);
      // Continue anyway - the trigger might have created it
    }

    return NextResponse.json({
      success: true,
      user: {
        id: data.user.id,
        email: data.user.email,
      },
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
