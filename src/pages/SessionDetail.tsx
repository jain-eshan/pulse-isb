/**
 * SessionDetail — Luma-inspired redesign v3
 * Full-width cover → title below → icon info rows → host card → going list
 * Desktop: registration sidebar | Mobile: sticky bottom RSVP bar
 */
import { useEffect, useState } from "react";
import { format, isToday, isTomorrow } from "date-fns";
import {
  ArrowLeft,
  MapPin,
  Share2,
  ExternalLink,
  Check,
  Calendar,
  Edit3,
} from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useSessions } from "../hooks/useSessions";
import { fireConfetti } from "../components/Confetti";
import { sectionByCode } from "../lib/sections";
import SectionPill from "../components/SectionPill";
import CoverBanner from "../components/CoverBanner";
import CalendarMenu from "../components/CalendarMenu";
import { COLOR, FONT, CATEGORY_COLOR } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";
import { googleCalendarUrl } from "../lib/ics";
import type { Session, User, RsvpStatus } from "../types";

interface Attendee {
  user_id: string;
  status: RsvpStatus;
  user: { id: string; name: string; section: string; avatar_url?: string; ogsg?: number };
}

type Props = {
  session: Session;
  user: User;
  onBack: () => void;
  onEdit?: (session: Session) => void;
};

function isOnlineLink(venue?: string): boolean {
  if (!venue) return false;
  const v = venue.toLowerCase();
  return v.includes("zoom.us") || v.includes("meet.google.com") || v.includes("teams.microsoft.com") || v.startsWith("http");
}

export default function SessionDetail({ session, user, onBack, onEdit }: Props) {
  const { rsvp } = useSessions(user);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [busy, setBusy] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);
  const [showCalPrompt, setShowCalPrompt] = useState(false);

  const myStatus = attendees.find((a) => a.user_id === user.id)?.status;
  const goingList = attendees.filter((a) => a.status === "going");
  const goingCount = goingList.length;
  const isCreator = session.creator_id === user.id;

  const startsAt = new Date(session.starts_at);
  const today = isToday(startsAt);
  const tomorrow = isTomorrow(startsAt);
  const dayLabel = today ? "Today" : tomorrow ? "Tomorrow" : format(startsAt, "EEEE, MMMM d");
  const time = format(startsAt, "h:mm a");

  const sessionUrl = `${window.location.origin}/?session=${session.id}`;
  const calDesc = [
    session.description,
    session.creator ? `Hosted by ${session.creator.name}` : null,
    goingCount > 0 ? `${goingCount} people going` : null,
    `RSVP & details: ${sessionUrl}`,
  ].filter(Boolean).join("\n\n");

  const eventForCal = {
    id: session.id,
    title: `${session.title} — Pulse ISB`,
    description: calDesc,
    starts_at: session.starts_at,
    ends_at: session.ends_at,
    venue: session.venue,
    url: sessionUrl,
  };

  const cat = session.category?.toLowerCase() ?? session.tags?.[0] ?? "";
  const catColor = CATEGORY_COLOR[cat];
  const hostSection = sectionByCode(session.creator?.section);

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
      .channel(`rsvps-${session.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "rsvps", filter: `session_id=eq.${session.id}` },
        fetchAttendees
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session.id]);

  async function handleRsvp(status: RsvpStatus) {
    tap();
    setBusy(true);
    try {
      await rsvp(session.id, status);
      if (status === "going") {
        fireConfetti();
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
    const goingLine = goingCount > 0 ? `\n\n${goingCount} ${goingCount === 1 ? "person" : "people"} already in` : "";
    const text =
      `Hey! *${hostFirst}* is hosting:\n\n` +
      `*${session.title}*\n` +
      `🗓 ${dayLabel} · ${time}` +
      venueLine +
      goingLine +
      `\n\nRSVP → ${sessionUrl}`;

    if (navigator.share) {
      try { await navigator.share({ title: session.title, text, url: sessionUrl }); return; } catch { /* cancelled */ }
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
      window.open(session.venue.startsWith("http") ? session.venue : `https://${session.venue}`, "_blank");
    } else {
      window.open(`https://maps.google.com/?q=${encodeURIComponent(session.venue + ", ISB Mohali")}`, "_blank");
    }
  }

  return (
    <div style={{ flex: 1, minHeight: 0, position: "relative", background: COLOR.bg, display: "flex", flexDirection: "column" }}>
      {/* Floating back + edit */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 80,
          padding: "16px 16px 10px",
          pointerEvents: "none",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => { tap(); onBack(); }}
          style={{
            pointerEvents: "all",
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            border: `1px solid ${COLOR.border}`,
            borderRadius: 99,
            padding: "7px 14px 7px 10px",
            cursor: "pointer",
            color: COLOR.ink,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            fontFamily: FONT.sans,
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        {isCreator && onEdit && (
          <button
            onClick={() => { tap(); onEdit(session); }}
            style={{
              pointerEvents: "all",
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(12px)",
              border: `1px solid ${COLOR.border}`,
              borderRadius: 99,
              padding: "7px 14px",
              cursor: "pointer",
              color: COLOR.navy,
              fontSize: 13,
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              fontFamily: FONT.sans,
            }}
          >
            <Edit3 size={13} /> Edit
          </button>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 16 }}>
        {/* Cover image or gradient */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {session.cover_image_url ? (
            <div
              style={{
                height: 260,
                background: `url(${session.cover_image_url}) center/cover`,
                position: "relative",
              }}
            >
              {(session.subcategory || session.category) && (
                <span
                  style={{
                    position: "absolute",
                    bottom: 14,
                    left: 16,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 12px",
                    borderRadius: 8,
                    background: "rgba(0,0,0,0.5)",
                    color: "#fff",
                    backdropFilter: "blur(6px)",
                    fontFamily: FONT.sans,
                    letterSpacing: "0.03em",
                  }}
                >
                  {session.subcategory || session.category}
                </span>
              )}
            </div>
          ) : (
            <CoverBanner
              title=""
              tag={session.tags?.[0]}
              height={240}
              showPill
              scrim={false}
            />
          )}
        </motion.div>

        <div style={{ padding: "0 16px", maxWidth: 640, margin: "0 auto" }}>
          {/* Title */}
          <h1
            style={{
              fontFamily: FONT.serif,
              fontSize: 26,
              fontWeight: 500,
              color: COLOR.ink,
              lineHeight: 1.2,
              marginTop: 20,
              marginBottom: 6,
            }}
          >
            {session.title}
          </h1>

          {/* Category + subcategory pill */}
          {(session.subcategory || session.category) && (
            <span
              style={{
                display: "inline-block",
                fontSize: 12,
                fontWeight: 600,
                padding: "4px 10px",
                borderRadius: 8,
                background: catColor?.tint ?? COLOR.bgSoft,
                color: catColor?.accent ?? COLOR.ink2,
                fontFamily: FONT.sans,
                marginBottom: 16,
              }}
            >
              {session.subcategory || session.category}
            </span>
          )}

          {/* Date row */}
          <InfoRow
            icon={<Calendar size={18} strokeWidth={1.5} color={COLOR.navy} />}
            title={dayLabel}
            subtitle={time + (session.ends_at ? ` – ${format(new Date(session.ends_at), "h:mm a")}` : "")}
            onClick={() => window.open(googleCalendarUrl(eventForCal), "_blank")}
            action="Add to calendar"
          />

          {/* Venue row */}
          {session.venue && (
            <InfoRow
              icon={
                isOnlineLink(session.venue)
                  ? <ExternalLink size={18} strokeWidth={1.5} color={COLOR.navy} />
                  : <MapPin size={18} strokeWidth={1.5} color={COLOR.navy} />
              }
              title={
                isOnlineLink(session.venue)
                  ? "Online Session"
                  : session.venue.split(",")[0]
              }
              subtitle={
                isOnlineLink(session.venue)
                  ? (session.venue.includes("zoom") ? "Zoom" : session.venue.includes("meet.google") ? "Google Meet" : "Video call")
                  : session.venue.includes(",")
                    ? session.venue.split(",").slice(1).join(",").trim()
                    : "ISB Mohali"
              }
              onClick={handleVenueClick}
              action={isOnlineLink(session.venue) ? "Join call" : "Open Maps"}
            />
          )}

          {/* Hosted by */}
          {session.creator && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "16px 0",
                borderBottom: `1px solid ${COLOR.borderLight}`,
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  background: hostSection?.color ?? COLOR.navy,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 17,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {session.creator.avatar_url ? (
                  <img
                    src={session.creator.avatar_url}
                    alt=""
                    style={{ width: 44, height: 44, borderRadius: 22, objectFit: "cover" }}
                  />
                ) : (
                  (session.creator.name ?? "?")[0].toUpperCase()
                )}
              </div>
              <div>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: COLOR.ink3,
                    fontFamily: FONT.sans,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 2,
                  }}
                >
                  Hosted by
                </p>
                <div className="flex items-center gap-2">
                  <p style={{ fontSize: 15, fontWeight: 700, color: COLOR.ink, fontFamily: FONT.sans }}>
                    {session.creator.name ?? "—"}
                  </p>
                  <SectionPill code={session.creator.section} size="sm" />
                </div>
              </div>
            </div>
          )}

          {/* About */}
          {session.description && (
            <div style={{ padding: "18px 0", borderBottom: `1px solid ${COLOR.borderLight}` }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: COLOR.ink3,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: 10,
                  fontFamily: FONT.sans,
                }}
              >
                About this event
              </p>
              <p
                style={{
                  fontSize: 14,
                  color: COLOR.ink2,
                  lineHeight: 1.7,
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
            <div style={{ padding: "18px 0", borderBottom: `1px solid ${COLOR.borderLight}` }}>
              <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
                <p
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: COLOR.ink3,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    fontFamily: FONT.sans,
                  }}
                >
                  Going ({goingCount})
                </p>
                {sectionCount > 1 && (
                  <span style={{ fontSize: 11, color: COLOR.ink3, fontFamily: FONT.sans }}>
                    {sectionCount} sections
                  </span>
                )}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {goingList.map((a) => {
                  const sec = sectionByCode(a.user?.section);
                  return (
                    <div
                      key={a.user_id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px 6px 6px",
                        borderRadius: 99,
                        background: COLOR.bgSoft,
                        border: `1px solid ${COLOR.borderLight}`,
                      }}
                    >
                      <div
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          background: sec?.color ?? COLOR.ink3,
                          color: "#fff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 11,
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {(a.user?.name ?? "?")[0]}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: COLOR.ink, fontFamily: FONT.sans }}>
                        {a.user?.name?.split(" ")[0] ?? "—"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Share + Calendar row */}
          <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
            <button
              onClick={handleShareWA}
              style={{
                flex: 1,
                padding: 12,
                borderRadius: 12,
                fontSize: 13,
                fontWeight: 700,
                background: "#25D366",
                color: "#fff",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                fontFamily: FONT.sans,
              }}
            >
              <Share2 size={14} /> Share
            </button>
            <button
              onClick={handleCopyLink}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                fontSize: 12,
                fontWeight: 700,
                background: COLOR.surface,
                color: shareCopied ? "#059669" : COLOR.ink,
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

          <div style={{ marginTop: 10, marginBottom: 10 }}>
            <CalendarMenu event={eventForCal} fullWidth />
          </div>
        </div>
      </div>

      {/* Calendar prompt after RSVP */}
      {showCalPrompt && myStatus === "going" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            flexShrink: 0,
            margin: "0 16px",
            background: COLOR.navyTint,
            border: `1px solid ${COLOR.navy}22`,
            borderRadius: 14,
            padding: "12px 14px",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Calendar size={20} strokeWidth={1.5} style={{ color: COLOR.navy, flexShrink: 0 }} />
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
            style={{ padding: "7px 14px", borderRadius: 8, background: COLOR.navy, color: "#fff", fontSize: 11, fontWeight: 700, border: "none", cursor: "pointer", fontFamily: FONT.sans }}
          >
            Add
          </button>
          <button
            onClick={() => setShowCalPrompt(false)}
            style={{ padding: "7px 10px", borderRadius: 8, background: "transparent", color: COLOR.ink3, fontSize: 11, fontWeight: 600, border: "none", cursor: "pointer", fontFamily: FONT.sans }}
          >
            Skip
          </button>
        </motion.div>
      )}

      {/* RSVP bar — flex item, always visible at bottom */}
      <div
        style={{
          flexShrink: 0,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderTop: `1px solid ${COLOR.borderLight}`,
          padding: "12px 16px 16px",
        }}
      >
        {myStatus === "going" ? (
          <div style={{ display: "flex", gap: 8 }}>
            <div
              style={{
                flex: 1,
                padding: 13,
                borderRadius: 14,
                background: "#ECFDF5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Check size={16} strokeWidth={2.5} style={{ color: "#059669" }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: "#059669", fontFamily: FONT.sans }}>
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
    </div>
  );
}

/* ─── Info Row Component ─── */
function InfoRow({
  icon,
  title,
  subtitle,
  onClick,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClick?: () => void;
  action?: string;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 0",
        borderBottom: `1px solid ${COLOR.borderLight}`,
        background: "transparent",
        border: "none",
        borderBottomWidth: 1,
        borderBottomStyle: "solid",
        borderBottomColor: COLOR.borderLight,
        cursor: onClick ? "pointer" : "default",
        width: "100%",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background: COLOR.bgSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: COLOR.ink, fontFamily: FONT.sans }}>
          {title}
        </p>
        <p style={{ fontSize: 12, color: COLOR.ink3, fontFamily: FONT.sans, marginTop: 1 }}>
          {subtitle}
        </p>
      </div>
      {action && (
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: COLOR.navy,
            fontFamily: FONT.sans,
            display: "flex",
            alignItems: "center",
            gap: 3,
            flexShrink: 0,
          }}
        >
          {action} <ExternalLink size={10} />
        </span>
      )}
    </Tag>
  );
}
