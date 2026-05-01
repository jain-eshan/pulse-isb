/**
 * SessionDetail — Pulse Redesign v2
 * Cover with title scrim → guest stack → date/venue cards → hosted-by →
 * about → going list → share row → STICKY bottom RSVP bar.
 *
 * Pixel-faithful to Pulse Redesign.html EventDetailScreen.
 */
import { useEffect, useState } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Share2,
  ExternalLink,
  Check,
  MessageCircle,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useSessions } from "../hooks/useSessions";
import { fireConfetti } from "../components/Confetti";
import { sectionByCode } from "../lib/sections";
import SectionPill from "../components/SectionPill";
import CoverBanner, { coverTheme } from "../components/CoverBanner";
import CalendarMenu from "../components/CalendarMenu";
import { COLOR, FONT } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";
import { googleCalendarUrl } from "../lib/ics";
import type { Session, User, RsvpStatus } from "../types";

interface Attendee {
  user_id: string;
  status: RsvpStatus;
  user: { id: string; name: string; section: string; avatar_url?: string; ogsg?: number };
}

type Props = { session: Session; user: User; onBack: () => void };

/** Detect if a venue string is actually an online meeting link. */
function isOnlineLink(venue?: string): boolean {
  if (!venue) return false;
  const v = venue.toLowerCase();
  return v.includes("zoom.us") || v.includes("meet.google.com") || v.includes("teams.microsoft.com") || v.startsWith("http");
}

export default function SessionDetail({ session, user, onBack }: Props) {
  const { rsvp } = useSessions(user);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [busy, setBusy] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  const myStatus = attendees.find((a) => a.user_id === user.id)?.status;
  const goingList = attendees.filter((a) => a.status === "going");
  const goingCount = goingList.length;

  const startsAt = new Date(session.starts_at);
  const month = format(startsAt, "MMM").toUpperCase();
  const dayOfMonth = format(startsAt, "d");
  const today = isToday(startsAt);
  const tomorrow = isTomorrow(startsAt);
  const dayLabel = today ? "Today" : tomorrow ? "Tomorrow" : format(startsAt, "EEE, d MMM");
  const time = format(startsAt, "h:mm a");

  const sessionUrl = `${window.location.origin}/?session=${session.id}`;
  // Build a richer calendar description with host, attendee count, and link
  const calDesc = [
    session.description,
    session.creator ? `Hosted by ${session.creator.name}` : null,
    goingCount > 0 ? `${goingCount} people going` : null,
    isOnlineLink(session.venue) ? `Join: ${session.venue}` : null,
    `RSVP & details: ${sessionUrl}`,
  ].filter(Boolean).join("\n\n");

  const eventForCal = {
    id: session.id,
    title: `${session.title} — Pulse ISB`,
    description: calDesc,
    starts_at: session.starts_at,
    ends_at: session.ends_at,
    venue: isOnlineLink(session.venue) ? session.venue : session.venue,
    url: sessionUrl,
  };

  const theme = coverTheme(session.tags?.[0]);
  const hostSection = sectionByCode(session.creator?.section);

  // Number of distinct sections in the going list
  const sectionCount = new Set(
    goingList.map((a) => a.user?.section).filter(Boolean)
  ).size;

  useEffect(() => {
    const fetchAttendees = async () => {
      const { data } = await supabase
        .from("rsvps")
        .select("user_id, status, user:users!rsvps_user_id_fkey(id, name, section, avatar_url, ogsg)")
        .eq("session_id", session.id);
      setAttendees((data ?? []) as unknown as Attendee[]);
    };
    fetchAttendees();

    const ch = supabase
      .channel(`rsvps-${session.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rsvps", filter: `session_id=eq.${session.id}` },
        fetchAttendees
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [session.id]);

  const [showCalPrompt, setShowCalPrompt] = useState(false);

  async function handleRsvp(status: RsvpStatus) {
    tap();
    setBusy(true);
    try {
      await rsvp(session.id, status);
      if (status === "going") {
        fireConfetti();
        // Show "Add to calendar?" prompt after a beat
        setTimeout(() => setShowCalPrompt(true), 800);
      } else {
        setShowCalPrompt(false);
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleShareWA() {
    tap();
    const hostFirst = session.creator?.name?.split(" ")[0] ?? "Someone";
    const venueLine = session.venue ? `\n📍 ${isOnlineLink(session.venue) ? "Online" : session.venue}` : "";
    const goingLine = goingCount > 0 ? `\n\n${goingCount} ${goingCount === 1 ? "person" : "people"} already in 🙌` : "";
    const descSnippet = session.description
      ? `\n\n_${session.description.slice(0, 120)}${session.description.length > 120 ? "…" : ""}_`
      : "";
    const text =
      `Hey folks! *${hostFirst}* is hosting:\n\n` +
      `*${session.title}*\n` +
      `🗓 ${dayLabel} · ${time}` +
      venueLine +
      descSnippet +
      goingLine +
      `\n\nRSVP here → ${sessionUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({ title: session.title, text, url: sessionUrl });
        return;
      } catch {
        /* user cancelled */
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  }

  async function handleCopyLink() {
    tap();
    try {
      await navigator.clipboard.writeText(sessionUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", sessionUrl);
    }
  }

  function handleVenueClick() {
    if (!session.venue) return;
    tap();
    if (isOnlineLink(session.venue)) {
      // Open the meeting link directly
      const url = session.venue.startsWith("http") ? session.venue : `https://${session.venue}`;
      window.open(url, "_blank");
    } else {
      window.open(
        `https://maps.google.com/?q=${encodeURIComponent(session.venue + ", ISB Mohali")}`,
        "_blank"
      );
    }
  }

  return (
    <div style={{ height: "100vh", position: "relative", background: COLOR.bg }}>
      {/* Floating back button */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 80,
          padding: "16px 16px 10px",
          pointerEvents: "none",
        }}
      >
        <button
          onClick={() => {
            tap();
            onBack();
          }}
          style={{
            pointerEvents: "all",
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${COLOR.border}`,
            borderRadius: 99,
            padding: "7px 16px 7px 12px",
            cursor: "pointer",
            color: COLOR.ink,
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            fontFamily: FONT.sans,
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      <div style={{ height: "100%", overflowY: "auto", paddingBottom: 130 }}>
        {/* Cover with title scrim */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <CoverBanner
            title={session.title}
            tag={session.tags?.[0]}
            height={240}
            showPill
            scrim
          />
        </motion.div>

        <div style={{ padding: "0 16px" }}>
          {/* Guest stack */}
          {goingCount > 0 && (
            <div className="card" style={{ padding: "14px 16px", marginTop: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex" }}>
                  {goingList.slice(0, 5).map((a, i) => {
                    const sec = sectionByCode(a.user?.section);
                    return (
                      <div
                        key={a.user_id}
                        style={{
                          marginLeft: i ? -10 : 0,
                          zIndex: 5 - i,
                          position: "relative",
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          background: sec?.color ?? COLOR.ink3,
                          border: `2px solid ${COLOR.surface}`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#fff",
                          fontSize: 12,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {(a.user?.name ?? "?")[0]}
                      </div>
                    );
                  })}
                  {goingCount > 5 && (
                    <div
                      style={{
                        marginLeft: -10,
                        width: 32,
                        height: 32,
                        borderRadius: 16,
                        background: COLOR.navyTint,
                        border: `2px solid ${COLOR.surface}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 10,
                        fontWeight: 800,
                        color: COLOR.navy,
                      }}
                    >
                      +{goingCount - 5}
                    </div>
                  )}
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: COLOR.ink,
                      fontFamily: FONT.sans,
                    }}
                  >
                    {goingCount} {goingCount === 1 ? "person" : "people"} going
                  </p>
                  {sectionCount > 0 && (
                    <p style={{ fontSize: 11, color: COLOR.ink3, fontFamily: FONT.sans }}>
                      from {sectionCount} {sectionCount === 1 ? "section" : "sections"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Date + Venue grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
              marginTop: goingCount > 0 ? 10 : 14,
            }}
          >
            {/* Date card → click opens Google Calendar */}
            <button
              onClick={() => window.open(googleCalendarUrl(eventForCal), "_blank")}
              className="card text-left"
              style={{ padding: 14 }}
            >
              <p
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  color: hostSection?.color ?? theme.strip,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 4,
                  fontFamily: FONT.sans,
                }}
              >
                {month}
              </p>
              <p
                style={{
                  fontFamily: FONT.serif,
                  fontSize: 32,
                  fontWeight: 500,
                  color: COLOR.ink,
                  lineHeight: 1,
                }}
              >
                {dayOfMonth}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: COLOR.ink2,
                  marginTop: 4,
                  fontWeight: 600,
                  fontFamily: FONT.sans,
                }}
              >
                {dayLabel} · {time}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: COLOR.navy,
                  fontWeight: 700,
                  marginTop: 6,
                  fontFamily: FONT.sans,
                }}
              >
                + Add to calendar
              </p>
            </button>

            {/* Venue card */}
            <button
              onClick={handleVenueClick}
              disabled={!session.venue}
              className="card text-left"
              style={{ padding: 14 }}
            >
              <div style={{ marginBottom: 6 }}>
                {isOnlineLink(session.venue) ? (
                  <span style={{ fontSize: 20 }}>💻</span>
                ) : (
                  <MapPin size={20} strokeWidth={1.75} style={{ color: COLOR.navy }} />
                )}
              </div>
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: COLOR.ink,
                  lineHeight: 1.3,
                  fontFamily: FONT.sans,
                }}
                className="line-clamp-1"
              >
                {isOnlineLink(session.venue)
                  ? "Online Session"
                  : session.venue?.split(",")[0] ?? "Venue TBD"}
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: COLOR.ink2,
                  marginTop: 3,
                  fontFamily: FONT.sans,
                }}
              >
                {isOnlineLink(session.venue)
                  ? session.venue!.includes("zoom") ? "Zoom" : session.venue!.includes("meet.google") ? "Google Meet" : "Video call"
                  : session.venue?.includes(",")
                    ? session.venue.split(",").slice(1).join(",").trim()
                    : "ISB Mohali"}
              </p>
              {session.venue && (
                <p
                  style={{
                    fontSize: 10,
                    color: COLOR.navy,
                    fontWeight: 700,
                    marginTop: 6,
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                    fontFamily: FONT.sans,
                  }}
                >
                  {isOnlineLink(session.venue) ? "Join call" : "Open Maps"} <ExternalLink size={9} />
                </p>
              )}
            </button>
          </div>

          {/* Hosted by */}
          {session.creator && (
            <div className="card" style={{ padding: "14px 16px", marginTop: 10 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: COLOR.ink3,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                  fontFamily: FONT.sans,
                }}
              >
                Hosted by
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    background: hostSection?.color ?? COLOR.navy,
                    color: "#fff",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 16,
                    fontWeight: 700,
                    flexShrink: 0,
                    border: `2px solid ${COLOR.surface}`,
                  }}
                >
                  {(session.creator.name ?? "?")[0]}
                </div>
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: COLOR.ink,
                      fontFamily: FONT.sans,
                    }}
                  >
                    {session.creator.name ?? "—"}
                  </p>
                  <SectionPill code={session.creator.section} size="sm" />
                </div>
              </div>
            </div>
          )}

          {/* About */}
          {session.description && (
            <div className="card" style={{ padding: "14px 16px", marginTop: 10 }}>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: COLOR.ink3,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                  fontFamily: FONT.sans,
                }}
              >
                About
              </p>
              <p
                style={{
                  fontSize: 13,
                  color: COLOR.ink2,
                  lineHeight: 1.65,
                  whiteSpace: "pre-wrap",
                  fontFamily: FONT.sans,
                }}
              >
                {session.description}
              </p>
            </div>
          )}

          {/* Going list */}
          {goingCount > 0 && (
            <div className="card" style={{ padding: "14px 16px", marginTop: 10 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: COLOR.ink3,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    fontFamily: FONT.sans,
                  }}
                >
                  Going ({goingCount})
                </p>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {goingList.map((a) => {
                  const sec = sectionByCode(a.user?.section);
                  return (
                    <div
                      key={a.user_id}
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <div
                        style={{
                          width: 30,
                          height: 30,
                          borderRadius: 15,
                          background: sec?.color ?? COLOR.ink3,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          border: `2px solid ${COLOR.surface}`,
                          flexShrink: 0,
                        }}
                      >
                        {(a.user?.name ?? "?")[0]}
                      </div>
                      <span
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color: COLOR.ink,
                          flex: 1,
                          fontFamily: FONT.sans,
                        }}
                        className="truncate"
                      >
                        {a.user?.name ?? "—"}
                      </span>
                      <SectionPill code={a.user?.section} size="sm" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Share row: WhatsApp + Copy link */}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <button
              onClick={handleShareWA}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 14,
                fontSize: 13,
                fontWeight: 700,
                background: "#25D366",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 7,
                fontFamily: FONT.sans,
              }}
            >
              <Share2 size={14} /> Share on WhatsApp
            </button>
            <button
              onClick={handleCopyLink}
              style={{
                padding: "12px 14px",
                borderRadius: 14,
                fontSize: 12,
                fontWeight: 700,
                background: COLOR.surface,
                color: shareCopied ? "#15803D" : COLOR.ink,
                border: `1.5px solid ${shareCopied ? "#86EFAC" : COLOR.border}`,
                cursor: "pointer",
                fontFamily: FONT.sans,
                whiteSpace: "nowrap",
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {shareCopied ? <Check size={13} /> : <ExternalLink size={13} />}
              {shareCopied ? "Copied" : "Copy link"}
            </button>
          </div>

          {/* Calendar provider menu (Google/Outlook/Apple) */}
          <div style={{ marginTop: 10 }}>
            <CalendarMenu event={eventForCal} fullWidth />
          </div>
        </div>
      </div>

      {/* Calendar prompt — slides in after RSVP going */}
      {showCalPrompt && myStatus === "going" && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            position: "absolute",
            bottom: 90,
            left: 16,
            right: 16,
            zIndex: 61,
            background: COLOR.navyTint,
            border: `1px solid ${COLOR.navy}22`,
            borderRadius: 14,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <span style={{ fontSize: 20 }}>📅</span>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: COLOR.navy, fontFamily: FONT.sans }}>
              Add to your calendar?
            </p>
            <p style={{ fontSize: 11, color: COLOR.ink2, fontFamily: FONT.sans }}>
              So you don't forget
            </p>
          </div>
          <button
            onClick={() => { window.open(googleCalendarUrl(eventForCal), "_blank"); setShowCalPrompt(false); }}
            style={{
              padding: "7px 14px",
              borderRadius: 8,
              background: COLOR.navy,
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              fontFamily: FONT.sans,
            }}
          >
            Add
          </button>
          <button
            onClick={() => setShowCalPrompt(false)}
            style={{
              padding: "7px 10px",
              borderRadius: 8,
              background: "transparent",
              color: COLOR.ink3,
              fontSize: 11,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
              fontFamily: FONT.sans,
            }}
          >
            Skip
          </button>
        </motion.div>
      )}

      {/* Sticky bottom RSVP bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: COLOR.surface,
          borderTop: `1px solid ${COLOR.border}`,
          padding: "12px 16px calc(env(safe-area-inset-bottom) + 18px)",
          zIndex: 60,
        }}
      >
        {myStatus === "going" ? (
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                flex: 1,
                padding: 13,
                borderRadius: 14,
                background: "#DCFCE7",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Check size={16} strokeWidth={2.5} style={{ color: "#15803D" }} />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#15803D",
                  fontFamily: FONT.sans,
                }}
              >
                You're going!
              </span>
            </div>
            <button
              onClick={() => handleRsvp("cant")}
              disabled={busy}
              style={{
                padding: "13px 14px",
                borderRadius: 14,
                background: COLOR.surface,
                border: `1.5px solid ${COLOR.border}`,
                fontSize: 12,
                fontWeight: 700,
                color: COLOR.ink2,
                cursor: "pointer",
                fontFamily: FONT.sans,
              }}
            >
              Change
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => handleRsvp("going")}
              disabled={busy}
              style={{
                flex: 2,
                padding: 14,
                borderRadius: 14,
                background: COLOR.navy,
                color: "#fff",
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                fontFamily: FONT.sans,
              }}
            >
              I'm Going
            </button>
            <button
              onClick={() => handleRsvp("maybe")}
              disabled={busy}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 14,
                background: myStatus === "maybe" ? COLOR.amberTint : COLOR.surface,
                color: myStatus === "maybe" ? COLOR.amber : COLOR.ink2,
                border: `1.5px solid ${myStatus === "maybe" ? COLOR.amber : COLOR.border}`,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: FONT.sans,
              }}
            >
              Maybe
            </button>
            <button
              onClick={() => handleRsvp("cant")}
              disabled={busy}
              style={{
                flex: 1,
                padding: 14,
                borderRadius: 14,
                background: COLOR.surface,
                color: COLOR.ink3,
                border: `1.5px solid ${COLOR.border}`,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: FONT.sans,
              }}
            >
              Can't
            </button>
          </div>
        )}
      </div>

      {/* Hidden DM affordance — visual cue host can be messaged in-bot */}
      {session.creator && session.creator.name && (
        <a
          href={`https://wa.me/?text=${encodeURIComponent(
            `Hey ${session.creator.name.split(" ")[0]} — about your Pulse session "${session.title}"…`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "none" }}
        >
          <MessageCircle size={1} />
        </a>
      )}
    </div>
  );
}
