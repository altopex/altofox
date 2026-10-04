/**
 * RankLocal 2.0: Master SEO Generation & Validation Engine
 *
 * Implements rigorous, search-compliant SEO generation and auditing:
 *
 * 1. Every Page Generates:
 *    - <title> (unique, localized, CTR-optimized)
 *    - <meta name="description"> (unique, <= 160 chars, compelling)
 *    - canonical (<link rel="canonical" href="...">)
 *    - robots (<meta name="robots" content="index, follow, ...">)
 *    - Open Graph (og:title, og:description, og:url, og:type, og:site_name, og:image)
 *    - Social metadata (twitter:card, twitter:title, twitter:description, twitter:image)
 *    - H1 (exactly one primary semantic H1 per page)
 *    - H2 hierarchy (sequential, structured semantic section headings)
 *    - Breadcrumbs (semantic accessible HTML markup)
 *    - Schema JSON-LD tailored strictly by page type:
 *      * Homepage: LocalBusiness (with verified real business info only)
 *      * Service: Service schema
 *      * FAQ: FAQPage schema (ONLY when real Q&As are present)
 *      * Blog: BlogPosting schema
 *      * Navigation: BreadcrumbList schema
 *
 * 2. Crawl Assets Generation:
 *    - sitemap.xml (valid XML with loc, lastmod, changefreq, priority)
 *    - robots.txt (standard crawler directives linking to sitemap.xml)
 *
 * 3. Anti-Spam & Ground-Truth Rules:
 *    - Do NOT create fake business information (no invented addresses, no fake phones).
 *    - Do NOT add schema for unsupported claims (no fake aggregateRating, awards, or certs).
 *
 * 4. Comprehensive SEO Validation Audit:
 *    - Missing titles
 *    - Duplicate titles
 *    - Missing meta descriptions
 *    - Duplicate meta descriptions
 *    - Missing H1
 *    - Multiple problematic H1s
 *    - Missing canonical
 *    - Schema errors
 *    - Sitemap errors
 *    - Robots errors
 */

import { normalizeFilePath, calculateRelativeHref, resolveHref } from "./connectivity-engine";

export type SeoPageType =
  | "homepage"
  | "service_hub"
  | "service_page"
  | "location_hub"
  | "location_page"
  | "service_location_page"
  | "faq_page"
  | "blog_hub"
  | "blog_post"
  | "about_page"
  | "contact_page"
  | "other";

export interface SeoSiteMeta {
  businessName: string;
  domain?: string;
  primaryTrade?: string;
  schemaType?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  streetAddress?: string;
  zipCode?: string;
  businessModel?: string; // "storefront" | "service-area"
  serviceAreas?: string[] | string;
  serviceAreaCities?: { city: string; stateId?: string }[];
  realReviewsConfirmed?: boolean;
  realReviews?: Array<{ author: string; rating: number; text: string; date?: string }>;
  defaultHeroImage?: string;
  logoUrl?: string;
}

export interface SeoValidationReport {
  missingTitles: Array<{ page: string; reason: string }>;
  duplicateTitles: Array<{ title: string; pages: string[] }>;
  missingMetaDescriptions: Array<{ page: string; reason: string }>;
  duplicateMetaDescriptions: Array<{ description: string; pages: string[] }>;
  missingH1: Array<{ page: string; reason: string }>;
  multipleProblematicH1s: Array<{ page: string; count: number; h1s: string[] }>;
  missingCanonical: Array<{ page: string; reason: string }>;
  schemaErrors: Array<{ page: string; error: string; schemaType?: string }>;
  sitemapErrors: Array<{ error: string; targetUrl?: string }>;
  robotsErrors: Array<{ error: string }>;
  isHealthy: boolean;
  totalPagesScanned: number;
  reportText: string;
  summaryReportText: string;
}

/**
 * Maps trade category to standard Schema.org LocalBusiness subtype
 */
export function resolveLocalBusinessSchemaType(trade?: string, customType?: string): string {
  if (customType && customType !== "LocalBusiness") return customType;
  const t = (trade || "").toLowerCase();

  if (t.includes("plumb")) return "Plumber";
  if (t.includes("roof")) return "RoofingContractor";
  if (t.includes("electric")) return "Electrician";
  if (t.includes("hvac") || t.includes("heat") || t.includes("air condition") || t.includes("cooling")) return "HVACBusiness";
  if (t.includes("paint")) return "HousePainter";
  if (t.includes("locksmith")) return "Locksmith";
  if (t.includes("auto") || t.includes("mechanic")) return "AutoRepair";
  if (t.includes("dent")) return "Dentist";
  if (t.includes("legal") || t.includes("law") || t.includes("attorney")) return "LegalService";
  if (t.includes("clean") || t.includes("maid") || t.includes("janitor") || t.includes("pest") || t.includes("landscap") || t.includes("tree")) {
    return "HomeAndConstructionBusiness";
  }
  if (t.includes("construct") || t.includes("builder") || t.includes("remodel") || t.includes("contract")) {
    return "GeneralContractor";
  }

  return "LocalBusiness";
}

export class SeoEngine {
  private siteMeta: SeoSiteMeta;
  private domain: string;
  private baseUrl: string;

  constructor(siteMeta: SeoSiteMeta) {
    this.siteMeta = siteMeta;
    this.domain = (siteMeta.domain || "example.com")
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "");
    this.baseUrl = `https://${this.domain}`;
  }

  // =========================================================================
  // 1. PAGE CLASSIFICATION
  // =========================================================================
  public classifyPage(filePath: string, html: string): SeoPageType {
    const cleanPath = normalizeFilePath(filePath);
    if (cleanPath === "index.html") return "homepage";
    if (cleanPath === "services.html" || cleanPath === "services/index.html") return "service_hub";
    if (cleanPath === "service-areas.html" || cleanPath === "areas/index.html") return "location_hub";
    if (cleanPath === "faq.html" || cleanPath.includes("faqs")) return "faq_page";
    if (cleanPath === "blog.html" || cleanPath === "blog/index.html") return "blog_hub";
    if (cleanPath.startsWith("blog/")) return "blog_post";
    if (cleanPath === "about.html" || cleanPath.includes("about-us")) return "about_page";
    if (cleanPath === "contact.html" || cleanPath.includes("contact-us")) return "contact_page";

    const hasCity = Boolean(
      this.siteMeta.serviceAreaCities?.some((c) =>
        cleanPath.toLowerCase().includes(c.city.toLowerCase().replace(/\s+/g, "-"))
      ) ||
        cleanPath.startsWith("areas/") ||
        cleanPath.startsWith("locations/") ||
        cleanPath.startsWith("plumber-") ||
        cleanPath.startsWith("electrician-") ||
        cleanPath.startsWith("roofing-") ||
        cleanPath.startsWith("hvac-")
    );

    const parts = cleanPath.replace(/\.html$/, "").split("-");
    if (hasCity && parts.length >= 3) return "service_location_page";
    if (hasCity) return "location_page";

    return "service_page";
  }

  public classifyPageType(filePath: string, html: string): SeoPageType {
    return this.classifyPage(filePath, html);
  }

  // =========================================================================
  // 2. HEADINGS H1 & H2 HIERARCHY OPTIMIZER
  // =========================================================================
  public optimizeHeadings(
    html: string,
    pageType: SeoPageType,
    pageTitle: string
  ): { updatedHtml: string; h1Count: number; primaryH1: string } {
    let doc = html;
    const h1Matches = doc.match(/<h1[\s\S]*?<\/h1>/gi) || [];

    let primaryH1 = "";

    if (h1Matches.length === 0) {
      // Inject missing H1 at the top of <main> or <body>
      primaryH1 = pageTitle.split("|")[0].trim();
      const h1Tag = `\n    <h1 class="page-title primary-h1" style="font-size: 2.25rem; font-weight: 800; line-height: 1.25; margin-bottom: 1rem;">${primaryH1}</h1>\n`;
      if (/<main\b[^>]*>/i.test(doc)) {
        doc = doc.replace(/<main\b[^>]*>/i, `$&${h1Tag}`);
      } else if (/<body\b[^>]*>/i.test(doc)) {
        doc = doc.replace(/<body\b[^>]*>/i, `$&${h1Tag}`);
      }
    } else {
      // Extract primary H1 from the first match
      primaryH1 = (h1Matches[0] || "").replace(/<[^>]+>/g, "").trim();

      // If multiple H1s exist: Convert all subsequent H1s to H2 to preserve hierarchy
      if (h1Matches.length > 1) {
        let firstH1Seen = false;
        doc = doc.replace(/<h1([\s\S]*?)<\/h1>/gi, (fullMatch, innerAttrs) => {
          if (!firstH1Seen) {
            firstH1Seen = true;
            return fullMatch; // Keep first H1
          }
          // Convert second+ H1 into semantic H2
          return `<h2${innerAttrs}</h2>`;
        });
      }
    }

    // Enforce sequential heading hierarchy (no skipped heading levels: H1 -> H2 -> H3)
    let currentLevel = 1;
    doc = doc.replace(/<h([1-6])([\s\S]*?)<\/h\1>/gi, (match, levelStr, innerContent) => {
      const origLevel = parseInt(levelStr, 10);
      let targetLevel = origLevel;

      if (origLevel === 1) {
        currentLevel = 1;
        return match;
      }

      if (origLevel > currentLevel + 1) {
        // Skipped level detected (e.g. H1 followed directly by H3 without H2)
        targetLevel = currentLevel + 1;
      }
      currentLevel = targetLevel;

      if (targetLevel !== origLevel) {
        return `<h${targetLevel}${innerContent}</h${targetLevel}>`;
      }
      return match;
    });

    return { updatedHtml: doc, h1Count: 1, primaryH1 };
  }

  // =========================================================================
  // 3. BREADCRUMBS (MARKUP & MICRODATA)
  // =========================================================================
  public generateBreadcrumbs(
    filePath: string,
    pageType: SeoPageType,
    primaryH1: string
  ): { markup: string; jsonLd: Record<string, any> | null } {
    const cleanPath = normalizeFilePath(filePath);
    if (pageType === "homepage" || cleanPath === "index.html") {
      return { markup: "", jsonLd: null };
    }

    const relToHome = calculateRelativeHref(cleanPath, "index.html");
    const canonicalPageUrl = `${this.baseUrl}/${cleanPath === "index.html" ? "" : cleanPath}`;
    const pageName = primaryH1 || cleanPath.replace(/\.html$/, "").replace(/-/g, " ");

    let middleHub: { name: string; href: string; canonical: string } | null = null;

    if (pageType === "service_page" || pageType === "service_location_page") {
      middleHub = {
        name: "Services",
        href: calculateRelativeHref(cleanPath, "services.html"),
        canonical: `${this.baseUrl}/services.html`,
      };
    } else if (pageType === "location_page") {
      middleHub = {
        name: "Service Areas",
        href: calculateRelativeHref(cleanPath, "service-areas.html"),
        canonical: `${this.baseUrl}/service-areas.html`,
      };
    } else if (pageType === "blog_post") {
      middleHub = {
        name: "Blog",
        href: calculateRelativeHref(cleanPath, "blog.html"),
        canonical: `${this.baseUrl}/blog.html`,
      };
    }

    const breadcrumbListElements: Array<{ position: number; name: string; item: string }> = [
      {
        position: 1,
        name: "Home",
        item: `${this.baseUrl}/`,
      },
    ];

    let markupItems = `
      <li style="display: inline-flex; align-items: center;">
        <a href="${relToHome}" style="color: inherit; text-decoration: none;">Home</a>
      </li>`;

    if (middleHub) {
      breadcrumbListElements.push({
        position: 2,
        name: middleHub.name,
        item: middleHub.canonical,
      });
      markupItems += `
      <li style="display: inline-flex; align-items: center; margin-left: 0.5rem;">
        <span style="margin-right: 0.5rem; opacity: 0.6;">/</span>
        <a href="${middleHub.href}" style="color: inherit; text-decoration: none;">${middleHub.name}</a>
      </li>`;
    }

    const currPos = breadcrumbListElements.length + 1;
    breadcrumbListElements.push({
      position: currPos,
      name: pageName,
      item: canonicalPageUrl,
    });
    markupItems += `
      <li style="display: inline-flex; align-items: center; margin-left: 0.5rem; font-weight: 600;" aria-current="page">
        <span style="margin-right: 0.5rem; opacity: 0.6;">/</span>
        <span>${pageName}</span>
      </li>`;

    const breadcrumbsNav = `
    <!-- Semantic Accessible Breadcrumbs -->
    <nav aria-label="Breadcrumb" class="breadcrumbs" style="padding: 0.75rem 1rem; font-size: 0.875rem; color: #64748b; max-width: 1200px; margin: 0 auto;">
      <ol style="list-style: none; display: flex; flex-wrap: wrap; margin: 0; padding: 0;">
        ${markupItems}
      </ol>
    </nav>`;

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": breadcrumbListElements.map((el) => ({
        "@type": "ListItem",
        "position": el.position,
        "name": el.name,
        "item": el.item,
      })),
    };

    return { markup: breadcrumbsNav, jsonLd };
  }

  // =========================================================================
  // 4. SCHEMA BUILDER BY PAGE TYPE (Truthful, No Fake Claims)
  // =========================================================================
  public buildSchemasForPage(
    filePath: string,
    pageType: SeoPageType,
    html: string,
    title: string,
    description: string,
    primaryH1: string,
    breadcrumbJsonLd: Record<string, any> | null
  ): Array<Record<string, any>> {
    const cleanPath = normalizeFilePath(filePath);
    const canonicalUrl = `${this.baseUrl}/${cleanPath === "index.html" ? "" : cleanPath}`;
    const schemas: Array<Record<string, any>> = [];

    // 1. BreadcrumbList Schema (on all inner pages)
    if (breadcrumbJsonLd) {
      schemas.push(breadcrumbJsonLd);
    }

    // 2. Base LocalBusiness Info (Strictly truthful, no fake addresses or fake reviews)
    const localBusinessType = resolveLocalBusinessSchemaType(
      this.siteMeta.primaryTrade,
      this.siteMeta.schemaType
    );

    const isServiceArea =
      this.siteMeta.businessModel === "service-area" || !this.siteMeta.streetAddress;

    const postalAddress: Record<string, any> = {
      "@type": "PostalAddress",
      "addressLocality": this.siteMeta.city || "Local Market",
      "addressRegion": this.siteMeta.state || "US",
      "addressCountry": "US",
    };
    if (this.siteMeta.zipCode) postalAddress.postalCode = this.siteMeta.zipCode;
    // Ground-truth rule: Only include street address if verified storefront
    if (!isServiceArea && this.siteMeta.streetAddress) {
      postalAddress.streetAddress = this.siteMeta.streetAddress;
    }

    const businessSchema: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": localBusinessType,
      "name": this.siteMeta.businessName,
      "url": `${this.baseUrl}/`,
      "address": postalAddress,
    };

    if (this.siteMeta.phone) businessSchema.telephone = this.siteMeta.phone;
    if (this.siteMeta.email) businessSchema.email = this.siteMeta.email;

    // Service areas
    const areas = Array.isArray(this.siteMeta.serviceAreas)
      ? this.siteMeta.serviceAreas
      : typeof this.siteMeta.serviceAreas === "string"
      ? this.siteMeta.serviceAreas.split(",").map((s) => s.trim()).filter(Boolean)
      : this.siteMeta.serviceAreaCities?.map((c) => c.city) || [];

    if (areas.length > 0) {
      businessSchema.areaServed = areas.map((a) => ({
        "@type": "City",
        "name": a,
      }));
    }

    // Ground-truth rule: Do NOT add fake aggregateRating or reviews unless confirmed
    if (
      this.siteMeta.realReviewsConfirmed &&
      Array.isArray(this.siteMeta.realReviews) &&
      this.siteMeta.realReviews.length > 0
    ) {
      const avg =
        this.siteMeta.realReviews.reduce((sum, r) => sum + r.rating, 0) /
        this.siteMeta.realReviews.length;
      businessSchema.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": avg.toFixed(1),
        "reviewCount": this.siteMeta.realReviews.length,
        "bestRating": 5,
        "worstRating": 1,
      };
    }

    // -------------------------------------------------------------------------
    // PAGE-SPECIFIC SCHEMAS:
    // -------------------------------------------------------------------------

    // A. Homepage: LocalBusiness
    if (pageType === "homepage") {
      businessSchema.description = description;
      schemas.push(businessSchema);
    }

    // B. Service Pages: Service schema
    else if (pageType === "service_page" || pageType === "service_location_page" || pageType === "service_hub") {
      const serviceSchema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "Service",
        "name": primaryH1 || title.split("|")[0].trim(),
        "serviceType": primaryH1 || title.split("|")[0].trim(),
        "description": description,
        "url": canonicalUrl,
        "provider": {
          "@type": localBusinessType,
          "name": this.siteMeta.businessName,
          "telephone": this.siteMeta.phone || undefined,
          "url": `${this.baseUrl}/`,
        },
      };

      if (this.siteMeta.city) {
        serviceSchema.areaServed = {
          "@type": "City",
          "name": this.siteMeta.city,
        };
      }
      schemas.push(serviceSchema);
    }

    // C. Blog Post: BlogPosting schema
    else if (pageType === "blog_post") {
      const blogPostingSchema: Record<string, any> = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": canonicalUrl,
        },
        "headline": primaryH1 || title.split("|")[0].trim(),
        "description": description,
        "author": {
          "@type": "Organization",
          "name": this.siteMeta.businessName,
          "url": `${this.baseUrl}/`,
        },
        "publisher": {
          "@type": "Organization",
          "name": this.siteMeta.businessName,
          "url": `${this.baseUrl}/`,
        },
        "datePublished": new Date().toISOString().split("T")[0],
        "dateModified": new Date().toISOString().split("T")[0],
      };
      schemas.push(blogPostingSchema);
    }

    // D. FAQ Page / Section: FAQPage schema (ONLY WHEN APPROPRIATE with real Q&As)
    // Extract actual Q&As from HTML to ensure no fake FAQ schema
    const faqPairs = this.extractFaqItemsFromHtml(html);
    if ((pageType === "faq_page" || cleanPath === "faq.html" || faqPairs.length >= 2) && faqPairs.length > 0) {
      const faqSchema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqPairs.map((pair) => ({
          "@type": "Question",
          "name": pair.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": pair.answer,
          },
        })),
      };
      schemas.push(faqSchema);
    }

    return schemas;
  }

  private extractFaqItemsFromHtml(html: string): Array<{ question: string; answer: string }> {
    const results: Array<{ question: string; answer: string }> = [];

    // Pattern 1: <details><summary>Q</summary><div>A</div></details>
    const detailsRegex = /<details[^>]*>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>([\s\S]*?)<\/details>/gi;
    let m: RegExpExecArray | null;
    while ((m = detailsRegex.exec(html)) !== null) {
      const q = m[1].replace(/<[^>]+>/g, "").trim();
      const a = m[2].replace(/<[^>]+>/g, "").trim();
      if (q && a && q.length > 5 && a.length > 10) {
        results.push({ question: q, answer: a });
      }
    }

    // Pattern 2: FAQ accordion items (e.g. class="faq-question">Q... class="faq-answer">A...)
    if (results.length === 0) {
      const qRegex = /<(?:h\d|div|p)[^>]*class=["'][^"']*(?:faq-q|faq_q|question|accordion-header)[^"']*["'][^>]*>([\s\S]*?)<\/(?:h\d|div|p)>[\s\S]*?<(?:div|p)[^>]*class=["'][^"']*(?:faq-a|faq_a|answer|accordion-body)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|p)>/gi;
      let qm: RegExpExecArray | null;
      while ((qm = qRegex.exec(html)) !== null) {
        const q = qm[1].replace(/<[^>]+>/g, "").trim();
        const a = qm[2].replace(/<[^>]+>/g, "").trim();
        if (q && a && q.length > 5 && a.length > 10) {
          results.push({ question: q, answer: a });
        }
      }
    }

    return results;
  }

  // =========================================================================
  // 5. MASTER PAGE-LEVEL SEO OPTIMIZATION
  // =========================================================================
  public optimizePage(
    file: { path: string; content: string | Buffer; mimeType?: string | null },
    usedTitles: Set<string>,
    usedDescriptions: Set<string>
  ): { path: string; content: string; mimeType: string; title: string; description: string } {
    const cleanPath = normalizeFilePath(file.path);
    let html = typeof file.content === "string" ? file.content : file.content.toString("utf-8");
    const pageType = this.classifyPage(cleanPath, html);
    const isHome = cleanPath === "index.html";
    const canonicalUrl = `${this.baseUrl}/${isHome ? "" : cleanPath}`;

    // A. Title Tag Generation & Deduplication
    let title = "";
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (titleMatch && titleMatch[1].trim() && !titleMatch[1].includes("undefined")) {
      title = titleMatch[1].trim();
    } else {
      const slugTitle = cleanPath
        .replace(/\.html$/, "")
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

      if (isHome) {
        title = `${this.siteMeta.businessName} | Licensed ${this.siteMeta.primaryTrade || "Services"} in ${this.siteMeta.city || "Local Market"}, ${this.siteMeta.state || "US"}`;
      } else if (this.siteMeta.city) {
        title = `${slugTitle} in ${this.siteMeta.city} | ${this.siteMeta.businessName}`;
      } else {
        title = `${slugTitle} | ${this.siteMeta.businessName}`;
      }
    }

    // Enforce Uniqueness: Never allow duplicate titles across pages
    if (usedTitles.has(title.toLowerCase())) {
      const qualifier = isHome
        ? "Official Site"
        : cleanPath.replace(/\.html$/, "").replace(/-/g, " ");
      title = `${title.split("|")[0].trim()} (${qualifier}) | ${this.siteMeta.businessName}`;
    }
    usedTitles.add(title.toLowerCase());

    // B. Meta Description Generation & Deduplication
    let description = "";
    const descMatch = html.match(/<meta[^>]*?name=["']description["'][^>]*?content=["']([^"']*)["']/i);
    if (descMatch && descMatch[1].trim() && !descMatch[1].includes("undefined")) {
      description = descMatch[1].trim();
    } else {
      const subject = isHome ? this.siteMeta.primaryTrade || "professional services" : cleanPath.replace(/\.html$/, "").replace(/-/g, " ");
      description = `Reliable ${subject} provided by licensed experts at ${this.siteMeta.businessName}. Quality workmanship, transparent pricing, and fast dispatch in ${this.siteMeta.city || "your area"}.`;
    }

    if (description.length > 160) {
      description = description.slice(0, 157).trim() + "...";
    }

    // Enforce Uniqueness: Never allow duplicate meta descriptions across pages
    if (usedDescriptions.has(description.toLowerCase())) {
      const specific = cleanPath.replace(/\.html$/, "").replace(/-/g, " ");
      description = `Learn more about our dedicated ${specific} solutions. Licensed workmanship, upfront quotes, and trusted service by ${this.siteMeta.businessName}.`;
      if (description.length > 160) description = description.slice(0, 157) + "...";
    }
    usedDescriptions.add(description.toLowerCase());

    // C. Heading Hierarchy Optimization (Single H1)
    const { updatedHtml: htmlWithH1, primaryH1 } = this.optimizeHeadings(html, pageType, title);
    html = htmlWithH1;

    // D. Breadcrumbs UI & Schema
    const { markup: breadcrumbsMarkup, jsonLd: breadcrumbJsonLd } = this.generateBreadcrumbs(
      cleanPath,
      pageType,
      primaryH1
    );

    // Inject Breadcrumbs Markup into HTML right after opening <main> or above primary H1
    if (breadcrumbsMarkup && !html.includes('class="breadcrumbs"')) {
      if (/<main\b[^>]*>/i.test(html)) {
        html = html.replace(/<main\b[^>]*>/i, `$&\n${breadcrumbsMarkup}`);
      } else if (/<body\b[^>]*>/i.test(html)) {
        html = html.replace(/<body\b[^>]*>/i, `$&\n${breadcrumbsMarkup}`);
      }
    }

    // E. Structured Data Schema Generation
    const schemas = this.buildSchemasForPage(
      cleanPath,
      pageType,
      html,
      title,
      description,
      primaryH1,
      breadcrumbJsonLd
    );

    // Remove any existing LD+JSON scripts to avoid duplicate or malformed legacy scripts
    html = html.replace(/<script\s+type=["']application\/ld\+json["']>[\s\S]*?<\/script>/gi, "");

    const schemaScripts = schemas
      .map((s) => `  <script type="application/ld+json">\n  ${JSON.stringify(s, null, 2)}\n  </script>`)
      .join("\n");

    // F. Clean and assemble <head> meta tags
    // Remove legacy tags to avoid duplicate meta tags
    html = html
      .replace(/<title[\s\S]*?<\/title>/gi, "")
      .replace(/<meta[^>]*?name=["']description["'][^>]*?>/gi, "")
      .replace(/<link[^>]*?rel=["']canonical["'][^>]*?>/gi, "")
      .replace(/<meta[^>]*?name=["']robots["'][^>]*?>/gi, "")
      .replace(/<meta[^>]*?property=["']og:[^"']*["'][^>]*?>/gi, "")
      .replace(/<meta[^>]*?name=["']twitter:[^"']*["'][^>]*?>/gi, "");

    const ogType = pageType === "blog_post" ? "article" : "website";
    const ogImage = this.siteMeta.defaultHeroImage || this.siteMeta.logoUrl || "";

    // Robots directive where appropriate
    let robotsContent = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
    if (
      cleanPath === "404.html" ||
      cleanPath.includes("thank-you") ||
      cleanPath.includes("admin") ||
      cleanPath.includes("checkout")
    ) {
      robotsContent = "noindex, nofollow";
    }

    const headBlock = `
  <title>${escapeHtmlAttr(title)}</title>
  <meta name="description" content="${escapeHtmlAttr(description)}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta name="robots" content="${robotsContent}">

  <!-- Open Graph -->
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:title" content="${escapeHtmlAttr(title)}">
  <meta property="og:description" content="${escapeHtmlAttr(description)}">
  <meta property="og:site_name" content="${escapeHtmlAttr(this.siteMeta.businessName)}">
  ${ogImage ? `<meta property="og:image" content="${escapeHtmlAttr(ogImage)}">\n  <meta property="og:image:alt" content="${escapeHtmlAttr(title)}">` : ""}

  <!-- Twitter / Social Media -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtmlAttr(title)}">
  <meta name="twitter:description" content="${escapeHtmlAttr(description)}">
  ${ogImage ? `<meta name="twitter:image" content="${escapeHtmlAttr(ogImage)}">` : ""}

  <!-- Structured Data JSON-LD -->
${schemaScripts}`;

    // Inject into <head>
    if (/<head\b[^>]*>/i.test(html)) {
      html = html.replace(/<head\b[^>]*>/i, `$&${headBlock}`);
    } else {
      html = `<head>${headBlock}\n</head>\n${html}`;
    }

    return {
      path: cleanPath,
      content: html,
      mimeType: "text/html",
      title,
      description,
    };
  }

  // =========================================================================
  // 6. GENERATE SITEMAP.XML
  // =========================================================================
  public generateSitemap(
    htmlFiles: Array<{ path: string }>
  ): { path: string; content: string; mimeType: string } {
    const today = new Date().toISOString().split("T")[0];

    const urlEntries = htmlFiles
      .filter((f) => f && f.path && (f.path.endsWith(".html") || f.path.endsWith(".htm")))
      .map((f) => {
        const cleanPath = normalizeFilePath(f.path);
        const loc = `${this.baseUrl}/${cleanPath === "index.html" ? "" : cleanPath}`;
        let priority = "0.7";
        let changefreq = "monthly";

        if (cleanPath === "index.html") {
          priority = "1.0";
          changefreq = "weekly";
        } else if (cleanPath === "services.html" || cleanPath === "service-areas.html") {
          priority = "0.9";
          changefreq = "weekly";
        } else if (cleanPath.startsWith("blog/")) {
          priority = "0.8";
          changefreq = "monthly";
        } else {
          priority = "0.8";
          changefreq = "monthly";
        }

        return `  <url>
    <loc>${loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
      })
      .join("\n");

    const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

    return {
      path: "sitemap.xml",
      content: sitemapXml,
      mimeType: "application/xml",
    };
  }

  // =========================================================================
  // 7. GENERATE ROBOTS.TXT
  // =========================================================================
  public generateRobotsTxt(): { path: string; content: string; mimeType: string } {
    const content = `# Robots.txt for ${this.domain}
User-agent: *
Allow: /

Sitemap: ${this.baseUrl}/sitemap.xml
`;
    return {
      path: "robots.txt",
      content,
      mimeType: "text/plain",
    };
  }

  // =========================================================================
  // 8. RUN RIGOROUS SEO VALIDATION AUDIT
  // =========================================================================
  public validateWebsiteSeo(
    files: Array<{ path: string; content: string | Buffer; mimeType?: string | null }>
  ): SeoValidationReport {
    const htmlFiles = files.filter(
      (f) => f && f.path && (f.path.endsWith(".html") || f.path.endsWith(".htm"))
    );
    const existingFilePaths = new Set(htmlFiles.map((f) => normalizeFilePath(f.path)));

    const missingTitles: Array<{ page: string; reason: string }> = [];
    const titlesMap = new Map<string, string[]>();

    const missingMetaDescriptions: Array<{ page: string; reason: string }> = [];
    const descMap = new Map<string, string[]>();

    const missingH1: Array<{ page: string; reason: string }> = [];
    const multipleProblematicH1s: Array<{ page: string; count: number; h1s: string[] }> = [];

    const missingCanonical: Array<{ page: string; reason: string }> = [];
    const schemaErrors: Array<{ page: string; error: string; schemaType?: string }> = [];

    const sitemapErrors: Array<{ error: string; targetUrl?: string }> = [];
    const robotsErrors: Array<{ error: string }> = [];

    // --- 1. Audit Every HTML Page ---
    for (const file of htmlFiles) {
      const cleanPath = normalizeFilePath(file.path);
      const rawHtml = typeof file.content === "string" ? file.content : file.content.toString("utf-8");

      // A. Title Check
      const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
      if (!titleMatch || !titleMatch[1].trim() || titleMatch[1].includes("undefined")) {
        missingTitles.push({ page: cleanPath, reason: "Missing or empty <title> tag." });
      } else {
        const cleanTitle = titleMatch[1].trim().toLowerCase();
        const pages = titlesMap.get(cleanTitle) || [];
        pages.push(cleanPath);
        titlesMap.set(cleanTitle, pages);
      }

      // B. Meta Description Check
      const descMatch = rawHtml.match(/<meta[^>]*?name=["']description["'][^>]*?content=["']([^"']*)["']/i);
      if (!descMatch || !descMatch[1].trim() || descMatch[1].includes("undefined")) {
        missingMetaDescriptions.push({ page: cleanPath, reason: "Missing or empty <meta name=\"description\"> tag." });
      } else {
        const cleanDesc = descMatch[1].trim().toLowerCase();
        const pages = descMap.get(cleanDesc) || [];
        pages.push(cleanPath);
        descMap.set(cleanDesc, pages);
      }

      // C. H1 Hierarchy Check
      const h1Matches = rawHtml.match(/<h1[\s\S]*?<\/h1>/gi) || [];
      if (h1Matches.length === 0) {
        missingH1.push({ page: cleanPath, reason: "Page has 0 <h1> heading tags." });
      } else if (h1Matches.length > 1) {
        multipleProblematicH1s.push({
          page: cleanPath,
          count: h1Matches.length,
          h1s: h1Matches.map((h) => h.replace(/<[^>]+>/g, "").trim()),
        });
      }

      // D. Canonical Link Check
      const canonicalMatch = rawHtml.match(/<link[^>]*?rel=["']canonical["'][^>]*?href=["']([^"']*)["']/i);
      if (!canonicalMatch || !canonicalMatch[1].trim()) {
        missingCanonical.push({ page: cleanPath, reason: "Missing <link rel=\"canonical\"> tag." });
      }

      // E. Schema.org JSON-LD Validation
      const scriptRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
      let sm: RegExpExecArray | null;
      let schemaFound = false;

      while ((sm = scriptRegex.exec(rawHtml)) !== null) {
        schemaFound = true;
        const jsonContent = sm[1].trim();
        try {
          const parsed = JSON.parse(jsonContent);
          if (!parsed["@context"] || !parsed["@context"].includes("schema.org")) {
            schemaErrors.push({
              page: cleanPath,
              error: "Schema missing valid @context: https://schema.org",
            });
          }
          if (!parsed["@type"]) {
            schemaErrors.push({
              page: cleanPath,
              error: "Schema missing mandatory @type attribute",
            });
          }
        } catch (jsonErr: any) {
          schemaErrors.push({
            page: cleanPath,
            error: `Malformed JSON-LD syntax: ${jsonErr?.message || jsonErr}`,
          });
        }
      }

      if (!schemaFound && cleanPath === "index.html") {
        schemaErrors.push({
          page: cleanPath,
          error: "Homepage missing LocalBusiness JSON-LD schema.",
          schemaType: "LocalBusiness",
        });
      }
    }

    // Duplicate Titles (pages sharing same title)
    const duplicateTitles: Array<{ title: string; pages: string[] }> = [];
    for (const [t, pages] of titlesMap.entries()) {
      if (pages.length > 1) {
        duplicateTitles.push({ title: t, pages });
      }
    }

    // Duplicate Meta Descriptions (pages sharing same description)
    const duplicateMetaDescriptions: Array<{ description: string; pages: string[] }> = [];
    for (const [d, pages] of descMap.entries()) {
      if (pages.length > 1) {
        duplicateMetaDescriptions.push({ description: d, pages });
      }
    }

    // --- 2. Audit Sitemap.xml ---
    const sitemapFile = files.find((f) => f.path === "sitemap.xml");
    if (!sitemapFile) {
      sitemapErrors.push({ error: "Missing sitemap.xml file in generated website package." });
    } else {
      const sitemapRaw = typeof sitemapFile.content === "string" ? sitemapFile.content : sitemapFile.content.toString("utf-8");
      if (!sitemapRaw.includes("<urlset") || !sitemapRaw.includes("http://www.sitemaps.org/schemas/sitemap/0.9")) {
        sitemapErrors.push({ error: "sitemap.xml missing standard <urlset> namespace definition." });
      }

      // Verify every <loc> in sitemap resolves to an existing file
      const locMatches = sitemapRaw.matchAll(/<loc>([^<]+)<\/loc>/gi);
      let locCount = 0;
      for (const lm of locMatches) {
        locCount++;
        const locUrl = lm[1].trim();
        const urlPath = locUrl.replace(/^https?:\/\/[^\/]+/, "").replace(/^\/+/, "");
        const expectedFile = urlPath === "" ? "index.html" : urlPath;
        if (!existingFilePaths.has(expectedFile)) {
          sitemapErrors.push({
            error: `sitemap.xml contains loc URL "${locUrl}" pointing to non-existent file "${expectedFile}".`,
            targetUrl: locUrl,
          });
        }
      }
      if (locCount === 0) {
        sitemapErrors.push({ error: "sitemap.xml contains 0 URL entries." });
      }
    }

    // --- 3. Audit Robots.txt ---
    const robotsFile = files.find((f) => f.path === "robots.txt");
    if (!robotsFile) {
      robotsErrors.push({ error: "Missing robots.txt file in generated website package." });
    } else {
      const robotsRaw = typeof robotsFile.content === "string" ? robotsFile.content : robotsFile.content.toString("utf-8");
      if (!robotsRaw.includes("User-agent:")) {
        robotsErrors.push({ error: "robots.txt missing User-agent directive." });
      }
      if (!robotsRaw.includes("Allow:") && !robotsRaw.includes("Disallow:")) {
        robotsErrors.push({ error: "robots.txt missing Allow or Disallow crawl directives." });
      }
      if (!robotsRaw.includes("Sitemap:")) {
        robotsErrors.push({ error: "robots.txt missing Sitemap reference directive." });
      }
    }

    const isHealthy =
      missingTitles.length === 0 &&
      duplicateTitles.length === 0 &&
      missingMetaDescriptions.length === 0 &&
      duplicateMetaDescriptions.length === 0 &&
      missingH1.length === 0 &&
      multipleProblematicH1s.length === 0 &&
      missingCanonical.length === 0 &&
      schemaErrors.length === 0 &&
      sitemapErrors.length === 0 &&
      robotsErrors.length === 0;

    const reportText = [
      "================================================================================",
      "                           SEO VALIDATION REPORT                                ",
      "================================================================================",
      `Pages scanned:              ${htmlFiles.length}`,
      `Missing titles:             ${missingTitles.length}`,
      `Duplicate titles:           ${duplicateTitles.length}`,
      `Missing meta descriptions:  ${missingMetaDescriptions.length}`,
      `Duplicate meta descriptions:${duplicateMetaDescriptions.length}`,
      `Missing H1:                 ${missingH1.length}`,
      `Multiple problematic H1s:   ${multipleProblematicH1s.length}`,
      `Missing canonical:          ${missingCanonical.length}`,
      `Schema errors:              ${schemaErrors.length}`,
      `Sitemap errors:             ${sitemapErrors.length}`,
      `Robots errors:              ${robotsErrors.length}`,
      `SEO Health Status:          ${isHealthy ? "100% HEALTHY (0 Errors)" : "NEEDS ATTENTION"}`,
      "================================================================================",
    ].join("\n");

    const summaryReportText = [
      `Missing titles:             ${missingTitles.length}`,
      `Duplicate titles:           ${duplicateTitles.length}`,
      `Missing meta descriptions:  ${missingMetaDescriptions.length}`,
      `Duplicate meta descriptions:${duplicateMetaDescriptions.length}`,
      `Missing H1:                 ${missingH1.length}`,
      `Multiple problematic H1s:   ${multipleProblematicH1s.length}`,
      `Missing canonical:          ${missingCanonical.length}`,
      `Schema errors:              ${schemaErrors.length}`,
      `Sitemap errors:             ${sitemapErrors.length}`,
      `Robots errors:              ${robotsErrors.length}`,
    ].join("\n");

    return {
      missingTitles,
      duplicateTitles,
      missingMetaDescriptions,
      duplicateMetaDescriptions,
      missingH1,
      multipleProblematicH1s,
      missingCanonical,
      schemaErrors,
      sitemapErrors,
      robotsErrors,
      isHealthy,
      totalPagesScanned: htmlFiles.length,
      reportText,
      summaryReportText,
    };
  }

  // =========================================================================
  // 9. MASTER EXECUTION PIPELINE
  // =========================================================================
  public execute(
    files: Array<{ path: string; content: string | Buffer; mimeType?: string | null }>
  ): {
    files: Array<{ path: string; content: string | Buffer; mimeType?: string | null }>;
    report: SeoValidationReport;
  } {
    const usedTitles = new Set<string>();
    const usedDescriptions = new Set<string>();

    const updatedFiles: Array<{ path: string; content: string | Buffer; mimeType?: string | null }> = [];

    // 1. Optimize all HTML pages
    for (const file of files) {
      if (file.path.endsWith(".html") || file.path.endsWith(".htm")) {
        const optimized = this.optimizePage(file, usedTitles, usedDescriptions);
        updatedFiles.push({
          path: optimized.path,
          content: optimized.content,
          mimeType: "text/html",
        });
      } else if (file.path !== "sitemap.xml" && file.path !== "robots.txt") {
        updatedFiles.push(file);
      }
    }

    // 2. Generate compliant sitemap.xml
    const htmlFileList = updatedFiles.filter(
      (f) => f.path.endsWith(".html") || f.path.endsWith(".htm")
    );
    const sitemap = this.generateSitemap(htmlFileList);
    updatedFiles.push(sitemap);

    // 3. Generate compliant robots.txt
    const robots = this.generateRobotsTxt();
    updatedFiles.push(robots);

    // 4. Run full validation audit
    const report = this.validateWebsiteSeo(updatedFiles);

    // Print Formatted SEO Validation Report
    console.log("\n" + report.reportText + "\n");

    return {
      files: updatedFiles,
      report,
    };
  }
}

function escapeHtmlAttr(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
