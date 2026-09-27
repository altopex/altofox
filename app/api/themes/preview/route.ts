import { NextRequest, NextResponse } from "next/server";
import { getThemeById } from "@/lib/themes";
import { WebsiteFormData, computeTargetPages } from "@/lib/generator/prompt";
import { buildDefaultTradeContentJSON } from "@/lib/generator/ai-content-prompt";
import { assembleWebsite } from "@/templates/assembler";
import { getProjectByIdFromDB } from "@/lib/storage/db";

export const dynamic = "force-dynamic";

interface GeneratePreviewParams {
  themeId: string;
  projectId?: string | null;
  customFormData?: WebsiteFormData;
}

async function generateThemePreviewHtml(params: GeneratePreviewParams) {
  const { themeId, projectId, customFormData } = params;
  const theme = getThemeById(themeId || "modern-local-pro");

  let contentJSON: any = null;
  let serviceAreaCities: any[] = [];
  let domain = "premierhomeservices.com";
  let isRealProject = false;
  let projectName = "Premier Home Services";

  // 1. If projectId is provided, attempt to load real project data
  if (projectId) {
    try {
      const savedProject = await getProjectByIdFromDB(projectId);
      if (savedProject) {
        isRealProject = true;
        const bizName = savedProject.name || savedProject.businessDetails?.businessName || savedProject.formData?.businessName || "Premier Home Services";
        projectName = bizName;
        domain = savedProject.businessDetails?.websiteDomain || savedProject.formData?.websiteDomain || `${bizName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

        if ((savedProject as any).contentJSON) {
          contentJSON = JSON.parse(JSON.stringify((savedProject as any).contentJSON));
        } else if (savedProject.formData) {
          const tPages = computeTargetPages(savedProject.formData);
          contentJSON = buildDefaultTradeContentJSON(savedProject.formData, tPages);
        }

        if (savedProject.serviceAreaCities && savedProject.serviceAreaCities.length > 0) {
          serviceAreaCities = savedProject.serviceAreaCities;
        }
      }
    } catch (err) {
      console.warn(`[Theme Preview API] Could not load project "${projectId}", falling back to demo data:`, err);
    }
  }

  // 2. If custom formData is provided in request body
  if (!contentJSON && customFormData) {
    const tPages = computeTargetPages(customFormData);
    contentJSON = buildDefaultTradeContentJSON(customFormData, tPages);
    projectName = customFormData.businessName || projectName;
    domain = `${projectName.toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
  }

  // 3. Fallback to realistic local service demo data (Dallas, TX Plumbing)
  if (!contentJSON) {
    const sampleFormData: WebsiteFormData = {
      businessName: "Premier Home Services",
      businessType: "Plumbing",
      businessDescription:
        "Licensed master plumbers delivering 24/7 emergency dispatch, drain cleaning, water heater repair, and comprehensive residential plumbing across Dallas and surrounding communities.",
      services: [
        "Emergency Plumbing Repair",
        "Drain Cleaning & Rooter Clearing",
        "Water Heater Repair & Replacement",
        "Pipe Repair & Leak Detection",
        "Slab Leak Detection & Rerouting",
        "Sewer Line Camera Inspection",
      ],
      city: "Dallas",
      stateRegion: "TX",
      phone: "(214) 555-0198",
      email: "service@premierhomeservices.com",
      streetAddress: "2100 Ross Ave",
      zipPostalCode: "75201",
      yearsInBusiness: "20+ Years",
      uniqueSellingPoints: "45-min rapid dispatch, upfront transparent pricing, 100% satisfaction guarantee",
      serviceAreas: "Dallas, Highland Park, University Park, Plano, Richardson, Irving, Garland",
      targetKeywords: "plumber dallas tx, emergency plumber dallas, drain cleaning dallas, water heater repair dallas",
      pagesToCreate: ["Home", "About", "Services", "Contact", "FAQ"],
      theme: theme,
    };

    const targetPages = computeTargetPages(sampleFormData);
    contentJSON = buildDefaultTradeContentJSON(sampleFormData, targetPages);

    serviceAreaCities = [
      { city: "Highland Park", stateId: "TX", county: "Dallas", lat: 32.8335, lng: -96.7919 },
      { city: "University Park", stateId: "TX", county: "Dallas", lat: 32.8551, lng: -96.7975 },
      { city: "Plano", stateId: "TX", county: "Collin", lat: 33.0198, lng: -96.6989 },
      { city: "Richardson", stateId: "TX", county: "Dallas", lat: 32.9483, lng: -96.7299 },
      { city: "Irving", stateId: "TX", county: "Dallas", lat: 32.8140, lng: -96.9489 },
      { city: "Garland", stateId: "TX", county: "Dallas", lat: 32.9126, lng: -96.6389 },
    ];
  }

  // 4. Assemble website with fastOfflinePreview for sub-second, zero-network generation
  const assembled = await assembleWebsite(contentJSON, theme, {
    domain,
    serviceAreaCities,
    fastOfflinePreview: true,
  });

  const rawIndexHtml = assembled.files.find((f) => f.path === "index.html")?.content || "";
  const rawStyleCss = assembled.files.find((f) => f.path === "css/style.css")?.content || "";

  let standAloneHtml = typeof rawIndexHtml === "string" ? rawIndexHtml : rawIndexHtml.toString("utf8");
  const styleCss = typeof rawStyleCss === "string" ? rawStyleCss : rawStyleCss.toString("utf8");

  // 5. Inline CSS for 100% self-contained rendering
  if (styleCss) {
    standAloneHtml = standAloneHtml.replace(
      /<link[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']*style\.css["'][^>]*>/i,
      `<style>\n${styleCss}\n</style>`
    );
  }

  // 6. Map bundled files (especially trade vector SVGs) into data URIs for instant iframe rendering
  const bundledFileMap = new Map<string, string>();
  for (const file of assembled.files) {
    if (file.path.startsWith("images/")) {
      const contentStr = typeof file.content === "string" ? file.content : file.content.toString("utf8");
      if (file.mimeType === "image/svg+xml" || file.path.endsWith(".svg") || contentStr.startsWith("<svg")) {
        const svgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(contentStr)}`;
        bundledFileMap.set(file.path, svgDataUri);
        bundledFileMap.set(`./${file.path}`, svgDataUri);
        bundledFileMap.set(`/${file.path}`, svgDataUri);
      }
    }
  }

  // Replace relative image sources with guaranteed data URIs or their embedded data-local-svg fallback
  standAloneHtml = standAloneHtml.replace(
    /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/gi,
    (fullTag, before, srcVal, after) => {
      // Check if tag already has data-local-svg
      const localSvgMatch = fullTag.match(/data-local-svg=["']([^"']+)["']/i);
      const embeddedSvg = localSvgMatch ? localSvgMatch[1] : "";

      let resolvedSrc = srcVal;
      if (bundledFileMap.has(srcVal)) {
        resolvedSrc = bundledFileMap.get(srcVal)!;
      } else if (srcVal.startsWith("images/") || srcVal.startsWith("./images/") || srcVal.startsWith("/images/")) {
        if (embeddedSvg && embeddedSvg.startsWith("data:")) {
          resolvedSrc = embeddedSvg;
        }
      }

      return `<img${before}src="${resolvedSrc}"${after}>`;
    }
  );

  return {
    success: true,
    theme: {
      id: theme.id,
      name: theme.name,
      description: theme.description,
      bestFor: theme.bestFor,
      colors: theme.colors,
      fonts: theme.fonts,
      borderRadius: theme.borderRadius,
      buttonStyle: theme.buttonStyle,
      heroStyle: theme.heroStyle,
      sectionStyle: theme.sectionStyle,
      designCharacteristics: theme.designCharacteristics || [],
      layoutStructure: theme.layoutStructure,
    },
    html: standAloneHtml,
    isRealProject,
    projectName,
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const themeId = searchParams.get("themeId") || "modern-local-pro";
    const projectId = searchParams.get("projectId");

    const result = await generateThemePreviewHtml({ themeId, projectId });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Theme Preview API] Error generating theme preview:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to generate theme preview" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const themeId = body.themeId || "modern-local-pro";
    const projectId = body.projectId;
    const customFormData = body.formData;

    const result = await generateThemePreviewHtml({ themeId, projectId, customFormData });
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("[Theme Preview API] POST Error generating theme preview:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to generate theme preview" },
      { status: 500 }
    );
  }
}
