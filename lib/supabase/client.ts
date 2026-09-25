import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let clientInitializedWithDummyKey = false;

// Default project URL and publishable key (safe for browser exposure)
// Ensures client authentication never fails even if environment variables are not injected at build time
const DEFAULT_SUPABASE_URL = "https://udxjxkkcpdrlceucxqfk.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "sb_publishable_0Quf-D6ZTC7-bDorA1UDKQ_5fqv35PA";

/**
 * Returns the singleton Supabase browser client.
 * Uses only publishable keys; the secret key is NEVER exposed to the browser.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  const isBrowser = typeof window !== "undefined";

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  const supabaseAnonKey = (rawKey && rawKey.trim()) ? rawKey.trim() : DEFAULT_SUPABASE_ANON_KEY;

  if (browserClient) {
    return browserClient;
  }

  if (isBrowser) {
    try {
      const oldAuth = localStorage.getItem("altofox_team_auth");
      const newAuth = localStorage.getItem("ranklocal_team_auth");
      if (oldAuth && !newAuth) {
        localStorage.setItem("ranklocal_team_auth", oldAuth);
      }
    } catch {}
  }

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
      storageKey: "ranklocal_team_auth",
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  return browserClient;
}

// Proxy export so importing `supabase` directly never throws at module load time
// and always delegates safely to getSupabaseBrowserClient()
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseBrowserClient();
    const val = (client as any)[prop];
    if (typeof val === "function") {
      return val.bind(client);
    }
    return val;
  },
});
