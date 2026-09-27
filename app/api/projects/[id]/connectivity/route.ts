import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  buildConnectivityGraphFromHtmlFiles,
  validateWebsiteCrawlAccessibility,
} from "@/lib/seo/connectivity-engine";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await req.json().catch(() => ({}));
    const clientFiles = body?.files;

    let files: { path: string; content: string | Buffer; mimeType?: string | null }[] = [];
    let domain = "example.com";
    let businessName = "Local Service Pros";

    if (Array.isArray(clientFiles) && clientFiles.length > 0) {
      files = clientFiles;
      domain = body?.domain || domain;
      businessName = body?.businessName || businessName;
    } else {
      const project = await db.project.findUnique({
        where: { id: projectId },
        include: { files: true },
      });

      if (!project) {
        return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
      }

      files = project.files.map((f) => ({
        path: f.path,
        content: f.content,
        mimeType: f.mimeType,
      }));
      businessName = project.name;
    }

    const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

    // Build Graph & Run Diagnostics
    const engine = buildConnectivityGraphFromHtmlFiles(files, {
      businessName,
      domain: cleanDomain,
    });

    const auditReport = engine.evaluateConnectivityHealth();
    const crawlValidation = validateWebsiteCrawlAccessibility(files, cleanDomain);
    const allNodes = engine.getAllNodes();

    return NextResponse.json({
      success: true,
      auditReport,
      crawlValidation,
      nodes: allNodes,
    });
  } catch (err: any) {
    console.error("[Connectivity Audit API] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to audit internal linking" },
      { status: 500 }
    );
  }
}
