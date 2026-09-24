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
    const { projectId, files: directFiles, instruction, provider, model, apiKey } = body;

    if (!instruction || !instruction.trim()) {
      return NextResponse.json(
        { success: false, error: "Change instructions are required." },
        { status: 400 }
      );
    }

    let filesToRefine: { path: string; content: string }[] = [];
    let providerType: ProviderType = (provider || "openai") as ProviderType;
    let targetModel = model;

    // 1. Resolve files to edit (prefer directly provided files from client state)
    if (Array.isArray(directFiles) && directFiles.length > 0) {
      filesToRefine = directFiles;
    } else if (projectId) {
      try {
        const project = await db.project.findUnique({
          where: { id: projectId },
          include: { files: true },
        });
        if (project) {
          filesToRefine = project.files;
          if (!provider) providerType = project.provider as ProviderType;
          if (!targetModel) targetModel = project.model;
        }
      } catch {
        // DB optional
      }
    }

    if (filesToRefine.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files found to update." },
        { status: 400 }
      );
    }

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

    const finalModel =
      targetModel || creds.defaultModel || PROVIDER_PRESETS[providerType]?.defaultModel;

    const ai = createAIProvider(providerType, {
      apiKey: creds.apiKey,
      baseUrl: creds.baseUrl,
      defaultModel: finalModel,
    });

    // 2. Format existing files for context
    const currentFilesSummary = filesToRefine
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

    console.log(`[Refine] Updating static site with: ${instruction.slice(0, 50)}...`);

    // 3. Call AI
    const result = await ai.generate({
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
      model: finalModel,
      temperature: 0.5,
      maxTokens: 8192,
    });

    // 4. Validate output
    const parsed = extractAndParseJSON(result.text);
    const validated = validateGeneratedWebsite(parsed);

    // 5. Try updating files in Database if available (optional)
    if (projectId) {
      try {
        await db.$transaction(async (tx) => {
          for (const file of validated.files) {
            await tx.projectFile.upsert({
              where: {
                projectId_path: {
                  projectId,
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
                projectId,
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
            where: { id: projectId },
            data: {
              notes: validated.notes || `Updated: ${instruction.slice(0, 80)}`,
              updatedAt: new Date(),
            },
          });
        });
      } catch (dbErr) {
        console.warn("Database update skipped (stateless mode):", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      projectId: projectId || "stateless",
      notes: validated.notes,
      files: validated.files.map((f) => ({
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
      downloadUrl: projectId ? `/api/projects/${projectId}/download` : undefined,
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
