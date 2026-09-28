import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

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
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project: {
        projectId: project.id,
        name: project.name,
        prompt: project.prompt,
        notes: project.notes,
        provider: project.provider,
        model: project.model,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        files: project.files.map((f) => ({
          path: f.path,
          content: f.content,
          mimeType: f.mimeType,
        })),
        downloadUrl: `/api/projects/${project.id}/download`,
      },
    });
  } catch (error) {
    console.error("Error fetching project:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load project details" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;

    // 1. Remove from temporary storage if present
    const { tempStorage } = await import("@/lib/storage/temp-storage");
    tempStorage.delete(projectId);

    // 2. Remove from SQLite database (cascades to ProjectFile and DownloadToken)
    try {
      const existing = await db.project.findUnique({
        where: { id: projectId },
      });

      if (existing) {
        await db.project.delete({
          where: { id: projectId },
        });
        console.log(`[Project API] Successfully deleted project "${projectId}" from database.`);
      }
    } catch (dbErr) {
      console.warn(`[Project API] Project delete database warning for "${projectId}":`, dbErr);
    }

    return NextResponse.json({
      success: true,
      message: `Project "${projectId}" deleted successfully.`,
      projectId,
    });
  } catch (error) {
    console.error("Error deleting project:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete project" },
      { status: 500 }
    );
  }
}

