import { createClient, SupabaseClient, User } from "@supabase/supabase-js";
import { Profile } from "./types";

/**
 * Server-only admin client with secret key.
 * Used for admin auth invites, role management, and scheduled backups.
 * NEVER exposed to or called from client components.
 */
export function getSupabaseAdminClient(): SupabaseClient {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    "https://udxjxkkcpdrlceucxqfk.supabase.co";

  const secretKey = process.env.SUPABASE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("SUPABASE_SECRET_KEY is not defined in server environment variables.");
  }

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
    "https://udxjxkkcpdrlceucxqfk.supabase.co";

  const anonKey =
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";

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
 * Authenticates an incoming API request by extracting and verifying the Bearer token or cookie session.
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
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.replace("Bearer ", "").trim();
  }

  // 2. Fallback to cookies (altofox_token)
  if (!token) {
    const cookieHeader = req.headers.get("cookie");
    if (cookieHeader) {
      const match = cookieHeader.match(/altofox_token=([^;]+)/);
      if (match && match[1]) {
        token = decodeURIComponent(match[1]).trim();
      }
    }
  }

  if (!token) return null;

  try {
    const admin = getSupabaseAdminClient();
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      return null;
    }

    const user = userData.user;

    // Fetch user profile
    const { data: profileData } = await admin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const profile: Profile = profileData || {
      id: user.id,
      full_name: (user.user_metadata?.full_name as string) || user.email?.split("@")[0] || "User",
      avatar_url: (user.user_metadata?.avatar_url as string) || null,
      role: (user.user_metadata?.role as any) || "editor",
      status: (user.user_metadata?.status as any) || "pending",
      company_name: (user.user_metadata?.company_name as string) || null,
      last_active_at: new Date().toISOString(),
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at,
      email: user.email,
    };

    const isApproved = profile.status === "approved";
    const isOwner = profile.role === "owner" && isApproved;

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
