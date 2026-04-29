import { useState } from "react";
import { ArrowLeft, Sparkles, AlertCircle } from "lucide-react";
import { useSessions } from "../hooks/useSessions";
import type { User, Interest, Session } from "../types";
import { INTERESTS } from "../types";
import { SECTIONS, sectionByCode, type SectionCode } from "../lib/sections";
import { COLOR, FONT } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";
import CoverBanner, { COVER_THEMES } from "../components/CoverBanner";

type Props = { user: User; onDone: () => void; prefillVenue?: string };

export default function SessionNew({ user, onDone, prefillVenue }: Props) {
  const { createSession } = useSessions(user);
  const [mode, setMode] = useState<"paste" | "form">(prefillVenue ? "form" : "paste");
  const [paste, setPaste] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startsAt, setStartsAt] = useState("");
  const [venue, setVenue] = useState(prefillVenue ?? "");
  const [tags, setTags] = useState<Interest[]>([]);
  const [visibility, setVisibility] = useState<"all" | "section" | "ogsg" | "custom">("all");
  const [customSections, setCustomSections] = useState<SectionCode[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [parseWarn, setParseWarn] = useState(false);

  async function handleParse() {
    if (!paste.trim()) return;
    tap();
    setBusy(true);
    setErr(null);
    setParseWarn(false);
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
        setTags(parsed.tags.filter((t: string) => INTERESTS.some((i) => i.id === t)) as Interest[]);
      setMode("form");
    } catch {
      // Parsing failed — drop into manual form with a soft warning (not a hard error)
      setParseWarn(true);
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
      const visible_to_sections =
        visibility === "section" && user.section ? [user.section] :
        visibility === "custom" ? customSections : [];
      const visible_to_ogsgs =
        visibility === "ogsg" && user.section && user.ogsg ? [`${user.section}-${user.ogsg}`] : [];

      await createSession({
        title: title.trim(),
        description: description.trim() || undefined,
        starts_at: new Date(startsAt).toISOString(),
        venue: venue.trim() || undefined,
        tags,
        visible_to_sections,
        visible_to_ogsgs,
      } as Partial<Session>);
      onDone();
    } catch {
      setErr("Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pb-16" style={{ background: COLOR.bg }}>
      <header className="px-5 md:px-8 pt-6 max-w-2xl">
        <button
          onClick={() => { tap(); onDone(); }}
          className="flex items-center gap-1.5 t-meta"
          style={{ color: COLOR.ink2 }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <h1 className="t-display mt-5" style={{ fontSize: 32 }}>
          New <span className="t-italic">session</span>
        </h1>
        <p className="t-body mt-1">Paste a WhatsApp announcement, or fill it in.</p>
      </header>

      <main className="px-4 md:px-8 max-w-2xl mt-6 space-y-3">
        {mode === "paste" && (
          <div className="card p-6 space-y-4">
            <label className="t-label block">Paste announcement</label>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={7}
              placeholder="e.g. Consulting P2P — tonight at 9PM, LT3. Speakers from Bain & Deloitte. All PGP welcome."
              className="w-full p-4 rounded-[10px] text-sm resize-none focus:outline-none focus:ring-2"
              style={{
                border: `1px solid ${COLOR.border}`,
                background: COLOR.bg,
                color: COLOR.ink,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                lineHeight: 1.6,
              }}
            />
            <button
              onClick={handleParse}
              disabled={busy || !paste.trim()}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Sparkles size={15} />
              {busy ? "Reading…" : "Parse with Claude"}
            </button>
            <button
              onClick={() => setMode("form")}
              className="w-full text-sm t-meta hover:opacity-70"
              style={{ color: COLOR.ink2 }}
            >
              Fill in manually →
            </button>
          </div>
        )}

        {mode === "form" && (
          <div className="card p-6 space-y-5">
            {/* Live cover preview — updates as the user types title and picks a category */}
            <div>
              <label className="t-label block mb-2">Cover preview</label>
              <div
                className="rounded-[14px] overflow-hidden"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}
              >
                <CoverBanner
                  title={title || "Your session title"}
                  tag={tags[0]}
                  height={140}
                  showPill={!!tags[0]}
                />
              </div>
              <p
                className="t-meta mt-2"
                style={{ fontSize: 11 }}
              >
                Pick a category below to set the cover colour. The first one is
                used as the cover theme.
              </p>
            </div>

            {/* Soft parse warning — not a hard error */}
            {parseWarn && (
              <div
                className="flex items-start gap-3 rounded-[10px] px-4 py-3 text-sm"
                style={{ background: COLOR.amberTint, border: `1px solid ${COLOR.amber}22` }}
              >
                <AlertCircle size={16} strokeWidth={1.75} style={{ color: COLOR.amber, flexShrink: 0, marginTop: 1 }} />
                <p style={{ color: "#7A5000" }}>
                  Auto-parse isn't available right now. Fill in the details below — it only takes a moment.
                </p>
              </div>
            )}

            {err && (
              <div
                className="rounded-[10px] px-4 py-3 text-sm"
                style={{ background: "#FEF2F2", border: "1px solid #FECACA", color: "#B91C1C" }}
              >
                {err}
              </div>
            )}

            <Field label="Title">
              <Input value={title} onChange={setTitle} placeholder="e.g. FADM P2P — Chapter 3" />
            </Field>
            <Field label="When">
              <Input value={startsAt} onChange={setStartsAt} type="datetime-local" />
            </Field>
            <Field label="Venue">
              <Input value={venue} onChange={setVenue} placeholder="LT3, Atrium, Zoom…" />
            </Field>
            <Field label="Description">
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-3 rounded-[10px] text-sm resize-none focus:outline-none focus:ring-2"
                placeholder="What's this about? Who's it for?"
                style={{
                  border: `1px solid ${COLOR.border}`,
                  background: COLOR.surface,
                  color: COLOR.ink,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              />
            </Field>
            <Field label="Category">
              <div className="flex flex-wrap gap-2">
                {INTERESTS.map((it) => {
                  const on = tags.includes(it.id);
                  const isPrimary = tags[0] === it.id;
                  const theme = COVER_THEMES[it.id];
                  return (
                    <button
                      key={it.id}
                      onClick={() => {
                        tap();
                        setTags((p) => {
                          if (on) return p.filter((x) => x !== it.id);
                          // New picks become the primary (first) — drives the cover
                          return [it.id, ...p.filter((x) => x !== it.id)];
                        });
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "7px 12px",
                        borderRadius: 99,
                        fontSize: 12,
                        fontWeight: 700,
                        background: on ? COLOR.navy : COLOR.surface,
                        color: on ? "#fff" : COLOR.ink2,
                        border: `1.5px solid ${on ? COLOR.navy : COLOR.border}`,
                        cursor: "pointer",
                        fontFamily: FONT.sans,
                      }}
                    >
                      {/* Colour swatch — matches cover banner gradient */}
                      {theme && (
                        <span
                          style={{
                            width: 12,
                            height: 12,
                            borderRadius: 3,
                            background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                            border: `1.5px solid ${on ? "#fff" : COLOR.borderLight}`,
                            flexShrink: 0,
                          }}
                        />
                      )}
                      {it.label}
                      {isPrimary && (
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 800,
                            letterSpacing: "0.05em",
                            opacity: 0.85,
                            textTransform: "uppercase",
                          }}
                        >
                          · cover
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              {tags.length > 1 && (
                <p
                  className="t-meta mt-2"
                  style={{ fontSize: 11 }}
                >
                  Tap any selected category again to remove it. Reorder by
                  re-tapping — the most-recently picked one becomes the cover.
                </p>
              )}
            </Field>

            <Field label="Who can see this?">
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setVisibility("all")} className="chip" data-active={visibility === "all"}>
                  Everyone
                </button>
                {user.section && (
                  <button onClick={() => setVisibility("section")} className="chip" data-active={visibility === "section"}>
                    Just {sectionByCode(user.section)?.name ?? "my section"}
                  </button>
                )}
                {user.section && user.ogsg && (
                  <button onClick={() => setVisibility("ogsg")} className="chip" data-active={visibility === "ogsg"}>
                    My OGSG only
                  </button>
                )}
                <button onClick={() => setVisibility("custom")} className="chip" data-active={visibility === "custom"}>
                  Custom
                </button>
              </div>
              {visibility === "custom" && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {SECTIONS.map((s) => {
                    const on = customSections.includes(s.code);
                    return (
                      <button
                        key={s.code}
                        onClick={() =>
                          setCustomSections((p) => (on ? p.filter((x) => x !== s.code) : [...p, s.code]))
                        }
                        className="chip"
                        data-active={on}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </Field>

            <div className="flex gap-2 pt-2">
              <button onClick={() => { setParseWarn(false); setMode("paste"); }} className="btn-ghost">
                ← Paste instead
              </button>
              <button onClick={handleSubmit} disabled={busy} className="btn-primary flex-1">
                {busy ? "Posting…" : "Post session"}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="t-label block mb-2">{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text" }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <input
      type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-4 py-3 rounded-[10px] text-sm focus:outline-none focus:ring-2"
      style={{ border: `1px solid ${COLOR.border}`, background: COLOR.surface, color: COLOR.ink, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    />
  );
}

function toLocalDatetime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
}
