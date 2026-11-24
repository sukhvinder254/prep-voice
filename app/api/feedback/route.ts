import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const question =
      typeof body.question === "string"
        ? body.question.trim().slice(0, 3000)
        : "Tell me about yourself.";

    const answer =
      typeof body.answer === "string" ? body.answer.trim() : "";

    if (!answer) {
      return NextResponse.json(
        { error: "Spoken answer is required." },
        { status: 400 }
      );
    }

    if (answer.length > 12000) {
      return NextResponse.json(
        { error: "Answer is too long. Please shorten it and try again." },
        { status: 400 }
      );
    }

    // 1. Get the currently logged-in user
    let learningMemory = null;
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (user && !authError) {
        const { data: profile } = await supabase
          .from("user_learning_profiles")
          .select(
            "total_interviews, average_score, strong_topics, weak_topics, recurring_mistakes, improvement_history"
          )
          .eq("user_id", user.id)
          .maybeSingle();

        if (profile) {
          learningMemory = profile;
        }
      }
    } catch (e) {
      console.warn("Could not retrieve profile context:", e);
    }

    // 2. Prepare personalized learning context
    const memoryContext = learningMemory
      ? `
PREVIOUS LEARNING MEMORY:
${JSON.stringify(learningMemory, null, 2)}
`
      : `
PREVIOUS LEARNING MEMORY:
No saved learning profile is available yet.
`;

    const prompt = `
You are PrepVoice, a professional AI interview evaluation engine.
Evaluate the candidate's answer fairly against the interview question.

Evaluate:
1. Overall score from 1 to 10.
2. Relevance from 1 to 10.
3. Completeness from 1 to 10.
4. Structure from 1 to 10.
5. Technical accuracy from 1 to 10.

${memoryContext}

INTERVIEW QUESTION:
${JSON.stringify(question)}

CANDIDATE ANSWER:
${JSON.stringify(answer)}

Return valid JSON with exactly these fields:
{
  "score": 7,
  "relevance": 8,
  "completeness": 7,
  "structure": 8,
  "technicalAccuracy": 0,
  "strengths": "Specific things done well.",
  "improvements": "Specific improvements needed.",
  "sampleAnswer": "An improved example without inventing personal facts.",
  "followUpQuestion": "One relevant follow-up question.",
  "communicationTip": "One practical communication tip."
}
`;

    let feedback: any = null;

    if (genAI) {
      const modelsToTry = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash"];

      for (const modelName of modelsToTry) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: {
              responseMimeType: "application/json",
              temperature: 0.3,
            },
          });

          const result = await model.generateContent(prompt);
          const parsed = JSON.parse(result.response.text());

          if (typeof parsed.score === "number") {
            feedback = parsed;
            break;
          }
        } catch (err: any) {
          console.warn(`Model ${modelName} in /api/feedback busy or failed:`, err?.message);
        }
      }
    }

    if (!feedback) {
      feedback = generateHeuristicFeedback(question, answer);
    }

    const normalizeScore = (value: number, minimum = 0) =>
      Math.max(minimum, Math.min(10, Math.round(Number(value) || 6)));

    return NextResponse.json({
      score: normalizeScore(feedback.score, 1),
      relevance: normalizeScore(feedback.relevance, 1),
      completeness: normalizeScore(feedback.completeness, 1),
      structure: normalizeScore(feedback.structure, 1),
      technicalAccuracy: normalizeScore(feedback.technicalAccuracy, 0),
      strengths: typeof feedback.strengths === "string" ? feedback.strengths : "Addressed the question clearly.",
      improvements: typeof feedback.improvements === "string" ? feedback.improvements : "Structure your response with clearer examples.",
      sampleAnswer: typeof feedback.sampleAnswer === "string" ? feedback.sampleAnswer : "Focus on demonstrating measurable results and core competencies.",
      followUpQuestion: typeof feedback.followUpQuestion === "string" ? feedback.followUpQuestion : "How did you measure success in that scenario?",
      communicationTip: typeof feedback.communicationTip === "string" ? feedback.communicationTip : "Speak at a steady pace and emphasize key conclusions.",
    });
  } catch (error) {
    console.error("Feedback route error:", error);
    const fallback = generateHeuristicFeedback("Interview Question", "Candidate response");
    return NextResponse.json(fallback);
  }
}

function generateHeuristicFeedback(question: string, answer: string) {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const count = words.length;

  return {
    score: count >= 50 ? 8 : count >= 25 ? 6 : 4,
    relevance: 8,
    completeness: count >= 50 ? 8 : 5,
    structure: 7,
    technicalAccuracy: 6,
    strengths: "Communicated key ideas directly and maintained a coherent train of thought.",
    improvements: "Quantify your impact with concrete metrics and elaborate on trade-offs.",
    sampleAnswer: `A strong answer directly addresses ${question.slice(0, 40)} by presenting a clear background, key technical actions taken, and the resulting business outcome.`,
    followUpQuestion: "What was the most challenging technical constraint you encountered?",
    communicationTip: "Pause briefly before key points to let your accomplishments resonate with the interviewer.",
  };
}
