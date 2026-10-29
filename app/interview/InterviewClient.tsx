
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
      alert("History save karne ke liye pehle login karein.");
      return;
    }

    const rawScore = Number(newFeedback?.score ?? 0);
    const scoreValue = Math.max(
      0,
      Math.min(10, rawScore > 10 ? Math.round(rawScore / 10) : rawScore)
    );

    const feedbackDetails = {
      relevance: Number(newFeedback?.relevance ?? 0),
      completeness: Number(newFeedback?.completeness ?? 0),
      structure: Number(newFeedback?.structure ?? 0),
      technicalAccuracy: Number(newFeedback?.technicalAccuracy ?? 0),
      strengths: newFeedback?.strengths ?? "",
      improvements: newFeedback?.improvements ?? "",
      sampleAnswer: newFeedback?.sampleAnswer ?? "",
      followUpQuestion: newFeedback?.followUpQuestion ?? "",
      communicationTip: newFeedback?.communicationTip ?? "",
    };

    const { data, error } = await supabase
      .from("interview_history")
      .insert({
        user_id: user.id,
        role: category,
        question: questionText,
        category,
        score: scoreValue,
        feedback: feedbackDetails,
        transcript: { answer: answerText },
      })
      .select()
      .single();

    if (error) {
      console.error("History saving error:", error.message);
      alert("Interview feedback mila, lekin history save nahi hui.");
      return;
    }

    if (data) {
      const newEntry: HistoryItem = {
        id: data.id,
        question: data.question ?? questionText,
        category: data.category ?? category,
        score: Number(data.score ?? scoreValue),
        relevance: Number(data.feedback?.relevance ?? 0),
        completeness: Number(data.feedback?.completeness ?? 0),
        structure: Number(data.feedback?.structure ?? 0),
        technicalAccuracy: Number(
          data.feedback?.technicalAccuracy ?? 0
        ),
        timestamp: new Date(data.created_at).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        strengths: data.feedback?.strengths ?? "",
        improvements: data.feedback?.improvements ?? "",
        sampleAnswer: data.feedback?.sampleAnswer ?? "",
        followUpQuestion: data.feedback?.followUpQuestion ?? "",
        communicationTip: data.feedback?.communicationTip ?? "",
      };

      setHistory((previous) => [newEntry, ...previous]);
    }
  };

  const clearHistory = async () => {
    if (
      !window.confirm(
        "Are you sure you want to clear your interview history?"
      )
    ) {
      return;
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      alert("Please log in to manage your history.");
      return;
    }

    const { error } = await supabase
      .from("interview_history")
      .delete()
      .eq("user_id", user.id);

    if (error) {
      console.error("History deletion error:", error.message);
      alert("History clear nahi hui. Please try again.");
      return;
    }

    setHistory([]);
  };

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  const handleSelectQuestion = (index: number) => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
    }

    if (isSpeaking) stopSpeaking();

    setIsCustomMode(false);
    setSelectedQuestionIndex(index);
    setTranscript("");
    setFeedback(null);
  };

  const handleNextQuestion = () => {
    handleSelectQuestion((selectedQuestionIndex + 1) % QUESTIONS.length);
  };

  const handleStart = () => {
    if (isCustomMode && !customQuestionText.trim()) {
      alert("Pehle apna custom question enter karein!");
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Speech Recognition is not supported in this browser. Try Chrome."
      );
      return;
    }

    setFeedback(null);
    setTranscript("");

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      let finalTranscript = "";

      for (let i = 0; i < event.results.length; i++) {
        finalTranscript += event.results[i][0].transcript;
      }

      setTranscript(finalTranscript);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsRecording(false);
    };

    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Unable to start recording:", error);
      alert("Recording start nahi ho paayi. Please try again.");
    }
  };

  const speakFeedback = (data: any) => {
    if (!("speechSynthesis" in window)) {
      alert("Voice playback is not supported in this browser.");
      return;
    }

    window.speechSynthesis.cancel();

    const score = data?.score ?? 0;
    const strengths = Array.isArray(data?.strengths)
      ? data.strengths.join(". ")
      : data?.strengths || "No specific strengths recorded.";

    const improvements = Array.isArray(data?.improvements)
      ? data.improvements.join(". ")
      : data?.improvements || "No specific improvements recorded.";

    const utterance = new SpeechSynthesisUtterance(
      `Your score is ${score} out of 10. What worked: ${strengths}. Work on this next: ${improvements}`
    );

    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleStop = async () => {
    recognitionRef.current?.stop();
    setIsRecording(false);

    const answerText = transcript.trim();

    if (!answerText) {
      alert("Kuch bola nahi gaya. Please try again.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: activeQuestionText,
          answer: answerText,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to fetch feedback.");
        return;
      }

      setFeedback(data);

      await saveToHistory(
        data,
        activeQuestionText,
        activeCategory,
        answerText
      );

      speakFeedback(data);
    } catch (error) {
      console.error("Feedback request error:", error);
      alert("Feedback nahi mil paya. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeFollowUp = () => {
    const nextQuestion =
      typeof feedback?.followUpQuestion === "string"
        ? feedback.followUpQuestion.trim()
        : "";

    if (!nextQuestion) {
      alert("Is answer ke liye follow-up question available nahi hai.");
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
        : ["No specific strengths recorded."]
    : [];

  const improvements = feedback
    ? Array.isArray(feedback.improvements)
      ? feedback.improvements
      : feedback.improvements
        ? [feedback.improvements]
        : ["No specific improvements recorded."]
    : [];

  return (
    <main className="min-h-screen overflow-hidden px-4 py-5 text-[#302748] sm:px-6 sm:py-8 lg:px-8">
      <div className="pointer-events-none fixed -left-40 top-20 h-96 w-96 rounded-full bg-violet-200/35 blur-3xl" />
      <div className="pointer-events-none fixed -right-40 top-1/3 h-96 w-96 rounded-full bg-blue-200/35 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="brand-icon h-12 w-12">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" aria-hidden="true">
                <path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-[#302748]">
                PrepVoice<span className="text-[#8769e9]">.</span>
              </h1>
              <p className="text-xs text-[#89829d]">Your personal AI interview coach</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-white bg-white/75 px-4 py-2 text-sm text-[#716887] shadow-sm sm:block">
              Welcome, <span className="font-bold text-[#51416f]">{userName || "there"}</span>
            </div>
            <button onClick={handleLogout} className="btn-secondary !min-h-10 !px-4 !py-2 text-sm">
              Sign out
            </button>
          </div>
        </header>

        <section className="relative mb-8 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#7960df] via-[#8e75eb] to-[#6ba8f8] p-7 text-white shadow-[0_20px_60px_rgba(124,98,220,0.22)] sm:p-10">
          <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full border border-white/20" />
          <div className="pointer-events-none absolute -right-2 -top-12 h-48 w-48 rounded-full border border-white/20" />
          <div className="pointer-events-none absolute bottom-0 right-1/4 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

          <div className="relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/15 px-3 py-1.5 text-[11px] font-bold tracking-[0.16em] text-white/90">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
              YOUR PRACTICE SPACE
            </span>
            <h2 className="mt-5 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
              Speak clearly.
              <br />
              Show them what you know.
            </h2>
            <p className="mt-4 max-w-xl text-sm leading-7 text-white/80 sm:text-base">
              Practice real interview questions, answer out loud, and get personalized AI feedback to improve with every attempt.
            </p>
          </div>

          <div className="relative z-10 mt-7 flex flex-wrap gap-3 text-sm font-semibold sm:absolute sm:bottom-10 sm:right-10 sm:mt-0">
            <span className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur-sm">
              ✦ AI-powered feedback
            </span>
            <span className="rounded-xl border border-white/20 bg-white/15 px-4 py-3 backdrop-blur-sm">
              ♡ Voice practice
            </span>
          </div>
        </section>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <section className="premium-card min-w-0 p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="eyebrow">LET&apos;S GET PRACTICING</p>
                <h2 className="section-title mt-2">Your interview room</h2>
                <p className="mt-2 text-sm leading-6 text-[#8b849f]">
                  Choose a question and answer it in your own words.
                </p>
              </div>
              <span className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700">
                {QUESTIONS.length} practice questions
              </span>
            </div>

            <div className="mt-7">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#938ba7]">
                Choose a question
              </p>
              <div className="no-scrollbar flex gap-2 overflow-x-auto pb-2">
                {QUESTIONS.map((question, index) => (
                  <button
                    key={question.id}
                    onClick={() => handleSelectQuestion(index)}
                    className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all duration-200 ${
                      !isCustomMode && selectedQuestionIndex === index
                        ? "border-violet-300 bg-gradient-to-r from-violet-100 to-blue-50 text-violet-800 shadow-sm"
                        : "border-[#eeeaf6] bg-white text-[#817993] hover:border-violet-200 hover:bg-violet-50/60"
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
                  className={`shrink-0 rounded-xl border px-4 py-2.5 text-xs font-semibold transition-all ${
                    isCustomMode
                      ? "border-violet-300 bg-violet-100 text-violet-800"
                      : "border-[#eeeaf6] bg-white text-[#817993] hover:border-violet-200 hover:bg-violet-50"
                  }`}
                >
                  + Custom question
                </button>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-[#eeeaf8] bg-gradient-to-br from-[#faf8ff] to-[#f5f8ff] p-5 sm:p-6">
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="rounded-full border border-violet-100 bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700">
                  {activeCategory}
                </span>
                {!isCustomMode && (
                  <button
                    onClick={handleNextQuestion}
                    className="text-xs font-bold text-violet-600 transition hover:text-violet-800"
                  >
                    Next question →
                  </button>
                )}
              </div>

              {isCustomMode ? (
                <textarea
                  value={customQuestionText}
                  onChange={(event) => setCustomQuestionText(event.target.value)}
                  placeholder="Type or paste your interview question here..."
                  rows={3}
                  className="premium-input resize-y"
                />
              ) : (
                <p className="text-lg font-bold leading-8 tracking-tight text-[#352b4c] sm:text-xl">
                  {activeQuestionText}
                </p>
              )}
            </div>

            <div className="my-7 rounded-2xl border border-[#f0edf8] bg-white/80 px-5 py-8 text-center sm:py-10">
              <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                {isRecording && (
                  <>
                    <span className="absolute inset-0 animate-ping rounded-full bg-violet-200/50" />
                    <span className="absolute inset-2 rounded-full border border-violet-200" />
                  </>
                )}
                <button
                  onClick={isRecording ? handleStop : handleStart}
                  disabled={loading}
                  aria-label={isRecording ? "Stop recording and evaluate" : "Start recording"}
                  className={`relative z-10 flex h-24 w-24 items-center justify-center rounded-full shadow-[0_12px_35px_rgba(126,99,219,0.22)] transition-all duration-300 hover:scale-105 disabled:cursor-not-allowed disabled:opacity-50 ${
                    isRecording
                      ? "bg-gradient-to-br from-rose-400 to-pink-500 text-white"
                      : "brand-icon"
                  }`}
                >
                  {isRecording ? (
                    <span className="flex h-6 items-center gap-1">
                      {[0, 1, 2, 3, 4].map((index) => (
                        <span
                          key={index}
                          className="waveform-bar h-full w-1 rounded-full bg-white animate-bounce"
                          style={{ animationDelay: `${index * 100}ms` }}
                        />
                      ))}
                    </span>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
                      <rect x="9" y="2" width="6" height="12" rx="3" stroke="currentColor" strokeWidth="1.8" />
                      <path d="M5 10v1a7 7 0 0 0 14 0v-1M12 18v3m-4 0h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              </div>

              <h3 className="mt-5 text-base font-extrabold text-[#3b3154]">
                {loading
                  ? "Your coach is thinking..."
                  : isRecording
                    ? "Listening to your answer"
                    : "Ready when you are"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-[#928ba4]">
                {loading
                  ? "Analyzing your response and preparing personalized feedback."
                  : isRecording
                    ? "Speak naturally. Tap the button when you finish."
                    : "Tap the microphone and answer the question out loud."}
              </p>

              {isRecording && (
                <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-600">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
                  Recording in progress
                </span>
              )}

              {loading && (
                <div className="mx-auto mt-5 h-1.5 max-w-xs overflow-hidden rounded-full bg-violet-100">
                  <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-violet-500 to-blue-400" />
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-[#eeeaf6] bg-[#fcfbff] p-5">
              <div className="mb-3 flex items-center gap-2">
                <span className="brand-icon h-8 w-8 rounded-lg">
                  <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
                    <path d="M7 5h10M7 9h10M7 13h7M5 3h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-5l-4 3v-3H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <div>
                  <h3 className="text-sm font-bold text-[#45395e]">Your answer</h3>
                  <p className="text-[11px] text-[#a19ab2]">Live speech transcription</p>
                </div>
              </div>
              <p className="min-h-12 whitespace-pre-wrap text-sm leading-7 text-[#706782]">
                {transcript || (
                  <span className="italic text-[#b0a9be]">
                    Your spoken answer will appear here as you talk...
                  </span>
                )}
              </p>
            </div>

            {feedback && !loading && (
              <section className="mt-7 animate-fade-up">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="eyebrow">YOUR PERFORMANCE</p>
                    <h3 className="section-title mt-2">Your AI feedback</h3>
                    <p className="mt-1 text-sm text-[#938ba7]">
                      Personalized insights for your next attempt.
                    </p>
                  </div>
                  <button
                    onClick={isSpeaking ? stopSpeaking : () => speakFeedback(feedback)}
                    className="btn-secondary !min-h-10 !px-4 !py-2 text-xs"
                  >
                    {isSpeaking ? "■ Stop voice" : "▶ Listen to feedback"}
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
                  <div className="premium-card flex flex-col items-center justify-center p-5">
                    <div className="relative h-32 w-32">
                      <svg viewBox="0 0 100 100" className="-rotate-90">
                        <circle cx="50" cy="50" r="42" stroke="#eeeaf8" strokeWidth="8" fill="none" />
                        <circle
                          cx="50"
                          cy="50"
                          r="42"
                          stroke="url(#scoreGradient)"
                          strokeWidth="8"
                          fill="none"
                          strokeDasharray={circumference}
                          strokeDashoffset={scoreOffset}
                          strokeLinecap="round"
                          style={{ transition: "stroke-dashoffset 900ms ease" }}
                        />
                        <defs>
                          <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#9b78f0" />
                            <stop offset="100%" stopColor="#68a8f7" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-4xl font-extrabold tracking-tight text-[#40325d]">
                          {scoreValue}
                        </span>
                        <span className="text-[11px] font-semibold text-[#9a91ad]">out of 10</span>
                      </div>
                    </div>
                    <p className="mt-2 text-xs font-bold text-[#827693]">Overall score</p>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/90 to-white p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">✓</span>
                        <h4 className="font-bold text-emerald-900">What worked well</h4>
                      </div>
                      <ul className="space-y-2 text-sm leading-6 text-emerald-900/80">
                        {strengths.map((strength: string, index: number) => (
                          <li key={index} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50/90 to-white p-5">
                      <div className="mb-3 flex items-center gap-2">
                        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-100 text-amber-700">↗</span>
                        <h4 className="font-bold text-amber-900">Areas to improve</h4>
                      </div>
                      <ul className="space-y-2 text-sm leading-6 text-amber-900/80">
                        {improvements.map((improvement: string, index: number) => (
                          <li key={index} className="flex gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {feedback.sampleAnswer && (
                  <div className="mt-4 rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 sm:p-6">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                        ✨
                      </span>
                      <div>
                        <h4 className="font-bold text-[#453568]">Example of a stronger answer</h4>
                        <p className="text-xs text-[#9488ad]">Use this as a guide, not a script.</p>
                      </div>
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-7 text-[#625576]">
                      {feedback.sampleAnswer}
                    </p>
                    <button
                      onClick={() => {
                        void GenCopyAnswer(feedback.sampleAnswer);
                      }}
                      className="mt-4 rounded-xl border border-violet-200 bg-white px-4 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
                    >
                      Copy example answer
                    </button>
                  </div>
                )}

                {feedback.communicationTip && (
                  <div className="mt-4 rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 to-white p-5">
                    <div className="flex items-start gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
                        💡
                      </span>
                      <div>
                        <h4 className="font-bold text-sky-900">Communication tip</h4>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-sky-900/80">
                          {feedback.communicationTip}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {feedback.followUpQuestion && (
                  <div className="mt-4 rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-violet-50 p-5 sm:p-6">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-100 text-indigo-700">
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                          <path d="M8 10h8M8 14h5m-8 6 3-3h10a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H6a3 3 0 0 0-3 3v14Z" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                          AI interviewer asks
                        </p>
                        <h4 className="mt-2 text-base font-bold leading-7 text-[#40345f]">
                          {feedback.followUpQuestion}
                        </h4>
                        <p className="mt-2 text-xs leading-5 text-[#8c82a3]">
                          Continue your practice by answering this related question.
                        </p>
                        <button
                          onClick={handlePracticeFollowUp}
                          className="btn-primary mt-4 !min-h-11 !px-5 !py-2.5 text-sm"
                        >
                          Practice follow-up question →
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}
          </section>

          <aside className="space-y-6">
            <section className="premium-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">YOUR JOURNEY</p>
                  <h2 className="mt-2 text-xl font-extrabold text-[#34294c]">Practice overview</h2>
                </div>
                <span className="brand-icon h-11 w-11 rounded-xl">
                  <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                    <path d="M4 19V5m0 14h16M8 16v-4m4 4V7m4 9v-7m4 7v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </span>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-white p-4">
                  <p className="text-xs font-semibold text-[#938ba7]">Attempts</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#57418b]">{history.length}</p>
                  <p className="mt-1 text-[11px] text-[#a49bb7]">Saved sessions</p>
                </div>
                <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-white p-4">
                  <p className="text-xs font-semibold text-[#938ba7]">Average score</p>
                  <p className="mt-2 text-3xl font-extrabold text-[#466fae]">
                    {history.length
                      ? (
                          history.reduce((sum, item) => sum + item.score, 0) /
                          history.length
                        ).toFixed(1)
                      : "—"}
                  </p>
                  <p className="mt-1 text-[11px] text-[#a49bb7]">Out of 10</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-violet-100 bg-violet-50/60 p-4">
                <p className="text-sm font-bold text-[#58467d]">
                  A little practice goes a long way.
                </p>
                <p className="mt-1 text-xs leading-5 text-[#9185ab]">
                  Focus on clear examples, structured answers, and steady delivery.
                </p>
              </div>
            </section>

            <section className="premium-card p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="eyebrow">YOUR PROGRESS</p>
                  <h2 className="mt-2 text-xl font-extrabold text-[#34294c]">Recent attempts</h2>
                </div>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="rounded-lg px-2 py-1 text-xs font-bold text-[#9a8eae] transition hover:bg-rose-50 hover:text-rose-600"
                  >
                    Clear history
                  </button>
                )}
              </div>

              {history.length === 0 ? (
                <div className="py-9 text-center">
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100 text-violet-600">
                    <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7" aria-hidden="true">
                      <path d="M12 8v4l3 2M21 12a9 9 0 1 1-2.64-6.36M21 4v5h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <p className="mt-4 text-sm font-bold text-[#514565]">Your journey starts here</p>
                  <p className="mx-auto mt-2 max-w-xs text-xs leading-5 text-[#a29ab2]">
                    Complete your first practice session and your results will show up here.
                  </p>
                </div>
              ) : (
                <div className="mt-5 space-y-3">
                  {history.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-[#f0edf7] bg-white p-4 transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_8px_24px_rgba(100,75,160,0.06)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <span className="inline-flex rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-violet-700">
                            {item.category}
                          </span>
                          <p className="mt-2 truncate text-sm font-semibold leading-6 text-[#514565]">
                            {item.question}
                          </p>
                          <p className="mt-1 text-[11px] text-[#a49bb7]">{item.timestamp}</p>
                        </div>
                        <div className="shrink-0 rounded-xl bg-gradient-to-br from-violet-50 to-blue-50 px-3 py-2 text-center">
                          <p className="text-lg font-extrabold text-[#765bd0]">{item.score}</p>
                          <p className="text-[9px] font-bold text-[#a098b4]">/ 10</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <div className="rounded-2xl border border-white bg-white/60 p-4 text-center">
              <p className="text-xs leading-5 text-[#a29ab3]">
                Made for growth, powered by practice.
                <span className="ml-1 font-bold text-[#8b72d6]">PrepVoice.</span>
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function GenCopyAnswer(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard) {
    return navigator.clipboard.writeText(text).catch((error) => {
      console.error("Unable to copy sample answer:", error);
      alert("Copy nahi ho paya. Please manually select the text.");
    });
  }

  alert("Clipboard access is not available in this browser.");
  return Promise.resolve();
}
