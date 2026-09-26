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
      return NextResponse.json({ error: "Only the workspace owner can decline access requests." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, deletePermanently = false } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const pool = getDbPool();

    if (deletePermanently) {
      // Delete user records
      await pool.query("DELETE FROM auth.identities WHERE user_id = $1::uuid;", [userId]);
      await pool.query("DELETE FROM public.profiles WHERE id = $1::uuid;", [userId]);
      await pool.query("DELETE FROM auth.users WHERE id = $1::uuid;", [userId]);
    } else {
      // Mark as disabled
      await pool.query(
        "UPDATE public.profiles SET status = 'disabled', updated_at = now() WHERE id = $1::uuid;",
        [userId]
      );
    }

    // Record activity log
    await pool.query(
      `INSERT INTO public.activity_log (action, entity_type, entity_id, user_id, user_name, details)
       VALUES ('user_declined', 'team', $1, $2::uuid, $3, $4::jsonb);`,
      [
        userId,
        authCheck.auth.user.id,
        authCheck.auth.profile.full_name,
        JSON.stringify({
          declined_user_id: userId,
          action_type: deletePermanently ? "deleted" : "disabled",
          declined_at: new Date().toISOString(),
        }),
      ]
    );

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Team] Decline error:", err);
    return NextResponse.json({ error: err.message || "Failed to decline user" }, { status: 500 });
  }
}
