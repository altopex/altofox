import { generateProjectSitemapXml, generateProjectRobotsTxt } from "./optimizer";
import { validateWebsiteFiles, ZipValidationResult } from "./zip-validator";

export interface CanonicalFileItem {
  path: string;
  content: string;
  mimeType?: string | null;
  size?: number;
  lastModified?: number;
}

export interface CanonicalWebsiteOptions {
  projectName?: string;
  domain?: string;
  businessName?: string;
  phone?: string;
  city?: string;
}

/**
 * Prepares the single canonical file set for a website project.
 * Both Preview and ZIP Export MUST consume this identical file set.
 * Guarantees zero divergence between what the user previews and what is downloaded.
 */
export function buildCanonicalWebsiteFiles(
  inputFiles: Array<{ path: string; content: string; mimeType?: string | null; size?: number; lastModified?: number }>,
  options: CanonicalWebsiteOptions = {}
): {
  files: CanonicalFileItem[];
  validation: ZipValidationResult;
} {
  const fileMap = new Map<string, CanonicalFileItem>();
  const normalizedDomain = (options.domain || `${(options.projectName || "website").toLowerCase().replace(/[^a-z0-9]/g, "")}.com`)
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");

  // 1. Ingest input files with normalized paths
  for (const f of inputFiles) {
    if (!f || !f.path) continue;
    const normPath = f.path.replace(/^\/+/, "");
    fileMap.set(normPath, {
      path: normPath,
      content: f.content || "",
      mimeType: f.mimeType,
      size: typeof f.content === "string" ? f.content.length : 0,
      lastModified: f.lastModified || Date.now(),
    });
  }

  // 2. Ensure sitemap.xml exists and indexes all HTML pages
  if (!fileMap.has("sitemap.xml")) {
    const htmlFiles = Array.from(fileMap.values()).filter((f) => f.path.endsWith(".html"));
    const sitemapContent = generateProjectSitemapXml(htmlFiles, normalizedDomain);
    fileMap.set("sitemap.xml", {
      path: "sitemap.xml",
      content: sitemapContent,
      mimeType: "application/xml",
      size: sitemapContent.length,
      lastModified: Date.now(),
    });
  }

  // 3. Ensure robots.txt exists and points to sitemap.xml
  if (!fileMap.has("robots.txt")) {
    const robotsContent = generateProjectRobotsTxt(normalizedDomain);
    fileMap.set("robots.txt", {
      path: "robots.txt",
      content: robotsContent,
      mimeType: "text/plain",
      size: robotsContent.length,
      lastModified: Date.now(),
    });
  }

  const finalFiles = Array.from(fileMap.values());

  // 4. Run automated 18-rule validation against this exact file set
  const validation = validateWebsiteFiles({
    files: finalFiles,
    expectedPages: finalFiles.filter((f) => f.path.endsWith(".html")).map((f) => f.path),
    expectedPhone: options.phone,
    domain: normalizedDomain,
  });

  return {
    files: finalFiles,
    validation,
  };
}
