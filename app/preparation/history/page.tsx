
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
    <main className="min-h-screen bg-[#f8f7ff] px-6 py-10 text-gray-900">
      <div className="mx-auto max-w-5xl">

        <Link
          href="/preparation"
          className="text-sm text-purple-400 hover:text-purple-300"
        >
          ← Back to Preparation Planner
        </Link>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              Preparation History
            </h1>
            <p className="mt-2 text-gray-400">
              View all your previously generated preparation plans.
            </p>
          </div>

          <Link
            href="/preparation"
            className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold hover:bg-purple-500"
          >
            + Create New Plan
          </Link>
        </div>

        <div className="mt-10 space-y-5">
          {plans.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center">
              <h2 className="text-xl font-semibold">
                No preparation plans yet
              </h2>
              <p className="mt-3 text-gray-400">
                Generate your first personalized interview preparation plan.
              </p>
              <Link
                href="/preparation"
                className="mt-6 inline-block rounded-xl bg-purple-600 px-6 py-3 font-medium hover:bg-purple-500"
              >
                Generate Your First Plan
              </Link>
            </div>
          ) : (
            plans.map((item) => {
              const dailyPlan = item.plan?.dailyPlan ?? [];
              const totalTasks = dailyPlan.reduce(
                (total, day) => total + (day.tasks?.length ?? 0),
                0
              );

              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 transition hover:border-purple-500/40"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {item.target_role} Preparation
                      </h2>

                      <p className="mt-2 text-sm text-gray-400">
                        {item.duration_days} Days Plan
                      </p>
                    </div>

                    <span className="rounded-full bg-purple-500/10 px-4 py-2 text-xs font-medium text-purple-300">
                      Saved Plan
                    </span>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-gray-400">
                    {item.plan?.overview || "Personalized interview preparation plan."}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-6 text-sm text-gray-400">
                    <span>{dailyPlan.length} Days</span>
                    <span>{totalTasks} Tasks</span>
                    <span>
                      Created:{" "}
                      {new Date(item.created_at).toLocaleDateString("en-IN")}
                    </span>
                  </div>

                  <Link
                    href={`/preparation/history/${item.id}`}
                    className="mt-6 inline-block text-sm font-semibold text-purple-400 hover:text-purple-300"
                  >
                    View Full Plan →
                  </Link>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
