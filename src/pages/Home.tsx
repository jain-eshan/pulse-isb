/**
 * Discover / Home — Luma-inspired redesign v3
 * Photo-forward place cards with category filters, Google Maps button,
 * ratings, and "Host event here" action.
 */
import { useMemo, useState } from "react";
import { MapPin, Star, ExternalLink, Plus, Navigation } from "lucide-react";
import type { User } from "../types";
import { COLOR, FONT } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";
import { usePlaces, type DBPlace } from "../hooks/usePlaces";

type Props = { user: User; onGoingClick: () => void; onHostHere?: (venue: string) => void };

const DISCOVER_TABS = ["All", "Restaurants", "Cafes", "Nightlife", "Trips"] as const;
type DiscoverTab = (typeof DISCOVER_TABS)[number];

// Map tab labels to DB category values
const TAB_CATEGORY_MAP: Record<string, string[]> = {
  Restaurants: ["food", "restaurant"],
  Cafes: ["cafe", "coffee"],
  Nightlife: ["nightlife", "bar", "pub"],
  Trips: ["travel", "trip"],
};

export default function Home({ user, onHostHere }: Props) {
  const first = user.name?.split(" ")[0] || "there";
  const { places } = usePlaces();
  const [tab, setTab] = useState<DiscoverTab>("All");

  const filtered = useMemo(() => {
    if (tab === "All") return places;
    const cats = TAB_CATEGORY_MAP[tab] ?? [];
    return places.filter((p) => cats.some((c) => p.category?.toLowerCase().includes(c)));
  }, [places, tab]);

  function handleHostHere(p: DBPlace) {
    tap();
    const venue = p.area ? `${p.name}, ${p.area}` : p.name;
    onHostHere?.(venue);
  }

  function mapsUrl(p: DBPlace): string {
    if (p.google_maps_url) return p.google_maps_url;
    return `https://maps.google.com/?q=${encodeURIComponent(p.name + " " + (p.area ?? ""))}`;
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: COLOR.bg }}>
      {/* Header */}
      <header className="px-5 md:px-8 pt-16 md:pt-10 pb-2 max-w-2xl">
        <p
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: COLOR.ink3,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            fontFamily: FONT.sans,
            marginBottom: 6,
          }}
        >
          Hey {first}
        </p>
        <h1
          style={{
            fontFamily: FONT.serif,
            fontSize: 28,
            fontWeight: 500,
            color: COLOR.ink,
            lineHeight: 1.1,
          }}
        >
          Discover <em>places</em>
        </h1>
        <p
          style={{
            fontSize: 14,
            color: COLOR.ink2,
            fontFamily: FONT.sans,
            marginTop: 6,
            maxWidth: 400,
          }}
        >
          Spots your cohort actually goes — vetted by batchmates.
        </p>

        {/* Filter tabs — v3 segmented control */}
        <div
          className="mt-5 flex gap-1"
          style={{ background: "#F0F0EE", borderRadius: 12, padding: 4, overflowX: "auto", scrollbarWidth: "none" }}
        >
          {DISCOVER_TABS.map((t) => (
            <button
              key={t}
              onClick={() => { tap(); setTab(t); }}
              style={{
                flex: 1,
                flexShrink: 0,
                padding: "8px 12px",
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: FONT.sans,
                border: "none",
                cursor: "pointer",
                transition: "all 0.15s",
                background: tab === t ? "#fff" : "transparent",
                color: tab === t ? COLOR.ink : COLOR.ink3,
                boxShadow: tab === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                whiteSpace: "nowrap",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 md:px-8 pt-4" style={{ maxWidth: 960 }}>
        {/* Place cards — responsive grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {filtered.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              mapsUrl={mapsUrl(p)}
              onHostHere={() => handleHostHere(p)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 20px",
              color: COLOR.ink3,
              fontFamily: FONT.sans,
            }}
          >
            <MapPin size={32} strokeWidth={1.5} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: COLOR.ink2 }}>
              No places found
            </p>
            <p style={{ fontSize: 13, marginTop: 4 }}>
              Try a different category or check back later.
            </p>
          </div>
        )}

        {/* Curated note */}
        {filtered.length > 0 && (
          <p
            style={{
              textAlign: "center",
              fontSize: 12,
              color: COLOR.ink3,
              fontFamily: FONT.sans,
              fontStyle: "italic",
              padding: "16px 0 8px",
            }}
          >
            New spots added weekly based on cohort recommendations
          </p>
        )}
      </main>
    </div>
  );
}

/* ─── Place Card — v3: photo-forward with name overlay ─── */
function PlaceCard({
  place: p,
  mapsUrl,
  onHostHere,
}: {
  place: DBPlace;
  mapsUrl: string;
  onHostHere: () => void;
}) {
  const hasImage = !!p.image_url;

  return (
    <article
      style={{
        borderRadius: 14,
        overflow: "hidden",
        background: COLOR.surface,
        border: `1px solid ${COLOR.borderLight}`,
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.08)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* Photo with name overlay */}
      <div
        style={{
          height: 160,
          position: "relative",
          overflow: "hidden",
          background: hasImage
            ? `url(${p.image_url}) center/cover`
            : `linear-gradient(135deg, ${COLOR.navyTint} 0%, ${COLOR.bgSoft} 100%)`,
        }}
      >
        {!hasImage && (
          <MapPin size={32} strokeWidth={1} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", color: COLOR.navy, opacity: 0.15 }} />
        )}
        {/* Gradient scrim */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)" }} />
        {/* Rating badge */}
        {p.google_rating && (
          <span
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              fontSize: 12,
              fontWeight: 700,
              padding: "3px 8px",
              borderRadius: 8,
              background: "rgba(255,255,255,0.92)",
              color: COLOR.ink,
              fontFamily: FONT.sans,
              display: "flex",
              alignItems: "center",
              gap: 3,
            }}
          >
            <Star size={11} fill="#F59E0B" color="#F59E0B" />
            {p.google_rating}
          </span>
        )}
        {/* Name overlay at bottom */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: FONT.sans, lineHeight: 1.25, textShadow: "0 1px 3px rgba(0,0,0,0.3)" }}>
            {p.name}
          </h3>
          {p.area && (
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontFamily: FONT.sans, display: "flex", alignItems: "center", gap: 3, marginTop: 2 }}>
              <Navigation size={10} strokeWidth={1.75} />
              {p.area}
              {p.distance_from_campus && <span> · {p.distance_from_campus}</span>}
            </p>
          )}
        </div>
      </div>

      {/* Content below image */}
      <div style={{ padding: "10px 14px 12px" }}>
        {/* Description */}
        {p.description && (
          <p
            style={{
              fontSize: 13,
              color: COLOR.ink2,
              lineHeight: 1.55,
              fontFamily: FONT.sans,
              marginBottom: 8,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {p.description}
          </p>
        )}

        {/* Budget + category */}
        <div className="flex items-center gap-2 mb-3">
          {p.category && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: COLOR.bgSoft, color: COLOR.ink3, fontFamily: FONT.sans, textTransform: "capitalize" }}>
              {p.category}
            </span>
          )}
          {p.budget && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 6,
                background: p.budget === "low" ? "#ECFDF5" : p.budget === "high" ? "#F0EAFF" : "#FEF3C7",
                color: p.budget === "low" ? "#059669" : p.budget === "high" ? "#7C3AED" : "#D97706",
                fontFamily: FONT.sans,
              }}
            >
              {p.budget === "low" ? "Budget" : p.budget === "high" ? "Premium" : "Mid-range"}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => tap()}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              background: COLOR.bgSoft,
              color: COLOR.ink,
              border: `1px solid ${COLOR.borderLight}`,
              textAlign: "center",
              textDecoration: "none",
              fontFamily: FONT.sans,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
            }}
          >
            <MapPin size={13} strokeWidth={1.75} /> Maps
            <ExternalLink size={9} style={{ opacity: 0.4 }} />
          </a>
          <button
            onClick={onHostHere}
            style={{
              flex: 1,
              padding: "8px 0",
              borderRadius: 10,
              fontSize: 12,
              fontWeight: 700,
              background: COLOR.ink,
              color: "#fff",
              border: "none",
              fontFamily: FONT.sans,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              cursor: "pointer",
            }}
          >
            <Plus size={13} strokeWidth={2} /> Host here
          </button>
        </div>
      </div>
    </article>
  );
}
