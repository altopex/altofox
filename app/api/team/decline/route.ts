import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, requireApprovedServerRequest } from "@/lib/supabase/server";

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

    const admin = getSupabaseAdminClient();

    if (deletePermanently) {
      // Delete auth user completely
      await admin.auth.admin.deleteUser(userId);
      await admin.from("profiles").delete().eq("id", userId);
    } else {
      // Mark as disabled
      await admin
        .from("profiles")
        .update({
          status: "disabled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);
    }

    // Record activity log
    await admin.from("activity_log").insert({
      action: "user_declined",
      entity_type: "team",
      entity_id: userId,
      user_id: authCheck.auth.user.id,
      user_name: authCheck.auth.profile.full_name,
      details: {
        declined_user_id: userId,
        action_type: deletePermanently ? "deleted" : "disabled",
        declined_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Team] Decline error:", err);
    return NextResponse.json({ error: err.message || "Failed to decline user" }, { status: 500 });
  }
}
