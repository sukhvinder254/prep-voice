"use client";

import { useState } from "react";

interface DailyTask {
  day: number;
  topic: string;
  tasks: string[];
  goal: string;
}

interface TaskChecklistProps {
  planId: string;
  dailyPlan: DailyTask[];
  initialCompletedTasks: string[];
}

export default function TaskChecklist({
  planId,
  dailyPlan,
  initialCompletedTasks,
}: TaskChecklistProps) {
  const [completedTasks, setCompletedTasks] = useState<string[]>(
    initialCompletedTasks
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const totalTasks = dailyPlan.reduce(
    (total, day) => total + day.tasks.length,
    0
  );

  const progress =
    totalTasks > 0
      ? Math.round((completedTasks.length / totalTasks) * 100)
      : 0;

  async function handleTaskToggle(taskId: string) {
    if (saving) return;

    const previousTasks = completedTasks;

    const updatedTasks = previousTasks.includes(taskId)
      ? previousTasks.filter((id) => id !== taskId)
      : [...previousTasks, taskId];

    setCompletedTasks(updatedTasks);
    setSaving(true);
    setError("");

    try {
      const response = await fetch("/api/preparation", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          planId,
          completedTasks: updatedTasks,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not save progress.");
      }
    } catch (err) {
      setCompletedTasks(previousTasks);
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 pro-card p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-700">
            Roadmap Completion Progress
          </span>

          <span className="text-xs font-extrabold text-blue-700">
            {progress}% ({completedTasks.length}/{totalTasks} tasks)
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {error && (
          <p className="mt-3 text-xs text-rose-600">
            {error}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {dailyPlan.map((day) => (
          <div
            key={day.day}
            className="pro-card p-6 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="rounded-md bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700">
                  Day {day.day}
                </span>
                <h3 className="text-sm font-bold text-slate-900">
                  {day.topic}
                </h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {day.tasks.map((task, index) => {
                const taskId = `${day.day}-${index}`;
                const isCompleted = completedTasks.includes(taskId);

                return (
                  <label
                    key={taskId}
                    className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                      isCompleted
                        ? "border-emerald-200 bg-emerald-50/50"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      disabled={saving}
                      onChange={() => handleTaskToggle(taskId)}
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />

                    <span
                      className={`text-xs ${
                        isCompleted
                          ? "line-through text-slate-400"
                          : "text-slate-800 font-medium"
                      }`}
                    >
                      {task}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="rounded-lg bg-slate-50 p-3 border border-slate-100 text-xs text-slate-600">
              <span className="font-bold text-slate-700 block mb-0.5">
                Target Objective:
              </span>
              {day.goal}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
