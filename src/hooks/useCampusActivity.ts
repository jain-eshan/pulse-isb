import { useEffect, useState, useMemo } from "react";
import { supabase } from "../lib/supabase";
import { CAMPUS_PLACES } from "../lib/campusPlaces";

/** How long a GPS broadcast remains visible after the tab closes. */
const STALE_MINUTES = 15;

export interface LiveLocation {
  user_id: string;
  lat: number;
  lng: number;
  updated_at: string;
  /** "gps" = real broadcast, "rsvp" = inferred from session RSVP */
  source?: "gps" | "rsvp";
}

/** Subscribe to live user_locations via Supabase Realtime + RSVP presence. */
export function useCampusActivity() {
  const [rawLocations, setRawLocations] = useState<LiveLocation[]>([]);
  const [rsvpPresence, setRsvpPresence] = useState<LiveLocation[]>([]);
  const [loading, setLoading] = useState(true);

  // ── 1. Real GPS locations (existing) ──────────────────────────────
  useEffect(() => {
    supabase
      .from("user_locations")
      .select("*")
      .then(({ data }) => {
        if (data) setRawLocations(data.map((d) => ({ ...d, source: "gps" as const })));
        setLoading(false);
      });

    const channel = supabase
      .channel("campus-activity")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_locations" },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            const loc = { ...(payload.new as LiveLocation), source: "gps" as const };
            setRawLocations((prev) => {
              const next = prev.filter((l) => l.user_id !== loc.user_id);
              return [...next, loc];
            });
          } else if (payload.eventType === "DELETE") {
            setRawLocations((prev) =>
              prev.filter((l) => l.user_id !== (payload.old as { user_id: string }).user_id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // ── 2. RSVP-based virtual presence ────────────────────────────────
  // Fetch sessions happening now or in the next 30 min, get "going"
  // RSVPs, and place those users at the session venue on the map.
  useEffect(() => {
    async function fetchRsvpPresence() {
      const now = new Date();
      const soon = new Date(now.getTime() + 30 * 60_000); // +30 min
      const windowStart = new Date(now.getTime() - 90 * 60_000); // started up to 90 min ago

      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, venue, starts_at, ends_at, rsvps(user_id, status)")
        .gte("starts_at", windowStart.toISOString())
        .lte("starts_at", soon.toISOString())
        .eq("archived", false);

      if (!sessions) return;

      const virtual: LiveLocation[] = [];

      for (const session of sessions) {
        if (!session.venue) continue;

        // Match venue text to a campus place
        const venueLower = session.venue.toLowerCase();
        const matchedPlace = CAMPUS_PLACES.find((p) => {
          const terms = [p.label, p.short, p.id].map((t) => t.toLowerCase());
          return terms.some((t) => venueLower.includes(t) || t.includes(venueLower));
        });

        if (!matchedPlace) continue;

        // Check if session is currently active (started and not ended)
        const startsAt = new Date(session.starts_at);
        const endsAt = session.ends_at
          ? new Date(session.ends_at)
          : new Date(startsAt.getTime() + 90 * 60_000); // default 90 min

        // Show RSVP presence from 10 min before start until end
        const visibleFrom = new Date(startsAt.getTime() - 10 * 60_000);
        if (now < visibleFrom || now > endsAt) continue;

        const goingRsvps = (session.rsvps as { user_id: string; status: string }[])?.filter(
          (r) => r.status === "going"
        );

        if (!goingRsvps?.length) continue;

        // Add small random offset so dots don't stack perfectly
        for (const rsvp of goingRsvps) {
          const jitterLat = (Math.random() - 0.5) * 0.0003;
          const jitterLng = (Math.random() - 0.5) * 0.0003;
          virtual.push({
            user_id: rsvp.user_id,
            lat: matchedPlace.lat + jitterLat,
            lng: matchedPlace.lng + jitterLng,
            updated_at: startsAt.toISOString(),
            source: "rsvp",
          });
        }
      }

      setRsvpPresence(virtual);
    }

    fetchRsvpPresence();

    // Refresh every 5 minutes
    const interval = setInterval(fetchRsvpPresence, 5 * 60_000);
    return () => clearInterval(interval);
  }, []);

  // ── 3. Merge GPS + RSVP, filter stale GPS entries ─────────────────
  const locations = useMemo(() => {
    const cutoff = Date.now() - STALE_MINUTES * 60_000;

    // Filter GPS locations to last 15 min
    const freshGps = rawLocations.filter(
      (l) => new Date(l.updated_at).getTime() > cutoff
    );

    // Merge: GPS takes priority — if a user has a GPS entry, skip their RSVP dot
    const gpsUserIds = new Set(freshGps.map((l) => l.user_id));
    const uniqueRsvp = rsvpPresence.filter((l) => !gpsUserIds.has(l.user_id));

    return [...freshGps, ...uniqueRsvp];
  }, [rawLocations, rsvpPresence]);

  return { locations, count: locations.length, loading };
}
