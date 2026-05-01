/**
 * Broadcasts the current user's location to user_locations every 30s.
 * Also exposes the latest position locally so the UI can immediately show
 * "you are here" without round-tripping through Supabase Realtime.
 */
import { useEffect, useRef, useState } from "react";
import type { User } from "../types";

const IS_DEMO =
  !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === "https://your-project.supabase.co";

export interface MyPosition {
  lat: number;
  lng: number;
  accuracy: number;
  capturedAt: number;
}

export type LocationState =
  | { status: "off" }
  | { status: "requesting" }
  | { status: "denied"; message: string }
  | { status: "unavailable"; message: string }
  | { status: "broadcasting"; position: MyPosition }
  | { status: "broadcast-error"; position?: MyPosition; message: string };

export function useLocationBroadcast(user: User | null): LocationState {
  const [state, setState] = useState<LocationState>({ status: "off" });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    // Tear down any prior watcher first
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (!user?.location_sharing) {
      setState({ status: "off" });
      return;
    }
    if (IS_DEMO) {
      setState({ status: "off" });
      return;
    }
    if (!("geolocation" in navigator)) {
      setState({
        status: "unavailable",
        message: "This browser doesn't support location sharing.",
      });
      return;
    }

    setState({ status: "requesting" });

    async function broadcast(position: GeolocationPosition) {
      const myPos: MyPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        capturedAt: Date.now(),
      };

      // Optimistic UI update — show "you are here" immediately
      setState({ status: "broadcasting", position: myPos });

      try {
        const { supabase } = await import("../lib/supabase");
        const { error } = await supabase.from("user_locations").upsert({
          user_id: user!.id,
          lat: myPos.lat,
          lng: myPos.lng,
          updated_at: new Date(myPos.capturedAt).toISOString(),
        });
        if (error) {
          console.warn("[useLocation] upsert failed:", error.message);
          setState({
            status: "broadcast-error",
            position: myPos,
            message: error.message,
          });
        }
      } catch (e) {
        console.warn("[useLocation] broadcast threw:", e);
        setState({
          status: "broadcast-error",
          position: myPos,
          message: e instanceof Error ? e.message : "Network error",
        });
      }
    }

    function handleError(err: GeolocationPositionError) {
      if (err.code === err.PERMISSION_DENIED) {
        setState({
          status: "denied",
          message: "Location permission denied. Enable it in your browser settings.",
        });
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setState({
          status: "unavailable",
          message: "Couldn't get a GPS fix — try moving to a window.",
        });
      } else {
        setState({
          status: "unavailable",
          message: err.message || "Location error.",
        });
      }
    }

    const opts: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 60_000,
      timeout: 15_000,
    };

    // Get an immediate fix, then a watcher for live updates
    navigator.geolocation.getCurrentPosition(broadcast, handleError, opts);
    watchIdRef.current = navigator.geolocation.watchPosition(broadcast, handleError, opts);

    // Periodic re-broadcast (in case watch fires rarely)
    intervalRef.current = setInterval(() => {
      navigator.geolocation.getCurrentPosition(broadcast, handleError, opts);
    }, 30_000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      // Don't delete location on tab close — let it go stale gracefully.
      // The useCampusActivity hook filters to last 15 minutes, so old
      // entries fade out naturally. This way closing the tab still leaves
      // the user on the heatmap for a while.
    };
  }, [user?.id, user?.location_sharing]);

  return state;
}
