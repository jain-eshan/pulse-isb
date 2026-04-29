/**
 * ISB Mohali campus — Knowledge City, Sector 81.
 * GPS coordinates resolved from the user's Google Maps short links (Apr 2026).
 * Used to plot the live density heatmap and assign user locations to zones.
 */

export type ZoneCategory = "academic" | "sports" | "dining" | "housing" | "amenity" | "gate";

export interface CampusPlace {
  id: string;
  /** Index number on the official ISB campus map */
  num: number;
  label: string;
  /** Short label for the heatmap badge (≤7 chars) */
  short: string;
  category: ZoneCategory;
  lat: number;
  lng: number;
  /** Emoji shown in the place marker. */
  icon: string;
  /** Priority places get the larger marker + label on the map. */
  priority?: boolean;
}

export const CAMPUS_PLACES: CampusPlace[] = [
  { id: "main-gate",  num: 1,  label: "Main Gate",          short: "Gate",     category: "gate",     icon: "🚪", lat: 30.669760, lng: 76.728295 },
  { id: "pools",      num: 24, label: "Swimming Pools",     short: "Pool",     category: "sports",   icon: "🏊", lat: 30.668377, lng: 76.724983 },
  { id: "wellness",   num: 25, label: "Wellness Centre",    short: "Wellness", category: "amenity",  icon: "🧘", lat: 30.667991, lng: 76.725318 },
  { id: "recreation", num: 26, label: "Recreation Centre",  short: "Rec",      category: "amenity",  icon: "🎱", lat: 30.667691, lng: 76.725272, priority: true },
  { id: "admin",      num: 8,  label: "Admin Square",       short: "Admin",    category: "academic", icon: "🏛️", lat: 30.668555, lng: 76.726923 },
  { id: "circle",     num: 9,  label: "Circle (VC/CCO)",    short: "Circle",   category: "academic", icon: "⭕", lat: 30.669224, lng: 76.726844 },
  { id: "academic",   num: 11, label: "Academic Square",    short: "Acad",     category: "academic", icon: "📚", lat: 30.667898, lng: 76.726849, priority: true },
  { id: "auditorium", num: 12, label: "Godrej Auditorium",  short: "Audi",     category: "academic", icon: "🎤", lat: 30.669166, lng: 76.725983 },
  { id: "jujus",      num: 15, label: "Café Juju's",        short: "Juju's",   category: "dining",   icon: "☕", lat: 30.668813, lng: 76.725554, priority: true },
  { id: "sdr",        num: 16, label: "Student Dining (SDR)", short: "SDR",    category: "dining",   icon: "🍜", lat: 30.668898, lng: 76.725437, priority: true },
  { id: "basketball", num: 28, label: "Basketball Court",   short: "BBall",    category: "sports",   icon: "🏀", lat: 30.667438, lng: 76.726271, priority: true },
  { id: "tennis",     num: 29, label: "Tennis Courts",      short: "Tennis",   category: "sports",   icon: "🎾", lat: 30.667072, lng: 76.726400, priority: true },
  { id: "sv1b",       num: 35, label: "SV-1B",              short: "SV-1B",    category: "housing",  icon: "🏠", lat: 30.667349, lng: 76.725172, priority: true },
  { id: "sv1a",       num: 33, label: "SV-1A",              short: "SV-1A",    category: "housing",  icon: "🏠", lat: 30.667676, lng: 76.725087, priority: true },
  { id: "eh1",        num: 36, label: "Executive Sq EH-1",  short: "EH-1",     category: "housing",  icon: "🏢", lat: 30.668487, lng: 76.724164 },
  { id: "eh2",        num: 38, label: "Executive Sq EH-2",  short: "EH-2",     category: "housing",  icon: "🏢", lat: 30.668743, lng: 76.724228 },
  { id: "sv2b",       num: 39, label: "SV-2B",              short: "SV-2B",    category: "housing",  icon: "🏠", lat: 30.668034, lng: 76.724491, priority: true },
  { id: "gazebo",     num: 41, label: "Gazebo",             short: "Gazebo",   category: "amenity",  icon: "🌿", lat: 30.667632, lng: 76.724440 },
];

/** Centre point used by the Leaflet map view. */
export const CAMPUS_CENTER: [number, number] = [30.6685, 76.7257];

/** Bounding box covering all known places (with a small margin). */
export const CAMPUS_BBOX = {
  latMax: 30.6705, // north
  latMin: 30.6665, // south
  lngMin: 76.7235, // west
  lngMax: 76.7290, // east
};

/** Convert lat/lng → x/y % within the campus bounding box. */
export function latLngToXY(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - CAMPUS_BBOX.lngMin) / (CAMPUS_BBOX.lngMax - CAMPUS_BBOX.lngMin)) * 100;
  // y is inverted because SVG y grows downward
  const y = ((CAMPUS_BBOX.latMax - lat) / (CAMPUS_BBOX.latMax - CAMPUS_BBOX.latMin)) * 100;
  return { x, y };
}

/** Find the nearest campus place for a given coordinate (Euclidean in lat/lng space). */
export function nearestPlace(lat: number, lng: number): CampusPlace {
  let best = CAMPUS_PLACES[0];
  let bestD = Infinity;
  for (const p of CAMPUS_PLACES) {
    const d = Math.hypot(p.lat - lat, p.lng - lng);
    if (d < bestD) { bestD = d; best = p; }
  }
  return best;
}

/**
 * Density bucket for a count.
 * empty: nobody · low: 1–2 · medium: 3–5 · high: 6+
 */
export type Density = "empty" | "low" | "medium" | "high";

export function densityBucket(count: number): Density {
  if (count <= 0) return "empty";
  if (count <= 2) return "low";
  if (count <= 5) return "medium";
  return "high";
}

/** Visual config for each density bucket. */
export const DENSITY_STYLE: Record<Density, { fill: string; ring: string; label: string }> = {
  empty:  { fill: "rgba(28,58,110,0.05)", ring: "rgba(28,58,110,0.15)", label: "Quiet" },
  low:    { fill: "rgba(28,58,110,0.18)", ring: "rgba(28,58,110,0.40)", label: "Few people" },
  medium: { fill: "rgba(28,58,110,0.32)", ring: "rgba(28,58,110,0.60)", label: "Some people" },
  high:   { fill: "rgba(28,58,110,0.48)", ring: "rgba(28,58,110,0.85)", label: "Busy" },
};

/** Category visual style. */
export const CATEGORY_STYLE: Record<ZoneCategory, { tint: string; ink: string; emoji: string }> = {
  academic: { tint: "#EEF2FA", ink: "#1C3A6E", emoji: "🏛" },
  dining:   { tint: "#FFF2EA", ink: "#D4621A", emoji: "🍽" },
  sports:   { tint: "#E8F8EF", ink: "#1A7A4A", emoji: "⚽" },
  housing:  { tint: "#F4E8F2", ink: "#6B2C5A", emoji: "🏠" },
  amenity:  { tint: "#FDF4E0", ink: "#8B5E00", emoji: "✨" },
  gate:     { tint: "#F0EAFF", ink: "#5B2D8E", emoji: "🚪" },
};
