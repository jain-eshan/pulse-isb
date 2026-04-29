/**
 * SessionCard — Pulse Redesign v2
 * Date block on the left, content on the right, gradient strip on top.
 * Matches Pulse Redesign.html EventListCard exactly.
 */
import { motion } from "framer-motion";
import { format, isToday, isTomorrow } from "date-fns";
import { MapPin, Users, Check } from "lucide-react";
import type { Session } from "../types";
import { COLOR, FONT } from "../lib/pulseTheme";
import { coverTheme } from "./CoverBanner";
import SectionPill from "./SectionPill";

type Props = { session: Session; onClick: () => void };

export default function SessionCard({ session, onClick }: Props) {
  const start = new Date(session.starts_at);
  const topTag = session.tags?.[0];
  const theme = coverTheme(topTag);

  const going = session.rsvp_counts?.going ?? 0;
  const isGoing = session.my_rsvp === "going";

  // Date label — "Today / Tom / Wed" + day number + time
  const today = isToday(start);
  const tomorrow = isTomorrow(start);
  const dayLabel = today ? "Today" : tomorrow ? "Tom" : format(start, "EEE");
  const dayNum = format(start, "d");
  const timeLabel = format(start, "h:mm a");

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className="card card-hover text-left w-full"
      style={{ overflow: "hidden", padding: 0 }}
    >
      {/* Top gradient strip (3px) */}
      <div
        style={{
          height: 3,
          background: `linear-gradient(90deg, ${theme.strip}, ${theme.from}50)`,
        }}
      />

      <div
        style={{
          padding: "12px 14px 14px",
          display: "flex",
          gap: 12,
          alignItems: "flex-start",
        }}
      >
        {/* Date block (left) */}
        <div
          style={{
            width: 48,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 2,
          }}
        >
          <span
            style={{
              fontSize: 9,
              fontWeight: 800,
              color: theme.strip,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontFamily: FONT.sans,
            }}
          >
            {dayLabel}
          </span>
          <span
            style={{
              fontFamily: FONT.serif,
              fontSize: 28,
              fontWeight: 500,
              color: COLOR.ink,
              lineHeight: 1.1,
            }}
          >
            {dayNum}
          </span>
          <span
            style={{
              fontSize: 9,
              color: COLOR.ink3,
              fontWeight: 600,
              fontFamily: FONT.sans,
            }}
          >
            {timeLabel}
          </span>
        </div>

        {/* Content (right) */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: COLOR.ink,
              lineHeight: 1.3,
              marginBottom: 4,
              fontFamily: FONT.sans,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {session.title}
          </h3>

          {/* Host + section pill */}
          {session.creator && (
            <div className="flex items-center gap-1.5 mb-1.5">
              <span style={{ fontSize: 11, color: COLOR.ink2, fontFamily: FONT.sans }}>
                by {session.creator.name?.split(" ")[0] ?? "—"}
              </span>
              <SectionPill code={session.creator.section} size="sm" />
            </div>
          )}

          {/* Bottom row: venue + going / "Going" */}
          <div className="flex items-center gap-2">
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
                  color: "#15803D",
                  background: "#DCFCE7",
                  padding: "3px 9px",
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
            ) : (
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
                <Users size={11} strokeWidth={1.75} /> {going}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.button>
  );
}
