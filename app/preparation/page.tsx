"use client";

import { useState } from "react";

const roles = [
  "Software Development Engineer (SDE)",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "AI Engineer",
  "Data Analyst",
];

const durations = [7, 15, 30, 60];

interface PreparationDay {
  day: number;
  topic: string;
  tasks: string[];
  goal: string;
}

interface PreparationPlan {
  overview: string;
  dailyPlan: PreparationDay[];
}

export default function PreparationPage() {
  const [role, setRole] = useState(roles[0]);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<PreparationPlan | null>(null);

  async function generatePlan() {
    setLoading(true);
    setError("");
    setPlan(null);

    try {
      const response = await fetch("/api/preparation", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          targetRole: role,
          durationDays: duration,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not generate preparation plan.");
      }

      setPlan(data.plan);
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

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600 animate-pulse" />
              Strategic Roadmap
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs font-medium text-slate-500">Day-by-Day Milestone Plan</span>
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Interview Preparation Planner
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Generate an adaptive syllabus customized for your target position and preparation window.
          </p>
        </div>

        <div className="pro-card p-6 sm:p-8 space-y-6">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100">
            Configure Preparation Schedule
          </h2>

          <div>
            <label className="mb-1.5 block text-xs font-bold text-slate-700">
              Target Specialization Track
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="pro-input text-xs"
            >
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold text-slate-700">
              Study Timeline Duration
            </label>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {durations.map((days) => {
                const isSelected = duration === days;

                return (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setDuration(days)}
                    className={`rounded-xl border p-4 text-center transition ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-xs ring-1 ring-indigo-600"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    <span className="block text-2xl font-extrabold">{days}</span>
                    <span className="text-xs font-medium">Days Plan</span>
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={generatePlan}
            disabled={loading}
            className="pro-btn-primary w-full text-xs font-bold"
          >
            {loading ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Synthesizing Day-by-Day Preparation Plan...
              </>
            ) : (
              "Generate Personalized Study Roadmap →"
            )}
          </button>
        </div>

        {plan && (
          <div className="mt-8 space-y-6 animate-fade-up">
            <div className="pro-card p-6 sm:p-8">
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                Curriculum Blueprint
              </span>
              <h2 className="mt-2 text-xl font-bold text-slate-900">
                {role} Study Strategy
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-600">
                {plan.overview}
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:w-80">
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <p className="text-2xl font-extrabold text-indigo-700">
                    {plan.dailyPlan.length}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">Structured Days</p>
                </div>
                <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3">
                  <p className="text-2xl font-extrabold text-indigo-700">
                    {plan.dailyPlan.reduce((acc, curr) => acc + curr.tasks.length, 0)}
                  </p>
                  <p className="text-[11px] text-slate-500 font-medium">Actionable Tasks</p>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              {plan.dailyPlan.map((day) => (
                <div key={day.day} className="pro-card p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="rounded-md bg-indigo-50 border border-indigo-100 px-2.5 py-1 text-xs font-bold text-indigo-700">
                      Day {day.day}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{day.topic}</h3>
                  </div>

                  <div className="space-y-1.5 pl-1">
                    {day.tasks.map((task, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3.5 rounded-lg bg-slate-50/80 border border-slate-100 p-2.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Day Target
                    </span>
                    <p className="mt-0.5 text-xs font-medium text-slate-800">{day.goal}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
