import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import TaskChecklist from "./TaskChecklist";

interface DailyTask {
  day: number;
  topic: string;
  tasks: string[];
  goal: string;
}

interface PreparationPlan {
  id: string;
  user_id: string;
  target_role: string;
  duration_days: number;
  plan: {
    overview?: string;
    dailyPlan?: DailyTask[];
  };
  completed_tasks: string[];
  created_at: string;
}

export const dynamic = "force-dynamic";

export default async function PreparationPlanDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

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
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const plan = data as PreparationPlan;
  const dailyPlan = plan.plan?.dailyPlan ?? [];

  const completedTasks = Array.isArray(plan.completed_tasks)
    ? plan.completed_tasks.filter(
        (task): task is string => typeof task === "string"
      )
    : [];

  return (
    <main className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12 text-slate-800">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/preparation/history"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition mb-6"
        >
          <span>← Back to Preparation History</span>
        </Link>

        <div className="pro-card p-6 sm:p-8 mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                Active Study Roadmap
              </span>
              <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
                {plan.target_role}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                {plan.duration_days} Days Plan • Created {new Date(plan.created_at).toLocaleDateString()}
              </p>
            </div>

            <Link
              href="/preparation"
              className="pro-btn-secondary text-xs font-bold self-start sm:self-center"
            >
              + Create Another Plan
            </Link>
          </div>

          {plan.plan?.overview && (
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {plan.plan.overview}
            </p>
          )}
        </div>

        <TaskChecklist
          planId={plan.id}
          dailyPlan={dailyPlan}
          initialCompletedTasks={completedTasks}
        />
      </div>
    </main>
  );
}
