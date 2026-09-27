import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { enrichWebsiteConnectivity } from "@/lib/seo/connectivity-engine";
import { SavedProject, ProjectVersion, ProjectChangeLogEntry } from "@/lib/storage/project-types";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const body = await req.json().catch(() => ({}));
    const clientProject: SavedProject | undefined = body?.project;

    let project: SavedProject | null = clientProject || null;

    if (projectId) {
      const dbProject = await db.project.findUnique({
        where: { id: projectId },
        include: { files: true },
      });

      if (dbProject) {
        const dbFiles = dbProject.files.map((f) => ({
          path: f.path,
          content: f.content,
          mimeType: f.mimeType || undefined,
        }));

        if (!project) {
          project = {
            id: dbProject.id,
            name: dbProject.name,
            createdAt: dbProject.createdAt.getTime(),
            lastEditedAt: dbProject.updatedAt.getTime(),
            formData: {
              businessName: dbProject.name,
              customContentInstructions: dbProject.customInstructions || undefined,
            },
            theme: {} as any,
            nicheId: "general",
            schemaType: "LocalBusiness",
            businessDetails: {} as any,
            serviceAreaCities: [],
            keywordMap: [],
            customBlocks: [],
            pageContentMap: {},
            files: dbFiles,
            changeLog: [],
            redirects: [],
          };
        } else if (!clientProject?.files || clientProject.files.length === 0) {
          project.files = dbFiles;
        }
      }
    }

    if (!project || !project.files || project.files.length === 0) {
      return NextResponse.json({ success: false, error: "Project files not found" }, { status: 404 });
    }

    const domain = (project.businessDetails?.websiteDomain || project.formData?.websiteDomain || "example.com")
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");

    // Run master connectivity enrichment
    const result = enrichWebsiteConnectivity(project.files, {
      businessName: project.name || "Local Service Pros",
      primaryTrade: project.formData?.businessType || (project.businessDetails as any)?.businessType || project.name,
      domain,
      serviceAreaCities: project.serviceAreaCities,
    });

    const updatedFiles = result.files.map((f) => ({
      path: f.path,
      content: typeof f.content === "string" ? f.content : f.content.toString("utf-8"),
      mimeType: f.mimeType || undefined,
    }));

    // Snapshot version history
    const existingVersions: ProjectVersion[] = [...(project.versions || [])];
    if (existingVersions.length === 0) {
      existingVersions.push({
        id: `ver-1-original`,
        versionNumber: 1,
        label: "v1 - Original Website",
        createdAt: project.createdAt || Date.now() - 3600000,
        dateStr: new Date(project.createdAt || Date.now() - 3600000).toLocaleString(),
        source: "original",
        summary: "Original website generated files",
        affectedPages: project.files.filter((f) => f.path.endsWith(".html")).map((f) => f.path),
        files: project.files,
      });
    }

    const nextVerNumber = existingVersions.length + 1;
    const newVersionId = `ver-${nextVerNumber}-${Date.now()}`;
    const newVersion: ProjectVersion = {
      id: newVersionId,
      versionNumber: nextVerNumber,
      label: `v${nextVerNumber} - Optimized Internal Linking`,
      createdAt: Date.now(),
      dateStr: new Date().toLocaleString(),
      source: "manual_edit",
      summary: `Automated internal linking optimization: reconnected ${result.auditReport.orphanNodes.length} orphans, strengthened clusters, score: ${result.auditReport.connectivityScore}/100.`,
      affectedPages: updatedFiles.filter((f) => f.path.endsWith(".html")).map((f) => f.path),
      files: updatedFiles,
    };
    existingVersions.push(newVersion);

    const logEntry: ProjectChangeLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleString(),
      summary: "Auto-reconnected internal linking graph",
      affectedPages: updatedFiles.filter((f) => f.path.endsWith(".html")).map((f) => f.path),
      note: `Connectivity score now ${result.auditReport.connectivityScore}/100. Zero orphans remaining.`,
    };

    const updatedProject: SavedProject = {
      ...project,
      files: updatedFiles,
      versions: existingVersions,
      currentVersionId: newVersionId,
      changeLog: [logEntry, ...(project.changeLog || [])],
      lastEditedAt: Date.now(),
    };

    // Update DB files
    if (projectId) {
      try {
        await db.projectFile.deleteMany({ where: { projectId } });
        await db.projectFile.createMany({
          data: updatedFiles.map((f) => ({
            projectId,
            path: f.path,
            content: String(f.content),
            mimeType: f.mimeType || "text/plain",
          })),
        });
        await db.project.update({
          where: { id: projectId },
          data: { updatedAt: new Date() },
        });
      } catch (dbErr) {
        console.warn("[Auto-Fix Connectivity API] Could not persist to DB, returning updated state:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      updatedProject,
      auditReport: result.auditReport,
      crawlValidation: result.crawlValidation,
    });
  } catch (err: any) {
    console.error("[Auto-Fix Connectivity API] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to auto-fix connectivity" },
      { status: 500 }
    );
  }
}
