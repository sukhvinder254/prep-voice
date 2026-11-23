"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  PreparationPlan,
  PreparationDay,
  DetailedDayStudy,
} from "../api/preparation/route";

const roles = [
  "Software Development Engineer (SDE)",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "AI Engineer",
  "Data Analyst",
];

const durations = [7, 15, 30, 60];

const feedbackPresets = [
  "Focus heavily on System Design & Microservices scalability",
  "More LeetCode Medium problem drills with Two-Pointer & DP patterns",
  "Emphasize React 19, TypeScript architecture, and Web Performance",
  "Include practical mock interview communication drills & STAR framing",
  "Reduce daily commitment to 1.5 hours with high-yield focus areas",
];

export default function PreparationPage() {
  const [role, setRole] = useState(roles[0]);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<PreparationPlan | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);

  // Regeneration & Feedback State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [updateBannerVisible, setUpdateBannerVisible] = useState(true);

  // Day 1 Detailed Tabs
  const [day1ActiveTab, setDay1ActiveTab] = useState<"notes" | "checklist" | "quiz">("notes");

  // Checklist State
  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);

  // Quiz State
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Unlocked Days State
  const [unlockedDays, setUnlockedDays] = useState<number[]>([1]);
  const [day1Completed, setDay1Completed] = useState(false);

  // Email Notification Modal & State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("candidate@prepvoice.ai");
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  // Load any existing active plan from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("prepvoice_active_plan");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.plan) {
          setPlan(parsed.plan);
          setPlanId(parsed.planId || null);
          setRole(parsed.role || roles[0]);
          setDuration(parsed.duration || 30);
          if (parsed.completedTaskIds) setCompletedTaskIds(parsed.completedTaskIds);
          if (parsed.unlockedDays) setUnlockedDays(parsed.unlockedDays);
          if (parsed.quizAnswers) setQuizAnswers(parsed.quizAnswers);
          if (parsed.day1Completed) setDay1Completed(parsed.day1Completed);
        }
      }
    } catch (e) {
      console.warn("Could not parse saved plan:", e);
    }
  }, []);

  // Save active plan to localStorage and sync
  function syncPlanState(
    updatedPlan: PreparationPlan,
    updatedPlanId: string | null,
    updatedTasks: string[],
    updatedUnlocked: number[],
    isDay1Done: boolean,
    answers: Record<string, number>
  ) {
    try {
      localStorage.setItem(
        "prepvoice_active_plan",
        JSON.stringify({
          plan: updatedPlan,
          planId: updatedPlanId,
          role,
          duration,
          completedTaskIds: updatedTasks,
          unlockedDays: updatedUnlocked,
          day1Completed: isDay1Done,
          quizAnswers: answers,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.warn("Storage sync warning:", e);
    }
  }

  async function generatePlan(customFeedback?: string) {
    if (customFeedback) {
      setIsRegenerating(true);
    } else {
      setLoading(true);
    }
    setError("");

    try {
      const response = await fetch("/api/preparation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetRole: role,
          durationDays: duration,
          feedback: customFeedback || undefined,
          regenerate: Boolean(customFeedback),
          planId: planId || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Could not generate preparation plan.");
      }

      setPlan(data.plan);
      setPlanId(data.planId);
      setUpdateBannerVisible(true);
      setShowFeedbackModal(false);

      if (customFeedback) {
        setFeedbackInput("");
      }

      // Sync active state
      syncPlanState(
        data.plan,
        data.planId,
        completedTaskIds,
        unlockedDays,
        day1Completed,
        quizAnswers
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  }

  // Checklist item toggle
  function toggleTask(taskId: string) {
    const updated = completedTaskIds.includes(taskId)
      ? completedTaskIds.filter((id) => id !== taskId)
      : [...completedTaskIds, taskId];

    setCompletedTaskIds(updated);

    if (plan) {
      syncPlanState(plan, planId, updated, unlockedDays, day1Completed, quizAnswers);

      // Async sync with backend
      if (planId) {
        void fetch("/api/preparation", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            completedTasks: updated,
            unlockedDays,
            activeDay: 1,
          }),
        });
      }
    }
  }

  // Quiz Answer Select
  function selectQuizAnswer(questionId: string, optionIndex: number) {
    const updated = { ...quizAnswers, [questionId]: optionIndex };
    setQuizAnswers(updated);
    if (plan) {
      syncPlanState(plan, planId, completedTaskIds, unlockedDays, day1Completed, updated);
    }
  }

  // Complete Day 1 and Unlock Day 2
  function handleCompleteDay1() {
    setDay1Completed(true);
    const updatedUnlocked = Array.from(new Set([...unlockedDays, 2]));
    setUnlockedDays(updatedUnlocked);

    if (plan) {
      syncPlanState(plan, planId, completedTaskIds, updatedUnlocked, true, quizAnswers);

      if (planId) {
        void fetch("/api/preparation", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            completedTasks: completedTaskIds,
            unlockedDays: updatedUnlocked,
            activeDay: 2,
          }),
        });
      }
    }
  }

  // Dispatch Email Notification
  async function handleSendEmail() {
    setEmailSending(true);
    try {
      await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          dayNumber: 1,
          topic: plan?.detailedDay1?.topic || "Core Foundations & Big-O",
          tasksCount: plan?.detailedDay1?.checklist?.length || 4,
          quizLink: "/preparation",
        }),
      });
      setEmailSent(true);
      setTimeout(() => {
        setEmailSent(false);
        setShowEmailModal(false);
      }, 2500);
    } catch (e) {
      console.error(e);
    } finally {
      setEmailSending(false);
    }
  }

  const checklistItems = plan?.detailedDay1?.checklist || [];
  const checklistCompletedCount = checklistItems.filter((item) =>
    completedTaskIds.includes(item.id)
  ).length;
  const checklistPercent =
    checklistItems.length > 0
      ? Math.round((checklistCompletedCount / checklistItems.length) * 100)
      : 0;

  const quizQuestions = plan?.detailedDay1?.quiz || [];
  const quizScore = quizQuestions.filter(
    (q) => quizAnswers[q.id] === q.answer
  ).length;

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-5xl">
        {/* Header Section */}
        <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 border border-blue-100">
                <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                Adaptive Study Engine
              </span>
              <span className="text-xs text-slate-400">•</span>
              <span className="text-xs font-medium text-slate-500">
                Milestone-Locked Progression
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
              Interview Preparation Planner
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Interactive day-by-day curriculum with deep study notes, action checklists, and concept mastery quizzes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/preparation/history"
              className="pro-btn-secondary text-xs flex items-center gap-1.5"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              <span>Saved Plans</span>
            </Link>

            {plan && (
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span>Email Today&apos;s Plan</span>
              </button>
            )}
          </div>
        </header>

        {/* Configuration Card */}
        <section className="pro-card p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Target Track &amp; Study Window
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select your desired role specialization and preparation timeframe.
              </p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Target Role Specialization
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
              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                Preparation Duration
              </label>
              <div className="grid grid-cols-4 gap-2">
                {durations.map((days) => {
                  const isSelected = duration === days;
                  return (
                    <button
                      key={days}
                      type="button"
                      onClick={() => setDuration(days)}
                      className={`rounded-xl border py-2.5 px-3 text-center transition ${
                        isSelected
                          ? "border-blue-600 bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-600"
                          : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 font-medium"
                      }`}
                    >
                      <span className="block text-base font-extrabold">{days}d</span>
                      <span className="text-[10px] text-slate-500">Plan</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {error && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700 flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => generatePlan()}
              disabled={loading}
              className="pro-btn-primary flex-1 text-xs font-bold py-3 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  <span>Synthesizing Adaptive Curriculum...</span>
                </>
              ) : (
                <>
                  <span>Generate Personalized Study Roadmap</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>

            {plan && (
              <button
                type="button"
                onClick={() => setShowFeedbackModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <span>Regenerate with Feedback</span>
              </button>
            )}
          </div>
        </section>

        {/* FEEDBACK REGENERATION MODAL */}
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="pro-card max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Regenerate Plan with Custom Feedback
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tell us what you want to tweak (e.g. more system design, faster pace, specific topics).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="mb-2 block text-xs font-bold text-slate-700">
                  Quick Focus Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {feedbackPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFeedbackInput(preset)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Your Specific Adjustments or Instructions
                </label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="e.g. Focus Day 1 on Next.js 15 Server Components and PostgreSQL connection pooling..."
                  className="pro-input text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="pro-btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => generatePlan(feedbackInput || "Adjust curriculum balance")}
                  disabled={isRegenerating}
                  className="pro-btn-primary text-xs font-bold flex items-center gap-2"
                >
                  {isRegenerating ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      <span>Updating Curriculum...</span>
                    </>
                  ) : (
                    <>
                      <span>Apply Feedback &amp; Regenerate</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10" />
                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EMAIL NOTIFICATION MODAL */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fade-in">
            <div className="pro-card max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect width="20" height="16" x="2" y="4" rx="2" />
                      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Email Daily Study Digest &amp; Quiz
                    </h3>
                    <p className="text-xs text-slate-500">
                      Deliver today&apos;s checklist and test link straight to your inbox.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
                >
                  ✕
                </button>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold text-slate-700">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="pro-input text-xs"
                />
              </div>

              {/* Email Content Preview Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5 space-y-2">
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold text-slate-700">Subject Preview:</span>
                  <span className="text-blue-600 font-medium">Verified Template</span>
                </div>
                <p className="text-xs font-bold text-slate-800">
                  🚀 Day 1 Study Digest: {plan?.detailedDay1?.topic || "Core Foundations & Big-O"}
                </p>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Includes full {checklistItems.length} action items, key concept theory, and 1-click test link.
                </p>
              </div>

              {emailSent && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold flex items-center gap-2">
                  <span className="text-emerald-600">✓</span>
                  <span>Email dispatched successfully! Check your inbox.</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="pro-btn-secondary text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleSendEmail}
                  disabled={emailSending || emailSent}
                  className="pro-btn-primary text-xs font-bold flex items-center gap-2"
                >
                  {emailSending ? (
                    <>
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      <span>Sending Digest...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Daily Email</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13" />
                        <polygon points="22 2 15 22 11 13 2 9 22 2" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PLAN ROADMAP DISPLAY */}
        {plan && (
          <div className="mt-8 space-y-6 animate-fade-up">
            {/* PROMINENT "PLAN UPDATED" BANNER BOX */}
            {plan.isUpdated && updateBannerVisible && (
              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-blue-50/70 to-indigo-50/90 p-5 shadow-xs relative overflow-hidden">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-indigo-600 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider">
                          Curriculum Updated
                        </span>
                        <span className="text-xs text-indigo-700 font-semibold">
                          Revision 2.0 Active
                        </span>
                      </div>
                      <p className="mt-1 text-xs font-semibold text-slate-800">
                        {plan.feedbackSummary
                          ? `Adapted based on your feedback: "${plan.feedbackSummary}"`
                          : "Your custom feedback has been incorporated into the daily schedule and Day 1 study notes."}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        Day 1 study syllabus recalibrated. Next milestones remain locked until Day 1 completion.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUpdateBannerVisible(false)}
                    className="text-slate-400 hover:text-slate-600 p-1 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {/* CURRICULUM BLUEPRINT OVERVIEW CARD */}
            <div className="pro-card p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-5 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
                    Active Study Syllabus
                  </span>
                  <h2 className="mt-2 text-xl font-bold text-slate-900">
                    {role} Preparation Roadmap
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-2xl">
                    {plan.overview}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center min-w-[90px]">
                    <span className="block text-2xl font-extrabold text-blue-700">
                      {plan.dailyPlan.length}
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">Total Days</span>
                  </div>
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center min-w-[100px]">
                    <span className="block text-2xl font-extrabold text-emerald-600">
                      {checklistPercent}%
                    </span>
                    <span className="text-[10px] text-slate-500 font-semibold">Day 1 Progress</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Milestone 1 Completion
                  </span>
                  <span className="font-bold text-blue-700">
                    {checklistCompletedCount} of {checklistItems.length} tasks completed
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                    style={{ width: `${checklistPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* DAY 1: FULL DETAILED MODULE BOX */}
            <div className="pro-card border-2 border-blue-300/80 shadow-md p-6 sm:p-8 space-y-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-xs shadow-xs">
                    01
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                        Active Milestone
                      </span>
                      {day1Completed && (
                        <span className="rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">
                      {plan.detailedDay1?.topic || plan.dailyPlan[0]?.topic}
                    </h3>
                  </div>
                </div>

                {/* Day 1 Navigation Tabs */}
                <div className="flex rounded-xl bg-slate-100 p-1 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => setDay1ActiveTab("notes")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      day1ActiveTab === "notes"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    📖 Detailed Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => setDay1ActiveTab("checklist")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      day1ActiveTab === "checklist"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>✅ Action Checklist</span>
                    <span className="rounded-full bg-blue-50 text-blue-700 px-1.5 py-0.2 text-[10px]">
                      {checklistCompletedCount}/{checklistItems.length}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDay1ActiveTab("quiz")}
                    className={`rounded-lg px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 ${
                      day1ActiveTab === "quiz"
                        ? "bg-white text-blue-700 shadow-2xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    <span>🧠 Day 1 Quiz</span>
                    {quizSubmitted && (
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-1.5 py-0.2 text-[10px]">
                        {quizScore}/{quizQuestions.length}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* TAB 1: DETAILED STUDY NOTES */}
              {day1ActiveTab === "notes" && plan.detailedDay1 && (
                <div className="space-y-6 animate-fade-in">
                  <p className="text-xs text-slate-600 leading-relaxed bg-blue-50/50 p-3.5 rounded-xl border border-blue-100">
                    {plan.detailedDay1.overview}
                  </p>

                  {/* Core Theory Sections */}
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Theoretical Framework &amp; Concepts
                    </h4>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {plan.detailedDay1.coreTheory?.map((theory, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-2xs"
                        >
                          <h5 className="text-xs font-bold text-slate-900">
                            {theory.title}
                          </h5>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {theory.explanation}
                          </p>
                          <ul className="space-y-1 pt-1">
                            {theory.keyPoints?.map((point, pIdx) => (
                              <li key={pIdx} className="flex items-start gap-1.5 text-[11px] text-slate-600">
                                <span className="mt-1 h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                                <span>{point}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Code Pattern Deep Dive */}
                  {plan.detailedDay1.codeSnippet && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Production Code Pattern
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          {plan.detailedDay1.codeSnippet.language}
                        </span>
                      </div>
                      <div className="rounded-xl border border-slate-200 bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto leading-relaxed">
                        <p className="text-[11px] text-blue-400 font-bold mb-2">
                          // {plan.detailedDay1.codeSnippet.title}
                        </p>
                        <pre>
                          <code>{plan.detailedDay1.codeSnippet.code}</code>
                        </pre>
                      </div>
                      <p className="text-[11px] text-slate-500 italic pl-1">
                        💡 {plan.detailedDay1.codeSnippet.explanation}
                      </p>
                    </div>
                  )}

                  {/* Interview Questions & Model Answers */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Top Interview Questions on this Topic
                    </h4>
                    <div className="space-y-3">
                      {plan.detailedDay1.interviewQuestions?.map((q, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-2"
                        >
                          <div className="flex items-center gap-2">
                            <span className="rounded-md bg-indigo-100 text-indigo-700 px-1.5 py-0.5 text-[10px] font-bold">
                              Q{idx + 1}
                            </span>
                            <p className="text-xs font-bold text-slate-900">
                              {q.question}
                            </p>
                          </div>
                          <div className="rounded-lg bg-white p-3 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                            <span className="font-semibold text-slate-900 block mb-1">
                              Model Benchmark Answer:
                            </span>
                            {q.modelAnswer}
                          </div>
                          <p className="text-[11px] text-slate-500 pl-1">
                            🎯 <span className="font-medium">Evaluator Tip:</span> {q.tips}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cheat Sheet */}
                  {plan.detailedDay1.cheatSheet && (
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900">
                        ⚡ Quick Reference Cheatsheet
                      </h4>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {plan.detailedDay1.cheatSheet.map((item, idx) => (
                          <div key={idx} className="rounded-lg bg-slate-50 p-2.5 text-xs">
                            <span className="font-bold text-blue-700 block">{item.term}</span>
                            <span className="text-[11px] text-slate-600">{item.definition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: INTERACTIVE CHECKLIST */}
              {day1ActiveTab === "checklist" && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Actionable Task Checklist
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Check off each study milestone as you complete it. Progress auto-saves.
                      </p>
                    </div>
                    <span className="text-xs font-extrabold text-blue-700">
                      {checklistCompletedCount} / {checklistItems.length} Done ({checklistPercent}%)
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {checklistItems.map((item) => {
                      const isChecked = completedTaskIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleTask(item.id)}
                          className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                            isChecked
                              ? "border-emerald-200 bg-emerald-50/50 text-slate-800"
                              : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // handled by parent onClick
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p
                              className={`text-xs font-semibold ${
                                isChecked ? "line-through text-slate-400" : "text-slate-800"
                              }`}
                            >
                              {item.title}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                              <span>⏱️ {item.timeEstimate}</span>
                              <span>•</span>
                              <span
                                className={`font-semibold ${
                                  item.difficulty === "Easy"
                                    ? "text-emerald-600"
                                    : item.difficulty === "Medium"
                                    ? "text-amber-600"
                                    : "text-rose-600"
                                }`}
                              >
                                {item.difficulty}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: DAY 1 TOPIC QUIZ */}
              {day1ActiveTab === "quiz" && (
                <div className="space-y-6 animate-fade-in">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">
                        Day 1 Topic Knowledge Check
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Answer all {quizQuestions.length} questions to validate concept mastery.
                      </p>
                    </div>
                    {quizSubmitted && (
                      <span className="rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-extrabold">
                        Score: {quizScore} / {quizQuestions.length} ({Math.round((quizScore / quizQuestions.length) * 100)}%)
                      </span>
                    )}
                  </div>

                  <div className="space-y-5">
                    {quizQuestions.map((q, qIdx) => {
                      const selected = quizAnswers[q.id];
                      return (
                        <div
                          key={q.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
                        >
                          <div className="flex items-start gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-100 text-blue-700 text-[11px] font-bold">
                              {qIdx + 1}
                            </span>
                            <p className="text-xs font-bold text-slate-900">
                              {q.question}
                            </p>
                          </div>

                          <div className="space-y-2 pl-7">
                            {q.options.map((opt, optIdx) => {
                              const isOptionSelected = selected === optIdx;
                              const isCorrect = q.answer === optIdx;

                              let optionStyle =
                                "border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-700";

                              if (quizSubmitted) {
                                if (isCorrect) {
                                  optionStyle =
                                    "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold ring-1 ring-emerald-500";
                                } else if (isOptionSelected && !isCorrect) {
                                  optionStyle =
                                    "border-rose-400 bg-rose-50 text-rose-800 line-through";
                                }
                              } else if (isOptionSelected) {
                                optionStyle =
                                  "border-blue-600 bg-blue-50 text-blue-700 font-bold ring-1 ring-blue-600";
                              }

                              return (
                                <button
                                  key={optIdx}
                                  type="button"
                                  onClick={() => selectQuizAnswer(q.id, optIdx)}
                                  className={`w-full text-left rounded-lg border p-2.5 text-xs transition flex items-center justify-between ${optionStyle}`}
                                >
                                  <span>{opt}</span>
                                  {quizSubmitted && isCorrect && (
                                    <span className="text-emerald-600 font-bold">✓ Correct</span>
                                  )}
                                  {quizSubmitted && isOptionSelected && !isCorrect && (
                                    <span className="text-rose-600 font-bold">✗ Incorrect</span>
                                  )}
                                </button>
                              );
                            })}
                          </div>

                          {quizSubmitted && (
                            <div className="mt-2 rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600 border border-slate-200/60 ml-7">
                              <span className="font-bold text-slate-800 block mb-0.5">
                                Explanation:
                              </span>
                              {q.explanation}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {!quizSubmitted ? (
                    <button
                      type="button"
                      onClick={() => setQuizSubmitted(true)}
                      disabled={Object.keys(quizAnswers).length < quizQuestions.length}
                      className="pro-btn-primary w-full text-xs font-bold py-2.5"
                    >
                      Submit Quiz Answers &amp; Check Results
                    </button>
                  ) : (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center space-y-1">
                      <p className="text-xs font-bold text-emerald-800">
                        🎉 Quiz Completed! Mastery validated for Day 1 concepts.
                      </p>
                      <p className="text-[11px] text-emerald-700">
                        You can now mark Day 1 completed and unlock Day 2.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Day 1 Completion Milestone Unlock Action */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {day1Completed ? (
                    <span className="text-emerald-600 font-bold">
                      ✓ Day 1 marked complete. Day 2 is now unlocked!
                    </span>
                  ) : (
                    <span>Complete the checklist &amp; quiz to unlock Day 2 curriculum.</span>
                  )}
                </div>

                {!day1Completed ? (
                  <button
                    type="button"
                    onClick={handleCompleteDay1}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 transition shadow-sm shadow-emerald-600/20"
                  >
                    <span>Mark Day 1 Completed &amp; Unlock Day 2</span>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                    <span>✓ Milestone 1 Mastered</span>
                  </span>
                )}
              </div>
            </div>

            {/* SUBSEQUENT DAYS (DAY 2 TO N) — DEDICATED BOX FOR EACH DAY, LOCKED UNTIL DAY 1 IS DONE */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Upcoming Roadmap Milestones ({plan.dailyPlan.length - 1} Remaining)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Sequentially unlocked on daily milestone completion
                </span>
              </div>

              {plan.dailyPlan.slice(1).map((day) => {
                const isUnlocked = unlockedDays.includes(day.day);
                return (
                  <div
                    key={day.day}
                    className={`pro-card p-5 transition relative overflow-hidden ${
                      isUnlocked
                        ? "border-blue-200 bg-white"
                        : "border-slate-200 bg-slate-50/60 opacity-85"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`rounded-md px-2.5 py-1 text-xs font-bold ${
                            isUnlocked
                              ? "bg-blue-50 border border-blue-200 text-blue-700"
                              : "bg-slate-200/70 text-slate-600"
                          }`}
                        >
                          Day {day.day}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">
                          {day.topic}
                        </h4>
                      </div>

                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                          <span>✓ Unlocked</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                          </svg>
                          <span>Locked Milestone</span>
                        </span>
                      )}
                    </div>

                    {isUnlocked ? (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs text-slate-600">
                          {day.goal}
                        </p>
                        <div className="space-y-1 pl-1">
                          {day.tasks.map((task, tIdx) => (
                            <div key={tIdx} className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span>{task}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-2.5 rounded-xl border border-dashed border-slate-300 bg-white/70 p-3.5 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500">🔒</span>
                          <span>
                            Complete Day {day.day - 1}&apos;s checklist and quiz to unlock Day {day.day}&apos;s detailed study notes and drills.
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline">
                          Goal: {day.goal}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
