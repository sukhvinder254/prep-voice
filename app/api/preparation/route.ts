import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export interface PreparationDay {
  day: number;
  topic: string;
  tasks: string[];
  goal: string;
  isUnlocked?: boolean;
}

export interface DetailedDayStudy {
  topic: string;
  overview: string;
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

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { targetRole, durationDays, feedback, regenerate, planId } = body;

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
            responseMimeType: "application/json",
          },
        });

        const feedbackClause = feedback
          ? `\nUSER SPECIFIC FEEDBACK & CUSTOM REQUESTS:\n"${feedback.trim()}"\nYou MUST actively tailor and reorganize the curriculum, tasks, and Day 1 study notes to address this feedback directly.\n`
          : "";

        const prompt = `
You are a Staff Technical Interview Coach and Curriculum Architect.
Generate an elite, personalized interview preparation roadmap for the following:

TARGET ROLE: ${targetRole.trim()}
DURATION: ${duration} days
${feedbackClause}

CRITICAL RULES:
1. Generate exactly ${duration} daily plan entries in "dailyPlan" (days 1 to ${duration}).
2. Provide high-level topic, practical tasks (2-3 items), and target goal for each day.
3. Days 2 to ${duration} are overview milestones.
4. For Day 1, provide exhaustive "detailedDay1" study notes, an actionable checklist (4-5 tasks), a 4-question technical quiz, code snippet, and interview questions.
5. In the quiz, each question must have exactly 4 options and a zero-based integer "answer" index pointing to the correct option, plus a thorough explanation.

Return ONLY valid JSON matching this schema:
{
  "overview": "Curriculum overview explaining the preparation trajectory.",
  "dailyPlan": [
    {
      "day": 1,
      "topic": "Core Foundations & Big-O",
      "tasks": ["Task 1", "Task 2", "Task 3"],
      "goal": "Master foundation concepts"
    }
  ],
  "detailedDay1": {
    "topic": "Core Foundations & Big-O Analysis",
    "overview": "Deep dive into memory models, space-time trade-offs, and algorithmic efficiency.",
    "coreTheory": [
      {
        "title": "Asymptotic Analysis & Big-O Notation",
        "explanation": "Understanding worst-case, best-case, and average-case complexities in interview scenarios.",
        "keyPoints": [
          "O(1) Constant vs O(log n) Logarithmic vs O(n) Linear",
          "Space complexity: Auxiliary space vs input size",
          "Recognizing amortized constant time in dynamic arrays"
        ]
      },
      {
        "title": "Interview Communication Pattern",
        "explanation": "How to verbally walk through complexity tradeoffs before coding.",
        "keyPoints": [
          "State brute-force complexity first",
          "Identify the performance bottleneck",
          "Explain your optimization thesis clearly"
        ]
      }
    ],
    "codeSnippet": {
      "title": "Two-Pointer Optimization Pattern",
      "language": "typescript",
      "code": "function twoSumSorted(numbers: number[], target: number): number[] {\\n  let left = 0, right = numbers.length - 1;\\n  while (left < right) {\\n    const sum = numbers[left] + numbers[right];\\n    if (sum === target) return [left + 1, right + 1];\\n    if (sum < target) left++;\\n    else right--;\\n  }\\n  return [];\\n}",
      "explanation": "Reduces brute-force O(n²) pair search down to optimal O(n) time and O(1) extra space."
    },
    "interviewQuestions": [
      {
        "question": "What is the difference between Time Complexity and Space Complexity?",
        "modelAnswer": "Time complexity quantifies the amount of computational time an algorithm takes as a function of input size n, while Space complexity quantifies the total memory needed by the algorithm during execution.",
        "tips": "Always distinguish between input memory and auxiliary memory allocations."
      },
      {
        "question": "How does a Hash Table achieve O(1) average lookup, and what causes O(n) degradation?",
        "modelAnswer": "Hash tables use hash functions to compute array indices in O(1). However, high collision frequency or poorly chosen hash functions cause collisions, degrading lookups to O(n) unless rehashed or chained with balanced trees.",
        "tips": "Mention load factor and collision resolution techniques like chaining and open addressing."
      }
    ],
    "checklist": [
      {
        "id": "1-1",
        "title": "Review Big-O complexity cheat sheet and memory hierarchy",
        "timeEstimate": "35 mins",
        "difficulty": "Easy",
        "completed": false
      },
      {
        "id": "1-2",
        "title": "Implement Two-Pointer and Sliding Window core patterns",
        "timeEstimate": "45 mins",
        "difficulty": "Medium",
        "completed": false
      },
      {
        "id": "1-3",
        "title": "Solve 2 LeetCode problems aloud simulating interview constraints",
        "timeEstimate": "50 mins",
        "difficulty": "Medium",
        "completed": false
      },
      {
        "id": "1-4",
        "title": "Take Day 1 Knowledge & Concept Check Quiz",
        "timeEstimate": "15 mins",
        "difficulty": "Easy",
        "completed": false
      }
    ],
    "quiz": [
      {
        "id": "q1",
        "question": "What is the worst-case time complexity of searching in a standard Binary Search Tree (BST)?",
        "options": ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
        "answer": 2,
        "explanation": "If a BST becomes skewed (e.g. elements inserted in sorted order), it degenerates into a linked list, yielding O(n) worst-case time."
      },
      {
        "id": "q2",
        "question": "Which data structure provides O(1) amortized insertion at the end and O(1) random access?",
        "options": ["Singly Linked List", "Dynamic Array / Vector", "Hash Set", "Binary Heap"],
        "answer": 1,
        "explanation": "Dynamic arrays (like JavaScript arrays or C++ vectors) allow O(1) indexed lookups and O(1) amortized appends because doubling capacity happens infrequently."
      },
      {
        "id": "q3",
        "question": "In technical interviews, what does auxiliary space complexity strictly refer to?",
        "options": [
          "The size of the input data passed to the function",
          "The extra memory or temporary workspace used by the algorithm excluding the input",
          "The disk storage required to compile the executable",
          "The hardware cache size of the host machine"
        ],
        "answer": 1,
        "explanation": "Auxiliary space is the temporary or extra space used by the algorithm, excluding the space taken by the input arguments."
      },
      {
        "id": "q4",
        "question": "What is the most effective approach when an interviewer presents a problem you do not immediately know how to solve?",
        "options": [
          "Remain completely silent until you have written 100% of the code",
          "State a brute-force approach first, discuss its Big-O bottlenecks, and brainstorm optimizations aloud",
          "Ask the interviewer to immediately write the solution for you",
          "Claim the problem is invalid"
        ],
        "answer": 1,
        "explanation": "Stating the brute-force establishes a baseline, demonstrates your problem-solving process, and gives the interviewer opportunity to offer collaborative hints."
      }
    ],
    "cheatSheet": [
      { "term": "Time Complexity", "definition": "Rate of growth of runtime relative to input length n." },
      { "term": "Auxiliary Space", "definition": "Extra temporary memory used by the algorithm." },
      { "term": "Amortized Time", "definition": "Average time taken per operation over a long sequence of operations." },
      { "term": "STAR Method", "definition": "Situation, Task, Action, Result framework for articulating technical solutions." }
    ]
  }
}
`;

        const result = await model.generateContent(prompt);
        const parsed = JSON.parse(result.response.text());

        if (parsed.overview && Array.isArray(parsed.dailyPlan) && parsed.detailedDay1) {
          plan = {
            ...parsed,
            isUpdated: Boolean(feedback),
            feedbackSummary: feedback ? feedback.trim() : undefined,
            unlockedDays: [1],
          };
        }
      } catch (err) {
        console.warn("Gemini generation failed, falling back to blueprint generator:", err);
      }
    }

    if (!plan) {
      plan = generateDeterministicPlan(targetRole, duration, feedback);
    }

    // Save to Supabase if user is authenticated
    let savedId = planId || `plan_${Date.now()}`;

    if (user) {
      try {
        if (regenerate && planId) {
          await supabase
            .from("interview_preparation_plans")
            .update({
              target_role: targetRole.trim(),
              duration_days: duration,
              plan: plan,
            })
            .eq("id", planId)
            .eq("user_id", user.id);
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from("interview_preparation_plans")
            .insert({
              user_id: user.id,
              target_role: targetRole.trim(),
              duration_days: duration,
              plan: plan,
              completed_tasks: [],
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
      feedbackSummary: feedback ? feedback.trim() : null,
    });
  } catch (error) {
    console.error("Preparation plan API error:", error);
    return NextResponse.json(
      { error: "Could not generate preparation roadmap. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { planId, completedTasks, unlockedDays, activeDay } = body;

    if (user && planId && !planId.startsWith("plan_")) {
      await supabase
        .from("interview_preparation_plans")
        .update({
          completed_tasks: completedTasks || [],
        })
        .eq("id", planId)
        .eq("user_id", user.id);
    }

    return NextResponse.json({
      success: true,
      message: "Progress updated successfully.",
      completedTasks,
      unlockedDays,
      activeDay,
    });
  } catch (err) {
    console.error("Patch preparation error:", err);
    return NextResponse.json({ error: "Failed to save progress." }, { status: 500 });
  }
}

// Fallback high-fidelity curriculum generator
function generateDeterministicPlan(
  role: string,
  duration: number,
  feedback?: string
): PreparationPlan {
  const isSDE = role.toLowerCase().includes("sde") || role.toLowerCase().includes("software");
  const isFrontend = role.toLowerCase().includes("frontend");
  const isBackend = role.toLowerCase().includes("backend");
  const isAI = role.toLowerCase().includes("ai") || role.toLowerCase().includes("data");

  const day1Topic = isFrontend
    ? "DOM Performance, Virtual DOM & Event Loop Internals"
    : isBackend
    ? "RESTful API Design, Microservices & Database Indexing"
    : isAI
    ? "Machine Learning Foundations, Feature Engineering & Linear Models"
    : "Algorithm Complexity, Two-Pointer Patterns & Memory Layouts";

  const dailyPlan: PreparationDay[] = Array.from({ length: duration }, (_, i) => {
    const day = i + 1;
    let topic = `Core Engineering Module ${day}`;
    let goal = "Deepen technical execution and interview readiness.";

    if (day === 1) {
      topic = day1Topic;
      goal = "Master theoretical foundations, complexity tradeoffs, and code patterns.";
    } else if (day === 2) {
      topic = isFrontend
        ? "State Architecture, React 19 Hooks & Custom State Primitives"
        : isBackend
        ? "PostgreSQL Query Optimization, ACID Transactions & Connection Pools"
        : "Dynamic Arrays, Hash Maps & Amortized Complexity Analysis";
      goal = "Unlock after Day 1 completion: Build robust data flow.";
    } else if (day === 3) {
      topic = "Linked Lists, Stacks, Queues & Monotonic Pattern Drills";
      goal = "Solve standard interview problem variants with zero syntax hesitation.";
    } else if (day === 4) {
      topic = "Recursion, Backtracking & Tree Traversals (DFS/BFS)";
      goal = "Master tree navigation and recursive state passing.";
    } else if (day === 5) {
      topic = "Graph Algorithms: Topological Sort, Dijkstra & Cycle Detection";
      goal = "Architect graph solutions for real-world dependency resolution.";
    } else if (day === 6) {
      topic = "System Design & Distributed Scalability Principles";
      goal = "Formulate high-level architectural blueprints with caching and load balancers.";
    } else if (day === 7) {
      topic = "Full Mock Interview Simulation, STAR Story Framing & Live Review";
      goal = "Conduct comprehensive timed technical and behavioral evaluation.";
    } else {
      topic = `Sprint Milestone ${day}: Advanced Problem Solving & Code Review`;
      goal = `Solidify domain mastery and complete timed problem sets.`;
    }

    return {
      day,
      topic,
      tasks: [
        `Study key theoretical principles for ${topic.split(":")[0]}`,
        "Implement 2 production-grade patterns with full type safety",
        "Articulate design trade-offs aloud using the STAR technique"
      ],
      goal,
      isUnlocked: day === 1,
    };
  });

  return {
    overview: feedback
      ? `Customized curriculum adapted based on your feedback: "${feedback}". Structured with milestone-locked progression to guarantee deep mastery.`
      : `Comprehensive, structured ${duration}-day roadmap for ${role}. Day 1 is active with deep study notes, an actionable checklist, and a knowledge quiz. Subsequent days unlock sequentially upon Day 1 completion.`,
    isUpdated: Boolean(feedback),
    feedbackSummary: feedback ? feedback.trim() : undefined,
    unlockedDays: [1],
    dailyPlan,
    detailedDay1: {
      topic: day1Topic,
      overview: `Exhaustive Day 1 curriculum designed for ${role}. Study the core architecture, review the code pattern, complete your action items, and pass the quiz to unlock Day 2.`,
      coreTheory: [
        {
          title: "Asymptotic Analysis & Big-O Foundations",
          explanation: "In top technical interviews, writing working code is only 40% of the evaluation. Interviewers judge how deeply you analyze runtime and spatial growth.",
          keyPoints: [
            "O(1) Constant: Hash table lookups (average), array indexing",
            "O(log n) Logarithmic: Binary search, balanced search tree operations",
            "O(n) Linear: Single pass traversals, two-pointer iterations",
            "O(n log n) Linearithmic: Merge sort, Quick sort (average), heap operations",
            "O(n²) Quadratic: Nested loops, naive brute force"
          ]
        },
        {
          title: "The STAR Framing Method for Technical Solutions",
          explanation: "Structure your problem-solving verbalization using Situation, Task, Action, and Result to convey senior-level communication skills.",
          keyPoints: [
            "Clarify constraints: Ask about empty inputs, duplicates, and memory bounds",
            "State the naive solution first to confirm mutual problem understanding",
            "Explain where the bottleneck lies before refactoring with optimal data structures"
          ]
        }
      ],
      codeSnippet: {
        title: "Two-Pointer Sorted Pair Pattern (Optimal O(n) Time, O(1) Space)",
        language: "typescript",
        code: `// Optimal Two-Pointer Search
export function findPairWithTargetSum(arr: number[], target: number): [number, number] | null {
  let left = 0;
  let right = arr.length - 1;

  while (left < right) {
    const currentSum = arr[left] + arr[right];

    if (currentSum === target) {
      return [arr[left], arr[right]]; // Found exact target pair
    }

    if (currentSum < target) {
      left++; // Need a larger sum, move left pointer rightward
    } else {
      right--; // Need a smaller sum, move right pointer leftward
    }
  }

  return null; // No pair found
}`,
        explanation: "By keeping the array sorted, we converge from both boundaries in O(n) linear time with O(1) auxiliary space, replacing the naive O(n²) nested loop."
      },
      interviewQuestions: [
        {
          question: "When should you choose a Hash Map over a Two-Pointer technique?",
          modelAnswer: "Use Two-Pointers when the input array is already sorted or can be sorted without violating time constraints, requiring O(1) space. Use a Hash Map when the array is unsorted and you must preserve original indices, or when O(n) auxiliary space is acceptable for immediate O(1) lookups.",
          tips: "Mention the space-time trade-off: Hash Map trades O(n) memory for speed; Two-Pointers trades sorting time for zero memory overhead."
        },
        {
          question: "What is an amortized time complexity, and give a practical example?",
          modelAnswer: "Amortized complexity is the average time taken per operation over a worst-case sequence of operations. For example, inserting into a dynamic array is O(1) amortized because capacity doubling (which takes O(n)) happens exponentially less often.",
          tips: "Highlight that single operations might be expensive, but n operations take O(n) total time."
        }
      ],
      checklist: [
        {
          id: "task-1",
          title: "Review Time & Space complexity principles (Big-O, Big-Omega, Big-Theta)",
          timeEstimate: "30 mins",
          difficulty: "Easy",
          completed: false
        },
        {
          id: "task-2",
          title: "Implement Two-Pointer boundary convergence with edge case handling",
          timeEstimate: "45 mins",
          difficulty: "Medium",
          completed: false
        },
        {
          id: "task-3",
          title: "Solve 2 medium interview problems simulating real-world time constraints",
          timeEstimate: "45 mins",
          difficulty: "Medium",
          completed: false
        },
        {
          id: "task-4",
          title: "Complete Day 1 Knowledge Quiz below to unlock Day 2 curriculum",
          timeEstimate: "15 mins",
          difficulty: "Easy",
          completed: false
        }
      ],
      quiz: [
        {
          id: "q-1",
          question: "What is the worst-case time complexity of searching in an unsorted array of size n?",
          options: ["O(1)", "O(log n)", "O(n)", "O(n²)"],
          answer: 2,
          explanation: "In an unsorted array, the target element could be at the very end or not present, requiring inspection of all n elements in O(n) time."
        },
        {
          id: "q-2",
          question: "Which of the following operations is O(1) constant time in a standard Singly Linked List?",
          options: [
            "Accessing the element at index k",
            "Prepending an element to the head",
            "Searching for a value",
            "Deleting a node given only its value"
          ],
          answer: 1,
          explanation: "Prepending to the head of a linked list simply involves pointing the new node to the existing head and updating the head pointer, requiring O(1) operations."
        },
        {
          id: "q-3",
          question: "Why does the Two-Pointer convergence technique require a sorted array?",
          options: [
            "Because unsorted arrays cannot be indexed in JavaScript/TypeScript",
            "Because sorting provides a monotonic relationship where moving a pointer predictably increases or decreases the sum",
            "It does not require a sorted array; it works on any random array",
            "Because browsers optimize sorted arrays faster"
          ],
          answer: 1,
          explanation: "Monotonicity is key: in a sorted array, moving the left pointer rightward is guaranteed to increase the sum, and moving the right pointer leftward is guaranteed to decrease the sum."
        },
        {
          id: "q-4",
          question: "What is the recommended response if an interviewer asks: 'Can you optimize the space complexity further?'",
          options: [
            "Say no immediately because your solution is already perfect",
            "Analyze whether recursive call stacks or auxiliary data structures can be eliminated with an in-place pointer or iterative approach",
            "Ask to skip to another question",
            "Re-run your test cases"
          ],
          answer: 1,
          explanation: "Interviewers look for spatial awareness: examine if auxiliary arrays or maps can be replaced with bitmasks, two pointers, or in-place transformations to achieve O(1) space."
        }
      ],
      cheatSheet: [
        { term: "Big-O Notation", definition: "Upper bound on algorithm runtime scaling as input n grows." },
        { term: "In-Place Algorithm", definition: "An algorithm requiring only O(1) auxiliary space beyond the input." },
        { term: "Two-Pointer Strategy", definition: "Using dual boundary or fast-slow iterators to avoid nested loop traversals." },
        { term: "STAR Method", definition: "Situation, Task, Action, Result framework for structured interview answers." }
      ]
    }
  };
}
