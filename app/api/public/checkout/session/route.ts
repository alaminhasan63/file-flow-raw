import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filingId, amount, successUrl, cancelUrl } = body;

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;

    if (!siteUrl) {
      return NextResponse.json(
        {
          error: "NEXT_PUBLIC_SITE_URL environment variable is not configured",
        },
        { status: 500 }
      );
    }

    if (!filingId || !amount) {
      return NextResponse.json(
        { error: "Filing ID and amount are required" },
        { status: 400 }
      );
    }

    // Mock Stripe session response
    const mockSession = {
      id: `cs_test_${Math.random().toString(36).substr(2, 9)}`,
      object: "checkout.session",
      amount_total: amount,
      currency: "usd",
      customer: null,
      mode: "payment",
      payment_intent: `pi_test_${Math.random().toString(36).substr(2, 9)}`,
      payment_method_types: ["card"],
      payment_status: "unpaid",
      status: "open",
      success_url: successUrl,
      cancel_url: cancelUrl,
      url: `${siteUrl}/checkout/mock?session_id=cs_test_${Math.random()
        .toString(36)
        .substr(2, 9)}&filing_id=${filingId}`,
      metadata: {
        filing_id: filingId,
      },
    };

    return NextResponse.json({
      session: mockSession,
    });
  } catch (error) {
    console.error("Checkout session error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
