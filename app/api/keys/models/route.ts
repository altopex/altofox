import { NextRequest, NextResponse } from "next/server";
import { ProviderType } from "@/lib/ai/types";
import { getProviderCredentials } from "@/lib/ai/keys";
import {
  fetchLiveProviderModels,
  CURATED_PROVIDER_MODELS,
  normalizeModelForProvider,
} from "@/lib/ai/provider-models";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const providerParam = (searchParams.get("provider") || "gemini").toLowerCase();
    const queryApiKey = searchParams.get("apiKey") || undefined;
    const queryBaseUrl = searchParams.get("baseUrl") || undefined;

    const provider = providerParam as ProviderType;
    let apiKey = queryApiKey?.trim();
    let baseUrl = queryBaseUrl?.trim();

    // If key not provided in query, look up stored credentials
    if (!apiKey) {
      try {
        const credentials = await getProviderCredentials(provider, undefined, baseUrl, undefined, undefined, undefined, false);
        apiKey = credentials.apiKey;
        baseUrl = credentials.baseUrl || baseUrl;
      } catch {
        // No stored key found; fall back to curated models
      }
    }

    let liveModels: string[] = [];
    if (apiKey) {
      liveModels = await fetchLiveProviderModels(provider, apiKey, baseUrl);
    }

    const curated = CURATED_PROVIDER_MODELS[provider] || [];
    const curatedIds = curated.map((m) => m.id);

    // Merge live models with curated presets
    const allModelsSet = new Set<string>();
    for (const m of liveModels) {
      allModelsSet.add(m);
    }
    for (const m of curatedIds) {
      allModelsSet.add(m);
    }

    const modelList = Array.from(allModelsSet);
    const defaultModel = normalizeModelForProvider(provider, modelList[0] || "");

    return NextResponse.json({
      success: true,
      provider,
      isLive: liveModels.length > 0,
      models: modelList,
      curatedModels: curated,
      defaultModel,
    });
  } catch (error) {
    console.error("Error fetching provider models:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch provider models",
      },
      { status: 500 }
    );
  }
}
