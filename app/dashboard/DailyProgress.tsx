
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

interface CalendarDay {
  date: string;
  day: number;
  month: number;
  year: number;
}

interface CalendarMonth {
  label: string;
  column: number;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const CELL_SIZE = 12;
const CELL_GAP = 3;
const WEEK_WIDTH = CELL_SIZE + CELL_GAP;

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatDate(date: string): string {
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function getActivityLevel(count: number): number {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count === 2) return 2;
  if (count === 3) return 3;
  return 4;
}

function getActivityColor(level: number): string {
  const colors = [
    "bg-slate-100 border-slate-200",
    "bg-purple-100 border-purple-200",
    "bg-purple-300 border-purple-300",
    "bg-purple-500 border-purple-500",
    "bg-purple-700 border-purple-700",
  ];

  return colors[level] ?? colors[0];
}

export default function DailyProgress() {
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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

  const progressMap = useMemo(
    () => new Map(dailyProgress.map((day) => [day.date, day])),
    [dailyProgress]
  );

  const selectedDay = selectedDate
    ? progressMap.get(selectedDate)
    : undefined;

  // Generate complete January-December calendar.
  const calendar = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const year = today.getFullYear();

    // Start from Sunday of the week containing January 1.
    const startDate = new Date(year, 0, 1);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End on Saturday of the week containing December 31.
    const endDate = new Date(year, 11, 31);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const weeks: (CalendarDay | null)[][] = [];
    const months: CalendarMonth[] = [];

    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const currentWeek: (CalendarDay | null)[] = [];

      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        if (cursor.getFullYear() === year) {
          currentWeek.push({
            date: getLocalDateKey(cursor),
            day: cursor.getDate(),
            month: cursor.getMonth(),
            year: cursor.getFullYear(),
          });
        } else {
          currentWeek.push(null);
        }

        cursor.setDate(cursor.getDate() + 1);
      }

      weeks.push(currentWeek);
    }

    // Calculate accurate week-column positions for all months.
    for (let monthIndex = 0; monthIndex < 12; monthIndex++) {
      const firstDay = new Date(year, monthIndex, 1);

      const startUTC = Date.UTC(
        startDate.getFullYear(),
        startDate.getMonth(),
        startDate.getDate()
      );

      const monthUTC = Date.UTC(
        firstDay.getFullYear(),
        firstDay.getMonth(),
        firstDay.getDate()
      );

      const daysFromStart = Math.round(
        (monthUTC - startUTC) / (1000 * 60 * 60 * 24)
      );

      months.push({
        label: firstDay.toLocaleDateString("en-IN", {
          month: "short",
        }),
        column: Math.floor(daysFromStart / 7),
      });
    }

    return {
      weeks,
      months,
      year,
      todayKey: getLocalDateKey(today),
    };
  }, []);

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
      {/* Header */}
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

      {/* Practice Activity */}
      <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold text-gray-800">
              Practice Activity
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Your daily practice contributions throughout the year.
            </p>
          </div>

          <span className="rounded-lg border border-purple-100 bg-purple-50 px-3 py-1.5 text-xs font-semibold text-purple-700">
            {calendar.year}
          </span>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
          <p className="text-sm font-semibold text-gray-700">
            {data.summary.totalInterviews} interviews
          </p>

          <span className="text-xs text-gray-400">
            {data.summary.activeDays} active days
          </span>
        </div>

        {/* GitHub Style Contribution Graph */}
        <div className="mt-6 overflow-x-auto pb-3">
          <div className="min-w-max">

            {/* Month Labels - Equal spacing between all months */}
            <div
              className="mb-2 h-6 pl-[38px]"
              style={{
                width: `${
                  calendar.weeks.length * WEEK_WIDTH + 38
                }px`,
              }}
            >
              <div
                className="grid h-full gap-x-2"
                style={{
                  gridTemplateColumns: "repeat(12, minmax(0, 1fr))",
                }}
              >
                {calendar.months.map((month, index) => (
                  <span
                    key={`${month.label}-${index}`}
                    className="whitespace-nowrap text-[11px] font-semibold text-gray-500"
                  >
                    {month.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex gap-2">

              {/* Weekday Labels */}
              <div className="grid grid-rows-7 gap-[3px] pr-1">
                {WEEKDAYS.map((day, index) => (
                  <span
                    key={day}
                    className={`flex h-3 w-8 items-center text-[10px] text-gray-400 ${
                      index % 2 === 0 ? "invisible" : ""
                    }`}
                  >
                    {day}
                  </span>
                ))}
              </div>

              {/* Contribution Squares */}
              <div className="flex gap-[3px]">
                {calendar.weeks.map((week, weekIndex) => (
                  <div
                    key={weekIndex}
                    className="flex flex-col gap-[3px]"
                  >
                    {week.map((day, dayIndex) => {
                      if (!day) {
                        return (
                          <div
                            key={`empty-${weekIndex}-${dayIndex}`}
                            className="h-3 w-3"
                          />
                        );
                      }

                      const record = progressMap.get(day.date);
                      const count = record?.totalInterviews ?? 0;
                      const level = getActivityLevel(count);

                      const isSelected = selectedDate === day.date;
                      const isFuture = day.date > calendar.todayKey;

                      return (
                        <button
                          key={day.date}
                          type="button"
                          disabled={isFuture}
                          onClick={() => setSelectedDate(day.date)}
                          title={`${count} ${
                            count === 1 ? "interview" : "interviews"
                          } on ${formatDate(day.date)}`}
                          aria-label={`${formatDate(day.date)}: ${count} ${
                            count === 1 ? "interview" : "interviews"
                          }`}
                          aria-pressed={isSelected}
                          className={`h-3 w-3 shrink-0 rounded-[3px] border transition-all duration-150 ${getActivityColor(
                            level
                          )} ${
                            isSelected
                              ? "ring-2 ring-purple-700 ring-offset-2"
                              : ""
                          } ${
                            isFuture
                              ? "cursor-default"
                              : "cursor-pointer hover:scale-125 hover:ring-2 hover:ring-purple-300 hover:ring-offset-1"
                          }`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400">
            Select any square to view that day's activity.
          </p>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-gray-500">Less</span>

            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className={`h-3 w-3 rounded-[3px] border ${getActivityColor(
                  level
                )}`}
              />
            ))}

            <span className="text-[11px] text-gray-500">More</span>
          </div>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="rounded-2xl border border-purple-100 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-lg font-bold text-gray-800">
              {formatDate(selectedDate)}
            </h3>

            <button
              type="button"
              onClick={() => setSelectedDate(null)}
              className="rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-500 transition hover:bg-gray-100 hover:text-gray-800"
            >
              Clear selection ✕
            </button>
          </div>

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

      {/* Daily Performance */}
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
