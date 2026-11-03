
"use client";

import { useEffect, useState } from "react";

type FeedbackData = {
  relevance?: number | string | null;
  structure?: number | string | null;
  completeness?: number | string | null;
  technicalAccuracy?: number | string | null;
  improvements?: string | string[] | null;
};

type Interview = {
  score: number | string | null;
  category: string | null;
  feedback: FeedbackData | string | null;
};

type Skill = {
  name: string;
  score: number;
  action: string;
};

type GeneratedPlan = {
  summary: string;
  strengths: string[];
  weaknesses: {
    skill: string;
    reason: string;
    action: string;
  }[];
  dailyGoals: string[];
  nextInterviewGoals: string[];
  motivation: string;
};

type AIActionPlanProps = {
  interviews: Interview[];
};

export default function AIActionPlan({
  interviews,
}: AIActionPlanProps) {
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingSavedPlan, setLoadingSavedPlan] = useState(true);
  const [savingProgress, setSavingProgress] = useState(false);
  const [error, setError] = useState("");

  const [dailyCompleted, setDailyCompleted] = useState<number[]>([]);
  const [nextInterviewCompleted, setNextInterviewCompleted] = useState<number[]>([]);

  // Load previously saved AI Action Plan and progress.
  useEffect(() => {
    async function loadSavedPlan() {
      try {
        const response = await fetch("/api/action-plan", {
          method: "GET",
          cache: "no-store",
        });

        if (!response.ok) return;

        const result = await response.json();

        if (result.success && result.plan) {
          setPlan(result.plan);
          setDailyCompleted(
            Array.isArray(result.dailyCompleted)
              ? result.dailyCompleted
              : []
          );
          setNextInterviewCompleted(
            Array.isArray(result.nextInterviewCompleted)
              ? result.nextInterviewCompleted
              : []
          );
        }
      } catch (err) {
        console.error("Unable to load saved action plan:", err);
      } finally {
        setLoadingSavedPlan(false);
      }
    }

    loadSavedPlan();
  }, []);

  const skills: Skill[] = [
    {
      name: "Answer Relevance",
      score: 0,
      action: "Focus on answering exactly what the interviewer asks.",
    },
    {
      name: "Answer Structure",
      score: 0,
      action: "Organize answers with a clear beginning, middle and conclusion.",
    },
    {
      name: "Completeness",
      score: 0,
      action: "Include relevant details and examples in your answers.",
    },
    {
      name: "Technical Accuracy",
      score: 0,
      action: "Revise concepts and explain technical topics accurately.",
    },
  ];

  function getFeedback(feedback: Interview["feedback"]): FeedbackData {
    if (!feedback) return {};

    if (typeof feedback === "string") {
      try {
        return JSON.parse(feedback) as FeedbackData;
      } catch {
        return {};
      }
    }

    return feedback;
  }

  const skillKeys = [
    "relevance",
    "structure",
    "completeness",
    "technicalAccuracy",
  ] as const;

  const skillScores = skills.map((skill, index) => {
    const key = skillKeys[index];

    const values = interviews
      .map((interview) => {
        const feedback = getFeedback(interview.feedback);
        const value = Number(feedback[key]);

        return Number.isFinite(value) ? value : 0;
      })
      .filter((value) => value > 0 && value <= 10);

    const average = values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : 0;

    return { ...skill, score: average };
  });

  const prioritySkills = [...skillScores]
    .filter((skill) => skill.score > 0)
    .sort((a, b) => a.score - b.score);

  // Save checkbox progress to Supabase.
  async function saveProgress(
    newDailyCompleted: number[],
    newNextInterviewCompleted: number[]
  ) {
    const previousDaily = dailyCompleted;
    const previousNext = nextInterviewCompleted;

    setDailyCompleted(newDailyCompleted);
    setNextInterviewCompleted(newNextInterviewCompleted);
    setSavingProgress(true);
    setError("");

    try {
      const response = await fetch("/api/action-plan-progress", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dailyCompleted: newDailyCompleted,
          nextInterviewCompleted: newNextInterviewCompleted,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Unable to save progress.");
      }

      setDailyCompleted(result.dailyCompleted);
      setNextInterviewCompleted(result.nextInterviewCompleted);
    } catch (err) {
      setDailyCompleted(previousDaily);
      setNextInterviewCompleted(previousNext);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save your progress. Please try again."
      );
    } finally {
      setSavingProgress(false);
    }
  }

  function toggleDailyGoal(index: number) {
    if (savingProgress) return;

    const updated = dailyCompleted.includes(index)
      ? dailyCompleted.filter((item) => item !== index)
      : [...dailyCompleted, index];

    saveProgress(updated, nextInterviewCompleted);
  }

  function toggleNextInterviewGoal(index: number) {
    if (savingProgress) return;

    const updated = nextInterviewCompleted.includes(index)
      ? nextInterviewCompleted.filter((item) => item !== index)
      : [...nextInterviewCompleted, index];

    saveProgress(dailyCompleted, updated);
  }

  async function generateActionPlan() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/action-plan", {
        method: "POST",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to generate action plan.");
      }

      setPlan(result.plan);
      setDailyCompleted([]);
      setNextInterviewCompleted([]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const dailyPercentage = plan?.dailyGoals.length
    ? Math.round(
        (dailyCompleted.length / plan.dailyGoals.length) * 100
      )
    : 0;

  const nextPercentage = plan?.nextInterviewGoals.length
    ? Math.round(
        (nextInterviewCompleted.length / plan.nextInterviewGoals.length) * 100
      )
    : 0;

  return (
    <section className="mt-8 rounded-2xl border border-violet-100 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-xs font-bold tracking-widest text-violet-600">
          PERSONALIZED DEVELOPMENT
        </p>

        <h2 className="mt-2 text-xl font-bold text-gray-800">
          Your AI Action Plan
        </h2>

        <p className="mt-2 text-sm text-gray-500">
          Get personalized recommendations generated by Gemini using your
          saved interview performance.
        </p>
      </div>

      {interviews.length === 0 ? (
        <p className="rounded-xl bg-violet-50 p-5 text-sm text-violet-700">
          Complete your first interview to unlock your personalized action plan.
        </p>
      ) : (
        <>
          <div className="rounded-xl bg-violet-50 p-5">
            <p className="text-sm font-bold text-violet-800">
              Your current skill overview
            </p>

            <p className="mt-2 text-sm text-gray-600">
              Your skill scores are calculated from your saved interview feedback.
            </p>

            <p className="mt-3 text-xs font-semibold text-violet-700">
              Based on {interviews.length} saved interview attempts
            </p>
          </div>

          <div className="mt-6">
            <h3 className="font-bold text-gray-800">
              Priority skills
            </h3>

            <div className="mt-4 space-y-4">
              {prioritySkills.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Skill scores are not available yet.
                </p>
              ) : (
                prioritySkills.map((skill) => (
                  <div key={skill.name}>
                    <div className="mb-2 flex justify-between gap-3 text-sm">
                      <span className="font-semibold text-gray-700">
                        {skill.name}
                      </span>

                      <span className="font-bold text-violet-700">
                        {skill.score.toFixed(1)}/10
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-violet-100">
                      <div
                        className="h-full rounded-full bg-violet-600"
                        style={{
                          width: `${Math.min(100, skill.score * 10)}%`,
                        }}
                      />
                    </div>

                    <p className="mt-2 text-xs text-gray-500">
                      {skill.action}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-7">
            <button
              onClick={generateActionPlan}
              disabled={loading || loadingSavedPlan || savingProgress}
              className="w-full rounded-xl bg-violet-600 px-5 py-3 font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Analysing your interviews..."
                : loadingSavedPlan
                  ? "Loading saved action plan..."
                  : plan
                    ? "Regenerate AI Action Plan"
                    : "✨ Generate My AI Action Plan"}
            </button>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </p>
            )}
          </div>

          {plan && (
            <div className="mt-7 space-y-6">
              <div className="rounded-xl bg-gradient-to-r from-violet-50 to-blue-50 p-5">
                <h3 className="font-bold text-violet-900">
                  Your AI Performance Analysis
                </h3>

                <p className="mt-3 text-sm leading-7 text-gray-700">
                  {plan.summary}
                </p>

                <p className="mt-4 text-sm font-semibold text-violet-800">
                  {plan.motivation}
                </p>
              </div>

              <div>
                <h3 className="font-bold text-gray-800">
                  💪 Your Strengths
                </h3>

                <ul className="mt-3 space-y-2">
                  {plan.strengths.map((item, index) => (
                    <li
                      key={index}
                      className="rounded-lg bg-green-50 p-3 text-sm text-green-900"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-gray-800">
                  🎯 Areas to Improve
                </h3>

                <div className="mt-3 space-y-3">
                  {plan.weaknesses.map((item, index) => (
                    <div
                      key={index}
                      className="rounded-xl border border-orange-100 bg-orange-50 p-4"
                    >
                      <h4 className="font-bold text-orange-900">
                        {item.skill}
                      </h4>

                      <p className="mt-2 text-sm leading-6 text-gray-700">
                        {item.reason}
                      </p>

                      <p className="mt-3 text-sm leading-6 text-orange-900">
                        <strong>Action:</strong> {item.action}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Daily Goals Progress Tracker */}
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-blue-900">
                    📅 Your Daily Practice Goals
                  </h3>

                  <span className="text-sm font-bold text-blue-800">
                    {dailyPercentage}%
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-blue-100">
                  <div
                    className="h-full rounded-full bg-blue-600 transition-all"
                    style={{ width: `${dailyPercentage}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-blue-800">
                  {dailyCompleted.length} of {plan.dailyGoals.length} goals completed
                </p>

                <div className="mt-4 space-y-3">
                  {plan.dailyGoals.map((goal, index) => (
                    <label
                      key={index}
                      className="flex cursor-pointer items-start gap-3 rounded-lg bg-white p-3 text-sm text-blue-950 shadow-sm"
                    >
                      <input
                        type="checkbox"
                        checked={dailyCompleted.includes(index)}
                        disabled={savingProgress}
                        onChange={() => toggleDailyGoal(index)}
                        className="mt-1 h-4 w-4 shrink-0 accent-blue-600"
                      />

                      <span
                        className={
                          dailyCompleted.includes(index)
                            ? "text-gray-400 line-through"
                            : ""
                        }
                      >
                        {goal}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Next Interview Goals Progress Tracker */}
              <div className="rounded-xl border border-purple-100 bg-purple-50 p-5">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-bold text-purple-900">
                    🚀 Goals for Your Next Interview
                  </h3>

                  <span className="text-sm font-bold text-purple-800">
                    {nextPercentage}%
                  </span>
                </div>

                <div className="mt-3 h-2 overflow-hidden rounded-full bg-purple-100">
                  <div
                    className="h-full rounded-full bg-purple-600 transition-all"
                    style={{ width: `${nextPercentage}%` }}
                  />
                </div>

                <p className="mt-2 text-xs text-purple-800">
                  {nextInterviewCompleted.length} of {plan.nextInterviewGoals.length} goals completed
                </p>

                <div className="mt-4 space-y-3">
                  {plan.nextInterviewGoals.map((goal, index) => (
                    <label
                      key={index}
                      className="flex cursor-pointer items-start gap-3 rounded-lg bg-white p-3 text-sm text-purple-950 shadow-sm"
                    >
                      <input
                        type="checkbox"
                        checked={nextInterviewCompleted.includes(index)}
                        disabled={savingProgress}
                        onChange={() => toggleNextInterviewGoal(index)}
                        className="mt-1 h-4 w-4 shrink-0 accent-purple-600"
                      />

                      <span
                        className={
                          nextInterviewCompleted.includes(index)
                            ? "text-gray-400 line-through"
                            : ""
                        }
                      >
                        {goal}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {savingProgress && (
                <p className="text-xs text-gray-500">
                  Saving your progress...
                </p>
              )}

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                  {error}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}
