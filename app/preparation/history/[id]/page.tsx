
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
    <main className="min-h-screen bg-[#0b0b0f] px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/preparation/history"
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          ← Back to Preparation History
        </Link>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-7">
          <span className="text-sm font-medium text-purple-400">
            PERSONALIZED PREPARATION PLAN
          </span>

          <h1 className="mt-3 text-3xl font-bold">
            {plan.target_role} Preparation
          </h1>

          <p className="mt-3 leading-7 text-gray-400">
            {plan.plan?.overview ||
              "Your personalized interview preparation roadmap."}
          </p>

          <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-white/[0.04] p-4">
              <p className="text-sm text-gray-400">Duration</p>
              <p className="mt-2 text-2xl font-bold">
                {plan.duration_days} Days
              </p>
            </div>

            <div className="rounded-xl bg-white/[0.04] p-4">
              <p className="text-sm text-gray-400">Daily Roadmap</p>
              <p className="mt-2 text-2xl font-bold">
                {dailyPlan.length} Days
              </p>
            </div>
          </div>
        </div>

        <div className="mb-5 mt-10">
          <h2 className="text-2xl font-bold">
            Your Daily Roadmap
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Complete each task and track your preparation progress.
          </p>
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
