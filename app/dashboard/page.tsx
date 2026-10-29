
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface InterviewRecord {
  id: string | number;
  question: string | null;
  category: string | null;
  role: string | null;
  score: number | string | null;
  created_at: string;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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
        </div>
      </section>

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

      <section className="mt-10 rounded-2xl bg-gradient-to-r from-purple-600 to-violet-500 p-7 text-white">
        <p className="text-sm text-purple-100">YOUR NEXT STEP</p>
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
