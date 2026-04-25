import { useState } from "react";
import { ChevronUp, Lightbulb, Plus, X } from "lucide-react";
import type { User } from "../types";
import { INTERESTS } from "../types";
import { COLOR } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";
import { usePulse } from "../hooks/usePulse";

type Props = { user: User };

const TAGS = INTERESTS.map((i) => ({ id: i.id, label: i.label }));

export default function PulsePage({ user }: Props) {
  const { items, loading, toggleVote, suggest } = usePulse(user);
  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [tag, setTag] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleSuggest(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await suggest(title, desc, tag);
      setTitle(""); setDesc(""); setTag("");
      setShowModal(false);
    } catch {
      setErr("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen pb-28" style={{ background: COLOR.bg }}>
      <header className="px-5 md:px-8 pt-10 pb-6 max-w-2xl">
        <p className="t-label mb-2">Wishlist</p>
        <h1 className="t-display mb-1" style={{ fontSize: 32 }}>
          What should <span className="t-italic">actually</span> happen here?
        </h1>
        <p className="t-body max-w-md">
          The ideas your cohort keeps half-saying in the corridor. Upvote the ones you'd show up to.
        </p>
      </header>

      <main className="px-4 md:px-8 max-w-2xl space-y-3">
        {/* Skeleton */}
        {loading && [0, 1, 2].map((i) => (
          <div key={i} className="card animate-pulse flex h-24">
            <div className="w-[72px] border-r" style={{ borderColor: COLOR.divider }} />
            <div className="flex-1 p-4 space-y-2">
              <div className="h-3 w-16 rounded-full" style={{ background: COLOR.borderLight }} />
              <div className="h-4 w-2/3 rounded" style={{ background: COLOR.borderLight }} />
              <div className="h-3 w-full rounded-full" style={{ background: COLOR.borderLight }} />
            </div>
          </div>
        ))}

        {/* Empty state */}
        {!loading && items.length === 0 && (
          <div className="card p-8 text-center">
            <Lightbulb size={32} strokeWidth={1.5} className="mx-auto mb-3" style={{ color: COLOR.ink3 }} />
            <p className="t-heading mb-1" style={{ fontSize: 18 }}>No ideas yet</p>
            <p className="t-body" style={{ color: COLOR.ink2 }}>
              Be the first to suggest something your cohort should do.
            </p>
          </div>
        )}

        {/* Items */}
        {items.map((item) => (
          <article key={item.id} className="card">
            <div className="flex items-stretch">
              <button
                onClick={() => { tap(); toggleVote(item.id, item.my_vote); }}
                className="flex flex-col items-center justify-center px-4 py-4 border-r transition-colors"
                style={{
                  borderColor: COLOR.divider,
                  background: item.my_vote ? COLOR.navyTint : "transparent",
                  minWidth: 72,
                  color: item.my_vote ? COLOR.navy : COLOR.ink2,
                }}
              >
                <ChevronUp size={20} strokeWidth={2} />
                <span className="font-serif text-lg mt-0.5">{item.vote_count}</span>
              </button>
              <div className="flex-1 px-5 py-4">
                {item.tags[0] && (
                  <p className="t-label mb-1.5" style={{ color: COLOR.navy }}>
                    {INTERESTS.find((i) => i.id === item.tags[0])?.label ?? item.tags[0]}
                  </p>
                )}
                <h3 className="t-card-title mb-1.5">{item.title}</h3>
                {item.description && (
                  <p className="t-body" style={{ fontSize: 13 }}>{item.description}</p>
                )}
              </div>
            </div>
          </article>
        ))}

        {/* Suggest CTA */}
        <button
          className="card card-hover w-full px-5 py-5 flex items-center gap-3 text-left"
          onClick={() => { tap(); setShowModal(true); }}
        >
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: COLOR.amberTint, color: COLOR.amber }}
          >
            <Plus size={16} strokeWidth={2} />
          </div>
          <div>
            <p className="font-semibold" style={{ color: COLOR.ink, fontSize: 14 }}>Suggest an idea</p>
            <p className="t-meta" style={{ marginTop: 2 }}>Short and specific — one line is plenty.</p>
          </div>
          <span className="flex-1" />
          <Lightbulb size={18} strokeWidth={1.5} style={{ color: COLOR.ink3 }} />
        </button>
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
              <h2 className="t-heading" style={{ fontSize: 18 }}>Suggest an idea</h2>
              <button onClick={() => setShowModal(false)} style={{ color: COLOR.ink3 }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSuggest} className="space-y-4">
              {err && (
                <p className="text-sm px-3 py-2 rounded-lg" style={{ background: "#FEF2F2", color: "#B91C1C" }}>{err}</p>
              )}
              <div>
                <label className="t-label block mb-1.5">What's the idea?</label>
                <input
                  type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. AMA with a VC partner" required autoFocus maxLength={120}
                  className="w-full px-4 py-3 rounded-[10px] text-sm focus:outline-none focus:ring-2"
                  style={{ border: `1px solid ${COLOR.border}`, background: COLOR.bg, color: COLOR.ink, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </div>
              <div>
                <label className="t-label block mb-1.5">
                  More detail <span style={{ color: COLOR.ink3 }}>(optional)</span>
                </label>
                <textarea
                  value={desc} onChange={(e) => setDesc(e.target.value)}
                  placeholder="Who's it for? What would make it great?" rows={3}
                  className="w-full px-4 py-3 rounded-[10px] text-sm resize-none focus:outline-none focus:ring-2"
                  style={{ border: `1px solid ${COLOR.border}`, background: COLOR.bg, color: COLOR.ink, fontFamily: "'Plus Jakarta Sans', sans-serif" }}
                />
              </div>
              <div>
                <label className="t-label block mb-2">
                  Category <span style={{ color: COLOR.ink3 }}>(optional)</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map((t) => (
                    <button key={t.id} type="button" onClick={() => setTag(tag === t.id ? "" : t.id)}
                      className="chip" data-active={tag === t.id}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-ghost">Cancel</button>
                <button type="submit" disabled={busy || !title.trim()} className="btn-primary flex-1">
                  {busy ? "Posting…" : "Post idea"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
