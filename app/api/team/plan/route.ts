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
      return NextResponse.json(
        { error: "Forbidden: Only the workspace owner can modify user plans and limits." },
        { status: 403 }
      );
    }

    const { userId, plan, websiteLimit } = await req.json();

    if (!userId || !["starter", "agency", "unlimited"].includes(plan)) {
      return NextResponse.json({ error: "Invalid userId or plan provided." }, { status: 400 });
    }

    const parsedLimit =
      plan === "unlimited"
        ? 999999
        : typeof websiteLimit === "number" && websiteLimit > 0
        ? websiteLimit
        : plan === "agency"
        ? 30
        : 5;

    const admin = getSupabaseAdminClient();

    // 1. Update profiles table
    await admin
      .from("profiles")
      .update({
        plan,
        website_limit: parsedLimit,
      })
      .eq("id", userId);

    // 2. Update auth metadata
    await admin.auth.admin.updateUserById(userId, {
      user_metadata: {
        plan,
        website_limit: parsedLimit,
      },
    });

    // 3. Log activity
    await admin.from("activity_log").insert({
      user_id: auth.user.id,
      user_name: auth.profile.full_name || "Owner",
      user_avatar: auth.profile.avatar_url,
      action: "edit",
      entity_type: "team",
      entity_id: userId,
      details: {
        description: `Updated member plan to ${plan} (${parsedLimit} websites)`,
        targetUserId: userId,
        newPlan: plan,
        websiteLimit: parsedLimit,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Member plan updated to ${plan} (${parsedLimit} websites).`,
      plan,
      websiteLimit: parsedLimit,
    });
  } catch (err: any) {
    console.error("[Team] Plan update error:", err);
    return NextResponse.json({ error: err.message || "Failed to update plan" }, { status: 500 });
  }
}
