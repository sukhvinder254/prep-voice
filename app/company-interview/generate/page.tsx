"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface InterviewQuestion {
  question: string;
  category: string;
}

interface InterviewData {
  title: string;
  company: string;
  role: string;
  level: string;
  interviewType: string;
  questions: InterviewQuestion[];
  keySkills: string[];
  jobDescriptionUsed?: boolean;
}

export default function GenerateInterviewPage() {
  const router = useRouter();

  const [interview, setInterview] = useState<InterviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function generateInterview() {
    setLoading(true);
    setError("");
    setInterview(null);

    try {
      const company = sessionStorage.getItem("prepvoice_company");
      const role = sessionStorage.getItem("prepvoice_role");
      const level = sessionStorage.getItem("prepvoice_level");
      const interviewType = sessionStorage.getItem(
        "prepvoice_interview_type"
      );
      const questionCount = sessionStorage.getItem(
        "prepvoice_question_count"
      );
      const duration = sessionStorage.getItem("prepvoice_duration");
      const jobDescription =
        sessionStorage.getItem("prepvoice_job_description") || "";

      if (
        !company ||
        !role ||
        !level ||
        !interviewType ||
        !questionCount ||
        !duration
      ) {
        throw new Error(
          "Interview details are missing. Please complete the setup again."
        );
      }

      const response = await fetch("/api/company-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          company,
          role,
          level,
          interviewType,
          questionCount: Number(questionCount),
          duration: Number(duration),
          jobDescription,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to generate your interview questions."
        );
      }

      setInterview(data.interview);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void generateInterview();
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  function handleStartInterview() {
    if (!interview || interview.questions.length === 0) return;

    sessionStorage.setItem(
      "prepvoice_company_questions",
      JSON.stringify(interview.questions)
    );

    router.push("/interview?mode=company");
  }

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Interview Generation
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">Gemini 1.5 Calibration</span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Calibrated Interview Plan
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Targeted interview track prepared specifically for your selected organization and domain.
          </p>
        </div>

        {loading && (
          <div className="pro-card p-12 text-center">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-3 border-indigo-100 border-t-indigo-600" />
            <h2 className="mt-5 text-base font-bold text-slate-900">
              Generating Question Track...
            </h2>
            <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">
              Synthesizing company interview history, role seniority rubrics, and job requirements.
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="pro-card p-8 text-center border-rose-200 bg-rose-50/30">
            <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 text-sm font-bold">
              !
            </div>
            <h2 className="mt-3 text-base font-bold text-slate-900">
              Generation Interrupted
            </h2>
            <p className="mt-1 text-xs text-slate-600 max-w-md mx-auto">{error}</p>
            <button
              onClick={generateInterview}
              className="mt-4 pro-btn-primary !min-h-9 text-xs"
            >
              Retry Generation →
            </button>
          </div>
        )}

        {interview && !loading && (
          <div className="pro-card p-6 sm:p-8 space-y-7 animate-fade-up">
            {/* Header Specs */}
            <div className="flex flex-wrap items-start justify-between gap-4 pb-5 border-b border-slate-100">
              <div>
                <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-[11px] font-bold text-indigo-700">
                  Target Org Track
                </span>
                <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                  {interview.company}
                </h2>
                <p className="text-xs font-semibold text-slate-500">
                  {interview.role}
                </p>
              </div>

              <div className="rounded-xl border border-slate-200/80 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700">
                {interview.level} Track
              </div>
            </div>

            {/* Spec KPIs */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Evaluation Domain", interview.interviewType],
                ["Question Count", `${interview.questions.length} Scenarios`],
                ["Target Duration", `${sessionStorage.getItem("prepvoice_duration") || "30"} Minutes`],
              ].map(([label, value]) => (
                <div key={label} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                  <p className="text-[11px] text-slate-400 font-medium">{label}</p>
                  <p className="mt-1 text-xs font-bold text-slate-900">{value}</p>
                </div>
              ))}
            </div>

            {/* Key Skills */}
            {interview.keySkills?.length > 0 && (
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <p className="text-xs font-bold text-slate-800">Assessed Competencies & Focus Points</p>
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {interview.keySkills.map((skill, idx) => (
                    <span
                      key={`${skill}-${idx}`}
                      className="rounded-md bg-white border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Question List */}
            <div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">
                Generated Mock Interview Scenarios
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Structured questions designed to simulate this company&apos;s interview round.
              </p>

              <div className="space-y-3">
                {interview.questions.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200/80 bg-white p-4 transition-colors hover:border-indigo-200"
                  >
                    <div className="flex items-start gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-xs font-bold text-indigo-700">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          {item.category}
                        </span>
                        <p className="mt-1 text-xs font-medium text-slate-800 leading-relaxed">
                          {item.question}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartInterview}
              className="pro-btn-primary w-full text-xs font-bold"
            >
              Start Live Voice Simulation with These Questions →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
