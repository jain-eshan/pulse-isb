/**
 * Discover / Home — v3 with place detail drawer + ISB reviews
 */
import { useMemo, useState } from "react";
import {
  MapPin, Star, ExternalLink, Plus, Navigation,
  X, ChevronLeft, Pencil, Trash2, ArrowUpRight,
} from "lucide-react";
import type { User } from "../types";
import { COLOR, FONT } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";
import { usePlaces, type DBPlace } from "../hooks/usePlaces";
import { useReviews, type PlaceReview } from "../hooks/useReviews";

type Props = { user: User; onGoingClick: () => void; onHostHere?: (venue: string) => void };

const DISCOVER_TABS = ["All", "Restaurants", "Cafes", "Nightlife", "Trips"] as const;
type DiscoverTab = (typeof DISCOVER_TABS)[number];

const TAB_CATEGORY_MAP: Record<string, string[]> = {
  Restaurants: ["food", "restaurant"],
  Cafes:       ["cafe", "coffee"],
  Nightlife:   ["nightlife", "bar", "pub"],
  Trips:       ["travel", "trip"],
};

// Gradient backgrounds for places without images
const PLACE_GRADIENTS = [
  "linear-gradient(135deg, #1C3A6E 0%, #2D5299 100%)",
  "linear-gradient(135deg, #7C3AED 0%, #A78BFA 100%)",
  "linear-gradient(135deg, #B45309 0%, #D97706 100%)",
  "linear-gradient(135deg, #065F46 0%, #10B981 100%)",
  "linear-gradient(135deg, #9F1239 0%, #FB7185 100%)",
];

function gradientForPlace(id: string) {
  const idx = id.charCodeAt(0) % PLACE_GRADIENTS.length;
  return PLACE_GRADIENTS[idx];
}

export default function Home({ user, onHostHere }: Props) {
  const first = user.name?.split(" ")[0] || "there";
  const { places } = usePlaces();
  const [tab, setTab] = useState<DiscoverTab>("All");
  const [selected, setSelected] = useState<DBPlace | null>(null);

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
        <p style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FONT.sans, marginBottom: 6 }}>
          Hey {first}
        </p>
        <h1 style={{ fontFamily: FONT.serif, fontSize: 28, fontWeight: 500, color: COLOR.ink, lineHeight: 1.1 }}>
          Discover <em>places</em>
        </h1>
        <p style={{ fontSize: 14, color: COLOR.ink2, fontFamily: FONT.sans, marginTop: 6, maxWidth: 400 }}>
          Spots your cohort actually goes — vetted by batchmates.
        </p>

        {/* Filter tabs */}
        <div className="mt-5 flex gap-1" style={{ background: "#F0F0EE", borderRadius: 12, padding: 4, overflowX: "auto", scrollbarWidth: "none" }}>
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
          {filtered.map((p) => (
            <PlaceCard
              key={p.id}
              place={p}
              mapsUrl={mapsUrl(p)}
              onOpen={() => { tap(); setSelected(p); }}
              onHostHere={() => handleHostHere(p)}
            />
          ))}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "48px 20px", color: COLOR.ink3, fontFamily: FONT.sans }}>
            <MapPin size={32} strokeWidth={1.5} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 600, color: COLOR.ink2 }}>No places found</p>
            <p style={{ fontSize: 13, marginTop: 4 }}>Try a different category or check back later.</p>
          </div>
        )}

        {filtered.length > 0 && (
          <p style={{ textAlign: "center", fontSize: 12, color: COLOR.ink3, fontFamily: FONT.sans, fontStyle: "italic", padding: "16px 0 8px" }}>
            New spots added weekly based on cohort recommendations
          </p>
        )}
      </main>

      {/* Place detail drawer */}
      {selected && (
        <PlaceDrawer
          place={selected}
          user={user}
          mapsUrl={mapsUrl(selected)}
          onClose={() => setSelected(null)}
          onHostHere={() => { handleHostHere(selected); setSelected(null); }}
        />
      )}
    </div>
  );
}

/* ─── Place Card ─── */
function PlaceCard({
  place: p,
  mapsUrl,
  onOpen,
  onHostHere,
}: {
  place: DBPlace;
  mapsUrl: string;
  onOpen: () => void;
  onHostHere: () => void;
}) {
  const hasImage = !!p.image_url;
  const bg = hasImage ? `url(${p.image_url}) center/cover` : gradientForPlace(p.id);

  return (
    <article
      onClick={onOpen}
      style={{
        borderRadius: 14,
        overflow: "hidden",
        background: COLOR.surface,
        border: `1px solid ${COLOR.borderLight}`,
        transition: "box-shadow 0.2s, transform 0.2s",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = "0 6px 20px rgba(0,0,0,0.09)";
        e.currentTarget.style.transform = "translateY(-2px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = "none";
        e.currentTarget.style.transform = "none";
      }}
    >
      {/* Photo */}
      <div style={{ height: 160, position: "relative", overflow: "hidden", background: bg }}>
        {/* Gradient scrim */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 55%)" }} />

        {/* Rating badge */}
        {p.google_rating && (
          <span style={{
            position: "absolute", top: 10, right: 10,
            fontSize: 12, fontWeight: 700, padding: "3px 8px", borderRadius: 8,
            background: "rgba(255,255,255,0.92)", color: COLOR.ink,
            fontFamily: FONT.sans, display: "flex", alignItems: "center", gap: 3,
          }}>
            <Star size={11} fill="#F59E0B" color="#F59E0B" />
            {p.google_rating}
          </span>
        )}

        {/* Name overlay */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "10px 14px" }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#fff", fontFamily: FONT.sans, lineHeight: 1.25 }}>
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

      {/* Card body */}
      <div style={{ padding: "10px 14px 12px" }}>
        {p.description && (
          <p style={{
            fontSize: 13, color: COLOR.ink2, lineHeight: 1.55, fontFamily: FONT.sans, marginBottom: 8,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {p.description}
          </p>
        )}

        <div className="flex items-center gap-2 mb-3">
          {p.category && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: COLOR.bgSoft, color: COLOR.ink3, fontFamily: FONT.sans, textTransform: "capitalize" }}>
              {p.category === "food" ? "Restaurant" : p.category}
            </span>
          )}
          {p.budget && (
            <span style={{
              fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 6, fontFamily: FONT.sans,
              background: p.budget === "low" ? "#ECFDF5" : p.budget === "high" ? "#F0EAFF" : "#FEF3C7",
              color: p.budget === "low" ? "#059669" : p.budget === "high" ? "#7C3AED" : "#D97706",
            }}>
              {p.budget === "low" ? "Budget" : p.budget === "high" ? "Premium" : "Mid-range"}
            </span>
          )}
        </div>

        {/* Bottom row */}
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => tap()}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: COLOR.bgSoft, color: COLOR.ink, border: `1px solid ${COLOR.borderLight}`,
              textAlign: "center", textDecoration: "none", fontFamily: FONT.sans,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
            }}
          >
            <MapPin size={13} strokeWidth={1.75} /> Maps
            <ExternalLink size={9} style={{ opacity: 0.4 }} />
          </a>
          <button
            onClick={() => { tap(); onHostHere(); }}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 10, fontSize: 12, fontWeight: 700,
              background: COLOR.ink, color: "#fff", border: "none", fontFamily: FONT.sans,
              display: "flex", alignItems: "center", justifyContent: "center", gap: 4, cursor: "pointer",
            }}
          >
            <Plus size={13} strokeWidth={2} /> Host here
          </button>
        </div>
      </div>
    </article>
  );
}

/* ─── Place Detail Drawer ─── */
function PlaceDrawer({
  place: p,
  user,
  mapsUrl,
  onClose,
  onHostHere,
}: {
  place: DBPlace;
  user: User;
  mapsUrl: string;
  onClose: () => void;
  onHostHere: () => void;
}) {
  const { reviews, myReview, avgRating, submitReview, deleteReview } = useReviews(p.id, user);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [draftRating, setDraftRating] = useState(myReview?.rating ?? 0);
  const [draftComment, setDraftComment] = useState(myReview?.comment ?? "");
  const [submitting, setSubmitting] = useState(false);

  const hasImage = !!p.image_url;
  const heroBg = hasImage ? `url(${p.image_url}) center/cover` : gradientForPlace(p.id);
  const isbRating = avgRating;
  const isbCount = reviews.length;

  async function handleSubmit() {
    if (draftRating === 0) return;
    setSubmitting(true);
    await submitReview(draftRating, draftComment);
    setSubmitting(false);
    setShowReviewForm(false);
  }

  function budgetLabel(b: string) {
    return b === "low" ? "₹150–300" : b === "mid" ? "₹300–600" : "₹600+";
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", animation: "fadeIn 0.2s ease" }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: "absolute", top: 0, right: 0, bottom: 0,
          width: "min(520px, 100%)",
          background: COLOR.bg,
          boxShadow: "-12px 0 40px rgba(0,0,0,0.15)",
          animation: "slideInRight 0.28s cubic-bezier(0.32,0.72,0,1)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Top bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 16px", borderBottom: `1px solid ${COLOR.borderLight}`, flexShrink: 0,
          background: COLOR.bg,
        }}>
          <button
            onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${COLOR.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <ChevronLeft size={18} color={COLOR.ink2} strokeWidth={2} />
          </button>
          <span style={{ fontSize: 12, color: COLOR.ink3, fontWeight: 600, fontFamily: FONT.sans, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Place
          </span>
          <button
            onClick={onClose}
            style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${COLOR.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={16} color={COLOR.ink2} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* Hero image */}
          <div style={{ height: 220, background: heroBg, position: "relative", flexShrink: 0 }}>
            <div style={{ position: "absolute", inset: 0, background: hasImage ? "linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)" : "rgba(0,0,0,0.08)" }} />
          </div>

          {/* Info card */}
          <div style={{ padding: "20px 20px 0" }}>
            {/* Rating row */}
            {(isbRating || p.google_rating) && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                {isbRating !== null && (
                  <span style={{ fontSize: 22, fontWeight: 800, color: COLOR.ink, fontFamily: FONT.sans }}>
                    {isbRating}
                  </span>
                )}
                {isbRating !== null && (
                  <div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[1,2,3,4,5].map((s) => (
                        <Star key={s} size={14} fill={s <= Math.round(isbRating) ? "#F59E0B" : "transparent"} color={s <= Math.round(isbRating) ? "#F59E0B" : COLOR.border} />
                      ))}
                    </div>
                    <p style={{ fontSize: 12, color: COLOR.ink3, fontFamily: FONT.sans, marginTop: 1 }}>
                      {isbCount} ISB review{isbCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Name */}
            <h2 style={{ fontFamily: FONT.serif, fontSize: 26, fontWeight: 500, color: COLOR.ink, lineHeight: 1.2, marginBottom: 6 }}>
              {p.name}
            </h2>

            {/* Area + distance */}
            {p.area && (
              <p style={{ fontSize: 13, color: COLOR.ink2, fontFamily: FONT.sans, display: "flex", alignItems: "center", gap: 4, marginBottom: 10 }}>
                <MapPin size={13} strokeWidth={1.75} color={COLOR.ink3} />
                {p.area}
                {p.distance_from_campus && <span style={{ color: COLOR.ink3 }}>· {p.distance_from_campus}</span>}
              </p>
            )}

            {/* Description */}
            {p.description && (
              <p style={{ fontSize: 14, color: COLOR.ink2, lineHeight: 1.65, fontFamily: FONT.sans, marginBottom: 16 }}>
                {p.description}
              </p>
            )}

            {/* CTA buttons */}
            <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => tap()}
                style={{
                  flex: 2, padding: "12px 0", borderRadius: 11, fontSize: 13, fontWeight: 700,
                  background: COLOR.ink, color: "#fff", textDecoration: "none",
                  fontFamily: FONT.sans, display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
              >
                <MapPin size={14} strokeWidth={2} /> Open in Maps
              </a>
              <button
                onClick={() => { tap(); onHostHere(); }}
                style={{
                  flex: 1, padding: "12px 0", borderRadius: 11, fontSize: 13, fontWeight: 700,
                  border: `1.5px solid ${COLOR.border}`, background: "transparent",
                  color: COLOR.ink, fontFamily: FONT.sans, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}
              >
                <Plus size={13} strokeWidth={2.5} /> Host here
              </button>
            </div>

            {/* Budget badge */}
            {p.budget && (
              <div style={{ marginBottom: 20 }}>
                <span style={{
                  fontSize: 13, fontWeight: 600, padding: "5px 12px", borderRadius: 8,
                  border: `1.5px solid ${p.budget === "low" ? "#86EFAC" : p.budget === "high" ? "#C4B5FD" : "#FDE68A"}`,
                  color: p.budget === "low" ? "#059669" : p.budget === "high" ? "#7C3AED" : "#D97706",
                  fontFamily: FONT.sans,
                }}>
                  {budgetLabel(p.budget)} per person
                </span>
              </div>
            )}

            <div style={{ height: 1, background: COLOR.borderLight, marginBottom: 20 }} />

            {/* ── ISB Reviews ── */}
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3, fontFamily: FONT.sans, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                  ISB Reviews
                </p>
                {!myReview && (
                  <button
                    onClick={() => setShowReviewForm((v) => !v)}
                    style={{ fontSize: 12, fontWeight: 700, color: COLOR.navy, background: "none", border: "none", cursor: "pointer", fontFamily: FONT.sans, display: "flex", alignItems: "center", gap: 4 }}
                  >
                    <Plus size={13} strokeWidth={2.5} /> Write a review
                  </button>
                )}
                {myReview && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      onClick={() => { setDraftRating(myReview.rating); setDraftComment(myReview.comment ?? ""); setShowReviewForm(true); }}
                      style={{ fontSize: 12, fontWeight: 600, color: COLOR.ink3, background: "none", border: "none", cursor: "pointer", fontFamily: FONT.sans, display: "flex", alignItems: "center", gap: 3 }}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={deleteReview}
                      style={{ fontSize: 12, fontWeight: 600, color: "#DC2626", background: "none", border: "none", cursor: "pointer", fontFamily: FONT.sans, display: "flex", alignItems: "center", gap: 3 }}
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>

              {/* Write / edit review form */}
              {showReviewForm && (
                <div style={{ padding: "14px", borderRadius: 12, background: COLOR.bgSoft, border: `1px solid ${COLOR.borderLight}`, marginBottom: 16 }}>
                  {/* Star picker */}
                  <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
                    {[1,2,3,4,5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setDraftRating(s)}
                        style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}
                      >
                        <Star
                          size={26}
                          fill={s <= draftRating ? "#F59E0B" : "transparent"}
                          color={s <= draftRating ? "#F59E0B" : COLOR.border}
                          strokeWidth={1.5}
                        />
                      </button>
                    ))}
                    {draftRating > 0 && (
                      <span style={{ alignSelf: "center", fontSize: 12, color: COLOR.ink3, fontFamily: FONT.sans, marginLeft: 4 }}>
                        {["", "Poor", "Fair", "Good", "Great", "Excellent"][draftRating]}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={draftComment}
                    onChange={(e) => setDraftComment(e.target.value)}
                    placeholder="Share your experience with batchmates..."
                    rows={3}
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: 9, border: `1px solid ${COLOR.border}`,
                      fontSize: 13, fontFamily: FONT.sans, color: COLOR.ink, background: COLOR.surface,
                      outline: "none", resize: "none", lineHeight: 1.6, marginBottom: 10,
                    }}
                  />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={handleSubmit}
                      disabled={draftRating === 0 || submitting}
                      style={{
                        flex: 1, padding: "10px", borderRadius: 10, fontSize: 13, fontWeight: 700,
                        background: COLOR.ink, color: "#fff", border: "none", cursor: "pointer",
                        fontFamily: FONT.sans, opacity: draftRating === 0 ? 0.5 : 1,
                      }}
                    >
                      {submitting ? "Posting…" : myReview ? "Update review" : "Post review"}
                    </button>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      style={{ padding: "10px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600, border: `1px solid ${COLOR.border}`, background: "transparent", color: COLOR.ink2, cursor: "pointer", fontFamily: FONT.sans }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Review list */}
              {reviews.length === 0 && !showReviewForm && (
                <p style={{ fontSize: 13, color: COLOR.ink3, fontFamily: FONT.sans, fontStyle: "italic", padding: "8px 0 12px" }}>
                  Be the first from your cohort to review this place.
                </p>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {reviews.map((r) => (
                  <ReviewRow key={r.id} review={r} isOwn={r.user_id === user.id} />
                ))}
              </div>
            </div>

            {/* ── Google Reviews row ── */}
            {p.google_rating && (
              <>
                <div style={{ height: 1, background: COLOR.borderLight, margin: "16px 0" }} />
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => tap()}
                  style={{
                    display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
                    borderRadius: 12, border: `1px solid ${COLOR.borderLight}`,
                    textDecoration: "none", marginBottom: 24,
                    background: COLOR.surface,
                  }}
                >
                  {/* Google G */}
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "#fff", border: `1px solid ${COLOR.borderLight}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path fill="#4285F4" d="M23.745 12.27c0-.79-.07-1.54-.19-2.27h-11.3v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"/>
                      <path fill="#34A853" d="M12.255 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96h-3.98v3.09C3.515 21.3 7.615 24 12.255 24z"/>
                      <path fill="#FBBC05" d="M5.525 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62h-3.98a11.86 11.86 0 0 0 0 10.76l3.98-3.09z"/>
                      <path fill="#EA4335" d="M12.255 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C18.205 1.19 15.495 0 12.255 0c-4.64 0-8.74 2.7-10.71 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink, fontFamily: FONT.sans }}>Google Reviews</p>
                    <p style={{ fontSize: 12, color: COLOR.ink3, fontFamily: FONT.sans, marginTop: 1 }}>
                      {p.google_rating} · See reviews on Google Maps
                      {p.review_count ? ` (${p.review_count.toLocaleString()} reviews)` : ""}
                    </p>
                  </div>
                  <ArrowUpRight size={16} color={COLOR.ink3} />
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Single review row ─── */
function ReviewRow({ review: r, isOwn }: { review: PlaceReview; isOwn: boolean }) {
  const initial = r.user?.name?.[0]?.toUpperCase() ?? "?";
  const timeAgo = formatAgo(r.created_at);

  return (
    <div style={{ padding: "12px 14px", borderRadius: 12, background: isOwn ? "#F0F5FF" : COLOR.surface, border: `1px solid ${isOwn ? "#BFDBFE" : COLOR.borderLight}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        {/* Avatar */}
        <div style={{ width: 32, height: 32, borderRadius: "50%", background: COLOR.navy, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: FONT.sans }}>{initial}</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink, fontFamily: FONT.sans }}>
              {r.user?.name ?? "ISB Student"}
            </span>
            {r.user?.section && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 6, background: COLOR.navyTint, color: COLOR.navy, fontFamily: FONT.sans }}>
                Sec {r.user.section}
              </span>
            )}
            {isOwn && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "1px 7px", borderRadius: 6, background: "#DBEAFE", color: "#1D4ED8", fontFamily: FONT.sans }}>You</span>
            )}
          </div>
          <span style={{ fontSize: 11, color: COLOR.ink3, fontFamily: FONT.sans }}>{timeAgo}</span>
        </div>
        {/* Stars */}
        <div style={{ display: "flex", gap: 1 }}>
          {[1,2,3,4,5].map((s) => (
            <Star key={s} size={11} fill={s <= r.rating ? "#F59E0B" : "transparent"} color={s <= r.rating ? "#F59E0B" : COLOR.border} />
          ))}
        </div>
      </div>
      {r.comment && (
        <p style={{ fontSize: 13, color: COLOR.ink2, lineHeight: 1.6, fontFamily: FONT.sans }}>
          {r.comment}
        </p>
      )}
    </div>
  );
}

function formatAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 60) return `${m || 1}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  const w = Math.floor(d / 7);
  if (w < 5) return `${w}w ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
