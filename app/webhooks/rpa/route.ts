import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await getServerSupabase();
    const body = await request.json();
    const { filingId, event, payload } = body;

    if (!filingId || !event) {
      return NextResponse.json(
        { error: "Filing ID and event are required" },
        { status: 400 }
      );
    }

    // Log webhook
    await supabase.from("webhooks").insert({
      direction: "in",
      event: `RPA_${event}`,
      status: 200,
      payload: { filingId, event, ...payload },
    });

    // Create filing task result
    const taskResult = {
      event,
      timestamp: new Date().toISOString(),
      ...payload,
    };

    // Find the relevant filing task and update it
    const { data: filing } = await supabase
      .from("filings")
      .select("*")
      .eq("id", filingId)
      .single();

    if (!filing) {
      return NextResponse.json({ error: "Filing not found" }, { status: 404 });
    }

    // Create new filing task for this event
    await supabase.from("filing_tasks").insert({
      filing_id: filingId,
      code: `RPA_${event}`,
      label: `RPA Event: ${event}`,
      status: "done",
      result: taskResult,
    });

    // Update filing stage based on event
    let newStage = filing.stage;
    if (event === "SUBMITTED") {
      newStage = "submitted";
    } else if (event === "APPROVED") {
      newStage = "approved";
    } else if (event === "REJECTED" || event === "FAILED") {
      newStage = "failed";
    }

    if (newStage !== filing.stage) {
      await supabase
        .from("filings")
        .update({ stage: newStage })
        .eq("id", filingId);
    }

    return NextResponse.json({
      success: true,
      message: "Webhook processed successfully",
      filingId,
      event,
      newStage,
    });
  } catch (error) {
    console.error("RPA webhook error:", error);

    // Log failed webhook
    try {
      const supabase = await getServerSupabase();
      await supabase.from("webhooks").insert({
        direction: "in",
        event: "RPA_ERROR",
        status: 500,
        payload: {
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });
    } catch (logError) {
      console.error("Failed to log webhook error:", logError);
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
