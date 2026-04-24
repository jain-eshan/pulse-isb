import { useState, useEffect, useCallback } from "react";
import type { User, Going, Place } from "../types";
import { SEED_PLACES } from "../lib/places";
import { formatDistanceToNow, format } from "date-fns";
import { Plus, X, Clock } from "lucide-react";

const IS_DEMO = !import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.VITE_SUPABASE_URL === "https://your-project.supabase.co";

const DEMO_GOINGS: Going[] = [
  {
    id: "1", user_id: "u2", place_id: "6", going_at: new Date(Date.now() + 3 * 3600000).toISOString(),
    note: "Need 2 more for cab split", is_active: true, created_at: new Date().toISOString(),
    user: { id: "u2", microsoft_id: "x", name: "Priya Sharma", email: "priya@isb.edu", section: "A", cohort_year: 2026, vibe_tags: ["Party Animal"], budget_min: 1000, budget_max: 5000, location_sharing: false, interests: [], campus: "mohali" as const, created_at: new Date().toISOString() },
    place: SEED_PLACES.find(p => p.id === "6"),
  },
  {
    id: "2", user_id: "u3", place_id: "9", going_at: new Date(Date.now() + 2 * 86400000).toISOString(),
    note: "Kasauli Saturday morning. 6 seats in my car.", is_active: true, created_at: new Date().toISOString(),
    user: { id: "u3", microsoft_id: "y", name: "Rahul Menon", email: "rahul@isb.edu", section: "C", cohort_year: 2026, vibe_tags: ["Explorer"], budget_min: 500, budget_max: 3000, location_sharing: false, interests: [], campus: "mohali" as const, created_at: new Date().toISOString() },
    place: SEED_PLACES.find(p => p.id === "9"),
  },
];

type Filter = "tonight" | "weekend" | "all";

interface GoingPageProps {
  user: User;
  broadcastPlace?: Place | null;
  onBroadcastDone?: () => void;
}

export default function GoingPage({ user, broadcastPlace, onBroadcastDone }: GoingPageProps) {
  const [goings, setGoings] = useState<Going[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [showBroadcast, setShowBroadcast] = useState(!!broadcastPlace);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(broadcastPlace ?? null);
  const [goingAt, setGoingAt] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);

  const loadGoings = useCallback(async () => {
    if (IS_DEMO) {
      setGoings(DEMO_GOINGS);
      return;
    }
    const { supabase } = await import("../lib/supabase");
    const { data } = await supabase
      .from("going")
      .select("*, user:users(*)")
      .eq("is_active", true)
      .order("going_at", { ascending: true });
    if (data) {
      const withPlaces = data.map((g: Going) => ({
        ...g,
        place: SEED_PLACES.find((p) => p.id === g.place_id),
      }));
      setGoings(withPlaces);
    }
  }, []);

  useEffect(() => {
    loadGoings();
    if (IS_DEMO) return;
    let channel: ReturnType<typeof import("../lib/supabase")["supabase"]["channel"]> | null = null;
    import("../lib/supabase").then(({ supabase }) => {
      channel = supabase
        .channel("going-realtime")
        .on("postgres_changes", { event: "*", schema: "public", table: "going" }, loadGoings)
        .subscribe();
    });
    return () => { if (channel) import("../lib/supabase").then(({ supabase }) => supabase.removeChannel(channel!)); };
  }, [loadGoings]);

  useEffect(() => {
    if (broadcastPlace) {
      setSelectedPlace(broadcastPlace);
      setShowBroadcast(true);
    }
  }, [broadcastPlace]);

  async function broadcast() {
    if (!selectedPlace || !goingAt) return;
    setLoading(true);
    if (!IS_DEMO) {
      const { supabase } = await import("../lib/supabase");
      await supabase.from("going").insert({
        user_id: user.id,
        place_id: selectedPlace.id,
        going_at: new Date(goingAt).toISOString(),
        note: note || null,
        is_active: true,
      });
    }
    setShowBroadcast(false);
    setSelectedPlace(null);
    setGoingAt("");
    setNote("");
    setLoading(false);
    onBroadcastDone?.();
    loadGoings();
  }

  async function joinGoing(going: Going) {
    if (going.user_id === user.id) return;
    if (!IS_DEMO) {
      const { supabase } = await import("../lib/supabase");
      await supabase.from("going").insert({
        user_id: user.id,
        place_id: going.place_id,
        going_at: going.going_at,
        note: `Joining ${going.user?.name?.split(" ")[0] ?? "someone"}`,
        is_active: true,
      });
    }
    loadGoings();
  }

  const filtered = goings.filter((g) => {
    const date = new Date(g.going_at);
    const now = new Date();
    if (filter === "tonight") return date.toDateString() === now.toDateString();
    if (filter === "weekend") {
      const day = date.getDay();
      return day === 5 || day === 6 || day === 0;
    }
    return true;
  });

  const myGoings = goings.filter((g) => g.user_id === user.id);
  const others = filtered.filter((g) => g.user_id !== user.id);

  return (
    <div className="px-5 lg:px-10 py-7 lg:py-10 max-w-4xl mx-auto">
      <header className="mb-7 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[32px] lg:text-[40px] leading-[1.05] text-ink">Plans.</h1>
          <p className="font-serif italic text-navy text-[17px] lg:text-[20px] mt-1">Who's going where.</p>
          <p className="text-ink-2 text-sm mt-3 leading-relaxed">Join in, or broadcast your own.</p>
        </div>
        {!showBroadcast && (
          <button
            onClick={() => setShowBroadcast(true)}
            className="inline-flex items-center gap-2 bg-navy text-white text-[13px] font-semibold rounded-md px-4 py-2.5 shadow-navy hover:bg-navy-deep transition-colors"
          >
            <Plus className="w-4 h-4" /> Broadcast
          </button>
        )}
      </header>

      <div className="flex items-center gap-2 mb-6">
        {(["all", "tonight", "weekend"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[13px] px-4 py-[7px] rounded-full font-semibold transition-colors border ${
              filter === f
                ? "bg-navy text-white border-navy shadow-navy"
                : "bg-surface text-ink-2 border-line hover:border-navy hover:text-navy"
            }`}
          >
            {f === "all" ? "All" : f === "tonight" ? "Tonight" : "Weekend"}
          </button>
        ))}
      </div>

      {showBroadcast && (
        <div className="rounded-lg border border-line-light bg-surface shadow-card p-5 mb-8">
          <div className="flex items-start justify-between mb-5">
            <div>
              <h3 className="font-serif text-[20px] text-ink">Broadcast a plan</h3>
              <p className="text-xs text-ink-3 mt-0.5">Your batchmates will see this in their feed.</p>
            </div>
            <button
              onClick={() => { setShowBroadcast(false); onBroadcastDone?.(); }}
              className="text-ink-3 hover:text-ink transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-4">
            <label className="text-[10px] font-bold text-ink-3 uppercase tracking-[0.1em] mb-2 block">Place</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {SEED_PLACES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlace(p)}
                  className={`text-left px-3 py-2 rounded-md text-sm border transition-colors ${
                    selectedPlace?.id === p.id
                      ? "bg-navy text-white border-navy"
                      : "bg-surface text-ink border-line hover:border-navy"
                  }`}
                >
                  {p.name} <span className="opacity-60 capitalize">· {p.city}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            <div>
              <label className="text-[10px] font-bold text-ink-3 uppercase tracking-[0.1em] mb-2 block">When</label>
              <input
                type="datetime-local"
                value={goingAt}
                onChange={(e) => setGoingAt(e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm bg-surface focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/10 transition-all"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-ink-3 uppercase tracking-[0.1em] mb-2 block">Note (optional)</label>
              <input
                type="text"
                placeholder="Need 2 more for Uber split"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border border-line rounded-md px-3 py-2 text-sm bg-surface focus:outline-none focus:border-navy focus:ring-4 focus:ring-navy/10 transition-all"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { setShowBroadcast(false); onBroadcastDone?.(); }}
              className="text-[13px] font-semibold text-ink-2 rounded-md px-4 py-2 bg-linen border border-line hover:border-navy transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={broadcast}
              disabled={!selectedPlace || !goingAt || loading}
              className="flex-1 sm:flex-none bg-navy text-white text-[13px] font-semibold rounded-md px-5 py-2 shadow-navy hover:bg-navy-deep disabled:bg-line disabled:text-ink-3 disabled:shadow-none transition-colors"
            >
              {loading ? "Broadcasting…" : "Broadcast"}
            </button>
          </div>
        </div>
      )}

      {myGoings.length > 0 && (
        <section className="mb-8">
          <p className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.1em] mb-3">Your plans</p>
          <div className="space-y-3">
            {myGoings.map((g) => <GoingCard key={g.id} going={g} isOwn />)}
          </div>
        </section>
      )}

      <section>
        {others.length > 0 ? (
          <>
            <p className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.1em] mb-3">Batchmates going</p>
            <div className="space-y-3">
              {others.map((g) => <GoingCard key={g.id} going={g} onJoin={() => joinGoing(g)} />)}
            </div>
          </>
        ) : !showBroadcast && (
          <div className="text-center py-20 border border-dashed border-line rounded-lg bg-surface">
            <p className="font-serif text-[22px] text-ink">No plans yet.</p>
            <p className="text-ink-3 text-sm mt-2">Broadcast a plan to get the ball rolling.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function GoingCard({ going, isOwn, onJoin }: { going: Going; isOwn?: boolean; onJoin?: () => void }) {
  const place = going.place;
  const date = new Date(going.going_at);

  return (
    <div className="rounded-lg border border-line-light bg-surface shadow-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-navy text-white flex items-center justify-center text-xs font-semibold">
              {going.user?.name?.[0] ?? "?"}
            </div>
            <div>
              <p className="text-sm font-semibold text-ink">{isOwn ? "You" : going.user?.name?.split(" ")[0]}</p>
              <p className="text-[11px] text-ink-3">Section {going.user?.section}</p>
            </div>
          </div>

          <div className="mt-4">
            <p className="font-serif text-[18px] text-ink">{place?.name ?? "Unknown place"}</p>
            <p className="text-xs text-ink-3 capitalize mt-0.5">{place?.city}</p>
          </div>

          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-2">
            <Clock className="w-3.5 h-3.5" />
            {format(date, "EEE, d MMM · h:mm a")}
          </div>

          {going.note && (
            <p className="mt-3 text-sm text-ink-2 bg-linen rounded-md px-3 py-2 border border-line-light italic">
              "{going.note}"
            </p>
          )}
        </div>

        {!isOwn && onJoin && (
          <button
            onClick={onJoin}
            className="flex-shrink-0 text-[13px] font-semibold bg-navy text-white rounded-md px-4 py-2 shadow-navy hover:bg-navy-deep transition-colors"
          >
            Join
          </button>
        )}
      </div>

      <p className="text-[11px] text-ink-3 mt-4">{formatDistanceToNow(date, { addSuffix: true })}</p>
    </div>
  );
}
