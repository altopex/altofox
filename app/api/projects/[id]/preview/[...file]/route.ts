import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { preparePreviewHtml } from "@/lib/export/preview-renderer";
import { tempStorage } from "@/lib/storage/temp-storage";

export const dynamic = "force-dynamic";

function getMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "html":
    case "htm":
      return "text/html; charset=utf-8";
    case "css":
      return "text/css; charset=utf-8";
    case "js":
      return "application/javascript; charset=utf-8";
    case "json":
      return "application/json; charset=utf-8";
    case "xml":
      return "application/xml; charset=utf-8";
    case "txt":
      return "text/plain; charset=utf-8";
    case "svg":
      return "image/svg+xml; charset=utf-8";
    case "jpg":
    case "jpeg":
      return "image/jpeg";
    case "png":
      return "image/png";
    case "webp":
      return "image/webp";
    default:
      return "text/plain; charset=utf-8";
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string; file: string[] } }
) {
  try {
    const projectId = params.id;
    const requestedPath = (params.file || []).join("/").replace(/^\/+/, "");

    // 1. Retrieve project files from temporary storage or database
    const tempProject = tempStorage.get(projectId);
    let targetFiles: any[] = [];
    let targetName = "Website";
    let targetPhotos: any[] = [];

    if (tempProject) {
      targetFiles = tempProject.files || [];
      targetName = tempProject.name || "Website";
      targetPhotos = tempProject.photos || [];
    } else {
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: { files: true },
      });

      if (!project) {
        return new Response("Project not found", { status: 404 });
      }
      targetFiles = project.files || [];
      targetName = project.name || "Website";
    }

    if (targetFiles.length === 0) {
      return new Response("No files in project", { status: 404 });
    }

    const norm = requestedPath.toLowerCase();

    // Check if the requested file is an HTML page
    const isHtml = norm.endsWith(".html") || norm.endsWith(".htm") || !norm.includes(".");
    if (isHtml) {
      const targetPage = norm.endsWith(".html") || norm.endsWith(".htm") ? requestedPath : `${requestedPath}.html`;
      const renderedHtml = preparePreviewHtml({
        pagePath: targetPage,
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
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }

    // Lookup static file in project files (exact match or path-normalized)
    const matchedFile = targetFiles.find(
      (f) =>
        f.path.toLowerCase() === norm ||
        f.path.toLowerCase().replace(/^\/+/, "") === norm ||
        f.path.toLowerCase().endsWith("/" + norm)
    );

    if (matchedFile && matchedFile.content !== undefined) {
      const contentType = matchedFile.mimeType || getMimeType(matchedFile.path);
      const isBuffer = Buffer.isBuffer(matchedFile.content);
      const body = isBuffer
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

    // If requested an image not bundled in files, check if project photos has a remote URL
    if (norm.startsWith("images/") || norm.endsWith(".jpg") || norm.endsWith(".png") || norm.endsWith(".webp")) {
      const cleanImgName = norm.replace(/^images\//, "");
      const matchedPhoto = targetPhotos.find((p) => {
        const pPath = (p.localPath || "").toLowerCase().replace(/^\.?\/+/, "");
        return pPath === norm || pPath.replace(/^images\//, "") === cleanImgName;
      });

      if (matchedPhoto?.downloadUrl || matchedPhoto?.url) {
        // Temporary redirect to remote image CDN
        return Response.redirect(matchedPhoto.downloadUrl || matchedPhoto.url, 307);
      }
    }

    return new Response(`File not found: ${requestedPath}`, { status: 404 });
  } catch (error) {
    console.error("Preview sub-path route error:", error);
    return new Response("Preview error", { status: 500 });
  }
}
