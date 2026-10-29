
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

export default async function HistoryPage() {
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
    console.error("History loading error:", error.message);
  }

  const interviews: InterviewRecord[] = (data ?? []).map((item) => ({
    id: item.id,
    question: item.question,
    category: item.category,
    role: item.role,
    score: item.score,
    created_at: item.created_at,
  }));

  return (
    <main className="min-h-screen bg-[#f8f7ff] px-6 py-8 text-gray-800 md:px-12">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-purple-600">
            PREPVOICE AI
          </p>
          <h1 className="mt-2 text-3xl font-bold">Interview History</h1>
          <p className="mt-2 text-gray-500">
            Review your previous interview practice sessions.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="rounded-xl border border-purple-200 bg-white px-5 py-3 font-semibold text-purple-700 hover:bg-purple-50"
        >
          ← Dashboard
        </Link>
      </header>

      <section className="mb-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Saved Interviews</p>
          <h2 className="mt-2 text-3xl font-bold text-purple-700">
            {interviews.length}
          </h2>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Average Score</p>
          <h2 className="mt-2 text-3xl font-bold text-purple-700">
            {interviews.length > 0 &&
            interviews.some((item) => item.score !== null && item.score !== "")
              ? (
                  interviews.reduce(
                    (sum, item) =>
                      sum +
                      (Number.isFinite(Number(item.score))
                        ? Number(item.score)
                        : 0),
                    0
                  ) /
                  interviews.filter(
                    (item) =>
                      item.score !== null &&
                      item.score !== "" &&
                      Number.isFinite(Number(item.score))
                  ).length
                ).toFixed(1)
              : "—"}
            {interviews.some(
              (item) =>
                item.score !== null &&
                item.score !== "" &&
                Number.isFinite(Number(item.score))
            )
              ? "/10"
              : ""}
          </h2>
        </div>
      </section>

      <section className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-bold">All Interviews</h2>

        {error ? (
          <p className="py-8 text-center text-red-600">
            We couldn&apos;t load your history. Please try again later.
          </p>
        ) : interviews.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-4xl">📚</p>
            <h3 className="mt-4 text-lg font-semibold">
              No interviews saved yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Your completed practice sessions will appear here.
            </p>
            <Link
              href="/interview"
              className="mt-5 inline-block rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700"
            >
              Start an Interview
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((item) => (
              <article
                key={item.id}
                className="rounded-xl border border-purple-100 bg-purple-50/60 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-gray-800">
                      {item.category || item.role || "General Interview"}
                    </h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                      {item.question || "Practice interview question"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-white px-4 py-2 text-center">
                    <p className="text-xs text-gray-500">Score</p>
                    <p className="font-bold text-purple-700">
                      {item.score !== null &&
                      item.score !== "" &&
                      Number.isFinite(Number(item.score))
                        ? `${Number(item.score)}/10`
                        : "—"}
                    </p>
                  </div>
                </div>

                <p className="mt-4 text-xs text-gray-400">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </article>
            ))}
          </div>
        )}
      </section>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href="/interview"
          className="rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700"
        >
          + Start New Interview
        </Link>

        <Link
          href="/analytics"
          className="rounded-xl border border-purple-200 bg-white px-5 py-3 font-semibold text-purple-700 hover:bg-purple-50"
        >
          View Analytics →
        </Link>
      </div>
    </main>
  );
}
