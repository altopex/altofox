import { NextRequest, NextResponse } from "next/server";
import { createDedicatedPage, normalizePageSlug } from "@/lib/generator/page-creator";
import { checkPageCannibalization } from "@/lib/seo/opportunity-engine";
import { db } from "@/lib/db";
import { getAnyConfiguredProviderCredentials } from "@/lib/ai/keys";
import { ProviderType } from "@/lib/ai/types";
import { SavedProject, ProjectVersion, ProjectChangeLogEntry } from "@/lib/storage/project-types";
import { QualityAuditEngine } from "@/lib/quality/quality-audit-engine";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectId,
      project: clientProject,
      pageData,
      force = false,
      provider,
      model,
      apiKey,
      baseUrl,
      organizationId,
      providerName,
    } = body;

    if (!pageData || !pageData.primaryQuery || !pageData.serviceName || !pageData.slug) {
      return NextResponse.json(
        { success: false, error: "Missing required page creation parameters (query, serviceName, slug)." },
        { status: 400 }
      );
    }

    // Determine current files and formData
    let project: SavedProject | null = clientProject || null;
    let dbFiles: { path: string; content: string; mimeType?: string }[] = [];

    if (projectId) {
      const dbProject = await db.project.findUnique({
        where: { id: projectId },
        include: { files: true },
      });
      if (dbProject) {
        dbFiles = dbProject.files.map((f) => ({
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
        }
      }
    }

    if (!project || !project.files || project.files.length === 0) {
      return NextResponse.json(
        { success: false, error: "Project files not found for page creation." },
        { status: 400 }
      );
    }

    const normSlug = normalizePageSlug(pageData.slug);

    // Run Cannibalization Check unless forced
    const cannibalization = checkPageCannibalization(
      {
        query: pageData.primaryQuery,
        serviceName: pageData.serviceName,
        locationCity: pageData.locationCity,
        slug: normSlug,
        title: pageData.title,
      },
      project.files,
      project.keywordMap || []
    );

    if (cannibalization.hasRisk && !force) {
      return NextResponse.json({
        success: false,
        cannibalizationWarning: true,
        cannibalization,
        error: cannibalization.reason,
      });
    }

    // Resolve AI credentials
    let resolvedProvider: ProviderType = (provider as ProviderType) || "custom";
    let resolvedApiKey: string | undefined = apiKey?.trim() || undefined;
    let resolvedBaseUrl: string | undefined = baseUrl?.trim() || undefined;
    let resolvedModel: string | undefined = model?.trim() || undefined;
    let resolvedOrgId: string | undefined = organizationId?.trim() || undefined;
    let resolvedName: string | undefined = providerName?.trim() || undefined;

    try {
      const creds = await getAnyConfiguredProviderCredentials(
        resolvedProvider,
        resolvedApiKey,
        resolvedBaseUrl,
        resolvedModel,
        resolvedOrgId,
        resolvedName
      );
      resolvedProvider = creds.provider;
      resolvedApiKey = creds.apiKey;
      resolvedBaseUrl = creds.baseUrl;
      resolvedModel = creds.defaultModel || resolvedModel;
      resolvedOrgId = creds.organizationId || resolvedOrgId;
      resolvedName = creds.providerName || resolvedName;
    } catch {
      console.warn("[Page Creation API] No active AI provider key configured. Executing programmatic high-quality page synthesis.");
    }

    // Generate Dedicated Page & execute internal linking
    const result = await createDedicatedPage(
      {
        primaryQuery: pageData.primaryQuery,
        serviceName: pageData.serviceName,
        locationCity: pageData.locationCity,
        locationState: pageData.locationState,
        searchIntent: pageData.searchIntent,
        title: pageData.title,
        slug: normSlug,
        relatedQueries: pageData.relatedQueries || [],
        navPlacement: pageData.navPlacement || "contextual_only",
        customContentInstructions:
          pageData.customContentInstructions ||
          project.customContentInstructions ||
          project.formData?.customContentInstructions,
        metaDescription: pageData.metaDescription,
        aiConfig: resolvedApiKey
          ? {
              provider: resolvedProvider,
              apiKey: resolvedApiKey,
              model: resolvedModel,
              baseUrl: resolvedBaseUrl,
            }
          : undefined,
      },
      project.files,
      project.formData || {
        businessName: project.name,
        city: pageData.locationCity,
      }
    );

    // Merge new and updated files into project file list
    const fileMap = new Map<string, { path: string; content: string; mimeType?: string; size?: number; lastModified?: number }>();
    for (const f of project.files) {
      fileMap.set(f.path, f);
    }

    // Apply updated existing files
    for (const f of result.updatedExistingFiles) {
      fileMap.set(f.path, f);
    }

    // Add new page file
    fileMap.set(result.newPageFile.path, result.newPageFile);

    // Add updated sitemap
    fileMap.set(result.sitemapFile.path, result.sitemapFile);

    const mergedFiles = Array.from(fileMap.values());

    // Snapshot version history (Preserve Version 1 Original)
    const existingVersions: ProjectVersion[] = [...(project.versions || [])];
    if (existingVersions.length === 0) {
      // First snapshot: Record Version 1 as original state
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
      label: `v${nextVerNumber} - Added ${pageData.serviceName} Page`,
      createdAt: Date.now(),
      dateStr: new Date().toLocaleString(),
      source: "search_console",
      summary: `Created dedicated page ${result.newPageFile.path} for query "${pageData.primaryQuery}". Contextually linked from ${result.linkedFromPages.join(", ") || "navigation"}.`,
      affectedPages: [result.newPageFile.path, ...result.linkedFromPages],
      files: mergedFiles,
    };
    existingVersions.push(newVersion);

    // Update keyword map
    const updatedKeywordMap = [
      ...(project.keywordMap || []),
      {
        pagePath: result.newPageFile.path,
        primaryKeyword: pageData.primaryQuery,
        secondaryKeywords: pageData.relatedQueries || [],
      },
    ];

    // Log change entry
    const logEntry: ProjectChangeLogEntry = {
      id: `log-${Date.now()}`,
      timestamp: Date.now(),
      dateStr: new Date().toLocaleString(),
      summary: `Created dedicated page "${result.newPageFile.path}" (${pageData.title})`,
      affectedPages: [result.newPageFile.path, ...result.linkedFromPages],
      note: `Injected contextual links on ${result.linkedFromPages.length} existing pages. Updated sitemap.xml.`,
    };

    const updatedProject: SavedProject = {
      ...project,
      files: mergedFiles,
      versions: existingVersions,
      currentVersionId: newVersionId,
      keywordMap: updatedKeywordMap,
      changeLog: [logEntry, ...(project.changeLog || [])],
      lastEditedAt: Date.now(),
    };

    // If projectId exists in DB, update DB files so download endpoint & preview stay in sync
    if (projectId) {
      try {
        await db.projectFile.deleteMany({ where: { projectId } });
        await db.projectFile.createMany({
          data: mergedFiles.map((f) => ({
            projectId,
            path: f.path,
            content: String(f.content),
            mimeType: f.mimeType || "text/plain",
          })),
        });
      } catch (dbErr) {
        console.warn("[Page Creation API] Could not sync to Prisma DB (stateless mode):", dbErr);
      }
    }

    // Run deterministic Website Quality Audit immediately on the updated website
    const qualityAudit = QualityAuditEngine.audit(mergedFiles, {
      businessName: project.formData?.businessName || project.name,
      trade: project.formData?.businessType || pageData.serviceName,
      city: project.formData?.city || pageData.locationCity,
      state: project.formData?.stateRegion || pageData.locationState,
      phone: project.formData?.phone || project.businessDetails?.phone,
      email: project.formData?.email || project.businessDetails?.email,
      domain: project.formData?.websiteDomain || project.businessDetails?.websiteDomain,
    });

    return NextResponse.json({
      success: true,
      updatedProject,
      newPagePath: result.newPageFile.path,
      stats: {
        incomingLinksCount: result.incomingLinksCount,
        outgoingLinksCount: result.outgoingLinksCount,
        linkedFromPages: result.linkedFromPages,
      },
      qualityAudit: {
        overallScore: qualityAudit.overallScore,
        categoryScores: qualityAudit.categoryScores,
        issues: qualityAudit.issues,
        totalPagesScanned: qualityAudit.totalPagesScanned,
        summaryText: qualityAudit.summaryText,
      },
      message: `Dedicated page "${result.newPageFile.path}" successfully created, linked, and audited! Quality Score: ${qualityAudit.overallScore}/100.`,
    });
  } catch (error: any) {
    console.error("[Page Creation API] Unhandled error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create dedicated page.",
      },
      { status: 500 }
    );
  }
}
