import { motion } from "framer-motion";
import { format, isToday, isTomorrow } from "date-fns";
import { MapPin, Users } from "lucide-react";
import type { Session } from "../types";
import { COLOR, INTEREST_COLOR, stripGradient } from "../lib/pulseTheme";

type Props = { session: Session; onClick: () => void };

export default function SessionCard({ session, onClick }: Props) {
  const start = new Date(session.starts_at);
  const topTag = session.tags[0];
  const cat = topTag ? INTEREST_COLOR[topTag] : undefined;
  const strip = cat?.strip ?? COLOR.navy;
  const tint = cat?.tint ?? COLOR.navyTint;
  const catLabel = cat?.label ?? "Session";

  const going = session.rsvp_counts?.going ?? 0;
  const mine = session.my_rsvp;

  const dayLabel = isToday(start)
    ? "Today"
    : isTomorrow(start)
    ? "Tomorrow"
    : format(start, "EEE d MMM");

  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.985 }}
      className="card card-hover text-left w-full"
    >
      {/* Category strip */}
      <div
        style={{
          height: 2,
          background: stripGradient(strip, tint),
        }}
      />

      <div className="px-5 pt-4 pb-5">
        {/* Cat label + time */}
        <div className="flex items-center justify-between mb-2">
          <span
            className="t-label"
            style={{ color: strip, letterSpacing: "0.1em" }}
          >
            {catLabel} · {session.venue?.split(",")[0] ?? "ISB Mohali"}
          </span>
          <span className="t-meta">
            {dayLabel} · {format(start, "h:mm a")}
          </span>
        </div>

        {/* Title */}
        <h3 className="t-card-title mb-2">{session.title}</h3>

        {/* Short description */}
        {session.description && (
          <p
            className="t-body mb-3"
            style={{
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            {session.description}
          </p>
        )}

        {/* Meta row */}
        <div
          className="flex items-center gap-4 pt-3 mt-1 border-t"
          style={{ borderColor: COLOR.divider }}
        >
          {session.venue && (
            <span
              className="flex items-center gap-1.5 t-meta"
              style={{ color: COLOR.ink2 }}
            >
              <MapPin size={13} strokeWidth={1.75} />
              {session.venue}
            </span>
          )}
          <span
            className="flex items-center gap-1.5 t-meta"
            style={{ color: COLOR.ink2 }}
          >
            <Users size={13} strokeWidth={1.75} />
            {going} going
          </span>

          <span className="flex-1" />

          {mine === "going" && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: COLOR.navyTint,
                color: COLOR.navy,
              }}
            >
              You're in
            </span>
          )}
          {mine === "maybe" && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: COLOR.amberTint,
                color: COLOR.amber,
              }}
            >
              Maybe
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
