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

  // Fetch interview history
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
    ? validScores.reduce((sum, score) => sum + score, 0) / validScores.length
    : 0;

  const recentInterviews = interviews.slice(0, 5);

  // Fetch this user's Smart Memory profile
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

  const candidateName =
    user.user_metadata?.full_name ||
    user.email?.split("@")[0] ||
    "Candidate";

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      {/* Top Header Bar */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Interview Workspace
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">
              {new Date().toLocaleDateString(undefined, {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Welcome back, {candidateName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track your speech telemetry, interview readiness, and AI performance diagnostics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/interview"
            className="pro-btn-primary flex items-center gap-2 px-5 py-2.5 shadow-sm shadow-indigo-500/25"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
              <line x1="12" x2="12" y1="19" y2="22" />
            </svg>
            <span>Start Voice Interview</span>
          </Link>
        </div>
      </header>

      {/* KPI Stats Metric Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* Metric 1 */}
        <div className="pro-card p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Sessions
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5v14M7 5v14M2 9v6M22 9v6" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {total}
            </span>
            <span className="text-xs text-slate-500 font-medium">completed</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-flex items-center text-emerald-600 font-semibold">
              ✓ Synced
            </span>
            <span>Recorded in cloud memory</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="pro-card p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Average Performance
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3v18h18" />
                <path d="m19 9-5 5-4-4-3 3" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {validScores.length ? average.toFixed(1) : "—"}
            </span>
            <span className="text-xs text-slate-500 font-medium">/ 10 Score</span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            {average >= 7 ? (
              <span className="text-emerald-600 font-semibold">Industry Competitive</span>
            ) : average >= 5 ? (
              <span className="text-amber-600 font-semibold">Intermediate Readiness</span>
            ) : (
              <span className="text-slate-500">Benchmark your baseline</span>
            )}
          </div>
        </div>

        {/* Metric 3 */}
        <div className="pro-card p-6 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Weekly Practice Target
            </span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
              {Math.min(total, 5)} / 5
            </span>
            <span className="text-xs text-slate-500 font-medium">sessions</span>
          </div>
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 transition-all duration-500"
                style={{ width: `${Math.min(100, (total / 5) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions Hub */}
      <section className="mt-10">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Quick Practice Modules
          </h2>
          <span className="text-xs font-medium text-slate-500">Select a practice track</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/interview"
            className="pro-card p-5 group hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-200">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <h3 className="mt-3.5 text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
              Voice Mock Interview
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Speak out loud with real-time speech-to-text and instant AI rubric evaluation.
            </p>
          </Link>

          <Link
            href="/company-interview"
            className="pro-card p-5 group hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600 group-hover:bg-violet-600 group-hover:text-white transition-colors duration-200">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="16" height="20" x="4" y="2" rx="2" />
                <path d="M9 22v-4h6v4" />
                <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01" />
              </svg>
            </div>
            <h3 className="mt-3.5 text-sm font-bold text-slate-900 group-hover:text-violet-600 transition-colors">
              Company-Targeted Prep
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Simulate interview tracks calibrated for Google, Meta, Amazon, and top startups.
            </p>
          </Link>

          <Link
            href="/resume"
            className="pro-card p-5 group hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors duration-200">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M10 9H8M16 13H8M16 17H8" />
              </svg>
            </div>
            <h3 className="mt-3.5 text-sm font-bold text-slate-900 group-hover:text-sky-600 transition-colors">
              Resume-Based Interview
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Upload your CV and receive AI questions tailored specifically to your experience.
            </p>
          </Link>

          <Link
            href="/skill-gap"
            className="pro-card p-5 group hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-200">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="m10 15 5-3-5-3v6Z" />
              </svg>
            </div>
            <h3 className="mt-3.5 text-sm font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
              Skill Gap Intelligence
            </h3>
            <p className="mt-1.5 text-xs leading-relaxed text-slate-500">
              Compare your competencies against target JD requirements and close knowledge gaps.
            </p>
          </Link>
        </div>
      </section>

      {/* Smart Memory - Learning Insights */}
      <section className="mt-10">
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Cognitive Telemetry
              </span>
            </div>
            <h2 className="mt-1.5 text-xl font-bold tracking-tight text-slate-900">
              Smart Memory & Learning Insights
            </h2>
            <p className="text-xs text-slate-500">
              Adaptive feedback engine tracking strengths, weaknesses, and speech delivery patterns.
            </p>
          </div>

          {profile?.last_interview_at && (
            <span className="text-xs text-slate-400">
              Profile updated: {new Date(profile.last_interview_at).toLocaleDateString()}
            </span>
          )}
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {/* Strong Areas */}
          <div className="pro-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </span>
                <h3 className="text-sm font-bold text-slate-900">Strong Competencies</h3>
              </div>
              <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {strongTopics.length} Identified
              </span>
            </div>

            {strongTopics.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-500">
                  Complete more practice sessions to uncover your strongest topic areas.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {strongTopics.map((topic) => (
                  <div
                    key={topic.topic}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-colors hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{topic.topic}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">{topic.attempts} practice sessions</p>
                    </div>
                    <span className="rounded-lg bg-emerald-100/70 px-2.5 py-1 text-xs font-bold text-emerald-800">
                      {topic.averageScore}/10
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Areas to Improve */}
          <div className="pro-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <h3 className="text-sm font-bold text-slate-900">High-Priority Growth Areas</h3>
              </div>
              <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                {weakTopics.length} Focus Points
              </span>
            </div>

            {weakTopics.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-500">
                  No critical knowledge gaps detected. Keep challenging yourself!
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {weakTopics.map((topic) => (
                  <div
                    key={topic.topic}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 transition-colors hover:bg-slate-50"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-800">{topic.topic}</p>
                      <p className="mt-0.5 text-[11px] text-slate-400">Based on {topic.attempts} attempts</p>
                    </div>
                    <span className="rounded-lg bg-amber-100/70 px-2.5 py-1 text-xs font-bold text-amber-800">
                      {topic.averageScore}/10
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recurring Patterns */}
          <div className="pro-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                  </svg>
                </span>
                <h3 className="text-sm font-bold text-slate-900">Recurring Delivery Patterns</h3>
              </div>
            </div>

            {recurringMistakes.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-500">
                  Delivery observations and habit tracking will populate with repeated sessions.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {recurringMistakes.map((item) => (
                  <div
                    key={item.observation}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
                  >
                    <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                      {item.observation}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Detected across {item.occurrences} recorded attempts
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feedback History */}
          <div className="pro-card p-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </span>
                <h3 className="text-sm font-bold text-slate-900">Recent Actionable Directives</h3>
              </div>
            </div>

            {improvementHistory.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-500">
                  AI coaching notes and directives appear here after each scored session.
                </p>
              </div>
            ) : (
              <div className="mt-4 space-y-2.5">
                {improvementHistory.slice(0, 3).map((item, index) => (
                  <div
                    key={`${item.date}-${index}`}
                    className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800">{item.category}</span>
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                        {item.score}/10
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">{item.improvement}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Daily Progress Module */}
      <div className="mt-8">
        <DailyProgress />
      </div>

      {/* Recent Interviews Table / List */}
      <section className="mt-10 pro-card p-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Interview Attempts</h2>
            <p className="text-xs text-slate-500">Detailed records of questions and evaluation scores</p>
          </div>
          <Link
            href="/history"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            Full Archive →
          </Link>
        </div>

        {recentInterviews.length === 0 ? (
          <div className="py-12 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" x2="12" y1="19" y2="22" />
              </svg>
            </div>
            <p className="mt-3 text-sm font-bold text-slate-800">No mock interviews completed yet</p>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Launch your first voice practice session to generate telemetry diagnostics and personalized insights.
            </p>
            <Link
              href="/interview"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-indigo-700 transition"
            >
              Start First Interview
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <div className="divide-y divide-slate-100">
              {recentInterviews.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5 hover:bg-slate-50/50 rounded-lg px-2 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 border border-indigo-100">
                        {item.category || item.role || "General"}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(item.created_at).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs font-semibold text-slate-800 truncate">
                      {item.question || "Practice scenario"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-slate-900">
                        {Number.isFinite(Number(item.score)) ? `${Number(item.score)}` : "—"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium"> / 10</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Bottom CTA Banner */}
      <section className="mt-10 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-7 text-white shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-200">
              ✦ Ready for your dream career?
            </span>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-white">
              Confidence comes with simulated repetition.
            </h2>
            <p className="mt-1 text-xs text-indigo-200/90 max-w-xl">
              Consistent practice with AI feedback trains clarity, structure, and technical authority under pressure.
            </p>
          </div>

          <Link
            href="/interview"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-bold text-indigo-950 shadow-sm hover:bg-indigo-50 active:scale-95 transition-all"
          >
            Launch Interview Session →
          </Link>
        </div>
      </section>
    </div>
  );
}
