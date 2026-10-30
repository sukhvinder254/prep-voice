
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
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Unable to generate your interview."
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
    <main className="min-h-screen bg-gradient-to-br from-[#faf8ff] via-[#f5f0ff] to-[#eee7ff] px-5 py-12 text-gray-800">
      <div className="mx-auto max-w-4xl">

        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm">
            ✦ PREPVOICE AI
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Your Personalised Interview
          </h1>

          <p className="mt-3 text-sm text-gray-500 sm:text-base">
            AI-powered interview preparation for your dream company.
          </p>
        </div>

        {loading && (
          <div className="rounded-3xl border border-white bg-white/80 p-12 text-center shadow-lg shadow-purple-100">
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600" />

            <h2 className="mt-6 text-xl font-bold text-gray-900">
              Generating Your Interview...
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Gemini AI is preparing personalised interview questions.
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="rounded-3xl border border-red-100 bg-white p-8 text-center shadow-lg">
            <div className="text-3xl">⚠️</div>

            <h2 className="mt-4 text-xl font-bold text-gray-900">
              Interview Generation Failed
            </h2>

            <p className="mt-3 text-sm text-gray-500">
              {error}
            </p>

            <button
              onClick={generateInterview}
              className="mt-6 rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700"
            >
              Try Again →
            </button>
          </div>
        )}

        {interview && !loading && (
          <div className="rounded-3xl border border-white bg-white/80 p-5 shadow-[0_12px_45px_rgba(100,70,160,0.09)] sm:p-9">

            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-semibold text-purple-700">
                  AI GENERATED
                </span>

                <h2 className="mt-4 text-2xl font-bold text-gray-900">
                  {interview.company}
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  {interview.role}
                </p>
              </div>

              <div className="rounded-2xl bg-purple-50 px-4 py-3 text-sm font-semibold text-purple-700">
                {interview.level}
              </div>
            </div>

            <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {[
                ["Interview Type", interview.interviewType],
                ["Total Questions", String(interview.questions.length)],
                ["Duration", `${sessionStorage.getItem("prepvoice_duration") || "—"} min`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-xl border border-purple-100 bg-white p-4"
                >
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="mt-2 text-sm font-bold text-gray-800">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-9 border-t border-purple-100 pt-7">
              <h3 className="text-xl font-bold text-gray-900">
                Your Interview Questions
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Personalised questions generated for your preparation.
              </p>

              <div className="mt-6 space-y-4">
                {interview.questions.map((item, index) => (
                  <div
                    key={index}
                    className="rounded-2xl border border-purple-100 bg-white p-5 transition hover:border-purple-300"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-sm font-bold text-purple-700">
                        {String(index + 1).padStart(2, "0")}
                      </span>

                      <div className="flex-1">
                        <span className="text-xs font-semibold uppercase tracking-wide text-purple-600">
                          {item.category}
                        </span>

                        <p className="mt-2 text-sm font-medium leading-7 text-gray-800">
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
              className="mt-8 w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4 font-semibold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:from-purple-700 hover:to-violet-700"
            >
              Start Voice Mock Interview →
            </button>

            <div className="mt-5 rounded-2xl bg-purple-50 p-5 text-center">
              <p className="font-semibold text-purple-800">
                Your personalised interview is ready!
              </p>

              <p className="mt-2 text-sm text-purple-600">
                Your selected company and role have been used to personalise these questions.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
