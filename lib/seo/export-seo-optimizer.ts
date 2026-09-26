/**
 * Google Search SEO & Core Web Vitals Export Optimizer
 * 
 * Automatically enhances exported static HTML files to conform to strict
 * Google Search ranking algorithms, mobile-first indexing, and Core Web Vitals:
 * 1. Meta Tag Injector: <title>, meta description, canonical URL, OpenGraph, viewport, charset.
 * 2. Structured Data (JSON-LD): Schema.org markup tailored to site type (LocalBusiness, Organization, WebSite, BlogPosting).
 * 3. Semantic Heading Hierarchy & Alt Attributes: Exactly one <h1>, sequential <h2>/<h3>, mandatory descriptive alt tags.
 * 4. Core Web Vitals Performance: loading="lazy", decoding="async", explicit width/height to avoid CLS, inlined critical CSS.
 * 5. Crawler Files: Automated compliant sitemap.xml and robots.txt generation.
 */

export interface ExportSeoOptions {
  pagePath: string;
  projectName: string;
  domain?: string;
  businessName?: string;
  businessType?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  address?: string;
  zipCode?: string;
  serviceAreaCities?: string[];
  description?: string;
  canonicalBaseUrl?: string;
  criticalCss?: string;
  inlineAllCss?: boolean;
}

/**
 * Maps common business types / trades to Schema.org LocalBusiness subtypes.
 */
function resolveSchemaType(businessType?: string): string {
  const type = (businessType || "").toLowerCase().trim();
  if (type.includes("plumb")) return "Plumber";
  if (type.includes("roof")) return "RoofingContractor";
  if (type.includes("electric")) return "Electrician";
  if (type.includes("hvac") || type.includes("air condition") || type.includes("heat")) return "HVACBusiness";
  if (type.includes("landscap") || type.includes("lawn") || type.includes("tree")) return "HomeAndConstructionBusiness";
  if (type.includes("clean") || type.includes("janitor") || type.includes("maid")) return "HomeAndConstructionBusiness";
  if (type.includes("paint")) return "HousePainter";
  if (type.includes("locksmith")) return "Locksmith";
  if (type.includes("pest")) return "HomeAndConstructionBusiness";
  if (type.includes("contractor") || type.includes("construct") || type.includes("builder") || type.includes("remodel")) return "GeneralContractor";
  if (type.includes("dent") || type.includes("orthodont")) return "Dentist";
  if (type.includes("legal") || type.includes("law") || type.includes("attorney")) return "LegalService";
  if (type.includes("med") || type.includes("clinic") || type.includes("doctor")) return "MedicalBusiness";
  if (type.includes("auto") || type.includes("mechanic") || type.includes("car repair")) return "AutoRepair";
  if (type.includes("real estate") || type.includes("realtor")) return "RealEstateAgent";
  if (type.includes("account") || type.includes("cpa") || type.includes("tax")) return "AccountingService";
  if (type.includes("restaurant") || type.includes("cafe") || type.includes("diner")) return "Restaurant";

  // Fallback to LocalBusiness or Organization
  return businessType ? "LocalBusiness" : "Organization";
}

/**
 * Escapes characters for safe inclusion in HTML attribute values.
 */
function escapeHtmlAttr(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Derives a human-friendly title from a filename slug.
 */
function slugToTitle(slug: string): string {
  const clean = slug.replace(/\.html$/i, "").replace(/^.*[\\\/]/, "");
  if (!clean || clean === "index") return "Home";
  return clean
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Generates automated Schema.org JSON-LD structured data.
 */
export function generateSchemaJsonLd(options: ExportSeoOptions): Record<string, any> {
  const domain = (options.domain || options.canonicalBaseUrl || "example.com")
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
  const baseUrl = `https://${domain}`;
  const cleanSlug = options.pagePath === "index.html" ? "" : options.pagePath.replace(/^\/+/, "");
  const canonicalUrl = `${baseUrl}/${cleanSlug}`;

  const schemaType = resolveSchemaType(options.businessType);
  const businessName = options.businessName || options.projectName || "Local Service Provider";
  const description = options.description || `${businessName} provides premier ${options.businessType || "professional"} services in ${options.city || "your local area"}.`;

  const isBlog = options.pagePath.startsWith("blog/") || options.pagePath.includes("blog");

  if (isBlog) {
    return {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": canonicalUrl,
      },
      "headline": slugToTitle(options.pagePath),
      "description": description,
      "publisher": {
        "@type": "Organization",
        "name": businessName,
        "url": baseUrl,
      },
      "author": {
        "@type": "Organization",
        "name": businessName,
      },
      "datePublished": new Date().toISOString().split("T")[0],
      "dateModified": new Date().toISOString().split("T")[0],
    };
  }

  const baseSchema: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": schemaType,
    "name": businessName,
    "description": description,
    "url": canonicalUrl,
  };

  if (options.phone) {
    baseSchema.telephone = options.phone;
  }
  if (options.email) {
    baseSchema.email = options.email;
  }

  if (options.city || options.state || options.address) {
    baseSchema.address = {
      "@type": "PostalAddress",
      ...(options.address ? { streetAddress: options.address } : {}),
      ...(options.city ? { addressLocality: options.city } : {}),
      ...(options.state ? { addressRegion: options.state } : {}),
      ...(options.zipCode ? { postalCode: options.zipCode } : {}),
      addressCountry: "US",
    };
  }

  if (Array.isArray(options.serviceAreaCities) && options.serviceAreaCities.length > 0) {
    baseSchema.areaServed = options.serviceAreaCities.map((city) => ({
      "@type": "City",
      "name": city,
    }));
  } else if (options.city) {
    baseSchema.areaServed = {
      "@type": "City",
      "name": options.city,
    };
  }

  baseSchema.priceRange = "$$";

  return baseSchema;
}

/**
 * Injects and normalizes complete Google Search SEO meta tags in <head>.
 */
export function optimizeMetaTags(html: string, options: ExportSeoOptions): string {
  let doc = html;
  const domain = (options.domain || options.canonicalBaseUrl || "example.com")
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
  const baseUrl = `https://${domain}`;
  const cleanSlug = options.pagePath === "index.html" ? "" : options.pagePath.replace(/^\/+/, "");
  const canonicalUrl = `${baseUrl}/${cleanSlug}`;

  const businessName = options.businessName || options.projectName || "RankLocal Website";
  const defaultPageTitle = `${slugToTitle(options.pagePath)} | ${businessName}${options.city ? ` in ${options.city}` : ""}`;
  const defaultDescription = options.description || `${businessName} offers high-quality ${options.businessType || "solutions"} in ${options.city || "your area"}. Contact us today for reliable service!`;

  // 1. Ensure <head> tag exists
  if (!/<head\b[^>]*>/i.test(doc)) {
    if (/<html\b[^>]*>/i.test(doc)) {
      doc = doc.replace(/<html\b[^>]*>/i, "$&\n<head>\n</head>");
    } else {
      doc = `<!DOCTYPE html>\n<html lang="en">\n<head>\n</head>\n<body>\n${doc}\n</body>\n</html>`;
    }
  }

  // 2. Extract or inject <title>
  let finalTitle = defaultPageTitle;
  const titleMatch = doc.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch && titleMatch[1].trim()) {
    finalTitle = titleMatch[1].trim();
  } else {
    // Inject <title>
    doc = doc.replace(/<head\b[^>]*>/i, `$&\n  <title>${escapeHtmlAttr(finalTitle)}</title>`);
  }

  // 3. Extract or inject <meta name="description">
  let finalDescription = defaultDescription;
  const descMatch = doc.match(/<meta[^>]*?name=["']description["'][^>]*?content=["']([^"']*)["']/i);
  if (descMatch && descMatch[1].trim()) {
    finalDescription = descMatch[1].trim();
  } else if (!/<meta[^>]*?name=["']description["']/i.test(doc)) {
    doc = doc.replace(/<\/title>/i, `</title>\n  <meta name="description" content="${escapeHtmlAttr(finalDescription)}">`);
  }

  // 4. Ensure charset and viewport
  const headElementsToPrepend: string[] = [];
  if (!/<meta[^>]*?charset=/i.test(doc)) {
    headElementsToPrepend.push(`  <meta charset="utf-8">`);
  }
  if (!/<meta[^>]*?name=["']viewport["']/i.test(doc)) {
    headElementsToPrepend.push(`  <meta name="viewport" content="width=device-width, initial-scale=1.0">`);
  }

  // 5. Ensure canonical tag
  const headElementsToAppend: string[] = [];
  if (!/<link[^>]*?rel=["']canonical["']/i.test(doc)) {
    headElementsToAppend.push(`  <link rel="canonical" href="${canonicalUrl}">`);
  }

  // 6. OpenGraph and Twitter Meta Tags
  if (!/<meta[^>]*?property=["']og:title["']/i.test(doc)) {
    headElementsToAppend.push(`  <meta property="og:title" content="${escapeHtmlAttr(finalTitle)}">`);
  }
  if (!/<meta[^>]*?property=["']og:description["']/i.test(doc)) {
    headElementsToAppend.push(`  <meta property="og:description" content="${escapeHtmlAttr(finalDescription)}">`);
  }
  if (!/<meta[^>]*?property=["']og:url["']/i.test(doc)) {
    headElementsToAppend.push(`  <meta property="og:url" content="${canonicalUrl}">`);
  }
  if (!/<meta[^>]*?property=["']og:type["']/i.test(doc)) {
    const ogType = options.pagePath.startsWith("blog/") ? "article" : "website";
    headElementsToAppend.push(`  <meta property="og:type" content="${ogType}">`);
  }
  if (!/<meta[^>]*?property=["']og:site_name["']/i.test(doc)) {
    headElementsToAppend.push(`  <meta property="og:site_name" content="${escapeHtmlAttr(businessName)}">`);
  }
  if (!/<meta[^>]*?name=["']twitter:card["']/i.test(doc)) {
    headElementsToAppend.push(`  <meta name="twitter:card" content="summary_large_image">`);
  }

  // Apply prepends right after <head>
  if (headElementsToPrepend.length > 0) {
    doc = doc.replace(/<head\b[^>]*>/i, `$&\n${headElementsToPrepend.join("\n")}`);
  }

  // Apply appends right before </head>
  if (headElementsToAppend.length > 0) {
    doc = doc.replace(/<\/head>/i, `${headElementsToAppend.join("\n")}\n</head>`);
  }

  return doc;
}

/**
 * Injects Schema.org JSON-LD if not already present.
 */
export function injectSchemaJsonLd(html: string, options: ExportSeoOptions): string {
  let doc = html;

  // Check if valid JSON-LD already exists in document
  const hasExistingJsonLd = /<script\b[^>]*?type=["']application\/ld\+json["']/i.test(doc);

  if (!hasExistingJsonLd) {
    const schema = generateSchemaJsonLd(options);
    const scriptBlock = `  <script type="application/ld+json">\n${JSON.stringify(schema, null, 2)}\n  </script>`;

    if (/<\/head>/i.test(doc)) {
      doc = doc.replace(/<\/head>/i, `${scriptBlock}\n</head>`);
    } else if (/<\/body>/i.test(doc)) {
      doc = doc.replace(/<\/body>/i, `${scriptBlock}\n</body>`);
    } else {
      doc += `\n${scriptBlock}`;
    }
  }

  return doc;
}

/**
 * Enforces strict semantic heading hierarchy:
 * - Exactly one <h1> per page (promotes first <h2> if missing, downgrades extra <h1> to <h2>).
 * - Sequential headings (no skips from <h1> to <h3> without <h2>).
 * - Forces every <img> to have a valid, descriptive alt attribute.
 */
export function optimizeHeadingsAndImages(html: string, options: ExportSeoOptions): string {
  let doc = html;
  const businessName = options.businessName || options.projectName || "Website";
  const pageTopic = slugToTitle(options.pagePath);

  // 1. Heading Sequence & Single <h1> Normalization:
  // The document outline must begin with <h1> and contain exactly one <h1>.
  const firstHeadingMatch = doc.match(/<h([1-6])(\b[^>]*)>([\s\S]*?)<\/h\1>/i);

  if (firstHeadingMatch) {
    const firstLevel = parseInt(firstHeadingMatch[1], 10);
    if (firstLevel !== 1) {
      // The first heading in document outline is not <h1> (e.g. <h2>). Promote to <h1>.
      let firstPromoted = false;
      const tag = `h${firstLevel}`;
      const firstRegex = new RegExp(`<${tag}(\\b[^>]*)>([\\s\\S]*?)<\\/${tag}>`, "i");
      doc = doc.replace(firstRegex, (match, attrs, inner) => {
        if (!firstPromoted) {
          firstPromoted = true;
          return `<h1${attrs}>${inner}</h1>`;
        }
        return match;
      });

      // Downgrade any subsequent <h1> tags in the document to <h2>
      let h1Count = 0;
      doc = doc.replace(/<h1(\b[^>]*)>([\s\S]*?)<\/h1>/gi, (match, attrs, inner) => {
        h1Count++;
        if (h1Count > 1) {
          return `<h2${attrs}>${inner}</h2>`;
        }
        return match;
      });
    } else {
      // First heading is already <h1>. Downgrade any subsequent extra <h1> tags to <h2>
      let h1Count = 0;
      doc = doc.replace(/<h1(\b[^>]*)>([\s\S]*?)<\/h1>/gi, (match, attrs, inner) => {
        h1Count++;
        if (h1Count > 1) {
          return `<h2${attrs}>${inner}</h2>`;
        }
        return match;
      });
    }
  } else {
    // Zero headings exist in the document: Inject primary <h1>
    const fallbackH1 = `<h1 class="seo-primary-heading">${escapeHtmlAttr(pageTopic)} - ${escapeHtmlAttr(businessName)}</h1>`;
    if (/<main\b[^>]*>/i.test(doc)) {
      doc = doc.replace(/<main\b[^>]*>/i, `$&\n  ${fallbackH1}`);
    } else if (/<body\b[^>]*>/i.test(doc)) {
      doc = doc.replace(/<body\b[^>]*>/i, `$&\n  ${fallbackH1}`);
    }
  }

  // 2. Sequential Heading Validation:
  // If an <h3> appears before any <h2>, upgrade it to <h2> to maintain logical hierarchy
  const firstH2Index = doc.search(/<h2\b[^>]*>/i);
  const firstH3Index = doc.search(/<h3\b[^>]*>/i);
  if (firstH3Index !== -1 && (firstH2Index === -1 || firstH3Index < firstH2Index)) {
    // Upgrade premature <h3> to <h2>
    doc = doc.replace(/<h3(\b[^>]*)>([\s\S]*?)<\/h3>/i, `<h2$1>$2</h2>`);
  }

  // 3. Force all <img> tags to have valid alt attributes
  doc = doc.replace(/<img\b([^>]*?)(\/?>)/gi, (fullMatch, attrs, close) => {
    let updatedAttrs = attrs;

    // Check if alt attribute exists
    const altMatch = updatedAttrs.match(/\balt=(["'])(.*?)\1/i);

    if (altMatch) {
      const altValue = altMatch[2].trim();
      if (!altValue) {
        // Empty alt attribute: generate descriptive text
        const computedAlt = `${businessName} ${pageTopic} Photo`;
        updatedAttrs = updatedAttrs.replace(/\balt=(["'])(.*?)\1/i, `alt="${escapeHtmlAttr(computedAlt)}"`);
      }
    } else {
      // Completely missing alt attribute: infer from src or title
      const srcMatch = updatedAttrs.match(/\bsrc=(["'])(.*?)\1/i);
      let inferred = `${businessName} ${pageTopic}`;
      if (srcMatch && srcMatch[2]) {
        const filename = srcMatch[2].split("/").pop()?.split(".")[0] || "";
        const cleanName = filename.replace(/[-_]+/g, " ").trim();
        if (cleanName && cleanName.length > 2 && !/^(img|image|photo|\d+)$/i.test(cleanName)) {
          inferred = `${cleanName.charAt(0).toUpperCase() + cleanName.slice(1)} - ${businessName}`;
        }
      }
      updatedAttrs += ` alt="${escapeHtmlAttr(inferred)}"`;
    }

    return `<img${updatedAttrs}${close}`;
  });

  return doc;
}

/**
 * Optimizes Core Web Vitals:
 * - Adds loading="lazy" & decoding="async" to images (loading="eager" & fetchpriority="high" for hero LCP).
 * - Adds explicit width and height attributes to images to eliminate layout shifts (CLS).
 * - Inlines critical CSS into <head> to eliminate render-blocking CSS roundtrips.
 */
export function optimizeCoreWebVitals(html: string, options: ExportSeoOptions): string {
  let doc = html;

  // 1. Image Performance & Layout Shift Prevention
  let imgCount = 0;
  doc = doc.replace(/<img\b([^>]*?)(\/?>)/gi, (fullMatch, attrs, close) => {
    imgCount++;
    let updatedAttrs = attrs;

    // First image (LCP candidate): loading="eager", fetchpriority="high"
    if (imgCount === 1) {
      if (!/\bloading=/i.test(updatedAttrs)) {
        updatedAttrs += ` loading="eager"`;
      }
      if (!/\bfetchpriority=/i.test(updatedAttrs)) {
        updatedAttrs += ` fetchpriority="high"`;
      }
    } else {
      // Subsequent content images: loading="lazy", decoding="async"
      if (!/\bloading=/i.test(updatedAttrs)) {
        updatedAttrs += ` loading="lazy"`;
      }
      if (!/\bdecoding=/i.test(updatedAttrs)) {
        updatedAttrs += ` decoding="async"`;
      }
    }

    // CLS Prevention: Add explicit width & height if missing
    const hasWidth = /\bwidth=/i.test(updatedAttrs);
    const hasHeight = /\bheight=/i.test(updatedAttrs);

    if (!hasWidth && !hasHeight) {
      // Detect image category from classes or src
      const isLogo = /\b(logo|brand)\b/i.test(updatedAttrs);
      const isIcon = /\b(icon|avatar|badge|star)\b/i.test(updatedAttrs);

      if (isLogo) {
        updatedAttrs += ` width="200" height="50"`;
      } else if (isIcon) {
        updatedAttrs += ` width="48" height="48"`;
      } else {
        // Standard responsive content / hero image
        updatedAttrs += ` width="800" height="600"`;
      }
    }

    return `<img${updatedAttrs}${close}`;
  });

  // 2. Critical CSS Inlining
  if (options.criticalCss && options.criticalCss.trim()) {
    const styleBlock = `  <style id="critical-seo-css">\n${options.criticalCss.trim()}\n  </style>`;
    if (/<\/head>/i.test(doc)) {
      doc = doc.replace(/<\/head>/i, `${styleBlock}\n</head>`);
    }
  }

  return doc;
}

/**
 * Master HTML optimizer executing all SEO & Core Web Vitals passes in sequence.
 */
export function optimizePageForGoogleSEO(html: string, options: ExportSeoOptions): string {
  if (!html || typeof html !== "string") return html;

  // 1. Meta tag injector (<title>, meta description, canonical, OpenGraph, viewport)
  let optimized = optimizeMetaTags(html, options);

  // 2. Structured Data (Schema.org JSON-LD)
  optimized = injectSchemaJsonLd(optimized, options);

  // 3. Semantic Heading Hierarchy & Mandatory Image Alt tags
  optimized = optimizeHeadingsAndImages(optimized, options);

  // 4. Core Web Vitals (Lazy loading, CLS dimensions, Critical CSS)
  optimized = optimizeCoreWebVitals(optimized, options);

  return optimized;
}

/**
 * Generates an automated, fully-compliant XML Sitemap (sitemap.xml).
 */
export function generateProjectSitemapXml(
  pages: Array<{ path: string; lastModified?: number | Date }>,
  domain: string = "example.com"
): string {
  const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  const baseUrl = `https://${cleanDomain}`;
  const now = new Date().toISOString().split("T")[0];

  const htmlPages = pages.filter(
    (p) => p && p.path && p.path.endsWith(".html") && !p.path.includes("404")
  );

  // Sort: index.html first, then alphabetical
  htmlPages.sort((a, b) => {
    if (a.path === "index.html") return -1;
    if (b.path === "index.html") return 1;
    return a.path.localeCompare(b.path);
  });

  const urlEntries = htmlPages.map((page) => {
    const isHome = page.path === "index.html";
    const loc = isHome ? `${baseUrl}/` : `${baseUrl}/${page.path.replace(/^\/+/, "")}`;

    let priority = "0.7";
    let changefreq = "weekly";

    if (isHome) {
      priority = "1.0";
      changefreq = "daily";
    } else if (page.path.includes("service") || page.path.includes("repair")) {
      priority = "0.9";
      changefreq = "weekly";
    } else if (page.path.split("-").length >= 3 && !page.path.startsWith("blog/")) {
      // Location city page
      priority = "0.8";
      changefreq = "weekly";
    } else if (page.path.startsWith("blog/")) {
      priority = "0.6";
      changefreq = "monthly";
    }

    const lastmodDate = page.lastModified
      ? new Date(page.lastModified).toISOString().split("T")[0]
      : now;

    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmodDate}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries.join("\n")}
</urlset>
`;
}

/**
 * Generates an automated, fully-compliant robots.txt linking to sitemap.xml.
 */
export function generateProjectRobotsTxt(domain: string = "example.com"): string {
  const cleanDomain = domain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
  return `User-agent: *
Allow: /

Sitemap: https://${cleanDomain}/sitemap.xml
`;
}
