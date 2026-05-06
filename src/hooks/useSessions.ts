import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Session, RsvpStatus, User } from "../types";

export function useSessions(user: User | null) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("sessions")
      .select(`
        *,
        creator:users!sessions_creator_id_fkey(id,name,avatar_url,section),
        rsvps(user_id,status)
      `)
      .eq("archived", false)
      .gte("starts_at", startOfTodayIST())
      .order("starts_at", { ascending: true });

    if (error) {
      console.error("[useSessions] query error:", error);
    }

    // Apply visibility filter — match user's section/OGSG, or creator always sees own
    const userOgsgKey = user.section && user.ogsg ? `${user.section}-${user.ogsg}` : null;
    const visibleData = (data ?? []).filter((s: any) => {
      const sections: string[] = s.visible_to_sections ?? [];
      const ogsgs: string[] = s.visible_to_ogsgs ?? [];
      // No restrictions = visible to all
      if (sections.length === 0 && ogsgs.length === 0) return true;
      // Creator always sees their own
      if (s.creator_id === user.id) return true;
      // Restricted to sections — does user's section match?
      if (sections.length > 0 && user.section && sections.includes(user.section)) return true;
      // Restricted to OGSGs — does user's OGSG match?
      if (ogsgs.length > 0 && userOgsgKey && ogsgs.includes(userOgsgKey)) return true;
      return false;
    });

    const mapped: Session[] = visibleData.map((s: any) => ({
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

  // Polling: refresh every 30 seconds instead of realtime subscriptions.
  // Realtime postgres_changes caused "cannot add callbacks after subscribe()" crashes
  // when multiple useSessions hook instances mounted simultaneously.
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => { refresh(); }, 30_000);
    return () => clearInterval(interval);
  }, [user?.id, refresh]);

  async function createSession(input: Partial<Session>) {
    if (!user) return null;
    const { data, error } = await supabase
      .from("sessions")
      .insert({ ...input, creator_id: user.id })
      .select()
      .single();
    if (error) throw error;
    await refresh();

    // Fire-and-forget: broadcast email to cohort
    if (data?.id) {
      fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/email-broadcast`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ session_id: data.id }),
        }
      ).catch((e) => console.warn("[email-broadcast] fire-and-forget failed:", e));
    }

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

/** Returns ISO string for midnight today in IST (UTC+5:30) */
function startOfTodayIST(): string {
  const now = new Date();
  // Shift to IST, zero the time, shift back
  const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const istMidnight = new Date(Date.UTC(
    istNow.getUTCFullYear(),
    istNow.getUTCMonth(),
    istNow.getUTCDate(),
    0, 0, 0, 0
  ));
  // Convert back to UTC
  return new Date(istMidnight.getTime() - IST_OFFSET_MS).toISOString();
}
