import { NextRequest, NextResponse } from "next/server";
import { deletePageFromProject } from "@/lib/seo/connectivity-engine";
import { db } from "@/lib/db";
import { SavedProject, ProjectVersion, ProjectChangeLogEntry } from "@/lib/storage/project-types";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectId, project: clientProject, pagePath } = body;

    if (!pagePath) {
      return NextResponse.json(
        { success: false, error: "Missing required pagePath parameter." },
        { status: 400 }
      );
    }

    const cleanPath = pagePath.replace(/^\/+/, "").trim().toLowerCase();
    if (cleanPath === "index.html" || cleanPath === "index") {
      return NextResponse.json(
        { success: false, error: "Cannot delete the homepage root (index.html)." },
        { status: 400 }
      );
    }

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
            customContentInstructions: dbProject.customInstructions || undefined,
          };
        } else {
          project.files = dbFiles;
        }
      }
    }

    if (!project || !project.files || project.files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Project files not found for page deletion." },
        { status: 400 }
      );
    }

    const domain = (project.businessDetails?.websiteDomain || project.formData?.websiteDomain || "example.com")
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");

    // Execute page deletion and dead link cleanup
    const deleteResult = deletePageFromProject(cleanPath, project.files, domain);

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
      label: `v${nextVerNumber} - Deleted ${cleanPath}`,
      createdAt: Date.now(),
      dateStr: new Date().toLocaleString(),
      source: "manual_edit",
      summary: `Deleted page ${cleanPath}. Cleaned ${deleteResult.removedDeadLinksCount} dead internal links across other pages. Updated sitemap.xml.`,
      affectedPages: [cleanPath],
      files: deleteResult.updatedFiles.map((f) => ({
        path: f.path,
        content: typeof f.content === "string" ? f.content : f.content.toString("utf-8"),
        mimeType: f.mimeType || undefined,
      })),
    };
    existingVersions.push(newVersion);

    // Update keyword map to remove deleted page
    const updatedKeywordMap = (project.keywordMap || []).filter(
      (km) => km.pagePath !== cleanPath
    );

    // Log change entry
    const logEntry: ProjectChangeLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleString(),
      summary: `Deleted page "${cleanPath}"`,
      affectedPages: [cleanPath],
      note: `Removed ${deleteResult.removedDeadLinksCount} dead links. Synchronized sitemap.xml.`,
    };

    const updatedProject: SavedProject = {
      ...project,
      files: deleteResult.updatedFiles.map((f) => ({
        path: f.path,
        content: typeof f.content === "string" ? f.content : f.content.toString("utf-8"),
        mimeType: f.mimeType || undefined,
      })),
      versions: existingVersions,
      currentVersionId: newVersionId,
      keywordMap: updatedKeywordMap,
      changeLog: [logEntry, ...(project.changeLog || [])],
      lastEditedAt: Date.now(),
    };

    // Update database files
    if (projectId) {
      try {
        await db.projectFile.deleteMany({ where: { projectId } });
        await db.projectFile.createMany({
          data: updatedProject.files.map((f) => ({
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
        console.warn("[Page Delete API] Could not persist to DB, returning updated project state:", dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      updatedProject,
      removedDeadLinksCount: deleteResult.removedDeadLinksCount,
      auditReport: deleteResult.auditReport,
    });
  } catch (err: any) {
    console.error("[Page Delete API] Error deleting page:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to delete page." },
      { status: 500 }
    );
  }
}
