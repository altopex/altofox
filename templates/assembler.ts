import fs from "fs";
import path from "path";
import { SiteContentJSON, PageContentJSON, SectionJSON } from "../lib/generator/content-schema";
import { Theme } from "../lib/themes";
import { detectTradeCategory } from "../lib/photos/photo-service";
import { resolveStockPhoto, buildCreditsTxt, StockPhoto } from "../lib/photos/stock-service";
import { findNicheByIndustry } from "../niches";
import { PAGE_LAYOUTS, detectPageLayoutType } from "./layouts";
import * as Sections from "./sections";
import { renderServiceAreasHub, ServiceAreaCityItem } from "./sections/serviceAreasHub";
import { renderLocationPage, buildLocationPageSchema, LocationPageContext } from "./sections/locationPage";
import { getNearestSelectedCities } from "../lib/data/us-cities";
import { runQualityChecksAndAutoFix, QualityReport, AssembleFile } from "../lib/quality/quality-checker";
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
  bundleImagesFromPlan,
  ImagePlanSlot,
} from "../lib/photos/image-bundler";
import {
  validateAndRepairSection,
  scanHtmlForForbiddenTokens,
  GenerationAuditEntry,
} from "../lib/generator/strict-section-schemas";

export interface AssembleOptions {
  domain?: string;
  mapEmbed?: string;
  pexelsKey?: string;
  pixabayKey?: string;
  preferredSource?: "bing" | "pexels" | "pixabay";
  linkStyle?: LinkStyle;
  useFolderStructure?: boolean;
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
}

export interface AssembledWebsite {
  files: AssembleFile[];
  photos?: StockPhoto[];
  qualityReport?: QualityReport;
  registry?: PageRegistry;
  generationLog?: GenerationAuditEntry[];
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
  const title = seo.title.includes("|") ? seo.title : `${seo.title} | ${site.businessName}`;
  const canonicalUrl = `https://${domain}/${currentPage.outputFilePath === "index.html" ? "" : currentPage.outputFilePath}`;
  const cssHref = assetPath(currentPage, "css/style.css");
  const jsHref = assetPath(currentPage, "js/main.js");

  return `
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${seo.description.slice(0, 160)}">
  <link rel="canonical" href="${canonicalUrl}">

  <!-- Open Graph / Social Media -->
  <meta property="og:type" content="website">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${(seo.ogDescription || seo.description).slice(0, 200)}">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${(seo.ogDescription || seo.description).slice(0, 200)}">

  <!-- Google Fonts: ${theme.fonts.heading} & ${theme.fonts.body} -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=${headingFont}:wght@500;600;700;800&family=${bodyFont}:wght@400;500;600;700&display=swap" rel="stylesheet">

  <!-- Design System CSS -->
  <link rel="stylesheet" href="${cssHref}">

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
      areaServed: (site.serviceAreas || []).map((a) => ({
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
  const mainTrade = data.schema?.type || data.site.businessName || "Local Service";
  const tradeSlug = mainTrade.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  const tradeCategory = detectTradeCategory(mainTrade);
  const linkStyle: LinkStyle = options?.linkStyle || "web";
  const useFolderStructure = Boolean(options?.useFolderStructure);

  const effectiveAreaCities = options?.serviceAreaCities || (data.site as any).serviceAreaCities || [];

  // 1. Build Master Page Registry BEFORE any HTML is generated
  const registry = buildMasterPageRegistry({
    businessName: data.site.businessName,
    nicheTrade: mainTrade,
    useFolderStructure,
    mainPages: data.pages.map((p) => ({
      slug: p.slug,
      title: p.seo.title,
      navLabel: p.seo.title.split("|")[0].trim(),
    })),
    locations: effectiveAreaCities.map((c: any) => ({
      city: c.city,
      stateId: c.stateId,
      county: c.county,
      slug: c.slug || `${tradeSlug}-${c.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${c.stateId.toLowerCase()}.html`,
      lat: c.lat,
      lng: c.lng,
    })),
    hasServicesHub: true,
    hasAreasHub: effectiveAreaCities.length > 0,
  });

  // 2. Create Image Plan & Bundle Images into files
  const imagePlan = createImagePlan(
    data.pages,
    mainTrade,
    data.site.address?.city || "Local",
    data.site.businessName,
    effectiveAreaCities
  );
  const bundledImages = bundleImagesFromPlan(imagePlan);

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
  const files: AssembledWebsite["files"] = [];
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

    const activeSections: SectionJSON[] = page.sections && page.sections.length > 0
      ? page.sections
      : layoutBlueprint.defaultSections.map((s) => ({
          type: s.type,
          variant: s.variant || "default",
          content: {},
          images: [],
        }));

    // Header & Navigation from Registry
    const headerHtml = Sections.renderHeader(data.site, "standard", registry, currentPage, linkStyle);

    // Breadcrumbs for inner pages
    let breadcrumbsHtml = "";
    if (currentPage.pageType !== "home") {
      const bRes = renderBreadcrumbs(registry, currentPage, domain, linkStyle);
      breadcrumbsHtml = bRes.html;
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
      const plannedSlots = imagePlan.filter((p) => p.pageSlug === slug && p.slot === (section.type === "hero" ? "hero" : "service"));
      const sectionImages: any[] = [];

      for (let i = 0; i < Math.max(plannedSlots.length, 1); i++) {
        const pSlot = plannedSlots[i];
        if (pSlot) {
          sectionImages.push({
            url: pSlot.localPath,
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
          renderedSectionsHtml.push(Sections.renderServices(section, sectionImages));
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
          renderedSectionsHtml.push(Sections.renderServiceAreas(section, data.site.serviceAreas, options?.mapEmbed));
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
          renderedSectionsHtml.push(Sections.renderCtaBanner(section, data.site.phone, sectionImages));
          break;
        case "contactForm":
          renderedSectionsHtml.push(Sections.renderContactForm(section, data.site, options?.mapEmbed));
          break;
        default:
          break;
      }
    }

    // Footer & Mobile Call Bar
    const footerHtml = Sections.renderFooter(data.site, registry, currentPage, linkStyle);
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
    const footerHtml = Sections.renderFooter(data.site, registry, hubPage, linkStyle);
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
    const ROTATING_ANGLES = [
      "Common seasonal challenges and climate conditions affecting local homes in this region",
      "What local homeowners can expect during our dispatch, diagnosis, and arrival",
      "Scheduling, travel, and how we coordinate same-day emergency coverage",
      "How to choose an honest, licensed trade contractor in this specific community",
      "Service-specific maintenance and prevention guide tailored to regional architecture",
    ];

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
      const locFooter = Sections.renderFooter(data.site, registry, locPage, linkStyle);

      // Hero image planned for location
      const locHeroPlanned = imagePlan.find((p) => p.pageSlug === citySlug.replace(/\.html$/, "") || p.slot === "hero");

      const nearestCities = getNearestSelectedCities(
        { lat: c.lat, lng: c.lng, city: c.city, stateId: c.stateId },
        effectiveAreaCities.map((sc) => ({
          ...sc,
          slug: sc.slug || `${tradeSlug}-${sc.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${sc.stateId.toLowerCase()}.html`,
        })),
        4
      );

      const locCtx: LocationPageContext = {
        city: c.city,
        stateId: c.stateId,
        stateName: c.stateId,
        county: c.county || "Regional",
        population: c.population,
        distanceOffset: c.distanceOffset,
        localNotes: c.localNotes,
        angleUsed: assignedAngle,
        nearestCities,
        h1: `${mainTrade} in ${c.city}, ${c.stateId}`,
        metaTitle: `${mainTrade} in ${c.city}, ${c.stateId} | ${data.site.businessName}`,
        metaDescription: `Prompt, licensed ${mainTrade.toLowerCase()} in ${c.city}, ${c.stateId}. Upfront pricing and satisfaction guaranteed. Call now!`,
        introParagraph: `When you need dependable, prompt ${mainTrade.toLowerCase()} in ${c.city} and throughout ${c.county} County, our experienced technicians provide upfront estimates and fast dispatch. We understand the specific plumbing and utility configurations across local properties.`,
        angleSectionHeadline: `Professional Standards & Regional Service in ${c.city}`,
        angleSectionContent: `<p>Homes and commercial facilities in ${c.city} face unique demands through changing regional seasons. From sudden seasonal shifts to heavy utility usage, ensuring reliable performance requires prompt local expertise.</p><p>Our certified technicians arrive fully equipped with modern diagnostic tools to resolve issues cleanly on the first visit, preventing costly secondary property damage.</p>`,
        servicesIncluded:
          data.site.serviceAreas && data.site.serviceAreas.length > 0
            ? data.site.serviceAreas.slice(0, 6)
            : ["24/7 Emergency Repairs", "Diagnostic Inspection", "System Maintenance & Replacement"],
        processSteps: [
          { title: "Direct Local Dispatch", desc: `Call our team for fast coordination to your ${c.city} location.` },
          { title: "Upfront Evaluation", desc: "We diagnose the issue thoroughly and provide clear, flat-rate options." },
          { title: "Guaranteed Resolution", desc: "Work completed cleanly according to local building codes with parts warranty." },
        ],
        faqs: [
          { question: `How fast can you dispatch to ${c.city}?`, answer: `We typically arrive within 45 to 60 minutes for priority calls across ${c.city} and ${c.county} County.` },
          { question: `Are your technicians licensed in ${c.stateId}?`, answer: `Yes, all work is performed by state-licensed technicians adhering strictly to municipal safety codes.` },
          { question: `Do you provide upfront pricing for ${c.city} residents?`, answer: "Always. We evaluate your job on-site and present transparent flat-rate pricing before starting any work." },
        ],
        heroImage: locHeroPlanned ? {
          localPath: locHeroPlanned.localPath,
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

  // 5. Generate sitemap.xml including ALL generated HTML pages
  const allHtmlFiles = files.filter((f) => f.path.endsWith(".html"));
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allHtmlFiles
  .map(
    (h) => `  <url>
    <loc>https://${domain}/${h.path === "index.html" ? "" : h.path}</loc>
    <changefreq>weekly</changefreq>
    <priority>${h.path === "index.html" ? "1.0" : h.path === "service-areas.html" ? "0.9" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
  files.push({
    path: "sitemap.xml",
    content: sitemapXml,
    mimeType: "application/xml",
  });

  // 6. Generate robots.txt
  files.push({
    path: "robots.txt",
    content: `User-agent: *\nAllow: /\nSitemap: https://${domain}/sitemap.xml\n`,
    mimeType: "text/plain",
  });

  // 7. Generate /images/CREDITS.txt for full attribution
  const creditsTxt = buildCreditsTxt(allResolvedPhotos, data.site.businessName);
  files.push({
    path: "images/CREDITS.txt",
    content: creditsTxt,
    mimeType: "text/plain",
  });

  // 8. Run Quality Checks
  const qualityResult = runQualityChecksAndAutoFix(files, {
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

  return {
    files: qualityResult.files,
    photos: allResolvedPhotos,
    qualityReport: qualityResult.report,
    registry,
    generationLog,
  };
}
