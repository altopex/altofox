import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, requireApprovedServerRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authCheck = await requireApprovedServerRequest(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const auth = authCheck.auth;
    const admin = getSupabaseAdminClient();

    // Fetch auth users
    const { data: usersData, error: usersError } = await admin.auth.admin.listUsers({
      perPage: 100,
    });

    if (usersError) {
      throw new Error(`Failed to list users: ${usersError.message}`);
    }

    // Fetch profiles
    const { data: profiles, error: profilesError } = await admin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: true });

    if (profilesError) {
      throw new Error(`Failed to list profiles: ${profilesError.message}`);
    }

    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

    const members = (usersData.users || []).map((u) => {
      const p = profileMap.get(u.id);
      return {
        id: u.id,
        email: u.email || "",
        full_name: p?.full_name || (u.user_metadata?.full_name as string) || u.email?.split("@")[0] || "Team Member",
        avatar_url: p?.avatar_url || (u.user_metadata?.avatar_url as string) || "",
        role: p?.role || (u.user_metadata?.role as string) || "editor",
        status: p?.status || "pending",
        company_name: p?.company_name || (u.user_metadata?.company_name as string) || null,
        plan: p?.plan || (u.user_metadata?.plan as string) || (p?.role === "owner" ? "unlimited" : "starter"),
        website_limit: p?.website_limit ?? (u.user_metadata?.website_limit as number) ?? (p?.role === "owner" ? 999999 : 5),
        last_active_at: p?.last_active_at || u.last_sign_in_at || u.created_at,
        created_at: u.created_at,
      };
    });

    const pendingRequests = members.filter((m) => m.status === "pending");
    const approvedMembers = members.filter((m) => m.status === "approved");

    return NextResponse.json({
      members,
      approvedMembers,
      pendingRequests,
      pendingCount: pendingRequests.length,
      isOwner: auth.isOwner,
    });
  } catch (err: any) {
    console.error("[Team] Get members error:", err);
    return NextResponse.json({ error: err.message || "Failed to load team members" }, { status: 500 });
  }
}
