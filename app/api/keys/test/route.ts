import { NextRequest, NextResponse } from "next/server";
import { testConnection } from "@/lib/ai/generate-website";
import { getProviderCredentials } from "@/lib/ai/keys";
import { ProviderType } from "@/lib/ai/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, apiKey, baseUrl, model } = body;

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

    if (!keyToTest) {
      try {
        const credentials = await getProviderCredentials(
          provider as ProviderType,
          undefined,
          baseUrl,
          model
        );
        keyToTest = credentials.apiKey;
        urlToTest = credentials.baseUrl || urlToTest;
        modelToTest = credentials.defaultModel || modelToTest;
      } catch (credErr) {
        return NextResponse.json(
          {
            success: false,
            message: credErr instanceof Error ? credErr.message : "No API key found to test.",
          },
          { status: 400 }
        );
      }
    }

    const result = await testConnection({
      provider,
      apiKey: keyToTest,
      baseUrl: urlToTest,
      model: modelToTest,
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
