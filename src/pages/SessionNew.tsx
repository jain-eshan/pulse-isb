/**
 * SessionNew — Create / Edit event form — Luma-inspired redesign v3
 * Category + subcategory picker, cover preview, clean form styling, edit mode
 */
import { useState } from "react";
import { ArrowLeft, Sparkles, AlertCircle, Image } from "lucide-react";
import { useSessions } from "../hooks/useSessions";
import type { User, Interest, Session, EventCategory } from "../types";
import { INTERESTS } from "../types";
import { SECTIONS, sectionByCode, type SectionCode } from "../lib/sections";
import { COLOR, FONT, EVENT_CATEGORIES, SUBCATEGORIES, CATEGORY_COLOR } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";
import CoverBanner from "../components/CoverBanner";

type Props = { user: User; onDone: () => void; prefillVenue?: string; editSession?: Session };

export default function SessionNew({ user, onDone, prefillVenue, editSession }: Props) {
  const { createSession } = useSessions(user);
  const isEdit = !!editSession;
  const [mode, setMode] = useState<"paste" | "form">(prefillVenue || editSession ? "form" : "paste");
  const [paste, setPaste] = useState("");
  const [title, setTitle] = useState(editSession?.title ?? "");
  const [description, setDescription] = useState(editSession?.description ?? "");
  const [startsAt, setStartsAt] = useState(editSession?.starts_at ? toLocalDatetime(editSession.starts_at) : "");
  const [venue, setVenue] = useState(editSession?.venue ?? prefillVenue ?? "");
  const [tags, setTags] = useState<Interest[]>((editSession?.tags ?? []) as Interest[]);
  const [category, setCategory] = useState<EventCategory | "">(editSession?.category ?? "");
  const [subcategory, setSubcategory] = useState(editSession?.subcategory ?? "");
  const [visibility, setVisibility] = useState<"all" | "section" | "ogsg" | "custom">("all");
  const [customSections, setCustomSections] = useState<SectionCode[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [parseWarn, setParseWarn] = useState(false);

  const subcategories = category ? SUBCATEGORIES[category] : [];
  const catColor = category ? CATEGORY_COLOR[category.toLowerCase()] : null;

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
        category: category || undefined,
        subcategory: subcategory || undefined,
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
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            fontSize: 13,
            fontWeight: 600,
            color: COLOR.ink2,
            fontFamily: FONT.sans,
            background: "transparent",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <ArrowLeft size={14} /> Back
        </button>
        <h1
          style={{
            fontFamily: FONT.serif,
            fontSize: 28,
            fontWeight: 500,
            color: COLOR.ink,
            marginTop: 20,
            lineHeight: 1.1,
          }}
        >
          {isEdit ? "Edit" : "Create"} <em>event</em>
        </h1>
        <p style={{ fontSize: 14, color: COLOR.ink2, fontFamily: FONT.sans, marginTop: 6 }}>
          {isEdit ? "Update your event details." : "Paste a WhatsApp message, or fill it in manually."}
        </p>
      </header>

      <main className="px-4 md:px-8 max-w-2xl mt-6 space-y-3">
        {/* Paste mode */}
        {mode === "paste" && !isEdit && (
          <div className="card" style={{ padding: "24px" }}>
            <label
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: COLOR.ink3,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                fontFamily: FONT.sans,
                display: "block",
                marginBottom: 10,
              }}
            >
              Paste announcement
            </label>
            <textarea
              value={paste}
              onChange={(e) => setPaste(e.target.value)}
              rows={6}
              placeholder="e.g. Consulting P2P — tonight at 9PM, LT3. Speakers from Bain & Deloitte."
              style={{
                width: "100%",
                padding: "14px 16px",
                borderRadius: 12,
                border: `1px solid ${COLOR.border}`,
                background: COLOR.bgSoft,
                color: COLOR.ink,
                fontFamily: FONT.sans,
                fontSize: 14,
                lineHeight: 1.6,
                resize: "none",
                outline: "none",
              }}
            />
            <button
              onClick={handleParse}
              disabled={busy || !paste.trim()}
              className="btn-primary w-full mt-4"
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
            >
              <Sparkles size={15} />
              {busy ? "Reading..." : "Parse with AI"}
            </button>
            <button
              onClick={() => setMode("form")}
              style={{
                width: "100%",
                marginTop: 12,
                fontSize: 13,
                fontWeight: 600,
                color: COLOR.ink2,
                fontFamily: FONT.sans,
                background: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              Or fill in manually →
            </button>
          </div>
        )}

        {/* Form mode */}
        {mode === "form" && (
          <div className="space-y-4">
            {/* Cover preview */}
            <div className="card" style={{ overflow: "hidden" }}>
              <div style={{ borderRadius: "16px 16px 0 0", overflow: "hidden" }}>
                <CoverBanner
                  title={title || "Your event title"}
                  tag={tags[0] || (category?.toLowerCase())}
                  height={140}
                  showPill={!!(category || tags[0])}
                />
              </div>
              <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 8 }}>
                <Image size={14} strokeWidth={1.75} color={COLOR.ink3} />
                <p style={{ fontSize: 11, color: COLOR.ink3, fontFamily: FONT.sans }}>
                  Cover image upload coming soon — gradient auto-generated from category
                </p>
              </div>
            </div>

            {/* Parse warning */}
            {parseWarn && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  borderRadius: 12,
                  padding: "12px 16px",
                  background: COLOR.amberTint,
                  border: `1px solid ${COLOR.amber}22`,
                }}
              >
                <AlertCircle size={16} strokeWidth={1.75} style={{ color: COLOR.amber, flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: "#7A5000", fontFamily: FONT.sans }}>
                  Auto-parse isn't available right now. Fill in below.
                </p>
              </div>
            )}

            {err && (
              <div
                style={{
                  borderRadius: 12,
                  padding: "12px 16px",
                  background: "#FEF2F2",
                  border: "1px solid #FECACA",
                  color: "#B91C1C",
                  fontSize: 13,
                  fontFamily: FONT.sans,
                }}
              >
                {err}
              </div>
            )}

            {/* Main form card */}
            <div className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
                <FormField label="Title">
                  <FormInput value={title} onChange={setTitle} placeholder="e.g. Football @ Rec Center" />
                </FormField>

                {/* Category picker */}
                <FormField label="Category">
                  <div className="flex flex-wrap gap-2">
                    {EVENT_CATEGORIES.map((cat) => {
                      const pal = CATEGORY_COLOR[cat.toLowerCase()];
                      const isActive = category === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            tap();
                            if (isActive) { setCategory(""); setSubcategory(""); }
                            else { setCategory(cat); setSubcategory(""); }
                          }}
                          style={{
                            padding: "7px 14px",
                            borderRadius: 99,
                            fontSize: 13,
                            fontWeight: 600,
                            background: isActive ? pal?.accent ?? COLOR.navy : COLOR.surface,
                            color: isActive ? "#fff" : COLOR.ink2,
                            border: `1.5px solid ${isActive ? pal?.accent ?? COLOR.navy : COLOR.border}`,
                            fontFamily: FONT.sans,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                {/* Subcategory picker */}
                {subcategories.length > 0 && (
                  <FormField label="Subcategory">
                    <div className="flex flex-wrap gap-2">
                      {subcategories.map((sub) => {
                        const isActive = subcategory === sub;
                        return (
                          <button
                            key={sub}
                            onClick={() => { tap(); setSubcategory(isActive ? "" : sub); }}
                            style={{
                              padding: "5px 12px",
                              borderRadius: 99,
                              fontSize: 12,
                              fontWeight: 500,
                              background: isActive ? (catColor?.accent ?? COLOR.navy) + "14" : COLOR.bgSoft,
                              color: isActive ? catColor?.accent ?? COLOR.navy : COLOR.ink2,
                              border: `1px solid ${isActive ? (catColor?.accent ?? COLOR.navy) + "40" : COLOR.borderLight}`,
                              fontFamily: FONT.sans,
                              cursor: "pointer",
                              transition: "all 0.15s",
                            }}
                          >
                            {sub}
                          </button>
                        );
                      })}
                    </div>
                  </FormField>
                )}

                <FormField label="When">
                  <FormInput value={startsAt} onChange={setStartsAt} type="datetime-local" />
                </FormField>

                <FormField label="Venue">
                  <FormInput value={venue} onChange={setVenue} placeholder="Rec Center, LT3, Zoom link..." />
                </FormField>

                <FormField label="Description">
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What's this about? Who's it for?"
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 12,
                      border: `1px solid ${COLOR.border}`,
                      background: COLOR.bgSoft,
                      color: COLOR.ink,
                      fontFamily: FONT.sans,
                      fontSize: 14,
                      lineHeight: 1.6,
                      resize: "none",
                      outline: "none",
                    }}
                  />
                </FormField>

                {/* Legacy interest tags — still shown but de-emphasized */}
                <FormField label="Tags (optional)">
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((it) => {
                      const on = tags.includes(it.id);
                      return (
                        <button
                          key={it.id}
                          onClick={() => {
                            tap();
                            setTags((p) => on ? p.filter((x) => x !== it.id) : [...p, it.id]);
                          }}
                          style={{
                            padding: "5px 12px",
                            borderRadius: 99,
                            fontSize: 12,
                            fontWeight: 600,
                            background: on ? COLOR.navy : COLOR.surface,
                            color: on ? "#fff" : COLOR.ink2,
                            border: `1.5px solid ${on ? COLOR.navy : COLOR.border}`,
                            fontFamily: FONT.sans,
                            cursor: "pointer",
                            transition: "all 0.15s",
                          }}
                        >
                          {it.label}
                        </button>
                      );
                    })}
                  </div>
                </FormField>

                <FormField label="Who can see this?">
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
                </FormField>
              </div>

              {/* Submit */}
              <div className="flex gap-2 mt-6">
                {!isEdit && (
                  <button
                    onClick={() => { setParseWarn(false); setMode("paste"); }}
                    className="btn-ghost"
                  >
                    ← Paste
                  </button>
                )}
                <button
                  onClick={handleSubmit}
                  disabled={busy}
                  className="btn-primary flex-1"
                >
                  {busy
                    ? isEdit ? "Saving..." : "Posting..."
                    : isEdit ? "Save changes" : "Create event"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Sub-components ─── */
function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 700,
          color: COLOR.ink3,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          fontFamily: FONT.sans,
          marginBottom: 8,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function FormInput({
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%",
        padding: "12px 14px",
        borderRadius: 12,
        border: `1px solid ${COLOR.border}`,
        background: COLOR.bgSoft,
        color: COLOR.ink,
        fontFamily: FONT.sans,
        fontSize: 14,
        outline: "none",
      }}
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
