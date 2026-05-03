/**
 * Pulse Design System v3 — Clean white · ISB Navy accent · Luma-inspired
 * Source of truth for all visual tokens.
 */

export const COLOR = {
  // Surfaces — clean white foundation
  bg:          "#FFFFFF",
  bgSoft:      "#F9FAFB",      // section/card backgrounds
  surface:     "#FFFFFF",
  border:      "#E5E7EB",      // gray-200
  borderLight: "#F3F4F6",      // gray-100
  divider:     "#F3F4F6",

  // ISB navy — primary brand
  navy:     "#1C3A6E",
  navyDeep: "#122850",
  navyTint: "#EEF2FA",

  // ISB amber/gold — accent
  amber:     "#C47D0E",
  amberTint: "#FDF4E0",

  // Text — sharper hierarchy
  ink:  "#111827",             // gray-900
  ink2: "#6B7280",             // gray-500
  ink3: "#9CA3AF",             // gray-400

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
