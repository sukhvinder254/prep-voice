import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PreparationPlan {
  id: string;
  target_role: string;
  duration_days: number;
  plan: {
    overview?: string;
    dailyPlan?: {
      day: number;
      topic: string;
      tasks: string[];
      goal: string;
    }[];
  };
  completed_tasks?: string[];
  created_at: string;
}

export const dynamic = "force-dynamic";

export default async function PreparationHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data, error } = await supabase
    .from("interview_preparation_plans")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Preparation history error:", error.message);
  }

  const plans = (data ?? []) as PreparationPlan[];

  return (
    <main className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12 text-slate-800">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/preparation"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition mb-6"
        >
          <span>← Back to Preparation Planner</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
                Audit Trail
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">Historical Roadmaps</span>
            </div>
            <h1 className="mt-1.5 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Preparation Plan History
            </h1>
            <p className="mt-1 text-xs text-slate-500">
              Review and resume your customized role preparation roadmaps.
            </p>
          </div>

          <Link
            href="/preparation"
            className="pro-btn-primary text-xs font-bold self-start sm:self-center"
          >
            + Create New Roadmap
          </Link>
        </div>

        <div className="mt-8 space-y-4">
          {plans.length === 0 ? (
            <div className="pro-card p-12 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 2v4M16 2v4" />
                  <rect width="18" height="18" x="3" y="4" rx="2" />
                  <path d="M3 10h18" />
                </svg>
              </div>
              <h2 className="text-base font-bold text-slate-900">
                No saved preparation plans yet
              </h2>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Generate your first personalized interview preparation roadmap to track your daily milestones.
              </p>
              <Link
                href="/preparation"
                className="pro-btn-primary inline-flex text-xs font-bold mt-2"
              >
                Generate First Roadmap →
              </Link>
            </div>
          ) : (
            plans.map((item) => {
              const dailyPlan = item.plan?.dailyPlan ?? [];
              const totalTasks = dailyPlan.reduce(
                (total, day) => total + (day.tasks?.length ?? 0),
                0
              );
              const completedCount = item.completed_tasks?.length ?? 0;
              const percent = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

              return (
                <div key={item.id} className="pro-card p-6 hover:border-slate-300 transition space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                          {item.duration_days} Days Plan
                        </span>
                        <span className="text-xs text-slate-400">
                          Created {new Date(item.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {item.target_role}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-900">{percent}%</span>
                        <span className="text-[10px] text-slate-400 block">{completedCount}/{totalTasks} tasks</span>
                      </div>
                      <Link
                        href={`/preparation/history/${item.id}`}
                        className="pro-btn-secondary text-xs font-bold"
                      >
                        Open Plan →
                      </Link>
                    </div>
                  </div>

                  {item.plan?.overview && (
                    <p className="text-xs text-slate-600 line-clamp-2">
                      {item.plan.overview}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
