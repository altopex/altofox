import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdminClient, authenticateServerRequest } from "@/lib/supabase/server";
import { BRAND } from "@/config/brand";

export const dynamic = "force-dynamic";

/**
 * Masks an API key so only the last 4 characters are visible.
 */
function maskApiKey(key?: string): string {
  if (!key || key.length < 5) return key ? "••••" : "";
  const last4 = key.slice(-4);
  return `••••••••••••${last4}`;
}

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = getSupabaseAdminClient();
    const { data: settings } = await admin
      .from("app_settings")
      .select("api_keys, default_preferences, team_name")
      .single();

    const rawKeys = settings?.api_keys || {};
    const maskedKeys: Record<string, { configured: boolean; preview: string }> = {};

    const providers = [
      "openai",
      "gemini",
      "openrouter",
      "pexels",
      "pixabay",
      "serper",
      "dataforseo",
      "pagespeed",
    ];

    for (const p of providers) {
      const val = rawKeys[p];
      maskedKeys[p] = {
        configured: Boolean(val && val.length > 0),
        preview: maskApiKey(val),
      };
    }

    return NextResponse.json({
      keys: maskedKeys,
      isOwner: auth.isOwner,
      teamName: settings?.team_name || `${BRAND.name} Team`,
      defaultPreferences: settings?.default_preferences || {},
    });
  } catch (err: any) {
    console.error("[Settings] Get keys error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!auth.isOwner) {
      return NextResponse.json(
        { error: "Forbidden: Only the workspace owner can manage shared API keys." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { provider, key, defaultPreferences, teamName } = body;

    const admin = getSupabaseAdminClient();

    // Fetch existing settings
    const { data: existing } = await admin
      .from("app_settings")
      .select("*")
      .single();

    const currentKeys = existing?.api_keys || {};

    if (provider && typeof key === "string") {
      if (key.trim() === "") {
        delete currentKeys[provider];
      } else if (!key.includes("••••")) {
        // Only update if not the masked placeholder
        currentKeys[provider] = key.trim();
      }
    }

    const updates: any = {
      api_keys: currentKeys,
      updated_by: auth.user.id,
      updated_at: new Date().toISOString(),
    };

    if (defaultPreferences) updates.default_preferences = defaultPreferences;
    if (teamName) updates.team_name = teamName;

    const { error } = await admin
      .from("app_settings")
      .update(updates)
      .eq("id", existing?.id || (await admin.from("app_settings").select("id").limit(1)).data?.[0]?.id);

    if (error) throw error;

    // Log activity
    await admin.from("activity_log").insert({
      user_id: auth.user.id,
      user_name: auth.profile.full_name || "Owner",
      user_avatar: auth.profile.avatar_url,
      action: "edit",
      entity_type: "settings",
      entity_id: "api_keys",
      details: {
        description: `${auth.profile.full_name || "Owner"} updated shared workspace API configuration for ${provider || "team preferences"}`,
      },
    });

    return NextResponse.json({
      success: true,
      message: "API keys updated and securely stored in team settings.",
    });
  } catch (err: any) {
    console.error("[Settings] Save keys error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
