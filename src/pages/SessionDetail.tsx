import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Share2, ExternalLink, Check } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "../lib/supabase";
import { useSessions } from "../hooks/useSessions";
import { fireConfetti } from "../components/Confetti";
import { sectionByCode } from "../lib/sections";
import SectionPill from "../components/SectionPill";
import CoverBanner from "../components/CoverBanner";
import CalendarMenu from "../components/CalendarMenu";
import { COLOR } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";
import { googleCalendarUrl } from "../lib/ics";
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
  const [shareCopied, setShareCopied] = useState(false);

  const myStatus = attendees.find((a) => a.user_id === user.id)?.status;
  const goingList = attendees.filter((a) => a.status === "going");
  const goingCount = goingList.length;
  const hostSection = sectionByCode(session.creator?.section);

  const startsAt = new Date(session.starts_at);
  const month = format(startsAt, "MMM").toUpperCase();
  const dayOfMonth = format(startsAt, "d");
  const dayOfWeek = format(startsAt, "EEE");
  const time = format(startsAt, "h:mm a");

  const sessionUrl = `${window.location.origin}/?session=${session.id}`;
  const eventForCal = {
    id: session.id,
    title: session.title,
    description: session.description,
    starts_at: session.starts_at,
    ends_at: session.ends_at,
    venue: session.venue,
    url: sessionUrl,
  };

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
      if (status === "going") fireConfetti();
    } finally {
      setBusy(false);
    }
  }

  async function handleShare() {
    tap();
    const goingLine = goingCount > 0 ? `\n👥 ${goingCount} going` : "";
    const venueLine = session.venue ? `\n📍 ${session.venue}` : "";
    const text =
      `*${session.title}*\n` +
      `🗓 ${dayOfWeek}, ${dayOfMonth} ${format(startsAt, "MMM")} · ${time}` +
      venueLine +
      goingLine +
      `\n\n${session.description ? session.description.slice(0, 140) + (session.description.length > 140 ? "…" : "") + "\n\n" : ""}` +
      `RSVP & add to calendar →\n${sessionUrl}`;

    // Try native share first (mobile), fall back to WhatsApp link
    if (navigator.share) {
      try {
        await navigator.share({ title: session.title, text, url: sessionUrl });
        return;
      } catch {
        // user cancelled — silently fall through to WhatsApp link
      }
    }
    const wa = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(wa, "_blank");
  }

  async function handleCopyLink() {
    tap();
    try {
      await navigator.clipboard.writeText(sessionUrl);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 2000);
    } catch {
      // fallback - show prompt
      window.prompt("Copy this link:", sessionUrl);
    }
  }

  function handleVenueMap() {
    if (!session.venue) return;
    tap();
    window.open(`https://maps.google.com/?q=${encodeURIComponent(session.venue + ", ISB Mohali")}`, "_blank");
  }

  return (
    <div className="min-h-screen pb-32" style={{ background: COLOR.bg }}>
      {/* Top nav */}
      <div className="px-5 md:px-8 pt-6 pb-2 flex items-center justify-between">
        <button onClick={() => { tap(); onBack(); }} className="flex items-center gap-1.5 t-meta" style={{ color: COLOR.ink2 }}>
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Cover banner */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <CoverBanner
          title={session.title}
          tag={session.tags?.[0]}
          hostSection={session.creator?.section}
          height={240}
        />
      </motion.div>

      <main className="px-4 md:px-8 max-w-2xl mt-6 space-y-4">
        {/* Date tile + Location card */}
        <div className="grid grid-cols-[auto_1fr] gap-3">
          {/* Calendar tile */}
          <button
            onClick={() => window.open(googleCalendarUrl(eventForCal), "_blank")}
            className="card flex flex-col items-center justify-center px-4 py-3 transition-transform hover:scale-[1.02]"
            style={{ width: 78, minHeight: 88 }}
            aria-label="Add to Google Calendar"
          >
            <p
              className="text-[10px] font-bold tracking-wider"
              style={{ color: hostSection?.color ?? COLOR.navy, marginBottom: 2 }}
            >
              {month}
            </p>
            <p
              className="font-serif"
              style={{ fontSize: 30, lineHeight: 1, color: COLOR.ink, fontWeight: 500 }}
            >
              {dayOfMonth}
            </p>
            <p className="t-meta" style={{ fontSize: 10, marginTop: 4 }}>
              {dayOfWeek} · {time}
            </p>
          </button>

          {/* Location card */}
          <button
            onClick={handleVenueMap}
            disabled={!session.venue}
            className="card flex items-center gap-3 px-4 py-3 text-left disabled:opacity-60"
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: COLOR.navyTint }}
            >
              <MapPin size={18} strokeWidth={1.75} style={{ color: COLOR.navy }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="t-label" style={{ marginBottom: 2 }}>Where</p>
              <p
                className="font-semibold truncate"
                style={{ color: COLOR.ink, fontSize: 14 }}
              >
                {session.venue ?? "Location TBD"}
              </p>
              {session.venue && (
                <p className="t-meta flex items-center gap-1" style={{ fontSize: 11 }}>
                  Open in Maps <ExternalLink size={10} />
                </p>
              )}
            </div>
          </button>
        </div>

        {/* Going stack (Luma-style) */}
        <div className="card px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar stack */}
              {goingCount > 0 ? (
                <div className="flex -space-x-2">
                  {goingList.slice(0, 4).map((a) => {
                    const sec = sectionByCode(a.user?.section);
                    return (
                      <div
                        key={a.user_id}
                        className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold text-white"
                        style={{
                          background: sec?.color ?? COLOR.ink3,
                          fontSize: 11,
                          borderColor: COLOR.surface,
                        }}
                      >
                        {(a.user?.name ?? "?")[0]}
                      </div>
                    );
                  })}
                  {goingCount > 4 && (
                    <div
                      className="w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold"
                      style={{
                        background: COLOR.borderLight,
                        color: COLOR.ink2,
                        fontSize: 10,
                        borderColor: COLOR.surface,
                      }}
                    >
                      +{goingCount - 4}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ background: COLOR.borderLight }}
                >
                  <span style={{ fontSize: 14 }}>👋</span>
                </div>
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate" style={{ color: COLOR.ink, fontSize: 14 }}>
                  {goingCount === 0
                    ? "Be the first to RSVP"
                    : goingCount === 1
                    ? `${goingList[0].user.name} is going`
                    : goingCount === 2
                    ? `${goingList[0].user.name} & ${goingList[1].user.name} are going`
                    : `${goingList[0].user.name}, ${goingList[1].user.name} & ${goingCount - 2} more going`}
                </p>
                {goingCount > 0 && (
                  <p className="t-meta" style={{ fontSize: 11, marginTop: 1 }}>
                    Tap RSVP below to join
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Big primary RSVP button */}
        <div className="card p-5">
          <p className="t-label mb-3">Are you going?</p>
          <div className="flex gap-2">
            {(["going", "maybe", "cant"] as RsvpStatus[]).map((status) => {
              const active = myStatus === status;
              const label = status === "going" ? "🎉 Going" : status === "maybe" ? "Maybe" : "Can't make it";
              return (
                <button
                  key={status}
                  onClick={() => handleRsvp(status)}
                  disabled={busy}
                  className="flex-1 py-3 rounded-[10px] font-semibold text-sm transition-all"
                  style={{
                    background: active ? COLOR.navy : COLOR.surface,
                    color: active ? "#fff" : COLOR.ink,
                    border: `1.5px solid ${active ? COLOR.navy : COLOR.border}`,
                    transform: active ? "scale(1.02)" : "none",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
          {myStatus === "going" && (
            <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "#15803D" }}>
              <Check size={13} strokeWidth={2.5} />
              You're in. We'll remind you 30 mins before.
            </div>
          )}
        </div>

        {/* Hosted by */}
        {session.creator && (
          <div className="card px-5 py-4">
            <p className="t-label mb-2">Hosted by</p>
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0"
                style={{ background: hostSection?.color ?? COLOR.navy, fontSize: 14 }}
              >
                {(session.creator.name ?? "?")[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold" style={{ color: COLOR.ink, fontSize: 14 }}>
                  {session.creator.name ?? "—"}
                </p>
                <SectionPill code={session.creator.section} size="sm" />
              </div>
            </div>
          </div>
        )}

        {/* Description */}
        {session.description && (
          <div className="card px-5 py-4">
            <p className="t-label mb-2">About</p>
            <p className="t-body" style={{ whiteSpace: "pre-wrap", fontSize: 14, lineHeight: 1.55 }}>
              {session.description}
            </p>
          </div>
        )}

        {/* Going list (full) */}
        {goingCount > 0 && (
          <div className="card px-5 py-4">
            <div className="flex items-center justify-between mb-3">
              <p className="t-label">Going ({goingCount})</p>
            </div>
            <div className="space-y-2.5">
              {goingList.map((a) => {
                const sec = sectionByCode(a.user?.section);
                return (
                  <div key={a.user_id} className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-white flex-shrink-0"
                      style={{ background: sec?.color ?? COLOR.ink3, fontSize: 12 }}
                    >
                      {(a.user?.name ?? "?")[0]}
                    </div>
                    <p className="text-sm font-semibold flex-1 truncate" style={{ color: COLOR.ink }}>
                      {a.user?.name ?? "—"}
                    </p>
                    <SectionPill code={a.user?.section} size="sm" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Action row: calendar dropdown + share + copy link */}
        <div className="flex flex-wrap gap-2 pt-2">
          <CalendarMenu event={eventForCal} fullWidth />
          <button onClick={handleShare} className="btn-ghost flex-1 flex items-center justify-center gap-2">
            <Share2 size={14} /> Share
          </button>
          <button
            onClick={handleCopyLink}
            className="btn-ghost flex items-center justify-center gap-2"
            style={{ minWidth: 110 }}
          >
            {shareCopied ? <Check size={14} /> : <ExternalLink size={14} />}
            {shareCopied ? "Copied" : "Copy link"}
          </button>
        </div>
      </main>
    </div>
  );
}
