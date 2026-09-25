import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, authenticateServerRequest } from "@/lib/supabase/server";

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

    const admin = getSupabaseAdminClient();

    // Update profile
    await admin.from("profiles").update({ role }).eq("id", userId);

    // Update auth metadata
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: { role },
    });

    // Log activity
    await admin.from("activity_log").insert({
      user_id: auth.user.id,
      user_name: auth.profile.full_name || "Owner",
      user_avatar: auth.profile.avatar_url,
      action: "edit",
      entity_type: "team",
      entity_id: userId,
      details: {
        description: `Updated member role to ${role}`,
        targetUserId: userId,
        newRole: role,
      },
    });

    return NextResponse.json({ success: true, message: `Member role updated to ${role}.` });
  } catch (err: any) {
    console.error("[Team] Role change error:", err);
    return NextResponse.json({ error: err.message || "Failed to update role" }, { status: 500 });
  }
}
