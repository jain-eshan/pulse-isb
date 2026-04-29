/**
 * Sessions / "Pulse" feed — Pulse Redesign v2
 * Header → filter chips → Featured Tonight (top event today) → "More this week" list →
 * Host CTA card. Mobile-first; matches Pulse Redesign.html PulseScreen.
 */
import { useMemo, useState } from "react";
import { isToday, isThisWeek, format } from "date-fns";
import { Plus, Calendar, MapPin, Users } from "lucide-react";
import { useSessions } from "../hooks/useSessions";
import SessionCard from "../components/SessionCard";
import EmptyState from "../components/EmptyState";
import CoverBanner, { coverTheme } from "../components/CoverBanner";
import SectionPill from "../components/SectionPill";
import { sectionByCode } from "../lib/sections";
import type { User, Session } from "../types";
import { COLOR, FONT } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";

type Props = {
  user: User;
  onOpen: (s: Session) => void;
  onCreate: () => void;
};

const FILTERS = ["All", "Today", "Consulting", "Product", "Social", "Academics", "Tech", "Mine"] as const;
type Filter = typeof FILTERS[number];

export default function Sessions({ user, onOpen, onCreate }: Props) {
  const { sessions, loading } = useSessions(user);
  const [filter, setFilter] = useState<Filter>("All");

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      if (filter === "All") return true;
      if (filter === "Today") return isToday(new Date(s.starts_at));
      if (filter === "Mine") return s.my_rsvp === "going" || s.creator_id === user.id;
      // Tag filters: case-insensitive match against session.tags
      const want = filter.toLowerCase();
      return s.tags?.some((t) => t.toLowerCase() === want);
    });
  }, [sessions, filter, user.id]);

  // Featured = the next session today, or first this-week session if none today
  const featured = useMemo(() => {
    const todayList = filtered.filter((s) => isToday(new Date(s.starts_at)));
    if (todayList.length > 0) return todayList[0];
    const weekList = filtered.filter((s) => isThisWeek(new Date(s.starts_at)));
    return weekList[0] ?? null;
  }, [filtered]);

  const rest = filtered.filter((s) => s.id !== featured?.id);
  const first = user.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen" style={{ background: COLOR.bg }}>
      {/* Editorial header */}
      <header className="px-5 md:px-8 pt-10 pb-4">
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: COLOR.ink3,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: FONT.sans,
          }}
        >
          Hey {first}
        </p>
        <h1
          className="mt-1"
          style={{
            fontFamily: FONT.serif,
            fontSize: 32,
            fontWeight: 500,
            color: COLOR.ink,
            lineHeight: 1.05,
          }}
        >
          This week on <em>Pulse</em>
        </h1>
        <p
          className="mt-2 max-w-md"
          style={{ fontSize: 14, color: COLOR.ink2, fontFamily: FONT.sans }}
        >
          Peer sessions, workshops, and the little moments that don't make the official calendar.
        </p>

        {/* Filter chips */}
        <div
          className="mt-5 flex gap-2"
          style={{ overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}
        >
          {FILTERS.map((f) => (
            <FilterPill
              key={f}
              label={f}
              active={filter === f}
              onClick={() => {
                tap();
                setFilter(f);
              }}
            />
          ))}
        </div>
      </header>

      <main className="px-4 md:px-8 pb-28 max-w-2xl">
        {loading && <SkeletonList />}

        {/* Featured Tonight */}
        {!loading && featured && (
          <section style={{ marginBottom: 18 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: COLOR.ink3,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                marginBottom: 8,
                fontFamily: FONT.sans,
              }}
            >
              {isToday(new Date(featured.starts_at))
                ? "Featured Tonight"
                : "Featured this week"}
            </p>
            <FeaturedCard session={featured} onOpen={() => onOpen(featured)} />
          </section>
        )}

        {/* Rest of the list */}
        {!loading && rest.length > 0 && (
          <>
            {featured && (
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: COLOR.ink3,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                  fontFamily: FONT.sans,
                }}
              >
                More this week
              </p>
            )}
            <div className="space-y-3">
              {rest.map((s) => (
                <SessionCard key={s.id} session={s} onClick={() => onOpen(s)} />
              ))}
            </div>
          </>
        )}

        {!loading && filtered.length === 0 && (
          <EmptyState
            icon={Calendar}
            title={filter === "Mine" ? "Nothing lined up yet" : "A quiet week so far"}
            desc={
              filter === "Mine"
                ? "RSVP to a session, and it'll live here."
                : "Be the one to start something — your cohort is waiting."
            }
            cta={
              filter !== "Mine" ? (
                <button onClick={() => { tap(); onCreate(); }} className="btn-primary">
                  Post a session
                </button>
              ) : undefined
            }
          />
        )}

        {/* Host CTA card — always at the bottom */}
        {!loading && (
          <div
            style={{
              margin: "20px 0 0",
              padding: "18px 20px",
              borderRadius: 20,
              background: COLOR.navyTint,
              border: `1px solid ${COLOR.borderLight}`,
            }}
          >
            <p
              style={{
                fontFamily: FONT.serif,
                fontSize: 18,
                fontWeight: 500,
                color: COLOR.navy,
                marginBottom: 4,
              }}
            >
              Something happening?
            </p>
            <p
              style={{
                fontSize: 12,
                color: COLOR.ink2,
                marginBottom: 12,
                fontFamily: FONT.sans,
              }}
            >
              Post a session and your cohort will find it instantly.
            </p>
            <button
              onClick={() => { tap(); onCreate(); }}
              style={{
                padding: "9px 18px",
                borderRadius: 10,
                background: COLOR.navy,
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                border: "none",
                cursor: "pointer",
                fontFamily: FONT.sans,
              }}
            >
              Post a session
            </button>
          </div>
        )}
      </main>

      {/* Mobile FAB — slightly higher to clear the raised "+" nav button */}
      <button
        onClick={() => { tap(); onCreate(); }}
        className="md:hidden fixed bottom-28 right-5 w-12 h-12 rounded-full items-center justify-center text-white z-30 hidden"
        style={{
          background: COLOR.navy,
          boxShadow: "0 6px 20px rgba(28,58,110,.35)",
          display: "none",
        }}
        aria-label="Post a session"
      >
        <Plus size={20} strokeWidth={2.25} />
      </button>
    </div>
  );
}

/* ─── Featured card ─── */
function FeaturedCard({ session, onOpen }: { session: Session; onOpen: () => void }) {
  const start = new Date(session.starts_at);
  const day = isToday(start) ? "Today" : format(start, "EEE, d MMM");
  const time = format(start, "h:mm a");
  const going = session.rsvp_counts?.going ?? 0;
  const sec = sectionByCode(session.creator?.section);
  const theme = coverTheme(session.tags?.[0]);

  return (
    <button
      onClick={onOpen}
      className="text-left w-full"
      style={{
        borderRadius: 22,
        overflow: "hidden",
        boxShadow: "0 8px 32px rgba(0,0,0,0.10)",
        background: COLOR.surface,
        border: `1px solid ${COLOR.border}`,
        cursor: "pointer",
      }}
    >
      <CoverBanner title={session.title} tag={session.tags?.[0]} height={170} showPill />
      <div style={{ padding: "14px 16px 16px" }}>
        {/* Avatar stack + going */}
        {going > 0 && (
          <div className="flex items-center gap-2 mb-2.5">
            <div className="flex">
              {Array.from({ length: Math.min(4, going) }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    marginLeft: i ? -8 : 0,
                    zIndex: 4 - i,
                    width: 26,
                    height: 26,
                    borderRadius: 13,
                    background: i === 0 && sec ? sec.color : theme.strip,
                    color: "#fff",
                    border: `2px solid ${COLOR.surface}`,
                    fontSize: 10,
                    fontWeight: 700,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {String.fromCharCode(65 + ((i * 7) % 26))}
                </div>
              ))}
            </div>
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: COLOR.ink2,
                fontFamily: FONT.sans,
              }}
            >
              {going} batchmate{going === 1 ? "" : "s"} going
            </span>
          </div>
        )}

        {/* Host + section */}
        {session.creator && (
          <div className="flex items-center gap-1.5 mb-2">
            <span style={{ fontSize: 12, color: COLOR.ink2, fontFamily: FONT.sans }}>
              by <strong style={{ color: COLOR.ink }}>{session.creator.name}</strong>
            </span>
            <SectionPill code={session.creator.section} size="sm" />
          </div>
        )}

        {/* Venue + time */}
        <div className="flex items-center gap-1.5 flex-wrap" style={{ fontSize: 12, color: COLOR.ink2 }}>
          {session.venue && (
            <>
              <MapPin size={12} strokeWidth={1.75} style={{ color: COLOR.ink3 }} />
              <span style={{ fontFamily: FONT.sans }}>{session.venue}</span>
              <span style={{ fontSize: 11, color: COLOR.ink3 }}>·</span>
            </>
          )}
          <span style={{ fontFamily: FONT.sans }}>{day} · {time}</span>
        </div>

        {/* RSVP CTA */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          style={{
            width: "100%",
            marginTop: 12,
            padding: 11,
            borderRadius: 12,
            background: COLOR.navy,
            color: "#fff",
            fontSize: 13,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            fontFamily: FONT.sans,
          }}
        >
          {session.my_rsvp === "going" ? (
            <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Users size={13} /> See who's going
            </span>
          ) : (
            "RSVP Now"
          )}
        </button>
      </div>
    </button>
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
      style={{
        flexShrink: 0,
        padding: "6px 14px",
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        background: active ? COLOR.navy : COLOR.surface,
        color: active ? "#fff" : COLOR.ink2,
        border: `1.5px solid ${active ? COLOR.navy : COLOR.border}`,
        fontFamily: FONT.sans,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card p-5 animate-pulse">
          <div className="h-3 w-24 rounded-full mb-3" style={{ background: COLOR.borderLight }} />
          <div className="h-5 w-3/4 rounded mb-2" style={{ background: COLOR.borderLight }} />
          <div className="h-3 w-1/2 rounded-full" style={{ background: COLOR.borderLight }} />
        </div>
      ))}
    </div>
  );
}
