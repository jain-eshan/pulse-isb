export const BRAND = {
  navyDeep: "#1a1a2e",
  navyMid: "#16213e",
  navyOcean: "#0f3460",
  brand50: "#f0f4ff",
  brand100: "#e0eaff",
  brand500: "#4f6ef7",
  brand600: "#3b55e6",
  brand700: "#2d43cc",
} as const;

export const VIBE = {
  purple: "#8b5cf6",
  orange: "#f97316",
  green: "#22c55e",
  pink: "#ec4899",
  blue: "#3b82f6",
  yellow: "#eab308",
} as const;

export const INTEREST_COLOR: Record<string, string> = {
  product: VIBE.purple,
  consulting: VIBE.orange,
  tech: VIBE.blue,
  careers: VIBE.pink,
  academics: VIBE.green,
  social: VIBE.yellow,
};

export const HEADER_GRADIENT = `linear-gradient(135deg, ${BRAND.navyDeep} 0%, ${BRAND.navyMid} 100%)`;
export const HERO_GRADIENT = `linear-gradient(135deg, ${BRAND.navyDeep} 0%, ${BRAND.navyMid} 50%, ${BRAND.navyOcean} 100%)`;
export const CTA_GRADIENT = `linear-gradient(90deg, ${BRAND.brand500} 0%, ${VIBE.purple} 100%)`;
