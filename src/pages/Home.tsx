import { useState } from "react";
import { MapPin, Utensils, Coffee, Mountain, Plus, X } from "lucide-react";
import type { User } from "../types";
import { COLOR, stripGradient } from "../lib/pulseTheme";
import { supabase } from "../lib/supabase";
import { tap } from "../lib/haptics";

type Props = { user: User; onGoingClick: () => void };

const CURATED = [
  {
    id: "1", name: "Pal Dhaba", category: "Food", strip: "#D4621A", tint: "#FFF2EA",
    icon: Utensils, meta: "12 min from campus · open till 3AM",
    desc: "Legendary late-night dhaba near Sector 70. The butter chicken is non-negotiable.",
    budget: "₹150 – 300", tag: "Budget", tagBg: "#E8F8EF", tagColor: "#1A7A4A",
  },
  {
    id: "2", name: "Nik Baker's · Elante", category: "Cafe", strip: "#8B5E24", tint: "#F7EFE4",
    icon: Coffee, meta: "20 min · good wifi · quiet corners",
    desc: "Where half your section ends up after lectures. Croissants are the move.",
    budget: "₹350 – 600", tag: "Mid", tagBg: "#FDF4E0", tagColor: "#8B5E00",
  },
  {
    id: "3", name: "Kasauli · weekend trip", category: "Travel", strip: "#1A7A4A", tint: "#E8F8EF",
    icon: Mountain, meta: "2.5 hr drive · day-trip worthy",
    desc: "The closest you'll get to a proper mountain reset without skipping a class.",
    budget: "₹1,200 – 3,000", tag: "Mid", tagBg: "#FDF4E0", tagColor: "#8B5E00",
  },
];

type SuggestForm = { name: string; category: string; area: string; desc: string; budget: string };
const EMPTY_FORM: SuggestForm = { name: "", category: "", area: "", desc: "", budget: "" };
const CATEGORIES = ["Food", "Cafe", "Nightlife", "Travel"];

export default function Home({ user }: Props) {
  const first = user.name?.split(" ")[0] || "there";
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<SuggestForm>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function set(key: keyof SuggestForm, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.category) return;
    setBusy(true);
    setErr(null);
    try {
      const { error } = await supabase.from("places").insert({
        name: form.name.trim(),
        category: form.category.toLowerCase(),
        area: form.area.trim() || undefined,
        description: form.desc.trim() || undefined,
        budget: "mid",
        added_by_user_id: user.id,
      });
      if (error) throw error;
      setDone(true);
      setForm(EMPTY_FORM);
      setTimeout(() => { setDone(false); setShowModal(false); }, 2000);
    } catch {
      setErr("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: COLOR.bg }}>
      <header className="px-5 md:px-8 pt-10 pb-6 max-w-2xl">
        <p className="t-label mb-2">Hey {first}</p>
        <h1 className="t-display mb-1" style={{ fontSize: 32 }}>
          Find <span className="t-italic">your spots.</span>
        </h1>
        <p className="t-body max-w-md">
          Places your cohort actually goes — filtered for distance, vibe, and budget.
        </p>
      </header>

      <main className="px-4 md:px-8 max-w-2xl space-y-3">
        {/* Curated editorial cards */}
        {CURATED.map((p) => {
          const Icon = p.icon;
          return (
            <article key={p.id} className="card card-hover">
              <div style={{ height: 2, background: stripGradient(p.strip, p.tint) }} />
              <div className="px-5 pt-4 pb-5">
                <p className="t-label mb-2" style={{ color: p.strip }}>{p.category} · Mohali</p>
                <h3 className="t-card-title mb-2 flex items-center gap-2">
                  <Icon size={16} strokeWidth={1.75} style={{ color: p.strip }} />
                  {p.name}
                </h3>
                <p className="t-body" style={{ fontSize: 13, marginBottom: 10 }}>{p.desc}</p>
                <div className="flex items-center gap-3 t-meta mb-3">
                  <MapPin size={13} strokeWidth={1.75} /> {p.meta}
                </div>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: `1px solid ${COLOR.divider}` }}>
                  <div>
                    <p className="t-label" style={{ marginBottom: 2 }}>Per person</p>
                    <p className="font-serif" style={{ fontSize: 16, color: COLOR.ink }}>{p.budget}</p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-md" style={{ background: p.tagBg, color: p.tagColor }}>
                    {p.tag}
                  </span>
                </div>
              </div>
            </article>
          );
        })}

        {/* Suggest a spot CTA */}
        <button
          className="card card-hover w-full px-5 py-5 flex items-center gap-3 text-left"
          onClick={() => { tap(); setShowModal(true); }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: COLOR.navyTint, color: COLOR.navy }}
          >
            <Plus size={16} strokeWidth={2} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: COLOR.ink, fontSize: 14 }}>Suggest a spot</p>
            <p className="t-meta" style={{ marginTop: 2 }}>Know somewhere good? Add it for your cohort.</p>
          </div>
        </button>

        <p className="t-meta text-center pt-2 italic">
          More spots curated weekly — seeded from cohort recommendations.
        </p>
      </main>

      {/* Suggest modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="w-full max-w-md rounded-[16px] p-6" style={{ background: COLOR.surface }}>
            <div className="flex items-center justify-between mb-5">
              <h2 className="t-heading" style={{ fontSize: 18 }}>Suggest a spot</h2>
              <button onClick={() => setShowModal(false)} style={{ color: COLOR.ink3 }}><X size={20} /></button>
            </div>

            {done ? (
              <div className="text-center py-4">
                <p className="t-heading mb-1" style={{ fontSize: 18, color: "#1A7A4A" }}>Thanks!</p>
                <p className="t-body">We'll add it to the list soon.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {err && (
                  <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "#FEF2F2", color: "#B91C1C" }}>{err}</p>
                )}
                <div>
                  <label className="t-label block mb-1.5">Name</label>
                  <input type="text" value={form.name} onChange={(e) => set("name", e.target.value)}
                    placeholder="e.g. Sector 26 Dhabas" required autoFocus
                    className="w-full px-4 py-3 rounded-[10px] text-sm focus:outline-none focus:ring-2"
                    style={{ border: `1px solid ${COLOR.border}`, background: COLOR.bg, color: COLOR.ink, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
                <div>
                  <label className="t-label block mb-2">Category</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map((c) => (
                      <button key={c} type="button" onClick={() => set("category", c)}
                        className="chip" data-active={form.category === c}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="t-label block mb-1.5">Area / distance <span style={{ color: COLOR.ink3 }}>(optional)</span></label>
                  <input type="text" value={form.area} onChange={(e) => set("area", e.target.value)}
                    placeholder="e.g. Sector 17, 25 min from campus"
                    className="w-full px-4 py-3 rounded-[10px] text-sm focus:outline-none focus:ring-2"
                    style={{ border: `1px solid ${COLOR.border}`, background: COLOR.bg, color: COLOR.ink, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
                <div>
                  <label className="t-label block mb-1.5">Why it's good <span style={{ color: COLOR.ink3 }}>(optional)</span></label>
                  <textarea value={form.desc} onChange={(e) => set("desc", e.target.value)}
                    placeholder="What makes it worth the trip?" rows={2}
                    className="w-full px-4 py-3 rounded-[10px] text-sm resize-none focus:outline-none focus:ring-2"
                    style={{ border: `1px solid ${COLOR.border}`, background: COLOR.bg, color: COLOR.ink, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                  />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                  <button type="submit" disabled={busy || !form.name.trim() || !form.category} className="btn-primary flex-1">
                    {busy ? "Submitting…" : "Submit spot"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
