/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { QUESTIONS, Question } from "../data/questions";
import { createClient } from "@/lib/supabase/client";

interface HistoryItem {
  id: string;
  question: string;
  category: string;
  score: number;
  relevance: number;
  completeness: number;
  structure: number;
  technicalAccuracy: number;
  timestamp: string;
  strengths: string | string[];
  improvements: string | string[];
  sampleAnswer?: string;
  followUpQuestion?: string;
  communicationTip?: string;
}

export default function Home() {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();

  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customQuestionText, setCustomQuestionText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [userName, setUserName] = useState("");

  const recognitionRef = useRef<any>(null);

  const currentQuestionObj: Question = QUESTIONS[selectedQuestionIndex];

  const activeQuestionText = isCustomMode
    ? customQuestionText.trim() || "Enter your question above..."
    : currentQuestionObj.question;

  const activeCategory = isCustomMode
    ? "Custom"
    : currentQuestionObj.category;

  useEffect(() => {
    let isMounted = true;

    async function loadHistory() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) {
        console.error("Authentication error:", authError.message);
        return;
      }

      if (!user) {
        if (isMounted) {
          setHistory([]);
          router.replace("/login");
        }
        return;
      }

      if (isMounted) {
        setUserName(
          user.user_metadata?.full_name ||
            user.email?.split("@")[0] ||
            "there"
        );
      }

      const { data, error } = await supabase
        .from("interview_history")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("History loading error:", error.message);
        return;
      }

      if (isMounted && data) {
        setHistory(
          data.map((item: any) => ({
            id: item.id,
            question: item.question ?? "",
            category: item.category ?? item.role ?? "",
            score: Number(item.score ?? 0),
            relevance: Number(item.feedback?.relevance ?? 0),
            completeness: Number(item.feedback?.completeness ?? 0),
            structure: Number(item.feedback?.structure ?? 0),
            technicalAccuracy: Number(
              item.feedback?.technicalAccuracy ?? 0
            ),
            timestamp: new Date(item.created_at).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            strengths: item.feedback?.strengths ?? "",
            improvements: item.feedback?.improvements ?? "",
            sampleAnswer: item.feedback?.sampleAnswer ?? "",
            followUpQuestion: item.feedback?.followUpQuestion ?? "",
            communicationTip: item.feedback?.communicationTip ?? "",
          }))
        );
      }
    }

    void loadHistory();

    return () => {
      isMounted = false;
    };
  }, [supabase, router]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();

      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const saveToHistory = async (
    newFeedback: any,
    questionText: string,
    category: string,
    answerText: string
  ) => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error("Unable to save history:", authError?.message);
      return;
    }

    const rawScore = Number(newFeedback?.score ?? 0);
    const scoreValue = Math.max(
      0,
      Math.min(10, rawScore > 10 ? Math.round(rawScore / 10) : rawScore)
    );

    const { data, error } = await supabase
      .from("interview_history")
      .insert({
        user_id: user.id,
        question: questionText,
        category: category,
        answer: answerText,
        feedback: newFeedback,
        score: scoreValue,
      })
      .select()
      .single();

    if (error) {
      console.error("Database save error:", error.message);
      return;
    }

    if (data) {
      const newItem: HistoryItem = {
        id: data.id,
        question: data.question ?? questionText,
        category: data.category ?? category,
        score: Number(data.score ?? scoreValue),
        relevance: Number(newFeedback?.relevance ?? 0),
        completeness: Number(newFeedback?.completeness ?? 0),
        structure: Number(newFeedback?.structure ?? 0),
        technicalAccuracy: Number(newFeedback?.technicalAccuracy ?? 0),
        timestamp: new Date(data.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        strengths: newFeedback?.strengths ?? "",
        improvements: newFeedback?.improvements ?? "",
        sampleAnswer: newFeedback?.sampleAnswer ?? "",
        followUpQuestion: newFeedback?.followUpQuestion ?? "",
        communicationTip: newFeedback?.communicationTip ?? "",
      };

      setHistory((prev) => [newItem, ...prev]);

      try {
        await fetch("/api/update-memory", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: user.id,
            interviewData: {
              category: data.category ?? category,
              question: data.question ?? questionText,
              score: Number(data.score ?? scoreValue),
              feedback: newFeedback,
            },
          }),
        });
      } catch (memErr) {
        console.error("Failed to update memory profile:", memErr);
      }
    }
  };

  const clearHistory = async () => {
    const confirmClear = window.confirm(
      "Are you sure you want to clear your local interview history?"
    );

    if (!confirmClear) return;

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      alert("Please sign in to clear history.");
      return;
    }

    const { error } = await supabase
      .from("interview_history")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("History clear error:", error.message);
      alert("Failed to clear database history.");
      return;
    }

    setHistory([]);
  };

  const handleSelectQuestion = (index: number) => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    stopSpeaking();
    setIsCustomMode(false);
    setSelectedQuestionIndex(index);
    setTranscript("");
    setFeedback(null);
  };

  const handleNextQuestion = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    stopSpeaking();
    setIsCustomMode(false);
    setSelectedQuestionIndex((prev) => (prev + 1) % QUESTIONS.length);
    setTranscript("");
    setFeedback(null);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const speakFeedback = (data: any) => {
    if (!("speechSynthesis" in window) || !data) return;

    window.speechSynthesis.cancel();

    const rawScore = Number(data.score ?? 0);
    const scoreVal = Math.max(
      0,
      Math.min(10, rawScore > 10 ? Math.round(rawScore / 10) : rawScore)
    );

    const strengthsText = Array.isArray(data.strengths)
      ? data.strengths.join(". ")
      : data.strengths || "";

    const improvementsText = Array.isArray(data.improvements)
      ? data.improvements.join(". ")
      : data.improvements || "";

    const textToSpeak = `Your overall score is ${scoreVal} out of 10. Strengths: ${strengthsText}. Areas to improve: ${improvementsText}.`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStart = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech Recognition is not supported by your browser. Please use Google Chrome or Microsoft Edge."
      );
      return;
    }

    stopSpeaking();

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {
        console.warn("Recognition abort error:", e);
      }
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let fullTranscript = "";
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + " ";
      }
      setTranscript(fullTranscript.trim());
    };

    recognition.onerror = (event: any) => {
      console.error("Speech Recognition Error:", event.error);
      setIsRecording(false);
      if (event.error === "not-allowed" || event.error === "permission-denied") {
        alert("Microphone permission was blocked. Please click the lock/settings icon in your browser URL bar to allow microphone access.");
      } else if (event.error === "audio-capture") {
        alert("No microphone was detected. Please plug in or select a working audio input device.");
      }
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    setTranscript("");
    setFeedback(null);
    try {
      recognition.start();
      setIsRecording(true);
    } catch (e) {
      console.error("Start recording failed:", e);
      setIsRecording(false);
    }
  };

  const evaluateAnswer = async (answerText: string) => {
    if (!answerText || answerText.trim().length === 0) {
      alert("Please speak or type an answer to evaluate.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: activeQuestionText,
          answer: answerText.trim(),
          category: activeCategory,
        }),
      });

      const data = await response.json();

      if (!response.ok && !data.score) {
        throw new Error(data.error || "Evaluation failed");
      }

      setFeedback(data);

      await saveToHistory(
        data,
        activeQuestionText,
        activeCategory,
        answerText.trim()
      );

      speakFeedback(data);
    } catch (error) {
      console.error("Feedback request error:", error);
      alert("Unable to fetch AI evaluation. Please try again or rephrase your answer.");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn("Stop recognition error:", e);
      }
      setIsRecording(false);
    }

    const answerText = transcript.trim();

    if (!answerText) {
      alert("No speech was detected. Please speak into your microphone or type your answer directly in the transcript box below.");
      return;
    }

    await evaluateAnswer(answerText);
  };

  const handlePracticeFollowUp = () => {
    const nextQuestion =
      typeof feedback?.followUpQuestion === "string"
        ? feedback.followUpQuestion.trim()
        : "";

    if (!nextQuestion) {
      alert("No follow-up question available for this answer.");
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    stopSpeaking();

    setIsCustomMode(true);
    setCustomQuestionText(nextQuestion);
    setTranscript("");
    setFeedback(null);
  };

  const handleLogout = async () => {
    stopSpeaking();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const rawScore = Number(feedback?.score ?? 0);
  const scoreValue = Math.max(
    0,
    Math.min(10, rawScore > 10 ? Math.round(rawScore / 10) : rawScore)
  );

  const circumference = 264;
  const scoreOffset = circumference - (scoreValue / 10) * circumference;

  const strengths = feedback
    ? Array.isArray(feedback.strengths)
      ? feedback.strengths
      : feedback.strengths
        ? [feedback.strengths]
        : ["Clear communication structure."]
    : [];

  const improvements = feedback
    ? Array.isArray(feedback.improvements)
      ? feedback.improvements
      : feedback.improvements
        ? [feedback.improvements]
        : ["Add more concrete quantitative metrics to validate your impact."]
    : [];

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      {/* Top Header */}
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700 border border-indigo-100">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Voice Simulation
            </span>
            <span className="text-xs text-slate-400">•</span>
            <span className="text-xs text-slate-500">Gemini 1.5 Real-Time Engine</span>
          </div>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Voice Interview Studio
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Practice answering aloud with real-time speech telemetry and instant AI evaluation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl border border-slate-200/80 bg-white px-3.5 py-2 text-xs text-slate-600 shadow-2xs sm:block">
            Signed in as <span className="font-bold text-slate-900">{userName || "Candidate"}</span>
          </div>
          <button
            onClick={handleLogout}
            className="pro-btn-secondary !min-h-9 !px-3.5 !py-1.5 text-xs"
          >
            Sign out
          </button>
        </div>
      </header>

      {/* Main Studio Grid */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
        {/* Left Side: Interactive Voice Chamber */}
        <section className="pro-card p-6 sm:p-8">
          {/* Question Selector Carousel */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Curated Practice Questions
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {QUESTIONS.length} Questions Available
              </span>
            </div>

            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
              {QUESTIONS.map((question, index) => (
                <button
                  key={question.id}
                  onClick={() => handleSelectQuestion(index)}
                  className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all duration-150 ${
                    !isCustomMode && selectedQuestionIndex === index
                      ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  Q{index + 1} · {question.category}
                </button>
              ))}
              <button
                onClick={() => {
                  if (isRecording) {
                    recognitionRef.current?.stop();
                    setIsRecording(false);
                  }
                  setIsCustomMode(true);
                  setTranscript("");
                  setFeedback(null);
                }}
                className={`shrink-0 rounded-xl border px-3.5 py-2 text-xs font-semibold transition-all ${
                  isCustomMode
                    ? "border-indigo-600 bg-indigo-600 text-white shadow-xs"
                    : "border-dashed border-slate-300 bg-white text-slate-600 hover:border-indigo-400 hover:text-indigo-600"
                }`}
              >
                + Custom Question
              </button>
            </div>
          </div>

          {/* Active Question Display Card */}
          <div className="mt-5 rounded-2xl border border-slate-200/90 bg-gradient-to-br from-slate-50 via-white to-indigo-50/20 p-5 sm:p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="rounded-md bg-indigo-100/70 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-indigo-700">
                {activeCategory}
              </span>
              {!isCustomMode && (
                <button
                  onClick={handleNextQuestion}
                  className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition"
                >
                  Next Scenario →
                </button>
              )}
            </div>

            {isCustomMode ? (
              <textarea
                value={customQuestionText}
                onChange={(e) => setCustomQuestionText(e.target.value)}
                placeholder="Type or paste any interview question here..."
                rows={3}
                className="pro-input resize-y text-sm"
              />
            ) : (
              <h2 className="text-lg font-bold leading-relaxed tracking-tight text-slate-900 sm:text-xl">
                {activeQuestionText}
              </h2>
            )}
          </div>

          {/* Recording Microphone Station */}
          <div className="my-7 rounded-2xl border border-slate-200/80 bg-white p-8 text-center shadow-xs">
            <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
              {isRecording && (
                <>
                  <span className="absolute inset-0 animate-ping rounded-full bg-rose-400/20" />
                  <span className="absolute inset-1 rounded-full border-2 border-rose-300 animate-pulse" />
                </>
              )}
              <button
                onClick={isRecording ? handleStop : handleStart}
                disabled={loading}
                aria-label={isRecording ? "Stop recording and evaluate" : "Start recording"}
                className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-full transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
                  isRecording
                    ? "bg-rose-600 text-white shadow-lg shadow-rose-500/30"
                    : "bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-lg shadow-indigo-500/25"
                }`}
              >
                {isRecording ? (
                  <span className="flex h-7 items-center gap-1">
                    {[0, 1, 2, 3, 4].map((index) => (
                      <span
                        key={index}
                        className="waveform-bar h-full w-1 rounded-full bg-white animate-bounce"
                        style={{ animationDelay: `${index * 120}ms` }}
                      />
                    ))}
                  </span>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9" aria-hidden="true">
                    <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="2" />
                    <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v3m-4 0h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                )}
              </button>
            </div>

            <h3 className="mt-5 text-base font-bold text-slate-900">
              {loading
                ? "Evaluating Your Response..."
                : isRecording
                ? "Recording Active — Listening to your answer"
                : "Microphone Ready"}
            </h3>
            <p className="mx-auto mt-1 max-w-sm text-xs text-slate-500">
              {loading
                ? "Analyzing structure, technical depth, and speech metrics."
                : isRecording
                ? "Speak clearly and naturally. Press the red button when finished."
                : "Click the microphone button to start answering out loud."}
            </p>

            {isRecording && (
              <span className="mt-3.5 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700 border border-rose-200">
                <span className="h-2 w-2 rounded-full bg-rose-600 animate-pulse" />
                Live Audio Stream Active
              </span>
            )}

            {loading && (
              <div className="mx-auto mt-4 h-1.5 max-w-xs overflow-hidden rounded-full bg-indigo-100">
                <div className="h-full w-1/2 animate-pulse rounded-full bg-indigo-600" />
              </div>
            )}
          </div>

          {/* Real-time Transcription Teleprompter */}
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/60 p-5">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <span className="text-xs font-bold text-slate-800">Spoken Answer Transcript</span>
              </div>
              <span className="text-[11px] text-slate-400">Continuous speech recognition</span>
            </div>
            <p className="min-h-12 whitespace-pre-wrap text-xs leading-relaxed text-slate-700">
              {transcript || (
                <span className="italic text-slate-400">
                  Your spoken answer will be transcribed here in real-time as you speak...
                </span>
              )}
            </p>

            {transcript && !isRecording && (
              <div className="mt-3 flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => evaluateAnswer(transcript)}
                  disabled={loading}
                  className="pro-btn-primary !min-h-8 !px-3.5 !py-1 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Evaluate This Transcript</span>
                </button>
              </div>
            )}
          </div>

          {/* AI Feedback & Diagnostic Evaluation Report */}
          {feedback && !loading && (
            <section className="mt-8 animate-fade-up border-t border-slate-200/80 pt-6">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100">
                    Diagnostic Report
                  </span>
                  <h3 className="mt-1 text-lg font-bold text-slate-900">
                    AI Performance Evaluation
                  </h3>
                </div>
                <button
                  onClick={isSpeaking ? stopSpeaking : () => speakFeedback(feedback)}
                  className="pro-btn-secondary !min-h-9 !px-3.5 !py-1.5 text-xs font-semibold"
                >
                  {isSpeaking ? "■ Stop Audio Voice" : "▶ Read Feedback Aloud"}
                </button>
              </div>

              <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
                {/* Overall Score Meter */}
                <div className="pro-card flex flex-col items-center justify-center p-5 text-center">
                  <div className="relative h-28 w-28">
                    <svg viewBox="0 0 100 100" className="-rotate-90 h-full w-full">
                      <circle cx="50" cy="50" r="42" stroke="#e2e8f0" strokeWidth="8" fill="none" />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        stroke="url(#scoreGradientPro)"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={scoreOffset}
                        strokeLinecap="round"
                        style={{ transition: "stroke-dashoffset 800ms ease" }}
                      />
                      <defs>
                        <linearGradient id="scoreGradientPro" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                        {scoreValue}
                      </span>
                      <span className="text-[10px] font-medium text-slate-400">out of 10</span>
                    </div>
                  </div>
                  <p className="mt-2 text-xs font-bold text-slate-700">Overall Score</p>
                </div>

                {/* Strengths & Improvements */}
                <div className="space-y-4">
                  <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/70 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-200/80 text-emerald-800 text-xs font-bold">✓</span>
                      <h4 className="text-xs font-bold text-emerald-950">Demonstrated Strengths</h4>
                    </div>
                    <ul className="space-y-1.5 text-xs text-emerald-900/90 leading-relaxed">
                      {strengths.map((str: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-emerald-600 shrink-0" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-amber-200/80 bg-amber-50/70 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-200/80 text-amber-800 text-xs font-bold">↗</span>
                      <h4 className="text-xs font-bold text-amber-950">Actionable Opportunities</h4>
                    </div>
                    <ul className="space-y-1.5 text-xs text-amber-900/90 leading-relaxed">
                      {improvements.map((imp: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-amber-600 shrink-0" />
                          <span>{imp}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Sample Model Answer */}
              {feedback.sampleAnswer && (
                <div className="mt-5 rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                        <span className="text-xs">✦</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-900">Benchmark Model Answer</h4>
                    </div>
                    <button
                      onClick={() => void GenCopyAnswer(feedback.sampleAnswer)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition"
                    >
                      Copy Benchmark Answer
                    </button>
                  </div>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-slate-700 bg-slate-50/70 rounded-xl p-4 border border-slate-100">
                    {feedback.sampleAnswer}
                  </p>
                </div>
              )}

              {/* Follow-up Interview Question */}
              {feedback.followUpQuestion && (
                <div className="mt-5 rounded-2xl border border-indigo-200/80 bg-indigo-50/40 p-5 sm:p-6">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">
                      Q+
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                        Adaptive Follow-Up
                      </span>
                      <h4 className="mt-1 text-sm font-bold text-slate-900 leading-normal">
                        {feedback.followUpQuestion}
                      </h4>
                      <button
                        onClick={handlePracticeFollowUp}
                        className="mt-3 pro-btn-primary !min-h-9 !px-4 !py-1.5 text-xs font-bold"
                      >
                        Practice Follow-Up Question →
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}
        </section>

        {/* Right Side: Overview & History Sidebar */}
        <aside className="space-y-6">
          {/* Practice Summary */}
          <section className="pro-card p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Session Telemetry</h2>
              <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                Live Memory
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-[11px] font-medium text-slate-500">Total Attempts</p>
                <p className="mt-1 text-2xl font-extrabold text-slate-900">{history.length}</p>
                <p className="text-[10px] text-slate-400">Sessions saved</p>
              </div>

              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-[11px] font-medium text-slate-500">Average Score</p>
                <p className="mt-1 text-2xl font-extrabold text-indigo-700">
                  {history.length
                    ? (
                        history.reduce((sum, item) => sum + item.score, 0) /
                        history.length
                      ).toFixed(1)
                    : "—"}
                </p>
                <p className="text-[10px] text-slate-400">Scale of 10</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-indigo-100 bg-indigo-50/50 p-3.5">
              <p className="text-xs font-bold text-indigo-900">Coaching Directive</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                Structure answers using the STAR format: Situation, Task, Action, and Quantitative Result.
              </p>
            </div>
          </section>

          {/* Recent History Feed */}
          <section className="pro-card p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">Recent Session Feed</h2>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  className="text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition"
                >
                  Clear Feed
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-xs text-slate-500">
                  Complete your first question to view your historical evaluation trail.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {history.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-xl border border-slate-100 bg-slate-50/60 p-3 transition-colors hover:bg-slate-50"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="inline-block rounded-md bg-white border border-slate-200/80 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {item.category}
                        </span>
                        <p className="mt-1 text-xs font-semibold text-slate-800 line-clamp-1">
                          {item.question}
                        </p>
                        <p className="mt-0.5 text-[10px] text-slate-400">{item.timestamp}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <span className="text-sm font-extrabold text-indigo-700">
                          {item.score}
                        </span>
                        <span className="text-[10px] text-slate-400">/10</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </aside>
      </div>
    </div>
  );
}

function GenCopyAnswer(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    return navigator.clipboard.writeText(text).catch((error) => {
      console.error("Unable to copy sample answer:", error);
      alert("Failed to copy automatically. Please select text manually.");
    });
  }

  alert("Clipboard access is not permitted in this browser.");
  return Promise.resolve();
}
