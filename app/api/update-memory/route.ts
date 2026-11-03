
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Identify the currently logged-in user.
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

    // Fetch this user's saved interview records.
    const { data: interviews, error: historyError } = await supabase
      .from("interview_history")
      .select("score, category, feedback, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (historyError) {
      throw historyError;
    }

    const records = interviews ?? [];

    // Get the total number of saved interviews.
    const { count, error: countError } = await supabase
      .from("interview_history")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    if (countError) {
      throw countError;
    }

    // Calculate average score.
    const averageScore = records.length
      ? records.reduce(
          (sum, item) => sum + Number(item.score ?? 0),
          0
        ) / records.length
      : 0;

    // Calculate performance separately for each category.
    const topicStats: Record<
      string,
      { total: number; attempts: number }
    > = {};

    for (const item of records) {
      const topic = item.category?.trim() || "General";
      const score = Number(item.score ?? 0);

      if (!topicStats[topic]) {
        topicStats[topic] = { total: 0, attempts: 0 };
      }

      topicStats[topic].total += score;
      topicStats[topic].attempts += 1;
    }

    const topics = Object.entries(topicStats).map(
      ([topic, stats]) => ({
        topic,
        averageScore: Number(
          (stats.total / stats.attempts).toFixed(1)
        ),
        attempts: stats.attempts,
      })
    );

    // Identify strong and weak categories.
    const strongTopics = topics.filter(
      (item) => item.averageScore >= 7
    );

    const weakTopics = topics.filter(
      (item) => item.averageScore < 6
    );

    // Detect recurring improvement patterns.
    const improvementPatterns = [
      {
        key: "answer_structure",
        label: "Answer structure",
        keywords: [
          "structure",
          "structured",
          "organize",
          "organized",
          "organization",
        ],
      },
      {
        key: "examples",
        label: "Using relevant examples",
        keywords: [
          "example",
          "examples",
          "real-life",
          "real life",
          "situation",
        ],
      },
      {
        key: "clarity",
        label: "Answer clarity",
        keywords: [
          "clarity",
          "clear",
          "unclear",
          "explain clearly",
        ],
      },
      {
        key: "completeness",
        label: "Answer completeness",
        keywords: [
          "complete",
          "completeness",
          "missing details",
          "more detail",
        ],
      },
      {
        key: "conciseness",
        label: "Concise answers",
        keywords: [
          "concise",
          "concisely",
          "brief",
          "too long",
          "rambling",
        ],
      },
      {
        key: "technical_explanation",
        label: "Technical explanation",
        keywords: [
          "technical explanation",
          "technical accuracy",
          "concepts correctly",
        ],
      },
    ];

    const patternCounts: Record<string, number> = {};

    for (const item of records) {
      const improvement = item.feedback?.improvements;

      if (
        typeof improvement !== "string" ||
        !improvement.trim()
      ) {
        continue;
      }

      const text = improvement.toLowerCase();

      for (const pattern of improvementPatterns) {
        const matched = pattern.keywords.some((keyword) =>
          text.includes(keyword)
        );

        if (matched) {
          patternCounts[pattern.key] =
            (patternCounts[pattern.key] ?? 0) + 1;
        }
      }
    }

    const recurringMistakes = improvementPatterns
      .filter(
        (pattern) => (patternCounts[pattern.key] ?? 0) >= 2
      )
      .map((pattern) => ({
        observation: pattern.label,
        occurrences: patternCounts[pattern.key],
      }));

    // Keep recent improvement history.
    const improvementHistory = records
      .filter(
        (item) =>
          typeof item.feedback?.improvements === "string" &&
          item.feedback.improvements.trim()
      )
      .slice(0, 20)
      .map((item) => ({
        category: item.category ?? "General",
        score: Number(item.score ?? 0),
        improvement: item.feedback.improvements,
        date: item.created_at,
      }));

    // Save or update the user's learning profile.
    const { error: profileError } = await supabase
      .from("user_learning_profiles")
      .upsert(
        {
          user_id: user.id,
          total_interviews: count ?? records.length,
          average_score: Number(averageScore.toFixed(2)),
          strong_topics: strongTopics,
          weak_topics: weakTopics,
          recurring_mistakes: recurringMistakes,
          improvement_history: improvementHistory,
          last_interview_at: records[0]?.created_at ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (profileError) {
      throw profileError;
    }

    return NextResponse.json({
      success: true,
      totalInterviews: count ?? records.length,
      averageScore: Number(averageScore.toFixed(2)),
      strongTopics,
      weakTopics,
      recurringMistakes,
    });
  } catch (error: unknown) {
    console.error("Memory update error:", error);

    return NextResponse.json(
      { error: "Unable to update learning memory." },
      { status: 500 }
    );
  }
}
