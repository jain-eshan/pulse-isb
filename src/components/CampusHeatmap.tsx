import { X, MapPin, Wifi } from "lucide-react";
import { COLOR } from "../lib/pulseTheme";
import type { LiveLocation } from "../hooks/useCampusActivity";

// ISB Mohali campus bounding box (Knowledge City, Sector 81)
// These define which lat/lng maps to which pixel on the heatmap canvas
const CAMPUS = {
  latMax: 30.6930,
  latMin: 30.6870,
  lngMin: 76.6840,
  lngMax: 76.6920,
};

// Named campus zones for the legend
const ZONES = [
  { id: "academic",   label: "Academic Block",  lat: 30.6915, lng: 76.6878, icon: "🏛️" },
  { id: "food",       label: "Food Court",       lat: 30.6905, lng: 76.6875, icon: "🍽️" },
  { id: "library",    label: "Library (LRC)",    lat: 30.6902, lng: 76.6860, icon: "📚" },
  { id: "sv",         label: "Student Village",  lat: 30.6882, lng: 76.6872, icon: "🏠" },
  { id: "sports",     label: "Sports Grounds",   lat: 30.6880, lng: 76.6895, icon: "⚽" },
  { id: "edc",        label: "Admin / EDC",      lat: 30.6920, lng: 76.6888, icon: "🏢" },
];

// Nearest zone for a location
function nearestZone(lat: number, lng: number) {
  let best = ZONES[0];
  let bestDist = Infinity;
  for (const z of ZONES) {
    const d = Math.hypot(z.lat - lat, z.lng - lng);
    if (d < bestDist) { bestDist = d; best = z; }
  }
  return best;
}

function toPercent(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - CAMPUS.lngMin) / (CAMPUS.lngMax - CAMPUS.lngMin)) * 100;
  const y = ((CAMPUS.latMax - lat) / (CAMPUS.latMax - CAMPUS.latMin)) * 100;
  return { x: Math.max(3, Math.min(97, x)), y: Math.max(3, Math.min(97, y)) };
}

interface Props {
  locations: LiveLocation[];
  onClose: () => void;
}

export default function CampusHeatmap({ locations, onClose }: Props) {
  // Count users per zone
  const zoneCounts = new Map<string, number>();
  for (const z of ZONES) zoneCounts.set(z.id, 0);
  for (const loc of locations) {
    const z = nearestZone(loc.lat, loc.lng);
    zoneCounts.set(z.id, (zoneCounts.get(z.id) ?? 0) + 1);
  }

  const maxCount = Math.max(1, ...Array.from(zoneCounts.values()));

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md rounded-[20px] overflow-hidden"
        style={{ background: COLOR.surface }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: COLOR.divider }}
        >
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: "#22C55E" }}
            />
            <p className="font-semibold" style={{ color: COLOR.ink, fontSize: 15 }}>
              {locations.length === 0
                ? "Nobody active on campus"
                : `${locations.length} ${locations.length === 1 ? "person" : "people"} on campus`}
            </p>
          </div>
          <button onClick={onClose} style={{ color: COLOR.ink3 }}>
            <X size={20} />
          </button>
        </div>

        {/* Heatmap canvas */}
        <div
          className="relative mx-4 my-4 rounded-[14px] overflow-hidden"
          style={{
            height: 260,
            background: `linear-gradient(145deg, ${COLOR.navyTint} 0%, #EEF2F8 100%)`,
            border: `1px solid ${COLOR.borderLight}`,
          }}
        >
          {/* Zone label markers */}
          {ZONES.map((z) => {
            const { x, y } = toPercent(z.lat, z.lng);
            const count = zoneCounts.get(z.id) ?? 0;
            return (
              <div
                key={z.id}
                className="absolute"
                style={{ left: `${x}%`, top: `${y}%`, transform: "translate(-50%, -50%)" }}
              >
                <div
                  className="flex flex-col items-center"
                  style={{ minWidth: 56 }}
                >
                  <span style={{ fontSize: 16 }}>{z.icon}</span>
                  {count > 0 && (
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded-full mt-0.5"
                      style={{ background: COLOR.navy, color: "#fff" }}
                    >
                      {count}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Live dots for each user */}
          {locations.map((loc) => {
            const { x, y } = toPercent(loc.lat, loc.lng);
            return (
              <div
                key={loc.user_id}
                className="absolute rounded-full"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  width: 28,
                  height: 28,
                  transform: "translate(-50%, -50%)",
                  background: "rgba(28,58,110,0.22)",
                  filter: "blur(8px)",
                  pointerEvents: "none",
                }}
              />
            );
          })}

          {/* "No data" state */}
          {locations.length === 0 && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <MapPin size={28} strokeWidth={1.5} style={{ color: COLOR.ink3 }} />
              <p className="t-meta text-center px-8">
                Share your location in Profile to see who's where on campus
              </p>
            </div>
          )}

          {/* Campus label */}
          <div
            className="absolute bottom-2 right-3 flex items-center gap-1"
          >
            <Wifi size={11} strokeWidth={1.5} style={{ color: COLOR.ink3 }} />
            <span className="t-meta" style={{ fontSize: 10 }}>Live · ISB Mohali</span>
          </div>
        </div>

        {/* Zone bar chart */}
        {locations.length > 0 && (
          <div className="px-4 pb-5 space-y-2">
            {ZONES.filter((z) => (zoneCounts.get(z.id) ?? 0) > 0)
              .sort((a, b) => (zoneCounts.get(b.id) ?? 0) - (zoneCounts.get(a.id) ?? 0))
              .map((z) => {
                const count = zoneCounts.get(z.id) ?? 0;
                const pct = Math.round((count / maxCount) * 100);
                return (
                  <div key={z.id} className="flex items-center gap-3">
                    <span style={{ fontSize: 14, width: 20 }}>{z.icon}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <p style={{ fontSize: 12, fontWeight: 600, color: COLOR.ink }}>{z.label}</p>
                        <p style={{ fontSize: 11, color: COLOR.ink2 }}>{count}</p>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: COLOR.borderLight }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: COLOR.navy }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Footer note */}
        <div
          className="px-5 py-3 border-t"
          style={{ borderColor: COLOR.divider }}
        >
          <p className="t-meta" style={{ fontSize: 11 }}>
            Only people who opted in to location sharing are shown. Locations are approximate.
          </p>
        </div>
      </div>
    </div>
  );
}
