import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export interface DBPlace {
  id: string;
  name: string;
  category: string;
  area?: string;
  description?: string;
  budget: "low" | "mid" | "high";
  google_maps_url?: string;
  image_url?: string;
  google_rating?: number;
  review_count?: number;
  distance_from_campus?: string;
}

export function usePlaces() {
  const [places, setPlaces] = useState<DBPlace[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase
        .from("places")
        .select("id,name,category,area,description,budget,google_maps_url,image_url,google_rating,review_count,distance_from_campus")
        .order("created_at", { ascending: false });
      if (error) console.error("[usePlaces]", error);
      setPlaces(data ?? []);
      setLoading(false);
    })();
  }, []);

  return { places, loading };
}
