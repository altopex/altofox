import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAIProvider } from "@/lib/ai/factory";
import { getProviderCredentials } from "@/lib/ai/keys";
import { ProviderType, PROVIDER_PRESETS } from "@/lib/ai/types";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/generator/prompt";
import { extractAndParseJSON, validateGeneratedWebsite } from "@/lib/generator/validator";

export const maxDuration = 120; // 2 minutes timeout for large website generation
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt,
      provider = "openai",
      model,
      name,
      serviceCategory,
      targetLocation,
      focusKeywords,
      secondaryKeywords,
      phone,
      apiKey,
      baseUrl,
      theme,
    } = body;

    const instructionsText = (prompt || "").trim();
    if (!instructionsText && !serviceCategory && !targetLocation && !focusKeywords) {
      return NextResponse.json(
        { success: false, error: "Please provide a description, service, or target location for the website." },
        { status: 400 }
      );
    }

    const providerType = provider as ProviderType;
    if (!PROVIDER_PRESETS[providerType]) {
      return NextResponse.json(
        { success: false, error: `Invalid provider: ${provider}` },
        { status: 400 }
      );
    }

    // 1. Get credentials for the provider
    let creds;
    try {
      creds = await getProviderCredentials(providerType, apiKey, baseUrl, model);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : `No API key found for ${PROVIDER_PRESETS[providerType]?.name || provider}. Please connect your API key in Settings.`,
        },
        { status: 401 }
      );
    }

    // 2. Select model
    const targetModel =
      model || creds.defaultModel || PROVIDER_PRESETS[providerType]?.defaultModel;

    // 3. Instantiate AI provider
    const ai = createAIProvider(providerType, {
      apiKey: creds.apiKey,
      baseUrl: creds.baseUrl,
      defaultModel: targetModel,
    });

    // 4. Construct prompts
    const userPrompt = buildUserPrompt({
      name: name || (targetLocation && serviceCategory ? `${targetLocation} ${serviceCategory}` : "Local Home Service Website"),
      serviceCategory,
      targetLocation,
      focusKeywords,
      secondaryKeywords,
      phone,
      instructions: instructionsText,
      theme,
    });

    console.log(`[Generate] Calling ${providerType} (${targetModel}) for: ${userPrompt.slice(0, 80)}...`);

    // 5. Call AI
    const result = await ai.generate({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      model: targetModel,
      temperature: 0.7,
      maxTokens: 8192,
    });

    // 6. Parse and validate generated static website files
    let validated;
    try {
      const parsed = extractAndParseJSON(result.text);
      validated = validateGeneratedWebsite(parsed);
    } catch (parseError) {
      console.error("AI Output parsing error:", parseError, "\nRaw output snippet:", result.text.slice(0, 500));
      return NextResponse.json(
        {
          success: false,
          error: `AI returned malformed website structure: ${parseError instanceof Error ? parseError.message : "Parse failed"}. Try generating again.`,
          rawText: result.text.slice(0, 1000),
        },
        { status: 502 }
      );
    }

    // Determine readable project name
    const projectName =
      (name && name.trim()) ||
      (instructionsText && instructionsText.split(" ").slice(0, 4).join(" ").replace(/[^a-zA-Z0-9 ]/g, "")) ||
      (targetLocation && serviceCategory ? `${targetLocation} ${serviceCategory}` : "Static Website");

    // 7. Store Project and Files in Database
    const project = await db.project.create({
      data: {
        name: projectName,
        prompt: instructionsText || `${targetLocation || ""} ${serviceCategory || ""}`.trim() || projectName,
        provider: providerType,
        model: targetModel,
        status: "ready",
        notes: validated.notes || "Complete static website generated with HTML, CSS, and JS.",
        files: {
          create: validated.files.map((f) => ({
            path: f.path,
            content: f.content,
            mimeType: f.path.endsWith(".html")
              ? "text/html"
              : f.path.endsWith(".css")
              ? "text/css"
              : f.path.endsWith(".js")
              ? "application/javascript"
              : "text/plain",
          })),
        },
      },
      include: {
        files: true,
      },
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      name: project.name,
      notes: project.notes,
      provider: project.provider,
      model: project.model,
      createdAt: project.createdAt,
      files: project.files.map((f) => ({
        path: f.path,
        content: f.content,
        mimeType: f.mimeType,
      })),
      downloadUrl: `/api/projects/${project.id}/download`,
    });
  } catch (error) {
    console.error("Website generation failed:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate website.",
      },
      { status: 500 }
    );
  }
}
