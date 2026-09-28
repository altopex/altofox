import { NextRequest, NextResponse } from "next/server";
import { getThemeById } from "@/lib/themes";
import { WebsiteFormData, computeTargetPages } from "@/lib/generator/prompt";
import { buildDefaultTradeContentJSON } from "@/lib/generator/ai-content-prompt";
import { assembleWebsite } from "@/templates/assembler";
import { getProjectByIdFromDB } from "@/lib/storage/db";
import { BlogPostData } from "@/lib/blog/blog-engine";

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

    const previewBlogPosts: BlogPostData[] = [
      {
        title: "5 Early Warning Signs Your Plumbing Needs Immediate Attention",
        slug: "warning-signs-need-repair",
        primaryKeyword: "plumbing warning signs",
        secondaryKeywords: ["emergency plumber", "Dallas repair"],
        metaDescription: "Discover critical warning signs like sudden pressure drops, discolored water, and slow drains before an expensive emergency occurs.",
        datePublished: "Oct 12, 2026",
        dateModified: "Oct 14, 2026",
        authorName: "Premier Master Plumbers",
        authorBio: "Master-certified local technicians with 20+ years of field experience in Dallas, TX.",
        wordCount: 1450,
        contentHtml: "<p>Prompt diagnosis of common plumbing malfunctions protects residential foundation integrity and stops water damage early.</p>",
        faqs: [{ question: "How fast can an emergency plumber arrive?", answer: "Our certified dispatch units arrive in 45 minutes or less throughout Dallas." }],
        relatedSlugs: ["understanding-cost-factors", "when-to-call-emergency-plumber"],
        imageUrl: "images/vector-article-1.svg",
        imageAlt: "Technician inspecting residential plumbing fixture",
      },
      {
        title: "How Much Does Water Heater Repair Typically Cost? Price Factors Explained",
        slug: "understanding-cost-factors",
        primaryKeyword: "water heater repair cost",
        secondaryKeywords: ["transparent pricing", "Dallas plumbing rates"],
        metaDescription: "An honest breakdown of parts, diagnostic fees, and efficiency factors that influence repair versus replacement decisions.",
        datePublished: "Oct 08, 2026",
        dateModified: "Oct 10, 2026",
        authorName: "Premier Master Plumbers",
        authorBio: "Master-certified local technicians with 20+ years of field experience in Dallas, TX.",
        wordCount: 1520,
        contentHtml: "<p>Evaluating heating element wear versus tank corrosion helps homeowners budget effectively for reliable hot water.</p>",
        faqs: [{ question: "Is it worth repairing an 8-year-old water heater?", answer: "If repairs exceed 50% of replacement cost, an energy-efficient upgrade saves more over time." }],
        relatedSlugs: ["warning-signs-need-repair", "when-to-call-emergency-plumber"],
        imageUrl: "images/vector-article-2.svg",
        imageAlt: "Transparent cost consultation for residential heating",
      },
      {
        title: "When to Call an Emergency Plumber vs. Scheduling Routine Service",
        slug: "when-to-call-emergency-plumber",
        primaryKeyword: "emergency plumber",
        secondaryKeywords: ["24/7 service", "burst pipe help"],
        metaDescription: "Learn how to triage urgent home hazards like active slab leaks or sewer backups versus minor faucet drips that can wait.",
        datePublished: "Sep 28, 2026",
        dateModified: "Oct 01, 2026",
        authorName: "Premier Master Plumbers",
        authorBio: "Master-certified local technicians with 20+ years of field experience in Dallas, TX.",
        wordCount: 1380,
        contentHtml: "<p>Knowing when an issue poses immediate property hazard empowers homeowners to act quickly and minimize water damage.</p>",
        faqs: [{ question: "What should I do while waiting for dispatch?", answer: "Shut off the property's main water meter immediately." }],
        relatedSlugs: ["warning-signs-need-repair", "understanding-cost-factors"],
        imageUrl: "images/vector-article-3.svg",
        imageAlt: "Emergency dispatch truck arriving on scene",
      },
    ];

    // 4. Assemble website with fastOfflinePreview for sub-second, zero-network generation
    const assembled = await assembleWebsite(contentJSON, theme, {
      domain,
      serviceAreaCities,
      blogPosts: previewBlogPosts,
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
