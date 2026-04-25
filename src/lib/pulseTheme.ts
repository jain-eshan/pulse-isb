/**
 * Pulse Design System v2 — Warm linen · ISB Navy · Amber gold · Editorial type
 * Source of truth. See /docs/superpowers/specs/2026-04-24-pulse-design.md.
 */

export const COLOR = {
  // Surfaces
  bg:          "#F4F2EC",
  surface:     "#FFFFFF",
  border:      "#E2DDD4",
  borderLight: "#EBE8E1",
  divider:     "#F0EDE8",

  // ISB navy
  navy:     "#1C3A6E",
  navyDeep: "#122850",
  navyTint: "#EEF2FA",

  // ISB amber/gold
  amber:     "#C47D0E",
  amberTint: "#FDF4E0",

  // Text
  ink:  "#0F0F0F",
  ink2: "#5A5A5A",
  ink3: "#9E9E9E",

  // Budget semantic
  budget: {
    low:  { bg: "#E8F8EF", text: "#1A7A4A" },
    mid:  { bg: "#FDF4E0", text: "#8B5E00" },
    high: { bg: "#F0EAFF", text: "#5B2D8E" },
  },
} as const;

export const SHADOW = {
  card:      "0 1px 2px rgba(0,0,0,.04), 0 4px 16px rgba(0,0,0,.06)",
  cardHover: "0 2px 4px rgba(0,0,0,.06), 0 8px 28px rgba(0,0,0,.10)",
  navy:      "0 4px 16px rgba(28,58,110,0.25)",
} as const;

export const FONT = {
  serif: "'Playfair Display', Georgia, serif",
  sans:  "'Plus Jakarta Sans', system-ui, sans-serif",
} as const;

// Interest → category palette (strip color + tint + upper-case label)
export const INTEREST_COLOR: Record<
  string,
  { strip: string; tint: string; label: string }
> = {
  product:    { strip: "#4A3ADB", tint: "#EEEEFF", label: "Product" },
  consulting: { strip: "#D4621A", tint: "#FFF2EA", label: "Consulting" },
  tech:       { strip: "#1C3A6E", tint: "#EEF2FA", label: "Tech" },
  careers:    { strip: "#8B5E24", tint: "#F7EFE4", label: "Careers" },
  academics:  { strip: "#1A7A4A", tint: "#E8F8EF", label: "Academics" },
  social:     { strip: "#C47D0E", tint: "#FDF4E0", label: "Social" },
};

export function stripGradient(strip: string, tint: string) {
  return `linear-gradient(90deg, ${strip}, ${tint})`;
}

// Legacy aliases — only so old imports don't crash during migration.
// All rebuilt pages use COLOR / SHADOW / FONT directly.
export const BRAND = {
  navyDeep: COLOR.navyDeep,
  navyMid:  COLOR.navy,
  navyOcean: COLOR.navyDeep,
  brand500: COLOR.navy,
  brand600: COLOR.navyDeep,
  brand700: COLOR.navyDeep,
};
export const HEADER_GRADIENT = COLOR.navy;
export const CTA_GRADIENT = COLOR.navy;
