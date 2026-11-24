
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  PreparationPlan,
  PreparationDay,
} from "../api/preparation/route";

/* -------------------------------------------------------
   TYPES
------------------------------------------------------- */

type PracticeProblem = {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  url?: string;
};

type DayTab = "notes" | "checklist" | "quiz" | "practice";
type NotesLanguage = "english" | "hinglish";

type TheoryNote = {
  title: string;
  explanation: string;
  keyPoints: string[];
  example: string;
};

type NotesData = {
  overview: string;
  coreTheory: TheoryNote[];
  codeSnippet: {
    title: string;
    language: string;
    code: string;
    explanation: string;
  };
  interviewQuestions: {
    question: string;
    modelAnswer: string;
    tips: string;
  }[];
  cheatSheet: {
    term: string;
    definition: string;
  }[];
};

type BilingualNotes = {
  english: NotesData;
  hinglish: NotesData;
};

/* -------------------------------------------------------
   CONSTANTS
------------------------------------------------------- */

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

const defaultPracticeProblems: PracticeProblem[] = [
  {
    id: "two-sum-default",
    title: "Two Sum",
    description: "Practice array traversal and efficient lookup.",
    difficulty: "Easy",
  },
  {
    id: "valid-parentheses-default",
    title: "Valid Parentheses",
    description: "Practice stack-based problem solving.",
    difficulty: "Easy",
  },
  {
    id: "binary-search-default",
    title: "Binary Search",
    description: "Practice efficient searching in sorted data.",
    difficulty: "Easy",
  },
  {
    id: "maximum-subarray-default",
    title: "Maximum Subarray",
    description: "Practice array optimization and Kadane's algorithm.",
    difficulty: "Medium",
  },
];

const practiceProblemSets = [
  {
    keywords: ["array", "arrays", "big-o", "complexity"],
    problems: [
      { id: "two-sum", title: "Two Sum", description: "Find two numbers whose sum equals the target.", difficulty: "Easy" as const },
      { id: "best-time", title: "Best Time to Buy and Sell Stock", description: "Find the maximum possible profit.", difficulty: "Easy" as const },
      { id: "maximum-subarray", title: "Maximum Subarray", description: "Find the contiguous subarray with the largest sum.", difficulty: "Medium" as const },
      { id: "product-except-self", title: "Product of Array Except Self", description: "Calculate products without division.", difficulty: "Medium" as const },
    ],
  },
  {
    keywords: ["two pointer", "two-pointer", "sliding window"],
    problems: [
      { id: "container-water", title: "Container With Most Water", description: "Find two lines that hold maximum water.", difficulty: "Medium" as const },
      { id: "three-sum", title: "3Sum", description: "Find unique triplets whose sum is zero.", difficulty: "Medium" as const },
      { id: "move-zeroes", title: "Move Zeroes", description: "Move zeroes to the end while maintaining order.", difficulty: "Easy" as const },
      { id: "minimum-subarray", title: "Minimum Size Subarray Sum", description: "Find the smallest qualifying subarray.", difficulty: "Medium" as const },
    ],
  },
  {
    keywords: ["string", "strings", "hash", "hashmap", "hash map"],
    problems: [
      { id: "valid-anagram", title: "Valid Anagram", description: "Check whether two strings are anagrams.", difficulty: "Easy" as const },
      { id: "valid-palindrome", title: "Valid Palindrome", description: "Check whether a string reads the same both ways.", difficulty: "Easy" as const },
      { id: "group-anagrams", title: "Group Anagrams", description: "Group words containing the same characters.", difficulty: "Medium" as const },
      { id: "longest-substring", title: "Longest Substring Without Repeating Characters", description: "Find the longest substring with unique characters.", difficulty: "Medium" as const },
    ],
  },
  {
    keywords: ["linked list", "linkedlist"],
    problems: [
      { id: "reverse-linked-list", title: "Reverse Linked List", description: "Reverse a singly linked list.", difficulty: "Easy" as const },
      { id: "merge-lists", title: "Merge Two Sorted Lists", description: "Merge two sorted linked lists.", difficulty: "Easy" as const },
      { id: "linked-list-cycle", title: "Linked List Cycle", description: "Detect whether a linked list has a cycle.", difficulty: "Easy" as const },
      { id: "remove-nth", title: "Remove Nth Node From End of List", description: "Remove a node using one traversal.", difficulty: "Medium" as const },
    ],
  },
  {
    keywords: ["stack", "queue"],
    problems: [
      { id: "valid-parentheses", title: "Valid Parentheses", description: "Check whether brackets are balanced.", difficulty: "Easy" as const },
      { id: "min-stack", title: "Min Stack", description: "Design a stack that retrieves the minimum.", difficulty: "Medium" as const },
      { id: "daily-temperatures", title: "Daily Temperatures", description: "Find the next warmer day.", difficulty: "Medium" as const },
      { id: "largest-rectangle", title: "Largest Rectangle in Histogram", description: "Find the largest rectangle area.", difficulty: "Hard" as const },
    ],
  },
  {
    keywords: ["tree", "trees", "binary tree", "bst"],
    problems: [
      { id: "max-depth", title: "Maximum Depth of Binary Tree", description: "Calculate the maximum depth.", difficulty: "Easy" as const },
      { id: "invert-tree", title: "Invert Binary Tree", description: "Invert the left and right children.", difficulty: "Easy" as const },
      { id: "level-order", title: "Binary Tree Level Order Traversal", description: "Traverse a tree level by level.", difficulty: "Medium" as const },
      { id: "validate-bst", title: "Validate Binary Search Tree", description: "Check whether a tree follows BST rules.", difficulty: "Medium" as const },
    ],
  },
  {
    keywords: ["graph", "graphs", "bfs", "dfs"],
    problems: [
      { id: "number-islands", title: "Number of Islands", description: "Count connected groups of land.", difficulty: "Medium" as const },
      { id: "flood-fill", title: "Flood Fill", description: "Replace the colour of a connected region.", difficulty: "Easy" as const },
      { id: "clone-graph", title: "Clone Graph", description: "Create a deep copy of a graph.", difficulty: "Medium" as const },
      { id: "course-schedule", title: "Course Schedule", description: "Check whether all courses can be completed.", difficulty: "Medium" as const },
    ],
  },
  {
    keywords: ["dynamic programming", "dynamic-programming", "memoization", "tabulation"],
    problems: [
      { id: "climbing-stairs", title: "Climbing Stairs", description: "Count the ways to reach the top.", difficulty: "Easy" as const },
      { id: "house-robber", title: "House Robber", description: "Maximize money without choosing adjacent houses.", difficulty: "Medium" as const },
      { id: "coin-change", title: "Coin Change", description: "Find the minimum coins needed.", difficulty: "Medium" as const },
      { id: "lis", title: "Longest Increasing Subsequence", description: "Find the longest increasing subsequence.", difficulty: "Medium" as const },
    ],
  },
  {
    keywords: ["binary search", "searching", "sorting", "sort"],
    problems: [
      { id: "binary-search", title: "Binary Search", description: "Find a target in a sorted array.", difficulty: "Easy" as const },
      { id: "search-rotated", title: "Search in Rotated Sorted Array", description: "Search in a rotated sorted array.", difficulty: "Medium" as const },
      { id: "first-last", title: "Find First and Last Position of Element", description: "Find the first and last target index.", difficulty: "Medium" as const },
      { id: "kth-largest", title: "Kth Largest Element in an Array", description: "Find the kth largest element.", difficulty: "Medium" as const },
    ],
  },
  {
    keywords: ["sql", "database", "dbms", "data analyst", "data analysis", "query"],
    problems: [
      { id: "combine-tables", title: "Combine Two Tables", description: "Practice SQL joins.", difficulty: "Easy" as const },
      { id: "second-highest", title: "Second Highest Salary", description: "Find the second highest distinct salary.", difficulty: "Medium" as const },
      { id: "duplicate-emails", title: "Duplicate Emails", description: "Identify duplicate records using SQL.", difficulty: "Easy" as const },
      { id: "department-top-three", title: "Department Top Three Salaries", description: "Practice SQL ranking and window functions.", difficulty: "Hard" as const },
    ],
  },
  {
    keywords: ["react", "frontend", "javascript", "next.js", "nextjs"],
    problems: [
      { id: "debounce", title: "Implement Debounce", description: "Implement a reusable debounce function.", difficulty: "Medium" as const },
      { id: "throttle", title: "Implement Throttle", description: "Limit how frequently a function executes.", difficulty: "Medium" as const },
      { id: "deep-clone", title: "Deep Clone an Object", description: "Create a deep copy of a nested object.", difficulty: "Medium" as const },
      { id: "promise-all", title: "Implement Promise.all", description: "Build a simplified Promise.all.", difficulty: "Hard" as const },
    ],
  },
  {
    keywords: ["system design", "scalability", "microservices", "architecture"],
    problems: [
      { id: "design-url", title: "Design a URL Shortener", description: "Design a scalable URL shortening service.", difficulty: "Medium" as const },
      { id: "design-rate-limiter", title: "Design a Rate Limiter", description: "Explore rate-limiting algorithms.", difficulty: "Hard" as const },
      { id: "design-cache", title: "Design a Distributed Cache", description: "Explore caching and consistency.", difficulty: "Hard" as const },
      { id: "design-notification", title: "Design a Notification System", description: "Design a reliable notification architecture.", difficulty: "Hard" as const },
    ],
  },
];

/* -------------------------------------------------------
   NOTES HELPERS
------------------------------------------------------- */

function getFallbackNotes(plan?: PreparationPlan | null): BilingualNotes {
  const detail = plan?.detailedDay1;
  const topic = detail?.topic || "Core Foundations";

  const existingTheory = (detail?.coreTheory || []).map((item: any) => ({
    title: item.title || "",
    explanation: item.explanation || "",
    keyPoints: item.keyPoints || [],
    example: item.example || "Try applying this concept to a small coding problem.",
  }));

  const existingCode = detail?.codeSnippet || {
    title: "Example Code",
    language: "python",
    code: "# Add your code example here",
    explanation: "Understand the code step by step.",
  };

  const existingQuestions = (detail?.interviewQuestions || []).map((item: any) => ({
    question: item.question || "",
    modelAnswer: item.modelAnswer || "",
    tips: item.tips || "",
  }));

  const existingCheatSheet = (detail?.cheatSheet || []).map((item: any) => ({
    term: item.term || "",
    definition: item.definition || "",
  }));

  const english: NotesData = {
    overview: detail?.overview || `Learn the basics of ${topic}. Focus on understanding the main ideas and practise them with small examples.`,
    coreTheory: existingTheory,
    codeSnippet: {
      title: existingCode.title || "Example Code",
      language: existingCode.language || "python",
      code: existingCode.code || "",
      explanation: existingCode.explanation || "",
    },
    interviewQuestions: existingQuestions,
    cheatSheet: existingCheatSheet,
  };

  const hinglish: NotesData = {
    overview: `Aaj hum ${topic} ko simple Hinglish mein samjhenge. Pehle basic idea clear karo, phir examples aur coding practice se concept strong banao.`,
    coreTheory: existingTheory.map((item) => ({
      ...item,
      explanation: `${item.explanation}\n\nSimple words mein: Is concept ko chhote example ke saath samajhne ki koshish karo.`,
      keyPoints: item.keyPoints,
      example: item.example,
    })),
    codeSnippet: {
      ...english.codeSnippet,
      explanation: `${english.codeSnippet.explanation}\n\nCode ko line by line samjho aur khud run karke dekho.`,
    },
    interviewQuestions: existingQuestions.map((item) => ({
      ...item,
      modelAnswer: item.modelAnswer,
      tips: `${item.tips} Answer dete time simple language use karo aur example zaroor do.`,
    })),
    cheatSheet: existingCheatSheet,
  };

  return { english, hinglish };
}

function getPlanNotes(plan?: PreparationPlan | null): BilingualNotes {
  const fallback = getFallbackNotes(plan);
  const supplied = (plan?.detailedDay1 as any)?.bilingualNotes;

  if (!supplied) return fallback;

  const normalizeLanguage = (value: any, fallbackData: NotesData): NotesData => ({
    overview: value?.overview || fallbackData.overview,
    coreTheory: Array.isArray(value?.coreTheory)
      ? value.coreTheory.map((item: any, index: number) => ({
          title: item?.title || fallbackData.coreTheory[index]?.title || "",
          explanation: item?.explanation || fallbackData.coreTheory[index]?.explanation || "",
          keyPoints: Array.isArray(item?.keyPoints)
            ? item.keyPoints
            : fallbackData.coreTheory[index]?.keyPoints || [],
          example: item?.example || fallbackData.coreTheory[index]?.example || "",
        }))
      : fallbackData.coreTheory,
    codeSnippet: {
      title: value?.codeSnippet?.title || fallbackData.codeSnippet.title,
      language: value?.codeSnippet?.language || fallbackData.codeSnippet.language,
      code: value?.codeSnippet?.code || fallbackData.codeSnippet.code,
      explanation: value?.codeSnippet?.explanation || fallbackData.codeSnippet.explanation,
    },
    interviewQuestions: Array.isArray(value?.interviewQuestions)
      ? value.interviewQuestions.map((item: any, index: number) => ({
          question: item?.question || fallbackData.interviewQuestions[index]?.question || "",
          modelAnswer: item?.modelAnswer || fallbackData.interviewQuestions[index]?.modelAnswer || "",
          tips: item?.tips || fallbackData.interviewQuestions[index]?.tips || "",
        }))
      : fallbackData.interviewQuestions,
    cheatSheet: Array.isArray(value?.cheatSheet)
      ? value.cheatSheet.map((item: any, index: number) => ({
          term: item?.term || fallbackData.cheatSheet[index]?.term || "",
          definition: item?.definition || fallbackData.cheatSheet[index]?.definition || "",
        }))
      : fallbackData.cheatSheet,
  });

  return {
    english: normalizeLanguage(supplied.english, fallback.english),
    hinglish: normalizeLanguage(supplied.hinglish, fallback.hinglish),
  };
}

function getPracticeProblems(
  topic: string,
  tasks: string[] = [],
  apiProblems?: PracticeProblem[]
): PracticeProblem[] {
  if (Array.isArray(apiProblems) && apiProblems.length > 0) {
    return apiProblems;
  }

  const searchText = ` ${[topic, ...tasks].join(" ").toLowerCase()} `;

  const matchedSet = practiceProblemSets.find((set) =>
    set.keywords.some((keyword) =>
      searchText.includes(keyword.toLowerCase())
    )
  );

  return matchedSet?.problems || defaultPracticeProblems;
}

function getPlatformLinks(title: string) {
  return [
    {
      name: "LeetCode",
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:leetcode.com/problems "${title}"`)}`,
      color: "border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100",
      icon: "LC",
    },
    {
      name: "GeeksforGeeks",
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:geeksforgeeks.org/problems "${title}"`)}`,
      color: "border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100",
      icon: "GFG",
    },
    {
      name: "CodeChef",
      url: `https://www.google.com/search?q=${encodeURIComponent(`site:codechef.com "${title}" practice problem`)}`,
      color: "border-orange-200 bg-orange-50 text-orange-800 hover:bg-orange-100",
      icon: "CC",
    },
  ];
}

/* -------------------------------------------------------
   PRACTICE COMPONENTS
------------------------------------------------------- */

function PracticeProblemCard({
  problem,
  index,
}: {
  problem: PracticeProblem;
  index: number;
}) {
  const difficultyStyle =
    problem.difficulty === "Easy"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : problem.difficulty === "Medium"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : "bg-rose-50 text-rose-700 border-rose-200";

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm hover:border-blue-200 hover:shadow-md transition">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-700 text-xs font-extrabold border border-blue-100">
            {String(index + 1).padStart(2, "0")}
          </span>
          <div>
            <h5 className="text-sm font-bold text-slate-900">{problem.title}</h5>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              {problem.description}
            </p>
          </div>
        </div>
        <span className={`self-start rounded-full border px-2.5 py-1 text-[10px] font-bold ${difficultyStyle}`}>
          {problem.difficulty}
        </span>
      </div>

      <div className="mt-4 border-t border-slate-100 pt-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Practice on your preferred platform
        </p>
        <div className="flex flex-wrap gap-2">
          {getPlatformLinks(problem.title).map((platform) => (
            <a
              key={platform.name}
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-bold transition ${platform.color}`}
            >
              <span className="font-extrabold">{platform.icon}</span>
              {platform.name} ↗
            </a>
          ))}
        </div>
        {problem.url && (
          <a
            href={problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex text-[10px] font-semibold text-blue-600 hover:text-blue-800"
          >
            Open suggested original problem ↗
          </a>
        )}
      </div>
    </div>
  );
}

function PracticeProblemsSection({
  problems,
  topic,
}: {
  problems: PracticeProblem[];
  topic: string;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Coding Practice Problems</h4>
          <p className="mt-1 text-[11px] text-slate-500">
            Solve these problems to strengthen your understanding of {topic}.
          </p>
        </div>
        <span className="self-start rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[10px] font-bold text-blue-700">
          {problems.length} Problems
        </span>
      </div>

      <div className="grid gap-3">
        {problems.map((problem, index) => (
          <PracticeProblemCard
            key={problem.id || `${problem.title}-${index}`}
            problem={problem}
            index={index}
          />
        ))}
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3.5">
        <p className="text-[11px] leading-relaxed text-blue-800">
          <strong>Interview Tip:</strong> Try solving each problem yourself
          before checking hints or solutions. Analyse the time and space
          complexity of your approach.
        </p>
      </div>

      <p className="text-[10px] text-slate-400">
        Platform buttons open search results for the suggested problem.
        Availability may differ between platforms.
      </p>
    </div>
  );
}

/* -------------------------------------------------------
   EDITABLE NOTE FIELD
------------------------------------------------------- */

function EditableField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full resize-y rounded-lg border border-slate-200 bg-white p-3 text-xs leading-relaxed text-slate-700 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

/* -------------------------------------------------------
   MAIN PAGE
------------------------------------------------------- */

export default function PreparationPage() {
  const [role, setRole] = useState(roles[0]);
  const [duration, setDuration] = useState(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<PreparationPlan | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);

  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackInput, setFeedbackInput] = useState("");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [updateBannerVisible, setUpdateBannerVisible] = useState(true);

  const [day1ActiveTab, setDay1ActiveTab] = useState<DayTab>("notes");

  const [completedTaskIds, setCompletedTaskIds] = useState<string[]>([]);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  const [unlockedDays, setUnlockedDays] = useState<number[]>([1]);
  const [day1Completed, setDay1Completed] = useState(false);

  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailError, setEmailError] = useState("");

  // NEW: language and editable notes state
  const [notesLanguage, setNotesLanguage] = useState<NotesLanguage>("english");
  const [notesByLanguage, setNotesByLanguage] = useState<BilingualNotes | null>(null);
  const [notesSavedMessage, setNotesSavedMessage] = useState("");

  /* -------------------------------------------------------
     LOAD SAVED PLAN
  ------------------------------------------------------- */

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
          setCompletedTaskIds(parsed.completedTaskIds || []);
          setUnlockedDays(parsed.unlockedDays || [1]);
          setQuizAnswers(parsed.quizAnswers || {});
          setDay1Completed(Boolean(parsed.day1Completed));
          setQuizSubmitted(Boolean(parsed.quizSubmitted));

          setNotesLanguage(parsed.notesLanguage || "english");
          setNotesByLanguage(
            parsed.notesByLanguage || getPlanNotes(parsed.plan)
          );
        }
      }
    } catch (e) {
      console.warn("Could not parse saved plan:", e);
    }
  }, []);

  // Set notes whenever a new plan is generated or loaded.
  useEffect(() => {
    if (plan && !notesByLanguage) {
      setNotesByLanguage(getPlanNotes(plan));
    }
  }, [plan, notesByLanguage]);

  /* -------------------------------------------------------
     SAVE PLAN STATE
  ------------------------------------------------------- */

  function syncPlanState(
    updatedPlan: PreparationPlan,
    updatedPlanId: string | null,
    updatedTasks: string[],
    updatedUnlocked: number[],
    isDay1Done: boolean,
    answers: Record<string, number>,
    isQuizSubmitted = quizSubmitted
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
          quizSubmitted: isQuizSubmitted,
          notesLanguage,
          notesByLanguage,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.warn("Storage sync warning:", e);
    }
  }

  function saveNotesToStorage(
    updatedNotes: BilingualNotes,
    language = notesLanguage
  ) {
    if (!plan) return;

    try {
      const stored = localStorage.getItem("prepvoice_active_plan");
      const parsed = stored ? JSON.parse(stored) : {};

      localStorage.setItem(
        "prepvoice_active_plan",
        JSON.stringify({
          ...parsed,
          plan,
          planId,
          role,
          duration,
          completedTaskIds,
          unlockedDays,
          day1Completed,
          quizAnswers,
          quizSubmitted,
          notesLanguage: language,
          notesByLanguage: updatedNotes,
          updatedAt: new Date().toISOString(),
        })
      );

      setNotesSavedMessage("Your notes have been saved on this device.");

      window.setTimeout(() => {
        setNotesSavedMessage("");
      }, 2500);
    } catch (e) {
      console.warn("Could not save edited notes:", e);
      setNotesSavedMessage("Could not save notes. Please check browser storage.");
    }
  }

  function updateNotes(
    updater: (current: NotesData) => NotesData
  ) {
    if (!notesByLanguage) return;

    const updated: BilingualNotes = {
      ...notesByLanguage,
      [notesLanguage]: updater(notesByLanguage[notesLanguage]),
    };

    setNotesByLanguage(updated);
    saveNotesToStorage(updated);
  }

  function changeLanguage(language: NotesLanguage) {
    setNotesLanguage(language);

    if (notesByLanguage) {
      saveNotesToStorage(notesByLanguage, language);
    }
  }

  /* -------------------------------------------------------
     GENERATE / REGENERATE PLAN
  ------------------------------------------------------- */

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
        headers: {
          "Content-Type": "application/json",
        },
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

      const generatedPlan = data.plan as PreparationPlan;
      const generatedNotes = getPlanNotes(generatedPlan);

      setPlan(generatedPlan);
      setPlanId(data.planId);
      setNotesByLanguage(generatedNotes);
      setNotesLanguage("english");
      setUpdateBannerVisible(true);
      setShowFeedbackModal(false);

      if (customFeedback) {
        setFeedbackInput("");
      }

      const initialUnlocked = [1];

      setCompletedTaskIds([]);
      setQuizAnswers({});
      setQuizSubmitted(false);
      setUnlockedDays(initialUnlocked);
      setDay1Completed(false);
      setDay1ActiveTab("notes");

      try {
        localStorage.setItem(
          "prepvoice_active_plan",
          JSON.stringify({
            plan: generatedPlan,
            planId: data.planId,
            role,
            duration,
            completedTaskIds: [],
            unlockedDays: initialUnlocked,
            day1Completed: false,
            quizAnswers: {},
            quizSubmitted: false,
            notesLanguage: "english",
            notesByLanguage: generatedNotes,
            updatedAt: new Date().toISOString(),
          })
        );
      } catch (storageError) {
        console.warn("Could not save plan:", storageError);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
      setIsRegenerating(false);
    }
  }

  /* -------------------------------------------------------
     CHECKLIST
  ------------------------------------------------------- */

  function toggleTask(taskId: string) {
    const updated = completedTaskIds.includes(taskId)
      ? completedTaskIds.filter((id) => id !== taskId)
      : [...completedTaskIds, taskId];

    setCompletedTaskIds(updated);

    if (plan) {
      syncPlanState(
        plan,
        planId,
        updated,
        unlockedDays,
        day1Completed,
        quizAnswers
      );

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

  /* -------------------------------------------------------
     QUIZ
  ------------------------------------------------------- */

  function selectQuizAnswer(questionId: string, optionIndex: number) {
    const updated = {
      ...quizAnswers,
      [questionId]: optionIndex,
    };

    setQuizAnswers(updated);

    if (plan) {
      syncPlanState(
        plan,
        planId,
        completedTaskIds,
        unlockedDays,
        day1Completed,
        updated
      );
    }
  }

  function submitQuiz() {
    setQuizSubmitted(true);

    if (plan) {
      syncPlanState(
        plan,
        planId,
        completedTaskIds,
        unlockedDays,
        day1Completed,
        quizAnswers,
        true
      );
    }
  }

  /* -------------------------------------------------------
     UNLOCK DAYS
  ------------------------------------------------------- */

  function unlockNextDay(dayNumber: number) {
    const nextDay = dayNumber + 1;

    const updatedUnlocked = Array.from(
      new Set([...unlockedDays, nextDay])
    );

    setUnlockedDays(updatedUnlocked);

    if (plan) {
      syncPlanState(
        plan,
        planId,
        completedTaskIds,
        updatedUnlocked,
        dayNumber === 1 ? true : day1Completed,
        quizAnswers
      );

      if (planId) {
        void fetch("/api/preparation", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId,
            completedTasks: completedTaskIds,
            unlockedDays: updatedUnlocked,
            activeDay: nextDay,
          }),
        });
      }
    }

    if (dayNumber === 1) {
      setDay1Completed(true);
    }
  }

  function handleCompleteDay1() {
    unlockNextDay(1);
  }

  /* -------------------------------------------------------
     EMAIL
  ------------------------------------------------------- */

  async function handleSendEmail() {
    const recipient = emailInput.trim();

    if (!recipient) {
      setEmailError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(recipient)) {
      setEmailError("Please enter a valid email address.");
      return;
    }

    if (!plan) {
      setEmailError("Please generate a preparation plan first.");
      return;
    }

    setEmailSending(true);
    setEmailSent(false);
    setEmailError("");

    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: recipient,
          dayNumber: 1,
          topic:
            plan.detailedDay1?.topic ||
            plan.dailyPlan[0]?.topic ||
            "Core Foundations & Big-O",
          tasksCount: checklistItems.length || 4,
          checklist: checklistItems.map((item) => item.title),
          quizLink: "/preparation",
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Email could not be sent. Please try again.");
      }

      setEmailSent(true);

      window.setTimeout(() => {
        setEmailSent(false);
        setShowEmailModal(false);
      }, 3500);
    } catch (err) {
      console.error("Email sending error:", err);
      setEmailError(
        err instanceof Error
          ? err.message
          : "Something went wrong while sending the email."
      );
    } finally {
      setEmailSending(false);
    }
  }

  /* -------------------------------------------------------
     DERIVED DATA
  ------------------------------------------------------- */

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
    (question) => quizAnswers[question.id] === question.answer
  ).length;

  const day1Topic =
    plan?.detailedDay1?.topic ||
    plan?.dailyPlan?.[0]?.topic ||
    "Core Foundations";

  const day1Problems = getPracticeProblems(
    day1Topic,
    plan?.dailyPlan?.[0]?.tasks || [],
    (plan?.detailedDay1 as any)?.practiceProblems ||
      (plan?.dailyPlan?.[0] as any)?.practiceProblems
  );

  const activeNotes =
    notesByLanguage?.[notesLanguage] ||
    getPlanNotes(plan)[notesLanguage];

  /* -------------------------------------------------------
     PDF / PRINT
  ------------------------------------------------------- */

  function downloadNotesPDF() {
    // The browser print dialog allows the user to select "Save as PDF".
    window.print();
  }

  /* -------------------------------------------------------
     PAGE UI
  ------------------------------------------------------- */

  return (
    <div className="min-h-screen bg-slate-50/70 px-4 py-8 sm:px-8 lg:px-12">
      {/* PRINT STYLES */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 16mm;
          }

          body {
            background: white !important;
          }

          body * {
            visibility: hidden !important;
          }

          #printable-notes,
          #printable-notes * {
            visibility: visible !important;
          }

          #printable-notes {
            display: block !important;
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            color: #111827 !important;
            background: white !important;
          }

          #printable-notes textarea {
            display: none !important;
          }

          #printable-notes .print-value {
            display: block !important;
            white-space: pre-wrap !important;
          }

          #printable-notes pre {
            white-space: pre-wrap !important;
            overflow-wrap: anywhere !important;
          }

          #printable-notes .print-card {
            break-inside: avoid;
            border: 1px solid #d1d5db !important;
            padding: 12px !important;
            margin-bottom: 12px !important;
          }

          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
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
              Interactive day-by-day curriculum with editable study notes,
              coding practice, checklists, and concept mastery quizzes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/preparation/history"
              className="pro-btn-secondary text-xs flex items-center gap-1.5"
            >
              <span>◷</span>
              <span>Saved Plans</span>
            </Link>

            {plan && (
              <button
                type="button"
                onClick={() => {
                  setEmailError("");
                  setEmailSent(false);
                  setShowEmailModal(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50/80 px-4 py-2.5 text-xs font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
              >
                ✉ Email Today&apos;s Plan
              </button>
            )}
          </div>
        </header>

        {/* CONFIGURATION CARD */}
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
                  <option key={item} value={item}>{item}</option>
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
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button"
              onClick={() => generatePlan()}
              disabled={loading || isRegenerating}
              className="pro-btn-primary flex-1 text-xs font-bold py-3 flex items-center justify-center gap-2"
            >
              {loading ? "Generating Your Study Roadmap..." : "Generate Personalized Study Roadmap →"}
            </button>

            {plan && (
              <button
                type="button"
                onClick={() => setShowFeedbackModal(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-5 py-3 text-xs font-bold text-indigo-700 hover:bg-indigo-100 transition"
              >
                Regenerate with Feedback
              </button>
            )}
          </div>
        </section>

        {/* FEEDBACK MODAL */}
        {showFeedbackModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="pro-card max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Regenerate Plan with Custom Feedback
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tell us what you want to change in your study plan.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFeedbackModal(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
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
                  Your Specific Adjustments
                </label>
                <textarea
                  rows={3}
                  value={feedbackInput}
                  onChange={(e) => setFeedbackInput(e.target.value)}
                  placeholder="Tell us which topics you want to focus on..."
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
                  className="pro-btn-primary text-xs font-bold"
                >
                  {isRegenerating ? "Updating..." : "Apply Feedback & Regenerate"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* EMAIL MODAL */}
        {showEmailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="pro-card max-w-lg w-full p-6 sm:p-7 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Email Daily Study Digest &amp; Quiz
                  </h3>
                  <p className="text-xs text-slate-500">
                    Deliver today&apos;s checklist and quiz link to your inbox.
                  </p>
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
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setEmailError("");
                  }}
                  placeholder="Enter your email address"
                  className="pro-input text-xs"
                />
                {emailError && (
                  <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                    {emailError}
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
                <p className="text-xs font-bold text-slate-800">
                  🚀 Day 1 Study Digest: {day1Topic}
                </p>
                <p className="mt-1 text-[11px] text-slate-600">
                  Includes {checklistItems.length} action items and a quiz link.
                </p>
              </div>

              {emailSent && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 font-semibold">
                  ✓ Email request successfully accepted! Please check your inbox and spam folder.
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
                  className="pro-btn-primary text-xs font-bold"
                >
                  {emailSending ? "Sending..." : "Send Daily Email"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PLAN ROADMAP */}
        {plan && (
          <div className="mt-8 space-y-6 animate-fade-up">
            {/* UPDATED BANNER */}
            {plan.isUpdated && updateBannerVisible && (
              <div className="rounded-2xl border border-indigo-200 bg-indigo-50/80 p-5 relative">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="rounded-md bg-indigo-600 text-white px-2 py-0.5 text-[10px] font-extrabold uppercase">
                      Curriculum Updated
                    </span>
                    <p className="mt-2 text-xs font-semibold text-slate-800">
                      {plan.feedbackSummary
                        ? `Adapted based on your feedback: "${plan.feedbackSummary}"`
                        : "Your custom feedback has been incorporated into the daily schedule and Day 1 study notes."}
                    </p>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Your updated study syllabus is ready.
                    </p>
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

            {/* CURRICULUM OVERVIEW */}
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

              <div className="mt-5 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Milestone 1 Completion</span>
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

            {/* DAY 1 MODULE */}
            <div className="pro-card border-2 border-blue-300/80 shadow-md p-6 sm:p-8 space-y-6 relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-600 text-white font-extrabold text-xs">
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
                      {day1Topic}
                    </h3>
                  </div>
                </div>

                {/* DAY 1 TABS */}
                <div className="flex flex-wrap rounded-xl bg-slate-100 p-1 gap-1">
                  {([
                    ["notes", "📖 Notes"],
                    ["practice", "💻 Coding Practice"],
                    ["checklist", "✅ Checklist"],
                    ["quiz", "🧠 Quiz"],
                  ] as [DayTab, string][]).map(([tab, label]) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setDay1ActiveTab(tab)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                        day1ActiveTab === tab
                          ? "bg-white text-blue-700 shadow-2xs"
                          : "text-slate-600 hover:text-slate-900"
                      }`}
                    >
                      {label}
                      {tab === "checklist" && ` ${checklistCompletedCount}/${checklistItems.length}`}
                      {tab === "quiz" && quizSubmitted && ` ${quizScore}/${quizQuestions.length}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* NOTES TAB */}
              {day1ActiveTab === "notes" && plan.detailedDay1 && (
                <div className="space-y-6 animate-fade-in">
                  {/* LANGUAGE + ACTION BUTTONS */}
                  <div className="no-print rounded-2xl border border-blue-100 bg-blue-50/60 p-4 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          Your Personal Study Notes
                        </h4>
                        <p className="mt-1 text-[11px] text-slate-600">
                          Switch language, edit the notes, and save your own version.
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => changeLanguage("english")}
                          className={`rounded-lg px-3 py-2 text-xs font-bold border transition ${
                            notesLanguage === "english"
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          English
                        </button>
                        <button
                          type="button"
                          onClick={() => changeLanguage("hinglish")}
                          className={`rounded-lg px-3 py-2 text-xs font-bold border transition ${
                            notesLanguage === "hinglish"
                              ? "bg-blue-600 text-white border-blue-600"
                              : "bg-white text-slate-700 border-slate-200 hover:border-blue-300"
                          }`}
                        >
                          Hinglish
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={downloadNotesPDF}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition"
                      >
                        ↓ Download Notes as PDF
                      </button>
                      <button
                        type="button"
                        onClick={downloadNotesPDF}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        🖨 Print Notes
                      </button>
                    </div>

                    {notesSavedMessage && (
                      <p className="text-[11px] font-semibold text-emerald-700">
                        ✓ {notesSavedMessage}
                      </p>
                    )}
                  </div>

                  {/* EDITABLE NOTES */}
                  <div className="no-print space-y-5">
                    <EditableField
                      label="Overview"
                      value={activeNotes.overview}
                      rows={4}
                      onChange={(value) =>
                        updateNotes((current) => ({ ...current, overview: value }))
                      }
                    />

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Theoretical Framework &amp; Concepts
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            updateNotes((current) => ({
                              ...current,
                              coreTheory: [
                                ...current.coreTheory,
                                {
                                  title: "New Concept",
                                  explanation: "",
                                  keyPoints: [],
                                  example: "",
                                },
                              ],
                            }))
                          }
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
                        >
                          + Add Concept
                        </button>
                      </div>

                      {activeNotes.coreTheory.map((theory, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-200 bg-white p-4 space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-700">
                              CONCEPT {idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateNotes((current) => ({
                                  ...current,
                                  coreTheory: current.coreTheory.filter((_, i) => i !== idx),
                                }))
                              }
                              className="text-[10px] font-semibold text-rose-500 hover:text-rose-700"
                            >
                              Remove
                            </button>
                          </div>

                          <EditableField
                            label="Concept Title"
                            value={theory.title}
                            rows={1}
                            onChange={(value) =>
                              updateNotes((current) => ({
                                ...current,
                                coreTheory: current.coreTheory.map((item, i) =>
                                  i === idx ? { ...item, title: value } : item
                                ),
                              }))
                            }
                          />

                          <EditableField
                            label="Explanation"
                            value={theory.explanation}
                            rows={4}
                            onChange={(value) =>
                              updateNotes((current) => ({
                                ...current,
                                coreTheory: current.coreTheory.map((item, i) =>
                                  i === idx ? { ...item, explanation: value } : item
                                ),
                              }))
                            }
                          />

                          <EditableField
                            label="Key Points (one point per line)"
                            value={theory.keyPoints.join("\n")}
                            rows={3}
                            onChange={(value) =>
                              updateNotes((current) => ({
                                ...current,
                                coreTheory: current.coreTheory.map((item, i) =>
                                  i === idx
                                    ? { ...item, keyPoints: value.split("\n").filter(Boolean) }
                                    : item
                                ),
                              }))
                            }
                          />

                          <EditableField
                            label="Example"
                            value={theory.example}
                            rows={3}
                            onChange={(value) =>
                              updateNotes((current) => ({
                                ...current,
                                coreTheory: current.coreTheory.map((item, i) =>
                                  i === idx ? { ...item, example: value } : item
                                ),
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>

                    {/* CODE EDITOR */}
                    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Code Example
                      </h4>
                      <EditableField
                        label="Code Title"
                        value={activeNotes.codeSnippet.title}
                        rows={1}
                        onChange={(value) =>
                          updateNotes((current) => ({
                            ...current,
                            codeSnippet: { ...current.codeSnippet, title: value },
                          }))
                        }
                      />
                      <EditableField
                        label="Programming Language"
                        value={activeNotes.codeSnippet.language}
                        rows={1}
                        onChange={(value) =>
                          updateNotes((current) => ({
                            ...current,
                            codeSnippet: { ...current.codeSnippet, language: value },
                          }))
                        }
                      />
                      <EditableField
                        label="Code"
                        value={activeNotes.codeSnippet.code}
                        rows={9}
                        onChange={(value) =>
                          updateNotes((current) => ({
                            ...current,
                            codeSnippet: { ...current.codeSnippet, code: value },
                          }))
                        }
                      />
                      <EditableField
                        label="Code Explanation"
                        value={activeNotes.codeSnippet.explanation}
                        rows={3}
                        onChange={(value) =>
                          updateNotes((current) => ({
                            ...current,
                            codeSnippet: { ...current.codeSnippet, explanation: value },
                          }))
                        }
                      />
                    </div>

                    {/* INTERVIEW QUESTIONS */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Interview Questions
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            updateNotes((current) => ({
                              ...current,
                              interviewQuestions: [
                                ...current.interviewQuestions,
                                { question: "", modelAnswer: "", tips: "" },
                              ],
                            }))
                          }
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
                        >
                          + Add Question
                        </button>
                      </div>

                      {activeNotes.interviewQuestions.map((item, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-indigo-700">
                              QUESTION {idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateNotes((current) => ({
                                  ...current,
                                  interviewQuestions: current.interviewQuestions.filter((_, i) => i !== idx),
                                }))
                              }
                              className="text-[10px] font-semibold text-rose-500"
                            >
                              Remove
                            </button>
                          </div>
                          <EditableField
                            label="Question"
                            value={item.question}
                            rows={2}
                            onChange={(value) =>
                              updateNotes((current) => ({
                                ...current,
                                interviewQuestions: current.interviewQuestions.map((q, i) =>
                                  i === idx ? { ...q, question: value } : q
                                ),
                              }))
                            }
                          />
                          <EditableField
                            label="Model Answer"
                            value={item.modelAnswer}
                            rows={4}
                            onChange={(value) =>
                              updateNotes((current) => ({
                                ...current,
                                interviewQuestions: current.interviewQuestions.map((q, i) =>
                                  i === idx ? { ...q, modelAnswer: value } : q
                                ),
                              }))
                            }
                          />
                          <EditableField
                            label="Interview Tip"
                            value={item.tips}
                            rows={2}
                            onChange={(value) =>
                              updateNotes((current) => ({
                                ...current,
                                interviewQuestions: current.interviewQuestions.map((q, i) =>
                                  i === idx ? { ...q, tips: value } : q
                                ),
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>

                    {/* CHEAT SHEET */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                          Quick Reference Cheatsheet
                        </h4>
                        <button
                          type="button"
                          onClick={() =>
                            updateNotes((current) => ({
                              ...current,
                              cheatSheet: [
                                ...current.cheatSheet,
                                { term: "", definition: "" },
                              ],
                            }))
                          }
                          className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-[10px] font-bold text-blue-700 hover:bg-blue-100"
                        >
                          + Add Term
                        </button>
                      </div>

                      {activeNotes.cheatSheet.map((item, idx) => (
                        <div key={idx} className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-blue-700">
                              TERM {idx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                updateNotes((current) => ({
                                  ...current,
                                  cheatSheet: current.cheatSheet.filter((_, i) => i !== idx),
                                }))
                              }
                              className="text-[10px] font-semibold text-rose-500"
                            >
                              Remove
                            </button>
                          </div>
                          <EditableField
                            label="Term"
                            value={item.term}
                            rows={1}
                            onChange={(value) =>
                              updateNotes((current) => ({
                                ...current,
                                cheatSheet: current.cheatSheet.map((entry, i) =>
                                  i === idx ? { ...entry, term: value } : entry
                                ),
                              }))
                            }
                          />
                          <EditableField
                            label="Definition"
                            value={item.definition}
                            rows={2}
                            onChange={(value) =>
                              updateNotes((current) => ({
                                ...current,
                                cheatSheet: current.cheatSheet.map((entry, i) =>
                                  i === idx ? { ...entry, definition: value } : entry
                                ),
                              }))
                            }
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PRINTABLE NOTES VIEW */}
                  <div id="printable-notes" className="hidden">
                    <div className="mb-6 border-b-2 border-slate-800 pb-4">
                      <h1 className="text-2xl font-bold text-slate-900">
                        PrepVoice — Study Notes
                      </h1>
                      <h2 className="mt-2 text-lg font-bold text-slate-800">
                        {day1Topic}
                      </h2>
                      <p className="mt-1 text-xs text-slate-500">
                        {notesLanguage === "english" ? "English Version" : "Hinglish Version"}
                      </p>
                    </div>

                    <section className="print-card">
                      <h2 className="mb-2 text-base font-bold">Overview</h2>
                      <p className="print-value text-sm leading-relaxed">
                        {activeNotes.overview}
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h2 className="text-base font-bold">Concepts</h2>
                      {activeNotes.coreTheory.map((item, idx) => (
                        <div className="print-card" key={idx}>
                          <h3 className="mb-2 font-bold">{item.title}</h3>
                          <p className="print-value text-sm leading-relaxed">
                            {item.explanation}
                          </p>
                          {item.keyPoints.length > 0 && (
                            <ul className="mt-2 list-disc pl-5 text-sm">
                              {item.keyPoints.map((point, pIdx) => (
                                <li key={pIdx}>{point}</li>
                              ))}
                            </ul>
                          )}
                          <h4 className="mt-3 font-bold text-sm">Example</h4>
                          <p className="print-value text-sm">{item.example}</p>
                        </div>
                      ))}
                    </section>

                    <section className="print-card mt-4">
                      <h2 className="mb-2 text-base font-bold">
                        {activeNotes.codeSnippet.title}
                      </h2>
                      <p className="mb-2 text-xs">{activeNotes.codeSnippet.language}</p>
                      <pre className="text-xs">{activeNotes.codeSnippet.code}</pre>
                      <p className="print-value mt-3 text-sm">
                        {activeNotes.codeSnippet.explanation}
                      </p>
                    </section>

                    <section className="mt-4 space-y-3">
                      <h2 className="text-base font-bold">Interview Questions</h2>
                      {activeNotes.interviewQuestions.map((item, idx) => (
                        <div className="print-card" key={idx}>
                          <h3 className="font-bold text-sm">
                            Q{idx + 1}. {item.question}
                          </h3>
                          <p className="print-value mt-2 text-sm">
                            {item.modelAnswer}
                          </p>
                          <p className="print-value mt-2 text-xs">
                            Tip: {item.tips}
                          </p>
                        </div>
                      ))}
                    </section>

                    <section className="mt-4 space-y-3">
                      <h2 className="text-base font-bold">Quick Reference Cheatsheet</h2>
                      {activeNotes.cheatSheet.map((item, idx) => (
                        <div className="print-card" key={idx}>
                          <h3 className="font-bold text-sm">{item.term}</h3>
                          <p className="print-value mt-1 text-sm">{item.definition}</p>
                        </div>
                      ))}
                    </section>
                  </div>
                </div>
              )}

              {/* CODING PRACTICE TAB */}
              {day1ActiveTab === "practice" && (
                <div className="space-y-5 animate-fade-in">
                  <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4">
                    <h4 className="text-sm font-bold text-blue-900">
                      Day 1 Coding Challenge
                    </h4>
                    <p className="mt-1 text-xs text-blue-800 leading-relaxed">
                      Practice the following problems related to your Day 1
                      topic. Choose any platform and solve each problem.
                    </p>
                  </div>
                  <PracticeProblemsSection
                    problems={day1Problems}
                    topic={day1Topic}
                  />
                </div>
              )}

              {/* CHECKLIST TAB */}
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
                            onChange={() => toggleTask(item.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                          <div className="flex-1">
                            <p className={`text-xs font-semibold ${
                              isChecked ? "line-through text-slate-400" : "text-slate-800"
                            }`}>
                              {item.title}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400">
                              <span>⏱️ {item.timeEstimate}</span>
                              <span>•</span>
                              <span className={`font-semibold ${
                                item.difficulty === "Easy"
                                  ? "text-emerald-600"
                                  : item.difficulty === "Medium"
                                    ? "text-amber-600"
                                    : "text-rose-600"
                              }`}>
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

              {/* QUIZ TAB */}
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
                        Score: {quizScore} / {quizQuestions.length} (
                        {quizQuestions.length > 0
                          ? Math.round((quizScore / quizQuestions.length) * 100)
                          : 0}
                        %)
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
                            <p className="text-xs font-bold text-slate-900">{q.question}</p>
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
                                  onClick={() => !quizSubmitted && selectQuizAnswer(q.id, optIdx)}
                                  disabled={quizSubmitted}
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
                      onClick={submitQuiz}
                      disabled={
                        quizQuestions.length === 0 ||
                        Object.keys(quizAnswers).filter((key) =>
                          quizQuestions.some((q) => q.id === key)
                        ).length < quizQuestions.length
                      }
                      className="pro-btn-primary w-full text-xs font-bold py-2.5 disabled:opacity-50"
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

              {/* DAY 1 COMPLETION */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-slate-500">
                  {day1Completed ? (
                    <span className="text-emerald-600 font-bold">
                      ✓ Day 1 marked complete. Day 2 is now unlocked!
                    </span>
                  ) : (
                    <span>
                      Complete the checklist &amp; quiz to unlock Day 2 curriculum.
                    </span>
                  )}
                </div>

                {!day1Completed ? (
                  <button
                    type="button"
                    onClick={handleCompleteDay1}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 transition shadow-sm"
                  >
                    Mark Day 1 Completed &amp; Unlock Day 2 ✓
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-bold text-emerald-700">
                    ✓ Milestone 1 Mastered
                  </span>
                )}
              </div>
            </div>

            {/* SUBSEQUENT DAYS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Upcoming Roadmap Milestones ({Math.max(0, plan.dailyPlan.length - 1)} Remaining)
                </h3>
                <span className="text-[11px] text-slate-400">
                  Sequentially unlocked on daily milestone completion
                </span>
              </div>

              {plan.dailyPlan.slice(1).map((day: PreparationDay) => {
                const isUnlocked = unlockedDays.includes(day.day);
                const dayProblems = getPracticeProblems(
                  day.topic,
                  day.tasks || [],
                  (day as any).practiceProblems
                );

                return (
                  <div
                    key={day.day}
                    className={`pro-card p-5 transition relative overflow-hidden ${
                      isUnlocked
                        ? "border-blue-200 bg-white"
                        : "border-slate-200 bg-slate-50/60 opacity-85"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2 gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className={`rounded-md px-2.5 py-1 text-xs font-bold shrink-0 ${
                          isUnlocked
                            ? "bg-blue-50 border border-blue-200 text-blue-700"
                            : "bg-slate-200/70 text-slate-600"
                        }`}>
                          Day {day.day}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900">{day.topic}</h4>
                      </div>

                      {isUnlocked ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 shrink-0">
                          ✓ Unlocked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-2.5 py-0.5 text-[10px] font-bold text-amber-800 shrink-0">
                          🔒 Locked
                        </span>
                      )}
                    </div>

                    {isUnlocked ? (
                      <div className="mt-3 space-y-4">
                        <p className="text-xs text-slate-600">{day.goal}</p>

                        <div className="space-y-1 pl-1">
                          {day.tasks.map((task, tIdx) => (
                            <div key={tIdx} className="flex items-center gap-2 text-xs text-slate-600">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                              <span>{task}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                          <PracticeProblemsSection
                            problems={dayProblems}
                            topic={day.topic}
                          />
                        </div>

                        {day.day < plan.dailyPlan.length && (
                          <button
                            type="button"
                            onClick={() => unlockNextDay(day.day)}
                            className="inline-flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-[11px] font-bold text-blue-700 hover:bg-blue-100 transition"
                          >
                            Mark Day {day.day} Complete &amp; Unlock Next Day →
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="mt-2.5 rounded-xl border border-dashed border-slate-300 bg-white/70 p-3.5 flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500">🔒</span>
                          <span>
                            Complete the previous milestone to unlock Day {day.day}&apos;s study material and coding practice.
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
