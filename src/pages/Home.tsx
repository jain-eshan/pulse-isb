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
      <header className="px-5 md:px-8 pt-10 pb-2 max-w-2xl">
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

        {/* Filter tabs */}
        <div
          className="mt-5 flex gap-2"
          style={{ overflowX: "auto", paddingBottom: 4, scrollbarWidth: "none" }}
        >
          {DISCOVER_TABS.map((t) => (
            <button
              key={t}
              onClick={() => { tap(); setTab(t); }}
              style={{
                flexShrink: 0,
                padding: "7px 16px",
                borderRadius: 99,
                fontSize: 13,
                fontWeight: 600,
                background: tab === t ? COLOR.navy : COLOR.surface,
                color: tab === t ? "#fff" : COLOR.ink2,
                border: `1.5px solid ${tab === t ? COLOR.navy : COLOR.border}`,
                fontFamily: FONT.sans,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="px-4 md:px-8 pt-4 max-w-2xl">
        {/* Place cards */}
        <div className="space-y-4">
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

/* ─── Place Card ─── */
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
    <article className="card card-hover" style={{ overflow: "hidden" }}>
      {/* Photo section */}
      {hasImage ? (
        <div
          style={{
            height: 180,
            background: `url(${p.image_url}) center/cover`,
            position: "relative",
          }}
        >
          {/* Category badge */}
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 8,
              background: "rgba(0,0,0,0.5)",
              color: "#fff",
              backdropFilter: "blur(4px)",
              fontFamily: FONT.sans,
              textTransform: "capitalize",
            }}
          >
            {p.category}
          </span>

          {/* Rating badge */}
          {p.google_rating && (
            <span
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                fontSize: 12,
                fontWeight: 700,
                padding: "4px 10px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.9)",
                color: COLOR.ink,
                fontFamily: FONT.sans,
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Star size={12} fill="#F59E0B" color="#F59E0B" />
              {p.google_rating}
            </span>
          )}
        </div>
      ) : (
        /* Gradient placeholder for places without images */
        <div
          style={{
            height: 100,
            background: `linear-gradient(135deg, ${COLOR.navyTint} 0%, ${COLOR.bgSoft} 100%)`,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MapPin size={28} strokeWidth={1} style={{ color: COLOR.navy, opacity: 0.2 }} />
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              fontSize: 11,
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: 8,
              background: COLOR.surface,
              color: COLOR.ink2,
              fontFamily: FONT.sans,
              textTransform: "capitalize",
              border: `1px solid ${COLOR.borderLight}`,
            }}
          >
            {p.category}
          </span>
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "14px 16px 16px" }}>
        <h3
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: COLOR.ink,
            fontFamily: FONT.sans,
            lineHeight: 1.3,
            marginBottom: 4,
          }}
        >
          {p.name}
        </h3>

        {/* Area + distance */}
        {p.area && (
          <p
            style={{
              fontSize: 13,
              color: COLOR.ink3,
              fontFamily: FONT.sans,
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginBottom: 6,
            }}
          >
            <Navigation size={12} strokeWidth={1.75} />
            {p.area}
            {p.distance_from_campus && <span> &middot; {p.distance_from_campus}</span>}
          </p>
        )}

        {/* Description */}
        {p.description && (
          <p
            style={{
              fontSize: 13,
              color: COLOR.ink2,
              lineHeight: 1.6,
              fontFamily: FONT.sans,
              marginBottom: 10,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {p.description}
          </p>
        )}

        {/* Rating + Budget row */}
        <div className="flex items-center gap-3 mb-3">
          {p.google_rating && !p.image_url && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                fontFamily: FONT.sans,
                display: "flex",
                alignItems: "center",
                gap: 3,
                color: COLOR.ink,
              }}
            >
              <Star size={13} fill="#F59E0B" color="#F59E0B" />
              {p.google_rating}
              {p.review_count && (
                <span style={{ color: COLOR.ink3, fontWeight: 400 }}>({p.review_count})</span>
              )}
            </span>
          )}
          {p.budget && (
            <span
              style={{
                fontSize: 12,
                fontWeight: 600,
                padding: "3px 8px",
                borderRadius: 6,
                background:
                  p.budget === "low" ? "#ECFDF5" : p.budget === "high" ? "#F0EAFF" : "#FEF3C7",
                color:
                  p.budget === "low" ? "#059669" : p.budget === "high" ? "#7C3AED" : "#D97706",
                fontFamily: FONT.sans,
                textTransform: "capitalize",
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
              padding: "10px 0",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              background: COLOR.bgSoft,
              color: COLOR.ink,
              border: `1px solid ${COLOR.border}`,
              textAlign: "center",
              textDecoration: "none",
              fontFamily: FONT.sans,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              cursor: "pointer",
            }}
          >
            <MapPin size={14} strokeWidth={1.75} /> Maps
            <ExternalLink size={10} style={{ opacity: 0.5 }} />
          </a>
          <button
            onClick={onHostHere}
            style={{
              flex: 1,
              padding: "10px 0",
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 700,
              background: COLOR.navyTint,
              color: COLOR.navy,
              border: `1px solid ${COLOR.navy}22`,
              fontFamily: FONT.sans,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              cursor: "pointer",
            }}
          >
            <Plus size={14} strokeWidth={2} /> Host here
          </button>
        </div>
      </div>
    </article>
  );
}
