// src/lib/ics.ts
// Generate RFC-5545 compliant .ics files for download.

interface IcsEvent {
  id: string;
  title: string;
  description?: string;
  starts_at: string; // ISO
  ends_at?: string;  // ISO
  venue?: string;
  url?: string;
}

function fmtIcsDate(iso: string): string {
  // 2026-04-25T21:00:00.000Z → 20260425T210000Z
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function escapeIcsText(s: string): string {
  // Escape per RFC 5545
  return s
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;")
    .replace(/\n/g, "\\n");
}

export function buildIcs(ev: IcsEvent): string {
  const dtStart = fmtIcsDate(ev.starts_at);
  const dtEnd = fmtIcsDate(
    ev.ends_at ?? new Date(new Date(ev.starts_at).getTime() + 60 * 60 * 1000).toISOString()
  );
  const dtStamp = fmtIcsDate(new Date().toISOString());

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Pulse//ISB//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${ev.id}@pulse.eshanjain.in`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${escapeIcsText(ev.title)}`,
    ev.description ? `DESCRIPTION:${escapeIcsText(ev.description)}` : null,
    ev.venue ? `LOCATION:${escapeIcsText(ev.venue)}` : null,
    ev.url ? `URL:${ev.url}` : null,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean) as string[];

  return lines.join("\r\n");
}

/**
 * Magic link to add this event to Google Calendar (web).
 * Opens Google Calendar with event pre-filled — user just clicks "Save".
 */
export function googleCalendarUrl(ev: IcsEvent): string {
  const start = fmtIcsDate(ev.starts_at);
  const end = fmtIcsDate(
    ev.ends_at ?? new Date(new Date(ev.starts_at).getTime() + 60 * 60 * 1000).toISOString()
  );
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.title,
    dates: `${start}/${end}`,
  });
  if (ev.description) params.set("details", ev.description + (ev.url ? `\n\n${ev.url}` : ""));
  if (ev.venue) params.set("location", ev.venue);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Magic link to add this event to Outlook Calendar (web).
 */
export function outlookCalendarUrl(ev: IcsEvent): string {
  const end = ev.ends_at ?? new Date(new Date(ev.starts_at).getTime() + 60 * 60 * 1000).toISOString();
  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: ev.title,
    startdt: ev.starts_at,
    enddt: end,
  });
  if (ev.description) params.set("body", ev.description + (ev.url ? `\n\n${ev.url}` : ""));
  if (ev.venue) params.set("location", ev.venue);
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Magic link for Office 365 / Outlook for Business.
 */
export function office365CalendarUrl(ev: IcsEvent): string {
  return outlookCalendarUrl(ev).replace("outlook.live.com", "outlook.office.com");
}

export function downloadIcs(ev: IcsEvent) {
  const ics = buildIcs(ev);
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
