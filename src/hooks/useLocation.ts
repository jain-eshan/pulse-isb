import { useEffect, useRef } from "react";
import type { User } from "../types";

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === "https://your-project.supabase.co";

export function useLocationBroadcast(user: User | null) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user?.location_sharing || IS_DEMO) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    async function broadcast(position: GeolocationPosition) {
      if (!user) return;
      const { supabase } = await import("../lib/supabase");
      supabase.from("user_locations").upsert({
        user_id: user.id,
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        updated_at: new Date().toISOString(),
      });
    }

    navigator.geolocation.getCurrentPosition(broadcast);
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(broadcast);
    }, 30000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (user && !IS_DEMO) {
        import("../lib/supabase").then(({ supabase }) =>
          supabase.from("user_locations").delete().eq("user_id", user.id)
        );
      }
    };
  }, [user?.id, user?.location_sharing]);
}
