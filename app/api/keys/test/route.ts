import { NextRequest, NextResponse } from "next/server";
import { createAIProvider } from "@/lib/ai/factory";
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

    // Use direct key if provided in request, otherwise check stored key
    let credentials: { apiKey: string; baseUrl?: string; defaultModel?: string };
    try {
      credentials = await getProviderCredentials(
        provider as ProviderType,
        apiKey,
        baseUrl,
        model
      );
    } catch (credErr) {
      return NextResponse.json(
        {
          success: false,
          error:
            credErr instanceof Error
              ? credErr.message
              : "No API key found to test.",
        },
        { status: 400 }
      );
    }

    const ai = createAIProvider(provider as ProviderType, {
      apiKey: credentials.apiKey,
      baseUrl: credentials.baseUrl,
      defaultModel: model || credentials.defaultModel,
    });

    const result = await ai.testConnection(model || credentials.defaultModel);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Test connection error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Connection test failed",
      },
      { status: 500 }
    );
  }
}
