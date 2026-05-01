/**
 * ISB Mohali campus — Knowledge City, Sector 81.
 *
 * Each place has a polygon boundary (GeoJSON) for accurate geofencing.
 * `nearestPlace()` uses point-in-polygon first, then falls back to
 * nearest-centroid if the user isn't inside any known zone.
 */
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import { point, polygon as turfPolygon } from "@turf/helpers";

export type ZoneCategory = "academic" | "sports" | "dining" | "housing" | "amenity" | "gate";

export interface CampusPlace {
  id: string;
  /** Index number on the official ISB campus map */
  num: number;
  label: string;
  /** Short label for the heatmap badge (≤7 chars) */
  short: string;
  category: ZoneCategory;
  /** Centroid lat — used for map markers and fallback distance calc */
  lat: number;
  /** Centroid lng */
  lng: number;
  /** Emoji shown in the place marker. */
  icon: string;
  /** Priority places get the larger marker + label on the map. */
  priority?: boolean;
  /** GeoJSON polygon coordinates [lng, lat][] for geofencing. */
  boundary?: number[][];
}

// ── Polygon boundaries from GeoJSON ──────────────────────────────────

const BOUNDS = {
  pools: [
    [76.72488887213376, 30.668548465298258],
    [76.72488887213376, 30.668184345794245],
    [76.72511661231255, 30.668184345794245],
    [76.72511661231255, 30.668548465298258],
    [76.72488887213376, 30.668548465298258],
  ],
  sv2b: [
    [76.7235292509709, 30.668183835107982],
    [76.7235292509709, 30.66788190605061],
    [76.72470747195388, 30.66788190605061],
    [76.72470747195388, 30.668183835107982],
    [76.7235292509709, 30.668183835107982],
  ],
  sv1b: [
    [76.72462787774435, 30.66715679012981],
    [76.72462787774435, 30.666779876620097],
    [76.7256795502941, 30.666779876620097],
    [76.7256795502941, 30.66715679012981],
    [76.72462787774435, 30.66715679012981],
  ],
  sv1a: [
    [76.7251185163721, 30.66798009963739],
    [76.72485415295478, 30.667806565863884],
    [76.7251741718299, 30.667438553554575],
    [76.72551506150137, 30.667175259335053],
    [76.72576898952133, 30.667378714022178],
    [76.72548375530607, 30.667698855089455],
    [76.7251185163721, 30.66798009963739],
  ],
  basketball: [
    [76.72608564707423, 30.667603903028777],
    [76.72608564707423, 30.667304351209367],
    [76.72629189725922, 30.667304351209367],
    [76.72629189725922, 30.667603903028777],
    [76.72608564707423, 30.667603903028777],
  ],
  football: [
    [76.72610376252675, 30.668008737575803],
    [76.72610376252675, 30.667611757309018],
    [76.72666845852433, 30.667611757309018],
    [76.72666845852433, 30.668008737575803],
    [76.72610376252675, 30.668008737575803],
  ],
  tennis: [
    [76.72608848233153, 30.667218646220178],
    [76.72608848233153, 30.66688799838421],
    [76.72645051841351, 30.66688799838421],
    [76.72645051841351, 30.667218646220178],
    [76.72608848233153, 30.667218646220178],
  ],
  pickle: [
    [76.72650950182032, 30.667110179859137],
    [76.72650950182032, 30.66696497470079],
    [76.72658882433268, 30.66696497470079],
    [76.72658882433268, 30.667110179859137],
    [76.72650950182032, 30.667110179859137],
  ],
  gazebo: [
    [76.7243165533369, 30.667719740417084],
    [76.7243165533369, 30.66755493368254],
    [76.72449994615243, 30.66755493368254],
    [76.72449994615243, 30.667719740417084],
    [76.7243165533369, 30.667719740417084],
  ],
  sdr: [
    [76.72525836930379, 30.668973843244615],
    [76.72525836930379, 30.668684285924016],
    [76.72561170609129, 30.668684285924016],
    [76.72561170609129, 30.668973843244615],
    [76.72525836930379, 30.668973843244615],
  ],
  recreation: [
    [76.72543086416056, 30.66855984779413],
    [76.72543086416056, 30.668138671418006],
    [76.72556719095195, 30.668138671418006],
    [76.72556719095195, 30.66855984779413],
    [76.72543086416056, 30.66855984779413],
  ],
  circle: [
    [76.72673540952911, 30.669309562244575],
    [76.72672562956464, 30.669309148989246],
    [76.72671594378683, 30.669307913203145],
    [76.72670644547524, 30.669305866787585],
    [76.72669722610404, 30.66930302945074],
    [76.72668837446099, 30.669299428517775],
    [76.72667997579244, 30.669295098667714],
    [76.72667211098222, 30.669290081599474],
    [76.72666485577288, 30.669284425630288],
    [76.72665828003606, 30.66927818523033],
    [76.72665244709967, 30.669271420498163],
    [76.72664741313801, 30.669264196581967],
    [76.72664322663076, 30.669256583052086],
    [76.7266399278961, 30.66924865323108],
    [76.7266375487025, 30.66924048348751],
    [76.72663611196263, 30.669232152500516],
    [76.72663563151285, 30.669223740502115],
    [76.72663611197991, 30.669215328504446],
    [76.72663754873642, 30.66920699751963],
    [76.72663992794536, 30.66919882777958],
    [76.72664322669343, 30.66919089796331],
    [76.72664741321171, 30.669183284439207],
    [76.72665244718155, 30.6691760605296],
    [76.72665828012299, 30.669169295804586],
    [76.72666485586151, 30.66916305541206],
    [76.72667211106915, 30.66915739945031],
    [76.7266799758743, 30.669152382389225],
    [76.72668837453469, 30.669148052545758],
    [76.7266972261667, 30.66914445161856],
    [76.72670644552448, 30.669141614286453],
    [76.72671594382075, 30.669139567874417],
    [76.72672562958194, 30.66913833209048],
    [76.72673540952911, 30.669137918835887],
    [76.72674518947629, 30.66913833209048],
    [76.72675487523748, 30.669139567874417],
    [76.72676437353374, 30.669141614286453],
    [76.7267735928915, 30.66914445161856],
    [76.72678244452355, 30.669148052545758],
    [76.72679084318392, 30.669152382389225],
    [76.72679870798908, 30.66915739945031],
    [76.72680596319671, 30.66916305541206],
    [76.72681253893523, 30.669169295804586],
    [76.72681837187667, 30.6691760605296],
    [76.72682340584652, 30.669183284439207],
    [76.7268275923648, 30.66919089796331],
    [76.72683089111287, 30.66919882777958],
    [76.7268332703218, 30.66920699751963],
    [76.72683470707831, 30.669215328504446],
    [76.72683518754538, 30.669223740502115],
    [76.72683470709559, 30.669232152500516],
    [76.72683327035574, 30.66924048348751],
    [76.72683089116212, 30.66924865323108],
    [76.72682759242747, 30.669256583052086],
    [76.72682340592021, 30.669264196581967],
    [76.72681837195856, 30.669271420498163],
    [76.72681253902216, 30.66927818523033],
    [76.72680596328534, 30.669284425630288],
    [76.72679870807599, 30.669290081599474],
    [76.7267908432658, 30.669295098667714],
    [76.72678244459723, 30.669299428517775],
    [76.72677359295419, 30.66930302945074],
    [76.72676437358298, 30.669305866787585],
    [76.7267548752714, 30.669307913203145],
    [76.72674518949358, 30.669309148989246],
    [76.72673540952911, 30.669309562244575],
  ],
  admin: [
    [76.72619648376781, 30.66934195981119],
    [76.72619648376781, 30.668940635909195],
    [76.72664498574306, 30.668940635909195],
    [76.72664498574306, 30.66934195981119],
    [76.72619648376781, 30.66934195981119],
  ],
  academic: [
    [76.72619286681606, 30.668875303953172],
    [76.72619286681606, 30.668209537693954],
    [76.72658711452078, 30.668209537693954],
    [76.72658711452078, 30.668875303953172],
    [76.72619286681606, 30.668875303953172],
  ],
  auditorium: [
    [76.7259107446061, 30.669307738458343],
    [76.7259107446061, 30.669027745114704],
    [76.72609882608003, 30.669027745114704],
    [76.72609882608003, 30.669307738458343],
    [76.7259107446061, 30.669307738458343],
  ],
} as const;

/** Compute centroid from polygon coords [lng, lat][] */
function centroid(coords: readonly (readonly number[])[]): { lat: number; lng: number } {
  // Exclude the closing point (same as first)
  const pts = coords.slice(0, -1);
  const lng = pts.reduce((s, c) => s + c[0], 0) / pts.length;
  const lat = pts.reduce((s, c) => s + c[1], 0) / pts.length;
  return { lat, lng };
}

// ── Places array ─────────────────────────────────────────────────────

export const CAMPUS_PLACES: CampusPlace[] = [
  { id: "main-gate",  num: 1,  label: "Main Gate",             short: "Gate",     category: "gate",     icon: "🚪", lat: 30.669760, lng: 76.728295 },
  { id: "pools",      num: 24, label: "Swimming Pools",        short: "Pool",     category: "sports",   icon: "🏊", ...centroid(BOUNDS.pools),       boundary: [...BOUNDS.pools] },
  { id: "wellness",   num: 25, label: "Wellness Centre",       short: "Wellness", category: "amenity",  icon: "🧘", lat: 30.667991, lng: 76.725318 },
  { id: "recreation", num: 26, label: "Recreation Centre/Gym", short: "Rec",      category: "amenity",  icon: "🏋️", ...centroid(BOUNDS.recreation), boundary: [...BOUNDS.recreation], priority: true },
  { id: "admin",      num: 8,  label: "Admin Square",          short: "Admin",    category: "academic", icon: "🏛️", ...centroid(BOUNDS.admin),       boundary: [...BOUNDS.admin] },
  { id: "circle",     num: 9,  label: "Circle (VC/CCO)",       short: "Circle",   category: "academic", icon: "⭕", ...centroid(BOUNDS.circle),      boundary: [...BOUNDS.circle] },
  { id: "academic",   num: 11, label: "Academic Square",       short: "Acad",     category: "academic", icon: "📚", ...centroid(BOUNDS.academic),    boundary: [...BOUNDS.academic], priority: true },
  { id: "auditorium", num: 12, label: "Godrej Auditorium",     short: "Audi",     category: "academic", icon: "🎤", ...centroid(BOUNDS.auditorium),  boundary: [...BOUNDS.auditorium] },
  { id: "jujus",      num: 15, label: "Café Juju's",           short: "Juju's",   category: "dining",   icon: "☕", lat: 30.668813, lng: 76.725554, priority: true },
  { id: "sdr",        num: 16, label: "Savorav (SDR)",         short: "SDR",      category: "dining",   icon: "🍜", ...centroid(BOUNDS.sdr),         boundary: [...BOUNDS.sdr], priority: true },
  { id: "basketball", num: 28, label: "Basketball Court",      short: "BBall",    category: "sports",   icon: "🏀", ...centroid(BOUNDS.basketball),  boundary: [...BOUNDS.basketball], priority: true },
  { id: "football",   num: 27, label: "Football Ground",       short: "Football", category: "sports",   icon: "⚽", ...centroid(BOUNDS.football),    boundary: [...BOUNDS.football], priority: true },
  { id: "tennis",     num: 29, label: "Tennis Courts",         short: "Tennis",   category: "sports",   icon: "🎾", ...centroid(BOUNDS.tennis),      boundary: [...BOUNDS.tennis], priority: true },
  { id: "pickle",     num: 30, label: "Pickleball Court",      short: "Pickle",   category: "sports",   icon: "🏓", ...centroid(BOUNDS.pickle),      boundary: [...BOUNDS.pickle] },
  { id: "sv1b",       num: 35, label: "SV-1B",                 short: "SV-1B",    category: "housing",  icon: "🏠", ...centroid(BOUNDS.sv1b),        boundary: [...BOUNDS.sv1b], priority: true },
  { id: "sv1a",       num: 33, label: "SV-1A",                 short: "SV-1A",    category: "housing",  icon: "🏠", ...centroid(BOUNDS.sv1a),        boundary: [...BOUNDS.sv1a], priority: true },
  { id: "eh1",        num: 36, label: "Executive Sq EH-1",     short: "EH-1",     category: "housing",  icon: "🏢", lat: 30.668487, lng: 76.724164 },
  { id: "eh2",        num: 38, label: "Executive Sq EH-2",     short: "EH-2",     category: "housing",  icon: "🏢", lat: 30.668743, lng: 76.724228 },
  { id: "sv2b",       num: 39, label: "SV-2B",                 short: "SV-2B",    category: "housing",  icon: "🏠", ...centroid(BOUNDS.sv2b),        boundary: [...BOUNDS.sv2b], priority: true },
  { id: "gazebo",     num: 41, label: "Gazebo",                short: "Gazebo",   category: "amenity",  icon: "🌿", ...centroid(BOUNDS.gazebo),      boundary: [...BOUNDS.gazebo] },
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
  const y = ((CAMPUS_BBOX.latMax - lat) / (CAMPUS_BBOX.latMax - CAMPUS_BBOX.latMin)) * 100;
  return { x, y };
}

/**
 * Find which campus place a coordinate falls inside.
 *
 * 1. Try point-in-polygon against all places with boundaries.
 * 2. If no polygon match, fall back to nearest centroid (Euclidean).
 */
export function nearestPlace(lat: number, lng: number): CampusPlace {
  const pt = point([lng, lat]); // turf uses [lng, lat]

  // Phase 1: exact polygon match
  for (const p of CAMPUS_PLACES) {
    if (!p.boundary) continue;
    const poly = turfPolygon([p.boundary]);
    if (booleanPointInPolygon(pt, poly)) {
      return p;
    }
  }

  // Phase 2: fallback to nearest centroid
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
