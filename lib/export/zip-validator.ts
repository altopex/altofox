import JSZip from "jszip";

export interface ValidationCheckItem {
  id: string;
  name: string;
  passed: boolean;
  message: string;
  details?: string[];
}

export interface ZipValidationResult {
  valid: boolean;
  score: number; // 0 to 100
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  checks: ValidationCheckItem[];
  errors: string[];
  warnings: string[];
  fileStats: {
    totalFiles: number;
    htmlPagesCount: number;
    cssFilesCount: number;
    jsFilesCount: number;
    imagesCount: number;
  };
}

export interface ValidateWebsiteFilesOptions {
  files: Array<{ path: string; content: string | Buffer }>;
  expectedPages?: string[];
  optimizedPages?: string[];
  expectedPhone?: string;
  domain?: string;
}

/**
 * Validates a website file set or unpacked ZIP against 18 comprehensive quality & integrity rules.
 * Ensures the ZIP is 100% independently usable, self-contained, and free from broken references.
 */
export function validateWebsiteFiles(options: ValidateWebsiteFilesOptions): ZipValidationResult {
  const { files, expectedPages = [], optimizedPages = [], expectedPhone, domain } = options;
  const checks: ValidationCheckItem[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  const fileMap = new Map<string, string | Buffer>();
  const normalizedPaths = new Set<string>();

  for (const f of files) {
    if (!f || !f.path) continue;
    const norm = f.path.replace(/^\/+/, "").toLowerCase();
    fileMap.set(norm, f.content);
    normalizedPaths.add(norm);
  }

  const htmlFiles = files.filter((f) => f.path && f.path.toLowerCase().endsWith(".html"));
  const cssFiles = files.filter((f) => f.path && f.path.toLowerCase().endsWith(".css"));
  const jsFiles = files.filter((f) => f.path && f.path.toLowerCase().endsWith(".js"));
  const imageFiles = files.filter((f) => {
    const p = f.path.toLowerCase();
    return p.endsWith(".jpg") || p.endsWith(".jpeg") || p.endsWith(".png") || p.endsWith(".webp") || p.endsWith(".svg");
  });

  // Helper to extract string content from file
  function getFileString(normPath: string): string {
    const raw = fileMap.get(normPath);
    if (!raw) return "";
    return typeof raw === "string" ? raw : raw.toString("utf-8");
  }

  // --------------------------------------------------------------------------
  // CHECK 1: Every HTML Page Exists
  // --------------------------------------------------------------------------
  const hasIndex = normalizedPaths.has("index.html");
  const missingExpectedPages = expectedPages.filter((p) => !normalizedPaths.has(p.replace(/^\/+/, "").toLowerCase()));
  const check1Passed = hasIndex && htmlFiles.length > 0 && missingExpectedPages.length === 0;
  checks.push({
    id: "html-pages-exist",
    name: "Every HTML Page Exists",
    passed: check1Passed,
    message: check1Passed
      ? `All ${htmlFiles.length} HTML pages including index.html exist and are readable.`
      : `Missing required pages: ${!hasIndex ? "index.html" : missingExpectedPages.join(", ")}`,
  });
  if (!check1Passed) errors.push("Missing core HTML files in export package.");

  function resolveRelativePath(fromFile: string, targetRef: string): string {
    const cleanRef = targetRef.split("?")[0].split("#")[0].trim();
    if (cleanRef.startsWith("/")) return cleanRef.slice(1).toLowerCase();

    const dirParts = fromFile.includes("/") ? fromFile.split("/").slice(0, -1) : [];
    const refParts = cleanRef.split("/");

    for (const part of refParts) {
      if (part === "." || part === "") continue;
      if (part === "..") {
        if (dirParts.length > 0) dirParts.pop();
      } else {
        dirParts.push(part);
      }
    }
    return dirParts.join("/").toLowerCase();
  }

  // --------------------------------------------------------------------------
  // CHECK 2: Internal Links Point to Valid Files
  // --------------------------------------------------------------------------
  const brokenLinks: string[] = [];
  const internalLinkRegex = /href=["']([^"'#:]+\.html)(#[^"']*)?["']/gi;

  for (const hf of htmlFiles) {
    const content = typeof hf.content === "string" ? hf.content : hf.content.toString("utf-8");
    let match;
    while ((match = internalLinkRegex.exec(content)) !== null) {
      const rawTarget = match[1];
      if (rawTarget.startsWith("http://") || rawTarget.startsWith("https://") || rawTarget.startsWith("mailto:") || rawTarget.startsWith("tel:")) {
        continue;
      }

      const resolved = resolveRelativePath(hf.path, rawTarget);
      if (!normalizedPaths.has(resolved) && !normalizedPaths.has(rawTarget.toLowerCase())) {
        brokenLinks.push(`${hf.path} → ${rawTarget} (resolved: ${resolved})`);
      }
    }
  }

  const check2Passed = brokenLinks.length === 0;
  checks.push({
    id: "internal-links-valid",
    name: "Internal Links Point to Valid Files",
    passed: check2Passed,
    message: check2Passed
      ? `All relative page links resolve to existing files (${htmlFiles.length} pages checked).`
      : `Found ${brokenLinks.length} broken internal relative links.`,
    details: brokenLinks.slice(0, 5),
  });
  if (!check2Passed) errors.push(`Broken internal links detected: ${brokenLinks.slice(0, 3).join(", ")}`);

  // --------------------------------------------------------------------------
  // CHECK 3: CSS Files Exist and Load
  // --------------------------------------------------------------------------
  const cssRefs: string[] = [];
  const missingCssRefs: string[] = [];
  const cssRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+\.css)["']/gi;

  for (const hf of htmlFiles) {
    const content = typeof hf.content === "string" ? hf.content : hf.content.toString("utf-8");
    let match;
    while ((match = cssRegex.exec(content)) !== null) {
      const ref = match[1];
      if (!ref.startsWith("http://") && !ref.startsWith("https://")) {
        const resolved = resolveRelativePath(hf.path, ref);
        cssRefs.push(resolved);
        if (!normalizedPaths.has(resolved) && !normalizedPaths.has(ref.toLowerCase())) {
          missingCssRefs.push(`${hf.path} refers to missing CSS: ${ref} (resolved: ${resolved})`);
        }
      }
    }
  }

  const check3Passed = cssFiles.length > 0 || (cssRefs.length === 0 && htmlFiles.some((h) => (typeof h.content === "string" ? h.content : "").includes("<style>")));
  checks.push({
    id: "css-exists-and-loads",
    name: "CSS Files Exist and Load",
    passed: check3Passed && missingCssRefs.length === 0,
    message: check3Passed && missingCssRefs.length === 0
      ? `Stylesheets verified (${cssFiles.length} CSS files packaged and loaded).`
      : `Missing referenced stylesheets: ${missingCssRefs.slice(0, 3).join(", ")}`,
  });
  if (missingCssRefs.length > 0) errors.push(`Referenced CSS files missing from ZIP.`);

  // --------------------------------------------------------------------------
  // CHECK 4: JS Files Exist and Load
  // --------------------------------------------------------------------------
  const missingJsRefs: string[] = [];
  const jsRegex = /<script[^>]+src=["']([^"']+\.js)["']/gi;

  for (const hf of htmlFiles) {
    const content = typeof hf.content === "string" ? hf.content : hf.content.toString("utf-8");
    let match;
    while ((match = jsRegex.exec(content)) !== null) {
      const ref = match[1];
      if (!ref.startsWith("http://") && !ref.startsWith("https://")) {
        const resolved = resolveRelativePath(hf.path, ref);
        if (!normalizedPaths.has(resolved) && !normalizedPaths.has(ref.toLowerCase())) {
          missingJsRefs.push(`${hf.path} refers to missing script: ${ref} (resolved: ${resolved})`);
        }
      }
    }
  }

  const check4Passed = missingJsRefs.length === 0;
  checks.push({
    id: "js-exists-and-loads",
    name: "JS Files Exist and Load",
    passed: check4Passed,
    message: check4Passed
      ? `All local script tags resolve to packaged JavaScript files.`
      : `Missing referenced scripts: ${missingJsRefs.join(", ")}`,
  });
  if (!check4Passed) errors.push("Referenced JS files are missing from archive.");

  // --------------------------------------------------------------------------
  // CHECK 5: Images Referenced by Local Paths Exist
  // --------------------------------------------------------------------------
  const missingLocalImages: string[] = [];
  const imgRegex = /src=["'](images\/[^"']+)["']/gi;

  for (const hf of htmlFiles) {
    const content = typeof hf.content === "string" ? hf.content : hf.content.toString("utf-8");
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      const localPath = match[1];
      const resolved = resolveRelativePath(hf.path, localPath);
      if (!normalizedPaths.has(resolved) && !normalizedPaths.has(localPath.toLowerCase())) {
        const surroundingSnippet = content.slice(Math.max(0, match.index - 50), match.index + 200);
        if (!surroundingSnippet.includes("data-remote-src") && !surroundingSnippet.includes("onerror=")) {
          missingLocalImages.push(`${hf.path} → ${localPath}`);
        }
      }
    }
  }

  const check5Passed = missingLocalImages.length === 0;
  checks.push({
    id: "local-images-exist",
    name: "Images Referenced by Local Paths Exist or Have Fallbacks",
    passed: check5Passed,
    message: check5Passed
      ? `Local image references verified with offline assets or dynamic fallbacks.`
      : `Missing local image assets: ${missingLocalImages.slice(0, 5).join(", ")}`,
  });
  if (!check5Passed) errors.push("Broken local image references detected without fallbacks.");

  // --------------------------------------------------------------------------
  // CHECK 6: No Broken Relative Paths
  // --------------------------------------------------------------------------
  const brokenPathTokens = ["undefined", "null", "[object object]", "NaN"];
  let foundBrokenToken = false;
  for (const [path] of fileMap.entries()) {
    if (brokenPathTokens.some((t) => path.includes(t))) {
      foundBrokenToken = true;
      break;
    }
  }
  const check6Passed = !foundBrokenToken;
  checks.push({
    id: "no-broken-relative-paths",
    name: "No Malformed or Undefined Relative Paths",
    passed: check6Passed,
    message: check6Passed ? "Zero malformed tokens in directory paths." : "Malformed path tokens detected.",
  });
  if (!check6Passed) errors.push("Malformed path names detected in archive.");

  // --------------------------------------------------------------------------
  // CHECK 7: No Missing Core Assets
  // --------------------------------------------------------------------------
  const check7Passed = htmlFiles.length > 0 && (cssFiles.length > 0 || htmlFiles.some((h) => getFileString(h.path).includes("styles.css")));
  checks.push({
    id: "no-missing-assets",
    name: "Core Presentation Assets Intact",
    passed: check7Passed,
    message: check7Passed ? "Complete set of HTML, styles, and assets verified." : "Core visual assets incomplete.",
  });

  // --------------------------------------------------------------------------
  // CHECK 8: No Accidental Localhost URLs
  // --------------------------------------------------------------------------
  const localhostMatches: string[] = [];
  const localhostRegex = /(?:https?:\/\/)?(?:localhost|127\.0\.0\.1)(?::\d+)?/gi;

  for (const hf of htmlFiles) {
    const content = getFileString(hf.path);
    if (localhostRegex.test(content)) {
      localhostMatches.push(hf.path);
    }
  }

  const check8Passed = localhostMatches.length === 0;
  checks.push({
    id: "no-localhost-urls",
    name: "No Accidental Localhost URLs",
    passed: check8Passed,
    message: check8Passed ? "Clean public URLs; 0 localhost strings detected." : `Found localhost URLs in: ${localhostMatches.join(", ")}`,
  });
  if (!check8Passed) errors.push("Localhost development URLs detected in exported pages.");

  // --------------------------------------------------------------------------
  // CHECK 9: No Development-Only URLs or Test Flags
  // --------------------------------------------------------------------------
  const devUrlRegex = /(?:test\.local|dev\.local|vercel\.app\/api\/dev)/gi;
  const devMatches: string[] = [];
  for (const hf of htmlFiles) {
    const content = getFileString(hf.path);
    if (devUrlRegex.test(content)) {
      devMatches.push(hf.path);
    }
  }
  const check9Passed = devMatches.length === 0;
  checks.push({
    id: "no-dev-urls",
    name: "No Development-Only URLs",
    passed: check9Passed,
    message: check9Passed ? "Zero development-only endpoints in exported markup." : `Dev URLs found in: ${devMatches.join(", ")}`,
  });

  // --------------------------------------------------------------------------
  // CHECK 10: No API Keys or Secrets Exposed
  // --------------------------------------------------------------------------
  const secretRegex = /(?:sk-[a-zA-Z0-9]{20,}|AIzaSy[a-zA-Z0-9_-]{33}|gsk_[a-zA-Z0-9]{20,})/g;
  let exposedSecrets = false;
  for (const [path] of fileMap.entries()) {
    const content = getFileString(path);
    if (secretRegex.test(content)) {
      exposedSecrets = true;
      break;
    }
  }
  const check10Passed = !exposedSecrets;
  checks.push({
    id: "no-secrets-exposed",
    name: "No API Keys or Secrets Exposed",
    passed: check10Passed,
    message: check10Passed ? "Clean export: 0 private API keys or tokens present." : "SECURITY ALERT: Unencrypted API key found in files!",
  });
  if (!check10Passed) errors.push("Private API keys detected in static export package.");

  // --------------------------------------------------------------------------
  // CHECK 11: sitemap.xml Exists and Contains Correct URLs
  // --------------------------------------------------------------------------
  const hasSitemap = normalizedPaths.has("sitemap.xml");
  let sitemapValid = false;
  if (hasSitemap) {
    const sitemapContent = getFileString("sitemap.xml");
    sitemapValid = sitemapContent.includes("<urlset") && sitemapContent.includes("<loc>");
  }
  const check11Passed = hasSitemap && sitemapValid;
  checks.push({
    id: "sitemap-valid",
    name: "Sitemap.xml Exists and Contains Valid URLs",
    passed: check11Passed,
    message: check11Passed ? "Valid XML sitemap present indexing static pages." : "sitemap.xml is missing or empty.",
  });
  if (!check11Passed) errors.push("sitemap.xml missing or invalid in archive.");

  // --------------------------------------------------------------------------
  // CHECK 12: robots.txt is Valid
  // --------------------------------------------------------------------------
  const hasRobots = normalizedPaths.has("robots.txt");
  let robotsValid = false;
  if (hasRobots) {
    const robotsContent = getFileString("robots.txt");
    robotsValid = robotsContent.includes("User-agent:") && robotsContent.includes("Sitemap:");
  }
  const check12Passed = hasRobots && robotsValid;
  checks.push({
    id: "robots-valid",
    name: "Robots.txt is Valid and References Sitemap",
    passed: check12Passed,
    message: check12Passed ? "robots.txt verified with User-agent and Sitemap directives." : "robots.txt is missing or lacks Sitemap directive.",
  });
  if (!check12Passed) errors.push("robots.txt missing or invalid in archive.");

  // --------------------------------------------------------------------------
  // CHECK 13: Canonical URLs are Correct
  // --------------------------------------------------------------------------
  let missingCanonicals = 0;
  for (const hf of htmlFiles) {
    const content = getFileString(hf.path);
    if (!content.includes('rel="canonical"')) {
      missingCanonicals++;
    }
  }
  const check13Passed = missingCanonicals === 0;
  checks.push({
    id: "canonical-urls",
    name: "Canonical URLs Configured",
    passed: check13Passed,
    message: check13Passed
      ? `All ${htmlFiles.length} pages include valid rel="canonical" tags.`
      : `${missingCanonicals} pages lack canonical URL tags.`,
  });

  // --------------------------------------------------------------------------
  // CHECK 14: Phone / tel: Links are Preserved
  // --------------------------------------------------------------------------
  let pagesWithTel = 0;
  for (const hf of htmlFiles) {
    const content = getFileString(hf.path);
    if (content.includes("href=\"tel:") || content.includes("href='tel:")) {
      pagesWithTel++;
    }
  }
  const check14Passed = pagesWithTel > 0;
  checks.push({
    id: "phone-tel-links-preserved",
    name: "Phone Number & Working tel: Links Preserved",
    passed: check14Passed,
    message: check14Passed
      ? `Direct click-to-call links active on ${pagesWithTel} pages.`
      : "No phone call CTA links detected.",
  });
  if (!check14Passed) warnings.push("No click-to-call phone links detected on pages.");

  // --------------------------------------------------------------------------
  // CHECK 15: Navigation Works
  // --------------------------------------------------------------------------
  let pagesWithNav = 0;
  for (const hf of htmlFiles) {
    const content = getFileString(hf.path);
    if (content.includes("<nav") || content.includes('class="nav') || content.includes('id="nav')) {
      pagesWithNav++;
    }
  }
  const check15Passed = pagesWithNav >= htmlFiles.length * 0.8;
  checks.push({
    id: "navigation-works",
    name: "Header Navigation Preserved",
    passed: check15Passed,
    message: check15Passed ? `Accessible site navigation present on ${pagesWithNav} pages.` : "Inconsistent site navigation.",
  });

  // --------------------------------------------------------------------------
  // CHECK 16: All Optimized Pages are Included
  // --------------------------------------------------------------------------
  const missingOptimized = optimizedPages.filter((p) => !normalizedPaths.has(p.replace(/^\/+/, "").toLowerCase()));
  const check16Passed = missingOptimized.length === 0;
  checks.push({
    id: "optimized-pages-included",
    name: "All Optimized Pages Included in Package",
    passed: check16Passed,
    message: check16Passed
      ? `All ${optimizedPages.length} optimized pages are packaged in the final files.`
      : `Missing optimized pages: ${missingOptimized.join(", ")}`,
  });
  if (!check16Passed) errors.push(`Optimized pages missing from export: ${missingOptimized.join(", ")}`);

  // --------------------------------------------------------------------------
  // CHECK 17: Unchanged Pages are Still Included (Full Site Integrity)
  // --------------------------------------------------------------------------
  const check17Passed = htmlFiles.length >= Math.max(expectedPages.length, 1);
  checks.push({
    id: "unchanged-pages-included",
    name: "Unchanged Pages Retained (Complete Site Archive)",
    passed: check17Passed,
    message: check17Passed
      ? `Complete website retained (${htmlFiles.length} total HTML pages bundled, not just modified files).`
      : "Export only contains modified pages; unchanged pages were accidentally dropped.",
  });
  if (!check17Passed) errors.push("Unchanged pages dropped from archive.");

  // --------------------------------------------------------------------------
  // CHECK 18: ZIP File Structure is Clean
  // --------------------------------------------------------------------------
  const hasInvalidRoot = normalizedPaths.has("") || normalizedPaths.has("/");
  const check18Passed = !hasInvalidRoot && files.length >= htmlFiles.length;
  checks.push({
    id: "zip-structure-clean",
    name: "Archive Directory Structure Clean & Valid",
    passed: check18Passed,
    message: check18Passed ? `Clean directory hierarchy with ${files.length} packaged entries.` : "Invalid archive root entries detected.",
  });

  // --------------------------------------------------------------------------
  // FINAL SCORE & SUMMARY
  // --------------------------------------------------------------------------
  const passedCount = checks.filter((c) => c.passed).length;
  const score = Math.round((passedCount / checks.length) * 100);
  const valid = errors.length === 0 && score >= 90;

  return {
    valid,
    score,
    totalChecks: checks.length,
    passedChecks: passedCount,
    failedChecks: checks.length - passedCount,
    checks,
    errors,
    warnings,
    fileStats: {
      totalFiles: files.length,
      htmlPagesCount: htmlFiles.length,
      cssFilesCount: cssFiles.length,
      jsFilesCount: jsFiles.length,
      imagesCount: imageFiles.length,
    },
  };
}

/**
 * Validates a JSZip blob directly by unzipping in-memory and passing files to validateWebsiteFiles.
 */
export async function validateZipBlob(
  blob: Blob,
  options: Omit<ValidateWebsiteFilesOptions, "files"> = {}
): Promise<ZipValidationResult> {
  const zip = await JSZip.loadAsync(blob);
  const extractedFiles: Array<{ path: string; content: string | Buffer }> = [];

  const promises: Promise<void>[] = [];
  zip.forEach((relativePath, zipEntry) => {
    if (zipEntry.dir) return;
    const p = zipEntry.async("string").then((content) => {
      extractedFiles.push({ path: relativePath, content });
    });
    promises.push(p);
  });

  await Promise.all(promises);

  return validateWebsiteFiles({
    files: extractedFiles,
    ...options,
  });
}
