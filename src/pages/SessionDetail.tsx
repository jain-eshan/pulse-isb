import { useEffect, useState } from "react";
import { format } from "date-fns";
import { supabase } from "../lib/supabase";
import { useSessions } from "../hooks/useSessions";
import { fireConfetti } from "../components/Confetti";
import { sendCalendarInvite } from "../lib/graph";
import { HEADER_GRADIENT, CTA_GRADIENT, INTEREST_COLOR } from "../lib/pulseTheme";
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

  const accent = session.tags[0]
    ? (INTEREST_COLOR[session.tags[0]] ?? "#4f6ef7")
    : "#4f6ef7";

  useEffect(() => {
    supabase
      .from("rsvps")
      .select("status, users!inner(id,name,avatar_url)")
      .eq("session_id", session.id)
      .eq("status", "going")
      .then(({ data }) =>
        setAttendees((data ?? []).map((r: any) => r.users))
      );
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
      showToast("You're in! Calendar invite sent.");
      sendCalendarInvite(session).catch(() => {});
    }
    setBusy(false);
  }

  const start = new Date(session.starts_at);
  const shareText = `📅 *${session.title}*\n🕘 ${format(start, "EEE d MMM · h:mm a")}\n📍 ${session.venue ?? "TBA"}\n\nRSVP: pulse.eshanjain.in`;

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-36">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-2xl shadow-lg">
          {toastMsg}
        </div>
      )}

      <header className="px-5 pt-12 pb-8 text-white" style={{ background: HEADER_GRADIENT }}>
        <button
          onClick={() => { tap(); onBack(); }}
          className="text-white/70 text-sm mb-5 flex items-center gap-1 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <p className="text-xs uppercase tracking-wider opacity-60 font-medium mb-1">
          {format(start, "EEEE d MMMM · h:mm a")}
        </p>
        <h1 className="text-2xl font-bold leading-tight">{session.title}</h1>
        {session.venue && (
          <p className="text-white/70 mt-2 text-sm">📍 {session.venue}</p>
        )}
      </header>

      <main className="max-w-md mx-auto px-4 -mt-3 space-y-3">
        {/* Info card */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
          {session.description && (
            <p className="text-gray-700 leading-relaxed text-sm mb-4">
              {session.description}
            </p>
          )}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {session.tags.map((t) => (
              <span
                key={t}
                className="px-2.5 py-1 rounded-full text-xs font-medium"
                style={{
                  background: `${INTEREST_COLOR[t] ?? accent}18`,
                  color: INTEREST_COLOR[t] ?? accent,
                }}
              >
                #{t}
              </span>
            ))}
          </div>
          {/* Share to WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-green-700 hover:text-green-800"
          >
            <span>📤</span> Share to WhatsApp
          </a>
        </div>

        {/* Attendees */}
        {attendees.length > 0 && (
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-3">
              {attendees.length} going
            </p>
            <div className="flex flex-wrap gap-2">
              {attendees.slice(0, 16).map((a) => (
                <div
                  key={a.id}
                  className="w-10 h-10 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-sm font-bold text-gray-600 shadow-sm"
                >
                  {a.avatar_url ? (
                    <img
                      src={a.avatar_url}
                      className="w-full h-full rounded-full object-cover"
                      alt={a.name}
                    />
                  ) : (
                    a.name[0].toUpperCase()
                  )}
                </div>
              ))}
              {attendees.length > 16 && (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                  +{attendees.length - 16}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* RSVP footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 p-4 z-40">
        <div className="max-w-md mx-auto flex gap-2">
          <button
            disabled={busy}
            onClick={() => handleRsvp("going")}
            className="flex-1 py-3.5 rounded-2xl font-semibold text-white disabled:opacity-60 transition-all"
            style={{
              background: session.my_rsvp === "going" ? "#16a34a" : CTA_GRADIENT,
            }}
          >
            {session.my_rsvp === "going" ? "✓ You're going" : "I'm going"}
          </button>
          <button
            disabled={busy}
            onClick={() => handleRsvp("maybe")}
            className={`px-5 py-3.5 rounded-2xl font-semibold transition-all ${
              session.my_rsvp === "maybe"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Maybe
          </button>
        </div>
      </footer>
    </div>
  );
}
