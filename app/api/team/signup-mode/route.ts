import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, requireApprovedServerRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authCheck = await requireApprovedServerRequest(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const admin = getSupabaseAdminClient();
    const { data, error } = await admin
      .from("app_settings")
      .select("signup_mode, contact_email, google_auth_enabled")
      .limit(1)
      .single();

    if (error) throw error;

    return NextResponse.json({
      signup_mode: data?.signup_mode || "approval_required",
      contact_email: data?.contact_email || "support@altopex.com",
      google_auth_enabled: Boolean(data?.google_auth_enabled),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authCheck = await requireApprovedServerRequest(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    if (!authCheck.auth.isOwner) {
      return NextResponse.json({ error: "Only the workspace owner can configure sign-up modes." }, { status: 403 });
    }

    const body = await req.json();
    const { signupMode, contactEmail, googleAuthEnabled } = body;

    const validModes = ["approval_required", "invite_only", "open"];
    if (signupMode && !validModes.includes(signupMode)) {
      return NextResponse.json({ error: "Invalid sign-up mode" }, { status: 400 });
    }

    const admin = getSupabaseAdminClient();
    const updates: any = {
      updated_at: new Date().toISOString(),
      updated_by: authCheck.auth.user.id,
    };

    if (signupMode) updates.signup_mode = signupMode;
    if (contactEmail !== undefined) updates.contact_email = contactEmail.trim();
    if (googleAuthEnabled !== undefined) updates.google_auth_enabled = Boolean(googleAuthEnabled);

    // Get primary settings row
    const { data: current } = await admin.from("app_settings").select("id").limit(1).single();

    if (current?.id) {
      const { data, error } = await admin
        .from("app_settings")
        .update(updates)
        .eq("id", current.id)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, settings: data });
    } else {
      const { data, error } = await admin
        .from("app_settings")
        .insert(updates)
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json({ success: true, settings: data });
    }
  } catch (err: any) {
    console.error("[Team] Update signup mode error:", err);
    return NextResponse.json({ error: err.message || "Failed to update settings" }, { status: 500 });
  }
}
