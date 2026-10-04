import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { preparePreviewHtml } from "@/lib/export/preview-renderer";
import { tempStorage } from "@/lib/storage/temp-storage";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // 1. Check ephemeral temporary storage first (for unsaved generated websites)
    const tempProject = tempStorage.get(projectId);
    let targetFiles: any[] = [];
    let targetName = "Website";
    let targetPhotos: any[] = [];

    if (tempProject) {
      targetFiles = tempProject.files || [];
      targetName = tempProject.name || "Website";
      targetPhotos = tempProject.photos || [];
    } else {
      // 2. Fall back to persistent database
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: { files: true },
      });

      if (!project) {
        return new Response(
          `<!DOCTYPE html><html><head><title>Not Found</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h2>Preview not available</h2><p>This project was not found. It may have expired or been removed.</p></body></html>`,
          { status: 404, headers: { "Content-Type": "text/html; charset=utf-8" } }
        );
      }
      targetFiles = project.files || [];
      targetName = project.name || "Website";
    }

    if (targetFiles.length === 0) {
      return new Response(
        `<!DOCTYPE html><html><head><title>No Files</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h2>No pages to preview</h2><p>This project has no files.</p></body></html>`,
        { status: 200, headers: { "Content-Type": "text/html; charset=utf-8" } }
      );
    }

    const { searchParams } = new URL(req.url);
    const targetPage = searchParams.get("page") || searchParams.get("path") || searchParams.get("file") || "index.html";
    const norm = targetPage.toLowerCase();

    // Check if non-HTML asset was requested
    const isHtml = norm.endsWith(".html") || norm.endsWith(".htm") || !norm.includes(".");
    if (!isHtml) {
      const matchedFile = targetFiles.find(
        (f) =>
          f.path.toLowerCase() === norm ||
          f.path.toLowerCase().replace(/^\/+/, "") === norm ||
          f.path.toLowerCase().endsWith("/" + norm)
      );

      if (matchedFile && matchedFile.content !== undefined) {
        const ext = norm.split(".").pop() || "";
        const mimeTypes: Record<string, string> = {
          css: "text/css; charset=utf-8",
          js: "application/javascript; charset=utf-8",
          json: "application/json; charset=utf-8",
          xml: "application/xml; charset=utf-8",
          txt: "text/plain; charset=utf-8",
          svg: "image/svg+xml; charset=utf-8",
          jpg: "image/jpeg",
          jpeg: "image/jpeg",
          png: "image/png",
          webp: "image/webp",
        };
        const contentType = matchedFile.mimeType || mimeTypes[ext] || "text/plain; charset=utf-8";
        const body = Buffer.isBuffer(matchedFile.content)
          ? matchedFile.content
          : typeof matchedFile.content === "string"
          ? matchedFile.content
          : String(matchedFile.content);

        return new Response(body, {
          status: 200,
          headers: {
            "Content-Type": contentType,
            "X-Frame-Options": "SAMEORIGIN",
            "Cache-Control": "no-store, no-cache, must-revalidate",
          },
        });
      }
    }

    const renderedHtml = preparePreviewHtml({
      pagePath: isHtml && !norm.endsWith(".html") && !norm.endsWith(".htm") ? `${targetPage}.html` : targetPage,
      files: targetFiles,
      photos: targetPhotos,
      businessDetails: {
        name: targetName,
      },
    });

    return new Response(renderedHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "SAMEORIGIN",
        // Prevent CDN/browser caching of preview — always serve fresh
        "Cache-Control": "no-store, no-cache, must-revalidate",
      },
    });
  } catch (error) {
    console.error("Preview render error:", error);
    return new Response(
      `<!DOCTYPE html><html><head><title>Error</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center"><h2>Preview failed</h2><p>An error occurred while rendering this page. Please try again.</p></body></html>`,
      { status: 500, headers: { "Content-Type": "text/html; charset=utf-8" } }
    );
  }
}
