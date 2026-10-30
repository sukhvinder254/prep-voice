
import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key is not configured." },
        { status: 500 }
      );
    }

    const body = await req.json();

    const {
      company,
      role,
      level,
      interviewType,
      questionCount,
      duration,
    } = body;

    if (
      !company ||
      !role ||
      !level ||
      !interviewType ||
      !questionCount ||
      !duration
    ) {
      return NextResponse.json(
        { error: "Please provide all interview details." },
        { status: 400 }
      );
    }

    const allowedCounts = [5, 10, 15];
    const allowedDurations = [15, 30, 45];
    const allowedTypes = ["Technical", "HR", "Mixed"];
    const allowedLevels = ["Beginner", "Intermediate", "Advanced"];

    if (
      typeof company !== "string" ||
      typeof role !== "string" ||
      company.trim().length === 0 ||
      role.trim().length === 0 ||
      company.length > 100 ||
      role.length > 100 ||
      !allowedCounts.includes(Number(questionCount)) ||
      !allowedDurations.includes(Number(duration)) ||
      !allowedTypes.includes(interviewType) ||
      !allowedLevels.includes(level)
    ) {
      return NextResponse.json(
        { error: "Invalid interview configuration." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const prompt = `
You are an expert professional interview question generator.

Generate a realistic mock interview for the following candidate configuration.

Company: ${company.trim()}
Job Role: ${role.trim()}
Experience Level: ${level}
Interview Type: ${interviewType}
Number of Questions: ${Number(questionCount)}
Duration: ${Number(duration)} minutes

Instructions:
1. Generate exactly ${Number(questionCount)} questions.
2. Match the difficulty to the selected experience level.
3. Make questions relevant to the selected job role.
4. Use publicly known company-related interview themes and role expectations.
5. Do not claim these are actual or guaranteed company interview questions.
6. For Technical interviews, focus on technical knowledge and problem solving.
7. For HR interviews, focus on behavioural and situational questions.
8. For Mixed interviews, include both technical and HR questions.
9. Questions must be clear, distinct and useful.
10. Do not include answers.

Return ONLY valid JSON in this structure:

{
  "title": "Company Mock Interview",
  "company": "${company.trim()}",
  "role": "${role.trim()}",
  "level": "${level}",
  "interviewType": "${interviewType}",
  "questions": [
    {
      "question": "Interview question",
      "category": "Technical or HR or Behavioural"
    }
  ]
}
`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    const interview = JSON.parse(responseText);

    if (
      !interview ||
      !Array.isArray(interview.questions) ||
      interview.questions.length !== Number(questionCount) ||
      !interview.questions.every(
        (item: { question?: string; category?: string }) =>
          typeof item.question === "string" &&
          item.question.trim().length > 0 &&
          typeof item.category === "string" &&
          item.category.trim().length > 0
      )
    ) {
      throw new Error("AI returned an invalid interview format.");
    }

    return NextResponse.json({
      success: true,
      interview,
    });
  } catch (error) {
    console.error("Company interview generation error:", error);

    return NextResponse.json(
      { error: "Unable to generate interview. Please try again." },
      { status: 500 }
    );
  }
}
