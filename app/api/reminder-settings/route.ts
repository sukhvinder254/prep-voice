import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("email_reminder_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      settings: data || {
        enabled: true,
        reminder_time: "09:00:00",
        timezone: "Asia/Kolkata",
        email: user.email,
      },
    });
  } catch (err: any) {
    console.error("Fetch reminder settings error:", err);
    return NextResponse.json({ error: "Failed to load reminder settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { enabled, reminder_time, timezone } = body;

    const email = user.email || "ksukhvinder254@gmail.com";
    const time = reminder_time || "09:00:00";
    const tz = timezone || "Asia/Kolkata";
    const isEnabled = typeof enabled === "boolean" ? enabled : true;

    const { data, error } = await supabase
      .from("email_reminder_settings")
      .upsert(
        {
          user_id: user.id,
          email,
          enabled: isEnabled,
          reminder_time: time,
          timezone: tz,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: "Daily 9:00 AM email reminder successfully configured!",
      settings: data,
    });
  } catch (err: any) {
    console.error("Save reminder settings error:", err);
    return NextResponse.json({ error: "Failed to save reminder settings" }, { status: 500 });
  }
}
