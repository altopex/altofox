import { NextRequest, NextResponse } from "next/server";
import { applyImprovementAction, ImprovementActionType } from "@/lib/quality/website-improver";
import { SiteFile, SiteMetaInfo } from "@/lib/quality/website-quality-auditor";
import { db } from "@/lib/db";
import { getAnyConfiguredProviderCredentials } from "@/lib/ai/keys";
import { ProviderType } from "@/lib/ai/types";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = "improve_all",
      files: directFiles,
      meta = { businessName: "Local Business" },
      projectId,
      provider,
      model,
      apiKey,
      baseUrl,
      organizationId,
      providerName,
    } = body;

    let effectiveMeta = { ...(meta || {}) };
    let files = directFiles;

    // If projectId provided, check for files and customInstructions from DB
    if (projectId) {
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: { files: true },
      });

      if (project) {
        if (!effectiveMeta.customContentInstructions && project.customInstructions) {
          effectiveMeta.customContentInstructions = project.customInstructions;
        }
        if ((!files || files.length === 0) && project.files) {
          files = project.files.map((f) => ({
            path: f.path,
            content: f.content,
            mimeType: f.mimeType,
          }));
        }
      }
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided to improve." },
        { status: 400 }
      );
    }

    // Resolve credentials across direct client key, requested provider, and configured DB/env keys
    let resolvedProvider: ProviderType = (provider as ProviderType) || "custom";
    let resolvedApiKey: string | undefined = apiKey?.trim() || undefined;
    let resolvedBaseUrl: string | undefined = baseUrl?.trim() || undefined;
    let resolvedModel: string | undefined = model?.trim() || undefined;
    let resolvedOrgId: string | undefined = organizationId?.trim() || undefined;
    let resolvedName: string | undefined = providerName?.trim() || undefined;

    try {
      const creds = await getAnyConfiguredProviderCredentials(
        resolvedProvider,
        resolvedApiKey,
        resolvedBaseUrl,
        resolvedModel,
        resolvedOrgId,
        resolvedName
      );
      resolvedProvider = creds.provider;
      resolvedApiKey = creds.apiKey;
      resolvedBaseUrl = creds.baseUrl;
      resolvedModel = creds.defaultModel || resolvedModel;
      resolvedOrgId = creds.organizationId || resolvedOrgId;
      resolvedName = creds.providerName || resolvedName;
    } catch {
      // Safe fallback: If no AI key configured anywhere, continue with 100% programmatic quality improvement
      console.warn("[Improve API] No active AI provider key configured. Executing programmatic quality improvements.");
    }

    const result = await applyImprovementAction(
      action as ImprovementActionType,
      files,
      effectiveMeta as SiteMetaInfo,
      {
        provider: resolvedProvider,
        model: resolvedModel,
        apiKey: resolvedApiKey,
        baseUrl: resolvedBaseUrl,
        organizationId: resolvedOrgId,
        providerName: resolvedName,
      }
    );

    // If projectId exists in DB, update DB files too so download endpoint stays in sync
    if (projectId) {
      try {
        await db.projectFile.deleteMany({ where: { projectId } });
        await db.projectFile.createMany({
          data: result.improvedFiles.map((f) => ({
            projectId,
            path: f.path,
            content: typeof f.content === "string" ? f.content : f.content.toString("base64"),
            mimeType: f.mimeType || "text/plain",
          })),
        });
      } catch (dbErr) {
        console.warn("[Improve API] Could not sync updated files to database (stateless mode):", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      action,
      previousScore: result.previousScore,
      newScore: result.newScore,
      scoreDelta: result.newScore - result.previousScore,
      targetReached: result.targetReached,
      changesApplied: result.changesApplied,
      improvedFiles: result.improvedFiles,
      report: result.newReport,
    });
  } catch (error: any) {
    console.error("[Improve API] Error executing website improvements:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to improve website files.",
      },
      { status: 500 }
    );
  }
}
