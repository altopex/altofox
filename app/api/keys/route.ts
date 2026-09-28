import { NextRequest, NextResponse } from "next/server";
import {
  listConfiguredProviders,
  saveProviderKey,
  deleteProviderKey,
} from "@/lib/ai/keys";
import { ProviderType, PROVIDER_PRESETS } from "@/lib/ai/types";
import {
  listProviderProfiles,
  saveProviderProfile,
  deleteProviderProfile,
  updateProviderSettings,
  PRESET_PROVIDERS_TEMPLATE,
} from "@/lib/ai/provider-manager";

export const dynamic = "force-dynamic";

// GET /api/keys - List all provider profiles, settings, and legacy presets
export async function GET() {
  try {
    const [{ profiles, settings }, legacyProviders] = await Promise.all([
      listProviderProfiles(),
      listConfiguredProviders().catch(() => []),
    ]);

    return NextResponse.json({
      success: true,
      profiles,
      settings,
      providers: legacyProviders,
      presets: PROVIDER_PRESETS,
      presetTemplates: PRESET_PROVIDERS_TEMPLATE,
    });
  } catch (error) {
    console.error("Error listing keys/profiles:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load keys",
      },
      { status: 500 }
    );
  }
}

// POST /api/keys - Save or update a provider profile or legacy key
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if it's a provider profile payload
    if (body.profile || (body.name && (body.apiKey || body.apiType))) {
      const p = body.profile || body;
      if (!p.name || !p.name.trim()) {
        return NextResponse.json(
          { success: false, error: "Provider name is required." },
          { status: 400 }
        );
      }

      const saved = await saveProviderProfile({
        id: p.id,
        name: p.name.trim(),
        apiType: p.apiType || "openai-compatible",
        baseUrl: p.baseUrl?.trim(),
        apiKey: p.apiKey?.trim(),
        model: p.model?.trim() || "default",
        availableModels: p.availableModels,
        organizationId: p.organizationId?.trim(),
        notes: p.notes?.trim(),
        enabled: p.enabled !== undefined ? p.enabled : true,
      });

      // If it corresponds to a legacy preset, sync legacy table as well
      if (p.presetId && PROVIDER_PRESETS[p.presetId as ProviderType] && p.apiKey) {
        try {
          await saveProviderKey(
            p.presetId as ProviderType,
            p.apiKey.trim(),
            p.baseUrl?.trim(),
            p.model?.trim(),
            p.organizationId?.trim(),
            p.name?.trim()
          );
        } catch {}
      }

      return NextResponse.json({
        success: true,
        message: `Successfully saved ${saved.name}!`,
        profile: {
          ...saved,
          apiKey: undefined,
          hasKey: Boolean(saved.apiKey),
        },
      });
    }

    // Legacy format: { provider, apiKey, baseUrl, defaultModel, organizationId, providerName }
    const { provider, apiKey, baseUrl, defaultModel, organizationId, providerName } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: "Provider and API Key are required." },
        { status: 400 }
      );
    }

    // Save in legacy system
    if (PROVIDER_PRESETS[provider as ProviderType]) {
      await saveProviderKey(
        provider as ProviderType,
        apiKey.trim(),
        baseUrl?.trim(),
        defaultModel?.trim(),
        organizationId?.trim(),
        providerName?.trim()
      );
    }

    // Also sync into provider manager
    const saved = await saveProviderProfile({
      id: `${provider}-default`,
      name: providerName || PROVIDER_PRESETS[provider as ProviderType]?.name || provider.toUpperCase(),
      apiType: provider === "gemini" ? "gemini" : provider === "openrouter" ? "openrouter" : "openai-compatible",
      baseUrl: baseUrl?.trim(),
      apiKey: apiKey.trim(),
      model: defaultModel?.trim() || "gpt-4o",
      organizationId: organizationId?.trim(),
    });

    const displayName = providerName || PROVIDER_PRESETS[provider as ProviderType]?.name || provider;
    return NextResponse.json({
      success: true,
      message: `Successfully connected ${displayName}!`,
      profile: saved,
    });
  } catch (error) {
    console.error("Error saving key:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save key",
      },
      { status: 500 }
    );
  }
}

// PUT /api/keys - Update AI Provider Manager settings (active provider, fallback order, etc.)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = body.settings || body;

    const updated = await updateProviderSettings(settings);

    return NextResponse.json({
      success: true,
      message: "AI settings updated successfully.",
      settings: updated,
    });
  } catch (error) {
    console.error("Error updating AI settings:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update AI settings",
      },
      { status: 500 }
    );
  }
}

// DELETE /api/keys - Remove a saved key or provider profile
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const provider = searchParams.get("provider") as ProviderType;

    if (!id && !provider) {
      return NextResponse.json(
        { success: false, error: "Either id or provider parameter is required." },
        { status: 400 }
      );
    }

    if (id) {
      await deleteProviderProfile(id);
    }

    if (provider) {
      await deleteProviderKey(provider);
      await deleteProviderProfile(`${provider}-default`);
    }

    return NextResponse.json({
      success: true,
      message: `Removed provider successfully.`,
    });
  } catch (error) {
    console.error("Error deleting key:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to remove key",
      },
      { status: 500 }
    );
  }
}

