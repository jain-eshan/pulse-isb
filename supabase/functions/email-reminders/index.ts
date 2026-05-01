/**
 * email-reminders — Cron-triggered. Sends reminder emails to RSVPd users
 * ~1 hour before their session starts.
 *
 * Schedule: every 30 minutes via cron
 * Invoke via Supabase cron or external cron (e.g. Railway, cron-job.org).
 *
 * Logic:
 *   1. Find sessions starting in 30–90 min that haven't been reminded yet.
 *   2. For each, fetch "going" RSVPs → user emails.
 *   3. Send reminder email.
 *   4. Mark session as reminded (via a `reminded_at` column or a separate table).
 *
 * Env vars:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 *   RESEND_API_KEY, FROM_EMAIL, APP_URL
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") ?? "Pulse ISB <pulse@eshanjain.in>";
const APP_URL = Deno.env.get("APP_URL") ?? "https://pulse-isb.vercel.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });

  if (!RESEND_API_KEY) {
    return json({ sent: 0, message: "RESEND_API_KEY not configured" });
  }

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date();
    const from = new Date(now.getTime() + 30 * 60 * 1000).toISOString(); // 30 min from now
    const to = new Date(now.getTime() + 90 * 60 * 1000).toISOString();   // 90 min from now

    // Find sessions starting in 30–90 min, not yet reminded
    // We'll use a simple approach: track reminded sessions in bot_events table with action='reminder_sent'
    const { data: sessions } = await sb
      .from("sessions")
      .select("id, title, starts_at, venue, creator:users!sessions_creator_id_fkey(name)")
      .eq("archived", false)
      .gte("starts_at", from)
      .lte("starts_at", to);

    if (!sessions || sessions.length === 0) {
      return json({ sent: 0, message: "No upcoming sessions in window" });
    }

    // Check which have already been reminded
    const sessionIds = sessions.map((s: any) => s.id);
    const { data: alreadyReminded } = await sb
      .from("bot_events")
      .select("parsed_session_id")
      .eq("action", "reminder_sent")
      .in("parsed_session_id", sessionIds);

    const remindedIds = new Set((alreadyReminded ?? []).map((r: any) => r.parsed_session_id));
    const toRemind = sessions.filter((s: any) => !remindedIds.has(s.id));

    if (toRemind.length === 0) {
      return json({ sent: 0, message: "All upcoming sessions already reminded" });
    }

    let totalSent = 0;

    for (const session of toRemind) {
      const s = session as any;

      // Fetch "going" RSVPs with user emails
      const { data: rsvps } = await sb
        .from("rsvps")
        .select("user:users!rsvps_user_id_fkey(email, name)")
        .eq("session_id", s.id)
        .eq("status", "going");

      const emails = (rsvps ?? [])
        .map((r: any) => r.user?.email)
        .filter(Boolean) as string[];

      if (emails.length === 0) continue;

      const startsAt = new Date(s.starts_at);
      const timeStr = startsAt.toLocaleTimeString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
      const hostName = s.creator?.name ?? "Someone";
      const sessionUrl = `${APP_URL}/?session=${s.id}`;

      const subject = `⏰ Reminder: ${s.title} starts at ${timeStr}`;
      const html = buildReminderHtml({
        title: s.title,
        hostName,
        timeStr,
        venue: s.venue,
        sessionUrl,
        goingCount: emails.length,
      });

      // Send batch via Resend
      const res = await fetch("https://api.resend.com/emails/batch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify(
          emails.map((to) => ({
            from: FROM_EMAIL,
            to,
            subject,
            html,
          }))
        ),
      });

      if (res.ok) {
        totalSent += emails.length;
        // Mark as reminded
        await sb.from("bot_events").insert({
          action: "reminder_sent",
          parsed_session_id: s.id,
          payload: { emails_sent: emails.length },
        });
      } else {
        console.error(`[email-reminders] Resend error for ${s.id}:`, await res.text());
      }
    }

    return json({ sent: totalSent, sessions_reminded: toRemind.length });
  } catch (e) {
    console.error("[email-reminders]", e);
    return json({ error: String(e) }, 500);
  }
});

function buildReminderHtml(p: {
  title: string;
  hostName: string;
  timeStr: string;
  venue?: string;
  sessionUrl: string;
  goingCount: number;
}): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;background:#F4F2EC;">
  <div style="max-width:480px;margin:0 auto;padding:32px 16px;">
    <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #EBE8E1;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <div style="background:linear-gradient(135deg,#1C3A6E,#122850);padding:20px 24px;">
        <p style="margin:0;font-size:28px;">⏰</p>
        <h1 style="margin:8px 0 0;font-size:20px;font-weight:600;color:#fff;line-height:1.3;">Starting soon!</h1>
      </div>

      <div style="padding:20px 24px 28px;">
        <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0F0F0F;">${esc(p.title)}</p>
        <p style="margin:0 0 16px;font-size:13px;color:#5A5A5A;">
          Hosted by ${esc(p.hostName)} · starts at <strong>${esc(p.timeStr)}</strong>
        </p>

        ${p.venue ? `
        <div style="background:#F4F2EC;border-radius:10px;padding:12px;margin-bottom:16px;">
          <p style="margin:0;font-size:12px;font-weight:700;color:#0F0F0F;">📍 ${esc(p.venue)}</p>
        </div>` : ""}

        <p style="margin:0 0 20px;font-size:13px;color:#5A5A5A;">
          ${p.goingCount} ${p.goingCount === 1 ? "person" : "people"} going — including you! Don't forget to show up 🙌
        </p>

        <a href="${p.sessionUrl}" style="display:block;text-align:center;background:#1C3A6E;color:#fff;text-decoration:none;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:700;">
          View Session Details
        </a>
      </div>
    </div>

    <p style="text-align:center;margin:20px 0 0;font-size:11px;color:#9E9E9E;">
      Pulse — ISB Mohali
    </p>
  </div>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(), "content-type": "application/json" },
  });
}

function cors() {
  return {
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "authorization, content-type",
    "access-control-allow-methods": "POST, OPTIONS",
  };
}
