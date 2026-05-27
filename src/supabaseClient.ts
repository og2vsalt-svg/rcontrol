import { createClient } from "@supabase/supabase-js";

// Supabase is used as the shared backend for auth, profiles, configs, and votes.
// Make sure these environment variables are set in Vercel:
// - VITE_SUPABASE_URL
// - VITE_SUPABASE_ANON_KEY

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let resolvedUrl = supabaseUrl;
let resolvedKey = supabaseAnonKey;

if (!resolvedUrl || !resolvedKey) {
  // Fallback to a dummy client so the UI can still render in environments
  // (like local previews) where Supabase env vars are not configured.
  // All Supabase calls will fail gracefully with network errors, but the app
  // won't hard-crash on load.
  console.warn(
    "[rcontrol] Supabase env vars missing. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel project."
  );
  resolvedUrl = "https://example.supabase.co";
  resolvedKey = "public-anon-key";
}

export const supabase = createClient(resolvedUrl, resolvedKey);
