import { useState } from "react";
import type { VibeTag, User } from "../types";
import { getPersona } from "../lib/vibe";
import { Check, ArrowRight, ArrowLeft } from "lucide-react";

const VIBE_OPTIONS: { tag: VibeTag; desc: string }[] = [
  { tag: "Party Animal", desc: "Live for the night" },
  { tag: "Foodie", desc: "Eat everything, regret nothing" },
  { tag: "Explorer", desc: "Find the road less travelled" },
  { tag: "Chill", desc: "Good vibes, low effort" },
  { tag: "Budget Backpacker", desc: "Maximize fun, minimize spend" },
  { tag: "Luxury Seeker", desc: "Only the best will do" },
  { tag: "Night Owl", desc: "The night is young" },
  { tag: "Culture Vulture", desc: "Art, history, hidden gems" },
];

const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H"];

interface OnboardingProps {
  user: User;
  onComplete: (updates: Partial<User>) => void;
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [step, setStep] = useState(0);
  const [section, setSection] = useState("");
  const [cohortYear] = useState(new Date().getFullYear());
  const [vibeTags, setVibeTags] = useState<VibeTag[]>([]);
  const [budgetMin, setBudgetMin] = useState(500);
  const [budgetMax, setBudgetMax] = useState(3000);

  function toggleVibe(tag: VibeTag) {
    setVibeTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function handleComplete() {
    onComplete({
      section,
      cohort_year: cohortYear,
      vibe_tags: vibeTags,
      budget_min: budgetMin,
      budget_max: budgetMax,
    });
  }

  const persona = getPersona(vibeTags);
  const stepLabel = ["Section", "Vibe", "Budget"][step];

  return (
    <div className="min-h-screen bg-linen flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-lg bg-surface border border-line-light rounded-lg shadow-card p-7 sm:p-10">
        <div className="flex items-center gap-2 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i < step ? "bg-navy" : i === step ? "bg-amber" : "bg-line-light"
              }`}
            />
          ))}
        </div>

        <p className="text-xs font-bold text-ink-3 uppercase tracking-[0.1em] mb-3">
          Step {step + 1} of 3 · {stepLabel}
        </p>

        {step === 0 && (
          <div>
            <h2 className="font-serif text-[32px] leading-[1.1] text-ink mb-2">Pick your section.</h2>
            <p className="text-ink-2 text-sm mb-8 leading-relaxed">
              Cohort {cohortYear}. We use this to surface batchmates going to the same places.
            </p>

            <div className="grid grid-cols-4 gap-2 mb-10">
              {SECTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSection(s)}
                  className={`py-3 rounded-md border font-serif text-[18px] transition-colors ${
                    section === s
                      ? "bg-navy text-white border-navy shadow-navy"
                      : "bg-surface text-ink border-line hover:border-navy"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <button
              onClick={() => setStep(1)}
              disabled={!section}
              className="inline-flex items-center gap-2 bg-navy text-white text-[13px] font-semibold rounded-md px-5 py-3 shadow-navy hover:bg-navy-deep transition-colors disabled:bg-line disabled:text-ink-3 disabled:shadow-none disabled:cursor-not-allowed"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {step === 1 && (
          <div>
            <h2 className="font-serif text-[32px] leading-[1.1] text-ink mb-2">What's your <em className="text-navy">vibe</em>?</h2>
            <p className="text-ink-2 text-sm mb-8 leading-relaxed">Pick all that apply. Shapes your recommendations.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-6">
              {VIBE_OPTIONS.map(({ tag, desc }) => {
                const selected = vibeTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleVibe(tag)}
                    className={`text-left px-4 py-3 rounded-md border transition-colors ${
                      selected ? "border-navy bg-navy-tint" : "border-line-light bg-surface hover:border-navy"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink">{tag}</span>
                      {selected && <Check className="w-4 h-4 text-navy" />}
                    </div>
                    <p className="text-xs text-ink-3 mt-0.5">{desc}</p>
                  </button>
                );
              })}
            </div>

            {vibeTags.length > 0 && (
              <div
                className="rounded-md bg-surface border border-line-light px-4 py-3 mb-8 relative overflow-hidden"
                style={{ borderLeft: `3px solid ${persona.color ?? "#1C3A6E"}` }}
              >
                <p className="text-[10px] font-bold text-ink-3 uppercase tracking-[0.1em]">Your persona</p>
                <p className="font-serif text-[17px] text-ink mt-0.5">{persona.persona}</p>
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(0)}
                className="inline-flex items-center gap-2 text-ink-2 text-[13px] font-semibold rounded-md px-4 py-3 bg-linen border border-line hover:border-navy transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={vibeTags.length === 0}
                className="inline-flex items-center gap-2 bg-navy text-white text-[13px] font-semibold rounded-md px-5 py-3 shadow-navy hover:bg-navy-deep transition-colors disabled:bg-line disabled:text-ink-3 disabled:shadow-none"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="font-serif text-[32px] leading-[1.1] text-ink mb-2">Budget per outing.</h2>
            <p className="text-ink-2 text-sm mb-10 leading-relaxed">We'll filter spots within your comfort zone.</p>

            <div className="space-y-8 mb-10">
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-[10px] font-bold text-ink-3 uppercase tracking-[0.1em]">Minimum</span>
                  <span className="font-serif text-[17px] text-ink tabular-nums">₹{budgetMin.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={5000}
                  step={100}
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(Number(e.target.value))}
                  className="w-full accent-navy"
                />
              </div>
              <div>
                <div className="flex items-baseline justify-between mb-3">
                  <span className="text-[10px] font-bold text-ink-3 uppercase tracking-[0.1em]">Maximum</span>
                  <span className="font-serif text-[17px] text-ink tabular-nums">₹{budgetMax.toLocaleString()}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={15000}
                  step={500}
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(Number(e.target.value))}
                  className="w-full accent-navy"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-2 text-ink-2 text-[13px] font-semibold rounded-md px-4 py-3 bg-linen border border-line hover:border-navy transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleComplete}
                className="inline-flex items-center gap-2 bg-navy text-white text-[13px] font-semibold rounded-md px-5 py-3 shadow-navy hover:bg-navy-deep transition-colors"
              >
                Finish setup <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
