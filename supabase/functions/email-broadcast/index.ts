/**
 * email-broadcast — Send a styled email to the ISB Mohali cohort mailing list
 * when a new session is posted.
 *
 * Sends ONE email to PGP2027_Mohali@isb.edu (413 students).
 *
 * Body: { session_id: string }
 *
 * Env vars (set in Supabase Edge Function secrets):
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY — auto-injected by Supabase
 *   RESEND_API_KEY — from resend.com dashboard
 *   APP_URL — e.g. https://pulse-isb.vercel.app
 */
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM_EMAIL = "Pulse ISB <pulse@eshanjain.in>";
const COHORT_LIST = "PGP2027_Mohali@isb.edu";
const APP_URL = Deno.env.get("APP_URL") ?? "https://pulse-isb.vercel.app";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors() });

  try {
    const { session_id } = await req.json();
    if (!session_id) return json({ error: "session_id required" }, 400);

    if (!RESEND_API_KEY) {
      return json({ error: "RESEND_API_KEY not configured" }, 500);
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch the session + creator
    const { data: session, error: sessErr } = await sb
      .from("sessions")
      .select("*, creator:users!sessions_creator_id_fkey(name, section, email)")
      .eq("id", session_id)
      .single();

    if (sessErr || !session) {
      return json({ error: "Session not found" }, 404);
    }

    // Format date in IST
    const startsAt = new Date(session.starts_at);
    const dateStr = startsAt.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      weekday: "short",
      day: "numeric",
      month: "short",
    });
    const timeStr = startsAt.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const hostName = session.creator?.name ?? "Someone";
    const hostFirst = hostName.split(" ")[0];
    const sessionUrl = `${APP_URL}/?session=${session.id}`;

    const subject = `🎯 ${hostFirst} is hosting: ${session.title}`;

    const html = buildEmailHtml({
      title: session.title,
      hostName,
      dateStr,
      timeStr,
      venue: session.venue,
      description: session.description,
      sessionUrl,
      tags: session.tags ?? [],
    });

    // Send single email to the cohort mailing list
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: COHORT_LIST,
        subject,
        html,
        reply_to: session.creator?.email ?? FROM_EMAIL,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[email-broadcast] Resend error:", errText);
      return json({ error: `Resend error: ${errText}` }, 500);
    }

    const result = await res.json();

    // Log in bot_events for audit trail
    await sb.from("bot_events").insert({
      action: "email_broadcast",
      parsed_session_id: session.id,
      payload: { to: COHORT_LIST, resend_id: result.id },
    });

    return json({ sent: true, to: COHORT_LIST, resend_id: result.id });

  } catch (e) {
    console.error("[email-broadcast]", e);
    return json({ error: String(e) }, 500);
  }
});

function buildEmailHtml(p: {
  title: string;
  hostName: string;
  dateStr: string;
  timeStr: string;
  venue?: string;
  description?: string;
  sessionUrl: string;
  tags: string[];
}): string {
  const tagBadges = p.tags
    .map((t) => {
      const label = t.charAt(0).toUpperCase() + t.slice(1);
      return `<span style="display:inline-block;background:#EEF2FA;color:#1C3A6E;padding:4px 12px;border-radius:99px;font-size:11px;font-weight:700;margin-right:4px;">${label}</span>`;
    })
    .join("");

  const isOnline = p.venue && (
    p.venue.toLowerCase().includes("zoom.us") ||
    p.venue.toLowerCase().includes("meet.google") ||
    p.venue.toLowerCase().includes("teams.microsoft") ||
    p.venue.toLowerCase().startsWith("http")
  );
  const venueDisplay = isOnline ? "Online (link in session page)" : (p.venue ?? "TBD");

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;background:#F4F2EC;">
  <div style="max-width:520px;margin:0 auto;padding:32px 16px;">

    <!-- Main card -->
    <div style="background:#fff;border-radius:16px;overflow:hidden;border:1px solid #EBE8E1;box-shadow:0 2px 12px rgba(0,0,0,0.06);">

      <!-- Navy header -->
      <div style="background:linear-gradient(135deg,#1C3A6E,#122850);padding:28px 24px 24px;">
        <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:rgba(255,255,255,0.6);text-transform:uppercase;letter-spacing:0.12em;">New on Pulse</p>
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;line-height:1.3;">${esc(p.title)}</h1>
        ${tagBadges ? `<div style="margin-top:12px;">${tagBadges}</div>` : ""}
      </div>

      <div style="padding:24px;">
        <!-- Warm opener -->
        <p style="margin:0 0 20px;font-size:15px;color:#333;line-height:1.5;">
          Hey folks! <strong>${esc(p.hostName)}</strong> just posted a session. Here's the scoop:
        </p>

        <!-- Date + Venue row -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          <tr>
            <td style="width:50%;vertical-align:top;padding-right:6px;">
              <div style="background:#F4F2EC;border-radius:12px;padding:14px;">
                <p style="margin:0;font-size:10px;font-weight:700;color:#9E9E9E;text-transform:uppercase;letter-spacing:0.08em;">When</p>
                <p style="margin:6px 0 0;font-size:15px;font-weight:700;color:#0F0F0F;">${esc(p.dateStr)}</p>
                <p style="margin:2px 0 0;font-size:13px;color:#5A5A5A;">${esc(p.timeStr)}</p>
              </div>
            </td>
            <td style="width:50%;vertical-align:top;padding-left:6px;">
              <div style="background:#F4F2EC;border-radius:12px;padding:14px;">
                <p style="margin:0;font-size:10px;font-weight:700;color:#9E9E9E;text-transform:uppercase;letter-spacing:0.08em;">Where</p>
                <p style="margin:6px 0 0;font-size:15px;font-weight:700;color:#0F0F0F;">${esc(venueDisplay)}</p>
              </div>
            </td>
          </tr>
        </table>

        ${p.description ? `
        <p style="margin:0 0 24px;font-size:14px;color:#555;line-height:1.65;">
          ${esc(p.description.length > 250 ? p.description.slice(0, 250) + "…" : p.description)}
        </p>` : ""}

        <!-- CTA button -->
        <a href="${p.sessionUrl}" style="display:block;text-align:center;background:#1C3A6E;color:#fff !important;text-decoration:none;padding:16px 24px;border-radius:12px;font-size:15px;font-weight:700;box-shadow:0 4px 16px rgba(28,58,110,0.25);mso-padding-alt:16px 24px;">
          RSVP & Add to Calendar →
        </a>

        <p style="margin:16px 0 0;text-align:center;font-size:12px;color:#9E9E9E;">
          One tap — takes 3 seconds
        </p>
      </div>
    </div>

    <!-- Footer -->
    <p style="text-align:center;margin:24px 0 0;font-size:11px;color:#9E9E9E;line-height:1.5;">
      <strong>Pulse</strong> — by your batchmates, for your batchmates<br/>
      ISB Mohali · PGP Co'27
    </p>
  </div>
</body>
</html>`;
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
