import { Component, useEffect, useState } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Calendar, Compass, MapPin, Plus, User as UserIcon, ShieldCheck, ChevronLeft, Maximize2, Share2 } from "lucide-react";
import { useAuth } from "./hooks/useAuth";
import { useLocationBroadcast } from "./hooks/useLocation";
import { useCampusActivity } from "./hooks/useCampusActivity";
import { supabase } from "./lib/supabase";
import LandingPage from "./pages/LandingPage";
import Onboarding from "./pages/Onboarding";
import Sessions from "./pages/Sessions";
import SessionDetail from "./pages/SessionDetail";
import SessionNew from "./pages/SessionNew";
import Home from "./pages/Home";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import CampusHeatmap from "./components/CampusHeatmap";
import Logo, { LogoMark } from "./components/Logo";
import { COLOR } from "./lib/pulseTheme";
import { tap } from "./lib/haptics";
import type { Session } from "./types";

/* ─── Error Boundary for modal crash isolation ─── */
class ModalErrorBoundary extends Component<
  { children: ReactNode; onError: () => void },
  { hasError: boolean; error: string }
> {
  state = { hasError: false, error: "" };
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error: error.message };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ModalErrorBoundary] crash:", error, info.componentStack);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 32, textAlign: "center" }}>
          <p style={{ color: "#B91C1C", fontWeight: 700, marginBottom: 8 }}>
            Something went wrong loading this event.
          </p>
          <p style={{ color: "#6B7280", fontSize: 13, marginBottom: 16 }}>
            {this.state.error}
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: "" }); this.props.onError(); }}
            style={{ padding: "8px 20px", borderRadius: 10, background: "#1C3A6E", color: "#fff", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600 }}
          >
            Close
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

type Tab = "sessions" | "discover" | "campus" | "profile" | "admin";

const PATH_TO_TAB: Record<string, Tab> = {
  "/":         "sessions",
  "/discover": "discover",
  "/campus":   "campus",
  "/profile":  "profile",
  "/admin":    "admin",
};

const TAB_TO_PATH: Record<Tab, string> = {
  sessions: "/",
  discover: "/discover",
  campus:   "/campus",
  profile:  "/profile",
  admin:    "/admin",
};

const LEFT_NAV: {
  key: Tab;
  label: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; color?: string }>;
}[] = [
  { key: "sessions", label: "Events",   Icon: Calendar },
  { key: "discover", label: "Discover", Icon: Compass },
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
  const [drawerExpanded, setDrawerExpanded] = useState(false);

  // Wrap open/close to sync URL deep-link
  function openSessionDrawer(s: Session) {
    setOpenSession(s);
    setDrawerExpanded(false);
    window.history.replaceState({}, "", `/?session=${s.id}`);
  }
  function closeDrawer() {
    setOpenSession(null);
    setDrawerExpanded(false);
    window.history.replaceState({}, "", "/");
  }
  const [creating, setCreating] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [prefillVenue, setPrefillVenue] = useState<string | undefined>();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Close drawer on Escape
  useEffect(() => {
    if (!openSession) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeDrawer(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSession]);

  const tab: Tab = PATH_TO_TAB[location.pathname] ?? "sessions";

  // Deep-link: ?session=<id>
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
      navigate("/", { replace: true });
    })();
  }, [user, location.search]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: COLOR.bg }}>
        <div
          className="w-6 h-6 rounded-full animate-spin"
          style={{ border: `2px solid ${COLOR.border}`, borderTopColor: COLOR.navy }}
        />
      </div>
    );
  }

  if (!user) return <LandingPage />;
  if (!user.onboarded_at) {
    return <Onboarding user={user} onComplete={(updates) => updateUser(updates)} />;
  }

  // Background page
  const bgPage = tab === "sessions" ? (
    <Sessions user={user} onOpen={(s) => { console.log("[App] onOpen fired, session:", s.id, s.title); openSessionDrawer(s); }} onCreate={() => setCreating(true)} />
  ) : tab === "discover" ? (
    <Home
      user={user}
      onGoingClick={() => {}}
      onHostHere={(venue) => { setPrefillVenue(venue); setCreating(true); }}
    />
  ) : tab === "profile" ? (
    <ProfilePage
      user={user}
      onSignOut={signOut}
      onToggleLocation={(v) => updateUser({ location_sharing: v })}
      onOpenSession={openSessionDrawer}
      onEditSession={(s) => setEditingSession(s)}
      onUpdateProfile={async (updates) => { await updateUser(updates); }}
    />
  ) : tab === "campus" ? (
    <CampusHeatmap
      locations={campusLocations}
      myLocation={myLocationState}
      onClose={() => navigate("/")}
      onEnableSharing={() => {
        if (user && !user.location_sharing) updateUser({ location_sharing: true });
      }}
    />
  ) : tab === "admin" && user.is_admin ? (
    <AdminPage user={user} />
  ) : (
    <Sessions user={user} onOpen={openSessionDrawer} onCreate={() => setCreating(true)} />
  );

  function handleTabClick(next: Tab) {
    tap();
    navigate(TAB_TO_PATH[next]);
  }

  // Keep nav always visible — create/edit renders inline in main content area
  const hideChrome = false;

  return (
    <div className="min-h-screen flex" style={{ background: COLOR.bg }}>
      {/* Desktop sidebar */}
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
              const active = tab === key;
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
            <button
              onClick={() => { tap(); setCreating(true); }}
              className="flex items-center gap-2 px-3 py-2.5 mt-2 rounded-[10px] text-left transition-colors"
              style={{ background: COLOR.ink, color: "#fff" }}
            >
              <Plus size={16} strokeWidth={2.25} />
              <span className="text-sm" style={{ fontWeight: 700 }}>Create event</span>
            </button>
          </nav>
          <div className="flex-1" />
          {user.is_admin && (
            <button
              onClick={() => handleTabClick("admin")}
              className="flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-left transition-colors mb-2"
              style={{ background: tab === "admin" ? "#FEF3C7" : "transparent", color: tab === "admin" ? "#D97706" : COLOR.ink3 }}
            >
              <ShieldCheck size={16} strokeWidth={1.75} />
              <span className="text-sm" style={{ fontWeight: 600 }}>Admin</span>
            </button>
          )}
          <p className="t-meta">© {new Date().getFullYear()} Pulse · ISB Mohali</p>
        </aside>
      )}

      {/* Main content */}
      <main className={`flex-1 min-w-0 ${tab === "campus" ? "" : "pb-24 md:pb-0"}`}>
        {(creating || editingSession) ? (
          <SessionNew
            user={user}
            prefillVenue={prefillVenue}
            editSession={editingSession ?? undefined}
            onDone={() => { setCreating(false); setEditingSession(null); setPrefillVenue(undefined); }}
          />
        ) : bgPage}
      </main>

      {/* Session detail — right-side drawer (v3) */}
      {openSession && (
        <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, left: 0, zIndex: 200 }}>
          {/* Backdrop */}
          {!drawerExpanded && (
            <div
              onClick={closeDrawer}
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(0,0,0,0.4)",
                animation: "fadeIn 0.2s ease",
              }}
            />
          )}
          {/* Drawer panel — sidebar stays visible when expanded on desktop */}
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              bottom: 0,
              left: drawerExpanded && !isMobile ? "14rem" : "auto",
              width: drawerExpanded
                ? (isMobile ? "100%" : "auto")
                : (isMobile ? "100%" : "50%"),
              minWidth: !drawerExpanded && !isMobile ? "560px" : undefined,
              maxWidth: "100%",
              background: COLOR.bg,
              boxShadow: drawerExpanded ? "none" : "-12px 0 40px rgba(0,0,0,0.15)",
              borderLeft: drawerExpanded && !isMobile ? `1px solid ${COLOR.borderLight}` : "none",
              transition: "all 0.25s cubic-bezier(0.32,0.72,0,1)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Top bar */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                borderBottom: `1px solid ${COLOR.borderLight}`,
                flexShrink: 0,
              }}
            >
              {/* Back / close */}
              <button
                onClick={closeDrawer}
                style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${COLOR.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                aria-label="Close"
              >
                <ChevronLeft size={18} strokeWidth={2} color={COLOR.ink2} />
              </button>

              <span style={{ fontSize: 11, color: COLOR.ink3, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Event</span>

              {/* Expand + Share */}
              <div style={{ display: "flex", gap: 6 }}>
                {/* Share — deep-link URL */}
                <button
                  onClick={async () => {
                    if (!openSession) return;
                    const url = `${window.location.origin}/?session=${openSession.id}`;
                    if (navigator.share) {
                      await navigator.share({ title: openSession.title, url }).catch(() => {});
                    } else {
                      await navigator.clipboard?.writeText(url);
                    }
                  }}
                  style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${COLOR.border}`, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title="Copy event link"
                >
                  <Share2 size={15} color={COLOR.ink2} />
                </button>
                {/* Expand / collapse — fills main area, sidebar stays */}
                <button
                  onClick={() => setDrawerExpanded((v) => !v)}
                  style={{ width: 34, height: 34, borderRadius: 9, border: `1px solid ${COLOR.border}`, background: drawerExpanded ? COLOR.bgSoft : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  title={drawerExpanded ? "Exit full screen" : "Full screen"}
                >
                  <Maximize2 size={14} color={COLOR.ink2} />
                </button>
              </div>
            </div>
            {/* Content */}
            <ModalErrorBoundary onError={closeDrawer}>
              <SessionDetail
                session={openSession}
                user={user}
                onBack={closeDrawer}
                onEdit={(s) => { closeDrawer(); setEditingSession(s); }}
              />
            </ModalErrorBoundary>
          </div>
        </div>
      )}

      {/* Mobile bottom nav */}
      {!hideChrome && (
        <nav
          className="md:hidden fixed bottom-0 left-0 right-0 z-40 pt-2.5 border-t"
          style={{
            background: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderColor: COLOR.borderLight,
            paddingBottom: "calc(env(safe-area-inset-bottom) + 12px)",
          }}
        >
          <div className="flex items-center max-w-md mx-auto px-1">
            {[
              { key: "sessions" as Tab, label: "Events",   Icon: Calendar },
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
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 13,
                        background: COLOR.ink,
                        marginTop: -18,
                        boxShadow: "0 4px 16px rgba(0,0,0,0.25)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Plus size={20} strokeWidth={2.25} color="#fff" />
                    </div>
                  </button>
                );
              }
              const visuallyActive = tab === key;
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
                    style={{ color: visuallyActive ? COLOR.navy : COLOR.ink3, fontWeight: 600 }}
                  >
                    {label}
                  </span>
                  {visuallyActive && (
                    <span
                      className="absolute -bottom-0.5 w-1 h-1 rounded-full"
                      style={{ background: COLOR.navy }}
                    />
                  )}
                  {key === "campus" && campusLocations.length > 0 && (
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

      {/* Mobile header */}
      {!hideChrome && (
        <header
          className="md:hidden fixed top-0 left-0 right-0 z-30 px-5 py-3 flex items-center border-b"
          style={{
            background: "rgba(255,255,255,0.92)",
            borderColor: COLOR.borderLight,
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          <LogoMark size={28} />
        </header>
      )}

      {!hideChrome && <div className="md:hidden h-[52px] absolute top-0" />}
    </div>
  );
}
