import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Logo from "../components/Logo";
import { COLOR, SHADOW } from "../lib/pulseTheme";

type Props = { onLogin: () => void };

export default function Login({ onLogin }: Props) {
  const { signIn, error, isDemo } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleSignIn() {
    setBusy(true);
    const u = await signIn();
    setBusy(false);
    if (u) onLogin();
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-5"
      style={{ background: COLOR.bg }}
    >
      <div className="w-full max-w-sm">
        {/* Wordmark + tagline */}
        <div className="mb-12 text-center">
          <div className="flex justify-center mb-5">
            <Logo height={44} />
          </div>
          <p className="t-italic text-lg">Find your people. Find the moment.</p>
        </div>

        {/* Card */}
        <div
          className="card p-7"
          style={{ boxShadow: SHADOW.card }}
        >
          <h2 className="t-heading mb-1">Welcome</h2>
          <p className="t-body mb-6">
            Sign in with your ISB Microsoft account to continue.
          </p>

          <button
            onClick={handleSignIn}
            disabled={busy}
            className="btn-primary w-full flex items-center justify-center gap-3"
            style={{ padding: "14px 0" }}
          >
            {busy ? (
              "Signing in…"
            ) : (
              <>
                <svg viewBox="0 0 23 23" width="18" height="18">
                  <path fill="#f3f3f3" d="M0 0h11v11H0z" />
                  <path fill="#f35325" d="M12 0h11v11H12z" />
                  <path fill="#81bc06" d="M0 12h11v11H0z" />
                  <path fill="#ffba08" d="M12 12h11v11H12z" />
                </svg>
                Sign in with Microsoft
              </>
            )}
          </button>

          {error && (
            <p
              className="mt-4 text-sm font-medium"
              style={{ color: "#B91C1C" }}
            >
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 mt-6">
            <div className="flex-1 h-px" style={{ background: COLOR.borderLight }} />
            <span className="t-label">ISB only</span>
            <div className="flex-1 h-px" style={{ background: COLOR.borderLight }} />
          </div>
          <p className="t-meta text-center mt-3">
            Access restricted to @isb.edu accounts
          </p>
        </div>

        {isDemo && (
          <p className="t-meta text-center mt-6 italic">
            Demo mode — Azure AD not configured. Clicking sign-in creates a local demo profile.
          </p>
        )}
      </div>
    </div>
  );
}
