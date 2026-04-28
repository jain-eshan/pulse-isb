import { useState } from "react";
import { Plus, Calendar, Users } from "lucide-react";
import { useSessions } from "../hooks/useSessions";
import { useCampusActivity } from "../hooks/useCampusActivity";
import SessionCard from "../components/SessionCard";
import EmptyState from "../components/EmptyState";
import CampusHeatmap from "../components/CampusHeatmap";
import type { User, Session } from "../types";
import { COLOR } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";

type Props = {
  user: User;
  onOpen: (s: Session) => void;
  onCreate: () => void;
};

export default function Sessions({ user, onOpen, onCreate }: Props) {
  const { sessions, loading } = useSessions(user);
  const { locations, count: activeCount } = useCampusActivity();
  const [filter, setFilter] = useState<"all" | "mine">("all");
  const [showHeatmap, setShowHeatmap] = useState(false);

  const list =
    filter === "mine"
      ? sessions.filter((s) => s.my_rsvp === "going" || s.creator_id === user.id)
      : sessions;

  const first = user.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen" style={{ background: COLOR.bg }}>
      {/* Editorial header — no dark navy block */}
      <header className="px-5 md:px-8 pt-10 pb-6">
        <p className="t-label mb-2">Hey {first}</p>
        <h1 className="t-display mb-1" style={{ fontSize: 32 }}>
          This week on <span className="t-italic">Pulse</span>
        </h1>
        <p className="t-body max-w-md">
          Peer sessions, workshops, and the little moments that don't make it to the official calendar.
        </p>

        <div className="mt-6 flex gap-2 flex-wrap">
          <FilterPill label="All" active={filter === "all"} onClick={() => setFilter("all")} />
          <FilterPill label="My sessions" active={filter === "mine"} onClick={() => setFilter("mine")} />
          {/* Live campus activity pill */}
          <button
            onClick={() => { tap(); setShowHeatmap(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors"
            style={{
              background: activeCount > 0 ? "#DCFCE7" : COLOR.surface,
              color: activeCount > 0 ? "#15803D" : COLOR.ink3,
              border: `1.5px solid ${activeCount > 0 ? "#86EFAC" : COLOR.borderLight}`,
            }}
          >
            {activeCount > 0 && (
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "#16A34A" }}
              />
            )}
            <Users size={11} strokeWidth={2} />
            {activeCount > 0 ? `${activeCount} on campus` : "Campus map"}
          </button>
          <span className="flex-1" />
          <button
            onClick={() => { tap(); onCreate(); }}
            className="btn-primary hidden md:flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={2} /> Post a session
          </button>
        </div>
      </header>

      <main className="px-4 md:px-8 pb-28 space-y-3 max-w-2xl">
        {loading && <SkeletonList />}

        {!loading && list.length === 0 && (
          <EmptyState
            icon={Calendar}
            title={filter === "mine" ? "Nothing lined up yet" : "A quiet week so far"}
            desc={
              filter === "mine"
                ? "RSVP to a session, and it'll live here."
                : "Be the one to start something — your cohort is waiting."
            }
            cta={
              filter === "all" ? (
                <button
                  onClick={() => { tap(); onCreate(); }}
                  className="btn-primary"
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

      {/* Campus heatmap modal */}
      {showHeatmap && (
        <CampusHeatmap
          locations={locations}
          onClose={() => setShowHeatmap(false)}
        />
      )}

      {/* Mobile FAB */}
      <button
        onClick={() => { tap(); onCreate(); }}
        className="md:hidden fixed bottom-24 right-5 w-14 h-14 rounded-full flex items-center justify-center text-white z-30"
        style={{
          background: COLOR.navy,
          boxShadow: "0 8px 24px rgba(28,58,110,.35)",
        }}
        aria-label="Post a session"
      >
        <Plus size={22} strokeWidth={2.25} />
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
    <button onClick={onClick} className="chip" data-active={active}>
      {label}
    </button>
  );
}

function SkeletonList() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="h-3 w-24 rounded-full mb-3" style={{ background: COLOR.borderLight }} />
          <div className="h-5 w-3/4 rounded mb-2" style={{ background: COLOR.borderLight }} />
          <div className="h-3 w-1/2 rounded-full" style={{ background: COLOR.borderLight }} />
        </div>
      ))}
    </>
  );
}
