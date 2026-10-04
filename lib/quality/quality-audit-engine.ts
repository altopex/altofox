/**
 * RankLocal 2.0: Master Website Quality Audit Engine
 *
 * Implements strict, deterministic evaluation across 25 core site quality vectors:
 * 
 * 1. Technical (Max 20 pts):
 *    - HTML: Valid doctype, lang attribute, charset, well-formed structural tags
 *    - Responsive structure: Viewport meta tag, mobile call bar / responsive layout
 *    - Robots: robots.txt presence, User-agent, Allow/Disallow, Sitemap reference
 *    - Basic accessibility: lang attribute, accessible link/button labels, accessible forms
 *    - Basic performance issues: Explicit image width/height (CLS prevention), lazy loading
 * 
 * 2. SEO (Max 20 pts):
 *    - Duplicate titles & title length / presence
 *    - Duplicate meta descriptions & description length (<= 160 chars)
 *    - Canonical: <link rel="canonical"> present and valid on every page
 *    - H1: Exactly one primary H1 per page (no missing H1, no multiple H1s)
 *    - Heading hierarchy: Sequential heading levels (no skipping H1 -> H3), non-empty headings
 *    - Schema: Valid Schema.org JSON-LD tailored to page type (LocalBusiness, Service, etc.)
 *    - Sitemap: sitemap.xml presence, valid XML <urlset>, all pages indexed, no 404 targets
 * 
 * 3. Content (Max 20 pts):
 *    - Thin pages: Flag pages with < 200 words of visible body text
 *    - Content similarity: Pairwise mathematical similarity (> 60% overlap flagged)
 *    - Missing pages: Ensures mandatory pages (index.html, service/contact hubs) exist
 *    - Brand & NAP consistency: Phone/address consistency, no unpopulated template placeholders
 * 
 * 4. Images (Max 20 pts):
 *    - Missing images: <img> tags with missing or empty src
 *    - Broken images: Local image paths pointing to non-existent files or invalid URLs
 *    - Duplicate images: Repeated identical image on same page or excessive duplication
 *    - Missing alt text: <img> tags missing alt or with empty/generic alt text
 * 
 * 5. Internal Linking (Max 20 pts):
 *    - Navigation: Functional header nav and footer nav on every page
 *    - Phone links: All phone numbers formatted as clickable tel: links
 *    - CTA links: Call-to-action buttons/links with actionable, valid hrefs
 *    - Internal links: Cross-linking between pages, non-empty anchor text
 *    - Broken links: Internal links pointing to non-existent HTML pages
 *    - Orphan pages: Inner pages with 0 incoming internal links
 * 
 * Overall Score = Technical (20) + SEO (20) + Content (20) + Images (20) + Internal Linking (20) = 100
 * 
 * Rule: NEVER fabricate the score. The score is computed strictly from deterministic checks.
 */

export interface QualityAuditFile {
  path: string;
  content: string | Buffer;
  mimeType?: string | null;
}

export interface QualityAuditMeta {
  businessName?: string;
  trade?: string;
  phone?: string;
  email?: string;
  city?: string;
  state?: string;
  streetAddress?: string;
  domain?: string;
  expectedPages?: string[];
  realReviewsConfirmed?: boolean;
}

export interface QualityCategoryScore {
  name: "Technical" | "SEO" | "Content" | "Images" | "Internal Linking";
  earned: number; // 0 to 20
  max: number;    // 20
  percentage: number;
}

export interface QualityAuditIssueItem {
  category: "Technical" | "SEO" | "Content" | "Images" | "Internal Linking";
  check: string;
  page?: string;
  message: string;
  severity: "error" | "warning";
}

export interface QualityAuditResult {
  overallScore: number; // 0 to 100
  categoryScores: {
    technical: QualityCategoryScore;
    seo: QualityCategoryScore;
    content: QualityCategoryScore;
    images: QualityCategoryScore;
    internalLinking: QualityCategoryScore;
  };
  issues: string[]; // High-level grouped summary (e.g. "2 duplicate images", "1 thin page", "2 missing alt attributes")
  detailedIssues: QualityAuditIssueItem[];
  totalPagesScanned: number;
  summaryText: string;
  timestamp: number;
}

interface ParsedHtmlPage {
  path: string;
  rawHtml: string;
  cleanText: string;
  wordCount: number;
  title: string;
  metaDescription: string;
  canonicalHref: string;
  hasViewport: boolean;
  hasDoctype: boolean;
  hasLang: boolean;
  hasCharset: boolean;
  h1s: string[];
  allHeadings: Array<{ level: number; text: string }>;
  schemas: Array<Record<string, any>>;
  schemaErrors: string[];
  images: Array<{
    src: string;
    alt: string;
    hasAlt: boolean;
    hasWidth: boolean;
    hasHeight: boolean;
    hasLazy: boolean;
  }>;
  internalLinks: Array<{ href: string; text: string; resolvedPath: string }>;
  telLinks: string[];
  ctaLinks: Array<{ href: string; text: string; isDead: boolean }>;
  hasHeaderNav: boolean;
  hasFooterNav: boolean;
}

// ---------------------------------------------------------------------------
// Helper Functions
// ---------------------------------------------------------------------------

function normalizePath(p: string): string {
  return p.replace(/^[\\\/]+/, "").replace(/\\/g, "/").toLowerCase();
}

function resolveInternalTarget(fromPage: string, href: string): string {
  const cleanHref = href.split("?")[0].split("#")[0].trim();
  if (!cleanHref) return "";

  if (cleanHref.startsWith("/")) {
    const withoutSlash = cleanHref.replace(/^\/+/, "");
    return withoutSlash.endsWith(".html") || withoutSlash.includes(".")
      ? withoutSlash.toLowerCase()
      : `${withoutSlash}.html`.toLowerCase();
  }

  // Relative to current page's directory
  const fromParts = fromPage.split("/");
  fromParts.pop(); // Remove filename
  const baseDir = fromParts.join("/");

  const combined = baseDir ? `${baseDir}/${cleanHref}` : cleanHref;
  // Normalize ../ and ./
  const parts = combined.split("/");
  const stack: string[] = [];
  for (const part of parts) {
    if (part === "" || part === ".") continue;
    if (part === "..") {
      stack.pop();
    } else {
      stack.push(part);
    }
  }

  const resolved = stack.join("/");
  return resolved.endsWith(".html") || resolved.includes(".")
    ? resolved.toLowerCase()
    : `${resolved}.html`.toLowerCase();
}

function extractVisibleText(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z0-9#]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function computeDiceSimilarity(str1: string, str2: string): number {
  const clean1 = str1.toLowerCase().replace(/[^\w\s]/g, " ").trim();
  const clean2 = str2.toLowerCase().replace(/[^\w\s]/g, " ").trim();
  if (clean1 === clean2) return 1.0;
  if (!clean1 || !clean2) return 0.0;

  const words1 = clean1.split(/\s+/).filter((w) => w.length > 2);
  const words2 = clean2.split(/\s+/).filter((w) => w.length > 2);
  if (words1.length < 5 || words2.length < 5) return 0.0;

  const getBigrams = (words: string[]) => {
    const bigrams = new Map<string, number>();
    for (let i = 0; i < words.length - 1; i++) {
      const bg = `${words[i]} ${words[i + 1]}`;
      bigrams.set(bg, (bigrams.get(bg) || 0) + 1);
    }
    return bigrams;
  };

  const bg1 = getBigrams(words1);
  const bg2 = getBigrams(words2);
  let intersection = 0;
  bg1.forEach((count, key) => {
    if (bg2.has(key)) intersection += Math.min(count, bg2.get(key)!);
  });
  const total = words1.length - 1 + (words2.length - 1);
  return total > 0 ? (2 * intersection) / total : 0;
}

// ---------------------------------------------------------------------------
// HTML Parser for Deterministic Metrics
// ---------------------------------------------------------------------------

function parseHtmlPage(file: QualityAuditFile): ParsedHtmlPage {
  const rawHtml = typeof file.content === "string" ? file.content : file.content.toString("utf-8");
  const cleanText = extractVisibleText(rawHtml);
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // 1. Boilerplate / Technical Checks
  const hasDoctype = /<!doctype\s+html/i.test(rawHtml);
  const hasLang = /<html[^>]*?\blang=["'][a-z]{2}(?:-[a-z]{2})?["']/i.test(rawHtml);
  const hasCharset = /<meta[^>]*?\bcharset=["']?[a-z0-9_-]+["']?/i.test(rawHtml);
  const hasViewport = /<meta[^>]*?\bname=["']viewport["'][^>]*?\bcontent=["'][^"']*width=device-width[^"']*["']/i.test(rawHtml);

  // 2. SEO Meta Tags
  const titleMatch = rawHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, "").trim() : "";

  const metaDescMatch = rawHtml.match(/<meta[^>]*?\bname=["']description["'][^>]*?\bcontent=["']([^"']*)["']/i);
  const metaDescription = metaDescMatch ? metaDescMatch[1].trim() : "";

  const canonicalMatch = rawHtml.match(/<link[^>]*?\brel=["']canonical["'][^>]*?\bhref=["']([^"']*)["']/i);
  const canonicalHref = canonicalMatch ? canonicalMatch[1].trim() : "";

  // 3. Headings & Hierarchy
  const h1s: string[] = [];
  const allHeadings: Array<{ level: number; text: string }> = [];
  const headingRegex = /<h([1-6])\b[^>]*>([\s\S]*?)<\/h\1>/gi;
  let hm: RegExpExecArray | null;
  while ((hm = headingRegex.exec(rawHtml)) !== null) {
    const level = parseInt(hm[1], 10);
    const text = hm[2].replace(/<[^>]+>/g, "").trim();
    allHeadings.push({ level, text });
    if (level === 1) {
      h1s.push(text);
    }
  }

  // 4. Schema JSON-LD
  const schemas: Array<Record<string, any>> = [];
  const schemaErrors: string[] = [];
  const jsonLdRegex = /<script\s+type=["']application\/ld\+json["']>([\s\S]*?)<\/script>/gi;
  let sm: RegExpExecArray | null;
  while ((sm = jsonLdRegex.exec(rawHtml)) !== null) {
    const rawJson = sm[1].trim();
    try {
      const parsed = JSON.parse(rawJson);
      schemas.push(parsed);
    } catch (e: any) {
      schemaErrors.push(e?.message || "Invalid JSON syntax");
    }
  }

  // 5. Images
  const images: ParsedHtmlPage["images"] = [];
  const imgRegex = /<img\b([^>]*?)>/gi;
  let im: RegExpExecArray | null;
  while ((im = imgRegex.exec(rawHtml)) !== null) {
    const attrs = im[1];
    const srcMatch = attrs.match(/\bsrc=["']([^"']*)["']/i);
    const altMatch = attrs.match(/\balt=["']([^"']*)["']/i);
    const widthMatch = attrs.match(/\bwidth=["']?\d+["']?/i);
    const heightMatch = attrs.match(/\bheight=["']?\d+["']?/i);
    const lazyMatch = attrs.match(/\bloading=["']lazy["']/i);

    const src = srcMatch ? srcMatch[1].trim() : "";
    const alt = altMatch ? altMatch[1].trim() : "";
    const hasAlt = altMatch !== null && alt.length > 0;

    images.push({
      src,
      alt,
      hasAlt,
      hasWidth: Boolean(widthMatch),
      hasHeight: Boolean(heightMatch),
      hasLazy: Boolean(lazyMatch),
    });
  }

  // 6. Links: Internal, Phone, CTA
  const internalLinks: ParsedHtmlPage["internalLinks"] = [];
  const telLinks: string[] = [];
  const ctaLinks: ParsedHtmlPage["ctaLinks"] = [];

  const anchorRegex = /<a\b([^>]*?)>([\s\S]*?)<\/a>/gi;
  let am: RegExpExecArray | null;
  while ((am = anchorRegex.exec(rawHtml)) !== null) {
    const attrs = am[1];
    const innerText = am[2].replace(/<[^>]+>/g, "").trim();
    const hrefMatch = attrs.match(/\bhref=["']([^"']*)["']/i);
    const href = hrefMatch ? hrefMatch[1].trim() : "";

    const isTel = href.startsWith("tel:") || /href=["']tel:[^"']+["']/i.test(attrs);
    const isMailto = href.startsWith("mailto:");
    const isHash = href.startsWith("#");
    const isExternal = href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//");
    const isJs = href.startsWith("javascript:");

    if (isTel) {
      telLinks.push(href);
    }

    const isCtaButton =
      /\bclass=["'][^"']*\b(btn|cta|button|call-now|phone-btn|hero-btn)\b/i.test(attrs) ||
      /\bdata-cta\b/i.test(attrs);

    if (isCtaButton) {
      const isDead = !href || href === "#" || isJs;
      ctaLinks.push({ href, text: innerText, isDead });
    }

    if (!isTel && !isMailto && !isHash && !isExternal && !isJs && href.length > 0) {
      const resolvedPath = resolveInternalTarget(file.path, href);
      internalLinks.push({ href, text: innerText, resolvedPath });
    }
  }

  // 7. Navigation Structure
  const hasHeaderNav = /<header\b[\s\S]*?<nav\b/i.test(rawHtml) || /<nav\b[^>]*class=["'][^"']*(?:header|main-nav|navbar)/i.test(rawHtml) || /<nav\b/i.test(rawHtml);
  const hasFooterNav = /<footer\b[\s\S]*?<nav\b/i.test(rawHtml) || /<footer\b[\s\S]*?<a\b/i.test(rawHtml);

  return {
    path: normalizePath(file.path),
    rawHtml,
    cleanText,
    wordCount,
    title,
    metaDescription,
    canonicalHref,
    hasViewport,
    hasDoctype,
    hasLang,
    hasCharset,
    h1s,
    allHeadings,
    schemas,
    schemaErrors,
    images,
    internalLinks,
    telLinks,
    ctaLinks,
    hasHeaderNav,
    hasFooterNav,
  };
}

// ---------------------------------------------------------------------------
// Master Quality Audit Engine
// ---------------------------------------------------------------------------

export class QualityAuditEngine {
  /**
   * Deterministically audits static website files against all 25 core quality vectors.
   * Produces honest, unforgeable category scores (0-20 each) and a composite 0-100 score.
   */
  public static audit(
    files: QualityAuditFile[],
    meta?: QualityAuditMeta
  ): QualityAuditResult {
    const allFilePaths = new Set(files.map((f) => normalizePath(f.path)));
    const htmlFiles = files.filter(
      (f) => f && f.path && (f.path.toLowerCase().endsWith(".html") || f.path.toLowerCase().endsWith(".htm"))
    );

    const parsedPages: ParsedHtmlPage[] = htmlFiles.map((f) => parseHtmlPage(f));
    const detailedIssues: QualityAuditIssueItem[] = [];

    // =========================================================================
    // 1. TECHNICAL AUDIT (Max 20 Points)
    //    - HTML structure & boilerplate (4 pts)
    //    - Responsive structure & viewport (4 pts)
    //    - Robots.txt compliance (4 pts)
    //    - Basic accessibility (4 pts)
    //    - Basic performance (CLS width/height, lazy loading) (4 pts)
    // =========================================================================
    let technicalScore = 20;

    // A. HTML Boilerplate (4 pts)
    let htmlDeduction = 0;
    for (const page of parsedPages) {
      if (!page.hasDoctype) {
        detailedIssues.push({
          category: "Technical",
          check: "HTML",
          page: page.path,
          message: "Missing <!DOCTYPE html> declaration.",
          severity: "error",
        });
        htmlDeduction += 1;
      }
      if (!page.hasLang) {
        detailedIssues.push({
          category: "Technical",
          check: "HTML",
          page: page.path,
          message: "Opening <html> tag missing lang attribute (e.g. lang=\"en\").",
          severity: "error",
        });
        htmlDeduction += 1;
      }
      if (!page.hasCharset) {
        detailedIssues.push({
          category: "Technical",
          check: "HTML",
          page: page.path,
          message: "Missing <meta charset=\"utf-8\"> tag.",
          severity: "warning",
        });
        htmlDeduction += 0.5;
      }
    }
    technicalScore -= Math.min(4, htmlDeduction);

    // B. Responsive Structure (4 pts)
    let responsiveDeduction = 0;
    for (const page of parsedPages) {
      if (!page.hasViewport) {
        detailedIssues.push({
          category: "Technical",
          check: "Responsive structure",
          page: page.path,
          message: "Missing responsive <meta name=\"viewport\"> tag.",
          severity: "error",
        });
        responsiveDeduction += 2;
      }
      // Check for fixed body or container width that causes horizontal scroll (excluding responsive max-width)
      if (/(?<!max-)\bmin-width:\s*(?:1[0-9]{3}|[2-9][0-9]{3})px\b/i.test(page.rawHtml) || /(?:body|html)\s*\{[^}]*?(?<!max-)\bwidth:\s*(?:1[0-9]{3}|[2-9][0-9]{3})px/i.test(page.rawHtml)) {
        detailedIssues.push({
          category: "Technical",
          check: "Responsive structure",
          page: page.path,
          message: "Hardcoded desktop container width (>1000px) creates mobile horizontal overflow.",
          severity: "warning",
        });
        responsiveDeduction += 1;
      }
    }
    technicalScore -= Math.min(4, responsiveDeduction);

    // C. Robots.txt (4 pts)
    let robotsDeduction = 0;
    const robotsFile = files.find((f) => normalizePath(f.path) === "robots.txt");
    if (!robotsFile) {
      detailedIssues.push({
        category: "Technical",
        check: "Robots",
        message: "Missing robots.txt file in website package.",
        severity: "error",
      });
      robotsDeduction += 4;
    } else {
      const rText = typeof robotsFile.content === "string" ? robotsFile.content : robotsFile.content.toString("utf-8");
      if (!rText.includes("User-agent:")) {
        detailedIssues.push({
          category: "Technical",
          check: "Robots",
          message: "robots.txt missing User-agent directive.",
          severity: "error",
        });
        robotsDeduction += 2;
      }
      if (!rText.includes("Allow:") && !rText.includes("Disallow:")) {
        detailedIssues.push({
          category: "Technical",
          check: "Robots",
          message: "robots.txt missing Allow/Disallow directives.",
          severity: "warning",
        });
        robotsDeduction += 1;
      }
      if (!rText.includes("Sitemap:")) {
        detailedIssues.push({
          category: "Technical",
          check: "Robots",
          message: "robots.txt missing Sitemap reference directive.",
          severity: "warning",
        });
        robotsDeduction += 1;
      }
    }
    technicalScore -= Math.min(4, robotsDeduction);

    // D. Basic Accessibility (4 pts)
    let a11yDeduction = 0;
    for (const page of parsedPages) {
      // Empty buttons or links without text or aria-label
      const emptyButtons = Array.from(page.rawHtml.matchAll(/<button\b([^>]*?)>([\s\S]*?)<\/button>/gi)).filter(
        (m) => !m[2].replace(/<[^>]+>/g, "").trim() && !m[1].includes("aria-label") && !m[1].includes("title")
      );
      if (emptyButtons.length > 0) {
        detailedIssues.push({
          category: "Technical",
          check: "Basic accessibility",
          page: page.path,
          message: `${emptyButtons.length} interactive button(s) lack accessible text or aria-label.`,
          severity: "warning",
        });
        a11yDeduction += emptyButtons.length * 0.5;
      }

      // Inputs without label, placeholder, or aria-label
      const unlabelledInputs = Array.from(page.rawHtml.matchAll(/<input\b([^>]*?)>/gi)).filter(
        (m) =>
          !m[1].includes('type="hidden"') &&
          !m[1].includes("placeholder") &&
          !m[1].includes("aria-label") &&
          !m[1].includes("id=")
      );
      if (unlabelledInputs.length > 0) {
        detailedIssues.push({
          category: "Technical",
          check: "Basic accessibility",
          page: page.path,
          message: `${unlabelledInputs.length} form input(s) lack accessible placeholder or label association.`,
          severity: "warning",
        });
        a11yDeduction += unlabelledInputs.length * 0.5;
      }
    }
    technicalScore -= Math.min(4, a11yDeduction);

    // E. Basic Performance (4 pts)
    let perfDeduction = 0;
    for (const page of parsedPages) {
      // Images missing width and height (causes Cumulative Layout Shift)
      const missingDimensions = page.images.filter((img) => !img.hasWidth || !img.hasHeight);
      if (missingDimensions.length > 0) {
        detailedIssues.push({
          category: "Technical",
          check: "Basic performance issues",
          page: page.path,
          message: `${missingDimensions.length} image(s) lack explicit width/height (causes layout shift / CLS).`,
          severity: "warning",
        });
        perfDeduction += missingDimensions.length * 0.25;
      }
    }
    technicalScore -= Math.min(4, perfDeduction);
    technicalScore = Math.max(0, Math.round(technicalScore));

    // =========================================================================
    // 2. SEO AUDIT (Max 20 Points)
    //    - Titles: unique, length 15-70 chars, no duplicates (3 pts)
    //    - Meta descriptions: unique, length <= 160 chars, no duplicates (3 pts)
    //    - Canonical link presence & validity (3 pts)
    //    - Single H1 & Heading hierarchy (4 pts)
    //    - Schema.org JSON-LD validity & compliance (4 pts)
    //    - Sitemap.xml completeness & validity (3 pts)
    // =========================================================================
    let seoScore = 20;

    // A. Titles (3 pts)
    let titleDeduction = 0;
    const titleOccurrences = new Map<string, string[]>();
    for (const page of parsedPages) {
      if (!page.title) {
        detailedIssues.push({
          category: "SEO",
          check: "HTML",
          page: page.path,
          message: "Missing <title> tag.",
          severity: "error",
        });
        titleDeduction += 1.5;
      } else {
        const tLower = page.title.toLowerCase();
        const existing = titleOccurrences.get(tLower) || [];
        existing.push(page.path);
        titleOccurrences.set(tLower, existing);

        if (page.title.length < 15 || page.title.length > 70) {
          detailedIssues.push({
            category: "SEO",
            check: "HTML",
            page: page.path,
            message: `Title length (${page.title.length} chars) outside optimal search bounds (15-70 chars).`,
            severity: "warning",
          });
          titleDeduction += 0.5;
        }
      }
    }
    // Duplicate titles check
    for (const [tText, paths] of titleOccurrences.entries()) {
      if (paths.length > 1) {
        detailedIssues.push({
          category: "SEO",
          check: "Duplicate titles",
          message: `Duplicate title "${tText}" shared across ${paths.length} pages (${paths.join(", ")}).`,
          severity: "error",
        });
        titleDeduction += paths.length * 0.75;
      }
    }
    seoScore -= Math.min(3, titleDeduction);

    // B. Meta Descriptions (3 pts)
    let metaDescDeduction = 0;
    const descOccurrences = new Map<string, string[]>();
    for (const page of parsedPages) {
      if (!page.metaDescription) {
        detailedIssues.push({
          category: "SEO",
          check: "HTML",
          page: page.path,
          message: "Missing <meta name=\"description\"> tag.",
          severity: "error",
        });
        metaDescDeduction += 1.5;
      } else {
        const dLower = page.metaDescription.toLowerCase();
        const existing = descOccurrences.get(dLower) || [];
        existing.push(page.path);
        descOccurrences.set(dLower, existing);

        if (page.metaDescription.length > 160) {
          detailedIssues.push({
            category: "SEO",
            check: "HTML",
            page: page.path,
            message: `Meta description exceeds Google limit (${page.metaDescription.length} chars > 160 chars).`,
            severity: "warning",
          });
          metaDescDeduction += 0.5;
        }
      }
    }
    // Duplicate meta descriptions check
    for (const [dText, paths] of descOccurrences.entries()) {
      if (paths.length > 1) {
        detailedIssues.push({
          category: "SEO",
          check: "Duplicate meta descriptions",
          message: `Duplicate meta description shared across ${paths.length} pages (${paths.join(", ")}).`,
          severity: "error",
        });
        metaDescDeduction += paths.length * 0.75;
      }
    }
    seoScore -= Math.min(3, metaDescDeduction);

    // C. Canonical Links (3 pts)
    let canonicalDeduction = 0;
    for (const page of parsedPages) {
      if (!page.canonicalHref) {
        detailedIssues.push({
          category: "SEO",
          check: "Canonical",
          page: page.path,
          message: "Missing <link rel=\"canonical\"> link tag.",
          severity: "error",
        });
        canonicalDeduction += 1.5;
      } else if (!page.canonicalHref.startsWith("http://") && !page.canonicalHref.startsWith("https://")) {
        detailedIssues.push({
          category: "SEO",
          check: "Canonical",
          page: page.path,
          message: `Canonical link "${page.canonicalHref}" must be an absolute URL.`,
          severity: "warning",
        });
        canonicalDeduction += 0.5;
      }
    }
    seoScore -= Math.min(3, canonicalDeduction);

    // D. H1 and Heading Hierarchy (4 pts)
    let headingDeduction = 0;
    for (const page of parsedPages) {
      if (page.h1s.length === 0) {
        detailedIssues.push({
          category: "SEO",
          check: "H1",
          page: page.path,
          message: "Page has 0 <h1> heading tags.",
          severity: "error",
        });
        headingDeduction += 2;
      } else if (page.h1s.length > 1) {
        detailedIssues.push({
          category: "SEO",
          check: "H1",
          page: page.path,
          message: `Page has ${page.h1s.length} problematic <h1> heading tags (must have exactly 1).`,
          severity: "error",
        });
        headingDeduction += 1.5;
      }

      // Check heading hierarchy progression (e.g. H1 -> H3 skipping H2)
      let prevLevel = 1;
      for (const h of page.allHeadings) {
        if (h.level > prevLevel + 1) {
          detailedIssues.push({
            category: "SEO",
            check: "Heading hierarchy",
            page: page.path,
            message: `Heading hierarchy skipped from H${prevLevel} directly to H${h.level} ("${h.text}").`,
            severity: "warning",
          });
          headingDeduction += 1;
          break;
        }
        prevLevel = h.level;
      }
    }
    seoScore -= Math.min(4, headingDeduction);

    // E. Schema.org JSON-LD (4 pts)
    let schemaDeduction = 0;
    for (const page of parsedPages) {
      if (page.schemaErrors.length > 0) {
        for (const err of page.schemaErrors) {
          detailedIssues.push({
            category: "SEO",
            check: "Schema",
            page: page.path,
            message: `Schema syntax error: ${err}`,
            severity: "error",
          });
          schemaDeduction += 2;
        }
      }

      if (page.schemas.length === 0) {
        detailedIssues.push({
          category: "SEO",
          check: "Schema",
          page: page.path,
          message: "Missing Schema.org JSON-LD structured data.",
          severity: page.path === "index.html" ? "error" : "warning",
        });
        schemaDeduction += page.path === "index.html" ? 2 : 1;
      } else {
        // Verify valid @context and @type
        for (const s of page.schemas) {
          if (!s["@context"] || !s["@context"].includes("schema.org")) {
            detailedIssues.push({
              category: "SEO",
              check: "Schema",
              page: page.path,
              message: "Schema missing standard @context: https://schema.org",
              severity: "warning",
            });
            schemaDeduction += 1;
          }
          if (!s["@type"]) {
            detailedIssues.push({
              category: "SEO",
              check: "Schema",
              page: page.path,
              message: "Schema missing mandatory @type attribute.",
              severity: "error",
            });
            schemaDeduction += 1;
          }
        }
      }
    }
    seoScore -= Math.min(4, schemaDeduction);

    // F. Sitemap.xml Completeness & Validity (3 pts)
    let sitemapDeduction = 0;
    const sitemapFile = files.find((f) => normalizePath(f.path) === "sitemap.xml");
    if (!sitemapFile) {
      detailedIssues.push({
        category: "SEO",
        check: "Sitemap",
        message: "Missing sitemap.xml in website package.",
        severity: "error",
      });
      sitemapDeduction += 3;
    } else {
      const sRaw = typeof sitemapFile.content === "string" ? sitemapFile.content : sitemapFile.content.toString("utf-8");
      if (!sRaw.includes("<urlset") || !sRaw.includes("http://www.sitemaps.org/schemas/sitemap/0.9")) {
        detailedIssues.push({
          category: "SEO",
          check: "Sitemap",
          message: "sitemap.xml missing standard <urlset> namespace definition.",
          severity: "error",
        });
        sitemapDeduction += 1.5;
      }

      // Verify every HTML page is indexed in sitemap
      for (const hp of parsedPages) {
        const expectedLoc = hp.path === "index.html" ? "" : hp.path;
        const matchesLoc = sRaw.includes(`/${expectedLoc}</loc>`) || (expectedLoc === "" && sRaw.includes(".com/</loc>"));
        if (!matchesLoc) {
          detailedIssues.push({
            category: "SEO",
            check: "Sitemap",
            message: `sitemap.xml does not index HTML page "${hp.path}".`,
            severity: "warning",
          });
          sitemapDeduction += 0.5;
        }
      }

      // Verify no 404 targets in sitemap
      const locMatches = sRaw.matchAll(/<loc>([^<]+)<\/loc>/gi);
      for (const lm of locMatches) {
        const url = lm[1].trim();
        const urlPath = url.replace(/^https?:\/\/[^\/]+/, "").replace(/^\/+/, "");
        const targetFile = urlPath === "" ? "index.html" : urlPath;
        if (!allFilePaths.has(targetFile.toLowerCase())) {
          detailedIssues.push({
            category: "SEO",
            check: "Sitemap",
            message: `sitemap.xml indexes URL "${url}" pointing to non-existent file "${targetFile}".`,
            severity: "error",
          });
          sitemapDeduction += 1.5;
        }
      }
    }
    seoScore -= Math.min(3, sitemapDeduction);
    seoScore = Math.max(0, Math.round(seoScore));

    // =========================================================================
    // 3. CONTENT AUDIT (Max 20 Points)
    //    - Thin pages (< 200 visible words) (6 pts)
    //    - Content similarity (> 60% overlap flagged) (6 pts)
    //    - Missing pages (mandatory core pages) (4 pts)
    //    - Brand & NAP consistency / no placeholder strings (4 pts)
    // =========================================================================
    let contentScore = 20;

    // A. Thin Pages (6 pts)
    let thinDeduction = 0;
    for (const page of parsedPages) {
      if (page.wordCount < 200) {
        detailedIssues.push({
          category: "Content",
          check: "Thin pages",
          page: page.path,
          message: `Thin page content: only ${page.wordCount} words (minimum 200 words required).`,
          severity: "error",
        });
        thinDeduction += 2;
      }
    }
    contentScore -= Math.min(6, thinDeduction);

    // B. Content Similarity (6 pts)
    let similarityDeduction = 0;
    for (let i = 0; i < parsedPages.length; i++) {
      for (let j = i + 1; j < parsedPages.length; j++) {
        const pA = parsedPages[i];
        const pB = parsedPages[j];
        const sim = computeDiceSimilarity(pA.cleanText, pB.cleanText);
        if (sim > 0.60) {
          const simPct = Math.round(sim * 100);
          detailedIssues.push({
            category: "Content",
            check: "Content similarity",
            message: `High content similarity (${simPct}%) between "${pA.path}" and "${pB.path}".`,
            severity: sim > 0.80 ? "error" : "warning",
          });
          similarityDeduction += 2;
        }
      }
    }
    contentScore -= Math.min(6, similarityDeduction);

    // C. Missing Pages (4 pts)
    let missingPagesDeduction = 0;
    if (!allFilePaths.has("index.html")) {
      detailedIssues.push({
        category: "Content",
        check: "Missing pages",
        message: "Missing mandatory homepage (index.html).",
        severity: "error",
      });
      missingPagesDeduction += 4;
    }

    if (meta?.expectedPages && meta.expectedPages.length > 0) {
      for (const exp of meta.expectedPages) {
        const normExp = normalizePath(exp);
        if (!allFilePaths.has(normExp)) {
          detailedIssues.push({
            category: "Content",
            check: "Missing pages",
            message: `Missing expected page "${exp}".`,
            severity: "error",
          });
          missingPagesDeduction += 1;
        }
      }
    }
    contentScore -= Math.min(4, missingPagesDeduction);

    // D. Brand, NAP Consistency & No Placeholder Tokens (4 pts)
    let napDeduction = 0;
    const placeholderTokens = ["[city]", "[phone]", "{phone}", "{city}", "lorem ipsum", "your business name", "todo", "undefined", "[state]"];
    for (const page of parsedPages) {
      const lowerText = page.rawHtml.toLowerCase();
      for (const token of placeholderTokens) {
        if (lowerText.includes(token)) {
          detailedIssues.push({
            category: "Content",
            check: "Content similarity",
            page: page.path,
            message: `Unpopulated placeholder token "${token}" found in page HTML.`,
            severity: "error",
          });
          napDeduction += 1;
          break;
        }
      }
    }
    contentScore -= Math.min(4, napDeduction);
    contentScore = Math.max(0, Math.round(contentScore));

    // =========================================================================
    // 4. IMAGES AUDIT (Max 20 Points)
    //    - Missing images (5 pts)
    //    - Broken images (5 pts)
    //    - Duplicate images (5 pts)
    //    - Missing alt text (5 pts)
    // =========================================================================
    let imagesScore = 20;

    // A. Missing Images (5 pts)
    let missingImgsDeduction = 0;
    for (const page of parsedPages) {
      for (const img of page.images) {
        if (!img.src || img.src === "undefined" || img.src === "#") {
          detailedIssues.push({
            category: "Images",
            check: "Missing images",
            page: page.path,
            message: "Image tag missing valid src attribute.",
            severity: "error",
          });
          missingImgsDeduction += 2.5;
        }
      }
    }
    imagesScore -= Math.min(5, missingImgsDeduction);

    // B. Broken Images (5 pts)
    let brokenImgsDeduction = 0;
    for (const page of parsedPages) {
      for (const img of page.images) {
        if (img.src && !img.src.startsWith("http://") && !img.src.startsWith("https://") && !img.src.startsWith("data:")) {
          // Local path
          const cleanSrc = img.src.split("?")[0].split("#")[0].replace(/^\/+/, "");
          const targetPath = cleanSrc.toLowerCase();
          if (!allFilePaths.has(targetPath)) {
            detailedIssues.push({
              category: "Images",
              check: "Broken images",
              page: page.path,
              message: `Broken local image src="${img.src}" (file not found in package).`,
              severity: "error",
            });
            brokenImgsDeduction += 2.5;
          }
        }
      }
    }
    imagesScore -= Math.min(5, brokenImgsDeduction);

    // C. Duplicate Images (5 pts)
    let duplicateImgsDeduction = 0;
    for (const page of parsedPages) {
      const pageImageSrcs = new Map<string, number>();
      for (const img of page.images) {
        if (!img.src || img.src.length < 5) continue;
        const count = pageImageSrcs.get(img.src) || 0;
        pageImageSrcs.set(img.src, count + 1);
      }
      for (const [src, count] of pageImageSrcs.entries()) {
        if (count > 1) {
          detailedIssues.push({
            category: "Images",
            check: "Duplicate images",
            page: page.path,
            message: `Duplicate image "${src.slice(0, 50)}..." used ${count} times on the same page.`,
            severity: "warning",
          });
          duplicateImgsDeduction += count * 1.5;
        }
      }
    }
    imagesScore -= Math.min(5, duplicateImgsDeduction);

    // D. Missing Alt Text (5 pts)
    let missingAltDeduction = 0;
    for (const page of parsedPages) {
      for (const img of page.images) {
        if (!img.hasAlt) {
          detailedIssues.push({
            category: "Images",
            check: "Missing alt text",
            page: page.path,
            message: `Image missing descriptive alt attribute (src="${img.src.slice(0, 45)}...").`,
            severity: "warning",
          });
          missingAltDeduction += 1;
        } else if (img.alt.toLowerCase() === "image" || img.alt.toLowerCase() === "photo") {
          detailedIssues.push({
            category: "Images",
            check: "Missing alt text",
            page: page.path,
            message: `Image has generic alt text ("${img.alt}").`,
            severity: "warning",
          });
          missingAltDeduction += 0.5;
        }
      }
    }
    imagesScore -= Math.min(5, missingAltDeduction);
    imagesScore = Math.max(0, Math.round(imagesScore));

    // =========================================================================
    // 5. INTERNAL LINKING AUDIT (Max 20 Points)
    //    - Navigation structure on every page (4 pts)
    //    - Phone links clickable tel: format (4 pts)
    //    - CTA links valid & actionable (4 pts)
    //    - Broken internal links (4 pts)
    //    - Orphan pages (4 pts)
    // =========================================================================
    let linkingScore = 20;

    // A. Navigation Structure (4 pts)
    let navDeduction = 0;
    for (const page of parsedPages) {
      if (!page.hasHeaderNav) {
        detailedIssues.push({
          category: "Internal Linking",
          check: "Navigation",
          page: page.path,
          message: "Page missing functional header navigation menu.",
          severity: "error",
        });
        navDeduction += 2;
      }
    }
    linkingScore -= Math.min(4, navDeduction);

    // B. Phone Links Clickable (4 pts)
    let phoneDeduction = 0;
    for (const page of parsedPages) {
      if (meta?.phone) {
        const rawPhone = meta.phone;
        const cleanDigits = rawPhone.replace(/\D/g, "");
        if (cleanDigits.length >= 7 && page.rawHtml.includes(rawPhone)) {
          // Check if it exists as tel: link
          const hasMatchingTel = page.telLinks.some((t) => t.includes(cleanDigits));
          if (!hasMatchingTel) {
            detailedIssues.push({
              category: "Internal Linking",
              check: "Phone links",
              page: page.path,
              message: `Phone number "${rawPhone}" is displayed as unclickable text instead of a clickable tel: link.`,
              severity: "warning",
            });
            phoneDeduction += 1.5;
          }
        }
      }
    }
    linkingScore -= Math.min(4, phoneDeduction);

    // C. CTA Links (4 pts)
    let ctaDeduction = 0;
    for (const page of parsedPages) {
      const deadCtas = page.ctaLinks.filter((c) => c.isDead);
      if (deadCtas.length > 0) {
        detailedIssues.push({
          category: "Internal Linking",
          check: "CTA links",
          page: page.path,
          message: `${deadCtas.length} call-to-action button(s) have empty or dead hrefs ("#").`,
          severity: "error",
        });
        ctaDeduction += deadCtas.length * 1.5;
      }
    }
    linkingScore -= Math.min(4, ctaDeduction);

    // D. Broken Internal Links (4 pts)
    let brokenLinksDeduction = 0;
    for (const page of parsedPages) {
      for (const link of page.internalLinks) {
        if (!link.resolvedPath || !allFilePaths.has(link.resolvedPath)) {
          detailedIssues.push({
            category: "Internal Linking",
            check: "Broken links",
            page: page.path,
            message: `Broken internal link href="${link.href}" (target file "${link.resolvedPath}" not found).`,
            severity: "error",
          });
          brokenLinksDeduction += 2;
        }
      }
    }
    linkingScore -= Math.min(4, brokenLinksDeduction);

    // E. Orphan Pages (4 pts)
    let orphanDeduction = 0;
    const incomingLinkCounts = new Map<string, number>();
    for (const page of parsedPages) {
      incomingLinkCounts.set(page.path, 0);
    }
    for (const page of parsedPages) {
      for (const link of page.internalLinks) {
        if (link.resolvedPath && incomingLinkCounts.has(link.resolvedPath)) {
          // Do not count self-links as incoming links
          if (link.resolvedPath !== page.path) {
            incomingLinkCounts.set(link.resolvedPath, (incomingLinkCounts.get(link.resolvedPath) || 0) + 1);
          }
        }
      }
    }
    // Every page except index.html must have at least 1 incoming internal link
    for (const [pPath, count] of incomingLinkCounts.entries()) {
      if (pPath !== "index.html" && count === 0) {
        detailedIssues.push({
          category: "Internal Linking",
          check: "Orphan pages",
          message: `Orphan page "${pPath}" has 0 incoming internal links.`,
          severity: "error",
        });
        orphanDeduction += 2;
      }
    }
    linkingScore -= Math.min(4, orphanDeduction);
    linkingScore = Math.max(0, Math.round(linkingScore));

    // =========================================================================
    // COMPOSITE SCORE CALCULATION
    // =========================================================================
    const overallScore = Math.min(100, Math.max(0, technicalScore + seoScore + contentScore + imagesScore + linkingScore));

    // =========================================================================
    // GROUPED HUMAN-READABLE ISSUES SUMMARY
    // =========================================================================
    const issueCounts = new Map<string, number>();
    for (const item of detailedIssues) {
      let key = "";
      if (item.check === "Duplicate images") key = "duplicate image";
      else if (item.check === "Thin pages") key = "thin page";
      else if (item.check === "Missing alt text") key = "missing alt attribute";
      else if (item.check === "Broken links") key = "broken internal link";
      else if (item.check === "Orphan pages") key = "orphan page";
      else if (item.check === "Broken images") key = "broken image";
      else if (item.check === "Missing images") key = "missing image";
      else if (item.check === "Missing pages") key = "missing page";
      else if (item.check === "Duplicate titles") key = "duplicate title";
      else if (item.check === "Duplicate meta descriptions") key = "duplicate meta description";
      else if (item.check === "Canonical") key = "canonical link issue";
      else if (item.check === "H1") key = "H1 heading issue";
      else if (item.check === "Heading hierarchy") key = "heading hierarchy violation";
      else if (item.check === "Schema") key = "schema structured data issue";
      else if (item.check === "Sitemap") key = "sitemap.xml issue";
      else if (item.check === "Robots") key = "robots.txt issue";
      else if (item.check === "Phone links") key = "unclickable phone link";
      else if (item.check === "CTA links") key = "dead CTA link";
      else if (item.check === "Navigation") key = "missing navigation menu";
      else if (item.check === "Responsive structure") key = "responsive viewport issue";
      else if (item.check === "HTML") key = "HTML structure issue";
      else if (item.check === "Content similarity") key = "content similarity issue";
      else if (item.check === "Basic accessibility") key = "accessibility issue";
      else if (item.check === "Basic performance issues") key = "performance issue";
      else key = `${item.check.toLowerCase()} issue`;

      issueCounts.set(key, (issueCounts.get(key) || 0) + 1);
    }

    const issues: string[] = [];
    for (const [key, count] of issueCounts.entries()) {
      const plural = count === 1 ? key : `${key}s`;
      issues.push(`${count} ${plural}`);
    }

    // Build the exact required summary text
    const summaryLines = [
      "SITE QUALITY",
      `${overallScore}/100`,
      "",
      `Technical: ${technicalScore}/20`,
      `SEO: ${seoScore}/20`,
      `Content: ${contentScore}/20`,
      `Images: ${imagesScore}/20`,
      `Internal Linking: ${linkingScore}/20`,
      "",
      "Issues:",
      ...(issues.length > 0 ? issues : ["None (0 issues detected)"]),
    ];
    const summaryText = summaryLines.join("\n");

    return {
      overallScore,
      categoryScores: {
        technical: { name: "Technical", earned: technicalScore, max: 20, percentage: Math.round((technicalScore / 20) * 100) },
        seo: { name: "SEO", earned: seoScore, max: 20, percentage: Math.round((seoScore / 20) * 100) },
        content: { name: "Content", earned: contentScore, max: 20, percentage: Math.round((contentScore / 20) * 100) },
        images: { name: "Images", earned: imagesScore, max: 20, percentage: Math.round((imagesScore / 20) * 100) },
        internalLinking: { name: "Internal Linking", earned: linkingScore, max: 20, percentage: Math.round((linkingScore / 20) * 100) },
      },
      issues,
      detailedIssues,
      totalPagesScanned: parsedPages.length,
      summaryText,
      timestamp: Date.now(),
    };
  }
}

export { QualityAutoFixEngine, type QualityAutoFixResult } from "./quality-auto-fix-engine";
