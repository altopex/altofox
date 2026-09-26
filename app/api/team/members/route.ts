import { NextRequest, NextResponse } from "next/server";
import { requireApprovedServerRequest } from "@/lib/supabase/server";
import { getDbPool } from "@/lib/supabase/db-pool";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authCheck = await requireApprovedServerRequest(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const auth = authCheck.auth;
    const pool = getDbPool();

    // Fetch all members with their auth & profile info in a single direct query
    const res = await pool.query(`
      SELECT 
        u.id,
        u.email,
        u.created_at,
        u.last_sign_in_at,
        p.full_name,
        p.avatar_url,
        p.role,
        p.status,
        p.company_name,
        p.plan,
        p.website_limit,
        p.last_active_at
      FROM auth.users u
      LEFT JOIN public.profiles p ON u.id = p.id
      ORDER BY u.created_at ASC;
    `);

    const members = res.rows.map((row) => ({
      id: row.id,
      email: row.email || "",
      full_name: row.full_name || row.email?.split("@")[0] || "Team Member",
      avatar_url: row.avatar_url || "",
      role: row.role || "editor",
      status: row.status || "pending",
      company_name: row.company_name || null,
      plan: row.plan || (row.role === "owner" ? "unlimited" : "starter"),
      website_limit: row.website_limit ?? (row.role === "owner" ? 999999 : 5),
      last_active_at: row.last_active_at || row.last_sign_in_at || row.created_at,
      created_at: row.created_at,
    }));

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
    return NextResponse.json(
      { error: err.message || "Failed to load team members" },
      { status: 500 }
    );
  }
}
