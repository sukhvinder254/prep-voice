
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

interface PreparationDay {
  day: number;
  topic: string;
  tasks: string[];
  goal: string;
}

interface PreparationPlan {
  overview: string;
  dailyPlan: PreparationDay[];
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please login to create your preparation plan." },
        { status: 401 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { targetRole, durationDays } = body;

    const allowedDurations = [7, 15, 30, 60];

    if (
      typeof targetRole !== "string" ||
      targetRole.trim().length < 3 ||
      targetRole.length > 100
    ) {
      return NextResponse.json(
        { error: "Please select a valid target role." },
        { status: 400 }
      );
    }

    if (!allowedDurations.includes(Number(durationDays))) {
      return NextResponse.json(
        { error: "Please select a valid preparation duration." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
You are an expert technical interview preparation coach.

Create a realistic and personalized interview preparation plan.

TARGET ROLE:
${targetRole.trim()}

DURATION:
${durationDays} days

INSTRUCTIONS:

1. Generate exactly ${durationDays} daily plan entries.
2. Start from Day 1 and continue sequentially.
3. Include relevant topics for the selected role.
4. Cover DSA, problem solving, development, core computer science
   and interview practice wherever relevant to the role.
5. Do not include irrelevant topics.
6. Give 2 to 4 practical tasks per day.
7. Keep tasks achievable for a college student.
8. Include revision and mock interview practice.
9. Gradually increase the difficulty.
10. Avoid repeating the same tasks unnecessarily.

Return ONLY valid JSON in this structure:

{
  "overview": "A short description of the preparation strategy.",
  "dailyPlan": [
    {
      "day": 1,
      "topic": "Introduction to Programming",
      "tasks": [
        "Revise programming fundamentals",
        "Solve two beginner coding problems"
      ],
      "goal": "Build a strong programming foundation."
    }
  ]
}

Return exactly ${durationDays} daily entries.
Do not include Markdown outside JSON.
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();
    const plan = JSON.parse(responseText) as PreparationPlan;

    if (
      typeof plan.overview !== "string" ||
      !Array.isArray(plan.dailyPlan) ||
      plan.dailyPlan.length !== Number(durationDays)
    ) {
      throw new Error("AI returned an invalid preparation plan.");
    }

    const validPlan = plan.dailyPlan.every(
      (day, index) =>
        day.day === index + 1 &&
        typeof day.topic === "string" &&
        Array.isArray(day.tasks) &&
        day.tasks.length >= 1 &&
        day.tasks.every((task) => typeof task === "string") &&
        typeof day.goal === "string"
    );

    if (!validPlan) {
      throw new Error("AI returned an invalid daily plan.");
    }

    const { data: savedPlan, error: saveError } = await supabase
      .from("interview_preparation_plans")
      .insert({
        user_id: user.id,
        target_role: targetRole.trim(),
        duration_days: Number(durationDays),
        plan: {
          overview: plan.overview,
          dailyPlan: plan.dailyPlan,
        },
        completed_tasks: [],
      })
      .select("id")
      .single();

    if (saveError) {
      console.error("Preparation plan save error:", saveError.message);

      return NextResponse.json(
        { error: "Plan generated, but saving it failed." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      planId: savedPlan.id,
      plan,
    });
  } catch (error) {
    console.error("Preparation plan generation error:", error);

    return NextResponse.json(
      { error: "Could not generate your preparation plan. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please login to update your progress." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { planId, completedTasks } = body;

    if (
      typeof planId !== "string" ||
      !Array.isArray(completedTasks) ||
      !completedTasks.every((task) => typeof task === "string")
    ) {
      return NextResponse.json(
        { error: "Invalid progress information." },
        { status: 400 }
      );
    }

    const { data: existingPlan, error: fetchError } = await supabase
      .from("interview_preparation_plans")
      .select("id, plan")
      .eq("id", planId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingPlan) {
      return NextResponse.json(
        { error: "Preparation plan not found." },
        { status: 404 }
      );
    }

    const dailyPlan = (existingPlan.plan as PreparationPlan)?.dailyPlan;

    if (!Array.isArray(dailyPlan)) {
      return NextResponse.json(
        { error: "Invalid preparation plan." },
        { status: 400 }
      );
    }

    const validTaskIds = new Set(
      dailyPlan.flatMap((day) =>
        day.tasks.map((_, index) => `${day.day}-${index}`)
      )
    );

    const uniqueTasks = [...new Set(completedTasks)];

    if (!uniqueTasks.every((taskId) => validTaskIds.has(taskId))) {
      return NextResponse.json(
        { error: "Invalid task selection." },
        { status: 400 }
      );
    }

    const { error: updateError } = await supabase
      .from("interview_preparation_plans")
      .update({
        completed_tasks: uniqueTasks,
      })
      .eq("id", planId)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Progress update error:", updateError.message);

      return NextResponse.json(
        { error: "Could not save your progress." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      completedTasks: uniqueTasks,
      message: "Progress saved successfully.",
    });
  } catch (error) {
    console.error("Preparation progress error:", error);

    return NextResponse.json(
      { error: "Could not update your progress." },
      { status: 500 }
    );
  }
}
