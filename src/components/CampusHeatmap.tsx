/**
 * CampusHeatmap — ISB Mohali, Knowledge City Sector 81.
 *
 * Replicates the official campus map (main road, IISER edge, gates) with
 * real GPS coordinates for all indexed places. Live density is shown as
 * coloured blobs (no exact numbers — just empty / few / some / busy).
 * The user's own location is rendered prominently when they're sharing.
 */
import { useMemo } from "react";
import { X, MapPin, Navigation, AlertCircle, Loader2 } from "lucide-react";
import { COLOR, FONT } from "../lib/pulseTheme";
import {
  CAMPUS_PLACES,
  CATEGORY_STYLE,
  DENSITY_STYLE,
  densityBucket,
  latLngToXY,
  nearestPlace,
  type Density,
} from "../lib/campusPlaces";
import type { LiveLocation } from "../hooks/useCampusActivity";
import type { LocationState } from "../hooks/useLocation";

interface Props {
  locations: LiveLocation[];
  myLocation: LocationState;
  onClose: () => void;
  onEnableSharing: () => void;
}

export default function CampusHeatmap({
  locations,
  myLocation,
  onClose,
  onEnableSharing,
}: Props) {
  // Bucket every live location into its nearest place
  const densityByPlace = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of CAMPUS_PLACES) map.set(p.id, 0);
    for (const loc of locations) {
      const place = nearestPlace(loc.lat, loc.lng);
      map.set(place.id, (map.get(place.id) ?? 0) + 1);
    }
    return map;
  }, [locations]);

  const totalActive = locations.length;
  const totalDensity: Density =
    totalActive === 0 ? "empty" :
    totalActive <= 3 ? "low" :
    totalActive <= 8 ? "medium" : "high";

  // My current XY (if available)
  const myPos =
    myLocation.status === "broadcasting" || myLocation.status === "broadcast-error"
      ? myLocation.position
      : null;
  const myXY = myPos ? latLngToXY(myPos.lat, myPos.lng) : null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-stretch md:items-center md:justify-center"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full md:max-w-[460px] flex flex-col"
        style={{
          background: COLOR.bg,
          borderRadius: 0,
          maxHeight: "100vh",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: "calc(env(safe-area-inset-top) + 14px) 18px 12px",
            background: COLOR.surface,
            borderBottom: `1px solid ${COLOR.borderLight}`,
          }}
        >
          <div>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: COLOR.ink3,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                fontFamily: FONT.sans,
              }}
            >
              ISB Mohali · Live
            </p>
            <h2
              style={{
                fontFamily: FONT.serif,
                fontSize: 22,
                fontWeight: 500,
                color: COLOR.ink,
                lineHeight: 1.1,
                marginTop: 2,
              }}
            >
              Campus <em>map</em>
            </h2>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <DensityPill density={totalDensity} totalActive={totalActive} />
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 99,
                border: `1px solid ${COLOR.border}`,
                background: COLOR.surface,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              aria-label="Close map"
            >
              <X size={16} style={{ color: COLOR.ink2 }} />
            </button>
          </div>
        </div>

        {/* Banner: not sharing yet */}
        {myLocation.status !== "broadcasting" && myLocation.status !== "broadcast-error" && (
          <ShareBanner state={myLocation} onEnable={onEnableSharing} />
        )}

        {/* SVG campus map */}
        <div
          className="relative mx-3 mt-3 mb-2 rounded-[18px] overflow-hidden"
          style={{
            height: 360,
            background: "linear-gradient(160deg, #E6EFE0 0%, #D5E2CA 60%, #C4D8BC 100%)",
            border: `1px solid ${COLOR.borderLight}`,
            boxShadow: "0 2px 14px rgba(0,0,0,0.06)",
          }}
        >
          <CampusBaseSVG />

          {/* Density blobs (one per place) */}
          {CAMPUS_PLACES.map((p) => {
            const count = densityByPlace.get(p.id) ?? 0;
            const bucket = densityBucket(count);
            if (bucket === "empty") return null;
            const { x, y } = latLngToXY(p.lat, p.lng);
            const size = bucket === "high" ? 88 : bucket === "medium" ? 64 : 44;
            return (
              <div
                key={`blob-${p.id}`}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                  width: size,
                  height: size,
                  borderRadius: "50%",
                  background: DENSITY_STYLE[bucket].fill,
                  filter: "blur(14px)",
                  pointerEvents: "none",
                }}
              />
            );
          })}

          {/* Place markers */}
          {CAMPUS_PLACES.map((p) => {
            const count = densityByPlace.get(p.id) ?? 0;
            const bucket = densityBucket(count);
            const { x, y } = latLngToXY(p.lat, p.lng);
            const cat = CATEGORY_STYLE[p.category];
            const isLive = bucket !== "empty";

            return (
              <div
                key={p.id}
                style={{
                  position: "absolute",
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: "translate(-50%, -50%)",
                  zIndex: 2,
                }}
              >
                <div
                  style={{
                    background: isLive ? COLOR.navy : "rgba(255,255,255,0.95)",
                    color: isLive ? "#fff" : COLOR.ink,
                    border: `1.5px solid ${
                      isLive ? COLOR.navy : "rgba(255,255,255,0.6)"
                    }`,
                    borderRadius: 8,
                    padding: "3px 8px",
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    boxShadow: isLive
                      ? "0 3px 10px rgba(28,58,110,0.30)"
                      : "0 1px 6px rgba(0,0,0,0.10)",
                    backdropFilter: "blur(4px)",
                  }}
                >
                  <span style={{ fontSize: 10 }}>{cat.emoji}</span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      fontFamily: FONT.sans,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {p.short}
                  </span>
                  {isLive && (
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: 3,
                        background:
                          bucket === "high"
                            ? "#22C55E"
                            : bucket === "medium"
                            ? "#86EFAC"
                            : "rgba(255,255,255,0.7)",
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}

          {/* "You are here" dot */}
          {myXY && (
            <div
              style={{
                position: "absolute",
                left: `${myXY.x}%`,
                top: `${myXY.y}%`,
                transform: "translate(-50%, -50%)",
                zIndex: 3,
                pointerEvents: "none",
              }}
            >
              <div
                className="animate-pulse"
                style={{
                  position: "absolute",
                  inset: -10,
                  borderRadius: "50%",
                  background: "rgba(79,110,247,0.25)",
                }}
              />
              <div
                style={{
                  position: "relative",
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  background: "#4F6EF7",
                  border: "3px solid #fff",
                  boxShadow: "0 0 0 4px rgba(79,110,247,0.30)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: 18,
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#4F6EF7",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  padding: "2px 7px",
                  borderRadius: 6,
                  whiteSpace: "nowrap",
                  fontFamily: FONT.sans,
                }}
              >
                You
              </div>
            </div>
          )}

          {/* Out-of-bounds badge — user is too far from campus */}
          {myXY && (myXY.x < 0 || myXY.x > 100 || myXY.y < 0 || myXY.y > 100) && (
            <div
              className="absolute top-3 left-3 right-3 flex items-center gap-2"
              style={{
                background: "rgba(0,0,0,0.7)",
                color: "#fff",
                borderRadius: 10,
                padding: "8px 10px",
                fontSize: 11,
                fontWeight: 600,
                fontFamily: FONT.sans,
              }}
            >
              <AlertCircle size={13} />
              You're outside the campus bounds — map is showing density only.
            </div>
          )}

          {/* Map labels */}
          <div
            style={{
              position: "absolute",
              bottom: 8,
              right: 12,
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 9,
              color: COLOR.ink3,
              fontFamily: FONT.sans,
              fontWeight: 600,
            }}
          >
            <Navigation size={9} /> Knowledge City · Sector 81
          </div>
        </div>

        {/* Density legend */}
        <div className="px-4 pb-3">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "10px 14px",
              borderRadius: 12,
              background: COLOR.surface,
              border: `1px solid ${COLOR.borderLight}`,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: COLOR.ink3,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: FONT.sans,
              }}
            >
              Density
            </p>
            {(["low", "medium", "high"] as Density[]).map((d) => (
              <LegendDot key={d} density={d} />
            ))}
          </div>
        </div>

        {/* Hot zones list */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <p
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: COLOR.ink3,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              marginBottom: 8,
              fontFamily: FONT.sans,
            }}
          >
            Where the action is
          </p>

          {totalActive === 0 ? (
            <div
              style={{
                background: COLOR.surface,
                border: `1px dashed ${COLOR.border}`,
                borderRadius: 12,
                padding: "14px 16px",
                textAlign: "center",
              }}
            >
              <MapPin
                size={20}
                strokeWidth={1.5}
                style={{ color: COLOR.ink3, margin: "0 auto 6px" }}
              />
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: COLOR.ink2,
                  fontFamily: FONT.sans,
                }}
              >
                Nobody's sharing yet
              </p>
              <p
                style={{
                  fontSize: 11,
                  color: COLOR.ink3,
                  marginTop: 4,
                  fontFamily: FONT.sans,
                }}
              >
                Once people on Pulse turn on location sharing, you'll see live
                density here — never names.
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {[...CAMPUS_PLACES]
                .map((p) => ({
                  ...p,
                  count: densityByPlace.get(p.id) ?? 0,
                }))
                .filter((p) => p.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 6)
                .map((p) => (
                  <ZoneRow key={p.id} place={p} count={p.count} />
                ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────── */

/** Schematic SVG outline of the campus — main road, IISER edge, gates. */
function CampusBaseSVG() {
  return (
    <svg
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* Campus boundary — irregular polygon traced from official map */}
      <polygon
        points="6,12 78,8 92,32 88,72 60,90 22,86 8,46"
        fill="#CBD9C3"
        fillOpacity="0.45"
        stroke="#98B48C"
        strokeWidth="0.5"
        strokeDasharray="2,1.5"
      />

      {/* Main Road (north) */}
      <path
        d="M 4,8 L 95,4"
        stroke="#B8A898"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 4,8 L 95,4"
        stroke="#fff"
        strokeWidth="0.5"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="2,2"
      />

      {/* Service road */}
      <path
        d="M 7,14 L 80,11"
        stroke="#C8B8A8"
        strokeWidth="1.3"
        fill="none"
        strokeLinecap="round"
        opacity="0.7"
      />

      {/* Internal paths */}
      <path
        d="M 30,22 Q 55,18 80,24"
        stroke="#B8B0A0"
        strokeWidth="0.8"
        fill="none"
        opacity="0.45"
      />
      <path
        d="M 22,52 L 88,52"
        stroke="#B8B0A0"
        strokeWidth="0.9"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M 50,18 L 50,86"
        stroke="#B8B0A0"
        strokeWidth="0.8"
        fill="none"
        opacity="0.45"
      />
      <path
        d="M 25,72 L 78,72"
        stroke="#B8B0A0"
        strokeWidth="0.7"
        fill="none"
        opacity="0.4"
      />

      {/* Green zones (lawns, trees) */}
      <ellipse cx="22" cy="34" rx="9" ry="6" fill="#B0CC98" opacity="0.45" />
      <ellipse cx="68" cy="22" rx="6" ry="4" fill="#B0CC98" opacity="0.4" />
      <ellipse cx="60" cy="62" rx="10" ry="7" fill="#A8C498" opacity="0.35" />
      <ellipse cx="30" cy="78" rx="8" ry="5" fill="#A8C498" opacity="0.32" />

      {/* IISER border (east edge) */}
      <path
        d="M 92,32 L 88,72"
        stroke="#A0B488"
        strokeWidth="0.5"
        fill="none"
        opacity="0.6"
        strokeDasharray="1.2,2"
      />
      <text
        x="95"
        y="55"
        fontSize="3"
        fontWeight="700"
        fill="#6A7B5A"
        opacity="0.7"
        textAnchor="middle"
        transform="rotate(90, 95, 55)"
      >
        IISER
      </text>

      {/* Gate markers (rendered above the polygon) */}
      <rect x="74" y="6" width="3" height="3" rx="0.5" fill="#8B7B6A" opacity="0.85" />
      <rect x="38" y="88" width="3" height="3" rx="0.5" fill="#8B7B6A" opacity="0.85" />

      {/* Subtle road labels */}
      <text x="48" y="3" fontSize="2.4" fontWeight="700" fill="#6A5A4A" opacity="0.7" textAnchor="middle">
        MAIN ROAD
      </text>
      <text x="40" y="91.5" fontSize="2" fontWeight="600" fill="#6A5A4A" opacity="0.6" textAnchor="middle">
        REAR GATE
      </text>
      <text x="76" y="11.5" fontSize="2" fontWeight="600" fill="#6A5A4A" opacity="0.6" textAnchor="middle">
        MAIN GATE
      </text>
    </svg>
  );
}

function ShareBanner({
  state,
  onEnable,
}: {
  state: LocationState;
  onEnable: () => void;
}) {
  let title = "Turn on location sharing to appear on the map";
  let body = "Only your campus zone is shown to others — never names.";
  let action: React.ReactNode = (
    <button
      onClick={onEnable}
      style={{
        padding: "7px 14px",
        borderRadius: 10,
        background: COLOR.navy,
        color: "#fff",
        fontSize: 12,
        fontWeight: 700,
        border: "none",
        cursor: "pointer",
        fontFamily: FONT.sans,
        whiteSpace: "nowrap",
      }}
    >
      Turn on
    </button>
  );

  if (state.status === "requesting") {
    title = "Asking your browser for location…";
    body = "Tap Allow when prompted.";
    action = <Loader2 size={16} className="animate-spin" style={{ color: COLOR.ink3 }} />;
  } else if (state.status === "denied") {
    title = "Location permission denied";
    body = state.message;
    action = null;
  } else if (state.status === "unavailable") {
    title = "Location unavailable";
    body = state.message;
    action = null;
  }

  return (
    <div
      style={{
        margin: "10px 12px 0",
        padding: "10px 12px",
        borderRadius: 12,
        background: "#FEF3C7",
        border: "1px solid #FDE68A",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <AlertCircle size={16} strokeWidth={1.75} style={{ color: "#92400E", flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#92400E",
            fontFamily: FONT.sans,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontSize: 11,
            color: "#A16207",
            marginTop: 1,
            fontFamily: FONT.sans,
            lineHeight: 1.4,
          }}
        >
          {body}
        </p>
      </div>
      {action}
    </div>
  );
}

function DensityPill({
  density,
  totalActive,
}: {
  density: Density;
  totalActive: number;
}) {
  const colour =
    density === "high" ? "#16A34A" :
    density === "medium" ? "#65A30D" :
    density === "low" ? "#84CC16" : "#9CA3AF";
  const bg =
    density === "high" ? "#DCFCE7" :
    density === "medium" ? "#ECFCCB" :
    density === "low" ? "#F7FEE7" : COLOR.borderLight;

  const label =
    totalActive === 0 ? "Quiet" :
    density === "high" ? "Buzzing" :
    density === "medium" ? "Active" : "Live";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        background: bg,
        borderRadius: 99,
        padding: "5px 11px",
      }}
    >
      <span
        className="animate-pulse"
        style={{
          width: 7,
          height: 7,
          borderRadius: 4,
          background: colour,
        }}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: colour,
          fontFamily: FONT.sans,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function LegendDot({ density }: { density: Density }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
      <span
        style={{
          width: 12,
          height: 12,
          borderRadius: 6,
          background: DENSITY_STYLE[density].ring,
        }}
      />
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: COLOR.ink2,
          fontFamily: FONT.sans,
          textTransform: "capitalize",
        }}
      >
        {density}
      </span>
    </div>
  );
}

function ZoneRow({
  place,
  count,
}: {
  place: (typeof CAMPUS_PLACES)[number];
  count: number;
}) {
  const cat = CATEGORY_STYLE[place.category];
  const bucket = densityBucket(count);
  const dStyle = DENSITY_STYLE[bucket];

  return (
    <div
      style={{
        background: COLOR.surface,
        borderRadius: 12,
        padding: "10px 12px",
        border: `1px solid ${COLOR.border}`,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 8,
          background: cat.tint,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 14,
          flexShrink: 0,
        }}
      >
        {cat.emoji}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: COLOR.ink,
            fontFamily: FONT.sans,
          }}
        >
          {place.label}
        </p>
        <div
          style={{
            height: 4,
            borderRadius: 2,
            background: COLOR.borderLight,
            marginTop: 4,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              borderRadius: 2,
              background: dStyle.ring,
              width:
                bucket === "high" ? "100%" : bucket === "medium" ? "60%" : "30%",
              transition: "width 0.6s ease",
            }}
          />
        </div>
      </div>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: dStyle.ring,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          fontFamily: FONT.sans,
        }}
      >
        {dStyle.label}
      </span>
    </div>
  );
}
