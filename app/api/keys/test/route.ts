import { NextRequest, NextResponse } from "next/server";
import { testProviderCapabilities } from "@/lib/ai/ai-engine";
import { getProviderProfile } from "@/lib/ai/provider-manager";
import { getProviderCredentials } from "@/lib/ai/keys";
import { ProviderType } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, provider, apiKey, baseUrl, model, organizationId, providerName, apiType } = body;

    // 1. If an ID is provided, look up the profile
    if (id) {
      const profile = await getProviderProfile(id);
      if (profile && (profile.apiKey || apiKey)) {
        const testApiKey = (apiKey || profile.apiKey || "").trim();
        const result = await testProviderCapabilities({
          ...profile,
          apiKey: testApiKey,
          model: model || profile.model,
          baseUrl: baseUrl || profile.baseUrl,
        });

        return NextResponse.json({
          success: result.success,
          message: result.message,
          latencyMs: result.latencyMs,
          capabilities: result.capabilities,
          model: result.model,
          availableModels: result.availableModels,
          providerId: result.providerId,
          providerName: result.providerName,
        });
      }
    }

    // 2. Direct or legacy credentials
    let keyToTest = (apiKey || "").trim();
    let urlToTest = (baseUrl || "").trim();
    let modelToTest = (model || "").trim();
    let orgToTest = (organizationId || "").trim();
    let nameToTest = (providerName || "").trim();
    const targetProvider = provider || (apiType === "gemini" ? "gemini" : apiType === "openrouter" ? "openrouter" : "openai");

    if (!keyToTest && provider) {
      try {
        const credentials = await getProviderCredentials(
          provider as ProviderType,
          undefined,
          baseUrl,
          model,
          organizationId,
          providerName
        );
        keyToTest = credentials.apiKey;
        urlToTest = credentials.baseUrl || urlToTest;
        modelToTest = credentials.defaultModel || modelToTest;
        orgToTest = credentials.organizationId || orgToTest;
        nameToTest = credentials.providerName || nameToTest;
      } catch (credErr) {
        return NextResponse.json(
          {
            success: false,
            message: credErr instanceof Error ? credErr.message : "No AI provider is configured. Please add your credentials in Settings.",
          },
          { status: 400 }
        );
      }
    }

    if (!keyToTest) {
      return NextResponse.json(
        { success: false, message: "API Key is required to test connection." },
        { status: 400 }
      );
    }

    const resolvedApiType =
      apiType ||
      (targetProvider === "gemini" ? "gemini" : targetProvider === "openrouter" ? "openrouter" : "openai-compatible");

    const result = await testProviderCapabilities({
      id: id || `test-${targetProvider}`,
      name: nameToTest || targetProvider.toUpperCase(),
      apiType: resolvedApiType,
      apiKey: keyToTest,
      baseUrl: urlToTest || undefined,
      model: modelToTest || undefined,
      organizationId: orgToTest || undefined,
    });

    return NextResponse.json({
      success: result.success,
      message: result.message,
      latencyMs: result.latencyMs,
      capabilities: result.capabilities,
      model: result.model,
      availableModels: result.availableModels,
      providerId: result.providerId,
      providerName: result.providerName,
    });
  } catch (error) {
    console.error("Test connection error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed.",
      },
      { status: 500 }
    );
  }
}

