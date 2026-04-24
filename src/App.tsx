import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";
import SessionNew from "./pages/SessionNew";
import PulsePage from "./pages/PulsePage";
import Home from "./pages/Home";
import ProfilePage from "./pages/ProfilePage";
import type { Session } from "./types";

type Tab = "sessions" | "discover" | "pulse" | "profile";

const NAV: { key: Tab; label: string; emoji: string }[] = [
  { key: "sessions", label: "Sessions", emoji: "📅" },
  { key: "discover", label: "Discover", emoji: "🗺️" },
  { key: "pulse",    label: "Pulse",    emoji: "💡" },
  { key: "profile",  label: "You",      emoji: "👤" },
];

export default function App() {
  const { user, loading, signOut, updateUser } = useAuth();
  const [tab, setTab] = useState<Tab>("sessions");
  const [openSession, setOpenSession] = useState<Session | null>(null);
  const [creating, setCreating] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8f9ff]">
        <div className="w-6 h-6 border-2 border-gray-200 border-t-[#4f6ef7] rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    // After MSAL loginPopup completes, reload so App's useAuth picks up the session
    return <Login onLogin={() => window.location.reload()} />;
  }

  if (!user.section || !user.interests?.length) {
    return (
      <Onboarding
        user={user}
        onComplete={(updates) => updateUser(updates)}
      />
    );
  }

  if (openSession) {
    return (
      <SessionDetail
        session={openSession}
        user={user}
        onBack={() => setOpenSession(null)}
      />
    );
  }

  if (creating) {
    return <SessionNew user={user} onDone={() => setCreating(false)} />;
  }

  return (
    <div className="min-h-screen bg-[#f8f9ff]">
      <main className="max-w-md mx-auto pb-24">
        {tab === "sessions" && (
          <Sessions
            user={user}
            onOpen={setOpenSession}
            onCreate={() => setCreating(true)}
          />
        )}
        {tab === "discover" && (
          <Home user={user} onGoingClick={() => {}} />
        )}
        {tab === "pulse" && <PulsePage user={user} />}
        {tab === "profile" && (
          <ProfilePage
            user={user}
            onSignOut={signOut}
            onToggleLocation={(v) => updateUser({ location_sharing: v })}
          />
        )}
      </main>

      {/* Bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 pt-2 pb-safe-or-3 pb-3 z-40">
        <div className="flex items-center justify-around max-w-md mx-auto px-2">
          {NAV.map(({ key, label, emoji }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex flex-col items-center gap-0.5 px-4 py-1.5 relative"
              >
                <span
                  className={`text-xl transition-all duration-150 ${
                    active ? "scale-110" : "opacity-50"
                  }`}
                >
                  {emoji}
                </span>
                <span
                  className={`text-[10px] font-semibold transition-colors ${
                    active ? "text-[#4f6ef7]" : "text-gray-400"
                  }`}
                >
                  {label}
                </span>
                {active && (
                  <span className="absolute -bottom-1 w-1 h-1 rounded-full bg-[#4f6ef7]" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
