import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// PUT /api/projects/[id]/files - Update content of project files directly
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await req.json();
    const { path, content } = body;

    if (!path || content === undefined) {
      return NextResponse.json(
        { success: false, error: "File path and content are required." },
        { status: 400 }
      );
    }

    const project = await db.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { success: false, error: "Project not found." },
        { status: 404 }
      );
    }

    const updatedFile = await db.projectFile.upsert({
      where: {
        projectId_path: {
          projectId,
          path,
        },
      },
      update: {
        content,
        updatedAt: new Date(),
      },
      create: {
        projectId,
        path,
        content,
        mimeType: path.endsWith(".html")
          ? "text/html"
          : path.endsWith(".css")
          ? "text/css"
          : path.endsWith(".js")
          ? "application/javascript"
          : "text/plain",
      },
    });

    // Touch project updatedAt
    await db.project.update({
      where: { id: projectId },
      data: { updatedAt: new Date() },
    });

    // Return all files
    const allFiles = await db.projectFile.findMany({
      where: { projectId },
      orderBy: { path: "asc" },
    });

    return NextResponse.json({
      success: true,
      file: updatedFile,
      files: allFiles.map((f) => ({
        path: f.path,
        content: f.content,
        mimeType: f.mimeType,
      })),
    });
  } catch (error) {
    console.error("Error updating project file:", error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to update file." },
      { status: 500 }
    );
  }
}
