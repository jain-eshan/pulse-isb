import { motion } from "framer-motion";
import { format, isToday, isTomorrow } from "date-fns";
import type { Session } from "../types";
import { INTEREST_COLOR } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";

type Props = {
  session: Session;
  onClick: () => void;
};

export default function SessionCard({ session, onClick }: Props) {
  const start = new Date(session.starts_at);
  const whenLabel = isToday(start)
    ? `Today · ${format(start, "h:mm a")}`
    : isTomorrow(start)
      ? `Tomorrow · ${format(start, "h:mm a")}`
      : format(start, "EEE d MMM · h:mm a");

  const topTag = session.tags[0];
  const accent = topTag ? (INTEREST_COLOR[topTag] ?? "#4f6ef7") : "#4f6ef7";

  return (
    <motion.button
      onClick={() => { tap(); onClick(); }}
      whileTap={{ scale: 0.98 }}
      className="w-full text-left bg-white border border-gray-100 rounded-3xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div
        className="px-5 py-3 text-white"
        style={{ background: `linear-gradient(135deg, ${accent}cc, ${accent}88)` }}
      >
        <p className="text-xs uppercase tracking-wider opacity-90 font-medium">{whenLabel}</p>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-gray-900 text-base leading-snug mb-1">{session.title}</h3>
        {session.venue && (
          <p className="text-sm text-gray-500 mb-3">📍 {session.venue}</p>
        )}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {session.tags.slice(0, 3).map((t) => (
            <span
              key={t}
              className="px-2.5 py-0.5 rounded-full text-xs font-medium"
              style={{
                background: `${INTEREST_COLOR[t] ?? "#4f6ef7"}18`,
                color: INTEREST_COLOR[t] ?? "#2d43cc",
              }}
            >
              #{t}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-400">
            {session.rsvp_counts?.going ?? 0} going
            {session.creator?.name ? ` · ${session.creator.name.split(" ")[0]}` : ""}
          </p>
          {session.my_rsvp === "going" && (
            <span className="text-xs font-semibold text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
              ✓ You&apos;re in
            </span>
          )}
          {session.my_rsvp === "maybe" && (
            <span className="text-xs font-semibold text-yellow-700 bg-yellow-100 px-2.5 py-1 rounded-full">
              Maybe
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
}
