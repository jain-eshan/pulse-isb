import { useState } from "react";
import { useAuth } from "../hooks/useAuth";

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const { signIn, error } = useAuth();
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    const user = await signIn();
    setLoading(false);
    if (user) onLogin();
  }

  return (
    <div className="min-h-screen bg-linen flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-12">
          <p className="text-xs font-bold text-ink-3 uppercase tracking-[0.1em] mb-3">ISB Mohali</p>
          <h1 className="font-serif text-[40px] leading-[1.05] text-ink">
            Find the moment.
          </h1>
          <p className="font-serif italic text-navy text-[20px] mt-1">
            Find your people.
          </p>
          <p className="text-ink-2 mt-5 text-sm leading-relaxed">
            A private discovery and coordination space for the cohort.
          </p>
        </div>

        <button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 bg-navy hover:bg-navy-deep text-white text-[13px] font-semibold rounded-md px-5 py-3 shadow-navy transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
          ) : (
            <svg viewBox="0 0 23 23" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
              <path fill="#f3f3f3" d="M0 0h11v11H0z" />
              <path fill="#f35325" d="M12 0h11v11H12z" />
              <path fill="#81bc06" d="M0 12h11v11H0z" />
              <path fill="#ffba08" d="M12 12h11v11H12z" />
            </svg>
          )}
          {loading ? "Signing in…" : "Continue with Microsoft"}
        </button>

        {error && (
          <div className="mt-4 px-4 py-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <p className="mt-8 text-xs text-ink-3">
          Access restricted to <span className="text-amber font-semibold">@isb.edu</span> accounts.
        </p>
      </div>
    </div>
  );
}
