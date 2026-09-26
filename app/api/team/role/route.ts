import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/supabase/server";
import { getDbPool } from "@/lib/supabase/db-pool";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!auth.isOwner) {
      return NextResponse.json({ error: "Forbidden: Only the workspace owner can change member roles." }, { status: 403 });
    }

    const { userId, role } = await req.json();

    if (!userId || !["owner", "editor"].includes(role)) {
      return NextResponse.json({ error: "Invalid userId or role provided." }, { status: 400 });
    }

    if (userId === auth.user.id && role !== "owner") {
      return NextResponse.json({ error: "You cannot demote yourself from owner." }, { status: 400 });
    }

    const pool = getDbPool();

    // Update profile
    await pool.query(
      "UPDATE public.profiles SET role = $1, updated_at = now() WHERE id = $2::uuid;",
      [role, userId]
    );

    // Update auth metadata
    await pool.query(
      "UPDATE auth.users SET raw_user_meta_data = raw_user_meta_data || json_build_object('role', $1::text)::jsonb, updated_at = now() WHERE id = $2::uuid;",
      [role, userId]
    );

    // Log activity
    await pool.query(
      `INSERT INTO public.activity_log (user_id, user_name, user_avatar, action, entity_type, entity_id, details)
       VALUES ($1::uuid, $2, $3, 'edit', 'team', $4, $5::jsonb);`,
      [
        auth.user.id,
        auth.profile.full_name || "Owner",
        auth.profile.avatar_url,
        userId,
        JSON.stringify({
          description: `Updated member role to ${role}`,
          targetUserId: userId,
          newRole: role,
        }),
      ]
    );

    return NextResponse.json({ success: true, message: `Member role updated to ${role}.` });
  } catch (err: any) {
    console.error("[Team] Role change error:", err);
    return NextResponse.json({ error: err.message || "Failed to update role" }, { status: 500 });
  }
}
