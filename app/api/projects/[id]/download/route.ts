import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bundleProjectToZipStream } from "@/lib/export/zip-bundler";
import { PrismaClient } from "@prisma/client";
import { tempStorage } from "@/lib/storage/temp-storage";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

/**
 * Fallback helper to query SQLite in explicit read-only mode if primary connection
 * fails with lock/permission errors. Properly disconnects all clients in all paths.
 */
async function findProjectWithFallback(projectId: string) {
  try {
    return await db.project.findUnique({
      where: { id: projectId },
      include: { files: true },
    });
  } catch (primaryErr: any) {
    console.warn(`[ZIP Export API] Primary db lookup error: ${primaryErr?.message || primaryErr}. Attempting read-only fallback...`);

    // Candidate db files to open with ?mode=ro
    const candidates = [
      path.resolve(process.cwd(), "prisma", "dev.db"),
      path.resolve(process.cwd(), "dev.db"),
      "/tmp/dev.db",
      "/var/task/prisma/dev.db",
      "/var/task/dev.db",
    ];

    for (const cand of candidates) {
      if (!fs.existsSync(cand)) continue;

      let fallbackClient: PrismaClient | null = null;
      try {
        fallbackClient = new PrismaClient({
          datasources: { db: { url: `file:${cand}?mode=ro` } },
        });
        const res = await fallbackClient.project.findUnique({
          where: { id: projectId },
          include: { files: true },
        });
        // Always disconnect before returning or continuing — fixes connection leak
        await fallbackClient.$disconnect().catch(() => {});
        fallbackClient = null;
        if (res) {
          console.log(`[ZIP Export API] Retrieved project via read-only fallback from ${cand}`);
          return res;
        }
      } catch {
        // Ensure disconnect even on error
        if (fallbackClient) {
          await fallbackClient.$disconnect().catch(() => {});
        }
      }
    }

    // Re-throw primary error if no fallback could resolve
    throw primaryErr;
  }
}

/**
 * GET /api/projects/[id]/download
 * Streams a production-ready ZIP archive of the saved project.
 * Supports version queries: ?version=1 or ?versionId=...
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  const requestedVersion = req.nextUrl?.searchParams?.get("version") || req.nextUrl?.searchParams?.get("versionNumber");
  const requestedVersionId = req.nextUrl?.searchParams?.get("versionId");

  console.log(`[ZIP Export API] GET download for project: "${projectId}" (version: ${requestedVersion || requestedVersionId || "current"})`);

  try {
    // 1. Check ephemeral temporary storage first (for unsaved generated websites)
    const tempProject = tempStorage.get(projectId);
    if (tempProject && tempProject.files && tempProject.files.length > 0) {
      console.log(`[ZIP Export API] Serving temp website "${tempProject.name}" (${tempProject.files.length} files)`);
      const { stream, safeFilename, stats, auditReport } = await bundleProjectToZipStream({
        projectId: tempProject.id,
        projectName: tempProject.name,
        files: tempProject.files,
        provider: tempProject.provider,
        model: tempProject.model,
        domain: tempProject.domain,
        formData: tempProject.formData,
        photos: tempProject.photos,
      });

      return new NextResponse(stream, {
        status: 200,
        headers: {
          "Content-Type": "application/zip",
          "Content-Disposition": `attachment; filename="${safeFilename}"`,
          "X-Total-Files": String(stats.totalFiles),
          "X-Storage-Type": "ephemeral-temp",
          "X-Audit-Score": String(auditReport?.score ?? 100),
          "X-Audit-Passed": auditReport?.passed ? "true" : "false",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // 2. Query persistent database if not found in temporary cache
    const project = await findProjectWithFallback(projectId);

    if (!project) {
      console.warn(`[ZIP Export API] Project not found: "${projectId}"`);
      return NextResponse.json(
        { success: false, error: `Project not found. It may have been deleted or the link has expired.` },
        { status: 404 }
      );
    }

    // Parse optional metadata, versions, and optimization history safely
    let targetFiles = project.files || [];
    let optimizationScore: number | undefined = undefined;

    if (project.notes) {
      try {
        const parsedNotes = JSON.parse(project.notes);

        if (typeof parsedNotes.overallScore === "number") {
          optimizationScore = parsedNotes.overallScore;
        } else if (typeof parsedNotes.qualityScore === "number") {
          optimizationScore = parsedNotes.qualityScore;
        } else if (typeof parsedNotes.score === "number") {
          optimizationScore = parsedNotes.score;
        }

        // Check version history if a specific version was requested
        if (Array.isArray(parsedNotes.versions) && parsedNotes.versions.length > 0) {
          let targetVersionObj: any = null;
          if (requestedVersionId) {
            targetVersionObj = parsedNotes.versions.find((v: any) => v.id === requestedVersionId);
          } else if (requestedVersion) {
            const vNum = parseInt(requestedVersion, 10);
            targetVersionObj = parsedNotes.versions.find((v: any) => v.versionNumber === vNum);
          }

          if (targetVersionObj && Array.isArray(targetVersionObj.files) && targetVersionObj.files.length > 0) {
            targetFiles = targetVersionObj.files.map((f: any) => ({
              path: f.path,
              content: f.content,
              mimeType: f.mimeType || "text/plain",
            }));
            if (typeof targetVersionObj.qualityScore === "number") {
              optimizationScore = targetVersionObj.qualityScore;
            }
            console.log(`[ZIP Export API] Serving version ${targetVersionObj.versionNumber || targetVersionObj.id} (${targetFiles.length} files)`);
          }
        }
      } catch {
        // Notes parsing failure must never break the download — silently skip
      }
    }

    if (!targetFiles || targetFiles.length === 0) {
      console.warn(`[ZIP Export API] Project has no files: "${projectId}"`);
      return NextResponse.json(
        { success: false, error: "Project has no files to download." },
        { status: 404 }
      );
    }

    const { stream, safeFilename, stats, auditReport } = await bundleProjectToZipStream({
      projectId: project.id,
      projectName: project.name,
      files: targetFiles,
      provider: project.provider,
      model: project.model,
      createdAt: project.createdAt,
    });

    console.log(`[ZIP Export API] Streaming "${safeFilename}" (${stats.totalFiles} files, audit score: ${auditReport?.score ?? 100}/100)`);

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
        "X-Audit-Score": String(auditReport?.score ?? 100),
        "X-Audit-Passed": auditReport?.passed ? "true" : "false",
        ...(optimizationScore !== undefined ? { "X-Quality-Score": String(optimizationScore) } : {}),
      },
    });
  } catch (error: any) {
    console.error(`[ZIP Export API] Fatal exception for "${projectId}":`, {
      message: error?.message,
      name: error?.name,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create ZIP download. Please try again.",
        code: "ZIP_EXPORT_FAILED",
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/projects/[id]/download
 * Allows streaming export directly from client payload (for in-memory / IndexedDB preview projects).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  console.log(`[ZIP Export API] POST streaming download for project: "${projectId}"`);

  try {
    const body = await req.json();
    const { name, files, photos, provider, model, domain, businessDetails, formData, qualityScore } = body || {};

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided in request body." },
        { status: 400 }
      );
    }

    const { stream, safeFilename, stats, auditReport } = await bundleProjectToZipStream({
      projectId,
      projectName: name || "website",
      files,
      photos,
      provider,
      model,
      domain,
      businessDetails,
      formData,
    });

    console.log(`[ZIP Export API] Streaming client payload "${safeFilename}" (${stats.totalFiles} files, audit score: ${auditReport?.score ?? 100}/100)`);

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
        "X-Audit-Score": String(auditReport?.score ?? 100),
        "X-Audit-Passed": auditReport?.passed ? "true" : "false",
        ...(typeof qualityScore === "number" ? { "X-Quality-Score": String(qualityScore) } : {}),
      },
    });
  } catch (error: any) {
    console.error(`[ZIP Export API] POST fatal exception for "${projectId}":`, {
      message: error?.message,
      name: error?.name,
    });

    return NextResponse.json(
      {
        success: false,
        error: "Failed to create ZIP download. Please try again.",
        code: "ZIP_EXPORT_FAILED",
      },
      { status: 500 }
    );
  }
}
