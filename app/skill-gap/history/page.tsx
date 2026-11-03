
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

interface SkillItem {
  skill?: string;
  name?: string;
  title?: string;
}

interface RoadmapStep {
  skill?: string;
  title?: string;
  action?: string;
  reason?: string;
  priority?: string;
  topic?: string;
  description?: string;
  details?: string;
}

type SkillData = string | SkillItem;
type RoadmapData = string | RoadmapStep;

function getSkillName(skill: SkillData): string {
  if (typeof skill === "string") {
    try {
      const parsed = JSON.parse(skill);

      if (Array.isArray(parsed)) return parsed.join(", ");

      if (parsed && typeof parsed === "object") {
        return parsed.skill || parsed.name || parsed.title || skill;
      }
    } catch {
      // Keep ordinary skill names unchanged.
    }

    return skill;
  }

  return skill.skill || skill.name || skill.title || "Skill";
}

function getRoadmapTitle(step: RoadmapData, index: number) {
  if (typeof step === "string") {
    return `Learning Step ${index + 1}`;
  }

  return step.skill || step.title || step.topic || `Learning Step ${index + 1}`;
}

function getRoadmapAction(step: RoadmapData) {
  if (typeof step === "string") return step;

  return step.action || step.description || step.details || "No action specified.";
}

function getRoadmapReason(step: RoadmapData) {
  if (typeof step === "string") return "";

  return step.reason || "";
}

function getPriorityStyle(priority?: string) {
  switch (priority?.toLowerCase()) {
    case "high":
      return "bg-red-100 text-red-700";
    case "medium":
      return "bg-yellow-100 text-yellow-800";
    case "low":
      return "bg-green-100 text-green-700";
    default:
      return "bg-purple-100 text-purple-700";
  }
}

export default async function SkillGapHistoryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  async function deleteReport(formData: FormData) {
    "use server";

    const reportId = String(formData.get("reportId") || "");

    if (!reportId) return;

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) redirect("/login");

    await supabase
      .from("skill_gap_reports")
      .delete()
      .eq("id", reportId)
      .eq("user_id", user.id);

    redirect("/skill-gap/history");
  }

  const { data: reports, error } = await supabase
    .from("skill_gap_reports")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-[#f8f7ff] p-8">
        <h1 className="text-2xl font-bold text-gray-900">
          Skill Gap History
        </h1>
        <p className="mt-4 text-red-600">
          Unable to load reports. Please try again.
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f7ff] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
              YOUR REPORTS
            </span>

            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              Skill Gap History
            </h1>

            <p className="mt-2 text-gray-500">
              View and manage your previous skill gap analyses.
            </p>
          </div>

          <Link
            href="/skill-gap"
            className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-purple-700"
          >
            + New Analysis
          </Link>
        </div>

        {/* Total Reports */}
        <div className="mb-7 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-gray-500">
            Total Saved Reports
          </p>

          <p className="mt-2 text-3xl font-bold text-purple-700">
            {reports?.length || 0}
          </p>
        </div>

        {/* Empty State */}
        {!reports || reports.length === 0 ? (
          <div className="rounded-2xl border border-purple-100 bg-white p-10 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800">
              No reports yet
            </h2>

            <p className="mt-2 text-gray-500">
              Your completed Skill Gap analyses will appear here.
            </p>

            <Link
              href="/skill-gap"
              className="mt-5 inline-block rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700"
            >
              Analyze Your Resume
            </Link>
          </div>
        ) : (

          /* Reports */
          <div className="space-y-7">
            {reports.map((report) => {
              const matchedSkills: SkillData[] = Array.isArray(report.matched_skills)
                ? report.matched_skills as SkillData[]
                : [];

              const partialSkills: SkillData[] = Array.isArray(report.partial_skills)
                ? report.partial_skills as SkillData[]
                : [];

              const missingSkills: SkillData[] = Array.isArray(report.missing_skills)
                ? report.missing_skills as SkillData[]
                : [];

              const roadmap: RoadmapData[] = Array.isArray(report.learning_roadmap)
                ? report.learning_roadmap as RoadmapData[]
                : [];

              const skillGroups = [
                {
                  title: "Matched Skills",
                  skills: matchedSkills,
                  color: "green",
                },
                {
                  title: "Partial Skills",
                  skills: partialSkills,
                  color: "yellow",
                },
                {
                  title: "Missing Skills",
                  skills: missingSkills,
                  color: "red",
                },
              ];

              return (
                <article
                  key={report.id}
                  className="overflow-hidden rounded-2xl border border-purple-100 bg-white shadow-sm transition hover:shadow-md"
                >
                  {/* Report Header */}
                  <div className="border-b border-gray-100 p-6">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-gray-500">
                          {new Date(report.created_at).toLocaleString("en-IN")}
                        </p>

                        <h2 className="mt-2 text-xl font-bold text-gray-900">
                          Skill Gap Analysis
                        </h2>
                      </div>

                      <div className="rounded-xl bg-purple-50 px-5 py-3 text-center">
                        <p className="text-2xl font-bold text-purple-700">
                          {report.match_score}%
                        </p>
                        <p className="text-xs text-purple-600">
                          Skill Match
                        </p>
                      </div>
                    </div>

                    <p className="mt-5 leading-7 text-gray-600">
                      {report.summary}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <Link
                        href={`/skill-gap/history/${report.id}`}
                        className="rounded-lg bg-purple-100 px-4 py-2.5 text-sm font-semibold text-purple-700 transition hover:bg-purple-200"
                      >
                        View Full Details →
                      </Link>
                    </div>
                  </div>

                  {/* Job Description */}
                  <div className="p-6">
                    <h3 className="font-bold text-gray-900">
                      Job Description
                    </h3>

                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-600">
                      {report.job_description}
                    </p>
                  </div>

                  {/* Skills */}
                  <div className="grid gap-4 px-6 pb-6 md:grid-cols-3">
                    {skillGroups.map((group) => (
                      <div
                        key={group.title}
                        className={`rounded-xl border p-5 ${
                          group.color === "green"
                            ? "border-green-200 bg-green-50"
                            : group.color === "yellow"
                            ? "border-yellow-200 bg-yellow-50"
                            : "border-red-200 bg-red-50"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-gray-900">
                            {group.title}
                          </h3>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-gray-700">
                            {group.skills.length}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {group.skills.length > 0 ? (
                            group.skills.map((skill, index) => (
                              <span
                                key={index}
                                className={`rounded-lg border bg-white px-3 py-2 text-sm font-medium ${
                                  group.color === "green"
                                    ? "border-green-200 text-green-800"
                                    : group.color === "yellow"
                                    ? "border-yellow-200 text-yellow-800"
                                    : "border-red-200 text-red-800"
                                }`}
                              >
                                {getSkillName(skill)}
                              </span>
                            ))
                          ) : (
                            <p className="text-sm text-gray-500">
                              No skills found.
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Learning Roadmap */}
                  <div className="border-t border-gray-100 bg-[#faf9ff] p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          Personalized Learning Roadmap
                        </h3>

                        <p className="mt-1 text-sm text-gray-500">
                          Recommended steps to improve your skills.
                        </p>
                      </div>

                      <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
                        {roadmap.length} Steps
                      </span>
                    </div>

                    <div className="mt-5 space-y-4">
                      {roadmap.length > 0 ? (
                        roadmap.map((step, index) => {
                          const priority =
                            typeof step === "string" ? "" : step.priority || "";

                          return (
                            <div
                              key={index}
                              className="rounded-xl border border-purple-100 bg-white p-5"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-600 text-sm font-bold text-white">
                                    {index + 1}
                                  </span>

                                  <h4 className="font-bold text-gray-900">
                                    {getRoadmapTitle(step, index)}
                                  </h4>
                                </div>

                                {priority && (
                                  <span
                                    className={`rounded-full px-3 py-1 text-xs font-bold ${getPriorityStyle(priority)}`}
                                  >
                                    {priority} Priority
                                  </span>
                                )}
                              </div>

                              <div className="mt-4">
                                <p className="text-sm font-semibold text-purple-800">
                                  Recommended Action
                                </p>

                                <p className="mt-1 text-sm leading-6 text-gray-600">
                                  {getRoadmapAction(step)}
                                </p>
                              </div>

                              {getRoadmapReason(step) && (
                                <div className="mt-4 rounded-lg bg-purple-50 p-4">
                                  <p className="text-sm font-semibold text-purple-900">
                                    Why this matters
                                  </p>

                                  <p className="mt-1 text-sm leading-6 text-gray-600">
                                    {getRoadmapReason(step)}
                                  </p>
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <p className="rounded-xl bg-white p-5 text-sm text-gray-500">
                          No learning roadmap available.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <div className="flex justify-end border-t border-gray-100 p-5">
                    <form action={deleteReport}>
                      <input
                        type="hidden"
                        name="reportId"
                        value={report.id}
                      />

                      <button
                        type="submit"
                        className="rounded-lg border border-red-200 px-5 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        Delete Report
                      </button>
                    </form>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
