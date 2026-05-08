import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Logo from "../components/Logo";
import { COLOR } from "../lib/pulseTheme";

/**
 * Minimal sign-in page — Microsoft SSO only.
 * Kept as a fallback route; primary auth is via LandingPage.
 */
export default function Login() {
  const { signInWithAzure } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAzure() {
    setBusy(true);
    setError(null);
    const err = await signInWithAzure();
    if (err) {
      setError(err);
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

        <h1 className="t-display mb-1" style={{ fontSize: 30 }}>
          Find your people.
          <br />
          <span className="t-italic">Find the moment.</span>
        </h1>
        <p className="t-body mb-8" style={{ color: COLOR.ink2 }}>
          Sign in with your ISB email to continue.
        </p>

        <button
          onClick={handleAzure}
          disabled={busy}
          className="w-full px-5 py-3.5 rounded-[12px] font-semibold text-sm flex items-center justify-center gap-2"
          style={{
            background: "#fff",
            color: "#0F0F0F",
            border: `1.5px solid ${COLOR.border}`,
          }}
        >
          <svg width="16" height="16" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <rect x="1" y="1" width="9" height="9" fill="#F25022" />
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
            <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
          </svg>
          {busy ? "Signing in…" : "Sign in with ISB email"}
        </button>

        {error && (
          <p className="text-sm px-1 mt-3" style={{ color: "#B91C1C" }}>{error}</p>
        )}

        <p className="t-meta text-center mt-8" style={{ color: COLOR.ink3 }}>
          ISB email required · Powered by Microsoft SSO
        </p>
      </div>
    </div>
  );
}
