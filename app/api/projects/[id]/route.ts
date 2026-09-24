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
