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
    let targetFiles: any[] = tempProject?.files || [];
    let targetName: string = tempProject?.name || "Website";

    if (!tempProject) {
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: { files: true },
      });

      if (!project) {
        return new Response("Project not found", { status: 404 });
      }
      targetFiles = project.files;
      targetName = project.name;
    }

    const { searchParams } = new URL(req.url);
    const targetPage = searchParams.get("page") || "index.html";

    const renderedHtml = preparePreviewHtml({
      pagePath: targetPage,
      files: targetFiles,
      photos: [],
      businessDetails: {
        name: targetName,
      },
    });

    return new Response(renderedHtml, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "SAMEORIGIN",
      },
    });
  } catch (error) {
    console.error("Preview render error:", error);
    return new Response("Failed to render preview", { status: 500 });
  }
}
