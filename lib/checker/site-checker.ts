import fs from "fs";
import path from "path";
import http from "http";
import { chromium, Browser, BrowserContext } from "playwright";

export interface SiteFile {
  path: string;
  content: string | Buffer;
  mimeType?: string | null;
}

export type IssueSeverity = "critical" | "warning";
export type IssueCategory =
  | "text"
  | "links"
  | "assets"
  | "images"
  | "menu"
  | "structure"
  | "layout"
  | "console";

export interface SiteIssue {
  page: string;
  severity: IssueSeverity;
  category: IssueCategory;
  message: string;
  details?: string;
  snippet?: string;
}

export interface PageLayoutResult {
  width: number;
  hasHorizontalScroll: boolean;
  scrollWidth: number;
  viewportWidth: number;
  overflowElements: Array<{
    selector: string;
    tagName: string;
    className: string;
    width: number;
    right: number;
  }>;
  overlappingElements: Array<{
    elementA: string;
    elementB: string;
    overlapArea: number;
  }>;
  screenshotPath?: string;
}

export interface PageReport {
  page: string;
  issues: SiteIssue[];
  criticalCount: number;
  warningCount: number;
  layoutResults: PageLayoutResult[];
  consoleErrors: string[];
}

export interface SiteCheckerResult {
  siteId: string;
  siteName: string;
  timestamp: string;
  totalIssues: number;
  criticalCount: number;
  warningCount: number;
  pagesChecked: number;
  orphanPages: string[];
  pageReports: PageReport[];
  globalIssues: SiteIssue[];
  screenshotsDir?: string;
}

export interface CheckerOptions {
  siteId: string;
  siteName: string;
  outputDir?: string;
  runPlaywright?: boolean;
  saveScreenshots?: boolean;
  port?: number;
}

const VIEWPORT_WIDTHS = [390, 768, 1280, 1440];

/**
 * Normalizes relative paths within the website directory structure
 */
function resolveRelativePath(fromPage: string, toTarget: string): string {
  if (toTarget.startsWith("/")) {
    return toTarget.replace(/^\/+/, "");
  }
  const fromDir = path.posix.dirname(fromPage);
  if (fromDir === "." || fromDir === "") {
    return path.posix.normalize(toTarget);
  }
  return path.posix.normalize(path.posix.join(fromDir, toTarget));
}

/**
 * Extracts all attributes matching regex from HTML tags
 */
function extractMatches(html: string, regex: RegExp): RegExpExecArray[] {
  const matches: RegExpExecArray[] = [];
  let m: RegExpExecArray | null;
  while ((m = regex.exec(html)) !== null) {
    matches.push(m);
  }
  return matches;
}

/**
 * Checks for static HTML text problems, links, assets, images, menu, and structure
 */
export function checkStaticPage(
  pageFile: SiteFile,
  allFiles: SiteFile[],
  allHtmlPages: string[]
): { issues: SiteIssue[]; navItems: Array<{ label: string; href: string }> } {
  const issues: SiteIssue[] = [];
  const pagePath = pageFile.path;
  const html = typeof pageFile.content === "string" ? pageFile.content : pageFile.content.toString("utf8");

  // -------------------------------------------------------------
  // 1. TEXT PROBLEMS
  // visible text or attribute containing "undefined", "null", "NaN", "[object Object]", "{{", "}}", "lorem ipsum",
  // or empty headings, buttons, or links
  // -------------------------------------------------------------
  const FORBIDDEN_TEXT_TOKENS = [
    { token: "undefined", severity: "critical" as IssueSeverity, category: "text" as IssueCategory },
    { token: "NaN", severity: "critical" as IssueSeverity, category: "text" as IssueCategory },
    { token: "[object Object]", severity: "critical" as IssueSeverity, category: "text" as IssueCategory },
    { token: "{{", severity: "critical" as IssueSeverity, category: "text" as IssueCategory },
    { token: "}}", severity: "critical" as IssueSeverity, category: "text" as IssueCategory },
    { token: "lorem ipsum", severity: "warning" as IssueSeverity, category: "text" as IssueCategory },
  ];

  // Strip script and style blocks before checking visible text
  const cleanBodyHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

  for (const item of FORBIDDEN_TEXT_TOKENS) {
    const regex = new RegExp(`\\b${item.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    if (item.token === "{{" || item.token === "}}" || item.token === "[object Object]") {
      if (cleanBodyHtml.includes(item.token)) {
        const line = cleanBodyHtml.split("\n").find((l) => l.includes(item.token))?.trim() || item.token;
        issues.push({
          page: pagePath,
          severity: item.severity,
          category: item.category,
          message: `Forbidden text found: "${item.token}" leaks into rendered page markup.`,
          snippet: line.slice(0, 140),
        });
      }
    } else if (regex.test(cleanBodyHtml)) {
      const line = cleanBodyHtml.split("\n").find((l) => regex.test(l))?.trim() || item.token;
      issues.push({
        page: pagePath,
        severity: item.severity,
        category: item.category,
        message: `Forbidden text token found: "${item.token}" in page content or attributes.`,
        snippet: line.slice(0, 140),
      });
    }
  }

  // Null check: specific checks for "null" attribute values or text like "null, TX"
  const nullAttrRegex = /(?:class|id|href|src|alt|title|placeholder)=["'](?:null|undefined)["']/gi;
  let nullAttrMatch: RegExpExecArray | null;
  while ((nullAttrMatch = nullAttrRegex.exec(cleanBodyHtml)) !== null) {
    issues.push({
      page: pagePath,
      severity: "critical",
      category: "text",
      message: `Attribute set to "${nullAttrMatch[0]}" on element.`,
      snippet: nullAttrMatch[0],
    });
  }

  const nullTextRegex = />\s*(null|undefined)\s*</gi;
  let nullTextMatch: RegExpExecArray | null;
  while ((nullTextMatch = nullTextRegex.exec(cleanBodyHtml)) !== null) {
    issues.push({
      page: pagePath,
      severity: "critical",
      category: "text",
      message: `Empty/null text node: found "${nullTextMatch[1]}" inside element tag.`,
      snippet: nullTextMatch[0],
    });
  }

  // Empty headings: <h1> to <h6> with no visible text content
  const headingRegex = /<(h[1-6])\b[^>]*>([\s\S]*?)<\/\1>/gi;
  let headingMatch: RegExpExecArray | null;
  while ((headingMatch = headingRegex.exec(cleanBodyHtml)) !== null) {
    const tag = headingMatch[1].toUpperCase();
    const inner = headingMatch[2].replace(/<[^>]+>/g, "").trim();
    if (!inner) {
      issues.push({
        page: pagePath,
        severity: "warning",
        category: "text",
        message: `Empty heading: <${tag}> tag contains no text content.`,
        snippet: headingMatch[0].slice(0, 100),
      });
    }
  }

  // Empty buttons: <button> with no text and no img/svg
  const buttonRegex = /<button\b[^>]*>([\s\S]*?)<\/button>/gi;
  let buttonMatch: RegExpExecArray | null;
  while ((buttonMatch = buttonRegex.exec(cleanBodyHtml)) !== null) {
    const inner = buttonMatch[1];
    const textOnly = inner.replace(/<[^>]+>/g, "").trim();
    const hasIconOrMedia = /<(svg|img|i|span)\b/i.test(inner);
    const hasAria = /aria-label=["'][^"']+["']/i.test(buttonMatch[0]);
    if (!textOnly && !hasIconOrMedia && !hasAria) {
      issues.push({
        page: pagePath,
        severity: "warning",
        category: "text",
        message: `Empty button: <button> has no text, icon, or aria-label.`,
        snippet: buttonMatch[0].slice(0, 100),
      });
    }
  }

  // Empty links: <a ...> with no text, no icon, and no child
  const linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let linkMatch: RegExpExecArray | null;
  while ((linkMatch = linkRegex.exec(cleanBodyHtml)) !== null) {
    const rawAttrs = linkMatch[1];
    const inner = linkMatch[2];
    const textOnly = inner.replace(/<[^>]+>/g, "").trim();
    const hasMedia = /<(svg|img|i|span)\b/i.test(inner);
    const hrefMatch = /href=["']([^"']*)["']/i.exec(rawAttrs);
    const hrefVal = hrefMatch ? hrefMatch[1].trim() : "";

    if (!textOnly && !hasMedia) {
      issues.push({
        page: pagePath,
        severity: "warning",
        category: "text",
        message: `Empty link: <a> has no text or child icon. (href="${hrefVal}")`,
        snippet: linkMatch[0].slice(0, 100),
      });
    }
  }

  // -------------------------------------------------------------
  // 2. LINKS
  // Every <a href> on every page points to a page that exists in the site
  // (check with the exact path from that page's folder). Report broken links with the page they're on.
  // -------------------------------------------------------------
  const allHrefs = extractMatches(cleanBodyHtml, /<a\b[^>]*\bhref=["']([^"']*)["'][^>]*>/gi);
  for (const m of allHrefs) {
    const href = m[1].trim();
    if (!href) {
      issues.push({
        page: pagePath,
        severity: "warning",
        category: "links",
        message: `Empty link href attribute found: href=""`,
        snippet: m[0],
      });
      continue;
    }

    // Ignore non-navigation schemes and pure anchor hashes
    if (
      href.startsWith("#") ||
      href.startsWith("tel:") ||
      href.startsWith("mailto:") ||
      href.startsWith("javascript:") ||
      href.startsWith("sms:") ||
      href.startsWith("http://") ||
      href.startsWith("https://") ||
      href.startsWith("//")
    ) {
      continue;
    }

    // Strip hash anchor and query parameters
    const cleanTarget = href.split("#")[0].split("?")[0].trim();
    if (!cleanTarget) continue;

    // Resolve relative to current page directory
    const resolvedPath = resolveRelativePath(pagePath, cleanTarget);

    // Verify if resolvedPath exists in the site bundle
    const fileExists = allFiles.some(
      (f) => f.path.toLowerCase() === resolvedPath.toLowerCase() ||
             (resolvedPath.endsWith("/") && f.path.toLowerCase() === `${resolvedPath}index.html`.toLowerCase())
    );

    if (!fileExists) {
      issues.push({
        page: pagePath,
        severity: "critical",
        category: "links",
        message: `Broken internal link: href="${href}" points to non-existent file "${resolvedPath}".`,
        details: `Page: ${pagePath} -> Target: ${resolvedPath}`,
        snippet: m[0],
      });
    }
  }

  // -------------------------------------------------------------
  // 3. ASSETS
  // Every CSS, JS, image, font, and favicon path points to a file that exists
  // -------------------------------------------------------------
  // CSS: <link rel="stylesheet" href="...">
  const cssMatches = extractMatches(html, /<link\b[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']*)["'][^>]*>/gi);
  for (const m of cssMatches) {
    const href = m[1].trim();
    if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//")) continue;

    const resolved = resolveRelativePath(pagePath, href.split("?")[0]);
    const exists = allFiles.some((f) => f.path.toLowerCase() === resolved.toLowerCase());
    if (!exists) {
      issues.push({
        page: pagePath,
        severity: "critical",
        category: "assets",
        message: `Missing CSS stylesheet: "${href}" (resolved to "${resolved}") does not exist in site bundle.`,
        snippet: m[0],
      });
    }
  }

  // JS: <script src="...">
  const jsMatches = extractMatches(html, /<script\b[^>]*src=["']([^"']*)["'][^>]*>/gi);
  for (const m of jsMatches) {
    const src = m[1].trim();
    if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("//")) continue;

    const resolved = resolveRelativePath(pagePath, src.split("?")[0]);
    const exists = allFiles.some((f) => f.path.toLowerCase() === resolved.toLowerCase());
    if (!exists) {
      issues.push({
        page: pagePath,
        severity: "critical",
        category: "assets",
        message: `Missing JavaScript file: "${src}" (resolved to "${resolved}") does not exist in site bundle.`,
        snippet: m[0],
      });
    }
  }

  // Favicon: <link rel="icon" href="...">
  const iconMatches = extractMatches(html, /<link\b[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']*)["'][^>]*>/gi);
  for (const m of iconMatches) {
    const href = m[1].trim();
    if (href.startsWith("http://") || href.startsWith("https://") || href.startsWith("//") || href.startsWith("data:")) continue;

    const resolved = resolveRelativePath(pagePath, href.split("?")[0]);
    const exists = allFiles.some((f) => f.path.toLowerCase() === resolved.toLowerCase());
    if (!exists) {
      issues.push({
        page: pagePath,
        severity: "warning",
        category: "assets",
        message: `Missing favicon icon: "${href}" (resolved to "${resolved}") not found in bundle.`,
        snippet: m[0],
      });
    }
  }

  // -------------------------------------------------------------
  // 4. IMAGES
  // every image slot has a real image file; every <img> has alt, width, and height
  // -------------------------------------------------------------
  const imgMatches = extractMatches(html, /<img\b([^>]*)>/gi);
  for (const m of imgMatches) {
    const tag = m[0];
    const attrs = m[1];

    const srcMatch = /src=["']([^"']*)["']/i.exec(attrs);
    const src = srcMatch ? srcMatch[1].trim() : "";

    // Image slot check
    if (!src || src === "undefined" || src === "null" || src === "") {
      issues.push({
        page: pagePath,
        severity: "critical",
        category: "images",
        message: `Empty image slot: <img> tag has missing or invalid src attribute (src="${src}").`,
        snippet: tag,
      });
    } else if (!src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("//") && !src.startsWith("data:")) {
      // Local image path existence check
      const resolved = resolveRelativePath(pagePath, src.split("?")[0]);
      const exists = allFiles.some((f) => f.path.toLowerCase() === resolved.toLowerCase());
      if (!exists) {
        issues.push({
          page: pagePath,
          severity: "critical",
          category: "images",
          message: `Broken local image file: "${src}" (resolved to "${resolved}") not found in bundle.`,
          snippet: tag,
        });
      }
    }

    // Alt attribute check
    const altMatch = /alt=["']([^"']*)["']/i.exec(attrs);
    if (!altMatch || !altMatch[1].trim()) {
      issues.push({
        page: pagePath,
        severity: "warning",
        category: "images",
        message: `Missing alt text: <img> tag lacks descriptive alt attribute.`,
        snippet: tag,
      });
    }

    // Width & Height attributes check (Core Web Vitals requirement)
    const hasWidth = /\bwidth=["']\d+["']/i.test(attrs) || /style=["'][^"']*width\s*:\s*\d+/i.test(attrs);
    const hasHeight = /\bheight=["']\d+["']/i.test(attrs) || /style=["'][^"']*height\s*:\s*\d+/i.test(attrs);

    if (!hasWidth || !hasHeight) {
      issues.push({
        page: pagePath,
        severity: "warning",
        category: "images",
        message: `Missing image dimensions: <img> is missing explicit width or height attributes (causes layout shifts).`,
        snippet: tag,
      });
    }
  }

  // -------------------------------------------------------------
  // 5. MENU
  // every page has the header, the same navigation items, and loads the menu script
  // -------------------------------------------------------------
  const hasHeader = /<header\b[^>]*>/i.test(html) || /class=["'][^"']*\bheader\b[^"']*["']/i.test(html);
  if (!hasHeader) {
    issues.push({
      page: pagePath,
      severity: "critical",
      category: "menu",
      message: `Missing header: Page does not contain a <header> element.`,
    });
  }

  // Extract navigation links
  const navItems: Array<{ label: string; href: string }> = [];
  const navBlockMatch = /<nav\b[^>]*>([\s\S]*?)<\/nav>/i.exec(html) ||
                        /<header\b[^>]*>([\s\S]*?)<\/header>/i.exec(html);

  if (navBlockMatch) {
    const navLinks = extractMatches(navBlockMatch[1], /<a\b[^>]*\bhref=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi);
    for (const nl of navLinks) {
      const href = nl[1].trim();
      const label = nl[2].replace(/<[^>]+>/g, "").trim();
      if (label && href && !href.startsWith("tel:") && !href.startsWith("mailto:")) {
        navItems.push({ label, href });
      }
    }
  } else {
    issues.push({
      page: pagePath,
      severity: "critical",
      category: "menu",
      message: `Missing navigation bar: No <nav> element found on the page.`,
    });
  }

  // Loads menu script check (e.g. js/main.js or script.js or inline script with menu toggle)
  const loadsMenuScript =
    /src=["'][^"']*(?:main\.js|script\.js|menu\.js)[^"']*["']/i.test(html) ||
    /nav-toggle|mobile-menu|hamburger|menu-btn/i.test(html);

  if (!loadsMenuScript) {
    issues.push({
      page: pagePath,
      severity: "critical",
      category: "menu",
      message: `Menu script missing: Page does not load js/main.js or script.js to support mobile navigation toggling.`,
    });
  }

  // -------------------------------------------------------------
  // 6. STRUCTURE
  // exactly one H1, a title, a meta description, and a footer;
  // every page is linked from at least one other page (no orphans);
  // the nav includes all main pages
  // -------------------------------------------------------------
  const h1Matches = extractMatches(html, /<h1\b[^>]*>([\s\S]*?)<\/h1>/gi);
  if (h1Matches.length === 0) {
    issues.push({
      page: pagePath,
      severity: "critical",
      category: "structure",
      message: `Missing H1: Page has zero <h1> tags. Every page must have exactly one H1.`,
    });
  } else if (h1Matches.length > 1) {
    issues.push({
      page: pagePath,
      severity: "critical",
      category: "structure",
      message: `Multiple H1 tags found: Page contains ${h1Matches.length} <h1> tags. Expected exactly 1.`,
      snippet: h1Matches.map((m) => m[0].slice(0, 80)).join(" | "),
    });
  }

  // Title tag
  const titleMatch = /<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html);
  if (!titleMatch || !titleMatch[1].trim()) {
    issues.push({
      page: pagePath,
      severity: "critical",
      category: "structure",
      message: `Missing <title>: Page does not have a non-empty <title> tag.`,
    });
  }

  // Meta description
  const metaDescMatch = /<meta\b[^>]*\bname=["']description["'][^>]*\bcontent=["']([^"']*)["'][^>]*>/i.exec(html) ||
                        /<meta\b[^>]*\bcontent=["']([^"']*)["'][^>]*\bname=["']description["'][^>]*>/i.exec(html);
  if (!metaDescMatch || !metaDescMatch[1].trim()) {
    issues.push({
      page: pagePath,
      severity: "warning",
      category: "structure",
      message: `Missing meta description: Page lacks a <meta name="description"> tag.`,
    });
  }

  // Footer check
  const hasFooter = /<footer\b[^>]*>/i.test(html) || /class=["'][^"']*\bfooter\b[^"']*["']/i.test(html);
  if (!hasFooter) {
    issues.push({
      page: pagePath,
      severity: "critical",
      category: "structure",
      message: `Missing footer: Page has no <footer> tag.`,
    });
  }

  return { issues, navItems };
}

/**
 * Builds an internal link map and checks for orphan pages and nav coverage
 */
export function checkGlobalStructure(
  files: SiteFile[],
  pageNavItems: Map<string, Array<{ label: string; href: string }>>
): { orphanPages: string[]; globalIssues: SiteIssue[] } {
  const htmlPages = files.filter((f) => f.path.toLowerCase().endsWith(".html")).map((f) => f.path);
  const incomingLinks = new Map<string, Set<string>>();
  for (const p of htmlPages) {
    incomingLinks.set(p.toLowerCase(), new Set<string>());
  }

  // Build incoming links graph
  for (const f of files) {
    if (!f.path.toLowerCase().endsWith(".html")) continue;
    const fromPage = f.path;
    const pageHtml = typeof f.content === "string" ? f.content : f.content.toString("utf8");
    const links = extractMatches(pageHtml, /<a\b[^>]*\bhref=["']([^"']*)["'][^>]*>/gi);

    for (const m of links) {
      const href = m[1].trim();
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("tel:") ||
        href.startsWith("mailto:") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//")
      ) {
        continue;
      }
      const clean = href.split("#")[0].split("?")[0].trim();
      if (!clean) continue;
      const target = resolveRelativePath(fromPage, clean).toLowerCase();

      if (incomingLinks.has(target) && target !== fromPage.toLowerCase()) {
        incomingLinks.get(target)!.add(fromPage.toLowerCase());
      }
    }
  }

  const orphanPages: string[] = [];
  const globalIssues: SiteIssue[] = [];

  // Check orphans: any page with 0 incoming internal links except index.html
  for (const [page, callers] of incomingLinks.entries()) {
    if (page === "index.html" || page === "index") continue;
    if (callers.size === 0) {
      orphanPages.push(page);
      globalIssues.push({
        page,
        severity: "critical",
        category: "structure",
        message: `Orphan page detected: "${page}" has 0 incoming links from any other page in the website.`,
        details: "Every page must be connected through navigation, service listings, or location footers.",
      });
    }
  }

  // Check navigation consistency across all pages
  const navEntries = Array.from(pageNavItems.entries());
  if (navEntries.length > 1) {
    const firstPage = navEntries[0][0];
    const firstNavSignature = navEntries[0][1]
      .map((i) => `${i.label}:${resolveRelativePath(firstPage, i.href).toLowerCase()}`)
      .join(" | ");

    for (let i = 1; i < navEntries.length; i++) {
      const [curPage, curNav] = navEntries[i];
      const curSig = curNav
        .map((n) => `${n.label}:${resolveRelativePath(curPage, n.href).toLowerCase()}`)
        .join(" | ");

      if (curSig !== firstNavSignature) {
        globalIssues.push({
          page: curPage,
          severity: "critical",
          category: "menu",
          message: `Inconsistent navigation menu items: Nav on "${curPage}" differs from main navigation on "${firstPage}".`,
          details: `Expected [${firstNavSignature}] vs Found [${curSig}]`,
        });
      }
    }
  }

  // Check that main pages are linked in the main nav
  const mainPages = ["about", "services", "contact", "service-areas"];
  const allNavHrefs = new Set<string>();
  for (const [, items] of navEntries) {
    for (const item of items) {
      allNavHrefs.add(item.href.replace(/\.html$/, "").replace(/^\/+/, "").toLowerCase());
    }
  }

  for (const mainP of mainPages) {
    const pageExists = htmlPages.some((p) => p.toLowerCase().includes(mainP));
    if (pageExists && !Array.from(allNavHrefs).some((h) => h.includes(mainP))) {
      globalIssues.push({
        page: "index.html",
        severity: "warning",
        category: "structure",
        message: `Main page "${mainP}.html" exists in site but is not included in the main navigation menu.`,
      });
    }
  }

  return { orphanPages, globalIssues };
}

/**
 * Runs headless Playwright browser to test layout, horizontal scroll, element widths, and console errors
 */
export async function runPlaywrightLayoutAudit(
  files: SiteFile[],
  options: CheckerOptions
): Promise<{
  pageLayoutResults: Map<string, PageLayoutResult[]>;
  pageConsoleErrors: Map<string, string[]>;
}> {
  const pageLayoutResults = new Map<string, PageLayoutResult[]>();
  const pageConsoleErrors = new Map<string, string[]>();

  const htmlFiles = files.filter((f) => f.path.toLowerCase().endsWith(".html"));
  for (const h of htmlFiles) {
    pageLayoutResults.set(h.path, []);
    pageConsoleErrors.set(h.path, []);
  }

  if (options.runPlaywright === false) {
    return { pageLayoutResults, pageConsoleErrors };
  }

  // Create lightweight local HTTP server to serve the static site files to Playwright
  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url?.split("?")[0] || "/").replace(/^\/+/, "");
    if (!reqPath || reqPath === "") reqPath = "index.html";

    const matchedFile = files.find(
      (f) => f.path.toLowerCase() === reqPath.toLowerCase() ||
             f.path.toLowerCase() === `${reqPath}.html`.toLowerCase()
    );

    if (matchedFile) {
      const ext = path.extname(matchedFile.path).toLowerCase();
      let contentType = "text/html; charset=utf-8";
      if (ext === ".css") contentType = "text/css; charset=utf-8";
      else if (ext === ".js") contentType = "application/javascript; charset=utf-8";
      else if (ext === ".json") contentType = "application/json";
      else if (ext === ".png") contentType = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
      else if (ext === ".webp") contentType = "image/webp";
      else if (ext === ".svg") contentType = "image/svg+xml";

      res.writeHead(200, { "Content-Type": contentType });
      res.end(matchedFile.content);
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
    }
  });

  const port = options.port || (4100 + Math.floor(Math.random() * 800));
  await new Promise<void>((resolve) => server.listen(port, resolve));

  const screenshotsBaseDir = path.join(
    process.cwd(),
    options.outputDir || "checker-report",
    "screenshots",
    options.siteId
  );
  if (options.saveScreenshots !== false && !fs.existsSync(screenshotsBaseDir)) {
    fs.mkdirSync(screenshotsBaseDir, { recursive: true });
  }

  let browser: Browser | null = null;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });

    const context = await browser.newContext();

    for (const hf of htmlFiles) {
      const pagePath = hf.path;
      const cleanSlug = pagePath.replace(/\.html$/, "");
      const consoleErrors: string[] = [];

      for (const width of VIEWPORT_WIDTHS) {
        const page = await context.newPage();
        await page.setViewportSize({ width, height: 844 });

        // Capture console errors and uncaught exceptions
        page.on("console", (msg) => {
          if (msg.type() === "error") {
            consoleErrors.push(`[Console Error @ ${width}px]: ${msg.text()}`);
          }
        });
        page.on("pageerror", (err) => {
          consoleErrors.push(`[Page Exception @ ${width}px]: ${err.message}`);
        });

        try {
          await page.goto(`http://127.0.0.1:${port}/${pagePath}`, {
            waitUntil: "domcontentloaded",
            timeout: 8000,
          });

          // Allow CSS transitions and fonts to settle
          await page.waitForTimeout(150);

          // Evaluate layout for horizontal overflow & wider elements
          const layoutEvaluation = await page.evaluate((w) => {
            const docWidth = document.documentElement.scrollWidth;
            const bodyWidth = document.body ? document.body.scrollWidth : 0;
            const scrollWidth = Math.max(docWidth, bodyWidth);
            const hasHorizontalScroll = scrollWidth > w + 1;

            const overflowElements: Array<{
              selector: string;
              tagName: string;
              className: string;
              width: number;
              right: number;
            }> = [];

            if (hasHorizontalScroll) {
              const allEls = document.querySelectorAll("body *");
              allEls.forEach((el) => {
                const rect = el.getBoundingClientRect();
                if (rect.width > w + 2 || rect.right > w + 2) {
                  const tag = el.tagName.toLowerCase();
                  const cls = (el as HTMLElement).className || "";
                  const id = el.id ? `#${el.id}` : "";
                  const selector = `${tag}${id}${cls ? `.${String(cls).split(/\s+/).slice(0, 2).join(".")}` : ""}`;
                  if (overflowElements.length < 8) {
                    overflowElements.push({
                      selector,
                      tagName: tag,
                      className: String(cls).slice(0, 60),
                      width: Math.round(rect.width),
                      right: Math.round(rect.right),
                    });
                  }
                }
              });
            }

            return {
              scrollWidth,
              hasHorizontalScroll,
              overflowElements,
            };
          }, width);

          // Save screenshot
          let screenshotPath: string | undefined;
          if (options.saveScreenshots !== false) {
            const fileName = `${cleanSlug.replace(/[^a-z0-9_-]/gi, "-")}-${width}px.png`;
            const destPath = path.join(screenshotsBaseDir, fileName);
            await page.screenshot({ path: destPath, fullPage: true });
            screenshotPath = destPath;
          }

          pageLayoutResults.get(pagePath)!.push({
            width,
            hasHorizontalScroll: layoutEvaluation.hasHorizontalScroll,
            scrollWidth: layoutEvaluation.scrollWidth,
            viewportWidth: width,
            overflowElements: layoutEvaluation.overflowElements,
            overlappingElements: [],
            screenshotPath,
          });
        } catch (e: any) {
          consoleErrors.push(`[Navigation Error @ ${width}px]: ${e.message}`);
        } finally {
          await page.close();
        }
      }

      pageConsoleErrors.set(pagePath, consoleErrors);
    }
  } catch (err: any) {
    console.warn("[SiteChecker] Playwright layout execution error:", err);
  } finally {
    if (browser) await browser.close();
    server.close();
  }

  return { pageLayoutResults, pageConsoleErrors };
}

/**
 * Main Site Checker Entry Point:
 * Inspects all files that go into the ZIP and returns a structured report.
 */
export async function runSiteChecker(
  files: SiteFile[],
  options: CheckerOptions
): Promise<SiteCheckerResult> {
  const htmlFiles = files.filter((f) => f.path.toLowerCase().endsWith(".html"));
  const allHtmlPaths = htmlFiles.map((f) => f.path);
  const pageNavMap = new Map<string, Array<{ label: string; href: string }>>();
  const staticIssuesByPage = new Map<string, SiteIssue[]>();

  // 1. Run static checks on each HTML page (Checks 1-6)
  for (const page of htmlFiles) {
    const { issues, navItems } = checkStaticPage(page, files, allHtmlPaths);
    staticIssuesByPage.set(page.path, issues);
    pageNavMap.set(page.path, navItems);
  }

  // 2. Run global structural checks (Orphan pages & Nav consistency)
  const { orphanPages, globalIssues } = checkGlobalStructure(files, pageNavMap);

  // 3. Run Playwright layout, horizontal scroll, and console error checks (Checks 7-8)
  const { pageLayoutResults, pageConsoleErrors } = await runPlaywrightLayoutAudit(files, options);

  // 4. Combine into final page reports
  const pageReports: PageReport[] = [];
  let totalCritical = 0;
  let totalWarning = 0;

  for (const page of htmlFiles) {
    const pagePath = page.path;
    const combinedIssues: SiteIssue[] = [...(staticIssuesByPage.get(pagePath) || [])];

    // Add layout issues
    const layouts = pageLayoutResults.get(pagePath) || [];
    for (const l of layouts) {
      if (l.hasHorizontalScroll) {
        const offending = l.overflowElements.map((o) => `${o.selector} (${o.width}px)`).join(", ");
        combinedIssues.push({
          page: pagePath,
          severity: "critical",
          category: "layout",
          message: `Horizontal scrolling at ${l.width}px viewport (scrollWidth: ${l.scrollWidth}px > ${l.width}px).`,
          details: offending ? `Offending wide elements: ${offending}` : undefined,
        });
      }
    }

    // Add console errors
    const consoleErrs = pageConsoleErrors.get(pagePath) || [];
    for (const cErr of consoleErrs) {
      combinedIssues.push({
        page: pagePath,
        severity: "critical",
        category: "console",
        message: `Runtime Console Error: ${cErr}`,
      });
    }

    // Add orphan issue to this specific page report if applicable
    if (orphanPages.includes(pagePath.toLowerCase())) {
      combinedIssues.push({
        page: pagePath,
        severity: "critical",
        category: "structure",
        message: `Orphan page: Page has no incoming internal links from any other page in the website.`,
      });
    }

    const criticalCount = combinedIssues.filter((i) => i.severity === "critical").length;
    const warningCount = combinedIssues.filter((i) => i.severity === "warning").length;

    totalCritical += criticalCount;
    totalWarning += warningCount;

    pageReports.push({
      page: pagePath,
      issues: combinedIssues,
      criticalCount,
      warningCount,
      layoutResults: layouts,
      consoleErrors: consoleErrs,
    });
  }

  // Count global issues
  for (const gi of globalIssues) {
    if (gi.severity === "critical") totalCritical++;
    else totalWarning++;
  }

  const result: SiteCheckerResult = {
    siteId: options.siteId,
    siteName: options.siteName,
    timestamp: new Date().toISOString(),
    totalIssues: totalCritical + totalWarning,
    criticalCount: totalCritical,
    warningCount: totalWarning,
    pagesChecked: htmlFiles.length,
    orphanPages,
    pageReports,
    globalIssues,
    screenshotsDir: path.join("checker-report", "screenshots", options.siteId),
  };

  return result;
}

/**
 * Formats one or multiple SiteCheckerResults into a clean CHECKER_REPORT.md markdown document
 */
export function formatMarkdownReport(results: SiteCheckerResult[]): string {
  let md = `# RankLocal Automated Site Checker Report\n\n`;
  md += `Generated: ${new Date().toUTCString()}\n\n`;
  md += `Total Sites Inspected: ${results.length}\n\n`;

  // Summary Table
  md += `## Executive Summary\n\n`;
  md += `| Test Site | Pages | Total Issues | Critical | Warning | Layout Freezes / Broken Menu |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: | :--- |\n`;

  for (const r of results) {
    const brokenMenu = r.pageReports.some((p) => p.issues.some((i) => i.category === "menu"));
    const brokenLayout = r.pageReports.some((p) => p.issues.some((i) => i.category === "layout"));
    const flags = [brokenMenu ? "🔴 Menu Broken" : null, brokenLayout ? "🔴 Layout Broken" : null].filter(Boolean).join(", ") || "None";
    md += `| **${r.siteName}** | ${r.pagesChecked} | ${r.totalIssues} | **${r.criticalCount}** | ${r.warningCount} | ${flags} |\n`;
  }
  md += `\n---\n\n`;

  // Detailed Breakdown for each site
  for (const r of results) {
    md += `## Site: ${r.siteName} (\`${r.siteId}\`)\n\n`;
    md += `- **Pages Evaluated**: ${r.pagesChecked}\n`;
    md += `- **Critical Severity Issues**: ${r.criticalCount}\n`;
    md += `- **Warning Severity Issues**: ${r.warningCount}\n`;
    md += `- **Orphan Pages (0 Incoming Links)**: ${r.orphanPages.length > 0 ? r.orphanPages.map((p) => `\`${p}\``).join(", ") : "None"}\n\n`;

    // Global / Multi-page issues
    if (r.globalIssues.length > 0) {
      md += `### Global Architecture Issues\n\n`;
      for (const gi of r.globalIssues) {
        const badge = gi.severity === "critical" ? "🔴 **CRITICAL**" : "⚠️ **WARNING**";
        md += `- ${badge} [${gi.category.toUpperCase()}]: ${gi.message}\n`;
        if (gi.details) md += `  - *Details*: ${gi.details}\n`;
      }
      md += `\n`;
    }

    // Page-by-Page Detailed Issues
    md += `### Page-by-Page Inspection\n\n`;

    for (const pr of r.pageReports) {
      md += `#### Page: \`${pr.page}\`\n\n`;
      if (pr.issues.length === 0) {
        md += `*No issues found on this page.*\n\n`;
        continue;
      }

      md += `| Severity | Category | Problem Description | Code Snippet / Details |\n`;
      md += `| :--- | :--- | :--- | :--- |\n`;

      for (const issue of pr.issues) {
        const sevBadge = issue.severity === "critical" ? "🔴 Critical" : "⚠️ Warning";
        const cleanSnippet = issue.snippet ? `\`${issue.snippet.replace(/\|/g, "\\|")}\`` : (issue.details || "—");
        md += `| ${sevBadge} | **${issue.category}** | ${issue.message.replace(/\|/g, "\\|")} | ${cleanSnippet} |\n`;
      }
      md += `\n`;

      // Layout Responsive Breakpoints
      const brokenLayouts = pr.layoutResults.filter((l) => l.hasHorizontalScroll);
      if (brokenLayouts.length > 0) {
        md += `**Responsive Layout Breakpoint Failures**:\n`;
        for (const bl of brokenLayouts) {
          md += `- ❌ **${bl.width}px**: scrollWidth ${bl.scrollWidth}px exceeds viewport width ${bl.width}px.\n`;
          if (bl.overflowElements.length > 0) {
            md += `  - Overflowing elements: ${bl.overflowElements.map((e) => `\`${e.selector}\` (${e.width}px wide)`).join(", ")}\n`;
          }
        }
        md += `\n`;
      }
    }

    md += `---\n\n`;
  }

  return md;
}
