import { NextRequest, NextResponse } from "next/server";
import { applyImprovementAction, ImprovementActionType } from "@/lib/quality/website-improver";
import { SiteFile, SiteMetaInfo } from "@/lib/quality/website-quality-auditor";
import { db } from "@/lib/db";
import { getProviderCredentials } from "@/lib/ai/keys";

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
      provider = "gemini",
      model,
    } = body;

    let files: SiteFile[] = directFiles || [];

    // If projectId provided and no direct files, load from DB
    if ((!files || files.length === 0) && projectId) {
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: { files: true },
      });

      if (project && project.files) {
        files = project.files.map((f) => ({
          path: f.path,
          content: f.content,
          mimeType: f.mimeType,
        }));
      }
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided to improve." },
        { status: 400 }
      );
    }

    const creds = await getProviderCredentials(provider);

    const result = await applyImprovementAction(
      action as ImprovementActionType,
      files,
      meta as SiteMetaInfo,
      {
        provider,
        model,
        apiKey: creds?.apiKey,
        baseUrl: creds?.baseUrl,
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
