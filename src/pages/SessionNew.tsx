/**
 * SessionNew — Luma-style Create / Edit event
 * Desktop: cover preview (left) + inline form (right)
 * Mobile: cover top, form below
 * Cover image upload via Supabase Storage
 */
import { useRef, useState, useEffect } from "react";
import {
  ArrowLeft,
  Camera,
  Calendar,
  MapPin,
  AlignLeft,
  Tag,
  Eye,
  ChevronDown,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useSessions } from "../hooks/useSessions";
import type { User, Interest, Session, EventCategory } from "../types";
import { INTERESTS } from "../types";
import { SECTIONS, sectionByCode, type SectionCode } from "../lib/sections";
import { COLOR, FONT, EVENT_CATEGORIES, SUBCATEGORIES, CATEGORY_COLOR } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";

type Props = { user: User; onDone: () => void; prefillVenue?: string; editSession?: Session; draftToken?: string };

/* ─── Cover gradient themes ─── */
const COVER_GRADIENTS = [
  { id: "cosmic",  from: "#1a1a2e", to: "#16213e", via: "#0f3460" },
  { id: "sunset",  from: "#ff6b6b", to: "#feca57", via: "#ff9ff3" },
  { id: "ocean",   from: "#0abde3", to: "#10ac84", via: "#48dbfb" },
  { id: "grape",   from: "#6c5ce7", to: "#a29bfe", via: "#fd79a8" },
  { id: "forest",  from: "#2d3436", to: "#00b894", via: "#55efc4" },
];

export default function SessionNew({ user, onDone, prefillVenue, editSession, draftToken }: Props) {
  const { createSession } = useSessions(user);
  const isEdit = !!editSession;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(editSession?.title ?? "");
  const [description, setDescription] = useState(editSession?.description ?? "");
  const [startsAt, setStartsAt] = useState(editSession?.starts_at ? toLocalDatetime(editSession.starts_at) : "");
  const [endsAt, setEndsAt] = useState(editSession?.ends_at ? toLocalDatetime(editSession.ends_at) : "");
  const [venue, setVenue] = useState(editSession?.venue ?? prefillVenue ?? "");
  const [tags, setTags] = useState<Interest[]>((editSession?.tags ?? []) as Interest[]);
  const [category, setCategory] = useState<EventCategory | "">(editSession?.category ?? "");
  const [subcategory, setSubcategory] = useState(editSession?.subcategory ?? "");
  const [visibility, setVisibility] = useState<"all" | "section" | "ogsg" | "custom">("all");
  const [customSections, setCustomSections] = useState<SectionCode[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [draftId, setDraftId] = useState<string | undefined>();

  // Cover image
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(editSession?.cover_image_url ?? null);
  const [coverGradient, setCoverGradient] = useState(COVER_GRADIENTS[0].id);

  // Load bot draft if token provided (magic link from WhatsApp bot)
  useEffect(() => {
    if (!draftToken) return;
    (async () => {
      const { data, error } = await supabase
        .from("bot_event_drafts")
        .select("*")
        .eq("token", draftToken)
        .is("consumed_at", null)
        .gt("expires_at", new Date().toISOString())
        .maybeSingle();

      if (error || !data) {
        console.warn("[SessionNew] draft not found or expired:", draftToken);
        return;
      }

      const p = data.parsed_payload as {
        title?: string;
        description?: string;
        starts_at?: string;
        ends_at?: string;
        venue?: string;
        category?: EventCategory;
        subcategory?: string;
        tags?: Interest[];
        image_url?: string;
      };

      setDraftId(data.id as string);
      if (p.title) setTitle(p.title);
      if (p.description) setDescription(p.description);
      if (p.starts_at) setStartsAt(toLocalDatetime(p.starts_at));
      if (p.ends_at) setEndsAt(toLocalDatetime(p.ends_at));
      if (p.venue) setVenue(p.venue);
      if (p.category) setCategory(p.category);
      if (p.subcategory) setSubcategory(p.subcategory);
      if (p.tags?.length) setTags(p.tags);
      if (p.image_url) setCoverPreview(p.image_url);
    })();
  }, [draftToken]);

  const subcategories = category ? SUBCATEGORIES[category] : [];
  const catColor = category ? CATEGORY_COLOR[category.toLowerCase()] : null;
  const activeGradient = COVER_GRADIENTS.find((g) => g.id === coverGradient) ?? COVER_GRADIENTS[0];

  async function compressImage(file: File, maxPx = 1400, quality = 0.82): Promise<File> {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => {
          resolve(blob ? new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" }) : file);
        }, "image/jpeg", quality);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  function handleCoverSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function uploadCover(): Promise<string | undefined> {
    if (!coverFile) return coverPreview ?? undefined;
    const compressed = await compressImage(coverFile);
    const path = `${user.id}/${Date.now()}.jpg`;
    const { error } = await supabase.storage
      .from("session-covers")
      .upload(path, compressed, { upsert: true });
    if (error) {
      console.error("[uploadCover] upload failed:", error.message);
      // Surface error to user instead of silently dropping the image
      setErr(`Image upload failed: ${error.message}`);
      return undefined;
    }
    const { data } = supabase.storage.from("session-covers").getPublicUrl(path);
    console.log("[uploadCover] publicUrl:", data.publicUrl);
    return data.publicUrl;
  }

  async function handleSubmit() {
    if (!title.trim()) { setErr("Event name is required"); return; }
    if (!startsAt) { setErr("Date & time is required"); return; }
    if (!category) { setErr("Event type is required — pick Sports, Social, or Professional"); return; }
    tap();
    setBusy(true);
    setErr(null);
    try {
      const cover_image_url = await uploadCover();
      const visible_to_sections =
        visibility === "section" && user.section ? [user.section] :
        visibility === "custom" ? customSections : [];
      const visible_to_ogsgs =
        visibility === "ogsg" && user.section && user.ogsg ? [`${user.section}-${user.ogsg}`] : [];

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
        venue: venue.trim() || undefined,
        tags,
        category: category || undefined,
        subcategory: subcategory || undefined,
        cover_image_url,
        visible_to_sections,
        visible_to_ogsgs,
      };
      console.log("[SessionNew] creating session:", payload);
      await createSession(payload as Partial<Session>);

      // Mark bot draft as consumed (so it can't be re-used)
      if (draftId) {
        await supabase
          .from("bot_event_drafts")
          .update({ consumed_at: new Date().toISOString() })
          .eq("id", draftId);
      }

      onDone();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("[SessionNew] createSession failed:", msg);
      setErr(`Something went wrong: ${msg}`);
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: COLOR.bg }}>
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-5 md:px-8 pt-5 pb-2"
        style={{ maxWidth: 1000, margin: "0 auto" }}
      >
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
          <ArrowLeft size={16} /> Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={busy}
          style={{
            padding: "8px 20px",
            borderRadius: 10,
            fontSize: 13,
            fontWeight: 700,
            background: COLOR.ink,
            color: "#fff",
            border: "none",
            cursor: "pointer",
            fontFamily: FONT.sans,
            opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save Changes" : "Create Event")}
        </button>
      </div>

      {/* Main layout — side-by-side on desktop, stacked on mobile */}
      <div
        className="flex flex-col md:flex-row gap-6 md:gap-10 px-5 md:px-8 pb-24 mt-4"
        style={{ maxWidth: 1000, margin: "0 auto" }}
      >
        {/* Left: Cover image */}
        <div className="w-full md:w-[360px] flex-shrink-0">
          <div
            onClick={() => fileInputRef.current?.click()}
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1",
              borderRadius: 16,
              overflow: "hidden",
              cursor: "pointer",
              background: coverPreview
                ? `url(${coverPreview}) center/cover`
                : `linear-gradient(135deg, ${activeGradient.from}, ${activeGradient.via}, ${activeGradient.to})`,
            }}
          >
            {/* Upload overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                background: coverPreview ? "rgba(0,0,0,0.25)" : "rgba(0,0,0,0.08)",
                opacity: coverPreview ? 0 : 1,
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = "1"; }}
              onMouseLeave={(e) => { if (coverPreview) e.currentTarget.style.opacity = "0"; }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  background: "rgba(255,255,255,0.2)",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Camera size={22} color="#fff" strokeWidth={1.75} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#fff", fontFamily: FONT.sans }}>
                {coverPreview ? "Change cover" : "Upload cover image"}
              </span>
            </div>

            {/* Category badge */}
            {(subcategory || category) && (
              <span
                style={{
                  position: "absolute",
                  bottom: 14,
                  left: 14,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "4px 12px",
                  borderRadius: 8,
                  background: "rgba(0,0,0,0.5)",
                  color: "#fff",
                  backdropFilter: "blur(6px)",
                  fontFamily: FONT.sans,
                }}
              >
                {subcategory || category}
              </span>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleCoverSelect}
            style={{ display: "none" }}
          />

          {/* Gradient theme picker (when no uploaded image) */}
          {!coverPreview && (
            <div className="flex items-center gap-2 mt-3">
              <span style={{ fontSize: 11, color: COLOR.ink3, fontFamily: FONT.sans, fontWeight: 600, marginRight: 4 }}>
                Theme
              </span>
              {COVER_GRADIENTS.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setCoverGradient(g.id)}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 8,
                    background: `linear-gradient(135deg, ${g.from}, ${g.to})`,
                    border: coverGradient === g.id ? `2px solid ${COLOR.navy}` : "2px solid transparent",
                    cursor: "pointer",
                    transition: "border 0.15s",
                  }}
                />
              ))}
            </div>
          )}

          {/* No cover banner — use gradient fallback when no image */}
        </div>

        {/* Right: Form fields — Luma inline style */}
        <div className="flex-1 min-w-0">
          {/* Title — large serif input */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Event Name"
            style={{
              width: "100%",
              fontFamily: FONT.serif,
              fontSize: 28,
              fontWeight: 500,
              color: COLOR.ink,
              background: "transparent",
              border: "none",
              outline: "none",
              padding: "8px 0",
              lineHeight: 1.2,
            }}
          />

          {/* Category + subcategory */}
          <div className="flex flex-wrap items-center gap-2 mt-2 mb-4">
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
                    padding: "5px 14px",
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    background: isActive ? pal?.accent ?? COLOR.navy : COLOR.bgSoft,
                    color: isActive ? "#fff" : COLOR.ink2,
                    border: "none",
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
          {subcategories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {subcategories.map((sub) => {
                const isActive = subcategory === sub;
                return (
                  <button
                    key={sub}
                    onClick={() => { tap(); setSubcategory(isActive ? "" : sub); }}
                    style={{
                      padding: "4px 12px",
                      borderRadius: 8,
                      fontSize: 11,
                      fontWeight: 500,
                      background: isActive ? (catColor?.accent ?? COLOR.navy) + "14" : COLOR.bgSoft,
                      color: isActive ? catColor?.accent ?? COLOR.navy : COLOR.ink2,
                      border: "none",
                      fontFamily: FONT.sans,
                      cursor: "pointer",
                    }}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: COLOR.borderLight, margin: "4px 0" }} />

          {/* Date row */}
          <FieldRow icon={<Calendar size={18} strokeWidth={1.5} color={COLOR.ink3} />}>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6 flex-1">
              <div className="flex items-center gap-3 flex-1">
                <span style={{ fontSize: 13, color: COLOR.ink3, fontFamily: FONT.sans, fontWeight: 600, minWidth: 36 }}>Start</span>
                <input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                  style={inlineInputStyle}
                />
              </div>
              <div className="flex items-center gap-3 flex-1">
                <span style={{ fontSize: 13, color: COLOR.ink3, fontFamily: FONT.sans, fontWeight: 600, minWidth: 36 }}>End</span>
                <input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                  style={inlineInputStyle}
                />
              </div>
            </div>
          </FieldRow>

          {/* Venue row */}
          <FieldRow icon={<MapPin size={18} strokeWidth={1.5} color={COLOR.ink3} />}>
            <input
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="Add Event Location"
              style={{ ...inlineInputStyle, flex: 1 }}
            />
          </FieldRow>

          {/* Description row */}
          <FieldRow icon={<AlignLeft size={18} strokeWidth={1.5} color={COLOR.ink3} />}>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add Description"
              rows={3}
              style={{
                ...inlineInputStyle,
                flex: 1,
                resize: "none",
                lineHeight: 1.6,
              }}
            />
          </FieldRow>

          {/* Tags */}
          <FieldRow icon={<Tag size={18} strokeWidth={1.5} color={COLOR.ink3} />}>
            <div className="flex flex-wrap gap-1.5 flex-1">
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
                      padding: "4px 10px",
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      background: on ? COLOR.navy : COLOR.bgSoft,
                      color: on ? "#fff" : COLOR.ink2,
                      border: "none",
                      fontFamily: FONT.sans,
                      cursor: "pointer",
                    }}
                  >
                    {it.label}
                  </button>
                );
              })}
            </div>
          </FieldRow>

          {/* Event Options (collapsible) */}
          <button
            onClick={() => setShowOptions(!showOptions)}
            className="flex items-center gap-2 w-full py-3"
            style={{
              background: "transparent",
              border: "none",
              borderTop: `1px solid ${COLOR.borderLight}`,
              cursor: "pointer",
              fontFamily: FONT.sans,
              fontSize: 14,
              fontWeight: 600,
              color: COLOR.ink,
            }}
          >
            <Eye size={18} strokeWidth={1.5} color={COLOR.ink3} />
            <span style={{ flex: 1, textAlign: "left" }}>Event Options</span>
            <ChevronDown
              size={16}
              color={COLOR.ink3}
              style={{ transform: showOptions ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
            />
          </button>
          {showOptions && (
            <div style={{ padding: "8px 0 16px 32px" }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: COLOR.ink3, fontFamily: FONT.sans, marginBottom: 8 }}>
                Who can see this?
              </p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { val: "all" as const, label: "Everyone" },
                    ...(user.section ? [{ val: "section" as const, label: sectionByCode(user.section)?.name ?? "My section" }] : []),
                    ...(user.section && user.ogsg ? [{ val: "ogsg" as const, label: "My OGSG" }] : []),
                    { val: "custom" as const, label: "Custom" },
                  ] as { val: typeof visibility; label: string }[]
                ).map(({ val, label }) => (
                  <button
                    key={val}
                    onClick={() => setVisibility(val)}
                    style={{
                      padding: "5px 12px",
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 600,
                      background: visibility === val ? COLOR.navy : COLOR.bgSoft,
                      color: visibility === val ? "#fff" : COLOR.ink2,
                      border: "none",
                      fontFamily: FONT.sans,
                      cursor: "pointer",
                    }}
                  >
                    {label}
                  </button>
                ))}
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
                        style={{
                          padding: "4px 10px",
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 600,
                          background: on ? COLOR.navy : COLOR.bgSoft,
                          color: on ? "#fff" : COLOR.ink2,
                          border: "none",
                          fontFamily: FONT.sans,
                          cursor: "pointer",
                        }}
                      >
                        {s.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Error */}
          {err && (
            <div
              style={{
                marginTop: 12,
                borderRadius: 10,
                padding: "10px 14px",
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

          {/* Mobile submit (desktop has it in top bar) */}
          <button
            onClick={handleSubmit}
            disabled={busy}
            className="md:hidden w-full mt-6"
            style={{
              padding: "14px 0",
              borderRadius: 12,
              fontSize: 15,
              fontWeight: 700,
              background: COLOR.ink,
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontFamily: FONT.sans,
              opacity: busy ? 0.6 : 1,
            }}
          >
            {busy ? (isEdit ? "Saving…" : "Creating…") : (isEdit ? "Save Changes" : "Create Event")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Inline field row (icon + content, Luma style) ─── */
function FieldRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div
      className="flex items-start gap-3 py-3"
      style={{ borderTop: `1px solid ${COLOR.borderLight}` }}
    >
      <div style={{ paddingTop: 2, flexShrink: 0 }}>{icon}</div>
      {children}
    </div>
  );
}

/* ─── Shared inline input style ─── */
const inlineInputStyle: React.CSSProperties = {
  width: "100%",
  padding: "4px 0",
  fontSize: 14,
  fontFamily: FONT.sans,
  color: COLOR.ink,
  background: "transparent",
  border: "none",
  outline: "none",
};

function toLocalDatetime(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch { return ""; }
}
