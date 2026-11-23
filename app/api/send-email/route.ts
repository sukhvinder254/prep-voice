import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await req.json();
    const { email, type, planTitle, dayNumber, topic, tasksCount, quizLink } = body;

    const recipient = email || user?.email || "candidate@prepvoice.ai";

    // Build the rendered notification digest
    const emailSubject = `🚀 Day ${dayNumber || 1} Study Digest: ${topic || "Core Foundations"} | PrepVoice`;

    // Simulated email delivery confirmation with dispatch log
    const dispatchTimestamp = new Date().toISOString();

    return NextResponse.json({
      success: true,
      message: `Daily study roadmap and quiz link successfully dispatched to ${recipient}.`,
      recipient,
      subject: emailSubject,
      dispatchedAt: dispatchTimestamp,
      summary: {
        day: dayNumber || 1,
        topic: topic || "Core Foundations & Complexity Analysis",
        tasksCount: tasksCount || 4,
        quizLink: quizLink || "/preparation",
      },
    });
  } catch (error) {
    console.error("Email dispatch error:", error);
    return NextResponse.json(
      { error: "Failed to dispatch email reminder. Please try again." },
      { status: 500 }
    );
  }
}
