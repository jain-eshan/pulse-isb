import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowLeft, MapPin, Share2, Clock } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useSessions } from "../hooks/useSessions";
import { fireConfetti } from "../components/Confetti";
import { sendCalendarInvite } from "../lib/graph";
import { COLOR, INTEREST_COLOR, stripGradient } from "../lib/pulseTheme";
import { tap, success } from "../lib/haptics";
import type { Session, User, RsvpStatus } from "../types";

type Props = { session: Session; user: User; onBack: () => void };

export default function SessionDetail({ session, user, onBack }: Props) {
  const { rsvp } = useSessions(user);
  const [attendees, setAttendees] = useState<
    { id: string; name: string; avatar_url?: string }[]
  >([]);
  const [busy, setBusy] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const topTag = session.tags[0];
  const cat = topTag ? INTEREST_COLOR[topTag] : undefined;
  const strip = cat?.strip ?? COLOR.navy;
  const tint = cat?.tint ?? COLOR.navyTint;
  const catLabel = cat?.label ?? "Session";

  useEffect(() => {
    supabase
      .from("rsvps")
      .select("status, users!inner(id,name,avatar_url)")
      .eq("session_id", session.id)
      .eq("status", "going")
      .then(({ data }) => setAttendees((data ?? []).map((r: any) => r.users)));
  }, [session.id]);

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  async function handleRsvp(status: RsvpStatus) {
    tap();
    setBusy(true);
    const wasGoing = session.my_rsvp === "going";
    await rsvp(session.id, status);
    if (status === "going" && !wasGoing) {
      success();
      fireConfetti();
      showToast("You're in. Calendar invite on its way.");
      sendCalendarInvite(session).catch(() => {});
    }
    setBusy(false);
  }

  const start = new Date(session.starts_at);
  const shareText = `*${session.title}*\n${format(start, "EEE d MMM · h:mm a")}${
    session.venue ? ` · ${session.venue}` : ""
  }\n\nRSVP on Pulse: pulse.eshanjain.in`;

  return (
    <div className="min-h-screen pb-36" style={{ background: COLOR.bg }}>
      {/* Toast */}
      {toastMsg && (
        <div
          className="fixed top-6 left-1/2 -translate-x-1/2 z-50 text-white text-sm font-medium px-4 py-2.5 rounded-full"
          style={{ background: COLOR.navyDeep, boxShadow: "0 8px 24px rgba(0,0,0,.2)" }}
        >
          {toastMsg}
        </div>
      )}

      {/* Top bar */}
      <div className="px-5 md:px-8 pt-6 max-w-2xl">
        <button
          onClick={() => { tap(); onBack(); }}
          className="flex items-center gap-1.5 t-meta hover:text-[color:var(--ink2)]"
          style={{ color: COLOR.ink2 }}
        >
          <ArrowLeft size={14} /> Back
        </button>
      </div>

      {/* Editorial hero */}
      <header className="px-5 md:px-8 pt-5 pb-8 max-w-2xl">
        <div
          style={{
            height: 2,
            background: stripGradient(strip, tint),
            marginBottom: 20,
            borderRadius: 2,
          }}
        />
        <p className="t-label mb-3" style={{ color: strip }}>
          {catLabel} · {format(start, "EEEE d MMMM")}
        </p>
        <h1 className="t-display-lg mb-3">{session.title}</h1>
        <div className="flex flex-wrap gap-4 t-meta" style={{ color: COLOR.ink2 }}>
          <span className="flex items-center gap-1.5">
            <Clock size={13} /> {format(start, "h:mm a")}
          </span>
          {session.venue && (
            <span className="flex items-center gap-1.5">
              <MapPin size={13} /> {session.venue}
            </span>
          )}
        </div>
      </header>

      <main className="px-4 md:px-8 max-w-2xl space-y-3">
        {/* Description */}
        {session.description && (
          <div className="card p-6">
            <p className="t-body" style={{ fontSize: 15, lineHeight: 1.75 }}>
              {session.description}
            </p>
          </div>
        )}

        {/* Tags + share */}
        <div className="card p-5">
          <div className="flex flex-wrap gap-1.5 mb-4">
            {session.tags.map((t) => {
              const c = INTEREST_COLOR[t];
              return (
                <span
                  key={t}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: c?.tint ?? COLOR.navyTint,
                    color: c?.strip ?? COLOR.navy,
                  }}
                >
                  {c?.label ?? t}
                </span>
              );
            })}
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm font-semibold"
            style={{ color: COLOR.navy }}
          >
            <Share2 size={15} strokeWidth={1.75} /> Share to WhatsApp
          </a>
        </div>

        {/* Attendees */}
        {attendees.length > 0 && (
          <div className="card p-5">
            <p className="t-label mb-3">{attendees.length} going</p>
            <div className="flex flex-wrap gap-2">
              {attendees.slice(0, 16).map((a) => (
                <div
                  key={a.id}
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    background: COLOR.navyTint,
                    color: COLOR.navy,
                  }}
                  title={a.name}
                >
                  {a.avatar_url ? (
                    <img
                      src={a.avatar_url}
                      className="w-full h-full rounded-full object-cover"
                      alt={a.name}
                    />
                  ) : (
                    a.name[0]?.toUpperCase()
                  )}
                </div>
              ))}
              {attendees.length > 16 && (
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold"
                  style={{ background: COLOR.borderLight, color: COLOR.ink2 }}
                >
                  +{attendees.length - 16}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Sticky RSVP footer */}
      <footer
        className="fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl"
        style={{
          background: "rgba(244,242,236,0.92)",
          borderColor: COLOR.borderLight,
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >
        <div className="max-w-2xl mx-auto flex gap-2 px-4 md:px-8 py-4">
          <button
            disabled={busy}
            onClick={() => handleRsvp("going")}
            className="btn-primary flex-1"
            style={{
              background:
                session.my_rsvp === "going" ? "#1A7A4A" : COLOR.navy,
            }}
          >
            {session.my_rsvp === "going" ? "✓ You're going" : "I'm going"}
          </button>
          <button
            disabled={busy}
            onClick={() => handleRsvp("maybe")}
            className="btn-ghost"
            data-active={session.my_rsvp === "maybe"}
            style={
              session.my_rsvp === "maybe"
                ? {
                    background: COLOR.amberTint,
                    color: COLOR.amber,
                    borderColor: COLOR.amber,
                  }
                : undefined
            }
          >
            Maybe
          </button>
        </div>
      </footer>
    </div>
  );
}
