import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { User } from "../types";

export interface PulseItem {
  id: string;
  creator_id: string;
  title: string;
  description?: string;
  tags: string[];
  status: "open" | "planned" | "done";
  created_at: string;
  vote_count: number;
  my_vote: boolean;
}

export function usePulse(user: User | null) {
  const [items, setItems] = useState<PulseItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;

    const { data: rawItems } = await supabase
      .from("pulse_items")
      .select("*, pulse_votes(user_id)")
      .eq("status", "open")
      .order("created_at", { ascending: false });

    const mapped: PulseItem[] = (rawItems ?? []).map((item: any) => ({
      ...item,
      vote_count: item.pulse_votes?.length ?? 0,
      my_vote: item.pulse_votes?.some((v: any) => v.user_id === user.id) ?? false,
    }));

    // Sort by vote count descending
    mapped.sort((a, b) => b.vote_count - a.vote_count);
    setItems(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  async function toggleVote(itemId: string, currentlyVoted: boolean) {
    if (!user) return;
    if (currentlyVoted) {
      await supabase
        .from("pulse_votes")
        .delete()
        .eq("pulse_id", itemId)
        .eq("user_id", user.id);
    } else {
      await supabase
        .from("pulse_votes")
        .insert({ pulse_id: itemId, user_id: user.id });
    }
    // Optimistic update
    setItems((prev) =>
      prev
        .map((i) =>
          i.id === itemId
            ? {
                ...i,
                my_vote: !currentlyVoted,
                vote_count: i.vote_count + (currentlyVoted ? -1 : 1),
              }
            : i
        )
        .sort((a, b) => b.vote_count - a.vote_count)
    );
  }

  async function suggest(title: string, description: string, tag: string) {
    if (!user) return;
    const { error } = await supabase.from("pulse_items").insert({
      creator_id: user.id,
      title: title.trim(),
      description: description.trim() || undefined,
      tags: tag ? [tag] : [],
      status: "open",
    });
    if (error) throw error;
    await refresh();
  }

  return { items, loading, toggleVote, suggest, refresh };
}
