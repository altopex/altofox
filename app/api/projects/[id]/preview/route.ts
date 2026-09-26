import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { preparePreviewHtml } from "@/lib/export/preview-renderer";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    const project = await db.project.findUnique({
      where: { id: projectId },
      include: { files: true },
    });

    if (!project) {
      return new Response("Project not found", { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const targetPage = searchParams.get("page") || "index.html";

    const renderedHtml = preparePreviewHtml({
      pagePath: targetPage,
      files: project.files,
      photos: [],
      businessDetails: {
        name: project.name,
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
