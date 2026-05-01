import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar, Compass, Lightbulb, MapPin, Plus, User as UserIcon } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useLocationBroadcast } from "./hooks/useLocation";
import { useCampusActivity } from "./hooks/useCampusActivity";
import { supabase } from "./lib/supabase";
import Login from "./pages/Login";
import Onboarding from "./pages/Onboarding";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";
import SessionNew from "./pages/SessionNew";
import PulsePage from "./pages/PulsePage";
import Home from "./pages/Home";
import ProfilePage from "./pages/ProfilePage";
import CampusHeatmap from "./components/CampusHeatmap";
import Logo, { LogoMark } from "./components/Logo";
import { COLOR } from "./lib/pulseTheme";
import { tap } from "./lib/haptics";
import type { Session } from "./types";

type Tab = "sessions" | "discover" | "wishlist" | "campus" | "profile";

// Map URL paths → tab keys
const PATH_TO_TAB: Record<string, Tab> = {
  "/":          "sessions",
  "/discover":  "discover",
  "/wishlist":  "wishlist",
  "/campus":    "campus",
  "/profile":   "profile",
};

const TAB_TO_PATH: Record<Tab, string> = {
  sessions: "/",
  discover: "/discover",
  wishlist: "/wishlist",
  campus:   "/campus",
  profile:  "/profile",
};

const LEFT_NAV: { key: Tab; label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }> }[] = [
  { key: "sessions", label: "Pulse",    Icon: Calendar },
  { key: "discover", label: "Discover", Icon: Compass },
  { key: "wishlist", label: "Wishlist", Icon: Lightbulb },
  { key: "campus",   label: "Campus",   Icon: MapPin },
  { key: "profile",  label: "You",      Icon: UserIcon },
];

export default function App() {
  const { user, loading, signOut, updateUser } = useAuth();
  const myLocationState = useLocationBroadcast(user);
  const { locations: campusLocations } = useCampusActivity();
  const navigate = useNavigate();
  const location = useLocation();

  const [openSession, setOpenSession] = useState<Session | null>(null);
  const [creating, setCreating] = useState(false);
  const [prefillVenue, setPrefillVenue] = useState<string | undefined>();
  const [showCampusModal, setShowCampusModal] = useState(false);

  // Derive active tab from URL
  const tab: Tab = PATH_TO_TAB[location.pathname] ?? "sessions";

  // Sync campus modal with /campus route
  useEffect(() => {
    if (location.pathname === "/campus") {
      setShowCampusModal(true);
    } else {
      setShowCampusModal(false);
    }
  }, [location.pathname]);

  // Deep-link: ?session=<id> opens that session detail
  useEffect(() => {
    if (!user) return;
    const params = new URLSearchParams(location.search);
    const sid = params.get("session");
    if (!sid) return;
    (async () => {
      const { data } = await supabase
        .from("sessions")
        .select("*, creator:users!sessions_creator_id_fkey(id,name,avatar_url,section), rsvps(user_id,status)")
        .eq("id", sid)
        .maybeSingle();
      if (data) setOpenSession(data as unknown as Session);
      // Clean URL so refresh doesn't loop
      navigate("/", { replace: true });
    })();
  }, [user, location.search]);

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
    return <Login />;
  }

  if (!user.onboarded_at) {
    return <Onboarding user={user} onComplete={(updates) => updateUser(updates)} />;
  }

  const page = openSession ? (
    <SessionDetail
      session={openSession}
      user={user}
      onBack={() => setOpenSession(null)}
    />
  ) : creating ? (
    <SessionNew
      user={user}
      prefillVenue={prefillVenue}
      onDone={() => { setCreating(false); setPrefillVenue(undefined); }}
    />
  ) : tab === "sessions" ? (
    <Sessions user={user} onOpen={setOpenSession} onCreate={() => setCreating(true)} />
  ) : tab === "discover" ? (
    <Home
      user={user}
      onGoingClick={() => {}}
      onHostHere={(venue) => { setPrefillVenue(venue); setCreating(true); }}
    />
  ) : tab === "wishlist" ? (
    <PulsePage user={user} />
  ) : tab === "profile" ? (
    <ProfilePage
      user={user}
      onSignOut={signOut}
      onToggleLocation={(v) => updateUser({ location_sharing: v })}
    />
  ) : (
    // "campus" — show Sessions behind the modal
    <Sessions user={user} onOpen={setOpenSession} onCreate={() => setCreating(true)} />
  );

  // Tab click: campus opens modal, others navigate
  function handleTabClick(next: Tab) {
    tap();
    if (next === "campus") {
      navigate("/campus");
      return;
    }
    navigate(TAB_TO_PATH[next]);
  }

  const hideChrome = !!openSession || creating;

  return (
    <div
      className="min-h-screen flex"
      style={{ background: COLOR.bg }}
    >
      {/* Desktop left rail */}
      {!hideChrome && (
        <aside
          className="hidden md:flex flex-col w-56 lg:w-60 border-r py-8 px-5 sticky top-0 h-screen"
          style={{ borderColor: COLOR.borderLight, background: COLOR.bg }}
        >
          <div className="mb-10">
            <Logo height={28} />
          </div>

          <nav className="flex flex-col gap-1">
            {LEFT_NAV.map(({ key, label, Icon }) => {
              const active = key === "campus" ? showCampusModal : (tab === key && !showCampusModal);
              return (
                <button
                  key={key}
                  onClick={() => handleTabClick(key)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-colors"
                  style={{
                    background: active ? COLOR.navyTint : "transparent",
                    color: active ? COLOR.navy : COLOR.ink2,
                  }}
                >
                  <Icon size={18} strokeWidth={active ? 2 : 1.75} />
                  <span className="text-sm" style={{ fontWeight: active ? 700 : 500 }}>
                    {label}
                  </span>
                </button>
              );
            })}
            {/* Post a session — desktop CTA */}
            <button
              onClick={() => { tap(); setCreating(true); }}
              className="flex items-center gap-2 px-3 py-2.5 mt-2 rounded-[10px] text-left transition-colors"
              style={{ background: COLOR.navy, color: "#fff" }}
            >
              <Plus size={16} strokeWidth={2.25} />
              <span className="text-sm" style={{ fontWeight: 700 }}>Post a session</span>
            </button>
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

      {/* Mobile bottom nav */}
      {!hideChrome && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 pt-2.5 border-t"
          style={{
            background: COLOR.surface,
            borderColor: COLOR.border,
            paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
          }}
        >
          <div className="flex items-center max-w-md mx-auto px-1">
            {[
              { key: "sessions" as Tab, label: "Pulse",    Icon: Calendar },
              { key: "discover" as Tab, label: "Discover", Icon: Compass },
              { key: "__post"   as const, label: "Post",   Icon: Plus, special: true },
              { key: "campus"   as Tab, label: "Campus",   Icon: MapPin },
              { key: "profile"  as Tab, label: "You",      Icon: UserIcon },
            ].map(({ key, label, Icon, special }) => {
              if (special) {
                return (
                  <button
                    key="post"
                    onClick={() => { tap(); setCreating(true); }}
                    className="flex-1 flex flex-col items-center gap-0.5 relative"
                  >
                    <div
                      className="flex items-center justify-center"
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 13,
                        background: COLOR.navy,
                        marginTop: -18,
                        boxShadow: "0 4px 16px rgba(28,58,110,0.35)",
                      }}
                    >
                      <Plus size={20} strokeWidth={2.25} color="#fff" />
                    </div>
                  </button>
                );
              }
              const isCampus = key === "campus";
              const visuallyActive = isCampus ? showCampusModal : (tab === key && !showCampusModal);
              return (
                <button
                  key={key}
                  onClick={() => handleTabClick(key as Tab)}
                  className="flex-1 flex flex-col items-center gap-1 px-1 py-1 relative"
                >
                  <Icon
                    size={20}
                    strokeWidth={visuallyActive ? 2 : 1.6}
                    color={visuallyActive ? COLOR.navy : COLOR.ink3}
                  />
                  <span
                    className="text-[10px]"
                    style={{
                      color: visuallyActive ? COLOR.navy : COLOR.ink3,
                      fontWeight: 600,
                    }}
                  >
                    {label}
                  </span>
                  {visuallyActive && (
                    <span
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                      style={{ background: COLOR.navy }}
                    />
                  )}
                  {isCampus && campusLocations.length > 0 && (
                    <span
                      className="absolute"
                      style={{
                        top: 2,
                        right: "30%",
                        width: 7,
                        height: 7,
                        borderRadius: 4,
                        background: "#16A34A",
                        border: `1.5px solid ${COLOR.surface}`,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      )}

      {/* Campus map modal */}
      {showCampusModal && (
        <CampusHeatmap
          locations={campusLocations}
          myLocation={myLocationState}
          onClose={() => navigate(-1)}
          onEnableSharing={() => {
            if (user && !user.location_sharing) updateUser({ location_sharing: true });
          }}
        />
      )}

      {/* Mobile header */}
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

      {!hideChrome && <div className="md:hidden h-[52px] absolute top-0" />}
    </div>
  );
}
