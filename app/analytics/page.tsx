
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnalyticsChart from "./AnalyticsChart";

export const dynamic = "force-dynamic";

interface InterviewRecord {
  id: string;
  question: string | null;
  category: string | null;
  role: string | null;
  score: number | string | null;
  created_at: string;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("interview_history")
    .select("id, question, category, role, score, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Analytics loading error:", error.message);
  }

  const interviews: InterviewRecord[] = (data ?? []).map((item) => ({
    id: String(item.id),
    question: item.question,
    category: item.category,
    role: item.role,
    score: item.score,
    created_at: item.created_at,
  }));

  const validInterviews = interviews.filter(
    (item) =>
      item.score !== null &&
      item.score !== "" &&
      Number.isFinite(Number(item.score))
  );

  const total = validInterviews.length;

  const average = total
    ? validInterviews.reduce(
        (sum, item) => sum + Number(item.score),
        0
      ) / total
    : 0;

  const best = total
    ? Math.max(...validInterviews.map((item) => Number(item.score)))
    : 0;

  const chartData = validInterviews.map((item, index) => ({
    attempt: `#${index + 1}`,
    score: Number(item.score),
    date: new Date(item.created_at).toLocaleDateString(),
  }));

  const categoryMap = validInterviews.reduce<
    Record<string, { total: number; count: number }>
  >((acc, item) => {
    const category = item.category || item.role || "General";

    if (!acc[category]) {
      acc[category] = { total: 0, count: 0 };
    }

    acc[category].total += Number(item.score);
    acc[category].count += 1;

    return acc;
  }, {});

  const categories = Object.entries(categoryMap).map(([name, values]) => ({
    name,
    average: values.total / values.count,
    count: values.count,
  }));

  return (
    <main className="min-h-screen bg-[#f8f7ff] px-6 py-8 text-gray-800 md:px-10">
      <header className="mb-8">
        <p className="text-sm font-semibold text-purple-600">PREPVOICE AI</p>
        <h1 className="mt-2 text-3xl font-bold">Your Analytics</h1>
        <p className="mt-2 text-gray-500">
          Track your interview performance and improvement.
        </p>
      </header>

      {error && (
        <p className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-600">
          Unable to load analytics data. Please try again later.
        </p>
      )}

      <section className="grid gap-5 sm:grid-cols-3">
        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Total Interviews</p>
          <h2 className="mt-3 text-3xl font-bold text-purple-700">{total}</h2>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Average Score</p>
          <h2 className="mt-3 text-3xl font-bold text-purple-700">
            {total ? `${average.toFixed(1)}/10` : "—"}
          </h2>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <p className="text-sm text-gray-500">Best Score</p>
          <h2 className="mt-3 text-3xl font-bold text-purple-700">
            {total ? `${best}/10` : "—"}
          </h2>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
        <h2 className="mb-6 text-xl font-bold">Score Progress</h2>
        <AnalyticsChart data={chartData} />
      </section>

      <section className="mt-8 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
        <h2 className="mb-5 text-xl font-bold">Category Performance</h2>

        {categories.length === 0 ? (
          <p className="py-6 text-center text-gray-400">
            Complete an interview to see category performance.
          </p>
        ) : (
          <div className="space-y-5">
            {categories.map((category) => (
              <div key={category.name}>
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span className="font-semibold">{category.name}</span>
                  <span className="text-purple-700">
                    {category.average.toFixed(1)}/10 · {category.count} attempts
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-purple-100">
                  <div
                    className="h-full rounded-full bg-purple-600"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, (category.average / 10) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Link
        href="/interview"
        className="mt-7 inline-block rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700"
      >
        + Start New Interview
      </Link>
    </main>
  );
}
