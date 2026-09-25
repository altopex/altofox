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
      return NextResponse.json({ error: "Forbidden: Only the workspace owner can remove team members." }, { status: 403 });
    }

    const { userId } = await req.json();

    if (!userId) {
      return NextResponse.json({ error: "userId is required." }, { status: 400 });
    }

    if (userId === auth.user.id) {
      return NextResponse.json({ error: "You cannot remove yourself from the workspace." }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();

    // Delete user in Supabase auth (cascade deletes profile due to ON DELETE CASCADE)
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Log activity
    await admin.from("activity_log").insert({
      user_id: auth.user.id,
      user_name: auth.profile.full_name || "Owner",
      user_avatar: auth.profile.avatar_url,
      action: "delete",
      entity_type: "team",
      entity_id: userId,
      details: {
        description: `Removed member ${userId} from the team workspace`,
        removedUserId: userId,
      },
    });

    return NextResponse.json({ success: true, message: "Member removed from workspace." });
  } catch (err: any) {
    console.error("[Team] Remove error:", err);
    return NextResponse.json({ error: err.message || "Failed to remove member" }, { status: 500 });
  }
}
