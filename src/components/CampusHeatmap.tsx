/**
 * CampusHeatmap — Pulse Redesign v2
 *
 * Real Leaflet map (CartoDB Positron tiles, OpenStreetMap data — free, no
 * API key) with the same UX as Pulse Redesign v2.html:
 *   • Place markers show density (Quiet / Moderate / Busy) based on the live
 *     count of users currently broadcasting from the area.
 *   • "You are here" pulsing blue dot when the user is sharing location.
 *   • Other users render as small dots (only after they share their location).
 *   • Floating header / active count / density legend / location toggle /
 *     selected-place card overlays.
 *
 * No hardcoded counts. Everything comes from `useCampusActivity`
 * (Supabase Realtime over `user_locations`) and `useLocationBroadcast`.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import { X, MapPin } from "lucide-react";
import {
  CAMPUS_PLACES,
  CAMPUS_CENTER,
  densityBucket,
  nearestPlace,
  type CampusPlace,
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
  { color: string; bg: string; ring: string; label: string; labelColor: string }
> = {
  high:   { color: "#E53935", bg: "rgba(229,57,53,0.15)",  ring: "rgba(229,57,53,0.25)",  label: "Busy",     labelColor: "#C62828" },
  medium: { color: "#F9A825", bg: "rgba(249,168,37,0.15)", ring: "rgba(249,168,37,0.25)", label: "Moderate", labelColor: "#F57F17" },
  low:    { color: "#43A047", bg: "rgba(67,160,71,0.15)",  ring: "rgba(67,160,71,0.25)",  label: "Quiet",    labelColor: "#2E7D32" },
  empty:  { color: "#9E9E9E", bg: "rgba(158,158,158,0.10)", ring: "rgba(158,158,158,0.20)", label: "Empty",  labelColor: "#5A5A5A" },
};

const LEGEND_DENSITIES: Density[] = ["high", "medium", "low"];

export default function CampusHeatmap({
  locations,
  myLocation,
  onClose,
  onEnableSharing,
}: Props) {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const placeMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const youMarkerRef = useRef<L.Marker | null>(null);
  const otherMarkersRef = useRef<L.Marker[]>([]);

  const [selectedPlace, setSelectedPlace] = useState<CampusPlace | null>(null);

  const myPos = myLocation.status === "broadcasting" ? myLocation.position : null;

  // ─── Compute density per place from live locations ──────────────────
  const { densityByPlace, countByPlace, otherLocations } = useMemo(() => {
    const counts = new Map<string, number>();
    const others: LiveLocation[] = [...locations];
    for (const loc of locations) {
      const place = nearestPlace(loc.lat, loc.lng);
      counts.set(place.id, (counts.get(place.id) ?? 0) + 1);
    }
    // Add my position if not already in the broadcast list
    if (myPos) {
      const place = nearestPlace(myPos.lat, myPos.lng);
      const alreadyCounted = locations.some(
        (l) => Math.abs(l.lat - myPos.lat) < 1e-5 && Math.abs(l.lng - myPos.lng) < 1e-5
      );
      if (!alreadyCounted) {
        counts.set(place.id, (counts.get(place.id) ?? 0) + 1);
      }
    }
    const density = new Map<string, Density>();
    for (const place of CAMPUS_PLACES) {
      density.set(place.id, densityBucket(counts.get(place.id) ?? 0));
    }
    return { densityByPlace: density, countByPlace: counts, otherLocations: others };
  }, [locations, myPos]);

  const totalActive =
    locations.length +
    (myPos &&
    !locations.some(
      (l) =>
        Math.abs(l.lat - myPos.lat) < 1e-5 && Math.abs(l.lng - myPos.lng) < 1e-5
    )
      ? 1
      : 0);
  const rsvpCount = locations.filter((l) => l.source === "rsvp").length;

  // ─── 1. Initialise the Leaflet map once on mount ────────────────────
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

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      placeMarkersRef.current.clear();
      youMarkerRef.current = null;
      otherMarkersRef.current = [];
    };
  }, []);

  // ─── 2. Render place markers — re-runs whenever density changes ─────
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
      const ringWidth =
        density === "high" ? 6 : density === "medium" ? 4 : density === "low" ? 2 : 1;

      const html = `
        <div style="position: relative;">
          <div style="
            width: ${size}px; height: ${size}px; border-radius: 50%;
            background: ${dc.bg}; border: 2.5px solid ${dc.color};
            display: flex; align-items: center; justify-content: center;
            font-size: ${iconSize}px; line-height: 1;
            box-shadow: 0 2px 8px ${dc.ring}, 0 0 0 ${ringWidth}px ${dc.ring};
            cursor: pointer;
          ">
            <span>${place.icon}</span>
            ${
              isPriority && count > 0
                ? `<div style="
                  position: absolute; top: -8px; right: -8px;
                  background: ${dc.color}; color: #fff;
                  font-size: 9px; font-weight: 800;
                  font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
                  min-width: 18px; height: 18px; border-radius: 9px;
                  display: flex; align-items: center; justify-content: center;
                  border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.15);
                  padding: 0 4px;
                ">${count}</div>`
                : ""
            }
          </div>
          <div style="
            margin-top: 2px; text-align: center;
            font-size: ${isPriority ? 10 : 8}px;
            font-weight: ${isPriority ? 700 : 600};
            color: #1C3A6E;
            font-family: 'Plus Jakarta Sans', system-ui, sans-serif;
            text-shadow: 0 0 4px rgba(255,255,255,0.95), 0 0 8px rgba(255,255,255,0.8);
            white-space: nowrap;
          ">${place.short}</div>
        </div>
      `;

      const icon = L.divIcon({
        html,
        className: "pulse-place-marker",
        iconSize: [size, size + 16],
        iconAnchor: [size / 2, size / 2],
      });

      const marker = L.marker([place.lat, place.lng], { icon }).addTo(map);
      marker.on("click", () => {
        tap();
        setSelectedPlace((prev) => (prev?.id === place.id ? null : place));
      });
      placeMarkersRef.current.set(place.id, marker);
    }
  }, [densityByPlace, countByPlace]);

  // ─── 3. Render OTHER users as small anonymous dots ──────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    otherMarkersRef.current.forEach((m) => m.remove());
    otherMarkersRef.current = [];

    for (const loc of otherLocations) {
      const isRsvp = loc.source === "rsvp";
      const dotHtml = isRsvp
        ? `<div style="
            width: 8px; height: 8px; border-radius: 50%;
            background: rgba(79,110,247,0.35); border: 1.5px dashed rgba(79,110,247,0.5);
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
          "></div>`
        : `<div style="
            width: 8px; height: 8px; border-radius: 50%;
            background: rgba(28,58,110,0.55); border: 1.5px solid #fff;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
          "></div>`;
      const marker = L.marker([loc.lat, loc.lng], {
        icon: L.divIcon({
          html: dotHtml,
          className: "",
          iconSize: [8, 8],
          iconAnchor: [4, 4],
        }),
        interactive: false,
        zIndexOffset: 500,
      }).addTo(map);
      otherMarkersRef.current.push(marker);
    }
  }, [otherLocations]);

  // ─── 4. "You are here" marker tracks myPos ──────────────────────────
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (youMarkerRef.current) {
      youMarkerRef.current.remove();
      youMarkerRef.current = null;
    }

    if (!myPos) return;

    const youHtml = `<div style="position: relative;">
      <div style="
        position: absolute; left: -12px; top: -12px;
        width: 40px; height: 40px; border-radius: 50%;
        background: rgba(79,110,247,0.18); animation: pulse-dot 2s infinite;
      "></div>
      <div style="
        position: relative; width: 16px; height: 16px; border-radius: 50%;
        background: #4F6EF7; border: 3px solid #fff;
        box-shadow: 0 0 0 4px rgba(79,110,247,0.25), 0 2px 8px rgba(0,0,0,0.2);
      "></div>
    </div>`;

    const marker = L.marker([myPos.lat, myPos.lng], {
      icon: L.divIcon({
        html: youHtml,
        className: "",
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      }),
      zIndexOffset: 1000,
      interactive: false,
    }).addTo(map);

    youMarkerRef.current = marker;
  }, [myPos]);

  const selectedDensity = selectedPlace
    ? densityByPlace.get(selectedPlace.id) ?? "empty"
    : "empty";
  const selectedCount = selectedPlace
    ? countByPlace.get(selectedPlace.id) ?? 0
    : 0;
  const selectedDc = DENSITY_CONFIG[selectedDensity];

  const sharing = myLocation.status === "broadcasting";
  const requesting = myLocation.status === "requesting";
  const denied = myLocation.status === "denied";

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100dvh - 120px)",
        background: COLOR.bg,
        display: "flex",
        flexDirection: "column",
        borderRadius: 0,
      }}
    >
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.6); opacity: 0.05; }
        }
        .leaflet-container {
          background: #F9FAFB !important;
          font-family: ${FONT.sans};
        }
        .pulse-place-marker { background: transparent; border: none; }
      `}</style>

      <div ref={mapRef} style={{ flex: 1, width: "100%", zIndex: 1 }} />

      {/* Floating header */}
      <div
        style={{
          position: "absolute",
          top: 14,
          left: 12,
          right: 12,
          zIndex: 1000,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 10,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: 16,
            padding: "10px 14px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.08)",
            border: `1px solid ${COLOR.borderLight}`,
            pointerEvents: "auto",
          }}
        >
          <p
            style={{
              fontSize: 9,
              fontWeight: 700,
              color: COLOR.ink3,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 1,
              fontFamily: FONT.sans,
            }}
          >
            ISB Mohali
          </p>
          <h1
            style={{
              fontFamily: FONT.serif,
              fontSize: 20,
              fontWeight: 500,
              color: COLOR.ink,
              lineHeight: 1.05,
            }}
          >
            Campus <em>map</em>
          </h1>
        </div>

        <div
          style={{
            display: "flex",
            gap: 8,
            alignItems: "center",
            pointerEvents: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderRadius: 99,
              padding: "8px 12px",
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              border: `1px solid ${COLOR.borderLight}`,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                borderRadius: 4,
                background: totalActive > 0 ? "#16A34A" : COLOR.ink3,
                animation: totalActive > 0 ? "pulse-dot 2s infinite" : "none",
              }}
            />
            <span
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: totalActive > 0 ? "#15803D" : COLOR.ink2,
                fontFamily: FONT.sans,
              }}
            >
              {totalActive} around{rsvpCount > 0 ? ` · ${rsvpCount} expected` : ""}
            </span>
          </div>

          <button
            onClick={() => {
              tap();
              onClose();
            }}
            aria-label="Close map"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              background: "rgba(255,255,255,0.92)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: `1px solid ${COLOR.borderLight}`,
              boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: COLOR.ink2,
            }}
          >
            <X size={16} strokeWidth={2.25} />
          </button>
        </div>
      </div>

      {/* Density legend + share toggle (bottom-left) */}
      <div
        style={{
          position: "absolute",
          bottom: 16,
          left: 12,
          zIndex: 1000,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: 12,
            padding: "10px 12px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            border: `1px solid ${COLOR.borderLight}`,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          {LEGEND_DENSITIES.map((key) => {
            const dc = DENSITY_CONFIG[key];
            return (
              <div key={key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 5,
                    background: dc.color,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: COLOR.ink2,
                    fontFamily: FONT.sans,
                  }}
                >
                  {dc.label}
                </span>
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            tap();
            if (!sharing) onEnableSharing();
          }}
          disabled={sharing || requesting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            background: sharing
              ? "rgba(220,252,231,0.95)"
              : denied
              ? "rgba(254,226,226,0.95)"
              : "rgba(255,255,255,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderRadius: 12,
            padding: "10px 12px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
            border: `1px solid ${
              sharing ? "#86EFAC" : denied ? "#FCA5A5" : COLOR.borderLight
            }`,
            cursor: sharing ? "default" : "pointer",
            fontFamily: FONT.sans,
          }}
        >
          <MapPin
            size={13}
            strokeWidth={2}
            style={{
              color: sharing ? "#16A34A" : denied ? "#B91C1C" : COLOR.ink3,
            }}
          />
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: sharing ? "#15803D" : denied ? "#B91C1C" : COLOR.ink2,
            }}
          >
            {sharing
              ? "Sharing"
              : requesting
              ? "Locating…"
              : denied
              ? "Permission denied"
              : "Share location"}
          </span>
        </button>
      </div>

      {/* Selected place card */}
      {selectedPlace && (
        <div
          style={{
            position: "absolute",
            bottom: 16,
            left: 96,
            right: 12,
            zIndex: 1000,
            background: "rgba(255,255,255,0.96)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRadius: 18,
            padding: "14px 16px",
            boxShadow: "0 4px 24px rgba(0,0,0,0.12)",
            border: `1px solid ${COLOR.borderLight}`,
            pointerEvents: "auto",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: selectedDc.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 20,
                border: `2px solid ${selectedDc.color}`,
                flexShrink: 0,
              }}
            >
              {selectedPlace.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: COLOR.ink,
                  fontFamily: FONT.sans,
                  lineHeight: 1.2,
                }}
                className="truncate"
              >
                {selectedPlace.label}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 4,
                  flexWrap: "wrap",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    background: selectedDc.bg,
                    borderRadius: 99,
                    padding: "2px 8px",
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: selectedDc.color,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: selectedDc.labelColor,
                      fontFamily: FONT.sans,
                    }}
                  >
                    {selectedDc.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    color: COLOR.ink3,
                    fontFamily: FONT.sans,
                  }}
                >
                  {selectedCount === 0
                    ? "no one around"
                    : `${selectedCount} ${
                        selectedCount === 1 ? "person" : "people"
                      } around`}
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                tap();
                setSelectedPlace(null);
              }}
              aria-label="Close"
              style={{
                width: 28,
                height: 28,
                borderRadius: 14,
                background: COLOR.bg,
                border: `1px solid ${COLOR.border}`,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: COLOR.ink3,
                flexShrink: 0,
              }}
            >
              <X size={13} strokeWidth={2} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
