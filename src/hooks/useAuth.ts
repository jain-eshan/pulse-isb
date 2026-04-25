import { useState, useEffect } from "react";
import type { User } from "../types";

const DEMO_KEY = "pulse.demo.user";

// Fresh demo user — empty section + interests so onboarding runs.
// After onboarding completes, updateUser() persists the filled profile.
const FRESH_DEMO_USER: User = {
  id: "demo-user-1",
  microsoft_id: "demo-ms-id",
  name: "Eshan Jain",
  email: "eshan.jain@isb.edu",
  section: "",
  campus: "mohali",
  cohort_year: 2026,
  vibe_tags: [],
  interests: [],
  budget_min: 500,
  budget_max: 4000,
  location_sharing: false,
  created_at: new Date().toISOString(),
};

const IS_DEMO =
  !import.meta.env.VITE_AZURE_CLIENT_ID ||
  import.meta.env.VITE_AZURE_CLIENT_ID === "your-client-id";

function loadDemo(): User | null {
  try {
    const raw = localStorage.getItem(DEMO_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}
function saveDemo(u: User | null) {
  try {
    if (u) localStorage.setItem(DEMO_KEY, JSON.stringify(u));
    else localStorage.removeItem(DEMO_KEY);
  } catch { /* empty */ }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (IS_DEMO) {
      // ?reset=1 in URL clears the demo profile to re-run onboarding
      const urlReset = new URLSearchParams(window.location.search).has("reset");
      if (urlReset) saveDemo(null);
      const stored = loadDemo();
      setUser(stored); // null → login screen; present → through to app
      setLoading(false);
      return;
    }

    import("../lib/msal").then(({ msalInstance }) => {
      msalInstance
        .initialize()
        .then(async () => {
          const accounts = msalInstance.getAllAccounts();
          if (accounts.length > 0) {
            await loadUser(accounts[0].homeAccountId);
          } else {
            setLoading(false);
          }
        })
        .catch(() => setLoading(false));
    });
  }, []);

  async function loadUser(microsoftId: string) {
    const { supabase } = await import("../lib/supabase");
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("microsoft_id", microsoftId)
      .single();
    setUser(data);
    setLoading(false);
  }

  async function signIn() {
    setError(null);
    if (IS_DEMO) {
      const fresh = { ...FRESH_DEMO_USER };
      saveDemo(fresh);
      setUser(fresh);
      return fresh;
    }

    try {
      const { msalInstance, loginRequest, isISBEmail } = await import("../lib/msal");
      const { supabase } = await import("../lib/supabase");
      await msalInstance.initialize();
      const result = await msalInstance.loginPopup(loginRequest);
      const email = result.account.username;

      if (!isISBEmail(email)) {
        await msalInstance.logoutPopup();
        setError("Only ISB email addresses (@isb.edu) are allowed.");
        return null;
      }

      const { data: existing } = await supabase
        .from("users")
        .select("*")
        .eq("microsoft_id", result.account.homeAccountId)
        .single();

      if (existing) {
        setUser(existing);
        return existing;
      }

      const newUser = {
        microsoft_id: result.account.homeAccountId,
        name: result.account.name ?? email.split("@")[0],
        email,
        section: "",
        cohort_year: new Date().getFullYear(),
        vibe_tags: [],
        budget_min: 500,
        budget_max: 3000,
        location_sharing: false,
      };

      const { data: created } = await supabase
        .from("users")
        .insert(newUser)
        .select()
        .single();
      setUser(created);
      return created;
    } catch {
      setError("Sign in failed. Please try again.");
      return null;
    }
  }

  async function signOut() {
    if (IS_DEMO) {
      saveDemo(null);
      setUser(null);
      return;
    }
    const { msalInstance } = await import("../lib/msal");
    await msalInstance.initialize();
    await msalInstance.logoutPopup();
    setUser(null);
  }

  async function updateUser(updates: Partial<User>) {
    if (!user) return;
    if (IS_DEMO) {
      const next = { ...user, ...updates };
      saveDemo(next);
      setUser(next);
      return;
    }
    const { supabase } = await import("../lib/supabase");
    const { data } = await supabase
      .from("users")
      .update(updates)
      .eq("id", user.id)
      .select()
      .single();
    setUser(data);
  }

  return { user, loading, error, signIn, signOut, updateUser, isDemo: IS_DEMO };
}
