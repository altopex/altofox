import { NextRequest, NextResponse } from "next/server";
import {
  listConfiguredProviders,
  saveProviderKey,
  deleteProviderKey,
} from "@/lib/ai/keys";
import { ProviderType, PROVIDER_PRESETS } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

// GET /api/keys - List all providers with configuration status
export async function GET() {
  try {
    const providers = await listConfiguredProviders();
    return NextResponse.json({
      success: true,
      providers,
      presets: PROVIDER_PRESETS,
    });
  } catch (error) {
    console.error("Error listing keys:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load keys",
      },
      { status: 500 }
    );
  }
}

// POST /api/keys - Save or update an API key
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, apiKey, baseUrl, defaultModel } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: "Provider and API Key are required." },
        { status: 400 }
      );
    }

    if (!PROVIDER_PRESETS[provider as ProviderType]) {
      return NextResponse.json(
        { success: false, error: `Invalid provider: ${provider}` },
        { status: 400 }
      );
    }

    await saveProviderKey(
      provider as ProviderType,
      apiKey.trim(),
      baseUrl?.trim(),
      defaultModel?.trim()
    );

    return NextResponse.json({
      success: true,
      message: `Successfully connected ${PROVIDER_PRESETS[provider as ProviderType]?.name || provider}!`,
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

// DELETE /api/keys - Remove a saved key
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const provider = searchParams.get("provider") as ProviderType;

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider parameter is required" },
        { status: 400 }
      );
    }

    await deleteProviderKey(provider);
    return NextResponse.json({
      success: true,
      message: `Removed key for ${provider}`,
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
