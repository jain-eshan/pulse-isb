import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Session, RsvpStatus, User } from "../types";

export function useSessions(user: User | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("sessions")
      .select(`
        *,
        creator:users!sessions_creator_id_fkey(id,name,avatar_url),
        rsvps(user_id,status)
      `)
      .eq("archived", false)
      .gte("starts_at", new Date(Date.now() - 6 * 3600 * 1000).toISOString())
      .order("starts_at", { ascending: true });

    const mapped: Session[] = (data ?? []).map((s: any) => ({
      ...s,
      rsvp_counts: {
        going: s.rsvps.filter((r: any) => r.status === "going").length,
        maybe: s.rsvps.filter((r: any) => r.status === "maybe").length,
      },
      my_rsvp: s.rsvps.find((r: any) => r.user_id === user.id)?.status,
    }));
    setSessions(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  useEffect(() => {
    if (!user) return;
    const ch = supabase.channel("sessions-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "rsvps" }, () => refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "sessions" }, () => refresh())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [user, refresh]);

  async function createSession(input: Partial<Session>) {
    if (!user) return null;
    const { data, error } = await supabase
      .from("sessions")
      .insert({ ...input, creator_id: user.id })
      .select()
      .single();
    if (error) throw error;
    await refresh();
    return data as Session;
  }

  async function rsvp(sessionId: string, status: RsvpStatus) {
    if (!user) return;
    await supabase.from("rsvps").upsert({
      session_id: sessionId,
      user_id: user.id,
      status,
      responded_via: "web",
    });
    await refresh();
  }

  return { sessions, loading, createSession, rsvp, refresh };
}
