/**
 * RankLocal 2.0: Master Quality Auto-Fix Engine
 * 
 * Safely resolves detected website quality, content, SEO, image, and linking issues:
 * 1. Duplicate image -> select replacement photo (trade-relevant, verified unique)
 * 2. Missing alt -> generate descriptive, keyword-rich alt text tailored to page topic
 * 3. Duplicate title -> regenerate unique, localized, CTR-optimized titles (35-65 chars)
 * 4. Broken internal link -> select closest valid destination within existing pages
 * 5. Weak internal linking -> add valid contextual links, eliminate orphan pages
 * 6. Thin page -> improve content depth with local standards, process steps & FAQs (> 300 words)
 * 
 * Strict Verification Rule:
 * After fixing, RUN AUDIT AGAIN.
 * Do not mark an issue fixed until the post-fix audit confirms it has been resolved.
 * 
 * Output report sections:
 * - Issues Before
 * - Issues Fixed
 * - Issues Remaining
 * - Final Score
 */

import {
  QualityAuditEngine,
  QualityAuditFile,
  QualityAuditMeta,
  QualityAuditResult,
} from "./quality-audit-engine";
import {
  resolvePhoto,
  detectTradeCategory,
  UNIVERSAL_HERO_PHOTOS,
  UNIVERSAL_SERVICE_PHOTOS,
} from "../photos/photo-service";

export interface QualityAutoFixOptions {
  trade?: string;
  domain?: string;
  onProgress?: (step: string, current: number, total: number) => void;
}

export interface QualityAutoFixResult {
  fixedFiles: QualityAuditFile[];
  issuesBefore: string[];
  issuesFixed: string[];
  issuesRemaining: string[];
  finalScore: number;
  scoreBefore: number;
  scoreDelta: number;
  auditBefore: QualityAuditResult;
  auditAfter: QualityAuditResult;
  reportText: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function normalizePath(p: string): string {
  return p.replace(/^[\\\/]+/, "").replace(/\\/g, "/").toLowerCase();
}

function truncateAtWord(text: string, maxLen: number): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return trimmed.slice(0, maxLen - 3).replace(/\s+\S*$/, "") + "...";
}

function cleanTextFromHtml(html: string): string {
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

function resolveInternalTarget(fromPage: string, href: string): string {
  const cleanHref = href.split("?")[0].split("#")[0].trim();
  if (!cleanHref) return "";

  if (cleanHref.startsWith("/")) {
    const withoutSlash = cleanHref.replace(/^\/+/, "");
    return withoutSlash.endsWith(".html") || withoutSlash.includes(".")
      ? withoutSlash.toLowerCase()
      : `${withoutSlash}.html`.toLowerCase();
  }

  const fromParts = fromPage.split("/");
  fromParts.pop();
  const baseDir = fromParts.join("/");
  const combined = baseDir ? `${baseDir}/${cleanHref}` : cleanHref;

  const segments = combined.split("/");
  const resolvedSegments: string[] = [];
  for (const seg of segments) {
    if (seg === "." || seg === "") continue;
    if (seg === "..") {
      resolvedSegments.pop();
    } else {
      resolvedSegments.push(seg);
    }
  }

  let finalTarget = resolvedSegments.join("/").toLowerCase();
  if (finalTarget && !finalTarget.endsWith(".html") && !finalTarget.includes(".")) {
    finalTarget += ".html";
  }
  return finalTarget;
}

// ---------------------------------------------------------------------------
// 1. DUPLICATE IMAGE FIX: Select unique replacement photo
// ---------------------------------------------------------------------------

export function fixDuplicateImages(
  files: QualityAuditFile[],
  meta: QualityAuditMeta
): { files: QualityAuditFile[]; changes: string[] } {
  const changes: string[] = [];
  const tradeCat = detectTradeCategory(meta.trade || meta.businessName || "plumber");

  // Collect all existing local image assets from the file package if available
  const existingLocalImages = files
    .filter((f) => /\.(jpg|jpeg|png|webp|svg)$/i.test(f.path))
    .map((f) => f.path);

  const updatedFiles = files.map((file) => {
    if (!file.path.toLowerCase().endsWith(".html")) return file;

    let html = typeof file.content === "string" ? file.content : file.content.toString("utf8");
    const pageSlug = file.path.replace(/\.html$/, "").toLowerCase();
    const isHome = pageSlug === "index" || pageSlug === "home";

    const seenSrcsOnPage = new Map<string, number>();
    const pageUsedUrls = new Set<string>();

    // First pass: register all image srcs on this page
    const imgRegex = /<img\b([^>]*?)>/gi;
    let match: RegExpExecArray | null;
    while ((match = imgRegex.exec(html)) !== null) {
      const srcMatch = match[1].match(/\bsrc=["']([^"']*)["']/i);
      if (srcMatch && srcMatch[1]) {
        const src = srcMatch[1].trim();
        if (src.length > 5) {
          pageUsedUrls.add(src);
        }
      }
    }

    let replacementIndex = 1;
    let modified = false;

    // Second pass: replace 2nd and subsequent instances of any duplicated src
    html = html.replace(/<img\b([^>]*?)>/gi, (fullTag, attrs) => {
      const srcMatch = attrs.match(/\bsrc=["']([^"']*)["']/i);
      if (!srcMatch || !srcMatch[1]) return fullTag;

      const currentSrc = srcMatch[1].trim();
      if (currentSrc.length < 5) return fullTag;

      const count = seenSrcsOnPage.get(currentSrc) || 0;
      seenSrcsOnPage.set(currentSrc, count + 1);

      // If first time seen, keep it
      if (count === 0) return fullTag;

      // Duplicate detected! Select replacement
      let replacementUrl = "";

      // Option A: Choose an unused local image from files if one exists
      for (const locImg of existingLocalImages) {
        if (!pageUsedUrls.has(locImg) && !pageUsedUrls.has(`/${locImg}`)) {
          replacementUrl = locImg.startsWith("/") ? locImg : `/${locImg}`;
          break;
        }
      }

      // Option B: Select an unused high-res photo from trade registry / universal pools
      if (!replacementUrl) {
        const slot = attrs.toLowerCase().includes("hero") ? "hero" : "service";
        const photoRes = resolvePhoto(
          tradeCat,
          slot,
          `${pageSlug} service ${replacementIndex}`,
          replacementIndex + 10,
          pageUsedUrls
        );
        replacementUrl = photoRes.url;
      }

      // Option C: Fallback to universal photo pools
      if (!replacementUrl || pageUsedUrls.has(replacementUrl)) {
        for (const u of UNIVERSAL_SERVICE_PHOTOS) {
          if (!pageUsedUrls.has(u)) {
            replacementUrl = u;
            break;
          }
        }
      }

      if (!replacementUrl) {
        replacementUrl = UNIVERSAL_HERO_PHOTOS[replacementIndex % UNIVERSAL_HERO_PHOTOS.length];
      }

      pageUsedUrls.add(replacementUrl);
      replacementIndex++;
      modified = true;

      changes.push(
        `[${file.path}] Replaced duplicate image (${currentSrc.slice(0, 45)}...) with unique photo (${replacementUrl.slice(0, 45)}...).`
      );

      // Replace src attribute
      let newAttrs = attrs.replace(/\bsrc=["'][^"']*["']/i, `src="${replacementUrl}"`);

      // If alt was also duplicated, update alt to match the new image context
      if (!attrs.includes("alt=") || /alt=["']\s*["']/i.test(attrs) || attrs.includes(currentSrc)) {
        const newAlt = `${meta.businessName || "Professional"} ${meta.trade || "contractor"} specialist performing ${pageSlug.replace(/-/g, " ")} service`;
        newAttrs = newAttrs.replace(/alt=["'][^"']*["']/i, `alt="${newAlt}"`);
      }

      return `<img ${newAttrs.trim()}>`;
    });

    if (modified) {
      return { ...file, content: html };
    }
    return file;
  });

  return { files: updatedFiles, changes };
}

// ---------------------------------------------------------------------------
// 2. MISSING ALT FIX: Generate descriptive, context-aware alt text
// ---------------------------------------------------------------------------

export function fixMissingAlts(
  files: QualityAuditFile[],
  meta: QualityAuditMeta
): { files: QualityAuditFile[]; changes: string[] } {
  const changes: string[] = [];
  const trade = meta.trade || "Local Service Specialist";
  const city = meta.city || "Local Community";
  const state = meta.state || "";
  const bName = meta.businessName || "Local Specialist";

  const updatedFiles = files.map((file) => {
    if (!file.path.toLowerCase().endsWith(".html")) return file;

    let html = typeof file.content === "string" ? file.content : file.content.toString("utf8");
    const pageSlug = file.path.replace(/\.html$/, "").toLowerCase();
    const isHome = pageSlug === "index" || pageSlug === "home";
    const pageTopic = isHome
      ? trade
      : pageSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    let imgIndex = 1;
    let modified = false;

    html = html.replace(/<img\b([^>]*?)>/gi, (fullTag, attrs) => {
      const altMatch = attrs.match(/\balt=["']([^"']*)["']/i);
      const currentAlt = altMatch ? altMatch[1].trim() : "";
      const lowerAlt = currentAlt.toLowerCase();

      // Check if missing, empty, or generic
      const isMissing = altMatch === null || currentAlt.length === 0;
      const isGeneric = lowerAlt === "image" || lowerAlt === "photo" || lowerAlt === "img" || lowerAlt === "picture";

      if (isMissing || isGeneric) {
        modified = true;
        const isHero = attrs.toLowerCase().includes("hero") || imgIndex === 1;
        const descriptiveAlt = isHero
          ? `Licensed ${trade.toLowerCase()} team from ${bName} servicing ${city}${state ? `, ${state}` : ""}`
          : `Professional ${pageTopic.toLowerCase()} procedures performed by ${bName} in ${city}${state ? `, ${state}` : ""}`;

        let newAttrs = attrs;
        if (altMatch) {
          newAttrs = newAttrs.replace(/\balt=["'][^"']*["']/i, `alt="${descriptiveAlt}"`);
        } else {
          newAttrs += ` alt="${descriptiveAlt}"`;
        }

        // Also ensure explicit width/height and lazy loading for web performance if absent
        if (!/\bwidth=["']?\d+["']?/i.test(newAttrs)) {
          newAttrs += ` width="800" height="533"`;
        }
        if (!/\bloading=["'][^"']+["']/i.test(newAttrs)) {
          newAttrs += isHero ? ` loading="eager" fetchpriority="high"` : ` loading="lazy" decoding="async"`;
        }

        changes.push(
          `[${file.path}] Generated descriptive alt text for image #${imgIndex}: "${descriptiveAlt}".`
        );

        imgIndex++;
        return `<img ${newAttrs.trim()}>`;
      }

      imgIndex++;
      return fullTag;
    });

    if (modified) {
      return { ...file, content: html };
    }
    return file;
  });

  return { files: updatedFiles, changes };
}

// ---------------------------------------------------------------------------
// 3. DUPLICATE TITLE FIX: Regenerate unique, CTR-optimized titles (35-65 chars)
// ---------------------------------------------------------------------------

export function fixDuplicateTitles(
  files: QualityAuditFile[],
  meta: QualityAuditMeta
): { files: QualityAuditFile[]; changes: string[] } {
  const changes: string[] = [];
  const bName = meta.businessName || "Local Specialist";
  const trade = meta.trade || "Local Service Specialist";
  const city = meta.city || "Local Community";
  const state = meta.state || "";

  // 1. Group pages by normalized title
  const titleUsage = new Map<string, string[]>();
  for (const f of files) {
    if (!f.path.toLowerCase().endsWith(".html")) continue;
    const html = typeof f.content === "string" ? f.content : f.content.toString("utf8");
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const rawTitle = titleMatch ? titleMatch[1].trim() : "";
    const normTitle = rawTitle.toLowerCase();
    if (normTitle) {
      const list = titleUsage.get(normTitle) || [];
      list.push(f.path);
      titleUsage.set(normTitle, list);
    }
  }

  // Identify duplicate titles
  const duplicateTitles = new Set<string>();
  for (const [t, paths] of titleUsage.entries()) {
    if (paths.length > 1) {
      duplicateTitles.add(t);
    }
  }

  const usedTitles = new Set<string>();
  // Pre-seed unique non-duplicate titles to avoid collisions
  for (const [t, paths] of titleUsage.entries()) {
    if (paths.length === 1) {
      usedTitles.add(t);
    }
  }

  const updatedFiles = files.map((file) => {
    if (!file.path.toLowerCase().endsWith(".html")) return file;

    let html = typeof file.content === "string" ? file.content : file.content.toString("utf8");
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const currentTitle = titleMatch ? titleMatch[1].trim() : "";
    const normTitle = currentTitle.toLowerCase();

    // Check if title is missing, duplicate, or too short/long
    const isDuplicate = duplicateTitles.has(normTitle);
    const isMissing = !currentTitle;
    const isTooShort = currentTitle.length < 25;
    const isTooLong = currentTitle.length > 70;

    if (!isDuplicate && !isMissing && !isTooShort && !isTooLong) {
      return file;
    }

    const pageSlug = file.path.replace(/\.html$/, "").toLowerCase();
    const isHome = pageSlug === "index" || pageSlug === "home";
    const pageTopic = isHome
      ? trade
      : pageSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    // Generate differentiated base title based on page type
    let newTitle = "";
    if (isHome) {
      newTitle = `${trade} in ${city}${state ? `, ${state}` : ""} | ${bName}`;
    } else if (pageSlug.includes("contact")) {
      newTitle = `Contact ${bName} | ${city} ${trade} Dispatch`;
    } else if (pageSlug.includes("about")) {
      newTitle = `About Our Certified ${trade} Team in ${city} | ${bName}`;
    } else if (pageSlug.includes("faq")) {
      newTitle = `Frequently Asked Questions | ${trade} Services in ${city}`;
    } else if (pageSlug.includes("area") || pageSlug.includes("location")) {
      newTitle = `Service Areas Across ${city}${state ? `, ${state}` : ""} | ${bName}`;
    } else if (pageSlug.startsWith("blog/")) {
      newTitle = `${pageTopic} Guide | ${bName} Blog`;
    } else {
      // Dedicated service or location landing page
      newTitle = `${pageTopic} in ${city}${state ? `, ${state}` : ""} | ${bName}`;
    }

    // Ensure within 35 to 65 chars
    if (newTitle.length < 35) {
      newTitle = `${newTitle} - Trusted Experts`;
    }
    if (newTitle.length > 65) {
      newTitle = truncateAtWord(newTitle, 65);
    }

    // Ensure 100% uniqueness across the site
    let attempt = 1;
    let finalTitle = newTitle;
    const differentiators = [
      "Top Rated",
      "Licensed Team",
      "Expert Dispatch",
      "Upfront Rates",
      "Fast Response",
      "24/7 Support",
    ];

    while (usedTitles.has(finalTitle.toLowerCase()) && attempt <= 6) {
      const diff = differentiators[(attempt - 1) % differentiators.length];
      const candidate = `${pageTopic} - ${diff} | ${bName}`;
      finalTitle = candidate.length <= 65 ? candidate : truncateAtWord(candidate, 65);
      attempt++;
    }

    usedTitles.add(finalTitle.toLowerCase());

    // Update <title>
    if (/<title[^>]*>[\s\S]*?<\/title>/i.test(html)) {
      html = html.replace(/<title[^>]*>[\s\S]*?<\/title>/i, `<title>${finalTitle}</title>`);
    } else if (/<head>/i.test(html)) {
      html = html.replace(/<head>/i, `<head>\n  <title>${finalTitle}</title>`);
    }

    // Synchronize OpenGraph and Twitter titles
    if (/<meta[^>]*?property=["']og:title["'][^>]*?>/i.test(html)) {
      html = html.replace(
        /<meta[^>]*?property=["']og:title["'][^>]*?>/i,
        `<meta property="og:title" content="${finalTitle}">`
      );
    } else if (/<head>/i.test(html)) {
      html = html.replace(/<head>/i, `<head>\n  <meta property="og:title" content="${finalTitle}">`);
    }

    if (/<meta[^>]*?name=["']twitter:title["'][^>]*?>/i.test(html)) {
      html = html.replace(
        /<meta[^>]*?name=["']twitter:title["'][^>]*?>/i,
        `<meta name="twitter:title" content="${finalTitle}">`
      );
    }

    changes.push(
      `[${file.path}] Regenerated unique SEO Title (${finalTitle.length} chars): "${finalTitle}".`
    );

    return { ...file, content: html };
  });

  return { files: updatedFiles, changes };
}

// ---------------------------------------------------------------------------
// 4. BROKEN INTERNAL LINK FIX: Select valid destination within existing pages
// ---------------------------------------------------------------------------

export function fixBrokenInternalLinks(
  files: QualityAuditFile[],
  meta: QualityAuditMeta
): { files: QualityAuditFile[]; changes: string[] } {
  const changes: string[] = [];
  const allValidFilePaths = new Set(files.map((f) => normalizePath(f.path)));
  const validHtmlPages = files
    .filter((f) => f.path.toLowerCase().endsWith(".html"))
    .map((f) => normalizePath(f.path));

  // Determine standard fallback pages
  const homePage = validHtmlPages.find((p) => p === "index.html") || validHtmlPages[0] || "index.html";
  const contactPage = validHtmlPages.find((p) => p.includes("contact")) || homePage;
  const servicesHubPage = validHtmlPages.find((p) => p.includes("service") && !p.includes("-")) ||
    validHtmlPages.find((p) => p.includes("service")) || homePage;
  const areasHubPage = validHtmlPages.find((p) => p.includes("area") || p.includes("location")) || servicesHubPage;

  const selectBestValidDestination = (brokenHref: string, fromPage: string): string => {
    const cleanHref = brokenHref.split("#")[0].split("?")[0].toLowerCase().replace(/^\/+/, "");
    const slugWithoutExt = cleanHref.replace(/\.html$/, "");

    // 1. Keyword-based destination routing
    if (slugWithoutExt.includes("contact") || slugWithoutExt.includes("call") || slugWithoutExt.includes("quote") || slugWithoutExt.includes("book")) {
      return contactPage;
    }
    if (slugWithoutExt.includes("area") || slugWithoutExt.includes("location") || slugWithoutExt.includes("city")) {
      return areasHubPage;
    }
    if (slugWithoutExt.includes("about") || slugWithoutExt.includes("team")) {
      const about = validHtmlPages.find((p) => p.includes("about"));
      if (about) return about;
    }
    if (slugWithoutExt.includes("faq")) {
      const faq = validHtmlPages.find((p) => p.includes("faq"));
      if (faq) return faq;
    }
    if (slugWithoutExt.includes("blog") || slugWithoutExt.includes("post") || slugWithoutExt.includes("article")) {
      const blog = validHtmlPages.find((p) => p.includes("blog"));
      if (blog) return blog;
    }

    // 2. Direct slug match against existing pages
    const words = slugWithoutExt.split(/[-_]/).filter((w) => w.length > 2);
    let bestMatch = "";
    let maxMatchScore = 0;

    for (const validPage of validHtmlPages) {
      if (validPage === normalizePath(fromPage)) continue; // Don't match self
      let score = 0;
      for (const w of words) {
        if (validPage.includes(w)) score += 2;
      }
      if (score > maxMatchScore) {
        maxMatchScore = score;
        bestMatch = validPage;
      }
    }

    if (bestMatch && maxMatchScore >= 2) {
      return bestMatch;
    }

    // 3. Fallback to services hub or contact or home
    return servicesHubPage !== normalizePath(fromPage) ? servicesHubPage : contactPage;
  };

  const updatedFiles = files.map((file) => {
    if (!file.path.toLowerCase().endsWith(".html")) return file;

    let html = typeof file.content === "string" ? file.content : file.content.toString("utf8");
    let modified = false;

    // Scan all <a href="..."> links
    html = html.replace(/<a\b([^>]*?)>/gi, (fullTag, attrs) => {
      const hrefMatch = attrs.match(/\bhref=["']([^"']*)["']/i);
      if (!hrefMatch) return fullTag;

      const rawHref = hrefMatch[1].trim();

      // Skip non-internal links
      if (
        !rawHref ||
        rawHref === "#" ||
        rawHref.startsWith("#") ||
        rawHref.startsWith("tel:") ||
        rawHref.startsWith("mailto:") ||
        rawHref.startsWith("http://") ||
        rawHref.startsWith("https://") ||
        rawHref.startsWith("//") ||
        rawHref.startsWith("javascript:")
      ) {
        return fullTag;
      }

      const resolved = resolveInternalTarget(file.path, rawHref);
      if (!resolved || !allValidFilePaths.has(resolved)) {
        // Broken link detected!
        const validTarget = selectBestValidDestination(rawHref, file.path);
        modified = true;

        changes.push(
          `[${file.path}] Repaired broken internal link href="${rawHref}" -> selected valid destination "${validTarget}".`
        );

        const newAttrs = attrs.replace(/\bhref=["'][^"']*["']/i, `href="${validTarget}"`);
        return `<a ${newAttrs}>`;
      }

      return fullTag;
    });

    if (modified) {
      return { ...file, content: html };
    }
    return file;
  });

  return { files: updatedFiles, changes };
}

// ---------------------------------------------------------------------------
// 5. WEAK INTERNAL LINKING FIX: Add valid links & eliminate orphan pages
// ---------------------------------------------------------------------------

export function fixWeakInternalLinking(
  files: QualityAuditFile[],
  meta: QualityAuditMeta
): { files: QualityAuditFile[]; changes: string[] } {
  const changes: string[] = [];
  const htmlFiles = files.filter((f) => f.path.toLowerCase().endsWith(".html"));
  const allHtmlPaths = htmlFiles.map((f) => normalizePath(f.path));

  // Count incoming links per page
  const incomingLinkCounts = new Map<string, number>();
  for (const p of allHtmlPaths) {
    incomingLinkCounts.set(p, 0);
  }

  for (const f of htmlFiles) {
    const html = typeof f.content === "string" ? f.content : f.content.toString("utf8");
    const anchorRegex = /<a\b[^>]*?\bhref=["']([^"']*)["'][^>]*>/gi;
    let am: RegExpExecArray | null;
    while ((am = anchorRegex.exec(html)) !== null) {
      const rawHref = am[1].trim();
      if (
        rawHref &&
        !rawHref.startsWith("#") &&
        !rawHref.startsWith("tel:") &&
        !rawHref.startsWith("mailto:") &&
        !rawHref.startsWith("http")
      ) {
        const resolved = resolveInternalTarget(f.path, rawHref);
        if (resolved && resolved !== normalizePath(f.path) && incomingLinkCounts.has(resolved)) {
          incomingLinkCounts.set(resolved, (incomingLinkCounts.get(resolved) || 0) + 1);
        }
      }
    }
  }

  // Find orphan pages (pages other than index.html with 0 incoming links)
  const orphanPages = allHtmlPaths.filter((p) => p !== "index.html" && (incomingLinkCounts.get(p) || 0) === 0);

  // Build clean navigational catalogue of all site pages for interlinking
  const catalogPages = htmlFiles.map((f) => {
    const slug = normalizePath(f.path);
    const label = slug
      .replace(/\.html$/, "")
      .replace(/^blog\//, "")
      .replace(/-/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return { path: slug, label };
  });

  const updatedFiles = files.map((file) => {
    if (!file.path.toLowerCase().endsWith(".html")) return file;

    let html = typeof file.content === "string" ? file.content : file.content.toString("utf8");
    const currentPath = normalizePath(file.path);
    const isHome = currentPath === "index.html";

    // 1. If this is homepage and orphan pages exist, inject them into homepage footer/catalog
    if (isHome && orphanPages.length > 0) {
      const orphanLinksHtml = orphanPages
        .map((op) => {
          const item = catalogPages.find((c) => c.path === op);
          const name = item?.label || op.replace(/\.html$/, "");
          return `<li><a href="${op}" style="color: #4F46E5; font-weight: 600; text-decoration: underline;">${name}</a></li>`;
        })
        .join("\n");

      const orphanLinkSection = `
<!-- Semantic Silo & Connected Hub Index -->
<section class="section-connected-catalog py-8 bg-slate-50 border-t border-slate-200" style="padding: 2rem 0; background: #F8FAFC; border-top: 1px solid #E2E8F0;">
  <div class="container" style="max-width: 1100px; margin: 0 auto; padding: 0 1rem;">
    <h3 style="font-size: 1.125rem; font-weight: 700; color: #0F172A; margin-bottom: 0.75rem;">
      Featured Services &amp; Communities We Proudly Serve
    </h3>
    <ul style="display: flex; flex-wrap: wrap; gap: 1rem; list-style: none; padding: 0; margin: 0; font-size: 0.875rem;">
      ${orphanLinksHtml}
    </ul>
  </div>
</section>
`;

      if (html.includes("</main>")) {
        html = html.replace("</main>", `${orphanLinkSection}\n</main>`);
      } else if (html.includes("<footer")) {
        html = html.replace("<footer", `${orphanLinkSection}\n<footer`);
      } else {
        html = html.replace("</body>", `${orphanLinkSection}\n</body>`);
      }

      for (const op of orphanPages) {
        changes.push(`[${file.path}] Added incoming internal link to orphan page "${op}".`);
        incomingLinkCounts.set(op, (incomingLinkCounts.get(op) || 0) + 1);
      }
    }

    // 2. In inner pages, ensure rich cross-linking to related services and locations
    const otherPages = catalogPages.filter((p) => p.path !== currentPath);
    if (otherPages.length > 0 && !html.includes("related-services-silo-nav")) {
      const sampleOtherPages = otherPages.slice(0, 8);
      const linksPillsHtml = sampleOtherPages
        .map(
          (p) =>
            `<a href="${p.path}" style="display: inline-block; padding: 0.375rem 0.75rem; background: #ffffff; border: 1px solid #CBD5E1; border-radius: 9999px; font-size: 0.8125rem; font-weight: 500; color: #1E293B; text-decoration: none; transition: all 0.2s;">${p.label}</a>`
        )
        .join(" ");

      const crossLinksNav = `
<!-- Contextual Internal Linking Silo -->
<nav class="related-services-silo-nav" aria-label="Explore Related Services and Service Areas" style="padding: 2rem 0; background: #F1F5F9; border-top: 1px solid #E2E8F0; text-align: center;">
  <div class="container" style="max-width: 1000px; margin: 0 auto; padding: 0 1rem;">
    <div style="font-size: 0.75rem; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.75rem;">
      Related Services &amp; Coverage Across ${meta.city || "the Region"}
    </div>
    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 0.5rem;">
      ${linksPillsHtml}
    </div>
  </div>
</nav>
`;

      if (html.includes("<footer")) {
        html = html.replace("<footer", `${crossLinksNav}\n<footer`);
      } else {
        html = html.replace("</body>", `${crossLinksNav}\n</body>`);
      }

      changes.push(`[${file.path}] Added contextual internal linking block with ${sampleOtherPages.length} cross-silo links.`);
    }

    return { ...file, content: html };
  });

  return { files: updatedFiles, changes };
}

// ---------------------------------------------------------------------------
// 6. THIN PAGE FIX: Improve content depth with local standards & process
// ---------------------------------------------------------------------------

export function fixThinPages(
  files: QualityAuditFile[],
  meta: QualityAuditMeta
): { files: QualityAuditFile[]; changes: string[] } {
  const changes: string[] = [];
  const trade = meta.trade || "Local Service Specialist";
  const city = meta.city || "Local Community";
  const state = meta.state || "";
  const bName = meta.businessName || "Local Specialist";
  const phone = meta.phone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  const updatedFiles = files.map((file) => {
    if (!file.path.toLowerCase().endsWith(".html")) return file;

    let html = typeof file.content === "string" ? file.content : file.content.toString("utf8");
    const cleanText = cleanTextFromHtml(html);
    const wordCount = cleanText ? cleanText.split(/\s+/).filter(Boolean).length : 0;

    // Minimum 200 words required; target 350+ for safe quality margin
    if (wordCount >= 280) {
      return file;
    }

    const pageSlug = file.path.replace(/\.html$/, "").toLowerCase();
    const isHome = pageSlug === "index" || pageSlug === "home";
    const pageTitle = isHome
      ? trade
      : pageSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

    let enrichedSection = "";

    if (pageSlug.includes("water-heater")) {
      enrichedSection = `
<!-- Advanced Water Heater Diagnostics & High-Efficiency Replacements -->
<section class="section-service-depth py-12 bg-slate-50 border-t border-b border-slate-200" style="padding: 3rem 0; background: #F8FAFC; border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0;">
  <div class="container" style="max-width: 1050px; margin: 0 auto; padding: 0 1.25rem;">
    <div style="max-width: 820px; margin: 0 auto; text-align: left;">
      <span style="display: inline-block; padding: 0.25rem 0.75rem; background: #EFF6FF; color: #1D4ED8; border-radius: 9999px; font-size: 0.8125rem; font-weight: 600; margin-bottom: 1rem;">
        🔥 Water Heating Diagnostics &amp; Thermal Safety
      </span>
      <h2 style="font-size: 1.875rem; font-weight: 700; line-height: 1.25; margin-bottom: 1rem; color: #0F172A;">
        Advanced Water Heater Diagnostics &amp; Code Compliance in ${city}
      </h2>
      <p style="font-size: 1rem; line-height: 1.65; color: #475569; margin-bottom: 1.25rem;">
        When domestic hot water pressure diminishes or strange popping noises emerge from your unit, rapid professional evaluation prevents catastrophic tank breaches. In ${city}, freezing seasonal ambient temperatures force heating elements to work under severe strain. Our certified technicians evaluate sacrificial anode rods, gas pilot assemblies, thermal expansion chambers, and temperature-pressure relief valves to ensure optimum safety and long-term energy factor efficiency.
      </p>

      <h3 style="font-size: 1.375rem; font-weight: 700; line-height: 1.3; margin-top: 2rem; margin-bottom: 0.75rem; color: #0F172A;">
        Our Dedicated Hot Water Diagnostic Protocol
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-top: 1.25rem; margin-bottom: 1.5rem;">
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #1D4ED8; margin-bottom: 0.5rem;">1. Pressure &amp; Relief Valve Calibration</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">We verify that your safety T&amp;P relief valve functions under emergency conditions, avoiding excessive hydrostatic pressure buildup.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #1D4ED8; margin-bottom: 0.5rem;">2. Sediment Flush &amp; Anode Inspection</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">Mineral deposits insulate the heating tank floor; we remove calcified sediment to restore fast heat transfer and prevent tank corrosion.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #1D4ED8; margin-bottom: 0.5rem;">3. Gas Burner &amp; Thermostat Testing</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">We measure thermocouple millivolts, flame sensors, and electrical element continuity for seamless thermostat communication.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #1D4ED8; margin-bottom: 0.5rem;">4. Thermal Expansion Chamber Verification</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">Closed-loop water supply systems require functional expansion tanks to absorb thermal expansion and safeguard residential pipes.</p>
        </div>
      </div>

      <div style="background: #EFF6FF; border-left: 4px solid #1D4ED8; padding: 1rem 1.25rem; border-radius: 0 8px 8px 0; margin-top: 1.5rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;">
        <div>
          <p style="margin: 0; font-size: 0.9375rem; color: #1E3A8A; font-weight: 600;">Experiencing erratic hot water or leaks in ${city}?</p>
          <p style="margin: 0; font-size: 0.8125rem; color: #2563EB;">Our fully stocked vans carry universal elements, gas valves, and relief hardware.</p>
        </div>
        <a href="tel:${cleanPhone}" style="display: inline-block; padding: 0.625rem 1.25rem; background: #1D4ED8; color: #ffffff; font-weight: 700; font-size: 0.875rem; border-radius: 8px; text-decoration: none;">
          Call ${phone}
        </a>
      </div>
    </div>
  </div>
</section>
`;
    } else if (pageSlug.includes("drain")) {
      enrichedSection = `
<!-- Root Intrusion Clearing & Commercial-Grade Hydro-Jetting -->
<section class="section-service-depth py-12 bg-slate-50 border-t border-b border-slate-200" style="padding: 3rem 0; background: #F8FAFC; border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0;">
  <div class="container" style="max-width: 1050px; margin: 0 auto; padding: 0 1.25rem;">
    <div style="max-width: 820px; margin: 0 auto; text-align: left;">
      <span style="display: inline-block; padding: 0.25rem 0.75rem; background: #ECFDF5; color: #047857; border-radius: 9999px; font-size: 0.8125rem; font-weight: 600; margin-bottom: 1rem;">
        🌿 Hydro-Jetting &amp; Sewer Scope Diagnostics
      </span>
      <h2 style="font-size: 1.875rem; font-weight: 700; line-height: 1.25; margin-bottom: 1rem; color: #0F172A;">
        Precision Drain Scouring &amp; Video Pipe Camera Diagnostics in ${city}
      </h2>
      <p style="font-size: 1rem; line-height: 1.65; color: #475569; margin-bottom: 1.25rem;">
        Slow sink drains, gurgling toilets, and recurrent floor drain backups point toward structural buildup inside underground waste laterals. In older ${city} properties, mature tree root tendrils enter through joint seams, while accumulated cooking grease and scale choke wastewater velocity. Our drain specialists combine high-definition fiber-optic sewer cameras with 4,000 PSI hydro-jetting to strip pipes down to bare metal without damaging aging infrastructure.
      </p>

      <h3 style="font-size: 1.375rem; font-weight: 700; line-height: 1.3; margin-top: 2rem; margin-bottom: 0.75rem; color: #0F172A;">
        Our Systematic Mainline Restoration Process
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-top: 1.25rem; margin-bottom: 1.5rem;">
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #047857; margin-bottom: 0.5rem;">1. Optical Color Camera Scoping</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">We navigate self-leveling HD cameras into the cleanout to pinpoint the exact distance, depth, and nature of the obstruction.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #047857; margin-bottom: 0.5rem;">2. Heavy-Duty Mechanical Snaking</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">For immediate emergency relief, rotating steel root-cutting heads punch an opening through dense roots and solid debris.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #047857; margin-bottom: 0.5rem;">3. High-Velocity Hydro-Jetting</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">Specialized backward-facing water nozzles flush out grease, scale, and pulverized root debris all the way to the municipal sewer line.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #047857; margin-bottom: 0.5rem;">4. Final Quality Scope Recording</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">We re-insert our camera to document 100% pipe restoration and supply you with digital video evidence for total peace of mind.</p>
        </div>
      </div>

      <div style="background: #ECFDF5; border-left: 4px solid #047857; padding: 1rem 1.25rem; border-radius: 0 8px 8px 0; margin-top: 1.5rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;">
        <div>
          <p style="margin: 0; font-size: 0.9375rem; color: #064E3B; font-weight: 600;">Sewer backup or slow drain emergency in ${city}?</p>
          <p style="margin: 0; font-size: 0.8125rem; color: #059669;">Same-day rooter dispatch available across all local zip codes.</p>
        </div>
        <a href="tel:${cleanPhone}" style="display: inline-block; padding: 0.625rem 1.25rem; background: #047857; color: #ffffff; font-weight: 700; font-size: 0.875rem; border-radius: 8px; text-decoration: none;">
          Call ${phone}
        </a>
      </div>
    </div>
  </div>
</section>
`;
    } else if (pageSlug.includes("contact")) {
      enrichedSection = `
<!-- Emergency Dispatch Protocols & Rapid Response Fleet -->
<section class="section-service-depth py-12 bg-slate-50 border-t border-b border-slate-200" style="padding: 3rem 0; background: #F8FAFC; border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0;">
  <div class="container" style="max-width: 1050px; margin: 0 auto; padding: 0 1.25rem;">
    <div style="max-width: 820px; margin: 0 auto; text-align: left;">
      <span style="display: inline-block; padding: 0.25rem 0.75rem; background: #FEF3C7; color: #B45309; border-radius: 9999px; font-size: 0.8125rem; font-weight: 600; margin-bottom: 1rem;">
        ⏱️ 24/7 Mobile Dispatch Network
      </span>
      <h2 style="font-size: 1.875rem; font-weight: 700; line-height: 1.25; margin-bottom: 1rem; color: #0F172A;">
        Direct Communication &amp; Emergency Scheduling Protocol in ${city}
      </h2>
      <p style="font-size: 1rem; line-height: 1.65; color: #475569; margin-bottom: 1.25rem;">
        When a burst pipe floods a basement or a critical gas line smells of odorant, every minute matters. Our customer support center in ${city} operates round-the-clock without automated runarounds. We immediately route your call to an active regional master plumber who provides real-time containment guidance over the phone while dispatching our nearest service vehicle.
      </p>

      <h3 style="font-size: 1.375rem; font-weight: 700; line-height: 1.3; margin-top: 2rem; margin-bottom: 0.75rem; color: #0F172A;">
        What to Expect When You Contact Our Team
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-top: 1.25rem; margin-bottom: 1.5rem;">
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #B45309; margin-bottom: 0.5rem;">1. Live Emergency Intake</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">You speak with a knowledgeable specialist who logs symptom severity and confirms property location within seconds.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #B45309; margin-bottom: 0.5rem;">2. Main Shutoff Advisory</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">We walk you through isolating your water main or electrical breaker to eliminate secondary drywall and flooring damage.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #B45309; margin-bottom: 0.5rem;">3. GPS-Tracked Vehicle Transit</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">You receive real-time SMS arrival tracking with the technician's name and photo for maximum household security.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #B45309; margin-bottom: 0.5rem;">4. Clear Upfront Guarantee</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">All diagnostic findings and repair prices are approved in writing before our tools make contact with your property.</p>
        </div>
      </div>

      <div style="background: #FEF3C7; border-left: 4px solid #B45309; padding: 1rem 1.25rem; border-radius: 0 8px 8px 0; margin-top: 1.5rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;">
        <div>
          <p style="margin: 0; font-size: 0.9375rem; color: #78350F; font-weight: 600;">Require urgent technician dispatch in ${city}?</p>
          <p style="margin: 0; font-size: 0.8125rem; color: #92400E;">Our lines are open 24/7/365 with zero overtime holiday premiums.</p>
        </div>
        <a href="tel:${cleanPhone}" style="display: inline-block; padding: 0.625rem 1.25rem; background: #B45309; color: #ffffff; font-weight: 700; font-size: 0.875rem; border-radius: 8px; text-decoration: none;">
          Call ${phone}
        </a>
      </div>
    </div>
  </div>
</section>
`;
    } else if (pageSlug.includes("isolated") || pageSlug.includes("specialty")) {
      enrichedSection = `
<!-- Architectural Fixture Restoration & Specialty Valve Machining -->
<section class="section-service-depth py-12 bg-slate-50 border-t border-b border-slate-200" style="padding: 3rem 0; background: #F8FAFC; border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0;">
  <div class="container" style="max-width: 1050px; margin: 0 auto; padding: 0 1.25rem;">
    <div style="max-width: 820px; margin: 0 auto; text-align: left;">
      <span style="display: inline-block; padding: 0.25rem 0.75rem; background: #F3E8FF; color: #7E22CE; border-radius: 9999px; font-size: 0.8125rem; font-weight: 600; margin-bottom: 1rem;">
        🏛️ Heritage Fixtures &amp; Custom Valve Engineering
      </span>
      <h2 style="font-size: 1.875rem; font-weight: 700; line-height: 1.25; margin-bottom: 1rem; color: #0F172A;">
        Architectural Plumbing Craftsmanship &amp; Custom Valve Restoration in ${city}
      </h2>
      <p style="font-size: 1rem; line-height: 1.65; color: #475569; margin-bottom: 1.25rem;">
        Historic residences, custom luxury estates, and boutique commercial venues across ${city} frequently incorporate vintage brass valves, imported designer fittings, and obsolete pipe threads that modern modular supply houses cannot replace. Rather than tearing open decorative tiling or replacing irreplaceable antique fixtures, our master craftsmen rebuild worn internal valve stems, re-cut valve seats, and cast custom lead-free components to preserve original architectural elegance.
      </p>

      <h3 style="font-size: 1.375rem; font-weight: 700; line-height: 1.3; margin-top: 2rem; margin-bottom: 0.75rem; color: #0F172A;">
        Our Specialized Heritage Restoration Workflow
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-top: 1.25rem; margin-bottom: 1.5rem;">
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #7E22CE; margin-bottom: 0.5rem;">1. Micro-Tolerance Inspection</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">We measure pitch, threading, and brass wear with digital calipers to determine exact refurbishment tolerances.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #7E22CE; margin-bottom: 0.5rem;">2. Custom Seat Dressing &amp; Lapping</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">Scored and pitted brass valve seats are precision-ground in place to achieve a watertight seal without fixture removal.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #7E22CE; margin-bottom: 0.5rem;">3. High-Grade Food-Safe Elastomers</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">We replace brittle packing with modern EPDM and silicone O-rings engineered for chemical and thermal longevity.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #7E22CE; margin-bottom: 0.5rem;">4. Hydrostatic Pressure Testing</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">Rebuilt valves undergo 120 PSI static pressure holds to ensure leak-free operation exceeding municipal requirements.</p>
        </div>
      </div>

      <div style="background: #F3E8FF; border-left: 4px solid #7E22CE; padding: 1rem 1.25rem; border-radius: 0 8px 8px 0; margin-top: 1.5rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;">
        <div>
          <p style="margin: 0; font-size: 0.9375rem; color: #581C87; font-weight: 600;">Preserving vintage architectural plumbing in ${city}?</p>
          <p style="margin: 0; font-size: 0.8125rem; color: #6B21A8;">Consult with our specialist fabricators for non-destructive restoration options.</p>
        </div>
        <a href="tel:${cleanPhone}" style="display: inline-block; padding: 0.625rem 1.25rem; background: #7E22CE; color: #ffffff; font-weight: 700; font-size: 0.875rem; border-radius: 8px; text-decoration: none;">
          Call ${phone}
        </a>
      </div>
    </div>
  </div>
</section>
`;
    } else {
      // General Homepage or standard Service Landing Page
      enrichedSection = `
<!-- Full-Scope Plumbing Operations & Quality Craftsmanship -->
<section class="section-service-depth py-12 bg-slate-50 border-t border-b border-slate-200" style="padding: 3rem 0; background: #F8FAFC; border-top: 1px solid #E2E8F0; border-bottom: 1px solid #E2E8F0;">
  <div class="container" style="max-width: 1050px; margin: 0 auto; padding: 0 1.25rem;">
    <div style="max-width: 820px; margin: 0 auto; text-align: left;">
      <span style="display: inline-block; padding: 0.25rem 0.75rem; background: #EEF2FF; color: #4F46E5; border-radius: 9999px; font-size: 0.8125rem; font-weight: 600; margin-bottom: 1rem;">
        📍 Professional Service Standards in ${city}${state ? `, ${state}` : ""}
      </span>
      <h2 style="font-size: 1.875rem; font-weight: 700; line-height: 1.25; margin-bottom: 1rem; color: #0F172A;">
        Comprehensive ${pageTitle} Guidelines &amp; Quality Execution
      </h2>
      <p style="font-size: 1rem; line-height: 1.65; color: #475569; margin-bottom: 1.25rem;">
        Maintaining dependable property infrastructure across ${city} requires certified professionals who thoroughly understand local climate patterns, municipal plumbing and building codes, and safety compliance. Our experienced ${trade.toLowerCase()} specialists from ${bName} perform extensive on-site evaluations before commencing any service work. We combine precision diagnostic instrumentation with upfront flat-rate pricing so you always know exactly what to expect.
      </p>

      <h3 style="font-size: 1.375rem; font-weight: 700; line-height: 1.3; margin-top: 2rem; margin-bottom: 0.75rem; color: #0F172A;">
        Our Four-Stage Precision Service Workflow
      </h3>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; margin-top: 1.25rem; margin-bottom: 1.5rem;">
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #4F46E5; margin-bottom: 0.5rem;">1. Non-Invasive Diagnostics</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">Our mobile dispatch arrives fully equipped with advanced testing tools to isolate underlying issues accurately without unnecessary disruption.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #4F46E5; margin-bottom: 0.5rem;">2. Transparent Written Estimate</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">You receive a complete written quote detailing recommended repairs, energy-efficient equipment options, and timelines before any physical work starts.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #4F46E5; margin-bottom: 0.5rem;">3. Code-Compliant Craftsmanship</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">Every component is installed and tested strictly according to regional safety standards, manufacturer guidelines, and durable building practices.</p>
        </div>
        <div style="background: #ffffff; padding: 1.25rem; border-radius: 12px; border: 1px solid #E2E8F0; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="font-weight: 700; font-size: 0.9375rem; color: #4F46E5; margin-bottom: 0.5rem;">4. Final Testing &amp; Workmanship Guarantee</div>
          <p style="font-size: 0.875rem; color: #64748B; margin: 0; line-height: 1.5;">We conduct thorough final pressure tests, operational calibrations, and cleanup. All completed work is backed by our full warranty.</p>
        </div>
      </div>

      <div style="background: #EEF2FF; border-left: 4px solid #4F46E5; padding: 1rem 1.25rem; border-radius: 0 8px 8px 0; margin-top: 1.5rem; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1rem;">
        <div>
          <p style="margin: 0; font-size: 0.9375rem; color: #1E1B4B; font-weight: 600;">
            Ready to schedule expert ${pageTitle.toLowerCase()} in ${city}?
          </p>
          <p style="margin: 0; font-size: 0.8125rem; color: #4338CA;">
            Our certified service coordinators are standing by for prompt scheduling.
          </p>
        </div>
        <a href="tel:${cleanPhone}" style="display: inline-block; padding: 0.625rem 1.25rem; background: #4F46E5; color: #ffffff; font-weight: 700; font-size: 0.875rem; border-radius: 8px; text-decoration: none; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
          Call ${phone}
        </a>
      </div>
    </div>
  </div>
</section>
`;
    }

    if (html.includes("</main>")) {
      html = html.replace("</main>", `${enrichedSection}\n</main>`);
    } else if (html.includes("<footer")) {
      html = html.replace("<footer", `${enrichedSection}\n<footer`);
    } else {
      html = html.replace("</body>", `${enrichedSection}\n</body>`);
    }

    const wordsAdded = cleanTextFromHtml(enrichedSection).split(/\s+/).filter(Boolean).length;
    changes.push(
      `[${file.path}] Improved content depth (+${wordsAdded} words, was ${wordCount} words) with regional procedures, workflow steps, and H2 structure.`
    );

    return { ...file, content: html };
  });

  return { files: updatedFiles, changes };
}

// ---------------------------------------------------------------------------
// 7. SECONDARY TECHNICAL & SEO FIXES (Phone links, dead CTAs, canonicals, sitemaps)
// ---------------------------------------------------------------------------

export function fixSecondaryTechnicalSeo(
  files: QualityAuditFile[],
  meta: QualityAuditMeta
): { files: QualityAuditFile[]; changes: string[] } {
  const changes: string[] = [];
  const domain = (meta.domain || "example.com").replace(/^https?:\/\//, "").replace(/\/+$/, "");
  const phone = meta.phone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const contactHref = files.some((f) => f.path.toLowerCase().includes("contact.html")) ? "contact.html" : "index.html#contact";

  const updatedFiles = files.map((file) => {
    if (!file.path.toLowerCase().endsWith(".html")) return file;

    let html = typeof file.content === "string" ? file.content : file.content.toString("utf8");
    const pageSlug = file.path.replace(/\.html$/, "").toLowerCase();
    const isHome = pageSlug === "index" || pageSlug === "home";

    // A. Fix dead CTA buttons (href="#" -> tel or contact)
    html = html.replace(/<a\b([^>]*?)>/gi, (fullTag, attrs) => {
      const isCtaButton =
        /\bclass=["'][^"']*\b(btn|cta|button|call-now|phone-btn|hero-btn)\b/i.test(attrs) ||
        /\bdata-cta\b/i.test(attrs);

      if (isCtaButton) {
        const hrefMatch = attrs.match(/\bhref=["']([^"']*)["']/i);
        const href = hrefMatch ? hrefMatch[1].trim() : "";
        if (!href || href === "#" || href.startsWith("javascript:")) {
          const newHref = attrs.toLowerCase().includes("call") || attrs.toLowerCase().includes("phone")
            ? `tel:${cleanPhone}`
            : contactHref;
          const newAttrs = hrefMatch
            ? attrs.replace(/\bhref=["'][^"']*["']/i, `href="${newHref}"`)
            : `${attrs} href="${newHref}"`;
          changes.push(`[${file.path}] Repaired dead CTA button href="#" -> href="${newHref}".`);
          return `<a ${newAttrs}>`;
        }
      }
      return fullTag;
    });

    // B. Fix unclickable phone numbers
    if (cleanPhone.length >= 7 && html.includes(phone) && !html.includes(`href="tel:${cleanPhone}"`)) {
      // Safely replace non-linked occurrences of phone string
      const escapedPhone = phone.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const phoneRegex = new RegExp(`(?<!href=["']tel:[^"']*>)(?<!<a[^>]*>)(${escapedPhone})(?!<\\/a>)`, "g");
      if (phoneRegex.test(html)) {
        html = html.replace(phoneRegex, `<a href="tel:${cleanPhone}" class="tel-link font-semibold hover:underline">${phone}</a>`);
        changes.push(`[${file.path}] Formatted plain phone number text as clickable tel: link.`);
      }
    }

    // C. Ensure canonical tag
    const expectedCanonical = isHome ? `https://${domain}/` : `https://${domain}/${file.path}`;
    if (!/<link[^>]*?rel=["']canonical["'][^>]*?>/i.test(html)) {
      if (/<head>/i.test(html)) {
        html = html.replace(/<head>/i, `<head>\n  <link rel="canonical" href="${expectedCanonical}">`);
        changes.push(`[${file.path}] Added missing canonical tag: ${expectedCanonical}.`);
      }
    }

    // D. Ensure valid DOCTYPE, lang, viewport, charset
    if (!/<!doctype\s+html>/i.test(html)) {
      html = `<!DOCTYPE html>\n${html}`;
    }
    if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) {
      html = html.replace(/<html\b([^>]*)>/i, `<html$1 lang="en">`);
    }
    if (!/<meta[^>]*?name=["']viewport["'][^>]*?>/i.test(html) && /<head>/i.test(html)) {
      html = html.replace(/<head>/i, `<head>\n  <meta name="viewport" content="width=device-width, initial-scale=1.0">`);
    }
    if (!/<meta[^>]*?charset=["'][^"']+["']/i.test(html) && !/<meta\s+charset=[^>]+>/i.test(html) && /<head>/i.test(html)) {
      html = html.replace(/<head>/i, `<head>\n  <meta charset="utf-8">`);
    }

    // E. Ensure valid Schema.org JSON-LD
    if (!/<script\s+type=["']application\/ld\+json["']/i.test(html)) {
      const schemaType = isHome
        ? "LocalBusiness"
        : pageSlug.includes("contact")
        ? "ContactPage"
        : pageSlug.includes("about")
        ? "AboutPage"
        : "Service";

      const schemaObj = {
        "@context": "https://schema.org",
        "@type": schemaType,
        name: isHome
          ? meta.businessName || "Local Specialist"
          : `${pageSlug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} | ${meta.businessName || "Local Specialist"}`,
        description: `Professional ${meta.trade || "contractor"} services in ${meta.city || "Local Community"}, ${meta.state || ""}.`,
        url: expectedCanonical,
        telephone: meta.phone || "(555) 123-4567",
        address: {
          "@type": "PostalAddress",
          addressLocality: meta.city || "Local",
          addressRegion: meta.state || "IL",
        },
      };

      const schemaScript = `  <script type="application/ld+json">\n${JSON.stringify(schemaObj, null, 2)}\n  </script>`;
      if (/<head>/i.test(html)) {
        html = html.replace(/<head>/i, `<head>\n${schemaScript}`);
        changes.push(`[${file.path}] Added missing Schema.org ${schemaType} JSON-LD structured data.`);
      }
    }

    return { ...file, content: html };
  });

  // E. Ensure valid sitemap.xml exists and indexes all HTML pages
  const htmlPages = updatedFiles.filter((f) => f.path.toLowerCase().endsWith(".html"));
  const existingSitemap = updatedFiles.find((f) => f.path.toLowerCase() === "sitemap.xml");

  if (htmlPages.length > 0) {
    const sitemapUrls = htmlPages
      .map((p) => {
        const loc = p.path === "index.html" ? `https://${domain}/` : `https://${domain}/${p.path}`;
        const prio = p.path === "index.html" ? "1.0" : "0.8";
        return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>weekly</changefreq>\n    <priority>${prio}</priority>\n  </url>`;
      })
      .join("\n");

    const freshSitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapUrls}\n</urlset>`;

    if (!existingSitemap) {
      updatedFiles.push({
        path: "sitemap.xml",
        content: freshSitemapContent,
        mimeType: "application/xml",
      });
      changes.push(`Generated sitemap.xml indexing all ${htmlPages.length} HTML pages.`);
    } else {
      const idx = updatedFiles.findIndex((f) => f.path.toLowerCase() === "sitemap.xml");
      updatedFiles[idx] = {
        ...existingSitemap,
        content: freshSitemapContent,
      };
    }
  }

  // F. Ensure valid robots.txt exists
  const existingRobots = updatedFiles.find((f) => f.path.toLowerCase() === "robots.txt");
  const freshRobotsContent = `User-agent: *\nAllow: /\n\nSitemap: https://${domain}/sitemap.xml\n`;
  if (!existingRobots) {
    updatedFiles.push({
      path: "robots.txt",
      content: freshRobotsContent,
      mimeType: "text/plain",
    });
    changes.push("Generated robots.txt with User-agent: * and Sitemap reference.");
  }

  return { files: updatedFiles, changes };
}

// ---------------------------------------------------------------------------
// MASTER AUTO-FIX ENGINE
// ---------------------------------------------------------------------------

export class QualityAutoFixEngine {
  /**
   * Executes "FIX ALL ISSUES" with strict pre- and post-audit verification.
   * Resolves:
   * 1. Duplicate image -> select replacement
   * 2. Missing alt -> generate alt
   * 3. Duplicate title -> regenerate
   * 4. Broken internal link -> select valid destination
   * 5. Weak internal linking -> add valid links
   * 6. Thin page -> improve content
   * (Plus secondary technical SEO, phone links, and CTAs)
   */
  public static fixAllIssues(
    files: QualityAuditFile[],
    meta: QualityAuditMeta,
    options?: QualityAutoFixOptions
  ): QualityAutoFixResult {
    // -----------------------------------------------------------------------
    // STEP 1: RUN PRE-FIX AUDIT
    // -----------------------------------------------------------------------
    options?.onProgress?.("Running pre-fix website quality audit...", 1, 8);
    const auditBefore = QualityAuditEngine.audit(files, meta);
    const scoreBefore = auditBefore.overallScore;

    let workingFiles = [...files];
    const allAppliedChanges: string[] = [];

    // -----------------------------------------------------------------------
    // STEP 2: APPLY SAFE FIXES
    // -----------------------------------------------------------------------

    // 1. Duplicate image -> select replacement
    options?.onProgress?.("Resolving duplicate images & selecting unique photos...", 2, 8);
    const resDupImgs = fixDuplicateImages(workingFiles, meta);
    workingFiles = resDupImgs.files;
    allAppliedChanges.push(...resDupImgs.changes);

    // 2. Missing alt -> generate alt
    options?.onProgress?.("Generating descriptive alt text for all images...", 3, 8);
    const resAlts = fixMissingAlts(workingFiles, meta);
    workingFiles = resAlts.files;
    allAppliedChanges.push(...resAlts.changes);

    // 3. Duplicate title -> regenerate
    options?.onProgress?.("Regenerating unique, localized SEO page titles...", 4, 8);
    const resTitles = fixDuplicateTitles(workingFiles, meta);
    workingFiles = resTitles.files;
    allAppliedChanges.push(...resTitles.changes);

    // 4. Broken internal link -> select valid destination
    options?.onProgress?.("Repairing broken internal links & mapping to valid pages...", 5, 8);
    const resBrokenLinks = fixBrokenInternalLinks(workingFiles, meta);
    workingFiles = resBrokenLinks.files;
    allAppliedChanges.push(...resBrokenLinks.changes);

    // 5. Weak internal linking -> add valid links & eliminate orphan pages
    options?.onProgress?.("Connecting internal link graph & eliminating orphan pages...", 6, 8);
    const resWeakLinks = fixWeakInternalLinking(workingFiles, meta);
    workingFiles = resWeakLinks.files;
    allAppliedChanges.push(...resWeakLinks.changes);

    // 6. Thin page -> improve content
    options?.onProgress?.("Enriching thin pages with localized standards & process steps...", 7, 8);
    const resThinPages = fixThinPages(workingFiles, meta);
    workingFiles = resThinPages.files;
    allAppliedChanges.push(...resThinPages.changes);

    // 7. Secondary Technical & SEO Fixes
    const resSecondary = fixSecondaryTechnicalSeo(workingFiles, meta);
    workingFiles = resSecondary.files;
    allAppliedChanges.push(...resSecondary.changes);

    // -----------------------------------------------------------------------
    // STEP 3: RUN AUDIT AGAIN (POST-FIX AUDIT)
    // "After fixing: RUN AUDIT AGAIN. Do not mark an issue fixed until the audit confirms it."
    // -----------------------------------------------------------------------
    options?.onProgress?.("Running post-fix audit to confirm resolution...", 8, 8);
    const auditAfter = QualityAuditEngine.audit(workingFiles, meta);
    const finalScore = auditAfter.overallScore;

    // -----------------------------------------------------------------------
    // STEP 4: VERIFY RESOLUTION DETERMINISTICALLY
    // -----------------------------------------------------------------------
    const issuesBefore = [...auditBefore.issues];
    const issuesRemaining = [...auditAfter.issues];

    // Helper to count issues by check key
    const countIssuesByCheck = (detailed: typeof auditBefore.detailedIssues): Map<string, number> => {
      const map = new Map<string, number>();
      for (const item of detailed) {
        let key = item.check;
        if (key === "Duplicate images") key = "duplicate image";
        else if (key === "Missing alt text") key = "missing alt attribute";
        else if (key === "Duplicate titles") key = "duplicate title";
        else if (key === "Broken links") key = "broken internal link";
        else if (key === "Orphan pages") key = "orphan page";
        else if (key === "Thin pages") key = "thin page";
        else if (key === "CTA links") key = "dead CTA link";
        else if (key === "Phone links") key = "unclickable phone link";
        else key = item.check.toLowerCase();

        map.set(key, (map.get(key) || 0) + 1);
      }
      return map;
    };

    const beforeMap = countIssuesByCheck(auditBefore.detailedIssues);
    const afterMap = countIssuesByCheck(auditAfter.detailedIssues);

    const issuesFixed: string[] = [];

    // Check each issue type from before
    for (const [key, countBefore] of beforeMap.entries()) {
      const countAfter = afterMap.get(key) || 0;
      const resolvedCount = Math.max(0, countBefore - countAfter);

      if (resolvedCount > 0) {
        const pluralBefore = resolvedCount === 1 ? key : `${key}s`;
        if (countAfter === 0) {
          issuesFixed.push(`${resolvedCount} ${pluralBefore}`);
        } else {
          issuesFixed.push(`${resolvedCount} of ${countBefore} ${pluralBefore} (partially resolved)`);
        }
      }
    }

    // If no specific counts were resolved but overall score improved, note it
    if (issuesFixed.length === 0 && finalScore > scoreBefore) {
      issuesFixed.push(`Quality score increased by +${finalScore - scoreBefore} points.`);
    }

    // -----------------------------------------------------------------------
    // STEP 5: BUILD STRUCTURED OUTPUT REPORT
    // -----------------------------------------------------------------------
    const reportLines = [
      "================================================================================",
      "                           WEBSITE QUALITY AUTO-FIX REPORT                      ",
      "================================================================================",
      "Issues Before:",
      ...(issuesBefore.length > 0 ? issuesBefore.map((i) => `- ${i}`) : ["- None (0 issues detected)"]),
      "",
      "Issues Fixed:",
      ...(issuesFixed.length > 0 ? issuesFixed.map((i) => `- ${i}`) : ["- None (no issues resolved)"]),
      "",
      "Issues Remaining:",
      ...(issuesRemaining.length > 0 ? issuesRemaining.map((i) => `- ${i}`) : ["- None (0 issues remaining)"]),
      "",
      `Final Score: ${finalScore}/100 (was ${scoreBefore}/100, +${Math.max(0, finalScore - scoreBefore)} pts)`,
      "================================================================================",
    ];
    const reportText = reportLines.join("\n");

    return {
      fixedFiles: workingFiles,
      issuesBefore,
      issuesFixed,
      issuesRemaining,
      finalScore,
      scoreBefore,
      scoreDelta: finalScore - scoreBefore,
      auditBefore,
      auditAfter,
      reportText,
    };
  }
}
