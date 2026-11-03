
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
    <div className="min-h-screen bg-gray-50 px-6 py-10">
      <div className="mx-auto max-w-4xl">

        <div className="mb-8">
          <p className="text-sm font-semibold text-purple-600">
            PREPVOICE / PREPARATION
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Interview Preparation Planner
          </h1>

          <p className="mt-2 text-gray-500">
            Create a personalized preparation plan for your dream role.
          </p>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

          <h2 className="text-xl font-bold text-gray-900">
            Let's plan your preparation
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Select your target role and preparation timeline.
          </p>

          <div className="mt-8">
            <label className="mb-3 block text-sm font-semibold text-gray-800">
              Select Your Target Role
            </label>

            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white p-4 text-gray-800 outline-none focus:border-purple-500"
            >
              {roles.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-8">
            <label className="mb-3 block text-sm font-semibold text-gray-800">
              Preparation Duration
            </label>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {durations.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setDuration(days)}
                  className={`rounded-xl border p-5 text-center transition ${
                    duration === days
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-purple-300"
                  }`}
                >
                  <span className="block text-2xl font-bold">
                    {days}
                  </span>

                  <span className="mt-1 block text-sm">
                    Days
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-8 rounded-xl bg-purple-50 p-5">
            <p className="text-sm font-semibold text-purple-800">
              Your Preparation Plan
            </p>

            <p className="mt-2 text-sm text-purple-700">
              Target Role: {role}
            </p>

            <p className="mt-1 text-sm text-purple-700">
              Duration: {duration} Days
            </p>
          </div>

          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={generatePlan}
            disabled={loading}
            className="mt-8 w-full rounded-xl bg-purple-600 px-6 py-4 font-semibold text-white transition hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Generating Your Plan..." : "Generate My Preparation Plan"}
          </button>

        </div>

        {plan && (
          <div className="mt-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold text-purple-600">
                YOUR PERSONALIZED PLAN
              </p>

              <h2 className="mt-2 text-2xl font-bold text-gray-900">
                {role} Preparation
              </h2>

              <p className="mt-4 text-gray-600">
                {plan.overview}
              </p>

              <div className="mt-6 flex gap-4">
                <div className="rounded-xl bg-purple-50 px-5 py-4">
                  <p className="text-2xl font-bold text-purple-700">
                    {plan.dailyPlan.length}
                  </p>
                  <p className="text-sm text-gray-600">Preparation Days</p>
                </div>

                <div className="rounded-xl bg-purple-50 px-5 py-4">
                  <p className="text-2xl font-bold text-purple-700">
                    {plan.dailyPlan.reduce(
                      (total, day) => total + day.tasks.length,
                      0
                    )}
                  </p>
                  <p className="text-sm text-gray-600">Total Tasks</p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {plan.dailyPlan.map((day) => (
                <div
                  key={day.day}
                  className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg bg-purple-100 px-3 py-2 text-sm font-bold text-purple-700">
                      Day {day.day}
                    </span>

                    <h3 className="text-lg font-bold text-gray-900">
                      {day.topic}
                    </h3>
                  </div>

                  <div className="mt-5">
                    <p className="text-sm font-semibold text-gray-800">
                      Daily Tasks
                    </p>

                    <ul className="mt-3 space-y-3">
                      {day.tasks.map((task, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-3 text-sm text-gray-600"
                        >
                          <span className="mt-0.5 text-purple-600">
                            •
                          </span>
                          {task}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-5 rounded-xl bg-purple-50 p-4">
                    <p className="text-xs font-semibold uppercase text-purple-700">
                      Daily Goal
                    </p>

                    <p className="mt-2 text-sm text-gray-700">
                      {day.goal}
                    </p>
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
