
"use client";

import { useEffect, useMemo, useState } from "react";

interface Interview {
  id: string;
  question: string | null;
  category: string | null;
  score: number | string | null;
  created_at: string;
}

interface DailyRecord {
  date: string;
  totalInterviews: number;
  averageScore: number;
  bestScore: number;
  interviews: Interview[];
}

interface ProgressData {
  success: boolean;
  timezone: string;
  summary: {
    totalInterviews: number;
    activeDays: number;
    averageScore: number;
  };
  dailyProgress: DailyRecord[];
}

export default function DailyProgress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [monthOffset, setMonthOffset] = useState(0);

  useEffect(() => {
    async function loadProgress() {
      try {
        const response = await fetch("/api/daily-progress");
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Unable to load progress");
        }

        setData(result);
      } catch (error) {
        console.error("Daily progress error:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProgress();
  }, []);

  const dailyProgress = data?.dailyProgress ?? [];

  const selectedDay = dailyProgress.find(
    (day) => day.date === selectedDate
  );

  const calendar = useMemo(() => {
    const today = new Date();

    const month = new Date(
      today.getFullYear(),
      today.getMonth() + monthOffset,
      1
    );

    const year = month.getFullYear();
    const monthIndex = month.getMonth();

    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const firstDay = new Date(year, monthIndex, 1).getDay();

    return {
      label: month.toLocaleDateString("en-IN", {
        month: "long",
        year: "numeric",
      }),
      cells: [
        ...Array(firstDay).fill(null),
        ...Array.from({ length: daysInMonth }, (_, index) => index + 1),
      ],
    };
  }, [monthOffset]);

  const progressMap = new Map(
    dailyProgress.map((day) => [day.date, day])
  );

  function getDateKey(day: number) {
    const today = new Date();

    return [
      new Date(
        today.getFullYear(),
        today.getMonth() + monthOffset,
        day
      ).getFullYear(),
      String(
        new Date(
          today.getFullYear(),
          today.getMonth() + monthOffset,
          day
        ).getMonth() + 1
      ).padStart(2, "0"),
      String(day).padStart(2, "0"),
    ].join("-");
  }

  function formatDate(date: string) {
    return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <section className="mt-10 rounded-2xl border border-purple-100 bg-white p-8">
        <p className="text-sm text-gray-500">
          Loading your daily progress...
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="mt-10 rounded-2xl border border-purple-100 bg-white p-8">
        <p className="font-semibold text-gray-800">
          Daily progress is currently unavailable.
        </p>
        <p className="mt-2 text-sm text-gray-500">
          Please refresh the dashboard and try again.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-10 space-y-6">
      <div>
        <p className="text-sm font-semibold tracking-wider text-purple-600">
          PREPVOICE INTELLIGENCE
        </p>
        <h2 className="mt-2 text-2xl font-bold text-gray-800">
          Daily Progress 📅
        </h2>
        <p className="mt-2 text-sm text-gray-500">
          Track your interview practice and performance day by day.
        </p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Total Interviews</p>
          <h3 className="mt-2 text-3xl font-bold text-purple-700">
            {data.summary.totalInterviews}
          </h3>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Active Practice Days</p>
          <h3 className="mt-2 text-3xl font-bold text-purple-700">
            {data.summary.activeDays}
          </h3>
        </div>

        <div className="rounded-2xl border border-purple-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Overall Average</p>
          <h3 className="mt-2 text-3xl font-bold text-purple-700">
            {data.summary.averageScore}/10
          </h3>
        </div>
      </div>

      {/* Activity Calendar */}
      <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Practice Activity
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Select a date to view your practice sessions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setMonthOffset((value) => value - 1);
                setSelectedDate(null);
              }}
              className="rounded-lg border px-3 py-2 hover:bg-purple-50"
              aria-label="Previous month"
            >
              ←
            </button>

            <span className="min-w-32 text-center text-sm font-semibold">
              {calendar.label}
            </span>

            <button
              onClick={() => {
                setMonthOffset((value) => Math.min(0, value + 1));
                setSelectedDate(null);
              }}
              disabled={monthOffset === 0}
              className="rounded-lg border px-3 py-2 hover:bg-purple-50 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next month"
            >
              →
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-7 gap-2 text-center">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
            (day) => (
              <div
                key={day}
                className="py-2 text-xs font-semibold text-gray-400"
              >
                {day}
              </div>
            )
          )}

          {calendar.cells.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} />;
            }

            const dateKey = getDateKey(day);
            const record = progressMap.get(dateKey);
            const isSelected = selectedDate === dateKey;

            return (
              <button
                key={dateKey}
                onClick={() => setSelectedDate(dateKey)}
                className={`flex aspect-square flex-col items-center justify-center rounded-xl border text-sm transition ${
                  isSelected
                    ? "border-purple-600 bg-purple-600 text-white"
                    : record
                      ? "border-purple-200 bg-purple-100 font-bold text-purple-800 hover:bg-purple-200"
                      : "border-gray-100 bg-gray-50 text-gray-600 hover:bg-purple-50"
                }`}
                title={
                  record
                    ? `${record.totalInterviews} interviews`
                    : "No practice recorded"
                }
              >
                <span>{day}</span>
                {record && (
                  <span className="mt-0.5 text-[9px]">
                    {record.totalInterviews} ✓
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-gray-100" />
            No practice
          </span>
          <span className="flex items-center gap-2">
            <span className="h-3 w-3 rounded bg-purple-200" />
            Practice completed
          </span>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800">
            {formatDate(selectedDate)}
          </h3>

          {selectedDay ? (
            <>
              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-xl bg-purple-50 p-3">
                  <p className="text-xs text-gray-500">Interviews</p>
                  <p className="mt-1 text-xl font-bold text-purple-700">
                    {selectedDay.totalInterviews}
                  </p>
                </div>

                <div className="rounded-xl bg-purple-50 p-3">
                  <p className="text-xs text-gray-500">Average</p>
                  <p className="mt-1 text-xl font-bold text-purple-700">
                    {selectedDay.averageScore}/10
                  </p>
                </div>

                <div className="rounded-xl bg-purple-50 p-3">
                  <p className="text-xs text-gray-500">Best Score</p>
                  <p className="mt-1 text-xl font-bold text-purple-700">
                    {selectedDay.bestScore}/10
                  </p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {selectedDay.interviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="rounded-xl bg-gray-50 p-4"
                  >
                    <div className="flex flex-wrap justify-between gap-2">
                      <p className="font-semibold text-gray-800">
                        {interview.category || "General Interview"}
                      </p>
                      <p className="font-bold text-purple-700">
                        {interview.score ?? "—"}/10
                      </p>
                    </div>

                    <p className="mt-2 text-sm text-gray-600">
                      {interview.question || "Practice interview"}
                    </p>

                    <p className="mt-2 text-xs text-gray-400">
                      {new Date(interview.created_at).toLocaleTimeString(
                        "en-IN",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                          timeZone: "Asia/Kolkata",
                        }
                      )}
                    </p>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              No interview practice was recorded on this date.
            </p>
          )}
        </div>
      )}

      {/* Daily Score Chart */}
      <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
        <h3 className="text-lg font-bold text-gray-800">
          Daily Performance
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Average interview score for each practice day.
        </p>

        {dailyProgress.length === 0 ? (
          <p className="mt-5 text-sm text-gray-500">
            Your score chart will appear after your first interview.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {[...dailyProgress].reverse().map((day) => (
              <div key={day.date}>
                <div className="mb-2 flex justify-between gap-3 text-sm">
                  <span className="text-gray-600">
                    {formatDate(day.date)}
                  </span>
                  <span className="font-semibold text-purple-700">
                    {day.averageScore}/10
                  </span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-purple-50">
                  <div
                    className="h-full rounded-full bg-purple-600 transition-all"
                    style={{
                      width: `${Math.max(
                        0,
                        Math.min(100, (day.averageScore / 10) * 100)
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
