/**
 * CampusHeatmap — v3 redesign
 *
 * Non-fullscreen layout: header → map card → legend/toggle → spot list.
 * Leaflet for the real map, styled to match v3 clean aesthetic.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { Maximize2, Minimize2 } from "lucide-react";
import {
  CAMPUS_PLACES,
  CAMPUS_CENTER,
  densityBucket,
  nearestPlace,
  type Density,
} from "../lib/campusPlaces";
import type { LiveLocation } from "../hooks/useCampusActivity";
import type { LocationState } from "../hooks/useLocation";
import { COLOR, FONT } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";

interface Props {
  locations: LiveLocation[];
  myLocation: LocationState;
  onClose: () => void;
  onEnableSharing: () => void;
}

const DENSITY_CONFIG: Record<
  Density,
  { color: string; bg: string; ring: string; label: string; icon: string }
> = {
  high:   { color: "#DC2626", bg: "#FEE2E2", ring: "rgba(220,38,38,0.25)", label: "Busy",     icon: "🔴" },
  medium: { color: "#D97706", bg: "#FEF3C7", ring: "rgba(217,119,6,0.25)", label: "Moderate", icon: "🟠" },
  low:    { color: "#16A34A", bg: "#DCFCE7", ring: "rgba(22,163,74,0.25)", label: "Quiet",    icon: "🟢" },
  empty:  { color: "#9CA3AF", bg: "#F3F4F6", ring: "rgba(156,163,175,0.2)", label: "Empty",  icon: "⚪" },
};

// Category icons for the spot list
const CATEGORY_ICONS: Record<string, { emoji: string; bg: string }> = {
  academic: { emoji: "📚", bg: "#FEE2E2" },
  dining:   { emoji: "🍜", bg: "#FEF3C7" },
  sports:   { emoji: "🏀", bg: "#DCFCE7" },
  housing:  { emoji: "🏠", bg: "#FEF3C7" },
  amenity:  { emoji: "🎵", bg: "#F3F4F6" },
};

export default function CampusHeatmap({
  locations,
  myLocation,
  onClose: _onClose,
  onEnableSharing,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const placeMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const youMarkerRef = useRef<L.Marker | null>(null);
  const otherMarkersRef = useRef<L.Marker[]>([]);
  const [mapExpanded, setMapExpanded] = useState(false);

  const myPos = myLocation.status === "broadcasting" ? myLocation.position : null;

  // ─── Compute density per place ───────────────────────────────────
  const { densityByPlace, countByPlace, otherLocations } = useMemo(() => {
    const counts = new Map<string, number>();
    const others: LiveLocation[] = [...locations];
    for (const loc of locations) {
      const place = nearestPlace(loc.lat, loc.lng);
      counts.set(place.id, (counts.get(place.id) ?? 0) + 1);
    }
    if (myPos) {
      const place = nearestPlace(myPos.lat, myPos.lng);
      const alreadyCounted = locations.some(
        (l) => Math.abs(l.lat - myPos.lat) < 1e-5 && Math.abs(l.lng - myPos.lng) < 1e-5
      );
      if (!alreadyCounted) counts.set(place.id, (counts.get(place.id) ?? 0) + 1);
    }
    const density = new Map<string, Density>();
    for (const place of CAMPUS_PLACES) {
      density.set(place.id, densityBucket(counts.get(place.id) ?? 0));
    }
    return { densityByPlace: density, countByPlace: counts, otherLocations: others };
  }, [locations, myPos]);

  const totalActive =
    locations.length +
    (myPos && !locations.some((l) => Math.abs(l.lat - myPos.lat) < 1e-5 && Math.abs(l.lng - myPos.lng) < 1e-5) ? 1 : 0);

  // ─── Leaflet map init ────────────────────────────────────────────
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;
    const map = L.map(mapRef.current, {
      center: CAMPUS_CENTER,
      zoom: 17,
      zoomControl: false,
      attributionControl: false,
      maxZoom: 19,
      minZoom: 15,
    });
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap, © CARTO",
    }).addTo(map);
    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => { map.remove(); mapInstanceRef.current = null; placeMarkersRef.current.clear(); youMarkerRef.current = null; otherMarkersRef.current = []; };
  }, []);

  // Invalidate on expand/collapse
  useEffect(() => {
    setTimeout(() => mapInstanceRef.current?.invalidateSize(), 300);
  }, [mapExpanded]);

  // ─── Place markers ───────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    placeMarkersRef.current.forEach((m) => m.remove());
    placeMarkersRef.current.clear();

    for (const place of CAMPUS_PLACES) {
      const density = densityByPlace.get(place.id) ?? "empty";
      const dc = DENSITY_CONFIG[density];
      const count = countByPlace.get(place.id) ?? 0;
      const isPriority = !!place.priority;
      const size = isPriority ? 36 : 26;
      const iconSize = isPriority ? 18 : 13;
      const ringWidth = density === "high" ? 6 : density === "medium" ? 4 : density === "low" ? 2 : 1;

      const html = `
        <div style="position: relative;">
          <div style="width: ${size}px; height: ${size}px; border-radius: 50%; background: ${dc.bg}; border: 2.5px solid ${dc.color}; display: flex; align-items: center; justify-content: center; font-size: ${iconSize}px; box-shadow: 0 2px 8px ${dc.ring}, 0 0 0 ${ringWidth}px ${dc.ring}; cursor: pointer;">
            <span>${place.icon}</span>
            ${isPriority && count > 0 ? `<div style="position: absolute; top: -8px; right: -8px; background: ${dc.color}; color: #fff; font-size: 9px; font-weight: 800; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; min-width: 18px; height: 18px; border-radius: 9px; display: flex; align-items: center; justify-content: center; border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.15); padding: 0 4px;">${count}</div>` : ""}
          </div>
          <div style="margin-top: 2px; text-align: center; font-size: ${isPriority ? 10 : 8}px; font-weight: ${isPriority ? 700 : 600}; color: #1C3A6E; font-family: 'Plus Jakarta Sans', system-ui, sans-serif; text-shadow: 0 0 4px rgba(255,255,255,0.95), 0 0 8px rgba(255,255,255,0.8); white-space: nowrap;">${place.short}</div>
        </div>`;

      const icon = L.divIcon({ html, className: "pulse-place-marker", iconSize: [size, size + 16], iconAnchor: [size / 2, size / 2] });
      const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);
      placeMarkersRef.current.set(place.id, marker);
    }
  }, [densityByPlace, countByPlace]);

  // ─── Other user dots ─────────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    otherMarkersRef.current.forEach((m) => m.remove());
    otherMarkersRef.current = [];

    for (const loc of otherLocations) {
      const isRsvp = loc.source === "rsvp";
      const dotHtml = isRsvp
        ? `<div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(79,110,247,0.35); border: 1.5px dashed rgba(79,110,247,0.5);"></div>`
        : `<div style="width: 8px; height: 8px; border-radius: 50%; background: rgba(28,58,110,0.55); border: 1.5px solid #fff; box-shadow: 0 1px 3px rgba(0,0,0,0.2);"></div>`;
      const marker = L.marker([loc.lat, loc.lng], {
        icon: L.divIcon({ html: dotHtml, className: "", iconSize: [8, 8], iconAnchor: [4, 4] }),
        interactive: false,
        zIndexOffset: 500,
      }).addTo(map);
      otherMarkersRef.current.push(marker);
    }
  }, [otherLocations]);

  // ─── "You are here" dot ──────────────────────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (youMarkerRef.current) { youMarkerRef.current.remove(); youMarkerRef.current = null; }
    if (!myPos) return;

    const youHtml = `<div style="position: relative;">
      <div style="position: absolute; left: -12px; top: -12px; width: 40px; height: 40px; border-radius: 50%; background: rgba(79,110,247,0.18); animation: pulse-dot 2s infinite;"></div>
      <div style="position: relative; width: 16px; height: 16px; border-radius: 50%; background: #4F6EF7; border: 3px solid #fff; box-shadow: 0 0 0 4px rgba(79,110,247,0.25), 0 2px 8px rgba(0,0,0,0.2);"></div>
    </div>`;

    youMarkerRef.current = L.marker([myPos.lat, myPos.lng], {
      icon: L.divIcon({ html: youHtml, className: "", iconSize: [16, 16], iconAnchor: [8, 8] }),
      zIndexOffset: 1000,
      interactive: false,
    }).addTo(map);
  }, [myPos]);

  const sharing = myLocation.status === "broadcasting";
  const denied = myLocation.status === "denied";

  // Sort spots: busiest first
  const sortedSpots = useMemo(() => {
    return [...CAMPUS_PLACES]
      .filter((p) => p.priority)
      .sort((a, b) => (countByPlace.get(b.id) ?? 0) - (countByPlace.get(a.id) ?? 0));
  }, [countByPlace]);

  return (
    <div className="min-h-screen pb-28" style={{ background: COLOR.bg }}>
      <style>{`
        @keyframes pulse-dot { 0%, 100% { transform: scale(1); opacity: 0.5; } 50% { transform: scale(1.6); opacity: 0.05; } }
        .leaflet-container { background: #F9FAFB !important; font-family: ${FONT.sans}; }
        .pulse-place-marker { background: transparent; border: none; }
      `}</style>

      {/* Header */}
      <header className="px-5 md:px-8 pt-16 md:pt-10 pb-4" style={{ maxWidth: 960 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontFamily: FONT.serif, fontSize: 28, fontWeight: 500, color: COLOR.ink, lineHeight: 1.1 }}>
              Campus <em>map</em>
            </h1>
            <p style={{ fontSize: 14, color: COLOR.ink2, fontFamily: FONT.sans, marginTop: 4 }}>
              See where your cohort is right now
            </p>
          </div>
          {totalActive > 0 && (
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", borderRadius: 99,
              border: `1px solid ${COLOR.borderLight}`, background: COLOR.surface,
            }}>
              <div style={{ width: 8, height: 8, borderRadius: 4, background: "#16A34A" }} />
              <span style={{ fontSize: 13, fontWeight: 700, color: COLOR.ink, fontFamily: FONT.sans }}>
                {totalActive} active
              </span>
            </div>
          )}
        </div>
      </header>

      <main className="px-4 md:px-8" style={{ maxWidth: 960 }}>
        {/* Map card */}
        <div
          style={{
            borderRadius: 16,
            overflow: "hidden",
            border: `1px solid ${COLOR.borderLight}`,
            position: "relative",
            background: "#F9FAFB",
          }}
        >
          {/* ISB Mohali Campus label */}
          <div style={{
            position: "absolute", top: 12, left: 12, zIndex: 1000,
            background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
            borderRadius: 8, padding: "5px 10px",
            fontSize: 11, fontWeight: 700, color: COLOR.ink2, fontFamily: FONT.sans,
            border: `1px solid ${COLOR.borderLight}`,
          }}>
            ISB Mohali Campus
          </div>

          {/* Expand/collapse button */}
          <button
            onClick={() => { tap(); setMapExpanded((v) => !v); }}
            style={{
              position: "absolute", top: 12, right: 12, zIndex: 1000,
              width: 36, height: 36, borderRadius: 10,
              background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)",
              border: `1px solid ${COLOR.borderLight}`, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            {mapExpanded ? <Minimize2 size={15} color={COLOR.ink2} /> : <Maximize2 size={15} color={COLOR.ink2} />}
          </button>

          <div
            ref={mapRef}
            style={{
              width: "100%",
              height: mapExpanded ? "70vh" : 340,
              transition: "height 0.3s ease",
            }}
          />
        </div>

        {/* Legend */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 4px" }}>
          {(["high", "medium", "low"] as Density[]).map((d) => {
            const dc = DENSITY_CONFIG[d];
            return (
              <div key={d} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: 4, background: dc.color }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: COLOR.ink2, fontFamily: FONT.sans }}>{dc.label}</span>
              </div>
            );
          })}
        </div>

        {/* Share location toggle */}
        <button
          onClick={() => { tap(); if (!sharing) onEnableSharing(); }}
          disabled={sharing}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            width: "100%", padding: "14px 16px", borderRadius: 14,
            border: `1px solid ${sharing ? "#86EFAC" : COLOR.borderLight}`,
            background: sharing ? "#F0FDF4" : COLOR.surface,
            cursor: sharing ? "default" : "pointer",
            marginBottom: 20,
          }}
        >
          {/* Toggle visual */}
          <div style={{
            width: 44, height: 26, borderRadius: 13, padding: 2,
            background: sharing ? "#16A34A" : COLOR.border,
            transition: "background 0.2s",
            display: "flex", alignItems: "center",
            justifyContent: sharing ? "flex-end" : "flex-start",
            flexShrink: 0,
          }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.15)", transition: "all 0.2s" }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: sharing ? "#15803D" : COLOR.ink, fontFamily: FONT.sans }}>
            {sharing ? "Sharing your location" : denied ? "Location permission denied" : "Share your location"}
          </span>
        </button>

        {/* ── ALL SPOTS list ── */}
        <p style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FONT.sans, marginBottom: 10, padding: "0 2px" }}>
          All Spots
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {sortedSpots.map((place) => {
            const density = densityByPlace.get(place.id) ?? "empty";
            const dc = DENSITY_CONFIG[density];
            const count = countByPlace.get(place.id) ?? 0;
            const catStyle = CATEGORY_ICONS[place.category] ?? { emoji: "📍", bg: "#F3F4F6" };

            return (
              <div
                key={place.id}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 16px", borderRadius: 14,
                  border: `1px solid ${COLOR.borderLight}`,
                  background: COLOR.surface,
                }}
              >
                {/* Icon */}
                <div style={{
                  width: 42, height: 42, borderRadius: 12,
                  background: catStyle.bg,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 20, flexShrink: 0,
                }}>
                  {place.icon}
                </div>
                {/* Name */}
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: COLOR.ink, fontFamily: FONT.sans }}>
                  {place.label}
                </span>
                {/* Density dot + count */}
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: 4, background: count > 0 ? dc.color : COLOR.border }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: count > 0 ? dc.color : COLOR.ink3, fontFamily: FONT.sans }}>
                    {count}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
}
