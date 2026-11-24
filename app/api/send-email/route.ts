
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Resend } from "resend";

export const runtime = "nodejs";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();

    const {
      email,
      dayNumber,
      topic,
      tasksCount,
      quizLink,
      checklist,
    } = body;

    const recipient = email || user?.email;

    if (!recipient) {
      return NextResponse.json(
        { error: "Please provide a recipient email address." },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "Resend API key is missing." },
        { status: 500 }
      );
    }

    const day = dayNumber || 1;
    const studyTopic = topic || "Core Foundations";

    const subject = `🚀 Day ${day} Study Digest: ${studyTopic} | PrepVoice`;

    const quizUrl = quizLink
      ? quizLink.startsWith("http")
        ? quizLink
        : `${req.nextUrl.origin}${quizLink}`
      : `${req.nextUrl.origin}/preparation`;

    const taskItems = Array.isArray(checklist)
      ? checklist
          .map(
            (task: string) =>
              `<li style="margin-bottom:10px;">${task}</li>`
          )
          .join("")
      : `<li>Complete your ${studyTopic} study session.</li>`;

    const { data, error } = await resend.emails.send({
      from:
        process.env.RESEND_FROM_EMAIL ||
        "PrepVoice <onboarding@resend.dev>",
      to: [recipient],
      subject,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:25px;color:#222;">
          <h1 style="color:#315fea;">PrepVoice 🚀</h1>

          <h2>Your Day ${day} Study Digest</h2>

          <p>Hello!</p>

          <p>Here is your daily interview preparation roadmap.</p>

          <div style="background:#f3f6ff;padding:18px;border-radius:10px;">
            <h3>Today's Topic</h3>
            <p>${studyTopic}</p>
            <p><strong>Tasks:</strong> ${tasksCount || 4}</p>
          </div>

          <h3>Your Study Checklist</h3>
          <ul>${taskItems}</ul>

          <a href="${quizUrl}"
             style="display:inline-block;background:#315fea;color:white;padding:13px 22px;text-decoration:none;border-radius:8px;margin-top:15px;">
            Start Your Quiz
          </a>

          <p style="margin-top:30px;color:#777;">
            Keep learning and keep improving!<br/>
            Team PrepVoice
          </p>
        </div>
      `,
    });

    if (error) {
      console.error("Resend error:", error);

      return NextResponse.json(
        { error: error.message || "Email could not be sent." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Study digest successfully submitted to the email service for ${recipient}.`,
      recipient,
      subject,
      emailId: data?.id,
    });
  } catch (error) {
    console.error("Email dispatch error:", error);

    return NextResponse.json(
      { error: "Failed to send email. Please try again." },
      { status: 500 }
    );
  }
}
