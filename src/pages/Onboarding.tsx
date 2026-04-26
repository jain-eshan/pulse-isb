import { useState } from "react";
import type { User, Interest } from "../types";
import { INTERESTS } from "../types";
import { SECTIONS, type SectionCode } from "../lib/sections";
import { COLOR } from "../lib/pulseTheme";
import { tap } from "../lib/haptics";
import { ArrowRight, ArrowLeft } from "lucide-react";

type Props = { user: User; onComplete: (updates: Partial<User>) => void };

const FRIDAY_OPTIONS = ["Studying", "Club event", "Cohort dinner", "Party", "Sleeping already"];

export default function Onboarding({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [section, setSection] = useState<SectionCode | "">("");
  const [ogsg, setOgsg] = useState<number | null>(null);
  const [friday, setFriday] = useState<string>("");
  const [interests, setInterests] = useState<Interest[]>([]);
  const [chaotic, setChaotic] = useState("");

  const totalSteps = 5;

  function next() { tap(); setStep((s) => Math.min(s + 1, totalSteps - 1)); }
  function back() { tap(); setStep((s) => Math.max(s - 1, 0)); }

  function finish() {
    tap();
    onComplete({
      section: section || "",
      ogsg: ogsg ?? undefined,
      vibe_friday: friday || undefined,
      interests,
      chaotic_thing: chaotic.trim() || undefined,
      onboarded_at: new Date().toISOString(),
    } as Partial<User>);
  }

  return (
    <div className="min-h-screen px-5 md:px-8 py-10 max-w-xl mx-auto" style={{ background: COLOR.bg }}>
      <div className="flex items-center justify-between mb-8">
        <p className="t-meta">{step + 1} of {totalSteps}</p>
        {step > 0 && (
          <button onClick={back} className="t-meta flex items-center gap-1" style={{ color: COLOR.ink2 }}>
            <ArrowLeft size={13} /> Back
          </button>
        )}
      </div>

      {step === 0 && (
        <Screen title="Which house are you?" subtitle="Pick your section. Skip if you don't know yet.">
          <div className="grid grid-cols-2 gap-3">
            {SECTIONS.map((s) => (
              <button
                key={s.code}
                onClick={() => { tap(); setSection(s.code); }}
                className="rounded-[14px] p-5 text-left transition-transform"
                style={{
                  background: s.tint,
                  border: `2px solid ${section === s.code ? s.color : "transparent"}`,
                  transform: section === s.code ? "scale(1.02)" : "none",
                }}
              >
                <p className="font-serif" style={{ fontSize: 22, color: s.color }}>{s.name}</p>
                <p className="t-meta mt-1">Section {s.code}</p>
              </button>
            ))}
          </div>
          <SkipNext onSkip={() => { setSection(""); next(); }} onNext={next} />
        </Screen>
      )}

      {step === 1 && (
        <Screen title="OGSG?" subtitle="Your original study group inside the section.">
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                onClick={() => { tap(); setOgsg(n); }}
                className="chip"
                data-active={ogsg === n}
                style={{ padding: "12px 0" }}
              >
                {n}
              </button>
            ))}
          </div>
          <SkipNext onSkip={() => { setOgsg(null); next(); }} onNext={next} />
        </Screen>
      )}

      {step === 2 && (
        <Screen title="Friday at 9PM. What's your move?" subtitle="No wrong answer.">
          <div className="space-y-2">
            {FRIDAY_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => { tap(); setFriday(opt); }}
                className="w-full px-5 py-4 rounded-[12px] text-left transition-colors"
                style={{
                  background: friday === opt ? COLOR.navy : COLOR.surface,
                  color: friday === opt ? "#fff" : COLOR.ink,
                  border: `1px solid ${COLOR.border}`,
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          <SkipNext onSkip={() => { setFriday(""); next(); }} onNext={next} />
        </Screen>
      )}

      {step === 3 && (
        <Screen title="What would you actually show up for?" subtitle="Pick a few. We'll surface those.">
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((it) => {
              const on = interests.includes(it.id);
              return (
                <button
                  key={it.id}
                  onClick={() => {
                    tap();
                    setInterests((p) => on ? p.filter((x) => x !== it.id) : [...p, it.id]);
                  }}
                  className="chip"
                  data-active={on}
                >
                  {it.emoji} {it.label}
                </button>
              );
            })}
          </div>
          <SkipNext onSkip={() => { setInterests([]); next(); }} onNext={next} />
        </Screen>
      )}

      {step === 4 && (
        <Screen title="Most chaotic thing you've done at ISB?" subtitle="One line. Optional. Shown on your profile.">
          <textarea
            value={chaotic}
            onChange={(e) => setChaotic(e.target.value.slice(0, 80))}
            rows={3}
            placeholder="e.g. Showed up to FADM exam in pyjamas after an all-nighter"
            className="w-full px-4 py-3 rounded-[12px] focus:outline-none focus:ring-2"
            style={{
              border: `1px solid ${COLOR.border}`,
              background: COLOR.surface,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14,
            }}
          />
          <p className="t-meta mt-1">{chaotic.length}/80</p>
          <button onClick={finish} className="btn-primary w-full mt-6 flex items-center justify-center gap-2">
            Let's go <ArrowRight size={16} />
          </button>
        </Screen>
      )}
    </div>
  );
}

function Screen({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-5">
      <div>
        <h1 className="t-display" style={{ fontSize: 30 }}>{title}</h1>
        {subtitle && <p className="t-body mt-2">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function SkipNext({ onSkip, onNext }: { onSkip: () => void; onNext: () => void }) {
  return (
    <div className="flex gap-2 mt-6">
      <button onClick={onSkip} className="btn-ghost flex-1">Skip</button>
      <button onClick={onNext} className="btn-primary flex-1 flex items-center justify-center gap-2">
        Next <ArrowRight size={14} />
      </button>
    </div>
  );
}
