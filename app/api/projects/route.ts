import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireApprovedServerRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authCheck = await requireApprovedServerRequest(req);
    if (!authCheck.authorized) {
      return authCheck.response;
    }

    const projects = await db.project.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        _count: {
          select: { files: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      projects: projects.map((p) => ({
        id: p.id,
        name: p.name,
        prompt: p.prompt,
        provider: p.provider,
        model: p.model,
        fileCount: p._count.files,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        downloadUrl: `/api/projects/${p.id}/download`,
      })),
    });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load projects" },
      { status: 500 }
    );
  }
}
