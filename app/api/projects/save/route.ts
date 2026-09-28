import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tempStorage } from "@/lib/storage/temp-storage";

export const dynamic = "force-dynamic";

/**
 * POST /api/projects/save
 * Explicitly persists a generated website into the database for future optimization.
 * Triggered ONLY when the user explicitly chooses "Yes — Save for future optimization".
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId: incomingId,
      name,
      businessName,
      domain,
      theme,
      themeName,
      niche,
      services,
      keywords,
      city,
      state,
      provider,
      model,
      qualityReport,
      customContentInstructions,
      notes,
      files,
    } = body;

    const resolvedName = name || businessName || "Saved Website";
    const resolvedId = incomingId && !incomingId.startsWith("temp-") ? incomingId : `proj-${Date.now()}`;

    // Get files from body, or retrieve from ephemeral temporary storage if omitted
    let targetFiles = Array.isArray(files) && files.length > 0 ? files : [];
    if (targetFiles.length === 0 && incomingId) {
      const tempItem = tempStorage.get(incomingId);
      if (tempItem?.files) {
        targetFiles = tempItem.files;
      }
    }

    // Structured metadata required for future optimization
    const structuredNotes = JSON.stringify({
      notes: notes || "Saved website for future optimization.",
      businessName: businessName || resolvedName,
      domain: domain || "",
      themeName: themeName || theme?.name || "Modern Pro",
      themeId: theme?.id || "modern-pro",
      niche: niche || "",
      services: services || [],
      keywords: keywords || [],
      city: city || "",
      state: state || "",
      overallScore: qualityReport?.overallScore || qualityReport?.score,
      lastOptimizedAt: Date.now(),
      savedAt: Date.now(),
      status: "saved",
    });

    // Check if project already exists, or create new
    const existing = await db.project.findUnique({
      where: { id: resolvedId },
    });

    let project;
    if (existing) {
      // Update existing record
      project = await db.project.update({
        where: { id: resolvedId },
        data: {
          name: resolvedName,
          status: "saved",
          notes: structuredNotes,
          customInstructions: customContentInstructions || null,
        },
      });

      // Update files if provided
      if (targetFiles.length > 0) {
        await db.projectFile.deleteMany({ where: { projectId: resolvedId } });
        await db.projectFile.createMany({
          data: targetFiles.map((f: any) => ({
            projectId: resolvedId,
            path: f.path,
            content: typeof f.content === "string" ? f.content : f.content.toString("base64"),
            mimeType: f.mimeType || "text/plain",
          })),
        });
      }
    } else {
      // Create new persistent project
      project = await db.project.create({
        data: {
          id: resolvedId,
          name: resolvedName,
          prompt: `Theme: ${themeName || "Modern Pro"} | Domain: ${domain || "local"} | Biz: ${businessName || resolvedName}`,
          provider: provider || "custom",
          model: model || "section-templates",
          status: "saved",
          notes: structuredNotes,
          customInstructions: customContentInstructions || null,
          files: {
            create: targetFiles.map((f: any) => ({
              path: f.path,
              content: typeof f.content === "string" ? f.content : f.content.toString("base64"),
              mimeType: f.mimeType || "text/plain",
            })),
          },
        },
      });
    }

    // Clean up temporary in-memory store now that it is permanently saved
    if (incomingId) {
      tempStorage.delete(incomingId);
    }

    console.log(`[Project Save API] Successfully persisted project "${resolvedName}" (ID: ${project.id}) with ${targetFiles.length} files`);

    return NextResponse.json({
      success: true,
      projectId: project.id,
      name: project.name,
      status: "saved",
      message: "Website saved successfully for future optimization.",
      downloadUrl: `/api/projects/${project.id}/download`,
    });
  } catch (error: any) {
    console.error("[Project Save API] Error saving website:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to save website for future optimization.",
      },
      { status: 500 }
    );
  }
}
