"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function InterviewSetupPage() {
  const router = useRouter();

  const [interviewType, setInterviewType] = useState("Mixed");
  const [questionCount, setQuestionCount] = useState("10");
  const [duration, setDuration] = useState("30");
  const [jobDescription, setJobDescription] = useState("");

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

  const types = ["Technical", "HR / Behavioral", "Mixed"];
  const questionOptions = ["5", "10", "15"];
  const durationOptions = ["15", "30", "45"];

  function handleContinue() {
    sessionStorage.setItem("prepvoice_interview_type", interviewType);
    sessionStorage.setItem("prepvoice_question_count", questionCount);
    sessionStorage.setItem("prepvoice_duration", duration);
    sessionStorage.setItem("prepvoice_job_description", jobDescription.trim());

    router.push("/company-interview/generate");
  }

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Session Parameters
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">Step 4 of 4</span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Configure Interview Format
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {[company, role, level].filter(Boolean).map((item) => (
              <span
                key={item}
                className="rounded-md bg-white border border-slate-200 px-2.5 py-1 text-xs font-bold text-slate-800"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="pro-card p-6 sm:p-8 space-y-7">
          {/* Job Description (Optional) */}
          <section className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Target Job Description (Optional)
              </h2>
              <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                Enhance Question Precision
              </span>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Paste the job posting requirements or responsibilities to calibrate question generation.
            </p>

            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              maxLength={12000}
              rows={5}
              placeholder="Paste job description text here..."
              className="mt-3 pro-input text-xs"
            />
          </section>

          {/* Interview Type */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Interview Evaluation Domain
            </h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
              {types.map((type) => {
                const isSelected = interviewType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setInterviewType(type)}
                    className={`rounded-xl border p-3.5 text-xs font-bold text-center transition ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs ring-1 ring-indigo-600"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {type} {isSelected && "✓"}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Question Count */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Number of Questions
            </h2>
            <div className="grid grid-cols-3 gap-2.5">
              {questionOptions.map((count) => {
                const isSelected = questionCount === count;
                return (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionCount(count)}
                    className={`rounded-xl border p-3 text-xs font-bold text-center transition ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs ring-1 ring-indigo-600"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {count} Questions
                  </button>
                );
              })}
            </div>
          </section>

          {/* Duration */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3">
              Target Duration
            </h2>
            <div className="grid grid-cols-3 gap-2.5">
              {durationOptions.map((time) => {
                const isSelected = duration === time;
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setDuration(time)}
                    className={`rounded-xl border p-3 text-xs font-bold text-center transition ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs ring-1 ring-indigo-600"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {time} Minutes
                  </button>
                );
              })}
            </div>
          </section>

          <div className="border-t border-slate-100 pt-6">
            <button
              type="button"
              disabled={!company || !role || !level}
              onClick={handleContinue}
              className="pro-btn-primary w-full text-xs font-bold"
            >
              Generate AI Mock Interview Questions →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
