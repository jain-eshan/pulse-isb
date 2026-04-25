import { useState } from "react";
import { Mail, ArrowRight, CheckCircle2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import Logo from "../components/Logo";
import { COLOR } from "../lib/pulseTheme";

export default function Login() {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err = await sendMagicLink(email);
    if (err) {
      setError(err);
      setBusy(false);
    } else {
      setSent(true);
      setBusy(false);
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-5"
      style={{ background: COLOR.bg }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <Logo height={36} />
        </div>

        {sent ? (
          <div className="text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: COLOR.navyTint }}
            >
              <CheckCircle2 size={28} style={{ color: COLOR.navy }} />
            </div>
            <h1 className="t-heading mb-2" style={{ fontSize: 22 }}>Check your inbox</h1>
            <p className="t-body" style={{ color: COLOR.ink2 }}>
              We sent a login link to{" "}
              <strong style={{ color: COLOR.ink }}>{email}</strong>.
              Click it to sign in — no password needed.
            </p>
            <button
              className="t-meta mt-6 hover:opacity-70"
              style={{ color: COLOR.ink3 }}
              onClick={() => { setSent(false); setEmail(""); }}
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <h1 className="t-display mb-1" style={{ fontSize: 30 }}>
              Find your people.
              <br />
              <span className="t-italic">Find the moment.</span>
            </h1>
            <p className="t-body mb-8" style={{ color: COLOR.ink2 }}>
              Peer sessions, wishlist ideas, and the spots your cohort actually goes — for ISB Mohali PGP Co'27.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="relative">
                <Mail
                  size={16}
                  strokeWidth={1.75}
                  className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ color: COLOR.ink3 }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="yourname@isb.edu"
                  required
                  autoFocus
                  className="w-full pl-11 pr-4 py-3.5 rounded-[12px] text-sm focus:outline-none focus:ring-2"
                  style={{
                    border: `1.5px solid ${error ? "#FECACA" : COLOR.border}`,
                    background: COLOR.surface,
                    color: COLOR.ink,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                />
              </div>

              {error && (
                <p className="text-sm px-1" style={{ color: "#B91C1C" }}>{error}</p>
              )}

              <button
                type="submit"
                disabled={busy || !email.trim()}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {busy ? "Sending…" : (
                  <>Send login link <ArrowRight size={15} /></>
                )}
              </button>
            </form>

            <p className="t-meta text-center mt-8" style={{ color: COLOR.ink3 }}>
              ISB email only · no password needed
            </p>
          </>
        )}
      </div>
    </div>
  );
}
