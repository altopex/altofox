import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createAIProvider } from "@/lib/ai/factory";
import { getProviderCredentials } from "@/lib/ai/keys";
import { ProviderType, PROVIDER_PRESETS } from "@/lib/ai/types";
import { SYSTEM_PROMPT } from "@/lib/generator/prompt";
import { extractAndParseJSON, validateGeneratedWebsite } from "@/lib/generator/validator";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, instruction, provider, model, apiKey } = body;

    if (!projectId || !instruction || !instruction.trim()) {
      return NextResponse.json(
        { success: false, error: "Project ID and change instructions are required." },
        { status: 400 }
      );
    }

    // 1. Fetch current project and files
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { files: true },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 }
      );
    }

    const providerType = (provider || project.provider || "openai") as ProviderType;
    let creds;
    try {
      creds = await getProviderCredentials(providerType, apiKey);
    } catch (err) {
      return NextResponse.json(
        {
          success: false,
          error:
            err instanceof Error
              ? err.message
              : `No API key configured for ${PROVIDER_PRESETS[providerType]?.name || providerType}.`,
        },
        { status: 401 }
      );
    }

    const targetModel =
      model || project.model || creds.defaultModel || PROVIDER_PRESETS[providerType]?.defaultModel;

    const ai = createAIProvider(providerType, {
      apiKey: creds.apiKey,
      baseUrl: creds.baseUrl,
      defaultModel: targetModel,
    });

    // 2. Format existing files for context
    const currentFilesSummary = project.files
      .map((f) => `=== FILE: ${f.path} ===\n${f.content}\n=== END FILE ===`)
      .join("\n\n");

    const userPrompt = `
We have an existing static website with the following files:

${currentFilesSummary}

USER REQUEST FOR EDITS / ENHANCEMENTS:
${instruction.trim()}

Please update the website files according to the user's request. Maintain all working features, styling quality, and zero-build HTML/CSS/JS architecture.
Return the complete updated files strictly in the required JSON format:
{
  "files": [
    { "path": "index.html", "content": "..." },
    { "path": "styles.css", "content": "..." },
    { "path": "script.js", "content": "..." }
  ],
  "notes": "Brief explanation of the changes made"
}
`;

    console.log(`[Refine] Updating project ${projectId} with: ${instruction.slice(0, 50)}...`);

    // 3. Call AI
    const result = await ai.generate({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      model: targetModel,
      temperature: 0.5,
      maxTokens: 8192,
    });

    // 4. Validate output
    const parsed = extractAndParseJSON(result.text);
    const validated = validateGeneratedWebsite(parsed);

    // 5. Update files in Database
    await db.$transaction(async (tx) => {
      // Upsert or replace files
      for (const file of validated.files) {
        await tx.projectFile.upsert({
          where: {
            projectId_path: {
              projectId: project.id,
              path: file.path,
            },
          },
          update: {
            content: file.content,
            mimeType: file.path.endsWith(".html")
              ? "text/html"
              : file.path.endsWith(".css")
              ? "text/css"
              : file.path.endsWith(".js")
              ? "application/javascript"
              : "text/plain",
          },
          create: {
            projectId: project.id,
            path: file.path,
            content: file.content,
            mimeType: file.path.endsWith(".html")
              ? "text/html"
              : file.path.endsWith(".css")
              ? "text/css"
              : file.path.endsWith(".js")
              ? "application/javascript"
              : "text/plain",
          },
        });
      }

      await tx.project.update({
        where: { id: project.id },
        data: {
          notes: validated.notes || `Updated: ${instruction.slice(0, 80)}`,
          updatedAt: new Date(),
        },
      });
    });

    // Fetch updated project files
    const updatedFiles = await db.projectFile.findMany({
      where: { projectId: project.id },
    });

    return NextResponse.json({
      success: true,
      projectId: project.id,
      notes: validated.notes,
      files: updatedFiles.map((f) => ({
        path: f.path,
        content: f.content,
        mimeType: f.mimeType,
      })),
      downloadUrl: `/api/projects/${project.id}/download`,
    });
  } catch (error) {
    console.error("Refinement error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update website.",
      },
      { status: 500 }
    );
  }
}
