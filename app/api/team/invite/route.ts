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
      return NextResponse.json({ error: "Forbidden: Only the workspace owner can invite team members." }, { status: 403 });
    }

    const body = await req.json();
    const { email, fullName, role = "editor" } = body;

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const assignedRole = role === "owner" ? "owner" : "editor";
    const admin = getSupabaseAdminClient();

    // Invite user via Supabase Auth Admin API
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email.trim(), {
      data: {
        full_name: fullName?.trim() || email.split("@")[0],
        role: assignedRole,
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Ensure profile row exists
    if (data?.user) {
      await admin.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName?.trim() || email.split("@")[0],
        role: assignedRole,
        last_active_at: new Date().toISOString(),
      });
    }

    // Log activity
    await admin.from("activity_log").insert({
      user_id: auth.user.id,
      user_name: auth.profile.full_name || "Owner",
      user_avatar: auth.profile.avatar_url,
      action: "create",
      entity_type: "team",
      entity_id: data.user.id,
      details: {
        description: `${auth.profile.full_name || "Owner"} invited ${email} as ${assignedRole}`,
        invitedEmail: email,
        invitedRole: assignedRole,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Invitation successfully sent to ${email}`,
      user: data.user,
    });
  } catch (err: any) {
    console.error("[Team] Invite error:", err);
    return NextResponse.json({ error: err.message || "Failed to invite user" }, { status: 500 });
  }
}
