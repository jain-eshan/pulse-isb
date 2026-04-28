import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface LiveLocation {
  user_id: string;
  lat: number;
  lng: number;
  updated_at: string;
}

/** Subscribe to live user_locations via Supabase Realtime. */
export function useCampusActivity() {
  const [locations, setLocations] = useState<LiveLocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial fetch
    supabase
      .from("user_locations")
      .select("*")
      .then(({ data }) => {
        if (data) setLocations(data as LiveLocation[]);
        setLoading(false);
      });

    // Realtime subscription
    const channel = supabase
      .channel("campus-activity")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_locations" },
        (payload) => {
          if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
            setLocations((prev) => {
              const next = prev.filter((l) => l.user_id !== (payload.new as LiveLocation).user_id);
              return [...next, payload.new as LiveLocation];
            });
          } else if (payload.eventType === "DELETE") {
            setLocations((prev) =>
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

  return { locations, count: locations.length, loading };
}
