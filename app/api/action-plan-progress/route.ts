
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();

    const { dailyCompleted, nextInterviewCompleted } = body;

    if (
      !Array.isArray(dailyCompleted) ||
      !Array.isArray(nextInterviewCompleted) ||
      !dailyCompleted.every(Number.isInteger) ||
      !nextInterviewCompleted.every(Number.isInteger)
    ) {
      return NextResponse.json(
        { success: false, error: "Invalid progress data" },
        { status: 400 }
      );
    }

    const { data: existingPlan, error: fetchError } = await supabase
      .from("ai_action_plans")
      .select("plan")
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingPlan) {
      return NextResponse.json(
        { success: false, error: "Action plan not found" },
        { status: 404 }
      );
    }

    const plan = existingPlan.plan;

    const dailyGoals = Array.isArray(plan?.dailyGoals)
      ? plan.dailyGoals
      : [];

    const nextGoals = Array.isArray(plan?.nextInterviewGoals)
      ? plan.nextInterviewGoals
      : [];

    const validDaily = dailyCompleted.every(
      (index: number) => index >= 0 && index < dailyGoals.length
    );

    const validNext = nextInterviewCompleted.every(
      (index: number) => index >= 0 && index < nextGoals.length
    );

    if (!validDaily || !validNext) {
      return NextResponse.json(
        { success: false, error: "Invalid goal index" },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("ai_action_plans")
      .update({
        daily_completed: [...new Set(dailyCompleted)],
        next_interview_completed: [...new Set(nextInterviewCompleted)],
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      success: true,
      dailyCompleted: [...new Set(dailyCompleted)],
      nextInterviewCompleted: [...new Set(nextInterviewCompleted)],
    });
  } catch (error) {
    console.error("Progress save error:", error);

    return NextResponse.json(
      { success: false, error: "Failed to save progress" },
      { status: 500 }
    );
  }
}
