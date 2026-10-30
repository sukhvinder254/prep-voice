
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

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
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
      setError("Please select your resume first.");
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

      if (!response.ok) {
        throw new Error(data.error || "Resume analysis failed.");
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

  function handleStartInterview() {
    if (!analysis || analysis.questions.length === 0) {
      setError("No interview questions were generated. Please analyse your resume again.");
      return;
    }

    sessionStorage.setItem(
      "prepvoice_resume_questions",
      JSON.stringify(analysis.questions)
    );

    router.push("/interview?mode=resume");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf8ff] via-white to-[#f1edff] px-5 py-12 text-gray-800">
      <div className="mx-auto max-w-4xl">

        <div className="mb-12">
          <p className="mb-3 text-sm font-bold tracking-[0.2em] text-purple-600">
            PREPVOICE AI
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Resume-Based Interview
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-gray-500">
            Turn your resume into a personalised interview experience.
            Upload your resume and let AI prepare questions based on
            your skills and projects.
          </p>
        </div>

        <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-[0_12px_50px_rgba(124,58,237,0.08)] sm:p-10">

          <div className="mb-8 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-100 text-purple-600">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
                <path d="M8 13h8" />
                <path d="M8 17h8" />
                <path d="M8 9h2" />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-gray-900">
              Upload Your Resume
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Let&apos;s personalise your next interview.
            </p>
          </div>

          <div
            onClick={() => inputRef.current?.click()}
            className="cursor-pointer rounded-2xl border-2 border-dashed border-purple-200 bg-purple-50/40 px-5 py-12 text-center transition hover:border-purple-400 hover:bg-purple-50"
          >
            <div className="mb-4 text-4xl">📄</div>

            <p className="text-lg font-semibold text-gray-800">
              Choose your resume
            </p>

            <p className="mt-2 text-sm text-gray-500">
              Click here to browse your files
            </p>

            <div className="mt-6 inline-flex items-center justify-center rounded-xl bg-purple-600 px-7 py-3 font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700">
              Browse PDF
            </div>

            <p className="mt-5 text-xs text-gray-400">
              PDF format only · Maximum file size 5 MB
            </p>

            <input
              ref={inputRef}
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {error && (
            <p className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {file && (
            <div className="mt-6 flex flex-col justify-between gap-4 rounded-2xl border border-green-100 bg-green-50 p-4 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white p-3 text-2xl shadow-sm">
                  📄
                </div>

                <div className="min-w-0">
                  <p className="font-semibold text-gray-800">
                    Resume selected
                  </p>

                  <p className="break-all text-sm text-gray-500">
                    {file.name}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setFile(null);
                  setError("");
                  setAnalysis(null);

                  if (inputRef.current) {
                    inputRef.current.value = "";
                  }
                }}
                disabled={loading}
                className="rounded-lg px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-100 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )}

          {file && (
            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-purple-600 px-6 py-4 font-semibold text-white shadow-lg shadow-purple-200 transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analysing Your Resume..." : "Analyse My Resume"}
            </button>
          )}

          {loading && (
            <p className="mt-4 text-center text-sm text-purple-600">
              AI is reading your resume and preparing personalised questions. Please wait...
            </p>
          )}

          <div className="mt-8 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 p-5">
            <h3 className="font-semibold text-purple-900">
              What happens next?
            </h3>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  01. Analyse
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  AI understands your resume.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800">
                  02. Generate
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Get personalised questions.
                </p>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800">
                  03. Practise
                </p>
                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Start your mock interview.
                </p>
              </div>
            </div>
          </div>
        </div>

        {analysis && (
          <div className="mt-10 space-y-6">

            <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900">
                Resume Analysis
              </h2>

              <p className="mt-4 leading-7 text-gray-600">
                {analysis.summary}
              </p>
            </div>

            <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h3 className="text-xl font-bold text-gray-900">
                Your Skills
              </h3>

              <div className="mt-4 flex flex-wrap gap-2">
                {analysis.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h3 className="text-xl font-bold text-gray-900">
                Projects Identified
              </h3>

              <div className="mt-4 space-y-4">
                {analysis.projects.map((project, index) => (
                  <div
                    key={index}
                    className="rounded-2xl bg-purple-50 p-4"
                  >
                    <h4 className="font-semibold text-gray-900">
                      {project.name}
                    </h4>

                    <p className="mt-2 text-sm leading-6 text-gray-600">
                      {project.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-purple-100 bg-white p-6 shadow-sm sm:p-8">
              <h3 className="text-xl font-bold text-gray-900">
                Personalised Interview Questions
              </h3>

              <div className="mt-5 space-y-4">
                {analysis.questions.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-purple-100 p-4"
                  >
                    <p className="text-xs font-bold uppercase tracking-wider text-purple-600">
                      {item.category}
                    </p>

                    <p className="mt-2 font-medium leading-7 text-gray-800">
                      {index + 1}. {item.question}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={handleStartInterview}
              className="w-full rounded-xl bg-purple-600 px-6 py-4 font-semibold text-white shadow-lg transition hover:bg-purple-700"
            >
              Start Resume-Based Mock Interview →
            </button>

          </div>
        )}
      </div>
    </main>
  );
}
