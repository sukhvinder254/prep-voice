
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DownloadReportButton from "./DownloadReportButton";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

interface SkillItem {
  skill?: string;
  name?: string;
  title?: string;
  description?: string;
  level?: string;
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
      if (typeof parsed === "object" && parsed !== null) {
        return parsed.skill || parsed.name || parsed.title || skill;
      }
    } catch {
      // Keep ordinary skill names unchanged.
    }

    return skill;
  }

  return skill.skill || skill.name || skill.title || "Skill";
}

function getRoadmapTitle(step: RoadmapData, index: number): string {
  if (typeof step === "string") {
    return `Learning Step ${index + 1}`;
  }

  return step.skill || step.title || step.topic || `Learning Step ${index + 1}`;
}

function getRoadmapAction(step: RoadmapData): string {
  if (typeof step === "string") return step;

  return step.action || step.description || step.details || "No action specified.";
}

function getRoadmapReason(step: RoadmapData): string {
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

export default async function SkillGapReportDetails({
  params,
}: PageProps) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: report, error } = await supabase
    .from("skill_gap_reports")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !report) {
    notFound();
  }

  const matchedSkills: SkillData[] = Array.isArray(report.matched_skills)
    ? (report.matched_skills as SkillData[])
    : [];

  const partialSkills: SkillData[] = Array.isArray(report.partial_skills)
    ? (report.partial_skills as SkillData[])
    : [];

  const missingSkills: SkillData[] = Array.isArray(report.missing_skills)
    ? (report.missing_skills as SkillData[])
    : [];

  const roadmap: RoadmapData[] = Array.isArray(report.learning_roadmap)
    ? (report.learning_roadmap as RoadmapData[])
    : [];

  const skillGroups = [
    {
      title: "Matched Skills",
      skills: matchedSkills,
      color: "green",
      empty: "No matched skills found.",
    },
    {
      title: "Partial Skills",
      skills: partialSkills,
      color: "yellow",
      empty: "No partial skills found.",
    },
    {
      title: "Missing Skills",
      skills: missingSkills,
      color: "red",
      empty: "No missing skills found.",
    },
  ];

  return (
    <main className="min-h-screen bg-[#f8f7ff] px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-6xl">

        {/* Navigation */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/skill-gap/history"
            className="font-semibold text-purple-700 hover:text-purple-900"
          >
            ← Back to Skill Gap History
          </Link>

          <DownloadReportButton
            report={{
              id: report.id,
              created_at: report.created_at,
              match_score: report.match_score,
              summary: report.summary,
              job_description: report.job_description,
              matched_skills: report.matched_skills,
              partial_skills: report.partial_skills,
              missing_skills: report.missing_skills,
              learning_roadmap: report.learning_roadmap,
            }}
          />
        </div>

        {/* Report Header */}
        <section className="mt-7 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="rounded-full bg-purple-100 px-4 py-2 text-xs font-bold text-purple-700">
              SKILL GAP REPORT
            </span>

            <span className="text-sm text-gray-500">
              {new Date(report.created_at).toLocaleString("en-IN")}
            </span>
          </div>

          <h1 className="mt-5 text-2xl font-bold text-gray-900 sm:text-3xl">
            Skill Gap Analysis
          </h1>

          <p className="mt-4 leading-7 text-gray-600">
            {report.summary}
          </p>

          <div className="mt-7 rounded-2xl bg-purple-50 p-6 text-center">
            <p className="text-sm font-semibold text-purple-700">
              Overall Skill Match Score
            </p>

            <p className="mt-2 text-5xl font-extrabold text-purple-800">
              {report.match_score}%
            </p>

            <div className="mx-auto mt-4 h-2 max-w-md overflow-hidden rounded-full bg-purple-200">
              <div
                className="h-full rounded-full bg-purple-600"
                style={{
                  width: `${Math.min(100, Math.max(0, Number(report.match_score) || 0))}%`,
                }}
              />
            </div>
          </div>
        </section>

        {/* Job Description */}
        <section className="mt-6 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-7">
          <h2 className="text-xl font-bold text-gray-900">
            Job Description
          </h2>

          <p className="mt-4 whitespace-pre-wrap leading-7 text-gray-600">
            {report.job_description}
          </p>
        </section>

        {/* Skills Overview */}
        <section className="mt-8">
          <div className="mb-5">
            <h2 className="text-2xl font-bold text-gray-900">
              Skills Assessment
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Understand which skills match the role and which need improvement.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {skillGroups.map((group) => (
              <div
                key={group.title}
                className={`rounded-2xl border p-6 ${
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

                  <span className="rounded-full bg-white px-3 py-1 text-sm font-bold text-gray-700">
                    {group.skills.length}
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
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
                      {group.empty}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Learning Roadmap */}
        <section className="mt-8 rounded-2xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
          <div>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">
              PERSONALIZED ACTION PLAN
            </span>

            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Your Learning Roadmap
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Follow these recommended steps to bridge your skill gaps.
            </p>
          </div>

          <div className="mt-7 space-y-5">
            {roadmap.length > 0 ? (
              roadmap.map((step, index) => {
                const priority =
                  typeof step === "string" ? "" : step.priority || "";

                return (
                  <div
                    key={index}
                    className="rounded-2xl border border-purple-100 bg-[#faf9ff] p-5 sm:p-6"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-sm font-bold text-white">
                          {index + 1}
                        </span>

                        <h3 className="text-lg font-bold text-gray-900">
                          {getRoadmapTitle(step, index)}
                        </h3>
                      </div>

                      {priority && (
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-bold ${getPriorityStyle(priority)}`}
                        >
                          {priority} Priority
                        </span>
                      )}
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-bold text-purple-800">
                        Recommended Action
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-gray-700">
                        {getRoadmapAction(step)}
                      </p>
                    </div>

                    {getRoadmapReason(step) && (
                      <div className="mt-4 rounded-xl border border-purple-100 bg-white p-4">
                        <p className="text-sm font-bold text-gray-800">
                          Why this matters
                        </p>

                        <p className="mt-2 text-sm leading-6 text-gray-600">
                          {getRoadmapReason(step)}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="rounded-xl bg-gray-50 p-5 text-sm text-gray-500">
                No learning roadmap available for this report.
              </p>
            )}
          </div>
        </section>

        {/* Footer */}
        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            href="/skill-gap/history"
            className="rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
          >
            Back to History
          </Link>

          <Link
            href="/skill-gap"
            className="rounded-xl border border-purple-200 bg-white px-6 py-3 font-semibold text-purple-700 transition hover:bg-purple-50"
          >
            New Skill Gap Analysis
          </Link>
        </div>

      </div>
    </main>
  );
}
