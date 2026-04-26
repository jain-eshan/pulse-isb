import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface DBPlace {
  id: string;
  name: string;
  category: "food" | "cafe" | "nightlife" | "travel";
  area?: string;
  description?: string;
  budget: "low" | "mid" | "high";
  google_maps_url?: string;
}

export function usePlaces() {
  const [places, setPlaces] = useState<DBPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("places")
        .select("id,name,category,area,description,budget,google_maps_url")
        .order("created_at", { ascending: false });
      if (error) console.error("[usePlaces]", error);
      setPlaces(data ?? []);
      setLoading(false);
    })();
  }, []);

  return { places, loading };
}
