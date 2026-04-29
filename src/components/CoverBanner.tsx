/**
 * CoverBanner — Pulse Redesign v2
 * Deep-tone gradient + dot grid + diagonal SVG accents + glass pill.
 * Matches the design system handoff (Pulse Redesign.html).
 */
import { FONT } from "../lib/pulseTheme";

interface Props {
  title: string;
  tag?: string;
  height?: number;
  /** Show the category pill in the top-left corner */
  showPill?: boolean;
  /** Show a dark scrim under the title (used on detail screens) */
  scrim?: boolean;
  children?: React.ReactNode;
}

// Tag → cover theme. Matches Pulse Redesign.html COVER_THEMES.
export const COVER_THEMES: Record<
  string,
  { from: string; to: string; strip: string; label: string }
> = {
  consulting: { from: "#1C3A6E", to: "#2D5016", strip: "#D4621A", label: "Consulting" },
  product:    { from: "#312E81", to: "#4C1D95", strip: "#4A3ADB", label: "Product" },
  tech:       { from: "#0C1A3A", to: "#1C3A6E", strip: "#1C3A6E", label: "Tech" },
  careers:    { from: "#4C1D95", to: "#5B2D8E", strip: "#5B2D8E", label: "Careers" },
  academics:  { from: "#064E3B", to: "#065F46", strip: "#1A7A4A", label: "Academics" },
  social:     { from: "#7C0A2A", to: "#C41E3A", strip: "#C47D0E", label: "Social" },
};

export function coverTheme(tag?: string) {
  return (tag && COVER_THEMES[tag]) || COVER_THEMES.consulting;
}

export default function CoverBanner({
  title,
  tag,
  height = 240,
  showPill = true,
  scrim = false,
  children,
}: Props) {
  const theme = coverTheme(tag);

  return (
    <div
      style={{
        height,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(150deg, ${theme.from} 0%, ${theme.to} 100%)`,
      }}
    >
      {/* Subtle dot grid */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.12,
          pointerEvents: "none",
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Diagonal line accents (decorative) */}
      <svg
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07 }}
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <line x1="60" y1="0" x2="110" y2="100" stroke="#fff" strokeWidth="12" />
        <line x1="80" y1="0" x2="130" y2="100" stroke="#fff" strokeWidth="6" />
      </svg>

      {/* Category pill (glassmorphism) */}
      {showPill && (
        <div style={{ position: "absolute", top: 14, left: 16 }}>
          <span
            style={{
              display: "inline-block",
              background: "rgba(255,255,255,0.15)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,0.22)",
              borderRadius: 99,
              padding: "4px 12px",
              fontSize: 11,
              fontWeight: 700,
              color: "#fff",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              fontFamily: FONT.sans,
            }}
          >
            {theme.label}
          </span>
        </div>
      )}

      {/* Title with optional dark scrim */}
      {title && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: scrim ? "48px 20px 18px" : "0 18px 18px",
            background: scrim
              ? "linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 100%)"
              : "transparent",
          }}
        >
          <h1
            style={{
              fontFamily: FONT.serif,
              fontSize: scrim ? 22 : 24,
              fontWeight: 500,
              color: "#fff",
              lineHeight: 1.15,
              textShadow: "0 1px 8px rgba(0,0,0,0.25)",
            }}
          >
            {title}
          </h1>
        </div>
      )}

      {children}
    </div>
  );
}
