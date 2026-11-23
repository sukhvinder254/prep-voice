"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface StoredActivePlan {
  plan?: {
    overview?: string;
    dailyPlan?: {
      day: number;
      topic: string;
      tasks: string[];
      goal: string;
    }[];
    detailedDay1?: {
      topic: string;
      checklist: { id: string; title: string }[];
      quiz: { id: string }[];
    };
    isUpdated?: boolean;
    feedbackSummary?: string;
  };
  role?: string;
  duration?: number;
  completedTaskIds?: string[];
  unlockedDays?: number[];
  day1Completed?: boolean;
  quizAnswers?: Record<string, number>;
  updatedAt?: string;
}

interface TrackProgressReportProps {
  initialDbPlan?: {
    id: string;
    target_role: string;
    duration_days: number;
    completed_tasks: string[];
    plan?: any;
    created_at: string;
  } | null;
}

export default function TrackProgressReport({ initialDbPlan }: TrackProgressReportProps) {
  const [activePlan, setActivePlan] = useState<StoredActivePlan | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("prepvoice_active_plan");
      if (stored) {
        setActivePlan(JSON.parse(stored));
      } else if (initialDbPlan) {
        // Fallback to DB plan if no localStorage plan
        setActivePlan({
          plan: initialDbPlan.plan,
          role: initialDbPlan.target_role,
          duration: initialDbPlan.duration_days,
          completedTaskIds: initialDbPlan.completed_tasks || [],
          unlockedDays: [1],
          day1Completed: (initialDbPlan.completed_tasks?.length || 0) >= 3,
        });
      }
    } catch (e) {
      console.warn("Progress widget error:", e);
    }
  }, [initialDbPlan]);

  // If no plan exists anywhere, show an invitation card to set up roadmap
  if (!activePlan || !activePlan.role) {
    return (
      <div className="pro-card p-6 bg-gradient-to-r from-blue-50/70 via-indigo-50/50 to-white border border-blue-200/80 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xs">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M8 2v4M16 2v4" />
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M3 10h18" />
                <path d="m9 16 2 2 4-4" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-blue-100 text-blue-700 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Personalized Roadmap
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-600">Daily Milestones</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
                No Active Preparation Track Configured
              </h3>
              <p className="text-xs text-slate-600 max-w-xl mt-1 leading-relaxed">
                Generate your personalized daily study plan with in-depth notes, interactive checklists, and topic quizzes to stay on track.
              </p>
            </div>
          </div>

          <Link
            href="/preparation"
            className="pro-btn-primary text-xs font-bold px-5 py-2.5 self-start sm:self-center shrink-0 flex items-center gap-2"
          >
            <span>Launch Study Planner</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    );
  }

  const role = activePlan.role;
  const duration = activePlan.duration || 30;
  const checklist = activePlan.plan?.detailedDay1?.checklist || [
    { id: "1", title: "Core Architecture & Big-O Review" },
    { id: "2", title: "Two-Pointer Implementation" },
    { id: "3", title: "LeetCode Drills" },
    { id: "4", title: "Concept Quiz" },
  ];
  const completedTasks = activePlan.completedTaskIds || [];
  const completedCount = checklist.filter((item) => completedTasks.includes(item.id)).length;
  const percent = checklist.length > 0 ? Math.round((completedCount / checklist.length) * 100) : 0;
  const isDay1Done = activePlan.day1Completed || percent === 100;

  const quizCount = activePlan.plan?.detailedDay1?.quiz?.length || 4;
  const answeredCount = Object.keys(activePlan.quizAnswers || {}).length;

  return (
    <div className="pro-card p-6 sm:p-7 border-2 border-blue-200/90 bg-white shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xs">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M8 2v4M16 2v4" />
              <rect width="18" height="18" x="3" y="4" rx="2" />
              <path d="M3 10h18" />
              <path d="m9 16 2 2 4-4" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                Active Track
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-semibold text-slate-600">{duration} Days Syllabus</span>
              {activePlan.plan?.isUpdated && (
                <span className="rounded-md bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 text-[10px] font-bold text-indigo-700">
                  ✨ Refined Plan
                </span>
              )}
            </div>
            <h3 className="text-base font-extrabold text-slate-900 mt-0.5">
              {role}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Today&apos;s Focus: <span className="font-semibold text-slate-700">{activePlan.plan?.detailedDay1?.topic || activePlan.plan?.dailyPlan?.[0]?.topic || "Day 1 Foundations"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-center">
          <Link
            href="/preparation"
            className="pro-btn-primary text-xs font-bold px-5 py-2.5 flex items-center gap-2 shadow-sm"
          >
            <span>Resume Day 1 Study</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>

      {/* Progress Breakdown Grid */}
      <div className="grid gap-3 sm:grid-cols-3">
        {/* Metric 1: Checklist Progress */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Day 1 Tasks Checklist
            </span>
            <span className="font-bold text-blue-700">{percent}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-200/80 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
              style={{ width: `${percent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            {completedCount} of {checklist.length} checklist drills completed
          </p>
        </div>

        {/* Metric 2: Quiz Knowledge Check */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Concept Quiz Status
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                answeredCount >= quizCount
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-amber-100 text-amber-800"
              }`}
            >
              {answeredCount >= quizCount ? "Passed ✓" : "Pending"}
            </span>
          </div>
          <p className="text-xs font-extrabold text-slate-900 mt-1">
            {answeredCount} of {quizCount} questions attempted
          </p>
          <p className="text-[11px] text-slate-500">
            {answeredCount >= quizCount
              ? "Mastery validated for Day 1 concepts"
              : "Complete the quiz to unlock Day 2"}
          </p>
        </div>

        {/* Metric 3: Progression Lock Status */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Next Milestone
            </span>
            <span
              className={`rounded-md px-2 py-0.5 text-[10px] font-bold ${
                isDay1Done
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {isDay1Done ? "Day 2 Unlocked" : "🔒 Day 2 Locked"}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-800 mt-1">
            {isDay1Done
              ? "Day 2 notes & drills available!"
              : "Finish Day 1 tasks to reveal Day 2"}
          </p>
          <Link
            href="/preparation"
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 block"
          >
            Open Preparation Console →
          </Link>
        </div>
      </div>
    </div>
  );
}
