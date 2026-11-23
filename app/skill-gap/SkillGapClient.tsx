"use client";

import { useRef, useState } from "react";

interface SkillGapAnalysis {
  matchScore: number;
  summary: string;
  matchedSkills: string[];
  partialSkills: string[];
  missingSkills: string[];
  learningRoadmap: {
    priority: string;
    skill: string;
    reason: string;
    action: string;
  }[];
}

export default function SkillGapClient() {
  const [file, setFile] = useState<File | null>(null);
  const [jobDescription, setJobDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<SkillGapAnalysis | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    setError("");
    setAnalysis(null);

    if (!selectedFile) return;

    if (
      selectedFile.type !== "application/pdf" &&
      !selectedFile.name.toLowerCase().endsWith(".pdf")
    ) {
      setError("Please upload a PDF file only.");
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size must be under 5 MB.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }

  async function handleAnalyze() {
    if (!file) {
      setError("Please upload your resume before proceeding.");
      return;
    }

    if (jobDescription.trim().length < 50) {
      setError("Please enter a detailed Job Description (at least 50 characters).");
      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jobDescription", jobDescription.trim());

      const response = await fetch("/api/skill-gap", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Skill gap analysis failed.");
      }

      setAnalysis(data.analysis);
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

  const score = Math.min(100, Math.max(0, analysis?.matchScore ?? 0));

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Role Benchmark
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">Resume vs JD Matching</span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            AI Skill Gap Analyzer
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Cross-reference your CV with target job specifications to identify missing qualifications, keyword coverage, and an actionable roadmap.
          </p>
        </div>

        {/* Input Station */}
        <div className="pro-card p-6 sm:p-8 space-y-6">
          <div
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-7 text-center transition hover:border-indigo-400 hover:bg-indigo-50/20"
          >
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shadow-xs">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
              </svg>
            </div>
            <p className="mt-3 text-xs font-bold text-slate-800">
              {file ? file.name : "Select or Drop Resume (PDF)"}
            </p>
            <p className="mt-0.5 text-[11px] text-slate-400">PDF up to 5 MB</p>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Target Job Description
            </label>
            <textarea
              value={jobDescription}
              onChange={(e) => {
                setJobDescription(e.target.value);
                setError("");
                setAnalysis(null);
              }}
              rows={7}
              maxLength={12000}
              placeholder="Paste job posting details here..."
              className="pro-input text-xs"
            />
            <p className="mt-1 text-right text-[11px] text-slate-400">
              {jobDescription.length}/12000 characters
            </p>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !file || jobDescription.trim().length < 50}
            className="pro-btn-primary w-full text-xs font-bold"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Auditing Skill Coverage with Gemini...
              </>
            ) : (
              "Compute Skill Match & Gap Analysis →"
            )}
          </button>
        </div>

        {/* Results Section */}
        {analysis && (
          <div className="mt-8 space-y-6 animate-fade-up">
            {/* Match Score Card */}
            <div className="pro-card p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div
                  className="flex h-32 w-32 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#4f46e5 ${score * 3.6}deg, #e2e8f0 0deg)`,
                  }}
                >
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-inner">
                    <div className="text-center">
                      <p className="text-2xl font-extrabold text-slate-900">{score}%</p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase">Match</p>
                    </div>
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                    JD Alignment Diagnostic
                  </span>
                  <h2 className="mt-1.5 text-lg font-bold text-slate-900">
                    Readiness Evaluation Overview
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-600">
                    {analysis.summary}
                  </p>
                </div>
              </div>
            </div>

            {/* Counts Breakdown */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="pro-card p-5 border-emerald-200/90 bg-emerald-50/40">
                <span className="text-xs font-bold text-emerald-800">Direct Matches</span>
                <p className="mt-2 text-3xl font-extrabold text-emerald-900">{analysis.matchedSkills.length}</p>
                <p className="mt-0.5 text-[11px] text-emerald-700">Demonstrated in resume</p>
              </div>

              <div className="pro-card p-5 border-amber-200/90 bg-amber-50/40">
                <span className="text-xs font-bold text-amber-800">Partial Coverage</span>
                <p className="mt-2 text-3xl font-extrabold text-amber-900">{analysis.partialSkills.length}</p>
                <p className="mt-0.5 text-[11px] text-amber-700">Requires stronger evidence</p>
              </div>

              <div className="pro-card p-5 border-rose-200/90 bg-rose-50/40">
                <span className="text-xs font-bold text-rose-800">Critical Gaps</span>
                <p className="mt-2 text-3xl font-extrabold text-rose-900">{analysis.missingSkills.length}</p>
                <p className="mt-0.5 text-[11px] text-rose-700">Missing from CV</p>
              </div>
            </div>

            {/* Skill Lists */}
            <div className="grid gap-5 md:grid-cols-3">
              <SkillList
                title="Matched Competencies"
                skills={analysis.matchedSkills}
                color="green"
                emptyText="No direct keyword matches."
              />
              <SkillList
                title="Partial / Adjoining"
                skills={analysis.partialSkills}
                color="amber"
                emptyText="No partial matches."
              />
              <SkillList
                title="Missing Requirements"
                skills={analysis.missingSkills}
                color="red"
                emptyText="No critical omissions."
              />
            </div>

            {/* Personalized Learning Roadmap */}
            <div className="pro-card p-6 sm:p-8">
              <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Personalized Remediation Roadmap
              </h2>
              <div className="mt-4 space-y-3">
                {analysis.learningRoadmap.map((item, index) => (
                  <div
                    key={`${item.skill}-${index}`}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        {index + 1}. {item.skill}
                      </span>
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                          item.priority.toLowerCase() === "high"
                            ? "bg-rose-100 text-rose-800"
                            : item.priority.toLowerCase() === "medium"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {item.priority} Priority
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600">{item.reason}</p>
                    <p className="mt-2 text-xs font-semibold text-indigo-700 bg-indigo-50/70 p-2.5 rounded-lg border border-indigo-100">
                      Recommended Action: {item.action}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SkillList({
  title,
  skills,
  color,
  emptyText,
}: {
  title: string;
  skills: string[];
  color: "green" | "amber" | "red";
  emptyText: string;
}) {
  const styles = {
    green: "border-emerald-200/80 bg-emerald-50/40 text-emerald-900",
    amber: "border-amber-200/80 bg-amber-50/40 text-amber-900",
    red: "border-rose-200/80 bg-rose-50/40 text-rose-900",
  };

  return (
    <div className={`pro-card p-5 ${styles[color]}`}>
      <h3 className="text-xs font-bold mb-3">{title}</h3>
      <div className="flex flex-wrap gap-1.5">
        {skills.map((skill, index) => (
          <span
            key={`${skill}-${index}`}
            className="rounded-md bg-white border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-700"
          >
            {skill}
          </span>
        ))}
      </div>
      {skills.length === 0 && (
        <p className="text-[11px] text-slate-400 mt-2">{emptyText}</p>
      )}
    </div>
  );
}
