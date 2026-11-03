
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DailyProgress from "./DailyProgress";

export const dynamic = "force-dynamic";

interface InterviewRecord {
  id: string | number;
  question: string | null;
  category: string | null;
  role: string | null;
  score: number | string | null;
  created_at: string;
}

interface Topic {
  topic: string;
  averageScore: number;
  attempts: number;
}

interface RecurringMistake {
  observation: string;
  occurrences: number;
}

interface Improvement {
  category: string;
  score: number;
  improvement: string;
  date: string;
}

interface LearningProfile {
  total_interviews: number;
  average_score: number;
  strong_topics: Topic[];
  weak_topics: Topic[];
  recurring_mistakes: RecurringMistake[];
  improvement_history: Improvement[];
  last_interview_at: string | null;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Fetch interview history.
  const { data, error } = await supabase
    .from("interview_history")
    .select("id, question, category, role, score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Dashboard data error:", error.message);
  }

  const interviews: InterviewRecord[] = (data ?? []).map((item) => ({
    id: item.id,
    question: item.question,
    category: item.category,
    role: item.role,
    score: item.score,
    created_at: item.created_at,
  }));

  const validScores = interviews
    .map((item) => Number(item.score))
    .filter((score) => Number.isFinite(score));

  const total = interviews.length;

  const average = validScores.length
    ? validScores.reduce((sum, score) => sum + score, 0) /
      validScores.length
    : 0;

  const recentInterviews = interviews.slice(0, 5);

  // Fetch this user's Smart Memory profile.
  const { data: profileData, error: profileError } = await supabase
    .from("user_learning_profiles")
    .select(
      "total_interviews, average_score, strong_topics, weak_topics, recurring_mistakes, improvement_history, last_interview_at"
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Learning profile error:", profileError.message);
  }

  const profile = profileData as LearningProfile | null;

  const strongTopics = profile?.strong_topics ?? [];
  const weakTopics = profile?.weak_topics ?? [];
  const recurringMistakes = profile?.recurring_mistakes ?? [];
  const improvementHistory = profile?.improvement_history ?? [];

  return (
    <main className="min-h-screen bg-[#f8f7ff] px-6 py-8 text-gray-800 md:px-12">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-purple-600">
            PREPVOICE AI
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Welcome to your Dashboard 👋
          </h1>

          <p className="mt-2 text-gray-500">
            Your personal space to prepare for interviews.
          </p>
        </div>

        <Link
          href="/interview"
          className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white transition hover:bg-purple-700"
        >
          + Start Interview
        </Link>
      </header>

      {/* Existing Dashboard Statistics */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Interviews</p>

          <h2 className="mt-3 text-3xl font-bold text-purple-700">
            {total}
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Your saved practice sessions
          </p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Average Score</p>

          <h2 className="mt-3 text-3xl font-bold text-purple-700">
            {validScores.length ? `${average.toFixed(1)}/10` : "—"}
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Based on your saved scores
          </p>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Practice Goal</p>

          <h2 className="mt-3 text-3xl font-bold text-purple-700">
            {total >= 5 ? "Great progress!" : `${total}/5`}
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            {total >= 5
              ? "You have reached your five-session goal."
              : "Keep practising towards five sessions."}
          </p>
        </div>
      </section>

      {/* Existing Quick Actions */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Quick Actions</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Link
            href="/interview"
            className="rounded-2xl border border-purple-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md"
          >
            <span className="text-2xl">🎙️</span>

            <h3 className="mt-3 font-bold">Start an Interview</h3>

            <p className="mt-2 text-sm text-gray-500">
              Practise answering questions with AI feedback.
            </p>
          </Link>

          <Link
            href="/analytics"
            className="rounded-2xl border border-purple-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md"
          >
            <span className="text-2xl">📊</span>

            <h3 className="mt-3 font-bold">View Analytics</h3>

            <p className="mt-2 text-sm text-gray-500">
              Explore your progress and scores.
            </p>
          </Link>

          <Link
            href="/history"
            className="rounded-2xl border border-purple-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md"
          >
            <span className="text-2xl">📚</span>

            <h3 className="mt-3 font-bold">Interview History</h3>

            <p className="mt-2 text-sm text-gray-500">
              Review your previous practice sessions.
            </p>
          </Link>

          <Link
            href="/resume"
            className="rounded-2xl border border-purple-100 bg-white p-6 transition hover:-translate-y-1 hover:shadow-md"
          >
            <span className="text-2xl">📄</span>

            <h3 className="mt-3 font-bold">Resume-Based Interview</h3>

            <p className="mt-2 text-sm text-gray-500">
              Upload your resume and get AI-generated personalised interview questions.
            </p>
          </Link>
        </div>
      </section>

      {/* Smart Memory - Learning Insights */}
      <section className="mt-10">
        <div className="mb-5">
          <p className="text-sm font-semibold tracking-wider text-purple-600">
            PREPVOICE SMART MEMORY
          </p>

          <h2 className="mt-2 text-2xl font-bold">
            Your Learning Insights 🧠
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Personalized insights based on your saved interview performance.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Strong Areas */}
          <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-gray-800">
              💪 Strong Areas
            </h3>

            {strongTopics.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                Your strong areas will appear here as your performance improves.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {strongTopics.map((topic) => (
                  <div
                    key={topic.topic}
                    className="rounded-xl bg-green-50 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <p className="font-semibold text-gray-800">
                        {topic.topic}
                      </p>

                      <p className="font-bold text-green-700">
                        {topic.averageScore}/10
                      </p>
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                      {topic.attempts} practice sessions
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Areas to Improve */}
          <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-gray-800">
              🎯 Areas to Improve
            </h3>

            {weakTopics.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                No weak categories identified yet. Keep practising!
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {weakTopics.map((topic) => (
                  <div
                    key={topic.topic}
                    className="rounded-xl bg-orange-50 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <p className="font-semibold text-gray-800">
                        {topic.topic}
                      </p>

                      <p className="font-bold text-orange-700">
                        {topic.averageScore}/10
                      </p>
                    </div>

                    <p className="mt-1 text-xs text-gray-500">
                      Based on {topic.attempts} attempts
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recurring Improvement Patterns */}
          <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-gray-800">
              🔁 Recurring Improvement Patterns
            </h3>

            {recurringMistakes.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                Keep practising. Repeated improvement patterns will appear here when detected.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {recurringMistakes.map((item) => (
                  <div
                    key={item.observation}
                    className="rounded-xl bg-purple-50 p-4"
                  >
                    <p className="font-semibold text-gray-800">
                      {item.observation}
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Detected in {item.occurrences} interviews
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Learning Feedback */}
          <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-gray-800">
              📈 Recent Learning Feedback
            </h3>

            {improvementHistory.length === 0 ? (
              <p className="mt-4 text-sm text-gray-500">
                Your personalized feedback history will appear here after interviews.
              </p>
            ) : (
              <div className="mt-4 space-y-3">
                {improvementHistory.slice(0, 4).map((item, index) => (
                  <div
                    key={`${item.date}-${index}`}
                    className="rounded-xl bg-purple-50 p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-semibold text-gray-800">
                        {item.category}
                      </p>

                      <p className="text-sm font-bold text-purple-700">
                        {item.score}/10
                      </p>
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      {item.improvement}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {profile?.last_interview_at && (
          <p className="mt-4 text-xs text-gray-400">
            Learning profile last updated:{" "}
            {new Date(profile.last_interview_at).toLocaleDateString()}
          </p>
        )}
      </section>

      <DailyProgress />

      {/* Existing Recent Interviews */}
      <section className="mt-10 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-bold">Recent Interviews</h2>

          <Link
            href="/history"
            className="text-sm font-semibold text-purple-600 hover:text-purple-800"
          >
            View all →
          </Link>
        </div>

        {recentInterviews.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-gray-600">No interviews yet.</p>

            <p className="mt-2 text-sm text-gray-400">
              Start your first practice session to see your progress here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentInterviews.map((item) => (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-purple-50 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">
                    {item.category || item.role || "General Interview"}
                  </p>

                  <p className="mt-1 text-sm text-gray-500">
                    {item.question || "Practice interview"}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>

                <p className="shrink-0 font-bold text-purple-700">
                  {Number.isFinite(Number(item.score))
                    ? `${Number(item.score)}/10`
                    : "No score"}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Existing Next Step */}
      <section className="mt-10 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 p-7 text-white">
        <p className="text-sm text-purple-100">
          YOUR NEXT STEP
        </p>

        <h2 className="mt-2 text-2xl font-bold">
          Confidence comes with practice.
        </h2>

        <p className="mt-2 text-purple-100">
          Start a session, review your feedback, and keep improving.
        </p>

        <Link
          href="/interview"
          className="mt-5 inline-block rounded-xl bg-white px-5 py-3 font-semibold text-purple-700 transition hover:bg-purple-50"
        >
          Practice Now →
        </Link>
      </section>
    </main>
  );
}
