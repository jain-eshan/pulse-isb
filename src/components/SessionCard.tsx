/**
 * SessionCard — Luma-inspired horizontal layout
 * Cover image (or gradient fallback) on the left, event info on the right.
 */
import { motion } from "framer-motion";
import { format, isToday, isTomorrow } from "date-fns";
import { MapPin, Users, Check, Calendar } from "lucide-react";
import type { Session } from "../types";
import { COLOR, FONT, CATEGORY_COLOR } from "../lib/pulseTheme";
import { coverTheme } from "./CoverBanner";
import SectionPill from "./SectionPill";

type Props = { session: Session; onClick: () => void };

/** Generate a gradient background for sessions without cover images */
function gradientFallback(session: Session): string {
  const cat = session.category?.toLowerCase() ?? session.tags?.[0] ?? "professional";
  const palette = CATEGORY_COLOR[cat];
  if (palette) {
    return `linear-gradient(135deg, ${palette.accent}18 0%, ${palette.accent}40 100%)`;
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

  const cat = session.category?.toLowerCase() ?? session.tags?.[0] ?? "";
  const catColor = CATEGORY_COLOR[cat];

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className="card card-hover text-left w-full"
      style={{ overflow: "hidden", padding: 0 }}
    >
      <div style={{ display: "flex", minHeight: 120 }}>
        {/* Cover image / gradient thumbnail */}
        <div
          style={{
            width: 140,
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
            background: session.cover_image_url
              ? `url(${session.cover_image_url}) center/cover`
              : gradientFallback(session),
          }}
        >
          {/* Category badge on image */}
          {(session.subcategory || session.category) && (
            <span
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 6,
                background: session.cover_image_url
                  ? "rgba(0,0,0,0.5)"
                  : "rgba(255,255,255,0.85)",
                color: session.cover_image_url
                  ? "#fff"
                  : catColor?.accent ?? COLOR.ink2,
                fontFamily: FONT.sans,
                letterSpacing: "0.02em",
                backdropFilter: "blur(4px)",
              }}
            >
              {session.subcategory || session.category}
            </span>
          )}

          {/* Gradient icon for no-image cards */}
          {!session.cover_image_url && (
            <div
              style={{
                position: "absolute",
                bottom: 10,
                right: 10,
                opacity: 0.15,
              }}
            >
              <Calendar size={36} strokeWidth={1} color={catColor?.accent ?? COLOR.navy} />
            </div>
          )}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: 6,
            minWidth: 0,
          }}
        >
          {/* Date + Time row */}
          <div
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: catColor?.accent ?? COLOR.navy,
              fontFamily: FONT.sans,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Calendar size={12} strokeWidth={2} />
            <span>{dayLabel} &middot; {timeLabel}</span>
          </div>

          {/* Title */}
          <h3
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: COLOR.ink,
              lineHeight: 1.35,
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

          {/* Host */}
          {session.creator && (
            <div className="flex items-center gap-1.5">
              {session.creator.avatar_url ? (
                <img
                  src={session.creator.avatar_url}
                  alt=""
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: COLOR.bgSoft,
                    border: `1px solid ${COLOR.border}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 9,
                    fontWeight: 700,
                    color: COLOR.ink2,
                    fontFamily: FONT.sans,
                  }}
                >
                  {(session.creator.name?.[0] ?? "?").toUpperCase()}
                </div>
              )}
              <span style={{ fontSize: 12, color: COLOR.ink2, fontFamily: FONT.sans }}>
                {session.creator.name?.split(" ")[0] ?? "Unknown"}
              </span>
              <SectionPill code={session.creator.section} size="sm" />
            </div>
          )}

          {/* Bottom row: venue + going */}
          <div className="flex items-center gap-3" style={{ marginTop: 2 }}>
            {session.venue && (
              <span
                style={{
                  fontSize: 11,
                  color: COLOR.ink3,
                  fontFamily: FONT.sans,
                  display: "flex",
                  alignItems: "center",
                  gap: 3,
                  minWidth: 0,
                }}
                className="truncate"
              >
                <MapPin size={11} strokeWidth={1.75} />
                <span className="truncate">{session.venue.split(",")[0]}</span>
              </span>
            )}
            <span style={{ flex: 1 }} />
            {isGoing ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#059669",
                  background: "#ECFDF5",
                  padding: "3px 10px",
                  borderRadius: 99,
                  fontFamily: FONT.sans,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <Check size={11} strokeWidth={2.5} /> Going
              </span>
            ) : going > 0 ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: COLOR.ink2,
                  fontFamily: FONT.sans,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <Users size={11} strokeWidth={1.75} /> {going} going
              </span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
