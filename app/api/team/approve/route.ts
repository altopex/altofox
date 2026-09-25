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
      return NextResponse.json({ error: "Only the workspace owner can approve access requests." }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role = "editor" } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();

    // Update profile status and role
    const { data, error } = await admin
      .from("profiles")
      .update({
        status: "approved",
        role: role === "owner" ? "owner" : "editor",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to approve user: ${error.message}`);
    }

    // Record activity log
    await admin.from("activity_log").insert({
      action: "user_approved",
      entity_type: "team",
      entity_id: userId,
      user_id: authCheck.auth.user.id,
      user_name: authCheck.auth.profile.full_name,
      details: {
        approved_user_id: userId,
        assigned_role: role,
        approved_at: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true, profile: data });
  } catch (err: any) {
    console.error("[Team] Approve error:", err);
    return NextResponse.json({ error: err.message || "Failed to approve user" }, { status: 500 });
  }
}
