import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bundleProjectToZipStream } from "@/lib/export/zip-bundler";

export const dynamic = "force-dynamic";

/**
 * GET /api/projects/[id]/download
 * Streams a production-ready ZIP archive of the saved project.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const projectId = params.id;
  console.log(`[ZIP Export API] Received GET download request for project ID: "${projectId}"`);

  try {
    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { files: true },
    });

    if (!project) {
      console.warn(`[ZIP Export API] Project not found in database: "${projectId}"`);
      return NextResponse.json(
        { success: false, error: `Project "${projectId}" not found in database.` },
        { status: 404 }
      );
    }

    if (!project.files || project.files.length === 0) {
      console.warn(`[ZIP Export API] Project has no files: "${projectId}"`);
      return NextResponse.json(
        { success: false, error: "Project has no files to bundle into a ZIP archive." },
        { status: 404 }
      );
    }

    const { stream, safeFilename, stats } = await bundleProjectToZipStream({
      projectId: project.id,
      projectName: project.name,
      files: project.files,
      provider: project.provider,
      model: project.model,
      createdAt: project.createdAt,
    });

    console.log(`[ZIP Export API] Streaming "${safeFilename}" (${stats.totalFiles} files, ${stats.omittedAssets} omitted assets)`);

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error(`[ZIP Export API Fatal Exception] Failed to export project "${projectId}":`, {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
      memoryUsage: process.memoryUsage(),
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create ZIP download.",
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
  console.log(`[ZIP Export API] Received POST streaming download request for project: "${projectId}"`);

  try {
    const body = await req.json();
    const { name, files, photos, provider, model } = body || {};

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided in request body to export." },
        { status: 400 }
      );
    }

    const { stream, safeFilename, stats } = await bundleProjectToZipStream({
      projectId,
      projectName: name || "website",
      files,
      photos,
      provider,
      model,
    });

    console.log(`[ZIP Export API] Streaming direct client payload "${safeFilename}" (${stats.totalFiles} files)`);

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${safeFilename}"`,
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error: any) {
    console.error(`[ZIP Export API Fatal Exception] POST export failed for "${projectId}":`, {
      message: error?.message,
      name: error?.name,
      stack: error?.stack,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create ZIP download.",
        code: "ZIP_EXPORT_FAILED",
      },
      { status: 500 }
    );
  }
}
