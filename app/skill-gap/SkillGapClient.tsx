
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
      setError("File size must be less than 5 MB.");
      setFile(null);
      return;
    }

    setFile(selectedFile);
  }

  async function handleAnalyze() {
    if (!file) {
      setError("Please upload your resume first.");
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
    <main className="min-h-screen bg-gradient-to-br from-[#faf8ff] via-white to-[#f1edff] px-5 py-12 text-gray-800">
      <div className="mx-auto max-w-5xl">

        <div className="mb-12">
          <p className="mb-3 text-sm font-bold tracking-[0.2em] text-purple-600">
            PREPVOICE AI
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            AI Skill Gap Analyzer
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-500">
            Discover how well your skills match a job role. Compare your
            resume with a job description and get a personalised roadmap
            to improve your profile.
          </p>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-[0_12px_50px_rgba(124,58,237,0.08)] sm:p-10">

          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-3xl">
              🎯
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              Analyse Your Job Readiness
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Upload your resume and add the job description.
            </p>
          </div>

          <div
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 px-5 py-10 text-center transition hover:border-purple-400 hover:bg-purple-50"
          >
            <div className="mb-4 text-4xl">📄</div>

            <p className="text-lg font-semibold text-gray-800">
              Upload Your Resume
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Click to select your resume in PDF format
            </p>

            <div className="mt-5 inline-flex rounded-xl bg-purple-600 px-7 py-3 font-semibold text-white shadow-lg shadow-purple-200">
              Browse PDF
            </div>

            <p className="mt-4 text-xs text-gray-400">
              PDF only · Maximum 5 MB
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {file && (
            <div className="mt-5 flex flex-col justify-between gap-3 rounded-2xl border border-green-100 bg-green-50 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0">
                <p className="font-semibold text-gray-800">
                  ✓ Resume selected
                </p>
                <p className="break-all text-sm text-gray-500">
                  {file.name}
                </p>
              </div>

              <button
                type="button"
                disabled={loading}
                onClick={() => {
                  setFile(null);
                  setAnalysis(null);
                  setError("");
                  if (inputRef.current) inputRef.current.value = "";
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-red-500 hover:bg-red-100 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )}

          <div className="mt-8">
            <label className="mb-3 block text-sm font-semibold text-gray-800">
              Job Description
            </label>

            <textarea
              value={jobDescription}
              onChange={(event) => {
                setJobDescription(event.target.value);
                setError("");
                setAnalysis(null);
              }}
              rows={8}
              maxLength={12000}
              placeholder="Paste the complete job description here...

Example:
We are looking for a Software Development Engineer Intern with knowledge of Python, JavaScript, React, Node.js, SQL, Data Structures and Algorithms..."
              className="w-full resize-y rounded-2xl border border-purple-200 bg-white p-4 text-sm leading-7 text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-100"
            />

            <p className="mt-2 text-right text-xs text-gray-400">
              {jobDescription.length}/12000 characters
            </p>
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading || !file || jobDescription.trim().length < 50}
            className="mt-7 w-full rounded-xl bg-purple-600 px-6 py-4 font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Analysing Your Skills..." : "Analyse My Skill Gap →"}
          </button>

          {loading && (
            <p className="mt-4 text-center text-sm text-purple-600">
              AI is comparing your resume with the job requirements. Please wait...
            </p>
          )}

          <div className="mt-8 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 p-5">
            <h3 className="font-semibold text-purple-900">
              What you will get
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  01. Skill Match
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  See which required skills you already have.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800">
                  02. Skill Gaps
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Identify skills that need improvement.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800">
                  03. Roadmap
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Get actionable steps to improve your profile.
                </p>
              </div>
            </div>
          </div>
        </div>

        {analysis && (
          <div className="mt-10 space-y-6">

            <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <p className="text-sm font-bold uppercase tracking-wider text-purple-600">
                Your Skill Match Score
              </p>

              <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
                <div
                  className="flex h-36 w-36 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: `conic-gradient(#7c3aed ${score * 3.6}deg, #ede9fe 0deg)`,
                  }}
                >
                  <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white">
                    <div className="text-center">
                      <p className="text-3xl font-extrabold text-gray-900">
                        {score}%
                      </p>
                      <p className="text-xs text-gray-500">Match</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your Job Readiness Overview
                  </h2>
                  <p className="mt-3 leading-7 text-gray-600">
                    {analysis.summary}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="rounded-3xl border border-green-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-green-700">
                  Matched Skills
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {analysis.matchedSkills.length}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Skills clearly found in your resume
                </p>
              </div>

              <div className="rounded-3xl border border-amber-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-amber-700">
                  Partially Matched
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {analysis.partialSkills.length}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Skills needing stronger evidence
                </p>
              </div>

              <div className="rounded-3xl border border-red-100 bg-white p-6 shadow-sm">
                <p className="text-sm font-semibold text-red-700">
                  Missing Skills
                </p>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {analysis.missingSkills.length}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Skills not demonstrated in your resume
                </p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <SkillList
                title="Matched Skills"
                skills={analysis.matchedSkills}
                color="green"
                emptyText="No clearly matched skills identified."
              />

              <SkillList
                title="Partially Matched"
                skills={analysis.partialSkills}
                color="amber"
                emptyText="No partial matches identified."
              />

              <SkillList
                title="Missing Skills"
                skills={analysis.missingSkills}
                color="red"
                emptyText="No missing skills identified."
              />
            </div>

            <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Your Personalised Learning Roadmap
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Focus on these areas to strengthen your job profile.
              </p>

              <div className="mt-6 space-y-4">
                {analysis.learningRoadmap.map((item, index) => (
                  <div
                    key={`${item.skill}-${index}`}
                    className="rounded-2xl border border-purple-100 p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-bold text-gray-900">
                        {index + 1}. {item.skill}
                      </h3>

                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        item.priority.toLowerCase() === "high"
                          ? "bg-red-100 text-red-700"
                          : item.priority.toLowerCase() === "medium"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}>
                        {item.priority} Priority
                      </span>
                    </div>

                    <p className="mt-3 text-sm leading-6 text-gray-600">
                      {item.reason}
                    </p>

                    <p className="mt-3 rounded-xl bg-purple-50 p-3 text-sm leading-6 text-purple-800">
                      <strong>Action:</strong> {item.action}
                    </p>
                  </div>
                ))}

                {analysis.learningRoadmap.length === 0 && (
                  <p className="rounded-xl bg-purple-50 p-4 text-sm text-gray-600">
                    No additional learning actions were suggested.
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setAnalysis(null);
                setError("");
              }}
              className="w-full rounded-xl border border-purple-200 bg-white px-6 py-4 font-semibold text-purple-700 transition hover:bg-purple-50"
            >
              Analyse Another Job Description
            </button>
          </div>
        )}
      </div>
    </main>
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
    green: {
      border: "border-green-100",
      heading: "text-green-700",
      pill: "bg-green-50 text-green-700",
    },
    amber: {
      border: "border-amber-100",
      heading: "text-amber-700",
      pill: "bg-amber-50 text-amber-700",
    },
    red: {
      border: "border-red-100",
      heading: "text-red-700",
      pill: "bg-red-50 text-red-700",
    },
  };

  const style = styles[color];

  return (
    <div className={`rounded-3xl border ${style.border} bg-white p-6 shadow-sm`}>
      <h3 className={`font-bold ${style.heading}`}>
        {title}
      </h3>

      <div className="mt-4 flex flex-wrap gap-2">
        {skills.map((skill, index) => (
          <span
            key={`${skill}-${index}`}
            className={`rounded-full px-3 py-2 text-sm font-medium ${style.pill}`}
          >
            {skill}
          </span>
        ))}
      </div>

      {skills.length === 0 && (
        <p className="mt-3 text-sm text-gray-500">
          {emptyText}
        </p>
      )}
    </div>
  );
}
