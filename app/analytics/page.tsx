import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnalyticsChart from "./AnalyticsChart";
import SkillDNA from "./SkillDNA";
import AIActionPlan from "./AIActionPlan";

export const dynamic = "force-dynamic";

interface InterviewRecord {
  id: string;
  question: string | null;
  category: string | null;
  role: string | null;
  score: number | string | null;
  created_at: string;
  feedback: {
    relevance?: number | string | null;
    structure?: number | string | null;
    completeness?: number | string | null;
    technicalAccuracy?: number | string | null;
  } | string | null;
}

export default async function AnalyticsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data, error } = await supabase
    .from("interview_history")
    .select("id, question, category, role, score, created_at, feedback")
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
    feedback: item.feedback,
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
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                Performance Telemetry
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">Readiness Metrics</span>
            </div>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Performance & Diagnostics
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Quantitative trends across technical precision, structure, completeness, and delivery.
            </p>
          </div>

          <Link href="/interview" className="pro-btn-primary text-xs font-bold px-4 py-2">
            + Start Interview Session
          </Link>
        </header>

        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700">
            Unable to fetch analytics telemetry. Please retry.
          </div>
        )}

        {/* Metrics Row */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="pro-card p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Evaluated Sessions
            </span>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">{total}</p>
            <p className="mt-1 text-[11px] text-slate-400">Total completed mock rounds</p>
          </div>

          <div className="pro-card p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cumulative Average
            </span>
            <p className="mt-2 text-3xl font-extrabold text-indigo-700">
              {total ? `${average.toFixed(1)}` : "—"}
              <span className="text-xs font-medium text-slate-400"> / 10</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Normalized performance score</p>
          </div>

          <div className="pro-card p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Peak Recorded Score
            </span>
            <p className="mt-2 text-3xl font-extrabold text-emerald-700">
              {total ? `${best}` : "—"}
              <span className="text-xs font-medium text-slate-400"> / 10</span>
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Personal best performance</p>
          </div>
        </section>

        {/* Historical Score Progress Chart */}
        <section className="mt-8 pro-card p-6 sm:p-7">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Score Trajectory Progression</h2>
              <p className="text-xs text-slate-500">Historical performance curve across sequential attempts</p>
            </div>
            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
              Telemetry Trend
            </span>
          </div>
          <AnalyticsChart data={chartData} />
        </section>

        {/* Skill DNA */}
        <div className="mt-8">
          <SkillDNA interviews={validInterviews} />
        </div>

        {/* AI Action Plan */}
        <div className="mt-8">
          <AIActionPlan interviews={validInterviews} />
        </div>

        {/* Category Performance Breakdown */}
        <section className="mt-8 pro-card p-6 sm:p-7">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Competency Domain Breakdown
              </h2>
              <p className="text-xs text-slate-500">Average performance ratings organized by technical topic</p>
            </div>
            <span className="text-xs text-slate-400">{categories.length} Topics</span>
          </div>

          {categories.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              Complete mock interview questions to generate categorical performance benchmarks.
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.name} className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                  <div className="mb-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900">{cat.name}</span>
                    <span className="font-bold text-indigo-700">
                      {cat.average.toFixed(1)} / 10 · {cat.count} {cat.count === 1 ? "attempt" : "attempts"}
                    </span>
                  </div>

                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-500"
                      style={{
                        width: `${Math.max(0, Math.min(100, (cat.average / 10) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
