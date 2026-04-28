import { sectionByCode } from "../lib/sections";
import { INTERESTS } from "../types";

interface Props {
  title: string;
  tag?: string;
  hostSection?: string;
  height?: number;
}

// Tag → color theme (gradient + accent)
const TAG_THEME: Record<string, { from: string; to: string; accent: string; emoji: string }> = {
  product:    { from: "#FFE4B5", to: "#FFB347", accent: "#D4621A", emoji: "💡" },
  consulting: { from: "#DBEAFE", to: "#93C5FD", accent: "#1E3A8A", emoji: "📊" },
  tech:       { from: "#D1FAE5", to: "#6EE7B7", accent: "#065F46", emoji: "🤖" },
  careers:    { from: "#EDE9FE", to: "#C4B5FD", accent: "#5B21B6", emoji: "🎯" },
  academics:  { from: "#CFFAFE", to: "#67E8F9", accent: "#155E75", emoji: "📚" },
  social:     { from: "#FCE7F3", to: "#F9A8D4", accent: "#9D174D", emoji: "🎭" },
};

export default function CoverBanner({ title, tag, hostSection, height = 220 }: Props) {
  const theme = tag ? TAG_THEME[tag] ?? null : null;
  const sec = sectionByCode(hostSection);
  const interest = tag ? INTERESTS.find((i) => i.id === tag) : null;

  // Resolve gradient — prefer tag theme, fall back to section tint, then default cream
  const from = theme?.from ?? sec?.tint ?? "#F0E9DA";
  const to = theme?.to ?? sec?.color ?? "#1C3A6E";
  const accent = theme?.accent ?? sec?.color ?? "#1C3A6E";
  const emoji = theme?.emoji ?? interest?.emoji ?? "✨";

  return (
    <div
      className="relative rounded-[20px] overflow-hidden mx-4 md:mx-8 mt-2"
      style={{
        height,
        background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
        boxShadow: "0 12px 40px rgba(0,0,0,0.10)",
      }}
    >
      {/* Subtle dot pattern overlay */}
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.4) 1px, transparent 0)`,
          backgroundSize: "20px 20px",
        }}
      />

      {/* Decorative giant emoji in corner */}
      <div
        className="absolute -right-6 -bottom-6 select-none pointer-events-none"
        style={{
          fontSize: 200,
          lineHeight: 1,
          opacity: 0.18,
          transform: "rotate(-8deg)",
        }}
      >
        {emoji}
      </div>

      {/* Tag pill (top left) */}
      {interest && (
        <div className="absolute top-4 left-4">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
            style={{
              background: "rgba(255,255,255,0.92)",
              color: accent,
              backdropFilter: "blur(6px)",
            }}
          >
            <span>{interest.emoji}</span>
            {interest.label}
          </span>
        </div>
      )}

      {/* Title overlay */}
      <div className="absolute bottom-5 left-5 right-20">
        <h1
          className="font-serif"
          style={{
            fontSize: "clamp(22px, 6vw, 38px)",
            lineHeight: 1.05,
            color: "#0F172A",
            letterSpacing: "-0.01em",
            textShadow: "0 1px 0 rgba(255,255,255,0.5)",
            fontWeight: 500,
          }}
        >
          {title}
        </h1>
      </div>
    </div>
  );
}
