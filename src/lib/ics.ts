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
