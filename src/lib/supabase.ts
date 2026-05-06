import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,          // store in localStorage (default, but explicit)
    storageKey: "pulse-isb-auth",  // stable key across deploys
    autoRefreshToken: true,        // silently refresh before expiry
    detectSessionInUrl: true,      // handle OAuth redirects
  },
});
