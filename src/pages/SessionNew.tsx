import { useState } from "react";
import { useSessions } from "../hooks/useSessions";
import type { User, Interest } from "../types";
import { INTERESTS } from "../types";
import { HEADER_GRADIENT, CTA_GRADIENT } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";

type Props = { user: User; onDone: () => void };

export default function SessionNew({ user, onDone }: Props) {
  const { createSession } = useSessions(user);
  const [mode, setMode] = useState<"paste" | "form">("paste");
  const [paste, setPaste] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [venue, setVenue] = useState("");
  const [tags, setTags] = useState<Interest[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleParse() {
    if (!paste.trim()) return;
    tap();
    setBusy(true);
    setErr(null);
    try {
      const r = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/parse-session`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ text: paste }),
        }
      );
      if (!r.ok) throw new Error(await r.text());
      const parsed = await r.json();
      if (parsed.title) setTitle(parsed.title);
      if (parsed.description) setDescription(parsed.description);
      if (parsed.starts_at) setStartsAt(toLocalDatetime(parsed.starts_at));
      if (parsed.venue) setVenue(parsed.venue);
      if (parsed.tags?.length)
        setTags(
          parsed.tags.filter((t: string) =>
            INTERESTS.some((i) => i.id === t)
          ) as Interest[]
        );
      setMode("form");
    } catch {
      setErr("Couldn't parse — fill it in manually.");
      setMode("form");
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmit() {
    if (!title.trim()) { setErr("Title is required"); return; }
    if (!startsAt) { setErr("Start time is required"); return; }
    tap();
    setBusy(true);
    setErr(null);
    try {
      await createSession({
        title: title.trim(),
        description: description.trim() || undefined,
        starts_at: new Date(startsAt).toISOString(),
        venue: venue.trim() || undefined,
        tags,
      });
      onDone();
    } catch {
      setErr("Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff] pb-24">
      <header className="px-5 pt-12 pb-6 text-white" style={{ background: HEADER_GRADIENT }}>
        <button
          onClick={() => { tap(); onDone(); }}
          className="text-white/70 text-sm mb-4"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-bold">New session</h1>
      </header>

      <main className="max-w-md mx-auto px-4 mt-5 space-y-3">
        {mode === "paste" && (
          <div className="bg-white rounded-3xl border border-gray-100 p-5 space-y-3">
            <p className="text-sm text-gray-600 leading-relaxed">
              Paste your WhatsApp announcement — Claude will auto-fill the details.
            </p>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={6}
              placeholder="e.g. 🟢 Consulting P2P Session — today at 9PM in LT3. Speakers from Bain and Deloitte..."
              className="w-full p-4 rounded-2xl bg-[#f0f4ff] text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]/30"
            />
            <button
              onClick={handleParse}
              disabled={busy || !paste.trim()}
              className="w-full py-3 rounded-2xl font-semibold text-white disabled:opacity-40 transition-all"
              style={{ background: CTA_GRADIENT }}
            >
              {busy ? "Parsing…" : "✨ Parse with Claude"}
            </button>
            <button
              onClick={() => setMode("form")}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              Fill in manually →
            </button>
          </div>
        )}

        {mode === "form" && (
          <div className="bg-white rounded-3xl border border-gray-100 p-5 space-y-4">
            {err && (
              <div className="bg-red-50 border border-red-100 rounded-2xl px-4 py-3 text-sm text-red-700">
                {err}
              </div>
            )}
            <Field label="Title *">
              <input
                className="w-full p-3 rounded-xl bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]/30"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. FADM P2P — Chapter 3"
              />
            </Field>
            <Field label="When *">
              <input
                type="datetime-local"
                className="w-full p-3 rounded-xl bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]/30"
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
              />
            </Field>
            <Field label="Venue">
              <input
                className="w-full p-3 rounded-xl bg-gray-50 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]/30"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                placeholder="e.g. LT3, Atrium, Online"
              />
            </Field>
            <Field label="Description">
              <textarea
                rows={3}
                className="w-full p-3 rounded-xl bg-gray-50 text-gray-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#4f6ef7]/30"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this about? Who's it for?"
              />
            </Field>
            <Field label="Tags">
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((it) => {
                  const on = tags.includes(it.id);
                  return (
                    <button
                      key={it.id}
                      onClick={() =>
                        setTags((p) =>
                          on ? p.filter((x) => x !== it.id) : [...p, it.id]
                        )
                      }
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        on
                          ? "bg-[#f0f4ff] border-[#4f6ef7] text-[#2d43cc]"
                          : "bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {it.emoji} {it.label}
                    </button>
                  );
                })}
              </div>
            </Field>
            <button
              onClick={handleSubmit}
              disabled={busy}
              className="w-full py-3 rounded-2xl font-semibold text-white disabled:opacity-50 transition-all"
              style={{ background: CTA_GRADIENT }}
            >
              {busy ? "Posting…" : "Post session"}
            </button>
            <button
              onClick={() => setMode("paste")}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700"
            >
              ← Try paste-to-parse
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wider text-gray-400 font-medium mb-1.5">{label}</p>
      {children}
    </div>
  );
}

function toLocalDatetime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}
