"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

interface ResumeAnalysis {
  summary: string;
  skills: string[];
  projects: {
    name: string;
    description: string;
  }[];
  questions: {
    question: string;
    category: string;
  }[];
}

export default function ResumeClient() {
  const router = useRouter();

  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);

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
      setError("Please upload a valid PDF document.");
      setFile(null);
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setError("File size exceeds 5 MB limit.");
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

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const formData = new FormData();
      formData.append("resume", file);

      const response = await fetch("/api/analyze-resume", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to analyze resume.");
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong while analyzing."
      );
    } finally {
      setLoading(false);
    }
  }

  function handleStartInterview() {
    if (!analysis || analysis.questions.length === 0) {
      setError("No interview questions were generated. Please re-analyze your resume.");
      return;
    }

    sessionStorage.setItem(
      "prepvoice_resume_questions",
      JSON.stringify(analysis.questions)
    );

    router.push("/interview?mode=resume");
  }

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Document Intelligence
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">PDF Ingestion</span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Resume-Based Mock Interview
          </h1>
          <p className="mt-1 text-sm text-slate-500 max-w-2xl">
            Ingest your CV to extract key technical skills, architectural accomplishments, and generate targeted behavioral & technical questions.
          </p>
        </div>

        {/* Upload Station */}
        <div className="pro-card p-6 sm:p-8">
          <div
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/60 p-8 text-center transition-all hover:border-indigo-400 hover:bg-indigo-50/20"
          >
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-xs">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                <path d="M12 18v-6M9 15l3-3 3 3" />
              </svg>
            </div>

            <p className="mt-4 text-sm font-bold text-slate-800">
              Click to select or drop your resume (PDF)
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Strictly formatted PDF · Maximum file limit 5 MB
            </p>

            <button
              type="button"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
            >
              Browse Document
            </button>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 font-medium">
              {error}
            </div>
          )}

          {file && (
            <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl border border-emerald-200/90 bg-emerald-50/60 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-emerald-200 text-emerald-600">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <path d="M14 2v6h6" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                  <p className="text-[11px] text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB · Ready to parse
                  </p>
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                  setError("");
                  setAnalysis(null);
                  if (inputRef.current) inputRef.current.value = "";
                }}
                disabled={loading}
                className="text-xs font-semibold text-rose-600 hover:text-rose-800 self-start sm:self-auto"
              >
                Remove
              </button>
            </div>
          )}

          {file && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-5 pro-btn-primary w-full text-xs font-bold"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Analyzing Resume Content with Gemini...
                </>
              ) : (
                "Analyze Resume & Generate Interview Questions"
              )}
            </button>
          )}

          {/* Workflow Steps Indicator */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Step 01</span>
                <p className="mt-1 text-xs font-bold text-slate-800">Deep Resume Parsing</p>
                <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">
                  Extracts verified technologies, frameworks, and architecture milestones.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Step 02</span>
                <p className="mt-1 text-xs font-bold text-slate-800">Calibrated Questions</p>
                <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">
                  Generates realistic interview questions directly targeting your experience.
                </p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-3.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Step 03</span>
                <p className="mt-1 text-xs font-bold text-slate-800">Voice Simulation</p>
                <p className="mt-0.5 text-[11px] text-slate-500 leading-normal">
                  Speak answers aloud with real-time rubric feedback and diagnostics.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Analysis Output Section */}
        {analysis && (
          <div className="mt-8 space-y-6 animate-fade-up">
            {/* Executive Summary */}
            <div className="pro-card p-6">
              <h2 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Candidate Profile Summary
              </h2>
              <p className="mt-3 text-xs leading-relaxed text-slate-700">
                {analysis.summary}
              </p>
            </div>

            {/* Extracted Skills */}
            <div className="pro-card p-6">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Identified Skill Spectrum
              </h3>
              <div className="mt-3.5 flex flex-wrap gap-2">
                {analysis.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Extracted Projects */}
            <div className="pro-card p-6">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                Highlighted Projects & Systems
              </h3>
              <div className="mt-3.5 space-y-3">
                {analysis.projects.map((project, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-4"
                  >
                    <h4 className="text-xs font-bold text-slate-900">{project.name}</h4>
                    <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                      {project.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated Questions */}
            <div className="pro-card p-6">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Tailored Interview Questions ({analysis.questions.length})
                </h3>
                <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  Ready to Practice
                </span>
              </div>

              <div className="mt-4 space-y-3">
                {analysis.questions.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-slate-200/80 bg-white p-4 transition-colors hover:border-indigo-200"
                  >
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700 border border-indigo-100">
                        {item.category}
                      </span>
                    </div>
                    <p className="mt-2 text-xs font-semibold text-slate-800 leading-relaxed">
                      {index + 1}. {item.question}
                    </p>
                  </div>
                ))}
              </div>

              <button
                onClick={handleStartInterview}
                className="mt-6 pro-btn-primary w-full text-xs font-bold"
              >
                Launch Voice Simulation with These Questions →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
