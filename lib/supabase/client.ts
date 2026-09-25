import { createClient, SupabaseClient } from "@supabase/supabase-js";

let browserClient: SupabaseClient | null = null;
let clientInitializedWithDummyKey = false;

// Fallback dummy JWT token so Next.js static prerendering on Vercel never crashes
// when environment variables are not yet injected during build time.
const BUILD_FALLBACK_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.build_placeholder";

/**
 * Returns the singleton Supabase browser client.
 * Uses only publishable keys; the secret key is NEVER exposed to the browser.
 */
export function getSupabaseBrowserClient(): SupabaseClient {
  const isBrowser = typeof window !== "undefined";

  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://udxjxkkcpdrlceucxqfk.supabase.co";

  const rawKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY;

  const hasRealKey = Boolean(rawKey && rawKey.trim());
  const supabaseAnonKey = hasRealKey ? rawKey!.trim() : BUILD_FALLBACK_ANON_KEY;

  if (browserClient && (!clientInitializedWithDummyKey || !hasRealKey)) {
    return browserClient;
  }

  clientInitializedWithDummyKey = !hasRealKey;

  browserClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: isBrowser,
      autoRefreshToken: isBrowser,
      detectSessionInUrl: isBrowser,
      storageKey: "altofox_team_auth",
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
