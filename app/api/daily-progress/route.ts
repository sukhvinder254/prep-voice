
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Verify logged-in user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Please log in first." },
        { status: 401 }
      );
    }

    // Fetch all saved interviews belonging to this user
    const { data: interviews, error } = await supabase
      .from("interview_history")
      .select("id, question, category, score, feedback, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    const records = interviews ?? [];

    // Group interviews by Indian calendar date
    const dailyStats: Record<
      string,
      {
        date: string;
        totalInterviews: number;
        totalScore: number;
        bestScore: number;
        interviews: typeof records;
      }
    > = {};

    for (const interview of records) {
      const date = new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(new Date(interview.created_at));

      if (!dailyStats[date]) {
        dailyStats[date] = {
          date,
          totalInterviews: 0,
          totalScore: 0,
          bestScore: 0,
          interviews: [],
        };
      }

      const score = Number(interview.score ?? 0);

      dailyStats[date].totalInterviews += 1;
      dailyStats[date].totalScore += score;
      dailyStats[date].bestScore = Math.max(
        dailyStats[date].bestScore,
        score
      );
      dailyStats[date].interviews.push(interview);
    }

    // Calculate daily averages
    const dailyProgress = Object.values(dailyStats)
      .map((day) => ({
        date: day.date,
        totalInterviews: day.totalInterviews,
        averageScore: Number(
          (day.totalScore / day.totalInterviews).toFixed(2)
        ),
        bestScore: day.bestScore,
        interviews: day.interviews,
      }))
      .sort((a, b) => b.date.localeCompare(a.date));

    // Overall summary
    const totalInterviews = records.length;

    const averageScore = totalInterviews
      ? Number(
          (
            records.reduce(
              (sum, item) => sum + Number(item.score ?? 0),
              0
            ) / totalInterviews
          ).toFixed(2)
        )
      : 0;

    return NextResponse.json({
      success: true,
      timezone: "Asia/Kolkata",
      summary: {
        totalInterviews,
        activeDays: dailyProgress.length,
        averageScore,
      },
      dailyProgress,
    });
  } catch (error) {
    console.error("Daily progress error:", error);

    return NextResponse.json(
      { error: "Unable to fetch daily progress." },
      { status: 500 }
    );
  }
}
