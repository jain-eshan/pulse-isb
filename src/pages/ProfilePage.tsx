import type { User } from "../types";
import { getPersona, getVibeScore } from "../lib/vibe";

interface ProfilePageProps {
  user: User;
  onSignOut: () => void;
  onToggleLocation: (enabled: boolean) => void;
}

export default function ProfilePage({ user, onSignOut, onToggleLocation }: ProfilePageProps) {
  const persona = getPersona(user.vibe_tags);
  const score = getVibeScore(user.vibe_tags);

  return (
    <div className="px-5 lg:px-10 py-7 lg:py-10 max-w-3xl mx-auto">
      <header className="mb-8 flex items-center gap-5">
        <div className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center font-serif text-[22px] shadow-navy">
          {user.name[0]}
        </div>
        <div>
          <h1 className="font-serif text-[26px] lg:text-[32px] leading-tight text-ink">{user.name}</h1>
          <p className="text-sm text-ink-3">{user.email}</p>
        </div>
      </header>

      <div
        className="relative overflow-hidden bg-surface border border-line-light rounded-lg px-5 py-4 mb-8 shadow-card"
        style={{ borderLeft: `3px solid ${persona.color}` }}
      >
        <p className="text-[10px] font-bold text-ink-3 uppercase tracking-[0.1em]">Your persona</p>
        <p className="font-serif text-[22px] text-ink mt-1">{persona.persona}</p>
        <p className="text-[11px] text-ink-3 italic mt-0.5">Vibe score · <span className="tabular-nums not-italic font-semibold text-ink-2">{score}</span></p>
      </div>

      <Row label="Section" value={`Section ${user.section}`} />
      <Row label="Cohort" value={String(user.cohort_year)} />
      <Row label="Budget" value={<span className="tabular-nums">₹{user.budget_min.toLocaleString()} – ₹{user.budget_max.toLocaleString()}</span>} />

      <section className="py-5 border-b border-line-light">
        <p className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.1em] mb-3">Vibe tags</p>
        {user.vibe_tags.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {user.vibe_tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-semibold px-2.5 py-1 rounded-sm bg-amber-tint border border-amber/30 text-amber"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-3">No vibe tags set</p>
        )}
      </section>

      <section className="py-5 border-b border-line-light flex items-center justify-between gap-6">
        <div>
          <p className="text-sm font-semibold text-ink">Location sharing</p>
          <p className="text-xs text-ink-3 mt-1 max-w-md leading-relaxed">
            {user.location_sharing ? "You're contributing to the campus density map." : "Hidden from the campus density map."} Only anonymous density is visible — never names.
          </p>
        </div>
        <button
          onClick={() => onToggleLocation(!user.location_sharing)}
          className="flex-shrink-0"
          aria-label="Toggle location sharing"
        >
          <div className={`w-10 h-6 rounded-full relative transition-colors ${user.location_sharing ? "bg-green-500" : "bg-line"}`}>
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${user.location_sharing ? "left-[18px]" : "left-0.5"}`} />
          </div>
        </button>
      </section>

      <div className="pt-8">
        <button
          onClick={onSignOut}
          className="text-[13px] font-semibold text-red-600 bg-surface border-[1.5px] border-red-200 rounded-md px-4 py-2.5 hover:border-red-400 transition-colors"
        >
          Sign out
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="py-4 border-b border-line-light flex items-center justify-between gap-4">
      <span className="text-[11px] font-bold text-ink-3 uppercase tracking-[0.1em]">{label}</span>
      <span className="text-sm font-semibold text-ink text-right">{value}</span>
    </div>
  );
}
