import { useState } from "react";
import { useSessions } from "../hooks/useSessions";
import SessionCard from "../components/SessionCard";
import EmptyState from "../components/EmptyState";
import type { User, Session } from "../types";
import { HEADER_GRADIENT, CTA_GRADIENT } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";

type Props = {
  user: User;
  onOpen: (s: Session) => void;
  onCreate: () => void;
};

export default function Sessions({ user, onOpen, onCreate }: Props) {
  const { sessions, loading } = useSessions(user);
  const [filter, setFilter] = useState<"all" | "mine">("all");

  const list =
    filter === "mine"
      ? sessions.filter(
          (s) => s.my_rsvp === "going" || s.creator_id === user.id
        )
      : sessions;

  return (
    <div className="min-h-screen pb-24 bg-[#f8f9ff]">
      <header className="px-5 pt-12 pb-6 text-white" style={{ background: HEADER_GRADIENT }}>
        <p className="text-white/60 text-sm mb-0.5">
          Hey {user.name.split(" ")[0]} 👋
        </p>
        <h1 className="text-2xl font-bold">This week on Pulse</h1>
        <div className="mt-4 flex gap-2">
          <FilterPill label="All" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterPill label="Going" active={filter === "mine"} onClick={() => setFilter("mine")} />
        </div>
      </header>

      <main className="px-4 mt-5 space-y-3 max-w-md mx-auto">
        {loading && <SkeletonList />}

        {!loading && list.length === 0 && (
          <EmptyState
            emoji="📅"
            title={filter === "mine" ? "Nothing yet" : "No sessions this week"}
            desc={
              filter === "mine"
                ? "RSVP to a session and it'll show up here."
                : "Be the one to start something. Your cohort is waiting 🚀"
            }
            cta={
              filter === "all" ? (
                <button
                  onClick={() => { tap(); onCreate(); }}
                  className="px-6 py-3 rounded-2xl font-semibold text-white text-sm"
                  style={{ background: CTA_GRADIENT }}
                >
                  Post a session
                </button>
              ) : undefined
            }
          />
        )}

        {list.map((s) => (
          <SessionCard key={s.id} session={s} onClick={() => onOpen(s)} />
        ))}
      </main>

      {/* FAB */}
      <button
        onClick={() => { tap(); onCreate(); }}
        className="fixed bottom-24 right-5 w-14 h-14 rounded-full shadow-xl flex items-center justify-center text-2xl text-white z-30"
        style={{ background: CTA_GRADIENT }}
        aria-label="Create session"
      >
        +
      </button>
    </div>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
        active ? "bg-white text-[#16213e]" : "bg-white/10 text-white hover:bg-white/20"
      }`}
    >
      {label}
    </button>
  );
}

function SkeletonList() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="bg-white rounded-3xl border border-gray-100 overflow-hidden animate-pulse"
        >
          <div className="h-10 bg-gray-100" />
          <div className="p-5 space-y-2">
            <div className="h-4 w-3/4 bg-gray-100 rounded-full" />
            <div className="h-3 w-1/2 bg-gray-100 rounded-full" />
            <div className="h-3 w-1/3 bg-gray-100 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
}
