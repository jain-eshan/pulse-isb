import { useState } from "react";
import { Calendar, Compass, Lightbulb, User as UserIcon } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";
import SessionNew from "./pages/SessionNew";
import PulsePage from "./pages/PulsePage";
import Home from "./pages/Home";
import ProfilePage from "./pages/ProfilePage";
import Logo, { LogoMark } from "./components/Logo";
import { COLOR } from "./lib/pulseTheme";
import type { Session } from "./types";

type Tab = "sessions" | "discover" | "pulse" | "profile";

const NAV: { key: Tab; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }> }[] = [
  { key: "sessions", label: "Sessions", Icon: Calendar },
  { key: "discover", label: "Discover", Icon: Compass },
  { key: "pulse",    label: "Wishlist", Icon: Lightbulb },
  { key: "profile",  label: "You",      Icon: UserIcon },
];

export default function App() {
  const { user, loading, signOut, updateUser } = useAuth();
  const [tab, setTab] = useState<Tab>("sessions");
  const [openSession, setOpenSession] = useState<Session | null>(null);
  const [creating, setCreating] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLOR.bg }}>
        <div
          className="w-6 h-6 rounded-full animate-spin"
          style={{
            border: `2px solid ${COLOR.border}`,
            borderTopColor: COLOR.navy,
          }}
        />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => window.location.reload()} />;
  }

  if (!user.section || !user.interests?.length) {
    return <Onboarding user={user} onComplete={(updates) => updateUser(updates)} />;
  }

  const page = openSession ? (
    <SessionDetail
      session={openSession}
      user={user}
      onBack={() => setOpenSession(null)}
    />
  ) : creating ? (
    <SessionNew user={user} onDone={() => setCreating(false)} />
  ) : tab === "sessions" ? (
    <Sessions user={user} onOpen={setOpenSession} onCreate={() => setCreating(true)} />
  ) : tab === "discover" ? (
    <Home user={user} onGoingClick={() => {}} />
  ) : tab === "pulse" ? (
    <PulsePage user={user} />
  ) : (
    <ProfilePage
      user={user}
      onSignOut={signOut}
      onToggleLocation={(v) => updateUser({ location_sharing: v })}
    />
  );

  const hideChrome = !!openSession || creating;

  return (
    <div
      className="min-h-screen flex"
      style={{ background: COLOR.bg }}
    >
      {/* Desktop left rail — visible ≥ md */}
      {!hideChrome && (
        <aside
          className="hidden md:flex flex-col w-56 lg:w-60 border-r py-8 px-5 sticky top-0 h-screen"
          style={{ borderColor: COLOR.borderLight, background: COLOR.bg }}
        >
          <div className="mb-10">
            <Logo height={28} />
          </div>

          <nav className="flex flex-col gap-1">
            {NAV.map(({ key, label, Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-colors"
                  style={{
                    background: active ? COLOR.navyTint : "transparent",
                    color: active ? COLOR.navy : COLOR.ink2,
                  }}
                >
                  <Icon size={18} strokeWidth={active ? 2 : 1.75} />
                  <span
                    className="text-sm"
                    style={{ fontWeight: active ? 700 : 500 }}
                  >
                    {label}
                  </span>
                </button>
              );
            })}
          </nav>

          <div className="flex-1" />
          <p className="t-meta">
            © {new Date().getFullYear()} Pulse · ISB Mohali
          </p>
        </aside>
      )}

      {/* Main content */}
      <main className="flex-1 min-w-0 pb-24 md:pb-0">
        {page}
      </main>

      {/* Mobile bottom nav — visible < md only */}
      {!hideChrome && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 pt-2 border-t backdrop-blur-xl"
          style={{
            background: "rgba(244,242,236,0.96)",
            borderColor: COLOR.borderLight,
            paddingBottom: "calc(env(safe-area-inset-bottom) + 10px)",
          }}
        >
          <div className="flex items-center justify-around max-w-md mx-auto px-2">
            {NAV.map(({ key, label, Icon }) => {
              const active = tab === key;
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className="flex flex-col items-center gap-0.5 px-3 py-1.5 relative"
                >
                  <Icon
                    size={20}
                    strokeWidth={active ? 2 : 1.75}
                    color={active ? COLOR.navy : COLOR.ink3}
                  />
                  <span
                    className="text-[10px]"
                    style={{
                      color: active ? COLOR.navy : COLOR.ink3,
                      fontWeight: active ? 700 : 600,
                    }}
                  >
                    {label}
                  </span>
                  {active && (
                    <span
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                      style={{ background: COLOR.navy }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Mobile header with LogoMark — shown only when not on nested screens */}
      {!hideChrome && (
        <header
          className="md:hidden fixed top-0 left-0 right-0 z-30 px-5 py-3 flex items-center border-b"
          style={{
            background: "rgba(244,242,236,0.92)",
            borderColor: COLOR.borderLight,
            backdropFilter: "blur(12px)",
          }}
        >
          <LogoMark size={28} />
        </header>
      )}

      {/* Spacer for mobile header */}
      {!hideChrome && <div className="md:hidden h-[52px] absolute top-0" />}
    </div>
  );
}
