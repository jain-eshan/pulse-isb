/**
 * AdminPage — Manage Discover listings (places)
 * Only visible if user.is_admin = true.
 * Add / edit / delete places from a simple form.
 */
import { useState, useRef } from "react";
import { Plus, Trash2, Edit3, X, Check, MapPin, Upload, ImageIcon } from "lucide-react";
import { supabase } from "../lib/supabase";
import { usePlaces, type DBPlace } from "../hooks/usePlaces";
import type { User } from "../types";
import { COLOR, FONT } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";

interface Props { user: User; }

const CATEGORIES = ["food", "cafe", "nightlife", "travel"];
const BUDGETS: { value: "low" | "mid" | "high"; label: string }[] = [
  { value: "low", label: "Budget" },
  { value: "mid", label: "Mid-range" },
  { value: "high", label: "Premium" },
];

const EMPTY_FORM = {
  name: "",
  category: "food",
  area: "",
  description: "",
  budget: "low" as "low" | "mid" | "high",
  google_maps_url: "",
  image_url: "",
  google_rating: "",
  review_count: "",
  distance_from_campus: "",
};

export default function AdminPage({ user: _user }: Props) {
  const { places, loading } = usePlaces();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  function openNew() {
    tap();
    setEditId(null);
    setForm({ ...EMPTY_FORM });
    setCoverFile(null);
    setCoverPreview(null);
    setShowForm(true);
  }

  function openEdit(p: DBPlace) {
    tap();
    setEditId(p.id);
    setForm({
      name: p.name,
      category: p.category,
      area: p.area ?? "",
      description: p.description ?? "",
      budget: p.budget,
      google_maps_url: p.google_maps_url ?? "",
      image_url: p.image_url ?? "",
      google_rating: p.google_rating ? String(p.google_rating) : "",
      review_count: p.review_count ? String(p.review_count) : "",
      distance_from_campus: p.distance_from_campus ?? "",
    });
    setCoverFile(null);
    setCoverPreview(p.image_url ?? null);
    setShowForm(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  async function uploadCoverImage(): Promise<string | null> {
    if (!coverFile) return form.image_url || null;
    setUploading(true);
    const ext = coverFile.name.split(".").pop() ?? "jpg";
    const path = `place-covers/${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from("session-covers")
      .upload(path, coverFile, { upsert: true });
    setUploading(false);
    if (error) {
      setMsg({ type: "err", text: `Image upload failed: ${error.message}` });
      return null;
    }
    const { data } = supabase.storage.from("session-covers").getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleSave() {
    if (!form.name.trim()) { setMsg({ type: "err", text: "Name is required" }); return; }
    tap();
    setSaving(true);
    setMsg(null);
    try {
      const image_url = await uploadCoverImage();
      const payload = {
        name: form.name.trim(),
        category: form.category,
        area: form.area.trim() || null,
        description: form.description.trim() || null,
        budget: form.budget,
        google_maps_url: form.google_maps_url.trim() || null,
        image_url,
        google_rating: form.google_rating ? parseFloat(form.google_rating) : null,
        review_count: form.review_count ? parseInt(form.review_count) : null,
        distance_from_campus: form.distance_from_campus.trim() || null,
      };

      if (editId) {
        const { error } = await supabase.from("places").update(payload).eq("id", editId);
        if (error) throw error;
        setMsg({ type: "ok", text: "Updated successfully" });
      } else {
        const { error } = await supabase.from("places").insert(payload);
        if (error) throw error;
        setMsg({ type: "ok", text: "Place added" });
      }
      setShowForm(false);
      // Reload
      window.location.reload();
    } catch (e: unknown) {
      setMsg({ type: "err", text: e instanceof Error ? e.message : "Unknown error" });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this place?")) return;
    tap();
    setDeleting(id);
    await supabase.from("places").delete().eq("id", id);
    setDeleting(null);
    window.location.reload();
  }

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="min-h-screen pb-20" style={{ background: COLOR.bg }}>
      {/* Header */}
      <header className="px-5 md:px-8 pt-16 md:pt-10 pb-4 border-b" style={{ borderColor: COLOR.borderLight, maxWidth: 900 }}>
        <div className="flex items-center justify-between">
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: FONT.sans }}>
              Admin
            </p>
            <h1 style={{ fontFamily: FONT.serif, fontSize: 26, fontWeight: 500, color: COLOR.ink, marginTop: 2 }}>
              Discover <em>listings</em>
            </h1>
          </div>
          <button
            onClick={openNew}
            style={{ display: "flex", alignItems: "center", gap: 6, padding: "9px 18px", borderRadius: 10, background: COLOR.ink, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, fontFamily: FONT.sans, cursor: "pointer" }}
          >
            <Plus size={15} strokeWidth={2.5} /> Add Place
          </button>
        </div>
      </header>

      <main className="px-5 md:px-8 pt-5" style={{ maxWidth: 900 }}>
        {loading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} style={{ height: 72, borderRadius: 12, background: COLOR.bgSoft, animation: "pulse 1.5s infinite" }} />
            ))}
          </div>
        )}

        {!loading && (
          <div className="space-y-2">
            {places.map((p) => (
              <div
                key={p.id}
                style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px", borderRadius: 12, background: COLOR.surface, border: `1px solid ${COLOR.borderLight}` }}
              >
                {/* Thumb */}
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    flexShrink: 0,
                    background: p.image_url ? `url(${p.image_url}) center/cover` : COLOR.bgSoft,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {!p.image_url && <MapPin size={18} color={COLOR.ink3} strokeWidth={1.5} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: COLOR.ink, fontFamily: FONT.sans }}>{p.name}</p>
                  <p style={{ fontSize: 12, color: COLOR.ink3, fontFamily: FONT.sans, textTransform: "capitalize" }}>
                    {p.category} · {p.area ?? "—"} · {p.budget}
                    {p.google_rating && ` · ★ ${p.google_rating}`}
                  </p>
                </div>

                <button
                  onClick={() => openEdit(p)}
                  style={{ width: 34, height: 34, borderRadius: 8, border: `1px solid ${COLOR.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Edit3 size={14} color={COLOR.ink2} />
                </button>
                <button
                  onClick={() => handleDelete(p.id)}
                  disabled={deleting === p.id}
                  style={{ width: 34, height: 34, borderRadius: 8, border: "1px solid #FECACA", background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <Trash2 size={14} color="#DC2626" />
                </button>
              </div>
            ))}
            {places.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: COLOR.ink3, fontFamily: FONT.sans }}>
                <MapPin size={28} strokeWidth={1.5} style={{ margin: "0 auto 8px", opacity: 0.3 }} />
                <p style={{ fontSize: 14, fontWeight: 600 }}>No places yet</p>
                <p style={{ fontSize: 12, marginTop: 4 }}>Click "Add Place" to create the first listing.</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add/Edit form drawer */}
      {showForm && (
        <div style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div onClick={() => setShowForm(false)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)" }} />
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              width: "min(480px, 100%)",
              background: COLOR.bg,
              boxShadow: "-8px 0 32px rgba(0,0,0,0.12)",
              display: "flex",
              flexDirection: "column",
              animation: "slideInRight 0.25s ease",
            }}
          >
            {/* Drawer header */}
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${COLOR.borderLight}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <h2 style={{ fontFamily: FONT.serif, fontSize: 20, fontWeight: 500, color: COLOR.ink }}>
                {editId ? "Edit Place" : "Add Place"}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${COLOR.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <X size={16} color={COLOR.ink2} />
              </button>
            </div>

            {/* Form body */}
            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {msg && (
                <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: msg.type === "ok" ? "#ECFDF5" : "#FEF2F2", color: msg.type === "ok" ? "#059669" : "#DC2626", fontSize: 13, fontFamily: FONT.sans, border: `1px solid ${msg.type === "ok" ? "#86EFAC" : "#FECACA"}` }}>
                  {msg.text}
                </div>
              )}

              <FormField label="Name *">
                <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Pal Dhaba" />
              </FormField>

              <FormField label="Category">
                <div className="flex gap-2 flex-wrap">
                  {CATEGORIES.map((c) => (
                    <button key={c} onClick={() => set("category", c)} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, fontFamily: FONT.sans, cursor: "pointer", border: "none", background: form.category === c ? COLOR.ink : COLOR.bgSoft, color: form.category === c ? "#fff" : COLOR.ink2, textTransform: "capitalize" }}>
                      {c}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Budget">
                <div className="flex gap-2">
                  {BUDGETS.map((b) => (
                    <button key={b.value} onClick={() => set("budget", b.value)} style={{ padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600, fontFamily: FONT.sans, cursor: "pointer", border: "none", background: form.budget === b.value ? COLOR.ink : COLOR.bgSoft, color: form.budget === b.value ? "#fff" : COLOR.ink2 }}>
                      {b.label}
                    </button>
                  ))}
                </div>
              </FormField>

              <FormField label="Area / Neighbourhood">
                <input style={inputStyle} value={form.area} onChange={(e) => set("area", e.target.value)} placeholder="e.g. Sector 60, SAS Nagar" />
              </FormField>

              <FormField label="Distance from campus">
                <input style={inputStyle} value={form.distance_from_campus} onChange={(e) => set("distance_from_campus", e.target.value)} placeholder="e.g. 10 min drive" />
              </FormField>

              <FormField label="Description">
                <textarea style={{ ...inputStyle, resize: "none", lineHeight: 1.6 }} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Short punchy description..." />
              </FormField>

              <FormField label="Google Maps URL">
                <input style={inputStyle} value={form.google_maps_url} onChange={(e) => set("google_maps_url", e.target.value)} placeholder="https://maps.app.goo.gl/..." />
              </FormField>

              <FormField label="Cover Image">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                {coverPreview ? (
                  <div style={{ position: "relative", borderRadius: 10, overflow: "hidden", height: 140 }}>
                    <img src={coverPreview} alt="Cover preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button
                      type="button"
                      onClick={() => { setCoverFile(null); setCoverPreview(null); set("image_url", ""); }}
                      style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <X size={12} /> Remove
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      style={{ position: "absolute", bottom: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: 6, padding: "4px 8px", color: "#fff", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}
                    >
                      <Upload size={12} /> Change
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    style={{ ...inputStyle, height: 80, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer", background: COLOR.bgSoft, border: `1.5px dashed ${COLOR.border}`, color: COLOR.ink2 }}
                  >
                    <ImageIcon size={20} strokeWidth={1.5} />
                    <span style={{ fontSize: 13, fontFamily: FONT.sans }}>Tap to upload image</span>
                  </button>
                )}
              </FormField>

              <div className="flex gap-3">
                <FormField label="Google Rating" style={{ flex: 1 }}>
                  <input style={inputStyle} type="number" step="0.1" min="1" max="5" value={form.google_rating} onChange={(e) => set("google_rating", e.target.value)} placeholder="4.2" />
                </FormField>
                <FormField label="Review Count" style={{ flex: 1 }}>
                  <input style={inputStyle} type="number" min="0" value={form.review_count} onChange={(e) => set("review_count", e.target.value)} placeholder="120" />
                </FormField>
              </div>
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 20px", borderTop: `1px solid ${COLOR.borderLight}`, flexShrink: 0 }}>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{ width: "100%", padding: "13px", borderRadius: 11, background: COLOR.ink, color: "#fff", border: "none", fontSize: 14, fontWeight: 700, fontFamily: FONT.sans, cursor: "pointer", opacity: saving ? 0.6 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
              >
                <Check size={16} /> {uploading ? "Uploading image…" : saving ? "Saving…" : (editId ? "Save Changes" : "Add Place")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FormField({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ marginBottom: 16, ...style }}>
      <p style={{ fontSize: 11, fontWeight: 700, color: COLOR.ink3, fontFamily: FONT.sans, textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 6 }}>
        {label}
      </p>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 9,
  border: `1px solid ${COLOR.border}`,
  fontSize: 13,
  fontFamily: FONT.sans,
  color: COLOR.ink,
  background: COLOR.surface,
  outline: "none",
};
