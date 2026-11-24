
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getLocalDateAndTime(timezone: string) {
  const now = new Date();

  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const values = Object.fromEntries(
    parts.map((part) => [part.type, part.value])
  );

  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

export async function GET(request: Request) {
  try {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      return NextResponse.json(
        { error: "CRON_SECRET is not configured." },
        { status: 500 }
      );
    }

    if (
      request.headers.get("authorization") !==
      `Bearer ${cronSecret}`
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
      return NextResponse.json(
        { error: "Resend environment variables are missing." },
        { status: 500 }
      );
    }

    const supabase = createAdminClient();
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data: users, error } = await supabase
      .from("email_reminder_settings")
      .select("user_id, email, enabled, reminder_time, timezone, last_sent_date")
      .eq("enabled", true);

    if (error) {
      throw error;
    }

    let sent = 0;
    let skipped = 0;
    const failed: string[] = [];

    for (const user of users ?? []) {
      try {
        const { date, time } = getLocalDateAndTime(user.timezone);

        if (time < user.reminder_time.slice(0, 5)) {
          skipped++;
          continue;
        }

        if (user.last_sent_date === date) {
          skipped++;
          continue;
        }

        // Atomically claim today's reminder to reduce duplicate sends.
        const { data: claimed, error: claimError } = await supabase
          .from("email_reminder_settings")
          .update({
            last_sent_date: date,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.user_id)
          .eq("enabled", true)
          .or(`last_sent_date.is.null,last_sent_date.neq.${date}`)
          .select("user_id")
          .maybeSingle();

        if (claimError) {
          throw claimError;
        }

        if (!claimed) {
          skipped++;
          continue;
        }

        const { error: emailError } = await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL,
          to: user.email,
          subject: "Your Daily PrepVoice Practice Reminder",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; color: #26324b;">
              <h2 style="color: #315fea;">Time for your daily practice!</h2>
              <p>Hello,</p>
              <p>Your daily reminder from PrepVoice is here.</p>
              <p>Take a few minutes today to practise your interview skills and keep improving.</p>
              <p>Consistency is the key to confidence. Keep going!</p>
              <p style="margin-top: 28px;">Best regards,<br><strong>Team PrepVoice</strong></p>
            </div>
          `,
        });

        if (emailError) {
          throw emailError;
        }

        sent++;
      } catch (userError) {
        console.error(`Reminder failed for ${user.email}:`, userError);
        failed.push(user.email);
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      skipped,
      failed,
    });
  } catch (error) {
    console.error("Daily reminder cron error:", error);

    return NextResponse.json(
      { error: "Failed to process daily reminders." },
      { status: 500 }
    );
  }
}
