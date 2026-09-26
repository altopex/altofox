import { NextRequest, NextResponse } from "next/server";
import { auditWebsiteQuality, SiteFile, SiteMetaInfo } from "@/lib/quality/website-quality-auditor";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, files: directFiles, meta: directMeta } = body;

    let files: SiteFile[] = directFiles || [];
    let meta: SiteMetaInfo = directMeta || { businessName: "Local Business" };

    // If projectId is provided and no direct files, fetch from database
    if ((!files || files.length === 0) && projectId) {
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: { files: true },
      });

      if (project && project.files) {
        files = project.files.map((f) => ({
          path: f.path,
          content: f.content,
          mimeType: f.mimeType,
        }));
        meta = {
          ...meta,
          businessName: meta.businessName || project.name,
        };
      }
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: "No website files provided for quality analysis." },
        { status: 400 }
      );
    }

    const report = auditWebsiteQuality(files, meta);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error("[Quality Audit API] Error during site analysis:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to analyze website quality.",
      },
      { status: 500 }
    );
  }
}
