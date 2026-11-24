
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export interface PracticeProblem {
  id: string;
  title: string;
  platform: string;
  difficulty: "Easy" | "Medium" | "Hard";
  url: string;
  description: string;
}

export interface BilingualNotes {
  english: {
    introduction: string;
    whyItMatters: string;
    howItWorks: string[];
    realLifeExample: string;
    codeExample: {
      language: string;
      code: string;
      explanation: string;
    };
    commonMistakes: string[];
    keyTakeaways: string[];
  };
  hinglish: {
    introduction: string;
    whyItMatters: string;
    howItWorks: string[];
    realLifeExample: string;
    codeExample: {
      language: string;
      code: string;
      explanation: string;
    };
    commonMistakes: string[];
    keyTakeaways: string[];
  };
}

export interface PreparationDay {
  day: number;
  topic: string;
  tasks: string[];
  goal: string;
  practiceProblems: PracticeProblem[];
  isUnlocked?: boolean;
}

export interface DetailedDayStudy {
  topic: string;
  overview: string;
  bilingualNotes: BilingualNotes;
  coreTheory: {
    title: string;
    explanation: string;
    keyPoints: string[];
  }[];
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
  practiceProblems: PracticeProblem[];
  checklist: {
    id: string;
    title: string;
    timeEstimate: string;
    difficulty: "Easy" | "Medium" | "Hard";
    completed: boolean;
  }[];
  quiz: {
    id: string;
    question: string;
    options: string[];
    answer: number;
    explanation: string;
  }[];
  cheatSheet: {
    term: string;
    definition: string;
  }[];
}

export interface PreparationPlan {
  overview: string;
  dailyPlan: PreparationDay[];
  detailedDay1: DetailedDayStudy;
  isUpdated?: boolean;
  feedbackSummary?: string;
  unlockedDays?: number[];
}

// --------------------------------------------------
// BILINGUAL NOTES FALLBACK GENERATOR
// --------------------------------------------------

function createFallbackBilingualNotes(
  topic: string,
  role: string
): BilingualNotes {
  const safeTopic = topic || "Programming Fundamentals";
  const safeRole = role || "Software Development";

  return {
    english: {
      introduction: `${safeTopic} is an important concept for anyone preparing for ${safeRole}. It helps you understand how software works, how to solve problems efficiently, and how to write better code. Start by understanding the basic idea before moving to advanced concepts.`,

      whyItMatters: `Understanding ${safeTopic} helps you write efficient programs, solve technical interview questions, and make better development decisions. It is useful in real-world software projects as well as technical interviews.`,

      howItWorks: [
        `First, understand the basic definition and purpose of ${safeTopic}.`,
        "Break the concept into smaller parts so that each part is easier to understand.",
        "Study a simple example and observe how the concept works step by step.",
        "Implement the concept using code and test it with different inputs.",
        "Analyze the time complexity, space complexity, and possible edge cases."
      ],

      realLifeExample: `Imagine you are learning ${safeTopic} for the first time. Instead of trying to understand everything at once, divide it into smaller steps. This is similar to learning a new skill by practising one small task at a time. The same approach helps you understand technical concepts more easily.`,

      codeExample: {
        language: "python",
        code: `# A simple programming example

numbers = [10, 20, 30, 40, 50]

for number in numbers:
    print(number)`,
        explanation: "This example creates a list of numbers and uses a loop to access each element. It demonstrates how a basic programming concept can be implemented and tested."
      },

      commonMistakes: [
        "Memorizing definitions without understanding the concept.",
        "Skipping practical coding examples.",
        "Ignoring edge cases while solving problems.",
        "Not analysing time and space complexity."
      ],

      keyTakeaways: [
        `${safeTopic} is an important part of your learning journey.`,
        "Understand the concept before memorizing its definition.",
        "Practise coding examples regularly.",
        "Always test your solution with different inputs.",
        "Review important concepts before interviews."
      ]
    },

    hinglish: {
      introduction: `${safeTopic} ek important concept hai jo ${safeRole} ki preparation mein kaafi useful hota hai. Isse hume samajh aata hai ki code kaise kaam karta hai aur problems ko efficiently kaise solve karna hai. Pehle iska basic idea samjho, phir advanced concepts ki taraf jao.`,

      whyItMatters: `${safeTopic} samajhna isliye zaroori hai kyunki isse hum better code likh paate hain, coding questions solve kar paate hain aur real projects mein sahi technical decisions le paate hain. Interviews mein bhi ye concepts kaafi kaam aate hain.`,

      howItWorks: [
        `Sabse pehle ${safeTopic} ka basic meaning aur purpose samjho.`,
        "Poore concept ko chhote-chhote parts mein divide kar lo, taaki samajhna easy ho.",
        "Ek simple example dekho aur observe karo ki step by step kya ho raha hai.",
        "Ab khud code likho aur different inputs ke saath test karo.",
        "Finally check karo ki code kitna time aur memory use kar raha hai."
      ],

      realLifeExample: `Imagine karo tum ${safeTopic} pehli baar padh rahe ho. Ek saath sab kuch samajhne ki jagah topic ko chhote steps mein divide kar lo. Bilkul waise hi jaise koi nayi skill seekhte waqt pehle ek simple task practice karte hain. Is approach se difficult technical topics bhi easy lagne lagte hain.`,

      codeExample: {
        language: "python",
        code: `# Ek simple programming example

numbers = [10, 20, 30, 40, 50]

for number in numbers:
    print(number)`,
        explanation: "Yahan humne numbers ki ek list banayi hai. For loop ki help se ek-ek number access karke print kar rahe hain. Matlab loop list ke har element par chalega."
      },

      commonMistakes: [
        "Sirf definition rat lena, concept actually samajhna nahi.",
        "Code examples ki practice skip kar dena.",
        "Problem solve karte time edge cases ignore karna.",
        "Time aur space complexity check nahi karna."
      ],

      keyTakeaways: [
        `${safeTopic} tumhari learning ka important part hai.`,
        "Definition ratne se pehle concept samajhna zaroori hai.",
        "Regularly coding examples practice karo.",
        "Different inputs ke saath apna code test karo.",
        "Interview se pehle important concepts revise karna."
      ]
    }
  };
}

// Safely normalize AI-generated bilingual notes.
function normalizeBilingualNotes(
  notes: any,
  topic: string,
  role: string
): BilingualNotes {
  const fallback = createFallbackBilingualNotes(topic, role);

  const normalizeLanguage = (
    language: any,
    fallbackLanguage: BilingualNotes["english"]
  ): BilingualNotes["english"] => {
    if (!language || typeof language !== "object") {
      return fallbackLanguage;
    }

    return {
      introduction:
        typeof language.introduction === "string"
          ? language.introduction
          : fallbackLanguage.introduction,

      whyItMatters:
        typeof language.whyItMatters === "string"
          ? language.whyItMatters
          : fallbackLanguage.whyItMatters,

      howItWorks:
        Array.isArray(language.howItWorks) &&
        language.howItWorks.length > 0
          ? language.howItWorks.filter(
              (item: unknown) => typeof item === "string"
            )
          : fallbackLanguage.howItWorks,

      realLifeExample:
        typeof language.realLifeExample === "string"
          ? language.realLifeExample
          : fallbackLanguage.realLifeExample,

      codeExample: {
        language:
          typeof language.codeExample?.language === "string"
            ? language.codeExample.language
            : fallbackLanguage.codeExample.language,

        code:
          typeof language.codeExample?.code === "string"
            ? language.codeExample.code
            : fallbackLanguage.codeExample.code,

        explanation:
          typeof language.codeExample?.explanation === "string"
            ? language.codeExample.explanation
            : fallbackLanguage.codeExample.explanation
      },

      commonMistakes:
        Array.isArray(language.commonMistakes) &&
        language.commonMistakes.length > 0
          ? language.commonMistakes.filter(
              (item: unknown) => typeof item === "string"
            )
          : fallbackLanguage.commonMistakes,

      keyTakeaways:
        Array.isArray(language.keyTakeaways) &&
        language.keyTakeaways.length > 0
          ? language.keyTakeaways.filter(
              (item: unknown) => typeof item === "string"
            )
          : fallbackLanguage.keyTakeaways
    };
  };

  return {
    english: normalizeLanguage(notes?.english, fallback.english),
    hinglish: normalizeLanguage(notes?.hinglish, fallback.hinglish)
  };
}

// --------------------------------------------------
// PRACTICE PROBLEMS
// --------------------------------------------------

const ALLOWED_PLATFORM_HOSTS = [
  "leetcode.com",
  "www.leetcode.com",
  "geeksforgeeks.org",
  "www.geeksforgeeks.org",
  "hackerrank.com",
  "www.hackerrank.com",
  "codechef.com",
  "www.codechef.com",
  "codingninjas.com",
  "www.codingninjas.com"
];

function isValidPracticeUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);

    return (
      url.protocol === "https:" &&
      ALLOWED_PLATFORM_HOSTS.includes(url.hostname)
    );
  } catch {
    return false;
  }
}

function normalizePracticeProblems(
  problems: unknown,
  fallback: PracticeProblem[]
): PracticeProblem[] {
  if (!Array.isArray(problems)) return fallback;

  const normalized = problems
    .map((item: any, index: number) => {
      if (
        !item ||
        typeof item.title !== "string" ||
        typeof item.url !== "string" ||
        !isValidPracticeUrl(item.url)
      ) {
        return null;
      }

      const url = new URL(item.url);

      const platform = url.hostname.includes("leetcode")
        ? "LeetCode"
        : url.hostname.includes("geeksforgeeks")
        ? "GeeksforGeeks"
        : url.hostname.includes("hackerrank")
        ? "HackerRank"
        : url.hostname.includes("codechef")
        ? "CodeChef"
        : "Coding Ninjas";

      const difficulty = ["Easy", "Medium", "Hard"].includes(
        item.difficulty
      )
        ? item.difficulty
        : "Medium";

      return {
        id: `problem-${index + 1}`,
        title: item.title.trim(),
        platform,
        difficulty,
        url: item.url,
        description:
          typeof item.description === "string"
            ? item.description
            : "Practice this problem to strengthen your problem-solving skills."
      } as PracticeProblem;
    })
    .filter(Boolean) as PracticeProblem[];

  return normalized.length > 0 ? normalized : fallback;
}

const PRACTICE_PROBLEM_BANK: PracticeProblem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    platform: "LeetCode",
    difficulty: "Easy",
    url: "https://leetcode.com/problems/two-sum/",
    description: "Practice arrays, hash maps, and efficient lookups."
  },
  {
    id: "valid-parentheses",
    title: "Valid Parentheses",
    platform: "LeetCode",
    difficulty: "Easy",
    url: "https://leetcode.com/problems/valid-parentheses/",
    description: "Practice stack operations and string validation."
  },
  {
    id: "longest-substring",
    title: "Longest Substring Without Repeating Characters",
    platform: "LeetCode",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/longest-substring-without-repeating-characters/",
    description: "Practice sliding window and hash map techniques."
  },
  {
    id: "reverse-linked-list",
    title: "Reverse Linked List",
    platform: "LeetCode",
    difficulty: "Easy",
    url: "https://leetcode.com/problems/reverse-linked-list/",
    description: "Practice linked list traversal and pointer manipulation."
  },
  {
    id: "binary-tree-inorder",
    title: "Binary Tree Inorder Traversal",
    platform: "LeetCode",
    difficulty: "Easy",
    url: "https://leetcode.com/problems/binary-tree-inorder-traversal/",
    description: "Practice tree traversal using recursion and iteration."
  },
  {
    id: "number-of-islands",
    title: "Number of Islands",
    platform: "LeetCode",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/number-of-islands/",
    description: "Practice graph traversal using DFS and BFS."
  },
  {
    id: "course-schedule",
    title: "Course Schedule",
    platform: "LeetCode",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/course-schedule/",
    description: "Practice graph algorithms and cycle detection."
  },
  {
    id: "maximum-subarray",
    title: "Maximum Subarray",
    platform: "LeetCode",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/maximum-subarray/",
    description: "Practice dynamic programming and Kadane's algorithm."
  },
  {
    id: "climbing-stairs",
    title: "Climbing Stairs",
    platform: "LeetCode",
    difficulty: "Easy",
    url: "https://leetcode.com/problems/climbing-stairs/",
    description: "Practice dynamic programming and recurrence relations."
  },
  {
    id: "merge-intervals",
    title: "Merge Intervals",
    platform: "LeetCode",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/merge-intervals/",
    description: "Practice sorting and interval-based problem solving."
  },
  {
    id: "group-anagrams",
    title: "Group Anagrams",
    platform: "LeetCode",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/group-anagrams/",
    description: "Practice strings, hashing, and grouping techniques."
  },
  {
    id: "search-rotated-array",
    title: "Search in Rotated Sorted Array",
    platform: "LeetCode",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/search-in-rotated-sorted-array/",
    description: "Practice binary search and array manipulation."
  },
  {
    id: "product-except-self",
    title: "Product of Array Except Self",
    platform: "LeetCode",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/product-of-array-except-self/",
    description: "Practice prefix and suffix products."
  },
  {
    id: "top-k-frequent",
    title: "Top K Frequent Elements",
    platform: "LeetCode",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/top-k-frequent-elements/",
    description: "Practice hash maps, heaps, and frequency counting."
  },
  {
    id: "house-robber",
    title: "House Robber",
    platform: "LeetCode",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/house-robber/",
    description: "Practice dynamic programming and optimization."
  },
  {
    id: "word-break",
    title: "Word Break",
    platform: "LeetCode",
    difficulty: "Medium",
    url: "https://leetcode.com/problems/word-break/",
    description: "Practice dynamic programming and string segmentation."
  }
];

function getFallbackPracticeProblems(
  day: number,
  role: string,
  topic: string
): PracticeProblem[] {
  const normalizedTopic = topic.toLowerCase();

  let selected: PracticeProblem[];

  if (
    normalizedTopic.includes("tree") ||
    normalizedTopic.includes("recursion") ||
    normalizedTopic.includes("backtracking")
  ) {
    selected = [
      PRACTICE_PROBLEM_BANK[4],
      PRACTICE_PROBLEM_BANK[5]
    ];
  } else if (
    normalizedTopic.includes("graph") ||
    normalizedTopic.includes("dijkstra") ||
    normalizedTopic.includes("topological")
  ) {
    selected = [
      PRACTICE_PROBLEM_BANK[5],
      PRACTICE_PROBLEM_BANK[6]
    ];
  } else if (
    normalizedTopic.includes("dynamic programming") ||
    normalizedTopic.includes("dp")
  ) {
    selected = [
      PRACTICE_PROBLEM_BANK[8],
      PRACTICE_PROBLEM_BANK[14]
    ];
  } else if (
    normalizedTopic.includes("linked list") ||
    normalizedTopic.includes("stack") ||
    normalizedTopic.includes("queue")
  ) {
    selected = [
      PRACTICE_PROBLEM_BANK[1],
      PRACTICE_PROBLEM_BANK[3]
    ];
  } else if (
    normalizedTopic.includes("binary search") ||
    normalizedTopic.includes("search")
  ) {
    selected = [
      PRACTICE_PROBLEM_BANK[11],
      PRACTICE_PROBLEM_BANK[0]
    ];
  } else if (
    normalizedTopic.includes("sliding window") ||
    normalizedTopic.includes("two-pointer") ||
    normalizedTopic.includes("array") ||
    normalizedTopic.includes("complexity")
  ) {
    selected = [
      PRACTICE_PROBLEM_BANK[0],
      PRACTICE_PROBLEM_BANK[2]
    ];
  } else if (
    normalizedTopic.includes("interval") ||
    normalizedTopic.includes("sorting")
  ) {
    selected = [
      PRACTICE_PROBLEM_BANK[9],
      PRACTICE_PROBLEM_BANK[11]
    ];
  } else if (
    normalizedTopic.includes("hash") ||
    normalizedTopic.includes("string")
  ) {
    selected = [
      PRACTICE_PROBLEM_BANK[10],
      PRACTICE_PROBLEM_BANK[13]
    ];
  } else {
    const start = ((day - 1) * 2) % PRACTICE_PROBLEM_BANK.length;

    selected = [
      PRACTICE_PROBLEM_BANK[start],
      PRACTICE_PROBLEM_BANK[
        (start + 1) % PRACTICE_PROBLEM_BANK.length
      ]
    ];
  }

  return selected.map((problem, index) => ({
    ...problem,
    id: `day-${day}-problem-${index + 1}`
  }));
}

// --------------------------------------------------
// POST: GENERATE PREPARATION PLAN
// --------------------------------------------------

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    const body = await req.json();

    const {
      targetRole,
      durationDays,
      feedback,
      regenerate,
      planId
    } = body;

    const allowedDurations = [7, 15, 30, 60];

    if (
      typeof targetRole !== "string" ||
      targetRole.trim().length < 3 ||
      targetRole.length > 100
    ) {
      return NextResponse.json(
        { error: "Please select a valid target role." },
        { status: 400 }
      );
    }

    const duration = Number(durationDays);

    if (!allowedDurations.includes(duration)) {
      return NextResponse.json(
        { error: "Please select a valid preparation duration." },
        { status: 400 }
      );
    }

    const apiKey = process.env.GEMINI_API_KEY;

    let plan: PreparationPlan | null = null;

    if (apiKey) {
      try {
        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: {
            responseMimeType: "application/json"
          }
        });

        const feedbackClause = feedback
          ? `
USER SPECIFIC FEEDBACK & CUSTOM REQUESTS:
"${feedback.trim()}"

Actively tailor the curriculum, tasks, practice questions,
and Day 1 study notes to address this feedback directly.
`
          : "";

        const prompt = `
You are a Staff Technical Interview Coach, Beginner-Friendly
Programming Teacher, and Curriculum Architect.

Generate a personalized interview preparation roadmap.

TARGET ROLE: ${targetRole.trim()}
DURATION: ${duration} days

${feedbackClause}

IMPORTANT TEACHING STYLE:

The student may be a complete beginner.

Write explanations in very easy, informal, friendly language.
Avoid unnecessarily complicated academic wording.
Explain difficult technical terms using simple examples.
Teach concepts step by step, as if explaining to a beginner.

BILINGUAL NOTES REQUIREMENTS:

Generate TWO complete versions of Day 1 detailed notes:

1. English:
   - Very easy and conversational English.
   - Short, clear sentences.
   - Explain technical terms in simple words.

2. Hinglish:
   - Natural Roman Hindi mixed with English.
   - Friendly, informal teaching style.
   - Use phrases like "Simple words mein samjho",
     "Imagine karo", and "Iska matlab hai".
   - Do not use Devanagari Hindi.
   - Do not simply translate English word by word.
   - Explain the concept naturally so a beginner understands it.

Both versions must explain the SAME concepts accurately.

Each language must contain:

- introduction
- whyItMatters
- howItWorks (at least 4 clear steps)
- realLifeExample (a relatable everyday example)
- codeExample (language, code, explanation)
- commonMistakes (at least 3)
- keyTakeaways (at least 4)

The real-life example must be relevant to the selected topic.
The code example must demonstrate the actual topic.
Do not use unrelated generic examples.
Explain the code in simple language.

ROADMAP REQUIREMENTS:

1. Generate exactly ${duration} dailyPlan entries.
2. Days must be numbered from 1 to ${duration}.
3. Every day must have a topic, 2-3 practical tasks,
   a goal, and 2-3 relevant practice problems.
4. Practice problems must match that day's topic.
5. Prefer real questions from LeetCode, GeeksforGeeks,
   HackerRank, CodeChef, or Coding Ninjas.
6. Use exact canonical problem URLs.
7. Never invent a problem URL.
8. Every practice problem must contain title, platform,
   difficulty, url, and description.
9. Day 1 detailedDay1 must contain practiceProblems.
10. Provide detailed Day 1 theory, checklist, code snippet,
    interview questions, and a 4-question technical quiz.
11. Every quiz question must have exactly 4 options.
12. Quiz answer must be a zero-based integer index.

Return ONLY valid JSON.

JSON SCHEMA:

{
  "overview": "Curriculum overview",
  "dailyPlan": [
    {
      "day": 1,
      "topic": "Core Foundations",
      "tasks": ["Task 1", "Task 2", "Task 3"],
      "goal": "Master the foundations",
      "practiceProblems": [
        {
          "title": "Two Sum",
          "platform": "LeetCode",
          "difficulty": "Easy",
          "url": "https://leetcode.com/problems/two-sum/",
          "description": "Practice arrays and hash maps."
        }
      ]
    }
  ],
  "detailedDay1": {
    "topic": "Core Foundations",
    "overview": "Detailed Day 1 overview",
    "bilingualNotes": {
      "english": {
        "introduction": "Easy English explanation",
        "whyItMatters": "Why this topic matters",
        "howItWorks": [
          "Step 1",
          "Step 2",
          "Step 3",
          "Step 4"
        ],
        "realLifeExample": "Relatable example",
        "codeExample": {
          "language": "python",
          "code": "print('Hello World')",
          "explanation": "Explain the code simply"
        },
        "commonMistakes": [
          "Mistake 1",
          "Mistake 2",
          "Mistake 3"
        ],
        "keyTakeaways": [
          "Takeaway 1",
          "Takeaway 2",
          "Takeaway 3",
          "Takeaway 4"
        ]
      },
      "hinglish": {
        "introduction": "Easy Hinglish explanation in Roman Hindi",
        "whyItMatters": "Explain why it matters in Hinglish",
        "howItWorks": [
          "Step 1 in Hinglish",
          "Step 2 in Hinglish",
          "Step 3 in Hinglish",
          "Step 4 in Hinglish"
        ],
        "realLifeExample": "Relatable Hinglish example",
        "codeExample": {
          "language": "python",
          "code": "print('Hello World')",
          "explanation": "Explain code in Hinglish"
        },
        "commonMistakes": [
          "Mistake 1 in Hinglish",
          "Mistake 2 in Hinglish",
          "Mistake 3 in Hinglish"
        ],
        "keyTakeaways": [
          "Takeaway 1 in Hinglish",
          "Takeaway 2 in Hinglish",
          "Takeaway 3 in Hinglish",
          "Takeaway 4 in Hinglish"
        ]
      }
    },
    "coreTheory": [
      {
        "title": "Concept title",
        "explanation": "Detailed explanation",
        "keyPoints": ["Point 1", "Point 2"]
      }
    ],
    "codeSnippet": {
      "title": "Code example",
      "language": "python",
      "code": "print('Hello World')",
      "explanation": "Code explanation"
    },
    "interviewQuestions": [
      {
        "question": "Interview question",
        "modelAnswer": "Detailed answer",
        "tips": "Interview tip"
      }
    ],
    "practiceProblems": [
      {
        "title": "Two Sum",
        "platform": "LeetCode",
        "difficulty": "Easy",
        "url": "https://leetcode.com/problems/two-sum/",
        "description": "Practice arrays and hash maps."
      }
    ],
    "checklist": [
      {
        "id": "1-1",
        "title": "Complete the topic",
        "timeEstimate": "30 mins",
        "difficulty": "Easy",
        "completed": false
      }
    ],
    "quiz": [
      {
        "id": "q1",
        "question": "Question",
        "options": ["A", "B", "C", "D"],
        "answer": 0,
        "explanation": "Explanation"
      }
    ],
    "cheatSheet": [
      {
        "term": "Big-O",
        "definition": "Complexity measurement"
      }
    ]
  }
}

FINAL RULES:

- Return exactly ${duration} dailyPlan entries.
- Never omit bilingualNotes from detailedDay1.
- Both languages must be complete.
- Hinglish must use Roman Hindi.
- Keep examples and code relevant to the selected topic.
- Do not omit practiceProblems from any day.
- Return valid JSON only.
`;

        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(result.response.text());

        if (
          parsed.overview &&
          Array.isArray(parsed.dailyPlan) &&
          parsed.dailyPlan.length === duration &&
          parsed.detailedDay1
        ) {
          const dailyPlan: PreparationDay[] = parsed.dailyPlan.map(
            (day: any, index: number) => {
              const dayNumber = index + 1;

              const fallbackProblems = getFallbackPracticeProblems(
                dayNumber,
                targetRole,
                day.topic || ""
              );

              return {
                ...day,
                day: dayNumber,
                tasks: Array.isArray(day.tasks) ? day.tasks : [],
                practiceProblems: normalizePracticeProblems(
                  day.practiceProblems,
                  fallbackProblems
                ),
                isUnlocked: dayNumber === 1
              };
            }
          );

          const detailedFallback = getFallbackPracticeProblems(
            1,
            targetRole,
            parsed.detailedDay1.topic || dailyPlan[0].topic
          );

          const detailedTopic =
            parsed.detailedDay1.topic || dailyPlan[0].topic;

          const detailedDay1: DetailedDayStudy = {
            ...parsed.detailedDay1,

            bilingualNotes: normalizeBilingualNotes(
              parsed.detailedDay1.bilingualNotes,
              detailedTopic,
              targetRole
            ),

            practiceProblems: normalizePracticeProblems(
              parsed.detailedDay1.practiceProblems,
              detailedFallback
            )
          };

          plan = {
            ...parsed,
            dailyPlan,
            detailedDay1,
            isUpdated: Boolean(feedback),
            feedbackSummary: feedback ? feedback.trim() : undefined,
            unlockedDays: [1]
          };
        }
      } catch (err) {
        console.warn(
          "Gemini generation failed, falling back to blueprint generator:",
          err
        );
      }
    }

    if (!plan) {
      plan = generateDeterministicPlan(
        targetRole,
        duration,
        feedback
      );
    }

    // Save to Supabase if user is authenticated.
    let savedId = planId || `plan_${Date.now()}`;

    if (user) {
      try {
        if (regenerate && planId) {
          await supabase
            .from("interview_preparation_plans")
            .update({
              target_role: targetRole.trim(),
              duration_days: duration,
              plan: plan
            })
            .eq("id", planId)
            .eq("user_id", user.id);
        } else {
          const { data: inserted, error: insertError } =
            await supabase
              .from("interview_preparation_plans")
              .insert({
                user_id: user.id,
                target_role: targetRole.trim(),
                duration_days: duration,
                plan: plan,
                completed_tasks: []
              })
              .select("id")
              .single();

          if (!insertError && inserted?.id) {
            savedId = inserted.id;
          }
        }
      } catch (dbErr) {
        console.warn("DB save warning:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      planId: savedId,
      plan,
      isUpdated: Boolean(feedback),
      feedbackSummary: feedback ? feedback.trim() : null
    });
  } catch (error) {
    console.error("Preparation plan API error:", error);

    return NextResponse.json(
      {
        error:
          "Could not generate preparation roadmap. Please try again."
      },
      { status: 500 }
    );
  }
}

// --------------------------------------------------
// PATCH: SAVE PREPARATION PROGRESS
// --------------------------------------------------

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user }
    } = await supabase.auth.getUser();

    const body = await req.json();

    const {
      planId,
      completedTasks,
      unlockedDays,
      activeDay
    } = body;

    if (user && planId && !planId.startsWith("plan_")) {
      await supabase
        .from("interview_preparation_plans")
        .update({
          completed_tasks: completedTasks || []
        })
        .eq("id", planId)
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      success: true,
      message: "Progress updated successfully.",
      completedTasks,
      unlockedDays,
      activeDay
    });
  } catch (err) {
    console.error("Patch preparation error:", err);

    return NextResponse.json(
      { error: "Failed to save progress." },
      { status: 500 }
    );
  }
}

// --------------------------------------------------
// DETERMINISTIC FALLBACK CURRICULUM
// --------------------------------------------------

function generateDeterministicPlan(
  role: string,
  duration: number,
  feedback?: string
): PreparationPlan {
  const normalizedRole = role.toLowerCase();

  const isFrontend = normalizedRole.includes("frontend");
  const isBackend = normalizedRole.includes("backend");
  const isAI =
    normalizedRole.includes("ai") ||
    normalizedRole.includes("data");

  const day1Topic = isFrontend
    ? "DOM Performance, Virtual DOM & Event Loop Internals"
    : isBackend
    ? "RESTful API Design, Microservices & Database Indexing"
    : isAI
    ? "Machine Learning Foundations, Feature Engineering & Linear Models"
    : "Algorithm Complexity, Two-Pointer Patterns & Memory Layouts";

  const dailyPlan: PreparationDay[] = Array.from(
    { length: duration },
    (_, i) => {
      const day = i + 1;

      let topic = `Core Engineering Module ${day}`;
      let goal = "Deepen technical execution and interview readiness.";

      if (day === 1) {
        topic = day1Topic;
        goal =
          "Master theoretical foundations, complexity tradeoffs, and code patterns.";
      } else if (day === 2) {
        topic = isFrontend
          ? "State Architecture, React Hooks & Custom State Primitives"
          : isBackend
          ? "PostgreSQL Query Optimization, ACID Transactions & Connection Pools"
          : "Dynamic Arrays, Hash Maps & Amortized Complexity Analysis";

        goal = "Build robust data flow and understand core concepts.";
      } else if (day === 3) {
        topic =
          "Linked Lists, Stacks, Queues & Monotonic Pattern Drills";

        goal =
          "Solve standard interview problem variants with confidence.";
      } else if (day === 4) {
        topic =
          "Recursion, Backtracking & Tree Traversals (DFS/BFS)";

        goal = "Master tree navigation and recursive state passing.";
      } else if (day === 5) {
        topic =
          "Graph Algorithms: Topological Sort, Dijkstra & Cycle Detection";

        goal =
          "Understand graph algorithms and dependency resolution.";
      } else if (day === 6) {
        topic =
          "System Design & Distributed Scalability Principles";

        goal =
          "Understand caching, load balancing, and scalable architecture.";
      } else if (day === 7) {
        topic =
          "Full Mock Interview Simulation, STAR Story Framing & Live Review";

        goal =
          "Evaluate technical and behavioral interview readiness.";
      } else {
        topic =
          `Sprint Milestone ${day}: Advanced Problem Solving & Code Review`;

        goal =
          "Solidify domain mastery and complete timed problem sets.";
      }

      return {
        day,
        topic,
        tasks: [
          `Study key theoretical principles for ${topic.split(":")[0]}`,
          "Implement practical patterns and understand edge cases",
          "Practice coding problems and explain your approach aloud"
        ],
        goal,
        practiceProblems: getFallbackPracticeProblems(
          day,
          role,
          topic
        ),
        isUnlocked: day === 1
      };
    }
  );

  const bilingualNotes = createFallbackBilingualNotes(
    day1Topic,
    role
  );

  return {
    overview: feedback
      ? `Customized curriculum adapted based on your feedback: "${feedback}". Structured with milestone-locked progression to support deep mastery.`
      : `Comprehensive, structured ${duration}-day roadmap for ${role}. Every day includes relevant coding practice problems with platform links.`,

    isUpdated: Boolean(feedback),
    feedbackSummary: feedback ? feedback.trim() : undefined,
    unlockedDays: [1],
    dailyPlan,

    detailedDay1: {
      topic: day1Topic,

      overview: `Day 1 curriculum designed for ${role}. Study the core concepts, review the code pattern, complete your action items, practice the linked problems, and pass the quiz to unlock Day 2.`,

      bilingualNotes,

      coreTheory: [
        {
          title: "Asymptotic Analysis & Big-O Foundations",
          explanation:
            "Technical interviews evaluate how deeply you understand runtime and memory growth as input size increases.",
          keyPoints: [
            "O(1) Constant: Hash table lookups (average), array indexing",
            "O(log n) Logarithmic: Binary search, balanced tree operations",
            "O(n) Linear: Single-pass traversals",
            "O(n log n) Linearithmic: Merge sort and heap operations",
            "O(n²) Quadratic: Nested loops and naive brute force"
          ]
        },
        {
          title: "The STAR Framing Method for Technical Solutions",
          explanation:
            "Structure your problem-solving explanation clearly and communicate your decisions.",
          keyPoints: [
            "Clarify constraints and edge cases",
            "State the naive solution first",
            "Explain the bottleneck before optimizing"
          ]
        }
      ],

      codeSnippet: {
        title: "Two-Pointer Sorted Pair Pattern",
        language: "typescript",
        code: `// Optimal Two-Pointer Search
export function findPairWithTargetSum(
  arr: number[],
  target: number
): [number, number] | null {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    const currentSum = arr[left] + arr[right];

    if (currentSum === target) {
      return [arr[left], arr[right]];
    }

    if (currentSum < target) {
      left++;
    } else {
      right--;
    }
  }

  return null;
}`,
        explanation:
          "For a sorted array, two pointers can find a target pair in O(n) time and O(1) auxiliary space."
      },

      interviewQuestions: [
        {
          question:
            "When should you choose a Hash Map over a Two-Pointer technique?",
          modelAnswer:
            "Use Two-Pointers when the input is sorted or can be sorted without violating time constraints. Use a Hash Map when the array is unsorted, original indices must be preserved, or extra O(n) memory is acceptable.",
          tips:
            "Explain the space-time trade-off clearly."
        },
        {
          question:
            "What is amortized time complexity? Give a practical example.",
          modelAnswer:
            "Amortized complexity is the average cost per operation over a sequence of operations. Dynamic array insertion is O(1) amortized because resizing happens infrequently.",
          tips:
            "Mention that an individual resize may take O(n), while a sequence of insertions has O(1) amortized cost."
        }
      ],

      practiceProblems: getFallbackPracticeProblems(
        1,
        role,
        day1Topic
      ),

      checklist: [
        {
          id: "task-1",
          title:
            "Review Time & Space complexity principles (Big-O, Big-Omega, Big-Theta)",
          timeEstimate: "30 mins",
          difficulty: "Easy",
          completed: false
        },
        {
          id: "task-2",
          title:
            "Implement Two-Pointer boundary convergence with edge case handling",
          timeEstimate: "45 mins",
          difficulty: "Medium",
          completed: false
        },
        {
          id: "task-3",
          title: "Solve the linked coding practice problems",
          timeEstimate: "45 mins",
          difficulty: "Medium",
          completed: false
        },
        {
          id: "task-4",
          title:
            "Complete Day 1 Knowledge Quiz to unlock Day 2 curriculum",
          timeEstimate: "15 mins",
          difficulty: "Easy",
          completed: false
        }
      ],

      quiz: [
        {
          id: "q-1",
          question:
            "What is the worst-case time complexity of searching in an unsorted array of size n?",
          options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
          answer: 2,
          explanation:
            "The target could be at the end or absent, requiring inspection of all n elements."
        },
        {
          id: "q-2",
          question:
            "Which operation is O(1) in a standard Singly Linked List?",
          options: [
            "Accessing the element at index k",
            "Prepending an element to the head",
            "Searching for a value",
            "Deleting a node given only its value"
          ],
          answer: 1,
          explanation:
            "Prepending requires updating the new node's next pointer and the head pointer."
        },
        {
          id: "q-3",
          question:
            "Why does the Two-Pointer convergence technique require a sorted array for target-sum search?",
          options: [
            "Because unsorted arrays cannot be indexed",
            "Because sorting provides a predictable relationship when moving pointers",
            "It works on every random array without changes",
            "Because browsers optimize sorted arrays faster"
          ],
          answer: 1,
          explanation:
            "In a sorted array, moving the left pointer increases the sum, while moving the right pointer decreases it."
        },
        {
          id: "q-4",
          question:
            "What is a good approach when an interviewer asks you to optimize space complexity?",
          options: [
            "Say no immediately",
            "Analyze whether extra data structures can be eliminated",
            "Skip the question",
            "Only rerun test cases"
          ],
          answer: 1,
          explanation:
            "Consider in-place transformations, pointer techniques, and iterative approaches to reduce auxiliary memory."
        }
      ],

      cheatSheet: [
        {
          term: "Big-O Notation",
          definition:
            "Upper bound on algorithm runtime scaling as input n grows."
        },
        {
          term: "In-Place Algorithm",
          definition:
            "An algorithm requiring only O(1) auxiliary space beyond the input."
        },
        {
          term: "Two-Pointer Strategy",
          definition:
            "Using two iterators to avoid unnecessary nested traversals."
        },
        {
          term: "STAR Method",
          definition:
            "Situation, Task, Action, Result framework for structured answers."
        }
      ]
    }
  };
}
