import { NextRequest, NextResponse } from "next/server";
import { getProviderCredentials } from "@/lib/ai/keys";
import { gatewayRequest } from "@/lib/ai/provider-gateway";
import { ProviderType } from "@/lib/ai/types";
import {
  CHAT_GENERATOR_SYSTEM_PROMPT,
  buildChatGeneratorUserPrompt,
  parseChatGeneratorResponse,
} from "@/lib/chat-generator/generator-prompt";
import { getThemeById, THEMES } from "@/lib/themes";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    const body = await req.json();
    const {
      prompt,
      themeId = "modern-pro",
      outputType = "single",
      provider = "gemini",
      model,
      apiKey: directKey,
      baseUrl: directBaseUrl,
      organizationId: directOrgId,
      providerName: directProviderName,
    } = body || {};

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: "Please provide a prompt describing the website you want to generate." },
        { status: 400 }
      );
    }

    const cleanPrompt = prompt.trim();
    const targetProvider: ProviderType = (provider as ProviderType) || "gemini";
    const selectedTheme = getThemeById(themeId) || THEMES[0];

    // 1. Resolve credentials using RankLocal's existing unified system
    const creds = await getProviderCredentials(
      targetProvider,
      directKey,
      directBaseUrl,
      model,
      directOrgId,
      directProviderName
    );

    if (!creds || !creds.apiKey) {
      return NextResponse.json(
        {
          success: false,
          error: `No API key configured for ${targetProvider.toUpperCase()}. Please configure your API key in Settings.`,
          code: "MISSING_API_KEY",
        },
        { status: 400 }
      );
    }

    // 2. Build system and user prompts
    const userPrompt = buildChatGeneratorUserPrompt({
      prompt: cleanPrompt,
      themeId,
      outputType,
    });

    const activeModel = model || creds.defaultModel || (targetProvider === "gemini" ? "gemini-1.5-pro" : "gpt-4o");

    // 3. Execute request through RankLocal's centralized AI Provider Gateway
    const aiResponse = await gatewayRequest({
      prompt: userPrompt,
      systemPrompt: CHAT_GENERATOR_SYSTEM_PROMPT,
      model: activeModel,
      maxTokens: 16000,
      timeoutMs: 65000,
      feature: "website-generation",
      directCredentials: {
        provider: targetProvider,
        apiKey: creds.apiKey,
        baseUrl: creds.baseUrl,
        model: activeModel,
        organizationId: creds.organizationId,
        providerName: creds.providerName,
      },
    });

    if (!aiResponse || !aiResponse.text) {
      throw new Error("Received empty response from AI provider.");
    }

    // 4. Parse output into structured static files
    const parsedResult = parseChatGeneratorResponse(
      aiResponse.text,
      cleanPrompt.slice(0, 40),
      selectedTheme.name
    );

    const latencyMs = Date.now() - startTime;
    const htmlFilesCount = parsedResult.files.filter((f) => f.path.endsWith(".html")).length;

    // 5. Return directly to client (ZERO database calls, zero Supabase persistence)
    return NextResponse.json({
      success: true,
      result: parsedResult,
      stats: {
        totalFiles: parsedResult.files.length,
        htmlFiles: htmlFilesCount,
        provider: targetProvider,
        model: aiResponse.model || activeModel,
        latencyMs,
        generatedAt: Date.now(),
      },
    });
  } catch (error: any) {
    console.error("[Chat Generator API] Error:", error);
    const latencyMs = Date.now() - startTime;
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to generate website from prompt.",
        latencyMs,
      },
      { status: 500 }
    );
  }
}
