
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InterviewSetupPage() {
  const router = useRouter();

  const [interviewType, setInterviewType] = useState("Mixed");
  const [questionCount, setQuestionCount] = useState("10");
  const [duration, setDuration] = useState("30");

  const company =
    typeof window !== "undefined"
      ? sessionStorage.getItem("prepvoice_company")
      : null;

  const role =
    typeof window !== "undefined"
      ? sessionStorage.getItem("prepvoice_role")
      : null;

  const level =
    typeof window !== "undefined"
      ? sessionStorage.getItem("prepvoice_level")
      : null;

  const types = ["Technical", "HR", "Mixed"];
  const questionOptions = ["5", "10", "15"];
  const durationOptions = ["15", "30", "45"];

  function handleContinue() {
    sessionStorage.setItem("prepvoice_interview_type", interviewType);
    sessionStorage.setItem("prepvoice_question_count", questionCount);
    sessionStorage.setItem("prepvoice_duration", duration);

    router.push("/company-interview/generate");
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#faf8ff] via-[#f5f0ff] to-[#eee7ff] px-5 py-12 text-gray-800">
      <div className="mx-auto max-w-4xl">

        <div className="mb-10 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-white/80 px-4 py-2 text-sm font-semibold text-purple-700 shadow-sm">
            ✦ PREPVOICE AI
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Customise Your Interview
          </h1>

          <p className="mt-3 text-sm text-gray-500 sm:text-base">
            Set up your mock interview experience.
          </p>

          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {[company, role, level].filter(Boolean).map((item) => (
              <span
                key={item}
                className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-purple-700 shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-white bg-white/80 p-5 shadow-[0_12px_45px_rgba(100,70,160,0.09)] backdrop-blur-sm sm:p-9">

          <section>
            <h2 className="text-xl font-bold text-gray-900">
              Interview Type
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              What kind of interview would you like to practise?
            </p>

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
              {types.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setInterviewType(type)}
                  className={`rounded-xl border px-4 py-4 font-semibold transition ${
                    interviewType === type
                      ? "border-purple-500 bg-purple-50 text-purple-700 shadow-sm"
                      : "border-purple-100 bg-white text-gray-600 hover:border-purple-300"
                  }`}
                >
                  {type}
                  {interviewType === type && " ✓"}
                </button>
              ))}
            </div>
          </section>

          <div className="my-8 border-t border-purple-100" />

          <section>
            <h2 className="text-xl font-bold text-gray-900">
              Number of Questions
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Choose how many questions you want to answer.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {questionOptions.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`rounded-xl border px-4 py-4 font-semibold transition ${
                    questionCount === count
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-purple-100 bg-white text-gray-600 hover:border-purple-300"
                  }`}
                >
                  {count} Questions
                </button>
              ))}
            </div>
          </section>

          <div className="my-8 border-t border-purple-100" />

          <section>
            <h2 className="text-xl font-bold text-gray-900">
              Interview Duration
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Select your preferred session duration.
            </p>

            <div className="mt-5 grid grid-cols-3 gap-3">
              {durationOptions.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => setDuration(time)}
                  className={`rounded-xl border px-4 py-4 font-semibold transition ${
                    duration === time
                      ? "border-purple-500 bg-purple-50 text-purple-700"
                      : "border-purple-100 bg-white text-gray-600 hover:border-purple-300"
                  }`}
                >
                  {time} min
                </button>
              ))}
            </div>
          </section>

          <div className="mt-9 border-t border-purple-100 pt-6">
            <button
              type="button"
              disabled={!company || !role || !level}
              onClick={handleContinue}
              className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-violet-600 px-6 py-4 font-semibold text-white shadow-lg shadow-purple-200 transition hover:-translate-y-0.5 hover:from-purple-700 hover:to-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Generate My Interview →
            </button>

            <p className="mt-3 text-center text-xs text-gray-400">
              Powered by PrepVoice AI
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
