/**
 * Pulse Design System v3 — Clean white · ISB Navy accent · Luma-inspired
 * Source of truth for all visual tokens.
 */

export const COLOR = {
  // Surfaces — v3 warm neutral
  bg:          "#FAFAFA",
  bgSoft:      "#F5F5F3",      // section/card backgrounds
  surface:     "#FFFFFF",
  border:      "#E5E5E3",      // warm gray
  borderLight: "#F0F0EE",      // warm gray-100
  divider:     "#F0F0EE",

  // ISB navy — primary brand
  navy:     "#1C3A6E",
  navyDeep: "#122850",
  navyTint: "#EEF2FA",

  // ISB amber/gold — accent
  amber:     "#C47D0E",
  amberTint: "#FDF4E0",

  // Accent — v3 warm orange-red
  accent:  "#FF5733",

  // Text — v3 sharper hierarchy
  ink:  "#111111",             // near-black
  ink2: "#555555",             // mid gray
  ink3: "#999999",             // light gray

  // Budget semantic
  budget: {
    low:  { bg: "#ECFDF5", text: "#059669" },
    mid:  { bg: "#FEF3C7", text: "#D97706" },
    high: { bg: "#F0EAFF", text: "#7C3AED" },
  },
} as const;

export const SHADOW = {
  card:      "0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)",
  cardHover: "0 4px 6px rgba(0,0,0,.05), 0 10px 20px rgba(0,0,0,.08)",
  navy:      "0 4px 14px rgba(28,58,110,0.20)",
  soft:      "0 1px 2px rgba(0,0,0,.03)",
} as const;

export const FONT = {
  serif: "'Playfair Display', Georgia, serif",
  sans:  "'Plus Jakarta Sans', system-ui, sans-serif",
} as const;

// ── Category system ──────────────────────────────────────────────
// Top-level categories for event filtering
export const EVENT_CATEGORIES = ["Sports", "Social", "Professional"] as const;
export type EventCategory = (typeof EVENT_CATEGORIES)[number];

export const SUBCATEGORIES: Record<EventCategory, string[]> = {
  Sports: [
    "Football", "Basketball", "Cricket", "Frisbee", "Table Tennis",
    "Pickleball", "Lawn Tennis", "Badminton", "Squash", "Foosball",
    "Pool/Billiards",
  ],
  Social: ["Party", "Games", "Movies", "Music", "Food & Drinks", "Other"],
  Professional: ["P2P Sessions", "Club Sessions", "Workshop", "Panel", "Other"],
};

// Category → color palette (cover gradient + chip tint + label)
export const CATEGORY_COLOR: Record<
  string,
  { accent: string; tint: string; label: string }
> = {
  sports:       { accent: "#059669", tint: "#ECFDF5", label: "Sports" },
  social:       { accent: "#D97706", tint: "#FEF3C7", label: "Social" },
  professional: { accent: "#1C3A6E", tint: "#EEF2FA", label: "Professional" },
  // Legacy interest aliases
  product:      { accent: "#6366F1", tint: "#EEF2FF", label: "Product" },
  consulting:   { accent: "#EA580C", tint: "#FFF7ED", label: "Consulting" },
  tech:         { accent: "#1C3A6E", tint: "#EEF2FA", label: "Tech" },
  careers:      { accent: "#92400E", tint: "#FEF3C7", label: "Careers" },
  academics:    { accent: "#059669", tint: "#ECFDF5", label: "Academics" },
};

// Legacy alias — old imports use INTEREST_COLOR
export const INTEREST_COLOR: Record<
  string,
  { strip: string; tint: string; label: string }
> = {
  product:    { strip: "#6366F1", tint: "#EEF2FF", label: "Product" },
  consulting: { strip: "#EA580C", tint: "#FFF7ED", label: "Consulting" },
  tech:       { strip: "#1C3A6E", tint: "#EEF2FA", label: "Tech" },
  careers:    { strip: "#92400E", tint: "#FEF3C7", label: "Careers" },
  academics:  { strip: "#059669", tint: "#ECFDF5", label: "Academics" },
  social:     { strip: "#D97706", tint: "#FEF3C7", label: "Social" },
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
