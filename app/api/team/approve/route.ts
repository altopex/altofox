import { NextRequest, NextResponse } from "next/server";
import { requireApprovedServerRequest } from "@/lib/supabase/server";
import { getDbPool } from "@/lib/supabase/db-pool";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireApprovedServerRequest(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    if (!authCheck.auth.isOwner) {
      return NextResponse.json({ error: "Only the workspace owner can approve access requests." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role = "editor" } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const assignedRole = role === "owner" ? "owner" : "editor";
    const pool = getDbPool();

    // Update profile status and role
    const res = await pool.query(
      `UPDATE public.profiles
       SET status = 'approved', role = $1, updated_at = now()
       WHERE id = $2::uuid
       RETURNING *;`,
      [assignedRole, userId]
    );

    // Sync auth metadata
    await pool.query(
      `UPDATE auth.users 
       SET raw_user_meta_data = raw_user_meta_data || json_build_object('role', $1::text, 'status', 'approved')::jsonb,
           updated_at = now()
       WHERE id = $2::uuid;`,
      [assignedRole, userId]
    );

    // Record activity log
    await pool.query(
      `INSERT INTO public.activity_log (action, entity_type, entity_id, user_id, user_name, user_avatar, details)
       VALUES ('user_approved', 'team', $1, $2::uuid, $3, $4, $5::jsonb);`,
      [
        userId,
        authCheck.auth.user.id,
        authCheck.auth.profile.full_name,
        authCheck.auth.profile.avatar_url,
        JSON.stringify({
          approved_user_id: userId,
          assigned_role: assignedRole,
          approved_at: new Date().toISOString(),
        }),
      ]
    );

    return NextResponse.json({ success: true, profile: res.rows[0] });
  } catch (err: any) {
    console.error("[Team] Approve error:", err);
    return NextResponse.json({ error: err.message || "Failed to approve user" }, { status: 500 });
  }
}
