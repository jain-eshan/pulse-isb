import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import Logo from "../components/Logo";

export default function LandingPage() {
  const { signInWithAzure } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setBusy(true);
    setError(null);
    const err = await signInWithAzure();
    if (err) {
      setError(err);
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", overflow: "hidden" }}>
      {/* Hero background image */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage: "url('/isb-campus-hero.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />

      {/* Navy gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(
            to bottom,
            rgba(18, 40, 80, 0.25) 0%,
            rgba(18, 40, 80, 0.4) 40%,
            rgba(18, 40, 80, 0.88) 70%,
            rgba(18, 40, 80, 1) 100%
          )`,
        }}
      />

      {/* Content */}
      <div style={{ position: "relative", zIndex: 2, minHeight: "100vh", display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <header
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "20px 28px",
            maxWidth: 1200,
            width: "100%",
            margin: "0 auto",
          }}
        >
          <Logo height={30} navy="#FFFFFF" amber="#F5A623" />
          <button
            onClick={handleSignIn}
            disabled={busy}
            style={{
              padding: "8px 20px",
              borderRadius: 10,
              border: "1.5px solid rgba(255,255,255,0.3)",
              background: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(8px)",
              color: "#FFFFFF",
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 600,
              fontSize: 14,
              cursor: busy ? "wait" : "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.1)")}
          >
            Sign in
          </button>
        </header>

        {/* Hero content — vertically centered */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "0 24px",
            textAlign: "center",
            maxWidth: 800,
            margin: "0 auto",
          }}
        >
          {/* Live badge */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 16px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(8px)",
              marginBottom: 28,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#22C55E",
                boxShadow: "0 0 8px #22C55E",
                animation: "pulse-glow 2s ease-in-out infinite",
              }}
            />
            <span
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 500,
                fontSize: 13,
                color: "rgba(255,255,255,0.9)",
                letterSpacing: 0.3,
              }}
            >
              Live on ISB Mohali Campus
            </span>
          </div>

          {/* Heading */}
          <h1
            style={{
              fontFamily: "'Playfair Display', serif",
              fontWeight: 500,
              fontSize: "clamp(40px, 7vw, 72px)",
              lineHeight: 1.1,
              color: "#FFFFFF",
              margin: "0 0 20px",
            }}
          >
            Where your cohort{" "}
            <em style={{ fontStyle: "italic" }}>comes alive</em>
          </h1>

          {/* Subtitle */}
          <p
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 400,
              fontSize: "clamp(15px, 2vw, 18px)",
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.7)",
              maxWidth: 540,
              margin: "0 0 36px",
            }}
          >
            Discover events, find your crew, and never miss what's
            happening on campus. Built by batchmates, for batchmates.
          </p>

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={handleSignIn}
              disabled={busy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "14px 32px",
                borderRadius: 12,
                border: "none",
                background: "#FFFFFF",
                color: "#111111",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontWeight: 700,
                fontSize: 15,
                cursor: busy ? "wait" : "pointer",
                transition: "transform 0.15s, box-shadow 0.15s",
                boxShadow: "0 4px 24px rgba(0,0,0,0.15)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-1px)";
                e.currentTarget.style.boxShadow = "0 6px 32px rgba(0,0,0,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.15)";
              }}
            >
              {/* Microsoft icon */}
              <svg width="16" height="16" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="1" y="1" width="9" height="9" fill="#F25022" />
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
                <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
              </svg>
              {busy ? "Signing in…" : "Get Started"}
            </button>
          </div>

          {error && (
            <p
              style={{
                marginTop: 16,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 13,
                color: "#FCA5A5",
              }}
            >
              {error}
            </p>
          )}

          {/* ISB email note */}
          <p
            style={{
              marginTop: 24,
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontWeight: 400,
              fontSize: 12,
              color: "rgba(255,255,255,0.45)",
              letterSpacing: 0.5,
            }}
          >
            ISB email required · Powered by Microsoft SSO
          </p>
        </div>

        {/* Scroll hint */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingBottom: 32,
            opacity: 0.4,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "none" }}>
            <path d="M7 13l5 5 5-5M7 6l5 5 5-5" />
          </svg>
        </div>
      </div>

      {/* Pulse glow animation */}
      <style>{`
        @keyframes pulse-glow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
}
