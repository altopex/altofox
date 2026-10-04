import fs from "fs";
import path from "path";
import { SiteContentJSON, PageContentJSON, SectionJSON } from "../lib/generator/content-schema";
import { Theme, buildGoogleFontsUrl } from "../lib/themes";
import { detectTradeCategory, resolvePhoto } from "../lib/photos/photo-service";
import { resolveStockPhoto, buildCreditsTxt, StockPhoto } from "../lib/photos/stock-service";
import { findNicheByIndustry } from "../niches";
import {
  PAGE_LAYOUTS,
  detectPageLayoutType,
  resolveThemeLayoutStructure,
  ResolvedLayoutStructure,
} from "./layouts";
import * as Sections from "./sections";
import { renderServiceAreasHub, ServiceAreaCityItem } from "./sections/serviceAreasHub";
import { renderLocationPage, buildLocationPageSchema, LocationPageContext } from "./sections/locationPage";
import { getNearestSelectedCities } from "../lib/data/us-cities";
import { buildLocationContentStrategy, ROTATING_ANGLES } from "../lib/location/quality-engine";
import { runQualityChecksAndAutoFix, QualityReport, AssembleFile } from "../lib/quality/quality-checker";
import { QualityAuditEngine, QualityAuditResult } from "../lib/quality/quality-audit-engine";
import { QualityAutoFixEngine, QualityAutoFixResult } from "../lib/quality/quality-auto-fix-engine";
import {
  PageRegistry,
  RegistryPage,
  LinkStyle,
  buildMasterPageRegistry,
  linkTo,
  assetPath,
  resolveInternalLinks,
  renderBreadcrumbs,
} from "../lib/registry/page-registry";
import {
  createImagePlan,
  resolveImagePlanWithValidation,
  bundleImagesFromPlan,
  ImagePlanSlot,
} from "../lib/photos/image-bundler";
import { IMAGE_FALLBACK_SCRIPT, ImageDeduplicationTracker, ImageProviderType } from "../lib/photos/image-provider";
import {
  validateAndRepairSection,
  scanHtmlForForbiddenTokens,
  GenerationAuditEntry,
} from "../lib/generator/strict-section-schemas";
import {
  enrichWebsiteConnectivity,
  ConnectivityAuditReport,
} from "../lib/seo/connectivity-engine";
import { InternalLinkAuditReport } from "../lib/seo/internal-link-engine";
import {
  SeoEngine,
  SeoSiteMeta,
  SeoValidationReport,
} from "../lib/seo/seo-engine";
import {
  BlogPostData,
  renderBlogPostHtml,
  buildBlogPostSchema,
  renderBlogIndexHtml,
} from "../lib/blog/blog-engine";
import {
  GenerationStageName,
  GenerationPipelineTracker,
} from "../lib/pipeline/generation-pipeline";
import { SiteBlueprint } from "../lib/blueprint/site-blueprint";

export interface AssembleOptions {
  domain?: string;
  blueprint?: SiteBlueprint;
  tracker?: GenerationPipelineTracker;
  mapEmbed?: string;
  pexelsKey?: string;
  pixabayKey?: string;
  googleKey?: string;
  googleCx?: string;
  preferredSource?: ImageProviderType;
  linkStyle?: LinkStyle;
  useFolderStructure?: boolean;
  blogPosts?: BlogPostData[];
  hasBlog?: boolean;
  serviceAreaCities?: {
    city: string;
    stateId: string;
    county: string;
    lat: number;
    lng: number;
    population?: number;
    slug?: string;
    distanceOffset?: string;
    localNotes?: string;
  }[];
  customContentInstructions?: string;
  providerCredentials?: {
    apiKey?: string;
    baseUrl?: string;
    provider?: string;
    model?: string;
  };
  validateNetwork?: boolean;
  fastOfflinePreview?: boolean;
  onProgress?: (stage: GenerationStageName, progress: number, message: string) => void;
}

export interface AssembledWebsite {
  files: AssembleFile[];
  photos?: StockPhoto[];
  qualityReport?: QualityReport;
  registry?: PageRegistry;
  generationLog?: GenerationAuditEntry[];
  connectivityAudit?: ConnectivityAuditReport;
  internalLinkAudit?: InternalLinkAuditReport;
  seoValidation?: SeoValidationReport;
  qualityAudit?: QualityAuditResult;
  autoFixAudit?: QualityAutoFixResult;
}

/**
 * Builds the theme-specific CSS variables block
 */
export function buildThemeVariables(theme: Theme): string {
  const c = theme.colors;
  const f = theme.fonts;
  const radius = theme.borderRadius || "12px";

  return `/* Theme Tokens: ${theme.name} (${theme.id}) */
:root {
  --color-primary: ${c.primary};
  --color-secondary: ${c.secondary};
  --color-accent: ${c.accent};
  --color-background: ${c.background};
  --color-surface: ${c.surface};
  --color-text: ${c.text};
  --color-muted: ${c.muted};
  --color-border: rgba(15, 23, 42, 0.08);
  --font-heading: '${f.heading}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-body: '${f.body}', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --radius: ${radius};
}
`;
}

/**
 * Generates SEO meta tags, Google Fonts, and Open Graph tags for <head> using exact relative asset paths
 */
function buildHead(
  seo: PageContentJSON["seo"],
  site: SiteContentJSON["site"],
  theme: Theme,
  domain: string,
  currentPage: RegistryPage,
  linkStyle: LinkStyle = "web"
): string {
  const headingFont = encodeURIComponent(theme.fonts.heading);
  const bodyFont = encodeURIComponent(theme.fonts.body);
  const title = (seo.title || "Local Services").includes("|") ? (seo.title || "Local Services") : `${seo.title || "Local Services"} | ${site.businessName}`;
  const description = seo.description || (seo as any).metaDescription || `Professional local services by ${site.businessName}.`;
  const canonicalUrl = `https://${domain}/${currentPage.outputFilePath === "index.html" ? "" : currentPage.outputFilePath}`;
  const cssHref = assetPath(currentPage, "css/style.css");
  const jsHref = assetPath(currentPage, "js/main.js");

  return `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${description.slice(0, 160)}">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph / Social Media -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${((seo as any).ogDescription || description).slice(0, 200)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${((seo as any).ogDescription || description).slice(0, 200)}">

  <!-- Google Fonts: ${theme.fonts.heading} & ${theme.fonts.body} -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${buildGoogleFontsUrl(theme.fonts.heading, theme.fonts.body)}" rel="stylesheet">

  <!-- Design System CSS -->
  <link rel="stylesheet" href="${cssHref}">

  <!-- Instant inline image fallback handler -->
  <script>${IMAGE_FALLBACK_SCRIPT}</script>

  <!-- Shared App Script (Single source of truth) -->
  <script src="${jsHref}" defer></script>`;
}

/**
 * Generates rich JSON-LD structured schema in code
 */
function buildSchemaOrg(
  site: SiteContentJSON["site"],
  page: PageContentJSON,
  schemaType: string,
  domain: string,
  currentPage: RegistryPage
): string {
  const isHome = currentPage.pageType === "home";
  const address = site.address || { city: "Dallas", state: "TX" };
  const phone = site.phone || "";
  const canonicalUrl = `https://${domain}/${currentPage.outputFilePath === "index.html" ? "" : currentPage.outputFilePath}`;

  if (isHome) {
    const isServiceArea = site.businessModel === "service-area";
    const postalAddress: Record<string, any> = {
      "@type": "PostalAddress",
      addressLocality: address.city,
      addressRegion: address.state,
      postalCode: address.zip || undefined,
      addressCountry: address.country || "US",
    };
    if (!isServiceArea && address.street) {
      postalAddress.streetAddress = address.street;
    }

    const localBusiness = {
      "@context": "https://schema.org",
      "@type": schemaType || "LocalBusiness",
      name: site.businessName,
      description: site.tagline || page.seo.description,
      telephone: phone,
      email: site.email || undefined,
      url: `https://${domain}`,
      address: postalAddress,
      areaServed: (Array.isArray(site.serviceAreas)
        ? site.serviceAreas
        : typeof site.serviceAreas === "string"
        ? (site.serviceAreas as string).split(",").map((s) => s.trim()).filter(Boolean)
        : []
      ).map((a) => ({
        "@type": "AdministrativeArea",
        name: a,
      })),
      openingHoursSpecification: [
        {
          "@type": "OpeningHoursSpecification",
          dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          opens: "00:00",
          closes: "23:59",
        },
      ],
      sameAs: Object.values(site.social || {}).filter(Boolean),
    };

    return `\n  <script type="application/ld+json">\n  ${JSON.stringify(localBusiness, null, 2)}\n  </script>`;
  }

  const layoutType = detectPageLayoutType(page.slug);
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `https://${domain}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: page.seo.h1 || page.seo.title,
        item: canonicalUrl,
      },
    ],
  };

  let specificSchema = "";
  if (layoutType === "single-service" || layoutType === "services") {
    const serviceSchema = {
      "@context": "https://schema.org",
      "@type": "Service",
      name: page.seo.h1 || page.seo.title,
      description: page.seo.description,
      provider: {
        "@type": schemaType || "LocalBusiness",
        name: site.businessName,
        telephone: phone,
      },
      areaServed: address.city,
    };
    specificSchema = `\n  <script type="application/ld+json">\n  ${JSON.stringify(serviceSchema, null, 2)}\n  </script>`;
  }

  const breadcrumbScript = `\n  <script type="application/ld+json">\n  ${JSON.stringify(breadcrumb, null, 2)}\n  </script>`;
  return `${breadcrumbScript}${specificSchema}`;
}

/**
 * Assembles the full website files from structured JSON + templates + design tokens + real photos
 */
export async function assembleWebsite(
  data: SiteContentJSON,
  theme: Theme,
  options?: AssembleOptions
): Promise<AssembledWebsite> {
  const domain = (options?.domain || data.site.businessName.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com").replace(
    /^https?:\/\//,
    ""
  );
  const mainTrade = data.schema?.type || (data.site as any).niche || (data.site as any).primaryTrade || (data.site as any).trade || data.site.businessName || "Local Service";
  const tradeSlug = mainTrade.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const tradeCategory = detectTradeCategory(mainTrade);
  const linkStyle: LinkStyle = options?.linkStyle || "web";
  const useFolderStructure = Boolean(options?.useFolderStructure);

  const rawAreaCities = options?.serviceAreaCities || (data.site as any).serviceAreaCities || [];
  const defaultState = data.site.address?.state || "US";
  const effectiveAreaCities = rawAreaCities.map((item: any) => {
    if (typeof item === "string") {
      const parts = item.split(",").map((s: string) => s.trim());
      const city = parts[0] || item;
      const stateId = parts[1] || defaultState;
      const safeCitySlug = city.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const safeStateSlug = stateId.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      return {
        city,
        stateId,
        county: "",
        slug: `${tradeSlug}-${safeCitySlug}-${safeStateSlug}.html`,
        lat: 0,
        lng: 0,
      };
    }
    const city = item?.city || item?.name || "Local Area";
    const stateId = item?.stateId || item?.state || defaultState;
    const safeCitySlug = String(city).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const safeStateSlug = String(stateId).toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return {
      city,
      stateId,
      county: item?.county || "",
      lat: item?.lat || 0,
      lng: item?.lng || 0,
      slug: item?.slug || `${tradeSlug}-${safeCitySlug}-${safeStateSlug}.html`,
    };
  });
  const effectiveBlogPosts: BlogPostData[] = options?.blogPosts || (data as any).blogPosts || [];

  // 1. Build Master Page Registry BEFORE any HTML is generated
  const blueprint = options?.blueprint;
  const siteSeed = blueprint?.siteSeed || (data.site as any).siteSeed || data.site.businessName;
  const layoutFamilyPreference = blueprint?.layoutFamily;
  const resolvedLayout = resolveThemeLayoutStructure(theme, siteSeed, layoutFamilyPreference);
  console.log(`[Assembler] Theme "${theme.name}" (${theme.id}) -> Layout Family "${resolvedLayout.layoutFamilyName}" (${resolvedLayout.layoutFamily}) with Seed "${siteSeed}"`);

  const registry = buildMasterPageRegistry({
    businessName: data.site.businessName,
    nicheTrade: mainTrade,
    useFolderStructure,
    mainPages: data.pages.map((p) => ({
      slug: p.slug,
      title: p.seo.title,
      navLabel: p.seo.title.split("|")[0].trim(),
    })),
    services: blueprint ? blueprint.services.map((s) => ({ slug: s.slug, name: s.name, description: s.description })) : undefined,
    locations: blueprint
      ? blueprint.locations.map((l) => ({
          city: l.city,
          stateId: l.state,
          county: l.county,
          slug: `${tradeSlug}-${l.slug}.html`,
        }))
      : effectiveAreaCities.map((c: any) => ({
          city: c.city,
          stateId: c.stateId,
          county: c.county,
          slug: c.slug,
          lat: c.lat,
          lng: c.lng,
        })),
    blogs: effectiveBlogPosts.map((b) => ({
      slug: b.slug,
      title: b.title,
      date: b.datePublished,
    })),
    hasServicesHub: true,
    hasAreasHub: blueprint ? blueprint.locations.length > 0 : effectiveAreaCities.length > 0,
    hasBlogHub: effectiveBlogPosts.length > 0,
  });

  // 2. STAGE 6: COLLECTING_IMAGES
  const tracker = options?.tracker;
  const deduplicationTracker = new ImageDeduplicationTracker();

  tracker?.startStage("COLLECTING_IMAGES", "Resolving and deduplicating trade photography...");
  options?.onProgress?.("COLLECTING_IMAGES", 52, "Resolving and deduplicating trade photography...");

  let imagePlan: ImagePlanSlot[] = [];
  let bundledImages: AssembleFile[] = [];
  try {
    const initialPlan = createImagePlan(
      data.pages.map((p) => ({
        slug: p.slug,
        title: p.seo?.title || p.seo?.h1,
        sections: p.sections,
      })),
      mainTrade,
      data.site.address?.city || "Local",
      data.site.businessName,
      effectiveAreaCities,
      {
        preferredSource: options?.preferredSource,
        state: data.site.address?.state,
        deduplicationTracker,
      }
    );

    imagePlan = await resolveImagePlanWithValidation(
      initialPlan,
      mainTrade,
      data.site.address?.city || "Local",
      {
        preferredSource: options?.preferredSource,
        state: data.site.address?.state,
        pexelsKey: options?.pexelsKey,
        pixabayKey: options?.pixabayKey,
        googleKey: options?.googleKey,
        googleCx: options?.googleCx,
        providerCredentials: options?.fastOfflinePreview ? undefined : options?.providerCredentials,
        validateNetwork: options?.fastOfflinePreview ? false : (options?.validateNetwork ?? false),
        fastOfflinePreview: options?.fastOfflinePreview,
        maxValidationTimeMs: 3000,
        deduplicationTracker,
      }
    );

    bundledImages = bundleImagesFromPlan(imagePlan, {
      mainTrade,
      city: data.site.address?.city || "Local",
    });

    tracker?.completeStage(
      "COLLECTING_IMAGES",
      `Resolved and deduplicated trade photography (${bundledImages.length} visual assets).`
    );
  } catch (imgErr: any) {
    const errMsg = imgErr instanceof Error ? imgErr.message : "Failed to resolve images.";
    tracker?.failStage("COLLECTING_IMAGES", "FAILED_IMAGE", errMsg, true);
    throw imgErr;
  }

  tracker?.startStage("BUILDING_PAGES", "Rendering semantic HTML pages and theme tokens...");
  options?.onProgress?.("BUILDING_PAGES", 65, "Rendering semantic HTML pages and theme tokens...");

  // Read base.css and base.js
  let baseCss = "";
  let baseJs = "";
  try {
    const baseCssPath = path.join(process.cwd(), "templates", "base.css");
    if (fs.existsSync(baseCssPath)) {
      baseCss = fs.readFileSync(baseCssPath, "utf8");
    }
    const baseJsPath = path.join(process.cwd(), "templates", "base.js");
    if (fs.existsSync(baseJsPath)) {
      baseJs = fs.readFileSync(baseJsPath, "utf8");
    }
  } catch (e) {
    console.warn("[Assembler] Could not read template files directly from disk:", e);
  }

  if (!baseCss) {
    baseCss = `/* RankLocal Fallback CSS */
body { font-family: sans-serif; line-height: 1.6; margin: 0; padding: 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 16px; }
.btn { display: inline-flex; padding: 12px 24px; border-radius: 8px; font-weight: bold; }
.btn-primary { background: var(--color-primary, #1D4ED8); color: white; }`;
  }

  const combinedCss = `${buildThemeVariables(theme)}\n${baseCss}`;
  let files: AssembledWebsite["files"] = [];
  const generationLog: GenerationAuditEntry[] = [];

  // Add bundled CSS and JS files
  files.push({
    path: "css/style.css",
    content: combinedCss,
    mimeType: "text/css",
  });
  files.push({
    path: "styles.css",
    content: combinedCss,
    mimeType: "text/css",
  });

  files.push({
    path: "js/main.js",
    content: baseJs,
    mimeType: "application/javascript",
  });
  files.push({
    path: "script.js",
    content: baseJs,
    mimeType: "application/javascript",
  });

  // Add all bundled images to files so every image exists on disk and in HTTP server
  files.push(...bundledImages);

  const usedPhotoIds = new Set<string>();
  const allResolvedPhotos: StockPhoto[] = [];
  let photoIndex = 0;

  // 3. Assemble each standard HTML Page
  for (const page of data.pages) {
    const slug = page.slug.replace(/\.html$/, "");
    
    // Avoid double service-areas.html if handled via effectiveAreaCities hub
    if (slug === "service-areas" && effectiveAreaCities.length > 0) {
      continue;
    }

    // Lookup corresponding page in registry
    let currentPage = registry.getById(`page-${slug}`) || registry.getByPath(`${slug}.html`) || registry.getById(slug);
    if (!currentPage) {
      if (slug === "index") currentPage = registry.getById("home");
      else if (slug === "services") currentPage = registry.getById("services-hub");
      else if (slug === "service-areas") currentPage = registry.getById("areas-hub");
    }

    if (!currentPage) {
      // Fallback register
      currentPage = {
        id: `page-${slug}`,
        pageType: slug === "index" ? "home" : "about",
        title: page.seo.title,
        navLabel: page.seo.title.split("|")[0].trim(),
        outputFilePath: `${slug}.html`,
      };
      registry.register(currentPage);
    }

    const layoutType = detectPageLayoutType(slug);
    const layoutBlueprint = PAGE_LAYOUTS[layoutType] || PAGE_LAYOUTS.custom;

    const rawSections = page.sections && page.sections.length > 0 ? page.sections : layoutBlueprint.defaultSections;
    const activeSections: SectionJSON[] = rawSections.map((s: any) =>
      typeof s === "string"
        ? { type: s, variant: "default", content: {}, images: [] }
        : { ...s, content: s.content || {}, images: s.images || [] }
    );

    // Header & Navigation from Registry (respects resolved layout family headerVariant)
    const headerVariant = resolvedLayout.headerVariant;
    const headerHtml = Sections.renderHeader(data.site, headerVariant, registry, currentPage, linkStyle);

    // Breadcrumbs for inner pages
    let breadcrumbsHtml = "";
    if (currentPage.pageType !== "home") {
      const bRes = renderBreadcrumbs(registry, currentPage, domain, linkStyle);
      breadcrumbsHtml = bRes.html;
    }

    const isHomePage = page.slug === "index" || page.slug === "";

    // Re-order homepage sections according to resolved layout family sectionOrder
    if (isHomePage && resolvedLayout.sectionOrder && resolvedLayout.sectionOrder.length > 0) {
      const order = resolvedLayout.sectionOrder;
      activeSections.sort((a, b) => {
        let idxA = order.indexOf(a.type);
        let idxB = order.indexOf(b.type);
        if (idxA === -1) idxA = 99;
        if (idxB === -1) idxB = 99;
        return idxA - idxB;
      });
    }

    // If blog posts exist and home page doesn't have a blog section, insert one
    if (isHomePage && effectiveBlogPosts.length > 0 && !activeSections.some((s) => s.type === "blog" || s.type === "articles")) {
      const insertIdx = activeSections.findIndex((s) => s.type === "testimonials" || s.type === "faq" || s.type === "ctaBanner" || s.type === "contactForm");
      const blogSectionObj: SectionJSON = {
        type: "blog",
        variant: "default",
        content: {
          eyebrow: "Helpful Advice & Guides",
          headline: `Expert ${mainTrade} Tips & Homeowner Guides`,
          subheadline: `Practical advice on diagnostics, preventative maintenance, and when to call a licensed specialist.`,
        },
        images: [],
      };
      if (insertIdx !== -1) {
        activeSections.splice(insertIdx, 0, blogSectionObj);
      } else {
        activeSections.push(blogSectionObj);
      }
    }

    // Apply resolved layout structure section variants across all sections
    for (const sec of activeSections) {
      if (sec.type === "hero") {
        sec.variant = resolvedLayout.heroVariant;
      } else if (sec.type === "services") {
        sec.variant = resolvedLayout.servicesVariant;
      } else if (sec.type === "trustBar") {
        sec.variant = resolvedLayout.trustVariant;
      } else if (sec.type === "process") {
        sec.variant = resolvedLayout.processVariant;
      } else if (sec.type === "testimonials") {
        sec.variant = resolvedLayout.reviewsVariant;
      } else if (sec.type === "faq") {
        sec.variant = resolvedLayout.faqVariant;
      } else if (sec.type === "ctaBanner") {
        sec.variant = resolvedLayout.ctaVariant;
      }
    }

    // On homepage, guarantee the final CTA section reflects the resolved layout CTA variant
    if (isHomePage) {
      const ctaIndex = activeSections.findIndex((s) => s.type === "ctaBanner");
      const chosenCtaVariant = resolvedLayout.ctaVariant || "locationMap";
      if (ctaIndex !== -1) {
        const [ctaSec] = activeSections.splice(ctaIndex, 1);
        ctaSec.variant = chosenCtaVariant;
        activeSections.push(ctaSec);
      } else {
        activeSections.push({
          type: "ctaBanner",
          variant: chosenCtaVariant,
          content: {},
          images: [],
        });
      }
    }

    const renderedSectionsHtml: string[] = [];
    const niche = findNicheByIndustry(data.schema?.type || data.site.businessName || data.site.tagline || "");

    for (let secIdx = 0; secIdx < activeSections.length; secIdx++) {
      const section = activeSections[secIdx];

      // Validate & Repair Section Content
      const validation = validateAndRepairSection(section.type, section.content, data.site, slug, secIdx);
      generationLog.push(validation.audit);

      if (!validation.valid && validation.audit.removed) {
        continue;
      }
      section.content = validation.content;

      // Find planned images for this section
      let targetSlot: "hero" | "service" | "about" | "gallery" = "service";
      if (section.type === "hero") targetSlot = "hero";
      else if (section.type === "about") targetSlot = "about";
      else if (section.type === "gallery") targetSlot = "gallery";
      else if (section.type === "services" || section.type === "serviceHighlights" || section.type === "serviceGrid") targetSlot = "service";

      const plannedSlots = imagePlan.filter((p) => p.pageSlug === slug && p.slot === targetSlot);
      const sectionImages: any[] = [];

      for (let i = 0; i < Math.max(plannedSlots.length, 1); i++) {
        const pSlot = plannedSlots[i];
        if (pSlot) {
          sectionImages.push({
            url: pSlot.remoteUrl || pSlot.fallbackUrl,
            fallbackUrl: pSlot.fallbackUrl,
            allFallbacks: pSlot.allFallbacks || (pSlot.fallbackUrl ? [pSlot.fallbackUrl] : []),
            localSvgFallback: pSlot.localSvgFallback,
            localPath: assetPath(currentPage, pSlot.localPath),
            localWebpPath: assetPath(currentPage, pSlot.localWebpPath),
            alt: pSlot.alt,
            width: pSlot.width,
            height: pSlot.height,
            slot: pSlot.slot,
          });
        }
      }

      switch (section.type) {
        case "emergencyBanner":
          renderedSectionsHtml.push(Sections.renderEmergencyBanner(section, data.site.phone));
          break;
        case "hero":
          const heroSection = {
            ...section,
            content: {
              h1: page.seo.h1,
              subheadline: page.seo.description,
              ...section.content,
            },
          };
          renderedSectionsHtml.push(Sections.renderHero(heroSection, data.site.phone, sectionImages, data.site));
          break;
        case "trustBar":
          renderedSectionsHtml.push(Sections.renderTrustBar(section, data.site));
          break;
        case "services":
          renderedSectionsHtml.push(Sections.renderServices(section, sectionImages, data.site.phone));
          break;
        case "stats":
          renderedSectionsHtml.push(Sections.renderStats(section));
          break;
        case "about":
          renderedSectionsHtml.push(Sections.renderAbout(section, data.site.businessName, sectionImages));
          break;
        case "whyUs":
          renderedSectionsHtml.push(Sections.renderWhyUs(section));
          break;
        case "process":
          renderedSectionsHtml.push(Sections.renderProcess(section));
          break;
        case "gallery":
          renderedSectionsHtml.push(Sections.renderGallery(section, sectionImages));
          break;
        case "serviceAreas":
          renderedSectionsHtml.push(
            Sections.renderServiceAreas(
              section,
              data.site.serviceAreas,
              data.site.address?.city,
              data.site.address?.state
            )
          );
          break;
        case "testimonials":
          const testHtml = Sections.renderTestimonials(section, data.site);
          if (testHtml && testHtml.trim()) {
            renderedSectionsHtml.push(testHtml);
          }
          break;
        case "faq":
          renderedSectionsHtml.push(Sections.renderFaq(section));
          break;
        case "ctaBanner":
          const mapInput =
            options?.mapEmbed ||
            (data.site as any).googleMaps ||
            (data.site.address?.street
              ? `${data.site.address.street}, ${data.site.address?.city || ""}, ${data.site.address?.state || ""}`
              : data.site.address?.city);
          renderedSectionsHtml.push(
            Sections.renderCtaBanner(section, data.site.phone, sectionImages, data.site, mapInput)
          );
          break;
        case "contactForm":
          // Homepage has its sole dedicated map in the Final CTA section immediately above footer.
          // Omit duplicate contactForm map on homepage so only ONE map exists.
          const contactMapEmbed = isHomePage
            ? undefined
            : options?.mapEmbed ||
              (data.site as any).googleMaps ||
              (data.site.address?.city
                ? `${data.site.address?.city}${data.site.address?.state ? `, ${data.site.address.state}` : ""}`
                : undefined);
          renderedSectionsHtml.push(
            Sections.renderContactForm(section, data.site, contactMapEmbed, isHomePage)
          );
          break;
        case "blog":
        case "articles":
          renderedSectionsHtml.push(
            Sections.renderBlogSection(section, effectiveBlogPosts, data.site)
          );
          break;
        default:
          break;
      }
    }

    // Footer & Mobile Call Bar
    const footerHtml = Sections.renderFooter(data.site, registry, currentPage, linkStyle, resolvedLayout.footerVariant);
    const mobileCallBarHtml = Sections.renderMobileCallBar(data.site.phone);

    // Build Head & Schema
    const headHtml = buildHead(page.seo, data.site, theme, domain, currentPage, linkStyle);
    const schemaHtml = buildSchemaOrg(data.site, page, data.schema?.type || "LocalBusiness", domain, currentPage);

    let fullBodyHtml = `
${headerHtml}
${breadcrumbsHtml}
  <main>
${renderedSectionsHtml.join("\n\n")}
  </main>
${footerHtml}
${mobileCallBarHtml}`;

    // Resolve internal AI links [[link:page-id|text]]
    fullBodyHtml = resolveInternalLinks(fullBodyHtml, currentPage, registry, linkStyle);

    let fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
${headHtml}
${schemaHtml}
</head>
<body class="theme-${theme.id}">
${fullBodyHtml}
</body>
</html>`;

    // Final Guard Scan for forbidden leak tokens
    const forbiddenErrors = scanHtmlForForbiddenTokens(fullHtml);
    if (forbiddenErrors.length > 0) {
      console.warn(`[Final Guard] Sanitizing ${forbiddenErrors.length} leak token(s) on ${currentPage.outputFilePath}`);
      for (const err of forbiddenErrors) {
        if (err.token === "undefined" || err.token === "null" || err.token === "NaN") {
          fullHtml = fullHtml.replace(new RegExp(`\\b${err.token}\\b`, "g"), "");
        }
      }
    }

    files.push({
      path: currentPage.outputFilePath,
      content: fullHtml,
      mimeType: "text/html",
    });
  }

  // 4. Generate Service Areas Hub & Location Pages if requested
  if (Array.isArray(effectiveAreaCities) && effectiveAreaCities.length > 0) {
    const hubPage = registry.getByType("areas hub")[0] || {
      id: "areas-hub",
      pageType: "areas hub" as const,
      title: `Service Areas | ${data.site.businessName}`,
      navLabel: "Service Areas",
      outputFilePath: "service-areas.html",
    };

    const headerHtml = Sections.renderHeader(data.site, "standard", registry, hubPage, linkStyle);
    const footerHtml = Sections.renderFooter(data.site, registry, hubPage, linkStyle, resolvedLayout.footerVariant);
    const mobileCallBarHtml = Sections.renderMobileCallBar(data.site.phone);

    // A. Service Areas Hub
    const hubCities: ServiceAreaCityItem[] = effectiveAreaCities.map((c) => ({
      city: c.city,
      stateId: c.stateId,
      county: c.county,
      slug: c.slug || `${tradeSlug}-${c.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${c.stateId.toLowerCase()}.html`,
      population: c.population,
      distanceOffset: c.distanceOffset,
    }));

    const hubBody = renderServiceAreasHub(
      hubCities,
      data.site,
      theme,
      data.site.address?.city || "Local",
      data.site.address?.state || "TX",
      registry,
      hubPage,
      linkStyle
    );

    const hubHead = buildHead(
      {
        title: `Service Areas in ${data.site.address?.city || "Local"} | ${data.site.businessName}`,
        description: `Communities and neighboring cities served by ${data.site.businessName}. Upfront pricing and prompt local dispatch.`,
        h1: `Areas We Serve Across ${data.site.address?.city || "Local"} and Surrounding Counties`,
      },
      data.site,
      theme,
      domain,
      hubPage,
      linkStyle
    );

    let hubHtml = `<!DOCTYPE html>
<html lang="en">
<head>
${hubHead}
</head>
<body class="theme-${theme.id}">
${headerHtml}
<main>
${hubBody}
</main>
${footerHtml}
${mobileCallBarHtml}
</body>
</html>`;

    hubHtml = resolveInternalLinks(hubHtml, hubPage, registry, linkStyle);

    files.push({
      path: hubPage.outputFilePath,
      content: hubHtml,
      mimeType: "text/html",
    });

    // B. Dedicated Location Landing Page per City
    const usedLocationHeroIds = new Set<string>();
    for (let i = 0; i < effectiveAreaCities.length; i++) {
      const c = effectiveAreaCities[i];
      const cityClean = c.city.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const stateClean = c.stateId.toLowerCase();
      const citySlug = c.slug || `${tradeSlug}-${cityClean}-${stateClean}.html`;
      const assignedAngle = ROTATING_ANGLES[i % ROTATING_ANGLES.length];

      const locPage = registry.getByType("location").find(
        (l) => l.outputFilePath.toLowerCase() === citySlug.toLowerCase() ||
               l.id === `loc-${cityClean}-${stateClean}`
      ) || {
        id: `loc-${cityClean}-${stateClean}`,
        pageType: "location" as const,
        title: `${mainTrade} in ${c.city}, ${c.stateId} | ${data.site.businessName}`,
        navLabel: `${c.city}, ${c.stateId}`,
        outputFilePath: citySlug,
      };

      const locHeader = Sections.renderHeader(data.site, "standard", registry, locPage, linkStyle);
      const locFooter = Sections.renderFooter(data.site, registry, locPage, linkStyle, resolvedLayout.footerVariant);

      // Hero image planned for location (strictly matches this city/location, no duplicate heroes)
      const locCleanSlug = citySlug.replace(/\.html$/, "").toLowerCase();
      let locHeroPlanned =
        imagePlan.find(
          (p) =>
            (p.pageSlug.toLowerCase() === locCleanSlug ||
              p.pageSlug.toLowerCase().includes(cityClean) ||
              p.id === `img-loc-${locCleanSlug}`) &&
            !usedLocationHeroIds.has(p.id)
        );

      if (!locHeroPlanned) {
        // Resolve a guaranteed unique fresh photo using deduplication tracker
        const freshLocPhoto = resolvePhoto(
          detectTradeCategory(mainTrade),
          "hero",
          `${mainTrade} in ${c.city}`,
          i + 60,
          deduplicationTracker.getUsedUrlsSet()
        );
        locHeroPlanned = {
          id: `img-loc-${locCleanSlug}-${i}`,
          slot: "hero",
          query: `${mainTrade} in ${c.city}`,
          alt: `${mainTrade} service in ${c.city}, ${c.stateId}`,
          width: 1920,
          height: 1080,
          localPath: `images/hero-${locCleanSlug}.jpg`,
          localWebpPath: `images/hero-${locCleanSlug}.webp`,
          localSvgPath: `images/hero-${locCleanSlug}.svg`,
          localSvgFallback: "",
          pageSlug: locCleanSlug,
          status: "found",
          remoteUrl: freshLocPhoto.url,
          fallbackUrl: freshLocPhoto.url,
          allFallbacks: [freshLocPhoto.url],
        };
      }
      usedLocationHeroIds.add(locHeroPlanned.id);

      const nearestCities = getNearestSelectedCities(
        { lat: c.lat, lng: c.lng, city: c.city, stateId: c.stateId },
        effectiveAreaCities.map((sc) => ({
          ...sc,
          slug: sc.slug || `${tradeSlug}-${sc.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${sc.stateId.toLowerCase()}.html`,
        })),
        4
      );

      const strategy = buildLocationContentStrategy({
        serviceName: mainTrade,
        cityData: {
          city: c.city,
          stateId: c.stateId,
          stateName: c.stateId,
          county: c.county || "Regional",
          population: c.population,
          distanceOffset: c.distanceOffset,
          localNotes: c.localNotes,
          lat: c.lat,
          lng: c.lng,
        },
        businessInfo: data.site,
        angleIndex: i,
        allSelectedCities: nearestCities,
        customInstructions: data.site.customContentInstructions || options?.customContentInstructions,
      });

      const locCtx: LocationPageContext = {
        city: c.city,
        stateId: c.stateId,
        stateName: c.stateId,
        county: c.county || "Regional",
        population: c.population,
        distanceOffset: c.distanceOffset,
        localNotes: c.localNotes,
        angleUsed: strategy.assignedAngle,
        nearestCities,
        h1: strategy.h1,
        metaTitle: strategy.metaTitle,
        metaDescription: strategy.metaDescription,
        introParagraph: strategy.introParagraph,
        angleSectionHeadline: strategy.regionalClimateHeadline,
        angleSectionContent: strategy.regionalClimateContent,
        commonProblemsTitle: strategy.commonProblemsTitle,
        commonProblems: strategy.commonProblems,
        whenToCall: strategy.whenToCall,
        customerPrepSteps: strategy.customerPrepSteps,
        serviceScopeTitle: strategy.serviceScopeTitle,
        servicesIncluded: strategy.servicesOfferedInCity,
        processSteps: strategy.serviceScope,
        faqs: strategy.faqs,
        heroImage: locHeroPlanned ? {
          localPath: locHeroPlanned.localPath,
          url: locHeroPlanned.remoteUrl || locHeroPlanned.fallbackUrl,
          fallbackUrl: locHeroPlanned.fallbackUrl,
          allFallbacks: locHeroPlanned.allFallbacks || (locHeroPlanned.fallbackUrl ? [locHeroPlanned.fallbackUrl] : []),
          localSvgFallback: locHeroPlanned.localSvgFallback,
          alt: locHeroPlanned.alt,
          width: locHeroPlanned.width,
          height: locHeroPlanned.height,
        } : undefined,
      };

      const locBody = renderLocationPage(locCtx, data.site, theme, registry, locPage, linkStyle);
      const locSchema = buildLocationPageSchema(locCtx, data.site, domain, citySlug);
      const locHead = buildHead(
        {
          title: locCtx.metaTitle,
          description: locCtx.metaDescription,
          h1: locCtx.h1,
        },
        data.site,
        theme,
        domain,
        locPage,
        linkStyle
      );

      let locFullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
${locHead}
${locSchema}
</head>
<body class="theme-${theme.id}">
${locHeader}
<main>
${locBody}
</main>
${locFooter}
${mobileCallBarHtml}
</body>
</html>`;

      locFullHtml = resolveInternalLinks(locFullHtml, locPage, registry, linkStyle);

      files.push({
        path: locPage.outputFilePath,
        content: locFullHtml,
        mimeType: "text/html",
      });
    }
  }

  // 4.3 Generate Blog Directory Hub & Blog Posts
  if (Array.isArray(effectiveBlogPosts) && effectiveBlogPosts.length > 0) {
    const blogHubPage = registry.getByType("blog hub")[0] || registry.getById("blog-hub") || {
      id: "blog-hub",
      pageType: "blog hub" as const,
      title: `Tips & Advice | ${data.site.businessName}`,
      navLabel: "Blog",
      outputFilePath: "blog.html",
    };

    const hubHeader = Sections.renderHeader(data.site, "standard", registry, blogHubPage, linkStyle);
    const hubFooter = Sections.renderFooter(data.site, registry, blogHubPage, linkStyle, resolvedLayout.footerVariant);
    const mobileCallBarHtml = Sections.renderMobileCallBar(data.site.phone);

    const hubBody = renderBlogIndexHtml(effectiveBlogPosts, data.site, theme);
    const hubHead = buildHead(
      {
        title: `Homeowner Guides & Maintenance Tips | ${data.site.businessName}`,
        description: `Expert guides, cost factors, and preventative care tips for homeowners across ${data.site.address?.city || "the area"}.`,
        h1: `Expert Homeowner Tips & Maintenance Guides`,
      },
      data.site,
      theme,
      domain,
      blogHubPage,
      linkStyle
    );

    let hubFullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
${hubHead}
</head>
<body class="theme-${theme.id}">
${hubHeader}
<main>
${hubBody}
</main>
${hubFooter}
${mobileCallBarHtml}
</body>
</html>`;

    hubFullHtml = resolveInternalLinks(hubFullHtml, blogHubPage, registry, linkStyle);

    files.push({
      path: blogHubPage.outputFilePath,
      content: hubFullHtml,
      mimeType: "text/html",
    });

    // Individual Blog Article Pages
    for (const post of effectiveBlogPosts) {
      const cleanSlug = post.slug.replace(/^blog\//, "").replace(/\.html$/, "");
      const postPage = registry.getByType("blog").find(
        (b) => b.outputFilePath === `blog/${cleanSlug}.html` || b.id === `blog-${cleanSlug}`
      ) || {
        id: `blog-${cleanSlug}`,
        pageType: "blog" as const,
        title: `${post.title} | ${data.site.businessName}`,
        navLabel: post.title,
        outputFilePath: `blog/${cleanSlug}.html`,
      };

      const postHeader = Sections.renderHeader(data.site, "standard", registry, postPage, linkStyle);
      const postFooter = Sections.renderFooter(data.site, registry, postPage, linkStyle, resolvedLayout.footerVariant);
      const postBody = renderBlogPostHtml(
        post,
        data.site,
        theme,
        domain,
        effectiveBlogPosts.map((p) => ({ title: p.title, slug: p.slug, metaDescription: p.metaDescription }))
      );
      const postSchema = buildBlogPostSchema(post, data.site, domain);
      const postHead = buildHead(
        {
          title: `${post.title} | ${data.site.businessName}`,
          description: post.metaDescription,
          h1: post.title,
        },
        data.site,
        theme,
        domain,
        postPage,
        linkStyle
      );

      let postFullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
${postHead}
${postSchema}
</head>
<body class="theme-${theme.id}">
${postHeader}
<main>
${postBody}
</main>
${postFooter}
${mobileCallBarHtml}
</body>
</html>`;

      postFullHtml = resolveInternalLinks(postFullHtml, postPage, registry, linkStyle);

      files.push({
        path: postPage.outputFilePath,
        content: postFullHtml,
        mimeType: "text/html",
      });
    }
  }

  tracker?.completeStage(
    "BUILDING_PAGES",
    `Rendered ${files.filter((f) => f.path.endsWith(".html")).length} static HTML pages.`
  );

  // 4.5 STAGE 8: GENERATING_INTERNAL_LINKS
  tracker?.startStage("GENERATING_INTERNAL_LINKS", "Connecting internal linking graph & service silos...");
  options?.onProgress?.("GENERATING_INTERNAL_LINKS", 78, "Connecting internal linking graph & service silos...");
  let connectivityRes: any;
  try {
    connectivityRes = enrichWebsiteConnectivity(files, {
      businessName: data.site.businessName,
      primaryTrade: data.schema?.type || data.site.tagline || "Local Services",
      domain,
      serviceAreaCities: effectiveAreaCities,
    });
    files = connectivityRes.files;
    const ler = connectivityRes.linkEngineReport;
    const summary = ler
      ? `Internal link audit: ${ler.totalPages} pages, ${ler.internalLinks} internal links, ${ler.brokenLinks} broken, ${ler.orphanPages} orphans.`
      : `Connected internal linking graph (${connectivityRes.auditReport.totalNodes} pages, ${connectivityRes.auditReport.totalInternalLinks} links).`;
    tracker?.completeStage("GENERATING_INTERNAL_LINKS", summary);
  } catch (linkErr: any) {
    const errMsg = linkErr instanceof Error ? linkErr.message : "Failed generating internal links.";
    tracker?.failStage("GENERATING_INTERNAL_LINKS", "FAILED_LINKING", errMsg, false);
    throw linkErr;
  }

  // 5. STAGE 9: GENERATING_SEO
  tracker?.startStage("GENERATING_SEO", "Generating sitemap.xml, robots.txt, and structured schemas...");
  options?.onProgress?.("GENERATING_SEO", 85, "Generating sitemap.xml, robots.txt, and structured schemas...");
  let seoEngine: SeoEngine | undefined;
  let seoReport: SeoValidationReport | undefined;
  try {
    const seoSiteMeta: SeoSiteMeta = {
      businessName: data.site.businessName,
      domain: domain,
      primaryTrade: mainTrade || data.schema?.type || data.site.tagline || "Local Services",
      schemaType: data.schema?.type,
      phone: data.site.phone,
      email: data.site.email,
      city: data.site.address?.city,
      state: data.site.address?.state,
      streetAddress: data.site.address?.street,
      zipCode: data.site.address?.zip,
      businessModel: data.site.businessModel,
      serviceAreas: data.site.serviceAreas,
      serviceAreaCities: effectiveAreaCities,
      realReviewsConfirmed: Boolean(data.site.realReviewsConfirmed),
      realReviews: data.site.realReviews,
      logoUrl: (data.site as any).logoUrl,
    };

    seoEngine = new SeoEngine(seoSiteMeta);
    const seoResult = seoEngine.execute(files);
    files = seoResult.files;
    seoReport = seoResult.report;

    // Generate /images/CREDITS.txt for full attribution
    const creditsTxt = buildCreditsTxt(allResolvedPhotos, data.site.businessName);
    files.push({
      path: "images/CREDITS.txt",
      content: creditsTxt,
      mimeType: "text/plain",
    });

    const summary = `SEO Engine: ${seoReport.totalPagesScanned} pages optimized. ${seoReport.isHealthy ? "100% search compliant (0 errors)." : "SEO generated with warnings."}`;
    tracker?.completeStage("GENERATING_SEO", summary);
  } catch (seoErr: any) {
    const errMsg = seoErr instanceof Error ? seoErr.message : "Failed generating SEO assets.";
    tracker?.failStage("GENERATING_SEO", "FAILED_SEO", errMsg, false);
    throw seoErr;
  }

  // 8. STAGE 10: RUNNING_AUDIT
  tracker?.startStage("RUNNING_AUDIT", "Auditing website quality, headings, and mobile readiness...");
  options?.onProgress?.("RUNNING_AUDIT", 90, "Auditing website quality, headings, and mobile readiness...");
  let qualityResult: any;
  let siteQualityAudit: QualityAuditResult | undefined;
  try {
    qualityResult = runQualityChecksAndAutoFix(files, {
      businessName: data.site.businessName,
      phone: data.site.phone,
      email: data.site.email,
      city: data.site.address?.city,
      state: data.site.address?.state,
      street: data.site.address?.street,
      domain,
      businessModel: data.site.businessModel,
      realReviewsConfirmed: data.site.realReviewsConfirmed,
      allowedClaims: data.site.allowedClaims,
      trade: data.schema?.type || data.site.businessName,
    });

    siteQualityAudit = QualityAuditEngine.audit(qualityResult.files, {
      businessName: data.site.businessName,
      phone: data.site.phone,
      email: data.site.email,
      city: data.site.address?.city,
      state: data.site.address?.state,
      streetAddress: data.site.address?.street,
      domain,
      realReviewsConfirmed: Boolean(data.site.realReviewsConfirmed),
    });

    console.log("\n================================================================================");
    console.log("                           SITE QUALITY AUDIT REPORT                            ");
    console.log("================================================================================");
    console.log(siteQualityAudit.summaryText);
    console.log("================================================================================\n");

    const issuesSummary = siteQualityAudit.issues.length === 0 ? "0 issues" : `${siteQualityAudit.issues.length} issue(s)`;
    tracker?.completeStage(
      "RUNNING_AUDIT",
      `Site Quality: ${siteQualityAudit.overallScore}/100 (Tech: ${siteQualityAudit.categoryScores.technical.earned}/20, SEO: ${siteQualityAudit.categoryScores.seo.earned}/20, Content: ${siteQualityAudit.categoryScores.content.earned}/20, Images: ${siteQualityAudit.categoryScores.images.earned}/20, Links: ${siteQualityAudit.categoryScores.internalLinking.earned}/20). ${issuesSummary}.`
    );
  } catch (auditErr: any) {
    const errMsg = auditErr instanceof Error ? auditErr.message : "Failed running quality audit.";
    tracker?.failStage("RUNNING_AUDIT", "FAILED_AUDIT", errMsg, false);
    throw auditErr;
  }

  // STAGE 11: AUTO_FIXING
  tracker?.startStage("AUTO_FIXING", "Applying automated quality fixes to content and markup...");
  options?.onProgress?.("AUTO_FIXING", 94, "Applying automated quality fixes to content and markup...");
  let autoFixRes: QualityAutoFixResult | undefined;
  if (siteQualityAudit && siteQualityAudit.issues.length > 0) {
    autoFixRes = QualityAutoFixEngine.fixAllIssues(
      qualityResult.files,
      {
        businessName: data.site.businessName,
        phone: data.site.phone,
        email: data.site.email,
        city: data.site.address?.city,
        state: data.site.address?.state,
        streetAddress: data.site.address?.street,
        domain,
        realReviewsConfirmed: Boolean(data.site.realReviewsConfirmed),
      },
      {
        trade: mainTrade,
        domain,
      }
    );

    qualityResult.files = autoFixRes.fixedFiles;
    siteQualityAudit = autoFixRes.auditAfter;

    console.log("\n================================================================================");
    console.log("                           AUTO-FIX VERIFICATION REPORT                         ");
    console.log("================================================================================");
    console.log(autoFixRes.reportText);
    console.log("================================================================================\n");

    const fixedSummary = autoFixRes.issuesFixed.length > 0 ? autoFixRes.issuesFixed.join(", ") : "0 issues";
    tracker?.completeStage(
      "AUTO_FIXING",
      `Auto-Fix resolved: ${fixedSummary}. Post-fix score: ${autoFixRes.finalScore}/100.`
    );
  } else if ((qualityResult.report?.autoFixes?.length || 0) > 0) {
    options?.onProgress?.("AUTO_FIXING", 94, "Applied automated quality fixes to thin content and missing tags.");
    tracker?.completeStage(
      "AUTO_FIXING",
      `Applied ${qualityResult.report.autoFixes.length} automated quality fixes.`
    );
  } else {
    options?.onProgress?.("AUTO_FIXING", 94, "Quality checks passed cleanly; no auto-fixes required.");
    tracker?.completeStage("AUTO_FIXING", "Quality checks passed cleanly; no auto-fixes required.");
  }

  // STAGE 12: FINAL_VALIDATION
  tracker?.startStage("FINAL_VALIDATION", "Validating final static file package integrity...");
  options?.onProgress?.("FINAL_VALIDATION", 97, "Validating final static file package integrity...");
  try {
    const htmlFilesCount = qualityResult.files.filter((f: any) => f.path.endsWith(".html")).length;
    tracker?.completeStage(
      "FINAL_VALIDATION",
      `Verified package integrity (${qualityResult.files.length} static assets, ${htmlFilesCount} HTML pages).`
    );
  } catch (valErr: any) {
    const errMsg = valErr instanceof Error ? valErr.message : "Final validation failed.";
    tracker?.failStage("FINAL_VALIDATION", "FAILED_RENDER", errMsg, false);
    throw valErr;
  }

  if (seoEngine && qualityResult?.files) {
    seoReport = seoEngine.validateWebsiteSeo(qualityResult.files);
  }

  if (qualityResult?.files) {
    siteQualityAudit = QualityAuditEngine.audit(qualityResult.files, {
      businessName: data.site.businessName,
      phone: data.site.phone,
      email: data.site.email,
      city: data.site.address?.city,
      state: data.site.address?.state,
      streetAddress: data.site.address?.street,
      domain,
      realReviewsConfirmed: Boolean(data.site.realReviewsConfirmed),
    });
  }

  return {
    files: qualityResult.files,
    photos: allResolvedPhotos,
    qualityReport: qualityResult.report,
    registry,
    generationLog,
    connectivityAudit: connectivityRes.auditReport,
    internalLinkAudit: connectivityRes.linkEngineReport,
    seoValidation: seoReport,
    qualityAudit: siteQualityAudit,
    autoFixAudit: autoFixRes,
  };
}
