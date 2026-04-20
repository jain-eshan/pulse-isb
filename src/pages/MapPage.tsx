import { useState, useEffect, useRef } from "react";
import type { User, UserLocation } from "../types";

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === "https://your-project.supabase.co";

const ISB_MOHALI = { lat: 30.6960, lng: 76.7360 };

interface MapPageProps {
  user: User;
  onToggleLocation: (enabled: boolean) => void;
}

declare global {
  interface Window {
    initMap: () => void;
  }
}

export default function MapPage({ user, onToggleLocation }: MapPageProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null);
  const [locations, setLocations] = useState<UserLocation[]>([]);
  const [locationSharing, setLocationSharing] = useState(user.location_sharing);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [activeCount, setActiveCount] = useState(0);

  useEffect(() => {
    loadLocations();
    if (IS_DEMO) return;
    let ch: ReturnType<typeof import("../lib/supabase")["supabase"]["channel"]> | null = null;
    import("../lib/supabase").then(({ supabase }) => {
      ch = supabase
        .channel("locations-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "user_locations" }, loadLocations)
        .subscribe();
    });
    return () => { if (ch) import("../lib/supabase").then(({ supabase }) => supabase.removeChannel(ch!)); };
  }, []);

  async function loadLocations() {
    if (IS_DEMO) {
      const demoLocs: UserLocation[] = Array.from({ length: 12 }, (_, i) => ({
        user_id: `demo-${i}`,
        lat: ISB_MOHALI.lat + (Math.random() - 0.5) * 0.05,
        lng: ISB_MOHALI.lng + (Math.random() - 0.5) * 0.05,
        updated_at: new Date().toISOString(),
      }));
      setLocations(demoLocs);
      setActiveCount(demoLocs.length);
      updateHeatmap(demoLocs);
      return;
    }
    const { supabase } = await import("../lib/supabase");
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("user_locations")
      .select("*")
      .gte("updated_at", fiveMinAgo);
    if (data) {
      setLocations(data);
      setActiveCount(data.length);
      updateHeatmap(data);
    }
  }

  function updateHeatmap(locs: UserLocation[]) {
    if (!mapInstance.current || !window.google) return;
    const points = locs.map((l) => ({
      location: new window.google.maps.LatLng(l.lat, l.lng),
      weight: 1,
    }));
    if (heatmapRef.current) {
      heatmapRef.current.setData(points);
    }
  }

  useEffect(() => {
    if (!window.google) {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&libraries=visualization&callback=initMap`;
      script.async = true;
      window.initMap = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }
  }, []);

  function initMap() {
    if (!mapRef.current || mapInstance.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: ISB_MOHALI,
      zoom: 13,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#F4F2EC" }] },
        { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#5A5A5A" }] },
        { elementType: "labels.text.stroke", stylers: [{ color: "#F4F2EC" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#FFFFFF" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#E2DDD4" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#EBE8E1" }] },
        { featureType: "transit", stylers: [{ visibility: "off" }] },
      ],
      disableDefaultUI: true,
      zoomControl: true,
    });

    const heatmap = new window.google.maps.visualization.HeatmapLayer({
      data: [],
      map,
      radius: 40,
      opacity: 0.7,
      gradient: [
        "rgba(28, 58, 110, 0)",
        "rgba(28, 58, 110, 0.35)",
        "rgba(196, 125, 14, 0.7)",
        "rgba(196, 125, 14, 0.95)",
      ],
    });

    new window.google.maps.Marker({
      position: ISB_MOHALI,
      map,
      title: "ISB Mohali Campus",
      icon: {
        path: window.google.maps.SymbolPath.CIRCLE,
        scale: 7,
        fillColor: "#1C3A6E",
        fillOpacity: 1,
        strokeColor: "#FFFFFF",
        strokeWeight: 2,
      },
    });

    mapInstance.current = map;
    heatmapRef.current = heatmap;
    setMapLoaded(true);
    updateHeatmap(locations);
  }

  function toggleLocationSharing() {
    const next = !locationSharing;
    setLocationSharing(next);
    onToggleLocation(next);
  }

  return (
    <div className="flex flex-col min-h-screen lg:h-screen">
      <header className="px-5 lg:px-10 pt-7 lg:pt-10 pb-5 border-b border-line-light bg-linen">
        <div className="max-w-6xl mx-auto flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-[32px] lg:text-[40px] leading-[1.05] text-ink">Campus map.</h1>
            <p className="font-serif italic text-navy text-[17px] mt-1">Anonymous by design.</p>
            <p className="text-ink-2 mt-3 text-sm leading-relaxed max-w-md">
              Density around ISB Mohali. No names, no precise positions.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-surface border border-line-light rounded-lg shadow-card px-4 py-3">
            <div>
              <p className="font-serif text-[26px] text-ink tabular-nums leading-none">{activeCount}</p>
              <p className="text-[10px] font-bold text-ink-3 uppercase tracking-[0.1em] mt-1">Active now</p>
            </div>
            <div className="h-10 w-px bg-line-light" />
            <button
              onClick={toggleLocationSharing}
              className="flex items-center gap-3"
              aria-label="Toggle location sharing"
            >
              <div className={`w-10 h-6 rounded-full relative transition-colors ${locationSharing ? "bg-green-500" : "bg-line"}`}>
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${locationSharing ? "left-[18px]" : "left-0.5"}`} />
              </div>
              <span className="text-[13px] font-semibold text-ink-2">{locationSharing ? "Sharing" : "Hidden"}</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 relative bg-linen min-h-[500px]">
        <div ref={mapRef} className="w-full h-full" />
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-linen">
            <div className="text-center">
              <div className="w-6 h-6 border-2 border-line border-t-navy rounded-full animate-spin mx-auto mb-3" />
              <p className="text-ink-3 text-sm">Loading map…</p>
            </div>
          </div>
        )}

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-surface border border-line-light rounded-md px-4 py-2 shadow-card">
          <p className="text-[11px] text-ink-2 italic">Density only — individual identities are never shown.</p>
        </div>
      </div>
    </div>
  );
}
