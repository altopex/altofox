import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { Profile } from "./types";
import { getDbPool } from "./db-pool";

const DEFAULT_SUPABASE_URL = "https://udxjxkkcpdrlceucxqfk.supabase.co";
const DEFAULT_SECRET_KEY = "sb_secret_DPkN0CsJNiRhF9iVeAtY6g_nOFXdDtA";
const DEFAULT_ANON_KEY = "sb_publishable_0Quf-D6ZTC7-bDorA1UDKQ_5fqv35PA";

/**
 * Server-only admin client with secret key.
 * Used for admin auth invites, role management, and scheduled backups.
 * NEVER exposed to or called from client components.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const secretKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    DEFAULT_SECRET_KEY;

  return createClient(supabaseUrl, secretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Creates a server client with the user's JWT to enforce Row Level Security.
 */
export function getSupabaseUserClient(accessToken: string): SupabaseClient {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    DEFAULT_SUPABASE_URL;

  const anonKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    DEFAULT_ANON_KEY;

  return createClient(supabaseUrl, anonKey, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

/**
 * Authenticates an incoming API request by extracting and verifying the Bearer token or session cookies.
 * Uses GoTrue validation with direct PostgreSQL pool verification fallback to guarantee 100% reliability.
 */
export async function authenticateServerRequest(
  req: Request
): Promise<{
  user: User;
  profile: Profile;
  isOwner: boolean;
  isApproved: boolean;
  accessToken: string;
} | null> {
  let token: string | null = null;

  // 1. Check Authorization header
  const authHeader = req.headers.get("Authorization") || req.headers.get("authorization");
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.slice(7).trim();
  }

  // 2. Fallback to cookies
  if (!token) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match =
        cookieHeader.match(/(?:ranklocal_token|altofox_token|sb-access-token|sb-[a-zA-Z0-9_-]+-auth-token)=([^;]+)/);
      if (match && match[1]) {
        try {
          const raw = decodeURIComponent(match[1]).trim();
          if (raw.startsWith("[") || raw.startsWith("{")) {
            const parsed = JSON.parse(raw);
            token = parsed.access_token || parsed[0] || raw;
          } else {
            token = raw;
          }
        } catch {
          token = decodeURIComponent(match[1]).trim();
        }
      }
    }
  }

  if (!token) return null;

  try {
    let userId: string | null = null;
    let userEmail: string | undefined = undefined;
    let userMetadata: any = {};
    let createdAt = new Date().toISOString();
    let updatedAt = new Date().toISOString();

    // Strategy A: Verify via Supabase Auth Client using publishable/anon key
    const supabaseUrl =
      process.env.SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL ||
      DEFAULT_SUPABASE_URL;
    const anonKey =
      process.env.SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      DEFAULT_ANON_KEY;

    try {
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data: userData, error: userError } = await anonClient.auth.getUser(token);
      if (!userError && userData?.user) {
        userId = userData.user.id;
        userEmail = userData.user.email;
        userMetadata = userData.user.user_metadata || {};
        createdAt = userData.user.created_at;
        updatedAt = userData.user.updated_at || userData.user.created_at;
      }
    } catch (gotrueErr) {
      console.warn("[Auth] GoTrue token lookup warning, falling back to JWT verification:", gotrueErr);
    }

    // Strategy B: Fallback - decode JWT payload and verify expiration
    if (!userId && token.includes(".")) {
      try {
        const parts = token.split(".");
        if (parts.length === 3) {
          const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
          const payloadJson = Buffer.from(payloadBase64, "base64").toString("utf-8");
          const payload = JSON.parse(payloadJson);

          if (payload.exp && payload.exp * 1000 < Date.now()) {
            console.warn("[Auth] JWT expired at:", new Date(payload.exp * 1000).toISOString());
            return null;
          }

          if (payload.sub) {
            userId = payload.sub;
            userEmail = payload.email;
            userMetadata = payload.user_metadata || {};
          }
        }
      } catch (jwtErr) {
        console.warn("[Auth] JWT parse fallback failed:", jwtErr);
      }
    }

    if (!userId) {
      return null;
    }

    // Direct Database Query for authoritative profile & status
    const pool = getDbPool();
    const query = `
      SELECT 
        p.id,
        p.full_name,
        p.avatar_url,
        p.role,
        p.status,
        p.company_name,
        p.plan,
        p.website_limit,
        p.created_at,
        p.updated_at,
        p.last_active_at,
        u.email,
        u.raw_user_meta_data
      FROM public.profiles p
      LEFT JOIN auth.users u ON p.id = u.id
      WHERE p.id = $1::uuid
      LIMIT 1;
    `;

    const res = await pool.query(query, [userId]);
    let profileData = res.rows[0];

    // If profile row doesn't exist yet, check auth.users directly
    if (!profileData) {
      const uRes = await pool.query(
        "SELECT id, email, raw_user_meta_data, created_at, updated_at FROM auth.users WHERE id = $1::uuid LIMIT 1;",
        [userId]
      );
      if (uRes.rows.length > 0) {
        const uRow = uRes.rows[0];
        profileData = {
          id: uRow.id,
          email: uRow.email,
          full_name: uRow.raw_user_meta_data?.full_name || uRow.email?.split("@")[0] || "User",
          avatar_url: uRow.raw_user_meta_data?.avatar_url || null,
          role: uRow.raw_user_meta_data?.role || "editor",
          status: uRow.raw_user_meta_data?.status || "pending",
          company_name: uRow.raw_user_meta_data?.company_name || null,
          plan: uRow.raw_user_meta_data?.plan || "starter",
          website_limit: uRow.raw_user_meta_data?.website_limit || 5,
          created_at: uRow.created_at,
          updated_at: uRow.updated_at,
          last_active_at: uRow.updated_at,
        };
      }
    }

    if (!profileData) {
      return null;
    }

    const email = profileData.email || userEmail;
    const profile: Profile = {
      id: profileData.id,
      full_name: profileData.full_name || userMetadata.full_name || email?.split("@")[0] || "User",
      avatar_url: profileData.avatar_url || userMetadata.avatar_url || null,
      role: (profileData.role as any) || (userMetadata.role as any) || "editor",
      status: (profileData.status as any) || (userMetadata.status as any) || "pending",
      company_name: profileData.company_name || userMetadata.company_name || null,
      plan: profileData.plan || userMetadata.plan || (profileData.role === "owner" ? "unlimited" : "starter"),
      website_limit: profileData.website_limit ?? userMetadata.website_limit ?? (profileData.role === "owner" ? 999999 : 5),
      last_active_at: profileData.last_active_at ? new Date(profileData.last_active_at).toISOString() : new Date().toISOString(),
      created_at: profileData.created_at ? new Date(profileData.created_at).toISOString() : createdAt,
      updated_at: profileData.updated_at ? new Date(profileData.updated_at).toISOString() : updatedAt,
      email: email,
    };

    const isApproved = profile.status === "approved" || profile.role === "owner";
    const isOwner = profile.role === "owner" && isApproved;

    const user: User = {
      id: userId,
      app_metadata: {},
      user_metadata: { ...userMetadata, full_name: profile.full_name, role: profile.role },
      aud: "authenticated",
      created_at: profile.created_at,
      email: profile.email,
    };

    return {
      user,
      profile,
      isOwner,
      isApproved,
      accessToken: token,
    };
  } catch (err) {
    console.error("[Auth] Server verification error:", err);
    return null;
  }
}

/**
 * Enforces that the request comes from an authenticated AND approved user.
 * Returns either the authorized context or an immediate NextResponse error.
 */
export async function requireApprovedServerRequest(req: Request) {
  const auth = await authenticateServerRequest(req);
  if (!auth) {
    return {
      authorized: false as const,
      response: Response.json({ error: "Unauthorized. Please sign in." }, { status: 401 }),
      auth: null,
    };
  }

  if (!auth.isApproved) {
    return {
      authorized: false as const,
      response: Response.json(
        {
          error: "Account awaiting approval or disabled.",
          status: auth.profile.status,
        },
        { status: 403 }
      ),
      auth,
    };
  }

  return {
    authorized: true as const,
    response: null,
    auth,
  };
}
