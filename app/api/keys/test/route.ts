import { NextRequest, NextResponse } from "next/server";
import { testConnection } from "@/lib/ai/generate-website";
import { getProviderCredentials } from "@/lib/ai/keys";
import { ProviderType } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, apiKey, baseUrl, model, organizationId, providerName } = body;

    if (!provider) {
      return NextResponse.json(
        { success: false, error: "Provider is required." },
        { status: 400 }
      );
    }

    // Resolve key from request body, localStorage pass-through, or stored/env
    let keyToTest = (apiKey || "").trim();
    let urlToTest = (baseUrl || "").trim();
    let modelToTest = (model || "").trim();
    let orgToTest = (organizationId || "").trim();
    let nameToTest = (providerName || "").trim();

    if (!keyToTest) {
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

    const result = await testConnection({
      provider,
      apiKey: keyToTest,
      baseUrl: urlToTest || undefined,
      model: modelToTest || undefined,
      organizationId: orgToTest || undefined,
      providerName: nameToTest || undefined,
    });

    return NextResponse.json(result);
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
