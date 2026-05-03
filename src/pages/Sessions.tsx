/**
 * Sessions / "Pulse" feed — Luma-inspired redesign v3
 * Category tabs → subcategory chips → Attending/Hosting toggle → event cards
 */
import { useMemo, useState } from "react";
import { isToday, isThisWeek, format } from "date-fns";
import { Plus, Calendar, MapPin, Users, Flame } from "lucide-react";
import { useSessions } from "../hooks/useSessions";
import SessionCard from "../components/SessionCard";
import EmptyState from "../components/EmptyState";
import CoverBanner, { coverTheme } from "../components/CoverBanner";
import SectionPill from "../components/SectionPill";
import { sectionByCode } from "../lib/sections";
import type { User, Session, EventCategory } from "../types";
import { COLOR, FONT, EVENT_CATEGORIES, SUBCATEGORIES, CATEGORY_COLOR } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";

type Props = {
  user: User;
  onOpen: (s: Session) => void;
  onCreate: () => void;
};

type ViewTab = "upcoming" | "attending" | "hosting";

export default function Sessions({ user, onOpen, onCreate }: Props) {
  const { sessions, loading } = useSessions(user);
  const [viewTab, setViewTab] = useState<ViewTab>("upcoming");
  const [category, setCategory] = useState<EventCategory | null>(null);
  const [subcategory, setSubcategory] = useState<string | null>(null);

  // Active subcategories based on selected category
  const activeSubcats = category ? SUBCATEGORIES[category] : [];

  const filtered = useMemo(() => {
    return sessions.filter((s) => {
      // View tab filter
      if (viewTab === "attending" && s.my_rsvp !== "going") return false;
      if (viewTab === "hosting" && s.creator_id !== user.id) return false;

      // Category filter
      if (category) {
        const sessionCat = s.category ?? inferCategory(s.tags);
        if (sessionCat?.toLowerCase() !== category.toLowerCase()) return false;
      }

      // Subcategory filter
      if (subcategory) {
        if (s.subcategory?.toLowerCase() !== subcategory.toLowerCase()) return false;
      }

      return true;
    });
  }, [sessions, viewTab, category, subcategory, user.id]);

  // Featured = next session today, or first this week
  const featured = useMemo(() => {
    if (viewTab !== "upcoming") return null;
    const todayList = filtered.filter((s) => isToday(new Date(s.starts_at)));
    if (todayList.length > 0) return todayList[0];
    const weekList = filtered.filter((s) => isThisWeek(new Date(s.starts_at)));
    return weekList[0] ?? null;
  }, [filtered, viewTab]);

  const rest = filtered.filter((s) => s.id !== featured?.id);
  const first = user.name?.split(" ")[0] || "there";

  return (
    <div className="min-h-screen" style={{ background: COLOR.bg }}>
      {/* Header */}
      <header className="px-5 md:px-8 pt-10 pb-2">
        <div className="flex items-center justify-between">
          <div>
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
                fontSize: 28,
                fontWeight: 500,
                color: COLOR.ink,
                lineHeight: 1.1,
              }}
            >
              Discover <em>events</em>
            </h1>
          </div>
          <button
            onClick={() => { tap(); onCreate(); }}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: COLOR.navy,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(28,58,110,0.2)",
            }}
            aria-label="Create event"
          >
            <Plus size={20} strokeWidth={2.5} />
          </button>
        </div>

        {/* View tabs: Upcoming / Attending / Hosting */}
        <div
          className="mt-5 flex gap-1"
          style={{
            background: COLOR.bgSoft,
            borderRadius: 12,
            padding: 4,
          }}
        >
          {(["upcoming", "attending", "hosting"] as ViewTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { tap(); setViewTab(tab); }}
              style={{
                flex: 1,
                padding: "8px 0",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: FONT.sans,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                background: viewTab === tab ? "#fff" : "transparent",
                color: viewTab === tab ? COLOR.ink : COLOR.ink3,
                boxShadow: viewTab === tab ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Category tabs */}
        <div
          className="mt-4 flex gap-2"
          style={{ overflowX: "auto", paddingBottom: 2, scrollbarWidth: "none" }}
        >
          <CategoryPill
            label="All"
            active={!category}
            color={COLOR.navy}
            onClick={() => { tap(); setCategory(null); setSubcategory(null); }}
          />
          {EVENT_CATEGORIES.map((cat) => {
            const pal = CATEGORY_COLOR[cat.toLowerCase()];
            return (
              <CategoryPill
                key={cat}
                label={cat}
                active={category === cat}
                color={pal?.accent ?? COLOR.navy}
                onClick={() => {
                  tap();
                  setCategory(category === cat ? null : cat);
                  setSubcategory(null);
                }}
              />
            );
          })}
        </div>

        {/* Subcategory chips — appear when a category is selected */}
        {activeSubcats.length > 0 && (
          <div
            className="mt-2.5 flex gap-2"
            style={{ overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}
          >
            {activeSubcats.map((sub) => (
              <button
                key={sub}
                onClick={() => { tap(); setSubcategory(subcategory === sub ? null : sub); }}
                style={{
                  flexShrink: 0,
                  padding: "5px 12px",
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: 500,
                  background: subcategory === sub
                    ? (CATEGORY_COLOR[category!.toLowerCase()]?.accent ?? COLOR.navy) + "14"
                    : COLOR.bgSoft,
                  color: subcategory === sub
                    ? CATEGORY_COLOR[category!.toLowerCase()]?.accent ?? COLOR.navy
                    : COLOR.ink2,
                  border: `1px solid ${
                    subcategory === sub
                      ? (CATEGORY_COLOR[category!.toLowerCase()]?.accent ?? COLOR.navy) + "40"
                      : COLOR.borderLight
                  }`,
                  fontFamily: FONT.sans,
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {sub}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="px-4 md:px-8 pb-28 pt-4 max-w-2xl">
        {loading && <SkeletonList />}

        {/* Featured event */}
        {!loading && featured && (
          <section style={{ marginBottom: 20 }}>
            <SectionLabel>
              <Flame size={12} strokeWidth={2} />
              {isToday(new Date(featured.starts_at)) ? "Featured today" : "Featured this week"}
            </SectionLabel>
            <FeaturedCard session={featured} onOpen={() => onOpen(featured)} />
          </section>
        )}

        {/* Event list */}
        {!loading && rest.length > 0 && (
          <>
            {featured && (
              <SectionLabel>
                {viewTab === "attending"
                  ? "Your events"
                  : viewTab === "hosting"
                  ? "Events you're hosting"
                  : "More events"}
              </SectionLabel>
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
            title={
              viewTab === "attending"
                ? "Nothing lined up yet"
                : viewTab === "hosting"
                ? "You haven't hosted anything yet"
                : "No events found"
            }
            desc={
              viewTab === "attending"
                ? "RSVP to an event and it'll show up here."
                : viewTab === "hosting"
                ? "Create your first event — your cohort is waiting."
                : category
                ? `No ${category.toLowerCase()} events right now. Be the first to create one!`
                : "Be the one to start something — your cohort is waiting."
            }
            cta={
              <button
                onClick={() => { tap(); onCreate(); }}
                className="btn-primary"
              >
                Create an event
              </button>
            }
          />
        )}

        {/* Host CTA card */}
        {!loading && viewTab === "upcoming" && filtered.length > 0 && (
          <div
            style={{
              margin: "24px 0 0",
              padding: "20px",
              borderRadius: 16,
              background: `linear-gradient(135deg, ${COLOR.navyTint} 0%, #fff 100%)`,
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
                fontSize: 13,
                color: COLOR.ink2,
                marginBottom: 14,
                fontFamily: FONT.sans,
                lineHeight: 1.5,
              }}
            >
              Post an event and your cohort will find it instantly.
            </p>
            <button
              onClick={() => { tap(); onCreate(); }}
              className="btn-primary"
              style={{ padding: "10px 20px", fontSize: 13 }}
            >
              <Plus size={14} strokeWidth={2} style={{ display: "inline", verticalAlign: "-2px", marginRight: 6 }} />
              Create event
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Infer category from legacy tags ─── */
function inferCategory(tags?: string[]): EventCategory | null {
  if (!tags?.length) return null;
  const t = tags[0].toLowerCase();
  if (["social", "party", "games", "movies"].includes(t)) return "Social";
  if (["product", "consulting", "tech", "careers", "academics"].includes(t)) return "Professional";
  return null;
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
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        background: COLOR.surface,
        border: `1px solid ${COLOR.borderLight}`,
        cursor: "pointer",
      }}
    >
      {/* Cover image or gradient */}
      {session.cover_image_url ? (
        <div
          style={{
            height: 180,
            background: `url(${session.cover_image_url}) center/cover`,
          }}
        />
      ) : (
        <CoverBanner title="" tag={session.tags?.[0]} height={180} showPill />
      )}

      <div style={{ padding: "16px 18px 18px" }}>
        {/* Title */}
        <h3
          style={{
            fontFamily: FONT.sans,
            fontSize: 18,
            fontWeight: 700,
            color: COLOR.ink,
            lineHeight: 1.3,
            marginBottom: 8,
          }}
        >
          {session.title}
        </h3>

        {/* Date + venue row */}
        <div className="flex items-center gap-4 mb-3" style={{ fontSize: 13, color: COLOR.ink2, fontFamily: FONT.sans }}>
          <span className="flex items-center gap-1.5">
            <Calendar size={13} strokeWidth={1.75} style={{ color: COLOR.ink3 }} />
            {day} &middot; {time}
          </span>
          {session.venue && (
            <span className="flex items-center gap-1.5 truncate">
              <MapPin size={13} strokeWidth={1.75} style={{ color: COLOR.ink3 }} />
              <span className="truncate">{session.venue}</span>
            </span>
          )}
        </div>

        {/* Host + avatars */}
        <div className="flex items-center justify-between">
          {session.creator && (
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  background: sec?.color ?? theme.strip,
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {(session.creator.name?.[0] ?? "?").toUpperCase()}
              </div>
              <span style={{ fontSize: 13, color: COLOR.ink2, fontFamily: FONT.sans }}>
                {session.creator.name}
              </span>
              <SectionPill code={session.creator.section} size="sm" />
            </div>
          )}

          {going > 0 && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: COLOR.ink2,
                fontFamily: FONT.sans,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <Users size={13} strokeWidth={1.75} />
              {going} going
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ─── Sub-components ─── */
function CategoryPill({
  label,
  active,
  color,
  onClick,
}: {
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flexShrink: 0,
        padding: "7px 16px",
        borderRadius: 99,
        fontSize: 13,
        fontWeight: 600,
        background: active ? color : COLOR.surface,
        color: active ? "#fff" : COLOR.ink2,
        border: `1.5px solid ${active ? color : COLOR.border}`,
        fontFamily: FONT.sans,
        cursor: "pointer",
        transition: "all 0.15s",
      }}
    >
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: COLOR.ink3,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        marginBottom: 10,
        fontFamily: FONT.sans,
        display: "flex",
        alignItems: "center",
        gap: 5,
      }}
    >
      {children}
    </p>
  );
}

function SkeletonList() {
  return (
    <div className="space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card animate-pulse" style={{ display: "flex", height: 120 }}>
          <div style={{ width: 140, background: COLOR.bgSoft }} />
          <div style={{ flex: 1, padding: 16 }}>
            <div className="h-3 w-24 rounded-full mb-3" style={{ background: COLOR.borderLight }} />
            <div className="h-4 w-3/4 rounded mb-2" style={{ background: COLOR.borderLight }} />
            <div className="h-3 w-1/2 rounded-full" style={{ background: COLOR.borderLight }} />
          </div>
        </div>
      ))}
    </div>
  );
}
