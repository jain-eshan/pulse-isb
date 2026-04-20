import { useState } from "react";
import { useAuth } from "./hooks/useAuth";
import { useLocationBroadcast } from "./hooks/useLocation";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Home from "./pages/Home";
import GoingPage from "./pages/GoingPage";
import MapPage from "./pages/MapPage";
import ProfilePage from "./pages/ProfilePage";
import type { Place } from "./types";
import { Compass, Users, Map, User as UserIcon } from "lucide-react";

type Tab = "home" | "going" | "map" | "profile";

const NAV: { key: Tab; label: string; Icon: typeof Compass }[] = [
  { key: "home", label: "Discover", Icon: Compass },
  { key: "going", label: "Plans", Icon: Users },
  { key: "map", label: "Map", Icon: Map },
  { key: "profile", label: "Profile", Icon: UserIcon },
];

export default function App() {
  const { user, loading, signOut, updateUser } = useAuth();
  const [tab, setTab] = useState<Tab>("home");
  const [broadcastPlace, setBroadcastPlace] = useState<Place | null>(null);

  useLocationBroadcast(user);

  if (loading) {
    return (
      <div className="min-h-screen bg-linen flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-line border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Login onLogin={() => {}} />;
  }

  if (!user.section) {
    return <Onboarding user={user} onComplete={(updates) => updateUser(updates)} />;
  }

  function handleGoingClick(place: Place) {
    setBroadcastPlace(place);
    setTab("going");
  }

  function handleToggleLocation(enabled: boolean) {
    updateUser({ location_sharing: enabled });
  }

  return (
    <div className="min-h-screen bg-linen text-ink">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed top-0 left-0 h-screen w-60 border-r border-line-light flex-col px-5 py-8 bg-surface">
        <div className="mb-10">
          <p className="text-xs font-bold text-ink-3 uppercase tracking-[0.1em]">ISB</p>
          <p className="font-serif text-[22px] leading-tight text-ink">Explorer</p>
          <p className="font-serif italic text-sm text-navy mt-0.5">Find the moment.</p>
        </div>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                tab === key ? "bg-navy-tint text-navy" : "text-ink-2 hover:bg-linen hover:text-ink"
              }`}
            >
              <Icon className="w-4 h-4" strokeWidth={tab === key ? 2 : 1.75} />
              {label}
            </button>
          ))}
        </nav>
        <div className="mt-auto pt-6 border-t border-line-light">
          <p className="text-sm font-semibold text-ink truncate">{user.name}</p>
          <p className="text-xs text-ink-3 truncate">{user.email}</p>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-40 bg-linen/90 backdrop-blur border-b border-line-light px-5 py-3 flex items-center justify-between">
        <p className="font-serif text-[17px] text-ink">ISB Explorer</p>
        <p className="text-xs text-ink-3 uppercase tracking-[0.08em] font-semibold">Section {user.section}</p>
      </header>

      <main className="lg:pl-60 pb-24 lg:pb-0 max-w-[440px] lg:max-w-none mx-auto">
        {tab === "home" && <Home user={user} onGoingClick={handleGoingClick} />}
        {tab === "going" && (
          <GoingPage
            user={user}
            broadcastPlace={broadcastPlace}
            onBroadcastDone={() => setBroadcastPlace(null)}
          />
        )}
        {tab === "map" && <MapPage user={user} onToggleLocation={handleToggleLocation} />}
        {tab === "profile" && (
          <ProfilePage user={user} onSignOut={signOut} onToggleLocation={handleToggleLocation} />
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-line-light px-2 pt-2 pb-3">
        <div className="flex items-center justify-around max-w-[440px] mx-auto">
          {NAV.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="flex flex-col items-center gap-1 px-4 py-1.5 relative"
              >
                <Icon className={`w-5 h-5 ${active ? "text-navy" : "text-ink-3"}`} strokeWidth={active ? 2 : 1.75} />
                <span className={`text-[10px] font-semibold ${active ? "text-navy" : "text-ink-3"}`}>{label}</span>
                {active && <span className="absolute -bottom-0.5 w-1 h-1 rounded-full bg-navy" />}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
