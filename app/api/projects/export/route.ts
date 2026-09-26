import { NextRequest, NextResponse } from "next/server";
import { bundleProjectToZipStream } from "@/lib/export/zip-bundler";

export const dynamic = "force-dynamic";

/**
 * POST /api/projects/export
 * General-purpose asynchronous streaming ZIP export endpoint.
 * Takes { name, files, photos, provider, model } and streams a production-ready ZIP archive.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, files, photos, provider, model, domain, businessDetails, formData } = body || {};

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No files provided in export payload." },
        { status: 400 }
      );
    }

    const { stream, safeFilename, stats } = await bundleProjectToZipStream({
      projectName: name || "website",
      files,
      photos,
      provider,
      model,
      domain,
      businessDetails,
      formData,
    });

    console.log(`[ZIP Export Service] Successfully initiated stream for "${safeFilename}" (${stats.totalFiles} files)`);

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
    console.error("[ZIP Export Service Fatal Exception]:", {
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
