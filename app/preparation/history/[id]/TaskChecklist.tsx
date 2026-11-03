
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
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-6 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Your Preparation Progress
          </span>

          <span className="font-semibold text-purple-400">
            {progress}%
          </span>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-purple-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-gray-400">
          {completedTasks.length} of {totalTasks} tasks completed
        </p>
      </div>

      {error && (
        <p className="mb-5 rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </p>
      )}

      <div className="space-y-5">
        {dailyPlan.map((day) => (
          <div
            key={day.day}
            className="rounded-2xl border border-white/10 bg-white/[0.03] p-6"
          >
            <span className="rounded-lg bg-purple-500/10 px-4 py-2 text-sm font-semibold text-purple-300">
              Day {day.day}
            </span>

            <h3 className="mt-4 text-xl font-semibold text-white">
              {day.topic}
            </h3>

            <div className="mt-5 space-y-4">
              {day.tasks.map((task, index) => {
                const taskId = `${day.day}-${index}`;
                const isCompleted = completedTasks.includes(taskId);

                return (
                  <label
                    key={taskId}
                    className="flex cursor-pointer items-start gap-3"
                  >
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      disabled={saving}
                      onChange={() => handleTaskToggle(taskId)}
                      className="mt-1 h-4 w-4 shrink-0 cursor-pointer accent-purple-500"
                    />

                    <span
                      className={`text-sm leading-6 transition ${
                        isCompleted
                          ? "text-gray-500 line-through"
                          : "text-gray-300"
                      }`}
                    >
                      {task}
                    </span>
                  </label>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl bg-purple-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-purple-400">
                Daily Goal
              </p>

              <p className="mt-2 text-sm leading-6 text-gray-300">
                {day.goal}
              </p>
            </div>
          </div>
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-gray-500">
        {saving ? "Saving your progress..." : "Your progress is saved automatically."}
      </p>
    </div>
  );
}
