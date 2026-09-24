import fs from "fs";
import path from "path";
import { SiteContentJSON, PageContentJSON, SectionJSON, ImageSlotJSON } from "../lib/generator/content-schema";
import { Theme } from "../lib/themes";
import { detectTradeCategory, resolvePhoto, ResolvedImage } from "../lib/photos/photo-service";
import { resolveStockPhoto, buildCreditsTxt, StockPhoto } from "../lib/photos/stock-service";
import { findNicheByIndustry } from "../niches";
import { PAGE_LAYOUTS, detectPageLayoutType } from "./layouts";
import * as Sections from "./sections";
import { runQualityChecksAndAutoFix, QualityReport, AssembleFile } from "../lib/quality/quality-checker";

export interface AssembleOptions {
  domain?: string;
  mapEmbed?: string;
  pexelsKey?: string;
  pixabayKey?: string;
  preferredSource?: "pexels" | "pixabay";
}

export interface AssembledWebsite {
  files: AssembleFile[];
  photos?: StockPhoto[];
  qualityReport?: QualityReport;
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
 * Generates SEO meta tags, Google Fonts, and Open Graph tags for <head>
 */
function buildHead(
  seo: PageContentJSON["seo"],
  site: SiteContentJSON["site"],
  theme: Theme,
  domain: string,
  slug: string
): string {
  const headingFont = encodeURIComponent(theme.fonts.heading);
  const bodyFont = encodeURIComponent(theme.fonts.body);
  const title = seo.title.includes("|") ? seo.title : `${seo.title} | ${site.businessName}`;
  const canonicalUrl = `https://${domain}/${slug === "index" ? "" : `${slug}.html`}`;

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
  <link rel="stylesheet" href="css/style.css">
  <link rel="stylesheet" href="styles.css">

  <!-- Shared App Scripts -->
  <script src="js/main.js" defer></script>
  <script src="script.js" defer></script>`;
}

/**
 * Generates rich JSON-LD structured schema in code
 */
function buildSchemaOrg(
  site: SiteContentJSON["site"],
  page: PageContentJSON,
  schemaType: string,
  domain: string
): string {
  const isHome = page.slug === "index";
  const address = site.address || { city: "Dallas", state: "TX" };
  const phone = site.phone || "";
  const canonicalUrl = `https://${domain}/${page.slug === "index" ? "" : `${page.slug}.html`}`;

  // 1. Home Page: LocalBusiness Schema
  if (isHome) {
    const localBusiness = {
      "@context": "https://schema.org",
      "@type": schemaType || "LocalBusiness",
      name: site.businessName,
      description: site.tagline || page.seo.description,
      telephone: phone,
      email: site.email || undefined,
      url: `https://${domain}`,
      address: {
        "@type": "PostalAddress",
        streetAddress: address.street || undefined,
        addressLocality: address.city,
        addressRegion: address.state,
        postalCode: address.zip || undefined,
        addressCountry: address.country || "US",
      },
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

  // 2. Service Pages: Service Schema + BreadcrumbList
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
  const tradeCategory = detectTradeCategory(data.schema?.type || data.site.businessName);

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

  // Fallback CSS & JS if file read failed in serverless bundle
  if (!baseCss) {
    baseCss = `/* AltoFox Fallback CSS */
body { font-family: sans-serif; line-height: 1.6; margin: 0; padding: 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 16px; }
.btn { display: inline-flex; padding: 12px 24px; border-radius: 8px; font-weight: bold; }
.btn-primary { background: var(--color-primary, #1D4ED8); color: white; }`;
  }

  const combinedCss = `${buildThemeVariables(theme)}\n${baseCss}`;
  const files: AssembledWebsite["files"] = [];
  const usedPhotoIds = new Set<string>();
  const allResolvedPhotos: StockPhoto[] = [];
  let photoIndex = 0;

  // 1. Add CSS file (both css/style.css and styles.css for compatibility)
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

  // 2. Add JS file (both js/main.js and script.js)
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

  // 3. Assemble each HTML Page
  for (const page of data.pages) {
    const slug = page.slug.replace(/\.html$/, "");
    const layoutType = detectPageLayoutType(slug);
    const layoutBlueprint = PAGE_LAYOUTS[layoutType] || PAGE_LAYOUTS.custom;

    // Use AI sections if provided; otherwise fill with blueprint defaults
    const activeSections: SectionJSON[] = page.sections && page.sections.length > 0
      ? page.sections
      : layoutBlueprint.defaultSections.map((s) => ({
          type: s.type,
          variant: s.variant || "default",
          content: {},
          images: [],
        }));

    // Header (always rendered first)
    const headerHtml = Sections.renderHeader(data.site);

    // Render body sections in order
    const renderedSectionsHtml: string[] = [];

    const niche = findNicheByIndustry(data.schema?.type || data.site.businessName || data.site.tagline || "");

    for (const section of activeSections) {
      // Resolve real photos for this section
      const sectionImages: ResolvedImage[] = [];

      if (section.images && section.images.length > 0) {
        for (const img of section.images) {
          const slotType = img.slot || (section.type === "hero" ? "hero" : "service");
          const nicheFallback = slotType === "hero"
            ? niche.imageQueries.hero[photoIndex % niche.imageQueries.hero.length]
            : slotType === "about"
            ? niche.imageQueries.team[photoIndex % niche.imageQueries.team.length]
            : slotType === "gallery"
            ? niche.imageQueries.work[photoIndex % niche.imageQueries.work.length]
            : niche.imageQueries.services[photoIndex % niche.imageQueries.services.length];

          const stock = await resolveStockPhoto({
            query: img.query || nicheFallback || page.seo.h1 || data.site.businessName,
            alt: img.alt,
            slot: slotType,
            preferredSource: options?.preferredSource,
            pexelsKey: options?.pexelsKey,
            pixabayKey: options?.pixabayKey,
            usedPhotoIds,
            tradeCategory,
            city: data.site.address?.city,
            businessName: data.site.businessName,
            index: photoIndex++,
          });
          sectionImages.push(stock);
          allResolvedPhotos.push(stock);
        }
      } else {
        const defaultSlots = [section.type === "hero" ? "hero" : "service", "service", "service"];
        for (const slotName of defaultSlots) {
          const nicheFallback = slotName === "hero"
            ? niche.imageQueries.hero[photoIndex % niche.imageQueries.hero.length]
            : slotName === "about"
            ? niche.imageQueries.team[photoIndex % niche.imageQueries.team.length]
            : slotName === "gallery"
            ? niche.imageQueries.work[photoIndex % niche.imageQueries.work.length]
            : niche.imageQueries.services[photoIndex % niche.imageQueries.services.length];

          const stock = await resolveStockPhoto({
            query: nicheFallback || page.seo.h1 || data.site.businessName,
            slot: slotName,
            preferredSource: options?.preferredSource,
            pexelsKey: options?.pexelsKey,
            pixabayKey: options?.pixabayKey,
            usedPhotoIds,
            tradeCategory,
            city: data.site.address?.city,
            businessName: data.site.businessName,
            index: photoIndex++,
          });
          sectionImages.push(stock);
          allResolvedPhotos.push(stock);
        }
      }

      switch (section.type) {
        case "emergencyBanner":
          renderedSectionsHtml.push(Sections.renderEmergencyBanner(section, data.site.phone));
          break;
        case "hero":
          // Ensure hero uses page H1 and SEO details if not in section content
          const heroSection = {
            ...section,
            content: {
              h1: page.seo.h1,
              subheadline: page.seo.description,
              ...section.content,
            },
          };
          renderedSectionsHtml.push(Sections.renderHero(heroSection, data.site.phone, sectionImages));
          break;
        case "trustBar":
          renderedSectionsHtml.push(Sections.renderTrustBar(section));
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
          renderedSectionsHtml.push(Sections.renderTestimonials(section));
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

    // Footer & Mobile Call Bar (always rendered)
    const footerHtml = Sections.renderFooter(data.site);
    const mobileCallBarHtml = Sections.renderMobileCallBar(data.site.phone);

    // Build Head & Schema
    const headHtml = buildHead(page.seo, data.site, theme, domain, slug);
    const schemaHtml = buildSchemaOrg(data.site, page, data.schema?.type || "LocalBusiness", domain);

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
${headHtml}
${schemaHtml}
</head>
<body class="theme-${theme.id}">
${headerHtml}

  <main>
${renderedSectionsHtml.join("\n\n")}
  </main>

${footerHtml}
${mobileCallBarHtml}
</body>
</html>`;

    files.push({
      path: `${slug}.html`,
      content: fullHtml,
      mimeType: "text/html",
    });
  }

  // 4. Generate sitemap.xml
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${data.pages
  .map(
    (p) => `  <url>
    <loc>https://${domain}/${p.slug === "index" ? "" : `${p.slug}.html`}</loc>
    <changefreq>weekly</changefreq>
    <priority>${p.slug === "index" ? "1.0" : "0.8"}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;
  files.push({
    path: "sitemap.xml",
    content: sitemapXml,
    mimeType: "application/xml",
  });

  // 5. Generate robots.txt
  files.push({
    path: "robots.txt",
    content: `User-agent: *\nAllow: /\nSitemap: https://${domain}/sitemap.xml\n`,
    mimeType: "text/plain",
  });

  // 6. Generate /images/CREDITS.txt for full attribution
  const creditsTxt = buildCreditsTxt(allResolvedPhotos, data.site.businessName);
  files.push({
    path: "images/CREDITS.txt",
    content: creditsTxt,
    mimeType: "text/plain",
  });

  // 7. Run comprehensive Automated Quality Checks & Auto-Fixes before returning/download
  const qualityResult = runQualityChecksAndAutoFix(files, {
    businessName: data.site.businessName,
    phone: data.site.phone,
    email: data.site.email,
    city: data.site.address?.city,
    state: data.site.address?.state,
    street: data.site.address?.street,
    domain,
  });

  return {
    files: qualityResult.files,
    photos: allResolvedPhotos,
    qualityReport: qualityResult.report,
  };
}
