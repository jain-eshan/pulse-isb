import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "../types";

export interface PlaceReview {
  id: string;
  place_id: string;
  user_id: string;
  rating: number;
  comment?: string;
  created_at: string;
  user?: { id: string; name: string; section?: string; avatar_url?: string };
}

export function useReviews(placeId: string | null, currentUser: User | null) {
  const [reviews, setReviews] = useState<PlaceReview[]>([]);
  const [loading, setLoading] = useState(false);
  const [myReview, setMyReview] = useState<PlaceReview | null>(null);

  const load = useCallback(async () => {
    if (!placeId) return;
    setLoading(true);
    const { data } = await supabase
      .from("place_reviews")
      .select("*, user:users!place_reviews_user_id_fkey(id,name,section,avatar_url)")
      .eq("place_id", placeId)
      .order("created_at", { ascending: false });

    const rows = (data ?? []) as PlaceReview[];
    setReviews(rows);
    setMyReview(rows.find((r) => r.user_id === currentUser?.id) ?? null);
    setLoading(false);
  }, [placeId, currentUser?.id]);

  useEffect(() => { load(); }, [load]);

  async function submitReview(rating: number, comment: string) {
    if (!placeId || !currentUser) return;
    await supabase.from("place_reviews").upsert({
      place_id: placeId,
      user_id: currentUser.id,
      rating,
      comment: comment.trim() || null,
    });
    await load();
  }

  async function deleteReview() {
    if (!myReview) return;
    await supabase.from("place_reviews").delete().eq("id", myReview.id);
    await load();
  }

  const avgRating =
    reviews.length > 0
      ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
      : null;

  return { reviews, loading, myReview, avgRating, submitReview, deleteReview, reload: load };
}
