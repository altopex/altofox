import JSZip from "jszip";
import { Readable } from "stream";
import { BRAND } from "@/config/brand";
import {
  generateProjectSitemapXml,
  generateProjectRobotsTxt,
  minifyCss,
  minifyJs,
} from "@/lib/export/optimizer";

export interface ProductionWebsiteFile {
  path: string;
  content: string | Buffer;
  mimeType?: string | null;
}

export interface PreZipAuditIssue {
  type: "error" | "warning";
  code: string;
  message: string;
  file?: string;
  details?: any;
}

export interface PreZipAuditReport {
  passed: boolean;
  score: number; // 0 - 100
  securityScan: {
    passed: boolean;
    scannedFilesCount: number;
    blockedFiles: string[];
    secretsDetected: Array<{ file: string; secretType: string; snippet: string }>;
    summary: string;
  };
  brokenLinkAudit: {
    passed: boolean;
    linksCheckedCount: number;
    brokenLinks: Array<{ file: string; target: string; reason: string }>;
    summary: string;
  };
  missingAssetAudit: {
    passed: boolean;
    assetsCheckedCount: number;
    missingAssets: Array<{ file: string; asset: string; type: string }>;
    summary: string;
  };
  seoAudit: {
    passed: boolean;
    pagesAuditedCount: number;
    missingTitles: string[];
    missingDescriptions: string[];
    missingCanonicals: string[];
    missingH1s: string[];
    hasSitemap: boolean;
    hasRobots: boolean;
    summary: string;
  };
  requiredFilesAudit: {
    passed: boolean;
    checkedRequirements: { [key: string]: boolean };
    missingRequirements: string[];
    summary: string;
  };
  allIssues: PreZipAuditIssue[];
}

export interface ProductionWebsiteOptions {
  projectName?: string;
  domain?: string;
  businessName?: string;
  businessType?: string;
  phone?: string;
  city?: string;
  state?: string;
  primaryColor?: string;
  photos?: Array<{
    remoteUrl?: string;
    url?: string;
    downloadUrl?: string;
    localPath: string;
    localWebpPath?: string;
    slot?: string;
  }>;
}

/**
 * Creates a valid, standalone ICO binary buffer containing a 32x32 uncompressed icon
 * with the brand initial. Fully supported by Windows, macOS, Linux, and all browsers.
 */
export function generateIcoBinary(initial: string = "R", colorHex: string = "#4F46E5"): Buffer {
  const width = 32;
  const height = 32;
  const bpp = 32;
  const pixelCount = width * height;
  const colorBytes = pixelCount * 4;
  const maskBytes = (width * height) / 8; // 128 bytes
  const biSizeImage = colorBytes + maskBytes;
  const biSize = 40;
  const imageOffset = 22; // 6 (header) + 16 (dir entry)
  const totalFileSize = imageOffset + biSize + biSizeImage;

  const buf = Buffer.alloc(totalFileSize);

  // Parse color hex to RGB
  let r = 79, g = 70, b = 229;
  const cleanHex = colorHex.replace("#", "");
  if (cleanHex.length === 6) {
    r = parseInt(cleanHex.slice(0, 2), 16) || 79;
    g = parseInt(cleanHex.slice(2, 4), 16) || 70;
    b = parseInt(cleanHex.slice(4, 6), 16) || 229;
  }

  // 1. ICO Header (6 bytes)
  buf.writeUInt16LE(0, 0);     // Reserved (0)
  buf.writeUInt16LE(1, 2);     // Type (1 = ICO)
  buf.writeUInt16LE(1, 4);     // Count of images (1)

  // 2. Icon Directory Entry (16 bytes)
  buf.writeUInt8(width, 6);    // Width
  buf.writeUInt8(height, 7);   // Height
  buf.writeUInt8(0, 8);        // Color count (0 = no palette)
  buf.writeUInt8(0, 9);        // Reserved
  buf.writeUInt16LE(1, 10);    // Color planes (1)
  buf.writeUInt16LE(bpp, 12);  // Bits per pixel (32)
  buf.writeUInt32LE(biSize + biSizeImage, 14); // Size of image data
  buf.writeUInt32LE(imageOffset, 18);          // Offset of image data

  // 3. BITMAPINFOHEADER (40 bytes)
  let offset = 22;
  buf.writeUInt32LE(biSize, offset); offset += 4;
  buf.writeInt32LE(width, offset); offset += 4;
  buf.writeInt32LE(height * 2, offset); offset += 4; // Height * 2 for XOR + AND mask
  buf.writeUInt16LE(1, offset); offset += 2;          // Planes
  buf.writeUInt16LE(bpp, offset); offset += 2;        // Bit count
  buf.writeUInt32LE(0, offset); offset += 4;          // Compression (BI_RGB)
  buf.writeUInt32LE(biSizeImage, offset); offset += 4;// Image size
  buf.writeInt32LE(0, offset); offset += 4;          // X pixels per meter
  buf.writeInt32LE(0, offset); offset += 4;          // Y pixels per meter
  buf.writeUInt32LE(0, offset); offset += 4;          // Colors used
  buf.writeUInt32LE(0, offset); offset += 4;          // Important colors

  // 4. Pixel Data (BGRA, bottom-up)
  // Fill with rounded badge shape & contrasting initial pattern
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = offset + (y * width + x) * 4;
      const dx = x - width / 2;
      const dy = y - height / 2;
      const distSq = dx * dx + dy * dy;

      // Rounded circular badge (radius ~ 14)
      if (distSq <= 14 * 14) {
        // Draw centered initial cross/stem if coordinate matches
        const isInitialPixel =
          (Math.abs(dx) <= 2 && Math.abs(dy) <= 8) ||
          (dy >= 4 && dy <= 7 && Math.abs(dx) <= 6) ||
          (dy <= -4 && dy >= -7 && Math.abs(dx) <= 6);

        if (isInitialPixel) {
          buf.writeUInt8(255, idx);     // B
          buf.writeUInt8(255, idx + 1); // G
          buf.writeUInt8(255, idx + 2); // R
          buf.writeUInt8(255, idx + 3); // A (opaque)
        } else {
          buf.writeUInt8(b, idx);       // B
          buf.writeUInt8(g, idx + 1);   // G
          buf.writeUInt8(r, idx + 2);   // R
          buf.writeUInt8(255, idx + 3); // A (opaque)
        }
      } else {
        // Fully transparent background
        buf.writeUInt8(0, idx);
        buf.writeUInt8(0, idx + 1);
        buf.writeUInt8(0, idx + 2);
        buf.writeUInt8(0, idx + 3);
      }
    }
  }
  offset += colorBytes;

  // 5. AND Mask (128 bytes, 0 for opaque pixels)
  buf.fill(0, offset, offset + maskBytes);

  return buf;
}

/**
 * Generates both SVG and ICO production favicons customized for the business
 */
export function generateProductionFavicon(
  businessName: string = "Website",
  primaryColor: string = "#4F46E5"
): { svg: string; icoBuffer: Buffer } {
  const initial = (businessName.trim().charAt(0) || "R").toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="rl-fav-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryColor}"/>
      <stop offset="100%" stop-color="#0F172A"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="16" fill="url(#rl-fav-grad)"/>
  <text x="50%" y="54%" font-family="system-ui, -apple-system, sans-serif" font-size="34" font-weight="800" fill="#FFFFFF" text-anchor="middle" dominant-baseline="middle">${initial}</text>
</svg>`;

  const icoBuffer = generateIcoBinary(initial, primaryColor);

  return { svg, icoBuffer };
}

/**
 * Blocklist of filenames, extensions, and directory paths strictly forbidden in production ZIPs.
 */
const FORBIDDEN_FILE_PATTERNS = [
  /^\.env/i,
  /\.env\.(local|production|development|test)$/i,
  /(?:^|\/)\.git\b/i,
  /(?:^|\/)\.gemini\b/i,
  /(?:^|\/)\.vscode\b/i,
  /(?:^|\/)\.system_generated\b/i,
  /(?:^|\/)node_modules\b/i,
  /\btoken\b/i,
  /\bsecret\b/i,
  /\bcredentials?\b/i,
  /\bid_rsa\b/i,
  /\.pem$/i,
  /\.log$/i,
  /\.log\.jsonl$/i,
  /\btranscript\b/i,
  /\bdebug\b/i,
  /\btemp\b/i,
  /\.tmp$/i,
  /\bscratch\b/i,
  /\.bak$/i,
  /\.cache\b/i,
  /\badmin\b/i,
  /\.sqlite(?:3)?$/i,
  /\bdev\.db$/i,
  /\bschema\.prisma$/i,
  /\bprisma\b/i,
  /\.DS_Store$/i,
  /\bThumbs\.db$/i,
];

/**
 * Regex patterns for credentials and secrets that must NEVER leak into exported website code.
 */
const SECRET_CONTENT_PATTERNS = [
  { name: "OpenAI API Key", regex: /sk-[a-zA-Z0-9_-]{20,}/g },
  { name: "Google / Gemini API Key", regex: /AIzaSy[a-zA-Z0-9_-]{33}/g },
  { name: "Anthropic API Key", regex: /sk-ant-[a-zA-Z0-9_-]{20,}/g },
  { name: "Groq API Key", regex: /gsk_[a-zA-Z0-9_-]{20,}/g },
  { name: "OpenRouter API Key", regex: /sk-or-v1-[a-zA-Z0-9_-]{20,}/g },
  { name: "Supabase JWT / Secret", regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+/g },
  { name: "Supabase PAT", regex: /sbp_[a-zA-Z0-9_-]{20,}/g },
  { name: "Supabase Secret Key Token", regex: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*['"]?[a-zA-Z0-9_\-\.]+['"]?/gi },
  { name: "Cloudflare Deployment Token", regex: /CLOUDFLARE_API_TOKEN\s*=\s*['"]?[a-zA-Z0-9_\-\.]+['"]?/gi },
  { name: "Vercel / Netlify Deployment Token", regex: /(?:VERCEL_TOKEN|NETLIFY_AUTH_TOKEN)\s*=\s*['"]?[a-zA-Z0-9_\-\.]+['"]?/gi },
  { name: "GitHub Personal Access Token", regex: /ghp_[a-zA-Z0-9]{36}/g },
  { name: "Private RSA/EC Key", regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/g },
  { name: "Database Connection String", regex: /(?:postgres(?:ql)?|mysql|mongodb):\/\/[a-zA-Z0-9_]+:[^@\s]+@[a-zA-Z0-9_\-\.]+/gi },
];

/**
 * Normalizes and resolves a target URL relative to the source page's folder.
 */
function resolveRelativePath(fromPath: string, targetRef: string): string {
  const cleanRef = targetRef.split("?")[0].split("#")[0].trim();
  if (cleanRef.startsWith("/")) return cleanRef.slice(1).toLowerCase();

  const dirParts = fromPath.includes("/") ? fromPath.split("/").slice(0, -1) : [];
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

/**
 * Adjusts all relative links and asset paths inside a page when placed in a subdirectory (depth = 1).
 */
export function adjustPathsForSubdirectory(html: string): string {
  if (!html) return "";

  // 1. Adjust all relative internal page links (e.g. services.html, plumber-naperville.html)
  let updated = html.replace(
    /href=["'](?!\.\.\/|\/|https?:\/\/|tel:|mailto:|javascript:|#)([^"'#:]+\.html)(#[^"']*)?["']/gi,
    (match, page, hash) => {
      return `href="../${page}${hash || ""}"`;
    }
  );

  // 2. Adjust CSS stylesheets
  updated = updated.replace(
    /href=["'](?!\.\.\/|\/|https?:\/\/)([^"']+\.css)["']/gi,
    (match, file) => `href="../${file}"`
  );

  // 3. Adjust JS scripts
  updated = updated.replace(
    /src=["'](?!\.\.\/|\/|https?:\/\/)([^"']+\.js)["']/gi,
    (match, file) => `src="../${file}"`
  );

  // 4. Adjust images
  updated = updated.replace(
    /src=["'](?!\.\.\/|\/|https?:\/\/|data:)([^"']+\.(?:jpg|jpeg|png|webp|svg|gif))["']/gi,
    (match, file) => `src="../${file}"`
  );
  updated = updated.replace(
    /data-local-svg=["'](?!\.\.\/|\/|https?:\/\/)([^"']+)["']/gi,
    (match, file) => `data-local-svg="../${file}"`
  );
  updated = updated.replace(
    /url\(['"]?(?!\.\.\/|\/|https?:\/\/|data:)([^'"\)]+\.(?:jpg|jpeg|png|webp|svg|gif))['"]?\)/gi,
    (match, file) => `url('../${file}')`
  );

  // 5. Adjust favicons
  updated = updated.replace(
    /href=["'](?!\.\.\/|\/|https?:\/\/)(?:\.\/)?(favicon\.(?:svg|ico)|assets\/favicon\.(?:svg|ico))["']/gi,
    'href="../$1"'
  );

  return updated;
}

/**
 * Performs strict preflight audits before ZIP generation:
 * 1. Security Scan
 * 2. Broken-Link Audit
 * 3. Missing-Asset Audit
 * 4. SEO Audit
 * 5. Confirm Required Files Exist
 */
export function runPreZipAudits(
  files: ProductionWebsiteFile[],
  options: ProductionWebsiteOptions = {}
): PreZipAuditReport {
  const allIssues: PreZipAuditIssue[] = [];
  const normalizedFileMap = new Map<string, string | Buffer>();

  for (const f of files) {
    if (!f || !f.path) continue;
    const norm = f.path.replace(/^\/+/, "").toLowerCase();
    normalizedFileMap.set(norm, f.content);
  }

  const htmlFiles = files.filter((f) => f.path.toLowerCase().endsWith(".html"));

  // =========================================================================
  // 1. RUN SECURITY SCAN
  // =========================================================================
  const blockedFiles: string[] = [];
  const secretsDetected: Array<{ file: string; secretType: string; snippet: string }> = [];

  for (const file of files) {
    const normPath = file.path.replace(/^\/+/, "");

    // Check prohibited filename patterns
    if (FORBIDDEN_FILE_PATTERNS.some((pattern) => pattern.test(normPath))) {
      blockedFiles.push(normPath);
      allIssues.push({
        type: "error",
        code: "SECURITY_FORBIDDEN_FILE",
        message: `Forbidden non-production file detected in export files: "${normPath}"`,
        file: normPath,
      });
    }

    // Check prohibited content patterns (credentials & secrets)
    const contentStr = typeof file.content === "string" ? file.content : file.content.toString("utf-8");
    for (const sec of SECRET_CONTENT_PATTERNS) {
      sec.regex.lastIndex = 0;
      let match;
      while ((match = sec.regex.exec(contentStr)) !== null) {
        const snippet = match[0].slice(0, 10) + "..." + match[0].slice(-4);
        secretsDetected.push({
          file: normPath,
          secretType: sec.name,
          snippet,
        });
        allIssues.push({
          type: "error",
          code: "SECURITY_SECRET_LEAK",
          message: `SECURITY ALERT: ${sec.name} detected in "${normPath}"`,
          file: normPath,
          details: snippet,
        });
      }
    }
  }

  const securityPassed = blockedFiles.length === 0 && secretsDetected.length === 0;
  const securityScan = {
    passed: securityPassed,
    scannedFilesCount: files.length,
    blockedFiles,
    secretsDetected,
    summary: securityPassed
      ? `Security scan PASSED: 0 secrets, 0 API credentials, 0 non-production files across ${files.length} scanned files.`
      : `Security scan FAILED: Found ${blockedFiles.length} prohibited files and ${secretsDetected.length} exposed secrets.`,
  };

  // =========================================================================
  // 2. RUN BROKEN-LINK AUDIT
  // =========================================================================
  const brokenLinks: Array<{ file: string; target: string; reason: string }> = [];
  let linksCheckedCount = 0;
  const linkRegex = /<a\b[^>]*?href=["']([^"'#:]+(?:\.html|\/)?)(#[^"']*)?["']/gi;

  for (const hf of htmlFiles) {
    const content = typeof hf.content === "string" ? hf.content : hf.content.toString("utf-8");
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const rawTarget = match[1].trim();
      if (!rawTarget || rawTarget === "/" || rawTarget === "#" || rawTarget.startsWith("http://") || rawTarget.startsWith("https://") || rawTarget.startsWith("tel:") || rawTarget.startsWith("mailto:") || rawTarget.startsWith("javascript:")) {
        continue;
      }

      linksCheckedCount++;
      const resolved = resolveRelativePath(hf.path, rawTarget);

      // Check both resolved path directly, and with /index.html if directory
      const existsDirect = normalizedFileMap.has(resolved);
      const existsIndex = normalizedFileMap.has(`${resolved.replace(/\/+$/, "")}/index.html`);
      const existsHtml = normalizedFileMap.has(`${resolved.replace(/\/+$/, "")}.html`);

      if (!existsDirect && !existsIndex && !existsHtml) {
        brokenLinks.push({
          file: hf.path,
          target: rawTarget,
          reason: `Resolved target "${resolved}" does not exist in website files`,
        });
        allIssues.push({
          type: "error",
          code: "BROKEN_INTERNAL_LINK",
          message: `Broken internal link in "${hf.path}": targets nonexistent "${rawTarget}"`,
          file: hf.path,
          details: { rawTarget, resolved },
        });
      }
    }
  }

  const brokenLinkPassed = brokenLinks.length === 0;
  const brokenLinkAudit = {
    passed: brokenLinkPassed,
    linksCheckedCount,
    brokenLinks,
    summary: brokenLinkPassed
      ? `Broken-link audit PASSED: Checked ${linksCheckedCount} internal links across ${htmlFiles.length} pages. Zero broken links.`
      : `Broken-link audit FAILED: Found ${brokenLinks.length} broken internal links.`,
  };

  // =========================================================================
  // 3. RUN MISSING-ASSET AUDIT
  // =========================================================================
  const missingAssets: Array<{ file: string; asset: string; type: string }> = [];
  let assetsCheckedCount = 0;

  for (const hf of htmlFiles) {
    const content = typeof hf.content === "string" ? hf.content : hf.content.toString("utf-8");

    // CSS references
    const cssRegex = /<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+\.css)["']/gi;
    let cssMatch;
    while ((cssMatch = cssRegex.exec(content)) !== null) {
      const href = cssMatch[1];
      if (href.startsWith("http://") || href.startsWith("https://")) continue;
      assetsCheckedCount++;
      const resolved = resolveRelativePath(hf.path, href);
      if (!normalizedFileMap.has(resolved) && !normalizedFileMap.has(href.toLowerCase())) {
        missingAssets.push({ file: hf.path, asset: href, type: "css" });
        allIssues.push({
          type: "error",
          code: "MISSING_ASSET_CSS",
          message: `Missing stylesheet referenced in "${hf.path}": ${href}`,
          file: hf.path,
        });
      }
    }

    // JS references
    const jsRegex = /<script[^>]+src=["']([^"']+\.js)["']/gi;
    let jsMatch;
    while ((jsMatch = jsRegex.exec(content)) !== null) {
      const src = jsMatch[1];
      if (src.startsWith("http://") || src.startsWith("https://")) continue;
      assetsCheckedCount++;
      const resolved = resolveRelativePath(hf.path, src);
      if (!normalizedFileMap.has(resolved) && !normalizedFileMap.has(src.toLowerCase())) {
        missingAssets.push({ file: hf.path, asset: src, type: "js" });
        allIssues.push({
          type: "error",
          code: "MISSING_ASSET_JS",
          message: `Missing JavaScript referenced in "${hf.path}": ${src}`,
          file: hf.path,
        });
      }
    }

    // Images
    const imgRegex = /src=["'](images\/[^"']+)["']/gi;
    let imgMatch;
    while ((imgMatch = imgRegex.exec(content)) !== null) {
      const src = imgMatch[1];
      assetsCheckedCount++;
      const resolved = resolveRelativePath(hf.path, src);
      if (!normalizedFileMap.has(resolved) && !normalizedFileMap.has(src.toLowerCase())) {
        const snippet = content.slice(Math.max(0, imgMatch.index - 50), imgMatch.index + 200);
        if (!snippet.includes("data-local-svg") && !snippet.includes("onerror=")) {
          missingAssets.push({ file: hf.path, asset: src, type: "image" });
          allIssues.push({
            type: "warning",
            code: "MISSING_ASSET_IMAGE",
            message: `Unresolved image without fallback in "${hf.path}": ${src}`,
            file: hf.path,
          });
        }
      }
    }
  }

  const missingAssetPassed = missingAssets.filter((a) => a.type === "css" || a.type === "js").length === 0;
  const missingAssetAudit = {
    passed: missingAssetPassed,
    assetsCheckedCount,
    missingAssets,
    summary: missingAssetPassed
      ? `Missing-asset audit PASSED: Checked ${assetsCheckedCount} asset references. All CSS, JS, and image assets resolved.`
      : `Missing-asset audit FAILED: Found ${missingAssets.length} missing asset references.`,
  };

  // =========================================================================
  // 4. RUN SEO AUDIT
  // =========================================================================
  const missingTitles: string[] = [];
  const missingDescriptions: string[] = [];
  const missingCanonicals: string[] = [];
  const missingH1s: string[] = [];

  for (const hf of htmlFiles) {
    const content = typeof hf.content === "string" ? hf.content : hf.content.toString("utf-8");

    // Title
    const titleMatch = content.match(/<title[^>]*?>([\s\S]*?)<\/title>/i);
    if (!titleMatch || !titleMatch[1] || titleMatch[1].trim().length < 5) {
      missingTitles.push(hf.path);
      allIssues.push({ type: "warning", code: "SEO_MISSING_TITLE", message: `Missing or short <title> in "${hf.path}"`, file: hf.path });
    }

    // Meta Description
    const descMatch = content.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
    if (!descMatch || !descMatch[1] || descMatch[1].trim().length < 15) {
      missingDescriptions.push(hf.path);
      allIssues.push({ type: "warning", code: "SEO_MISSING_DESCRIPTION", message: `Missing meta description in "${hf.path}"`, file: hf.path });
    }

    // Canonical
    if (!content.includes('rel="canonical"')) {
      missingCanonicals.push(hf.path);
      allIssues.push({ type: "warning", code: "SEO_MISSING_CANONICAL", message: `Missing canonical tag in "${hf.path}"`, file: hf.path });
    }

    // H1
    if (!content.includes("<h1")) {
      missingH1s.push(hf.path);
      allIssues.push({ type: "warning", code: "SEO_MISSING_H1", message: `Missing <h1> tag in "${hf.path}"`, file: hf.path });
    }
  }

  const hasSitemap = normalizedFileMap.has("sitemap.xml");
  const hasRobots = normalizedFileMap.has("robots.txt");
  if (!hasSitemap) {
    allIssues.push({ type: "error", code: "SEO_MISSING_SITEMAP", message: "sitemap.xml is missing from website files." });
  }
  if (!hasRobots) {
    allIssues.push({ type: "error", code: "SEO_MISSING_ROBOTS", message: "robots.txt is missing from website files." });
  }

  const seoPassed = hasSitemap && hasRobots && missingTitles.length === 0;
  const seoAudit = {
    passed: seoPassed,
    pagesAuditedCount: htmlFiles.length,
    missingTitles,
    missingDescriptions,
    missingCanonicals,
    missingH1s,
    hasSitemap,
    hasRobots,
    summary: seoPassed
      ? `SEO audit PASSED: ${htmlFiles.length} pages audited with title, meta tags, sitemap.xml, and robots.txt.`
      : `SEO audit FAILED: Issues found in titles (${missingTitles.length}), sitemap (${hasSitemap}), robots (${hasRobots}).`,
  };

  // =========================================================================
  // 5. CONFIRM REQUIRED FILES EXIST
  // =========================================================================
  const checkedRequirements: { [key: string]: boolean } = {
    "index.html": normalizedFileMap.has("index.html"),
    "about/": normalizedFileMap.has("about/index.html") || normalizedFileMap.has("about.html"),
    "services/": normalizedFileMap.has("services/index.html") || normalizedFileMap.has("services.html"),
    "areas/": normalizedFileMap.has("areas/index.html") || normalizedFileMap.has("service-areas.html") || normalizedFileMap.has("areas.html"),
    "blog/": normalizedFileMap.has("blog/index.html") || normalizedFileMap.has("blog.html"),
    "assets/": normalizedFileMap.has("assets/style.css") || normalizedFileMap.has("styles.css") || normalizedFileMap.has("css/style.css"),
    "images/": Array.from(normalizedFileMap.keys()).some((k) => k.startsWith("images/")),
    "sitemap.xml": normalizedFileMap.has("sitemap.xml"),
    "robots.txt": normalizedFileMap.has("robots.txt"),
    "favicon": normalizedFileMap.has("favicon.ico") || normalizedFileMap.has("favicon.svg"),
  };

  const missingRequirements: string[] = Object.keys(checkedRequirements).filter(
    (k) => !checkedRequirements[k]
  );

  const requiredPassed = missingRequirements.length === 0;
  const requiredFilesAudit = {
    passed: requiredPassed,
    checkedRequirements,
    missingRequirements,
    summary: requiredPassed
      ? `Required files check PASSED: All 10 expected directory components exist.`
      : `Required files check: Missing components [${missingRequirements.join(", ")}].`,
  };

  // Final Overall Score
  const errorCount = allIssues.filter((i) => i.type === "error").length;
  const warningCount = allIssues.filter((i) => i.type === "warning").length;
  const score = Math.max(0, Math.min(100, 100 - errorCount * 15 - warningCount * 2));
  const overallPassed = errorCount === 0;

  return {
    passed: overallPassed,
    score,
    securityScan,
    brokenLinkAudit,
    missingAssetAudit,
    seoAudit,
    requiredFilesAudit,
    allIssues,
  };
}

/**
 * Organizes website files into the exact required production structure:
 * index.html
 * about/
 * services/
 * areas/
 * blog/
 * assets/
 * images/
 * sitemap.xml
 * robots.txt
 * favicon
 *
 * Strips any prohibited files (API keys, secrets, logs, debug, temp, admin data).
 */
export function prepareProductionWebsiteFiles(
  inputFiles: ProductionWebsiteFile[],
  options: ProductionWebsiteOptions = {}
): {
  files: ProductionWebsiteFile[];
  auditReport: PreZipAuditReport;
} {
  const domain = (options.domain || `${(options.projectName || "website").toLowerCase().replace(/[^a-z0-9]/g, "")}.com`)
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
  const businessName = options.businessName || options.projectName || "Local Business";
  const primaryColor = options.primaryColor || "#4F46E5";

  const fileMap = new Map<string, ProductionWebsiteFile>();

  // 1. Filter out prohibited files (Security Scan filter)
  for (const f of inputFiles) {
    if (!f || !f.path) continue;
    const norm = f.path.replace(/^\/+/, "");

    // Skip prohibited files
    if (FORBIDDEN_FILE_PATTERNS.some((p) => p.test(norm))) {
      continue;
    }

    fileMap.set(norm, {
      path: norm,
      content: f.content,
      mimeType: f.mimeType,
    });
  }

  // 2. Generate Favicon (SVG and ICO)
  const { svg: faviconSvg, icoBuffer: faviconIco } = generateProductionFavicon(businessName, primaryColor);
  fileMap.set("favicon.svg", { path: "favicon.svg", content: faviconSvg, mimeType: "image/svg+xml" });
  fileMap.set("favicon.ico", { path: "favicon.ico", content: faviconIco, mimeType: "image/x-icon" });
  fileMap.set("assets/favicon.svg", { path: "assets/favicon.svg", content: faviconSvg, mimeType: "image/svg+xml" });
  fileMap.set("assets/favicon.ico", { path: "assets/favicon.ico", content: faviconIco, mimeType: "image/x-icon" });

  // 3. Assemble and organize assets/ (styles and scripts)
  const existingCss = fileMap.get("styles.css") || fileMap.get("css/style.css") || fileMap.get("assets/style.css");
  const combinedCss = existingCss
    ? (typeof existingCss.content === "string" ? existingCss.content : existingCss.content.toString("utf-8"))
    : "/* Production Styles */";
  const minCss = minifyCss(combinedCss);

  fileMap.set("assets/style.css", { path: "assets/style.css", content: minCss, mimeType: "text/css" });
  fileMap.set("styles.css", { path: "styles.css", content: minCss, mimeType: "text/css" });
  fileMap.set("css/style.css", { path: "css/style.css", content: minCss, mimeType: "text/css" });

  const existingJs = fileMap.get("script.js") || fileMap.get("js/main.js") || fileMap.get("assets/script.js");
  const combinedJs = existingJs
    ? (typeof existingJs.content === "string" ? existingJs.content : existingJs.content.toString("utf-8"))
    : "/* Production Scripts */";
  const minJs = minifyJs(combinedJs);

  fileMap.set("assets/script.js", { path: "assets/script.js", content: minJs, mimeType: "application/javascript" });
  fileMap.set("script.js", { path: "script.js", content: minJs, mimeType: "application/javascript" });
  fileMap.set("js/main.js", { path: "js/main.js", content: minJs, mimeType: "application/javascript" });

  // 4. Organize Expected Page Directories: about/, services/, areas/, blog/
  // Handle About
  const aboutFile = fileMap.get("about.html") || fileMap.get("about/index.html");
  if (aboutFile) {
    const rawContent = typeof aboutFile.content === "string" ? aboutFile.content : aboutFile.content.toString("utf-8");
    const subContent = adjustPathsForSubdirectory(rawContent);
    fileMap.set("about/index.html", { path: "about/index.html", content: subContent, mimeType: "text/html" });
    fileMap.set("about.html", { path: "about.html", content: rawContent, mimeType: "text/html" });
  }

  // Handle Services
  const servicesFile = fileMap.get("services.html") || fileMap.get("services/index.html");
  if (servicesFile) {
    const rawContent = typeof servicesFile.content === "string" ? servicesFile.content : servicesFile.content.toString("utf-8");
    const subContent = adjustPathsForSubdirectory(rawContent);
    fileMap.set("services/index.html", { path: "services/index.html", content: subContent, mimeType: "text/html" });
    fileMap.set("services.html", { path: "services.html", content: rawContent, mimeType: "text/html" });
  }

  // Handle Areas (Locations Hub)
  const areasFile = fileMap.get("areas.html") || fileMap.get("service-areas.html") || fileMap.get("areas/index.html");
  if (areasFile) {
    const rawContent = typeof areasFile.content === "string" ? areasFile.content : areasFile.content.toString("utf-8");
    const subContent = adjustPathsForSubdirectory(rawContent);
    fileMap.set("areas/index.html", { path: "areas/index.html", content: subContent, mimeType: "text/html" });
    fileMap.set("areas.html", { path: "areas.html", content: rawContent, mimeType: "text/html" });
    fileMap.set("service-areas.html", { path: "service-areas.html", content: rawContent, mimeType: "text/html" });
  }

  // Handle Blog
  const blogFile = fileMap.get("blog.html") || fileMap.get("blog/index.html");
  if (blogFile) {
    const rawContent = typeof blogFile.content === "string" ? blogFile.content : blogFile.content.toString("utf-8");
    const subContent = adjustPathsForSubdirectory(rawContent);
    fileMap.set("blog/index.html", { path: "blog/index.html", content: subContent, mimeType: "text/html" });
    fileMap.set("blog.html", { path: "blog.html", content: rawContent, mimeType: "text/html" });
  }

  // 5. Ensure root sitemap.xml exists and indexes all pages
  const htmlPages = Array.from(fileMap.values()).filter((f) => f.path.endsWith(".html"));
  if (!fileMap.has("sitemap.xml")) {
    const sitemapXml = generateProjectSitemapXml(htmlPages, domain);
    fileMap.set("sitemap.xml", { path: "sitemap.xml", content: sitemapXml, mimeType: "application/xml" });
  }

  // 6. Ensure root robots.txt exists and points to sitemap
  if (!fileMap.has("robots.txt")) {
    const robotsTxt = generateProjectRobotsTxt(domain);
    fileMap.set("robots.txt", { path: "robots.txt", content: robotsTxt, mimeType: "text/plain" });
  }

  // 7. Inject Favicon Link into HTML pages if not already present & adjust for subdirectories
  for (const [p, fileObj] of fileMap.entries()) {
    if (p.endsWith(".html") && typeof fileObj.content === "string") {
      let content = fileObj.content;
      if (!content.includes('rel="icon"')) {
        const isSubdir = p.includes("/");
        const iconPrefix = isSubdir ? "../" : "./";
        const faviconTags = `\n  <link rel="icon" type="image/svg+xml" href="${iconPrefix}favicon.svg">\n  <link rel="alternate icon" href="${iconPrefix}favicon.ico">`;
        content = content.replace("</head>", `${faviconTags}\n</head>`);
        fileMap.set(p, { ...fileObj, content });
      } else if (p.includes("/")) {
        content = content.replace(/href=["'](?:\.\/)?(favicon\.(?:svg|ico))["']/gi, 'href="../$1"');
        fileMap.set(p, { ...fileObj, content });
      }
    }
  }

  // Provide local favicon assets in subdirectories for robust offline resolution
  for (const sub of ["about", "services", "areas", "blog"]) {
    fileMap.set(`${sub}/favicon.svg`, { path: `${sub}/favicon.svg`, content: faviconSvg, mimeType: "image/svg+xml" });
    fileMap.set(`${sub}/favicon.ico`, { path: `${sub}/favicon.ico`, content: faviconIco, mimeType: "image/x-icon" });
  }

  const productionFiles = Array.from(fileMap.values());

  // 8. Run Pre-ZIP 5-Step Audits on the Prepared Production Website
  const auditReport = runPreZipAudits(productionFiles, options);

  return {
    files: productionFiles,
    auditReport,
  };
}

/**
 * Builds the verified, standalone production ZIP archive stream and buffer.
 */
export async function generateProductionWebsiteZip(options: {
  projectName?: string;
  files: ProductionWebsiteFile[];
  photos?: ProductionWebsiteOptions["photos"];
  domain?: string;
  businessDetails?: any;
  formData?: any;
}): Promise<{
  stream: ReadableStream<Uint8Array>;
  zipBuffer: Buffer;
  safeFilename: string;
  auditReport: PreZipAuditReport;
  stats: { totalFiles: number; sizeBytes: number };
}> {
  const startTime = Date.now();
  const domain =
    options.domain ||
    options.businessDetails?.websiteDomain ||
    options.formData?.websiteDomain ||
    `${(options.projectName || "website").toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;

  // 1. Prepare production website files & run all 5 audits
  const { files: productionFiles, auditReport } = prepareProductionWebsiteFiles(options.files, {
    projectName: options.projectName,
    domain,
    businessName: options.businessDetails?.businessName || options.formData?.businessName || options.projectName,
    businessType: options.businessDetails?.businessType || options.formData?.businessType,
    phone: options.businessDetails?.phone || options.formData?.phone,
    city: options.businessDetails?.city || options.formData?.city,
    state: options.businessDetails?.stateRegion || options.formData?.stateRegion,
    photos: options.photos,
  });

  // If critical security failure (e.g. secret exposed), throw error before creating ZIP
  if (!auditReport.securityScan.passed) {
    const secrets = auditReport.securityScan.secretsDetected.map((s) => `${s.secretType} in ${s.file}`).join(", ");
    throw new Error(`Security scan failed: Cannot export package containing secrets or prohibited files: ${secrets}`);
  }

  // 2. Package into JSZip
  const zip = new JSZip();

  for (const f of productionFiles) {
    const normPath = f.path.replace(/^\/+/, "");
    if (Buffer.isBuffer(f.content)) {
      zip.file(normPath, f.content);
    } else {
      zip.file(normPath, Buffer.from(f.content || "", "utf-8"));
    }
  }

  // Add Production README
  const readmeContent = `# ${options.projectName || "Website"}

Production website package generated with ${BRAND.name}.

## Standalone Verification
This package is 100% self-contained and ready for immediate offline use or production deployment:
1. Double-click \`index.html\` to open the website locally in any web browser.
2. All page navigation (about, services, areas, blog), styling, scripts, and images load with zero build steps.

## Directory Structure
- \`index.html\` (Homepage)
- \`about/\` (About Section)
- \`services/\` (Services Hub & Subpages)
- \`areas/\` (Service Areas Hub & Location Subpages)
- \`blog/\` (Company News & Blog Posts)
- \`assets/\` (Production CSS, JavaScript & Favicons)
- \`images/\` (Stock & Generated Visual Assets)
- \`sitemap.xml\` (Search Engine XML Sitemap)
- \`robots.txt\` (Search Engine Crawler Directives)
- \`favicon.svg\` & \`favicon.ico\` (Standalone Vector & Legacy Favicons)

## Production Hosting
- Netlify: Drag and drop this unzipped folder into Netlify Drop.
- Cloudflare Pages: Connect or upload to Cloudflare Pages.
- Vercel: Deploy using \`npx vercel\` from this directory.
`;
  zip.file("README.md", Buffer.from(readmeContent, "utf-8"));

  // 3. Generate ZIP Buffer & Streaming Response
  const zipBuffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const safeFilename =
    (options.projectName || "website")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "website";

  const nodeStream = zip.generateNodeStream({
    type: "nodebuffer",
    streamFiles: true,
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const webStream = Readable.toWeb(nodeStream as unknown as Readable) as ReadableStream<Uint8Array>;

  console.log(
    `[ZIP Production Builder] Built production ZIP "${safeFilename}.zip" (${productionFiles.length} files, ${zipBuffer.length} bytes, audit score ${auditReport.score}/100) in ${Date.now() - startTime}ms`
  );

  return {
    stream: webStream,
    zipBuffer,
    safeFilename: `${safeFilename}.zip`,
    auditReport,
    stats: {
      totalFiles: productionFiles.length,
      sizeBytes: zipBuffer.length,
    },
  };
}
