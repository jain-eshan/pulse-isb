import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { User, Interest } from "../types";
import { INTERESTS } from "../types";
import { HERO_GRADIENT, CTA_GRADIENT } from "../lib/pulseTheme";

type Props = {
  user: User;
  onComplete: (updates: Partial<User>) => void | Promise<void>;
};

const SECTIONS = ["A","B","C","D","E","F","G","H"] as const;

export default function Onboarding({ user, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [section, setSection] = useState(user.section || "");
  const [campus, setCampus] = useState<User["campus"]>(user.campus || "mohali");
  const [interests, setInterests] = useState<Interest[]>(user.interests || []);

  const stepCount = 3;
  const canNext =
    (step === 0 && !!section && !!campus) ||
    (step === 1 && interests.length >= 1) ||
    step === 2;

  async function handleFinish() {
    await onComplete({ section, campus, interests });
  }

  return (
    <div
      className="min-h-screen w-full flex flex-col text-white"
      style={{ background: HERO_GRADIENT }}
    >
      <header className="px-6 pt-12 pb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center text-lg">
          ⚡
        </div>
        <p className="font-bold text-lg tracking-tight">Pulse</p>
        <div className="ml-auto flex gap-1.5">
          {Array.from({ length: stepCount }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i <= step ? "bg-white w-6" : "bg-white/30 w-3"
              }`}
            />
          ))}
        </div>
      </header>

      <main className="flex-1 px-6 pb-24 max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="s0"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-3xl font-bold leading-tight mb-2 mt-4">
                Welcome, {user.name.split(" ")[0]} 👋
              </h1>
              <p className="text-white/70 mb-8">First up — who are you?</p>

              <p className="text-xs uppercase tracking-wider text-white/50 mb-3">Campus</p>
              <div className="grid grid-cols-2 gap-3 mb-8">
                {(["mohali", "hyderabad"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCampus(c)}
                    className={`py-4 rounded-2xl border text-left px-4 transition-all ${
                      campus === c
                        ? "bg-white/20 border-white/40 scale-105"
                        : "bg-white/5 border-white/10"
                    }`}
                  >
                    <p className="font-semibold capitalize">{c}</p>
                    <p className="text-xs text-white/60 mt-0.5">
                      {c === "mohali" ? "🏔️ North Campus" : "🏙️ South Campus"}
                    </p>
                  </button>
                ))}
              </div>

              <p className="text-xs uppercase tracking-wider text-white/50 mb-3">Section</p>
              <div className="grid grid-cols-4 gap-2.5">
                {SECTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSection(s)}
                    className={`py-4 rounded-2xl font-bold text-lg border transition-all ${
                      section === s
                        ? "bg-white text-[#16213e] border-white scale-105 shadow-lg"
                        : "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="s1"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-3xl font-bold leading-tight mb-2 mt-4">
                What do you nerd out on?
              </h1>
              <p className="text-white/70 mb-8">
                Pick at least one. We'll tailor your Sessions feed.
              </p>

              <div className="grid grid-cols-2 gap-3">
                {INTERESTS.map((it) => {
                  const on = interests.includes(it.id);
                  return (
                    <button
                      key={it.id}
                      onClick={() =>
                        setInterests((prev) =>
                          prev.includes(it.id)
                            ? prev.filter((x) => x !== it.id)
                            : [...prev, it.id]
                        )
                      }
                      className={`py-6 rounded-2xl border text-left px-5 transition-all ${
                        on
                          ? "bg-white/20 border-white/40 scale-105"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                      }`}
                    >
                      <div className="text-2xl mb-1">{it.emoji}</div>
                      <p className="font-semibold">{it.label}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="s2"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              <h1 className="text-3xl font-bold leading-tight mb-2 mt-4">
                You're in. 🎉
              </h1>
              <p className="text-white/70 mb-8">
                Pulse turns your WhatsApp chaos into a single, organised feed.
              </p>
              <div className="space-y-3">
                <Feature emoji="📅" title="This week's sessions" desc="P2Ps, AMAs, workshops — one tap to RSVP." />
                <Feature emoji="💡" title="Pulse wishlist" desc="Request a session. Upvote what others want." />
                <Feature emoji="🗺️" title="Discover" desc="Food, cafes, trips — curated by your cohort." />
                <Feature emoji="🤖" title="WhatsApp, smarter" desc="Link WhatsApp for 1-tap RSVPs from any group." />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="sticky bottom-0 px-6 py-5 backdrop-blur-xl bg-black/20 border-t border-white/10">
        <div className="max-w-md mx-auto flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="px-5 py-3 rounded-2xl bg-white/10 font-semibold hover:bg-white/20 transition-all"
            >
              Back
            </button>
          )}
          {step < 2 ? (
            <button
              disabled={!canNext}
              onClick={() => setStep(step + 1)}
              className="flex-1 py-3 rounded-2xl font-semibold text-white disabled:opacity-40 transition-all"
              style={{ background: CTA_GRADIENT }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex-1 py-3 rounded-2xl font-semibold text-white transition-all"
              style={{ background: CTA_GRADIENT }}
            >
              Enter Pulse 🚀
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function Feature({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex gap-3 p-4 rounded-2xl bg-white/5 border border-white/10">
      <div className="text-2xl flex-shrink-0">{emoji}</div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-white/60">{desc}</p>
      </div>
    </div>
  );
}
