import { NextResponse } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase/server";
import { BRAND } from "@/config/brand";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const admin = getSupabaseAdminClient();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Settings timeout")), 500)
    );
    const queryPromise = admin
      .from("app_settings")
      .select("signup_mode, contact_email, google_auth_enabled")
      .limit(1)
      .single();

    const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as any;

    if (error || !data) {
      return NextResponse.json({
        signup_mode: "approval_required",
        contact_email: BRAND.supportEmail,
        google_auth_enabled: false,
      });
    }

    return NextResponse.json({
      signup_mode: data.signup_mode || "approval_required",
      contact_email: data.contact_email || BRAND.supportEmail,
      google_auth_enabled: Boolean(data.google_auth_enabled),
    });
  } catch (err: any) {
    return NextResponse.json({
      signup_mode: "approval_required",
      contact_email: BRAND.supportEmail,
      google_auth_enabled: false,
    });
  }
}
