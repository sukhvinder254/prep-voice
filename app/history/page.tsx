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

  const validScores = interviews
    .map((item) => Number(item.score))
    .filter((score) => Number.isFinite(score));

  const averageScore = validScores.length
    ? (validScores.reduce((a, b) => a + b, 0) / validScores.length).toFixed(1)
    : "—";

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
                <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
                Audit Trail
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">Cloud History</span>
            </div>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Interview Evaluation Log
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Complete archive of past questions, transcript answers, and AI diagnostic scores.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/interview" className="pro-btn-primary text-xs font-bold px-4 py-2">
              + New Interview
            </Link>
          </div>
        </header>

        {/* Stats Row */}
        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="pro-card p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Logged Sessions
            </span>
            <p className="mt-2 text-3xl font-extrabold text-slate-900">
              {interviews.length}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Recorded speech attempts</p>
          </div>

          <div className="pro-card p-5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Cumulative Average Score
            </span>
            <p className="mt-2 text-3xl font-extrabold text-indigo-700">
              {averageScore} {validScores.length > 0 && <span className="text-sm font-normal text-slate-400">/ 10</span>}
            </p>
            <p className="mt-1 text-[11px] text-slate-400">Across all evaluated rounds</p>
          </div>
        </div>

        {/* Interviews Feed */}
        <section className="pro-card p-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
            <h2 className="text-sm font-bold text-slate-900">Historical Records</h2>
            <span className="text-xs text-slate-400">{interviews.length} Entries</span>
          </div>

          {error ? (
            <div className="py-8 text-center text-xs text-rose-600">
              Unable to load interview history at this time.
            </div>
          ) : interviews.length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <h3 className="mt-3 text-sm font-bold text-slate-900">No sessions logged yet</h3>
              <p className="mt-1 text-xs text-slate-500">
                Launch a practice interview to start recording telemetry feedback.
              </p>
              <Link
                href="/interview"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 transition"
              >
                Start Practice Session
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {interviews.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 transition-colors hover:bg-slate-50"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {item.category || item.role || "General"}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(item.created_at).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-2 text-xs font-semibold text-slate-800 leading-relaxed">
                        {item.question || "Practice question"}
                      </p>
                    </div>

                    <div className="shrink-0 rounded-lg bg-white border border-slate-200/80 px-3.5 py-1.5 text-center">
                      <span className="text-sm font-extrabold text-indigo-700">
                        {item.score !== null && item.score !== "" && Number.isFinite(Number(item.score))
                          ? Number(item.score)
                          : "—"}
                      </span>
                      <span className="text-[10px] text-slate-400"> / 10</span>
                    </div>
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
