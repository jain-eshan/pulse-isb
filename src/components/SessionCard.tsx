/**
 * SessionCard — v3 horizontal layout
 * 92px cover thumbnail (left) + event info (right). Clean, compact.
 */
import { format, isToday, isTomorrow } from "date-fns";
import { MapPin, Users, Check, Calendar } from "lucide-react";
import type { Session } from "../types";
import { COLOR, FONT, CATEGORY_COLOR } from "../lib/pulseTheme";
import { coverTheme } from "./CoverBanner";

type Props = { session: Session; onClick: () => void };

/** Generate a gradient background for sessions without cover images */
function gradientFallback(session: Session): string {
  const cat = session.category?.toLowerCase() ?? session.tags?.[0] ?? "professional";
  const palette = CATEGORY_COLOR[cat];
  if (palette) {
    return `linear-gradient(135deg, ${palette.accent}22 0%, ${palette.accent}44 100%)`;
  }
  const theme = coverTheme(session.tags?.[0]);
  return `linear-gradient(135deg, ${theme.from} 0%, ${theme.to} 100%)`;
}

export default function SessionCard({ session, onClick }: Props) {
  const start = new Date(session.starts_at);
  const going = session.rsvp_counts?.going ?? 0;
  const isGoing = session.my_rsvp === "going";

  const today = isToday(start);
  const tomorrow = isTomorrow(start);
  const dayLabel = today ? "Today" : tomorrow ? "Tomorrow" : format(start, "EEE, MMM d");
  const timeLabel = format(start, "h:mm a");

  return (
    <button
      onClick={onClick}
      className="text-left w-full"
      style={{
        display: "flex",
        background: COLOR.surface,
        borderRadius: 14,
        border: `1px solid ${COLOR.borderLight}`,
        overflow: "hidden",
        cursor: "pointer",
        transition: "box-shadow 0.2s, transform 0.2s",
        padding: 0,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* 92px cover thumbnail */}
      <div
        style={{
          width: 92,
          flexShrink: 0,
          borderRadius: "14px 0 0 14px",
          overflow: "hidden",
          background: session.cover_image_url
            ? `url(${session.cover_image_url}) center/cover`
            : gradientFallback(session),
          position: "relative",
        }}
      >
        {!session.cover_image_url && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0.2,
            }}
          >
            <Calendar size={28} strokeWidth={1.2} color={COLOR.ink3} />
          </div>
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          padding: "12px 14px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 4,
          minWidth: 0,
        }}
      >
        {/* Date row */}
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: COLOR.ink3,
            fontFamily: FONT.sans,
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <Calendar size={11} strokeWidth={2} />
          {dayLabel} · {timeLabel}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: COLOR.ink,
            lineHeight: 1.3,
            fontFamily: FONT.sans,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            margin: 0,
          }}
        >
          {session.title}
        </h3>

        {/* Host + venue row */}
        <div
          className="flex items-center gap-2"
          style={{ fontSize: 12, color: COLOR.ink2, fontFamily: FONT.sans }}
        >
          {session.creator && (
            <span className="flex items-center gap-1">
              <span
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: "50%",
                  background: COLOR.bgSoft,
                  border: `1px solid ${COLOR.borderLight}`,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  fontWeight: 700,
                  color: COLOR.ink2,
                  overflow: "hidden",
                }}
              >
                {session.creator.avatar_url ? (
                  <img src={session.creator.avatar_url} alt="" style={{ width: 14, height: 14, objectFit: "cover" }} />
                ) : (
                  (session.creator.name?.[0] ?? "?").toUpperCase()
                )}
              </span>
              {session.creator.name?.split(" ")[0]}
            </span>
          )}
          {session.venue && (
            <span className="flex items-center gap-1 truncate" style={{ color: COLOR.ink3 }}>
              <MapPin size={10} strokeWidth={1.75} />
              <span className="truncate">{session.venue.split(",")[0]}</span>
            </span>
          )}
        </div>

        {/* Going badge */}
        {(isGoing || going > 0) && (
          <div style={{ marginTop: 2 }}>
            {isGoing ? (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#059669",
                  background: "#ECFDF5",
                  padding: "2px 8px",
                  borderRadius: 99,
                  fontFamily: FONT.sans,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Check size={10} strokeWidth={2.5} /> Going
              </span>
            ) : (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: COLOR.ink3,
                  fontFamily: FONT.sans,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Users size={10} strokeWidth={1.75} /> {going} going
              </span>
            )}
          </div>
        )}
      </div>
    </button>
  );
}
