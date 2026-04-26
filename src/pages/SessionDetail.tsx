import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Calendar, Share2, Download, Users } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useSessions } from "../hooks/useSessions";
import { fireConfetti } from "../components/Confetti";
import { downloadIcs } from "../lib/ics";
import { sectionByCode } from "../lib/sections";
import SectionPill from "../components/SectionPill";
import { COLOR } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";
import type { Session, User, RsvpStatus } from "../types";

interface Attendee {
  user_id: string;
  status: RsvpStatus;
  user: { id: string; name: string; section: string; avatar_url?: string; ogsg?: number };
}

type Props = { session: Session; user: User; onBack: () => void };

export default function SessionDetail({ session, user, onBack }: Props) {
  const { rsvp } = useSessions(user);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [busy, setBusy] = useState(false);

  const myStatus = attendees.find((a) => a.user_id === user.id)?.status;
  const goingCount = attendees.filter((a) => a.status === "going").length;
  const hostSection = sectionByCode(session.creator?.section);

  // Fetch attendees with section info + realtime
  useEffect(() => {
    const fetchAttendees = async () => {
      const { data } = await supabase
        .from("rsvps")
        .select("user_id, status, user:users!rsvps_user_id_fkey(id, name, section, avatar_url, ogsg)")
        .eq("session_id", session.id);
      setAttendees((data ?? []) as unknown as Attendee[]);
    };
    fetchAttendees();

    const ch = supabase.channel(`rsvps-${session.id}`)
      .on("postgres_changes",
          { event: "*", schema: "public", table: "rsvps", filter: `session_id=eq.${session.id}` },
          fetchAttendees)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [session.id]);

  async function handleRsvp(status: RsvpStatus) {
    tap();
    setBusy(true);
    try {
      await rsvp(session.id, status);
      if (status === "going") {
        fireConfetti();
      }
    } finally {
      setBusy(false);
    }
  }

  function handleShare() {
    tap();
    const url = `${window.location.origin}/?session=${session.id}`;
    const text = `*${session.title}*\n${format(new Date(session.starts_at), "EEE d MMM · h:mm a")}${session.venue ? "\n📍 " + session.venue : ""}\n\nRSVP: ${url}`;
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank");
  }

  function handleIcs() {
    tap();
    downloadIcs({
      id: session.id,
      title: session.title,
      description: session.description,
      starts_at: session.starts_at,
      ends_at: session.ends_at,
      venue: session.venue,
      url: `${window.location.origin}/?session=${session.id}`,
    });
  }

  // Group going-attendees by section for the social proof callout
  const sectionCounts = attendees
    .filter((a) => a.status === "going")
    .reduce<Record<string, number>>((acc, a) => {
      const s = a.user?.section?.toUpperCase();
      if (s) acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    }, {});

  return (
    <div className="min-h-screen pb-32" style={{ background: COLOR.bg }}>
      {/* Hero with section-tinted gradient */}
      <div
        className="relative px-5 md:px-8 pt-6 pb-12"
        style={{
          background: hostSection
            ? `linear-gradient(180deg, ${hostSection.tint} 0%, ${COLOR.bg} 100%)`
            : `linear-gradient(180deg, ${COLOR.navyTint} 0%, ${COLOR.bg} 100%)`,
        }}
      >
        <button onClick={() => { tap(); onBack(); }} className="flex items-center gap-1.5 t-meta mb-6" style={{ color: COLOR.ink2 }}>
          <ArrowLeft size={14} /> Back
        </button>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="t-display"
          style={{ fontSize: 36, lineHeight: 1.1 }}
        >
          {session.title}
        </motion.h1>

        {session.creator && (
          <div className="flex items-center gap-2 mt-4">
            <div
              className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white"
              style={{ background: hostSection?.color ?? COLOR.navy, fontSize: 13 }}
            >
              {(session.creator.name ?? "?")[0]}
            </div>
            <div>
              <p className="text-sm font-semibold" style={{ color: COLOR.ink }}>
                Hosted by {session.creator.name ?? "—"}
              </p>
              <SectionPill code={session.creator.section} size="sm" />
            </div>
          </div>
        )}
      </div>

      <main className="px-4 md:px-8 max-w-2xl space-y-4 -mt-6">
        {/* When + Where */}
        <div className="card p-5 space-y-3">
          <div className="flex items-start gap-3">
            <Calendar size={18} strokeWidth={1.75} style={{ color: COLOR.navy, marginTop: 2 }} />
            <div>
              <p className="t-label">When</p>
              <p className="font-semibold" style={{ color: COLOR.ink }}>
                {format(new Date(session.starts_at), "EEE, d MMM · h:mm a")}
              </p>
            </div>
          </div>
          {session.venue && (
            <div className="flex items-start gap-3">
              <MapPin size={18} strokeWidth={1.75} style={{ color: COLOR.navy, marginTop: 2 }} />
              <div>
                <p className="t-label">Where</p>
                <p className="font-semibold" style={{ color: COLOR.ink }}>{session.venue}</p>
              </div>
            </div>
          )}
        </div>

        {session.description && (
          <div className="card p-5">
            <p className="t-body" style={{ whiteSpace: "pre-wrap" }}>{session.description}</p>
          </div>
        )}

        {/* RSVP card */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <Users size={16} strokeWidth={1.75} style={{ color: COLOR.ink2 }} />
            <p className="font-semibold" style={{ color: COLOR.ink }}>{goingCount} going</p>
            {Object.keys(sectionCounts).length > 0 && (
              <div className="flex gap-2 ml-2 flex-wrap">
                {Object.entries(sectionCounts).map(([code, count]) => {
                  const sec = sectionByCode(code);
                  if (!sec) return null;
                  return (
                    <span key={code} className="t-meta" style={{ color: sec.color }}>
                      · {count} {sec.name}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-2">
            {(["going", "maybe", "cant"] as RsvpStatus[]).map((status) => (
              <button
                key={status}
                onClick={() => handleRsvp(status)}
                disabled={busy}
                className="flex-1 py-3 rounded-[10px] font-semibold text-sm transition-all"
                style={{
                  background: myStatus === status ? COLOR.navy : COLOR.surface,
                  color: myStatus === status ? "#fff" : COLOR.ink,
                  border: `1px solid ${myStatus === status ? COLOR.navy : COLOR.border}`,
                }}
              >
                {status === "going" ? "🎉 Going" : status === "maybe" ? "Maybe" : "Can't"}
              </button>
            ))}
          </div>
        </div>

        {/* Going-list with section badges */}
        {goingCount > 0 && (
          <div className="card p-5">
            <p className="t-label mb-3">Going</p>
            <div className="space-y-2.5">
              {attendees.filter((a) => a.status === "going").map((a) => {
                const sec = sectionByCode(a.user?.section);
                return (
                  <div key={a.user_id} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white"
                      style={{ background: sec?.color ?? COLOR.ink3, fontSize: 12 }}
                    >
                      {(a.user?.name ?? "?")[0]}
                    </div>
                    <p className="text-sm font-semibold flex-1" style={{ color: COLOR.ink }}>
                      {a.user?.name ?? "—"}
                    </p>
                    <SectionPill code={a.user?.section} size="sm" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2 mt-2">
          <button onClick={handleIcs} className="btn-ghost flex-1 flex items-center justify-center gap-2">
            <Download size={14} /> Add to calendar
          </button>
          <button onClick={handleShare} className="btn-ghost flex-1 flex items-center justify-center gap-2">
            <Share2 size={14} /> Share
          </button>
        </div>
      </main>
    </div>
  );
}
