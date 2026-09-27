import { NextRequest, NextResponse } from "next/server";
import { getThemeById, resolveThemeColors } from "@/lib/themes";
import { SavedProject, ProjectChangeLogEntry } from "@/lib/storage/project-types";
import { assembleWebsite, AssembleOptions } from "@/templates/assembler";
import { computeTargetPages } from "@/lib/generator/prompt";
import { buildDefaultTradeContentJSON } from "@/lib/generator/ai-content-prompt";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { project, newThemeId, customColors } = body as {
      project: SavedProject;
      newThemeId: string;
      customColors?: any;
    };

    if (!project || !newThemeId) {
      return NextResponse.json(
        { success: false, error: "Project and newThemeId are required" },
        { status: 400 }
      );
    }

    const baseTheme = getThemeById(newThemeId);
    const activeTheme = {
      ...baseTheme,
      colors: customColors ? resolveThemeColors(baseTheme, customColors) : baseTheme.colors,
    };

    const formData = project.formData || {};
    const businessName = project.name || formData.businessName || "Local Business";
    const city = formData.city || project.businessDetails?.city || "Local";
    const stateRegion = formData.stateRegion || (project.businessDetails as any)?.state || "TX";

    const websiteData = {
      ...formData,
      businessName,
      city,
      stateRegion,
      theme: activeTheme,
    };

    const targetPages = computeTargetPages(websiteData);
    const contentJSON = buildDefaultTradeContentJSON(websiteData, targetPages);

    // If the project already had custom page SEO metadata in project.files or project.pageContentMap, preserve them
    if (project.files) {
      for (const page of contentJSON.pages) {
        const matchingFile = project.files.find(
          (f) => f.path === page.slug || f.path === `${page.slug}.html` || (page.slug === "index" && f.path === "index.html")
        );
        if (matchingFile) {
          // Extract existing <title>
          const titleMatch = matchingFile.content.match(/<title[^>]*>(.*?)<\/title>/i);
          if (titleMatch?.[1]) {
            page.seo.title = titleMatch[1].trim();
          }
          // Extract existing meta description
          const descMatch = matchingFile.content.match(/<meta[^>]*?name=["']description["'][^>]*?content=["']([^"']*)["']/i);
          if (descMatch?.[1]) {
            page.seo.description = descMatch[1].trim();
          }
          // Extract existing <h1>
          const h1Match = matchingFile.content.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
          if (h1Match?.[1]) {
            page.seo.h1 = h1Match[1].replace(/<[^>]+>/g, "").trim();
          }
        }
      }
    }

    const assembleOptions: AssembleOptions = {
      domain: project.businessDetails?.websiteDomain || `${businessName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`,
      mapEmbed: formData.googleMaps,
      serviceAreaCities: project.serviceAreaCities || formData.serviceAreaCities,
      customContentInstructions: project.customContentInstructions || formData.customContentInstructions,
    };

    const assembled = await assembleWebsite(contentJSON, activeTheme, assembleOptions);

    // Merge newly assembled files while preserving any extra uploaded non-HTML/non-CSS files (like images)
    const existingOtherFiles = (project.files || []).filter(
      (f) => !f.path.endsWith(".html") && !f.path.endsWith(".css") && !f.path.endsWith(".js")
    );

    const mergedFiles = [
      ...assembled.files.map((f) => ({
        path: f.path,
        content: typeof f.content === "string" ? f.content : f.content.toString("utf8"),
        mimeType: f.mimeType || undefined,
        lastModified: Date.now(),
      })),
      ...existingOtherFiles.filter((of) => !assembled.files.some((af) => af.path === of.path)),
    ];

    const logEntry: ProjectChangeLogEntry = {
      id: `theme-change-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleString(),
      summary: `Switched website design theme to "${activeTheme.name}"`,
      affectedPages: ["all"],
      note: `Re-rendered site layout and design tokens using theme: ${activeTheme.name}`,
    };

    const updatedProject: SavedProject = {
      ...project,
      theme: activeTheme,
      files: mergedFiles,
      lastEditedAt: Date.now(),
      changeLog: [logEntry, ...(project.changeLog || [])],
    };

    return NextResponse.json({
      success: true,
      project: updatedProject,
      themeName: activeTheme.name,
    });
  } catch (err: any) {
    console.error("[Theme Switch API] Error switching theme:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to switch project theme" },
      { status: 500 }
    );
  }
}
