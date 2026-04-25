import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { User, Interest } from "../types";
import { INTERESTS } from "../types";
import { COLOR } from "../lib/pulseTheme";
import Logo from "../components/Logo";

type Props = {
  user: User;
  onComplete: (updates: Partial<User>) => void;
};

const SECTIONS = ["A", "B", "C", "D", "E", "F", "G", "H"];

export default function Onboarding({ user, onComplete }: Props) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState(user.name || "");
  const [section, setSection] = useState(user.section || "");
  const [campus, setCampus] = useState<"mohali" | "hyderabad">(user.campus || "mohali");
  const [interests, setInterests] = useState<Interest[]>(user.interests || []);

  function toggle(i: Interest) {
    setInterests((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
  }

  function finish() {
    onComplete({ name: name.trim(), section, campus, interests });
  }

  const canAdvance = [
    name.trim().length > 1,
    !!section,
    interests.length >= 2,
  ];

  return (
    <div
      className="min-h-screen flex items-start md:items-center justify-center px-5 py-10"
      style={{ background: COLOR.bg }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Logo height={28} />
          <span className="t-label">Step {step + 1} of 3</span>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="flex-1 h-1 rounded-full transition-colors duration-300"
              style={{
                background: i <= step ? COLOR.navy : COLOR.border,
              }}
            />
          ))}
        </div>

        <div className="card p-7 min-h-[360px] flex flex-col">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="s0"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                <h1 className="t-display mb-2" style={{ fontSize: 28 }}>
                  Let's set you up.
                </h1>
                <p className="t-body mb-6">
                  A few quick questions, and you're in.
                </p>

                <div className="mb-5">
                  <label className="t-label block mb-2">What do people call you?</label>
                  <input
                    autoFocus
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="First name is fine"
                    className="w-full px-4 py-3 text-[15px] rounded-[10px] border bg-white focus:outline-none focus:ring-2"
                    style={{
                      borderColor: COLOR.border,
                      color: COLOR.ink,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                    }}
                  />
                </div>

                <div>
                  <label className="t-label block mb-2">Which campus?</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: "mohali", label: "Mohali" },
                      { id: "hyderabad", label: "Hyderabad" },
                    ].map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setCampus(c.id as "mohali" | "hyderabad")}
                        className="chip"
                        data-active={campus === c.id}
                        style={{ padding: "10px 0", textAlign: "center" }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="s1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                <h1 className="t-display mb-2" style={{ fontSize: 28 }}>
                  Your <span className="t-italic">section</span>?
                </h1>
                <p className="t-body mb-6">
                  So we can show you what's happening close to home.
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {SECTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSection(s)}
                      className="chip font-serif"
                      data-active={section === s}
                      style={{
                        padding: "18px 0",
                        fontSize: 20,
                        fontWeight: 500,
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="s2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col"
              >
                <h1 className="t-display mb-2" style={{ fontSize: 28 }}>
                  What are you <span className="t-italic">into</span>?
                </h1>
                <p className="t-body mb-6">
                  Pick at least two — we'll surface the right sessions for you.
                </p>

                <div className="flex flex-wrap gap-2">
                  {INTERESTS.map((it) => (
                    <button
                      key={it.id}
                      onClick={() => toggle(it.id)}
                      className="chip"
                      data-active={interests.includes(it.id)}
                    >
                      {it.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer actions */}
          <div className="flex gap-2 mt-6 pt-5 border-t" style={{ borderColor: COLOR.borderLight }}>
            {step > 0 && (
              <button className="btn-ghost" onClick={() => setStep(step - 1)}>
                Back
              </button>
            )}
            {step < 2 && (
              <button
                className="btn-primary flex-1"
                disabled={!canAdvance[step]}
                onClick={() => setStep(step + 1)}
              >
                Continue
              </button>
            )}
            {step === 2 && (
              <button
                className="btn-primary flex-1"
                disabled={!canAdvance[2]}
                onClick={finish}
              >
                Enter Pulse
              </button>
            )}
          </div>
        </div>

        <p className="t-meta text-center mt-6">
          We only ask what we need. No public profile, no feeds.
        </p>
      </div>
    </div>
  );
}
