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
      return NextResponse.json({ error: "Forbidden: Only the workspace owner can remove team members." }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }

    if (userId === auth.user.id) {
      return NextResponse.json({ error: "You cannot remove yourself from the workspace." }, { status: 400 });
    }

    const pool = getDbPool();

    // Delete user from identities, profiles, and auth.users
    await pool.query("DELETE FROM auth.identities WHERE user_id = $1::uuid;", [userId]);
    await pool.query("DELETE FROM public.profiles WHERE id = $1::uuid;", [userId]);
    await pool.query("DELETE FROM auth.users WHERE id = $1::uuid;", [userId]);

    // Log activity
    await pool.query(
      `INSERT INTO public.activity_log (user_id, user_name, user_avatar, action, entity_type, entity_id, details)
       VALUES ($1::uuid, $2, $3, 'delete', 'team', $4, $5::jsonb);`,
      [
        auth.user.id,
        auth.profile.full_name || "Owner",
        auth.profile.avatar_url,
        userId,
        JSON.stringify({
          description: `Removed member ${userId} from the team workspace`,
          removedUserId: userId,
        }),
      ]
    );

    return NextResponse.json({ success: true, message: "Member removed from workspace." });
  } catch (err: any) {
    console.error("[Team] Remove error:", err);
    return NextResponse.json({ error: err.message || "Failed to remove member" }, { status: 500 });
  }
}
