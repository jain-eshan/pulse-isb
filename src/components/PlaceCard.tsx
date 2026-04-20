import type { Place, PlaceCategory, BudgetLevel } from "../types";

const CATEGORY: Record<PlaceCategory, { label: string; strip: string; stripEnd: string; text: string }> = {
  food:      { label: "Food",      strip: "#D4621A", stripEnd: "#E8C4A8", text: "#D4621A" },
  cafe:      { label: "Cafe",      strip: "#8B5E24", stripEnd: "#D9C4A3", text: "#8B5E24" },
  nightlife: { label: "Nightlife", strip: "#4A3ADB", stripEnd: "#B7B1F4", text: "#4A3ADB" },
  travel:    { label: "Travel",    strip: "#1A7A4A", stripEnd: "#A8D9BE", text: "#1A7A4A" },
};

const BUDGET: Record<BudgetLevel, { label: string; bg: string; text: string }> = {
  low:  { label: "Budget",  bg: "#E8F8EF", text: "#1A7A4A" },
  mid:  { label: "Mid",     bg: "#FDF4E0", text: "#8B5E00" },
  high: { label: "Splurge", bg: "#F0EAFF", text: "#5B2D8E" },
};

interface PlaceCardProps {
  place: Place;
  onGoingClick: () => void;
}

export default function PlaceCard({ place, onGoingClick }: PlaceCardProps) {
  const cat = CATEGORY[place.category];
  const budget = BUDGET[place.budget_level];

  return (
    <article
      className="overflow-hidden transition-shadow"
      style={{
        background: "#FFFFFF",
        border: "1px solid #EBE8E1",
        borderRadius: "14px",
        boxShadow: "0 1px 2px rgba(0,0,0,.04), 0 6px 20px rgba(0,0,0,.07)",
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      }}
    >
      <div style={{ height: 2, background: `linear-gradient(90deg, ${cat.strip}, ${cat.stripEnd})` }} />

      <div style={{ padding: "18px 18px 16px" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: cat.text,
            marginBottom: 10,
          }}
        >
          {cat.label} · <span style={{ textTransform: "capitalize" }}>{place.city}</span>
        </div>

        <h3
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: 22,
            fontWeight: 400,
            color: "#0F0F0F",
            lineHeight: 1.2,
            margin: "0 0 3px 0",
          }}
        >
          {place.name}
        </h3>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 11,
            color: "#9E9E9E",
            marginBottom: 12,
          }}
        >
          {place.distance_from_campus && <span>{place.distance_from_campus} from campus</span>}
        </div>

        <p
          style={{
            fontSize: 13,
            color: "#5A5A5A",
            lineHeight: 1.7,
            marginBottom: 12,
            marginTop: 0,
          }}
        >
          {place.description}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "10px 0",
            borderTop: "1px solid #F0EDE8",
            borderBottom: "1px solid #F0EDE8",
            marginBottom: 14,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#9E9E9E",
                textTransform: "uppercase",
                letterSpacing: "0.06em",
                marginBottom: 2,
              }}
            >
              Per person
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display', Georgia, serif",
                fontSize: 16,
                fontWeight: 400,
                color: "#0F0F0F",
              }}
            >
              {place.budget_per_person}
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: budget.text,
              background: budget.bg,
              borderRadius: 6,
              padding: "4px 10px",
            }}
          >
            {budget.label}
          </div>
        </div>

        {place.vibe_tags.length > 0 && (
          <div
            style={{
              fontSize: 11,
              color: "#9E9E9E",
              fontStyle: "italic",
              marginBottom: 14,
            }}
          >
            {place.vibe_tags.slice(0, 3).join(", ")}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <a
            href={place.google_maps_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 600,
              color: "#5A5A5A",
              background: "#F4F2EC",
              border: "1px solid #E2DDD4",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            View Map
          </a>
          <button
            onClick={onGoingClick}
            style={{
              flex: 1,
              padding: "10px 0",
              fontSize: 13,
              fontWeight: 600,
              color: "#FFFFFF",
              background: "#1C3A6E",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(28,58,110,.2)",
            }}
          >
            I'm Going
          </button>
        </div>
      </div>
    </article>
  );
}
