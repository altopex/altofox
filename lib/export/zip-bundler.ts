import {
  generateProductionWebsiteZip,
  ProductionWebsiteFile,
  PreZipAuditReport,
} from "./zip-production-builder";
import { generateSvgImageFallback } from "./preview-renderer";

export interface BundlerFile {
  path: string;
  content: string | Buffer;
  mimeType?: string | null;
}

export interface BundlerPhoto {
  remoteUrl?: string;
  url?: string;
  downloadUrl?: string;
  localPath: string;
  localWebpPath?: string;
  slot?: string;
}

export interface ZipBundlerOptions {
  projectId?: string;
  projectName: string;
  files: BundlerFile[];
  photos?: BundlerPhoto[];
  provider?: string;
  model?: string;
  createdAt?: Date | string;
  domain?: string;
  businessDetails?: any;
  formData?: any;
}

/**
 * Asynchronously bundles static website project files into a verified production streaming ZIP archive.
 * Strictly adheres to production specifications:
 * 1. Contains ONLY the production website:
 *    - index.html
 *    - about/ (index.html)
 *    - services/ (index.html)
 *    - areas/ (index.html)
 *    - blog/ (index.html)
 *    - assets/ (style.css, script.js, favicon.svg, favicon.ico)
 *    - images/ (project visual assets)
 *    - sitemap.xml
 *    - robots.txt
 *    - favicon (favicon.ico and favicon.svg)
 * 2. Strictly EXCLUDES API keys, Supabase secrets, AI provider credentials, deployment tokens,
 *    internal logs, debug files, temporary files, and admin data.
 * 3. Executes 5 mandatory pre-ZIP audits:
 *    - Step 1: Security scan
 *    - Step 2: Broken-link audit
 *    - Step 3: Missing-asset audit
 *    - Step 4: SEO audit
 *    - Step 5: Confirm required files exist
 * 4. Yields a 100% standalone static website that can be extracted and opened by double-clicking index.html.
 */
export async function bundleProjectToZipStream(options: ZipBundlerOptions): Promise<{
  stream: ReadableStream<Uint8Array>;
  safeFilename: string;
  stats: { totalFiles: number; omittedAssets: number };
  auditReport: PreZipAuditReport;
}> {
  const startTime = Date.now();
  console.log(
    `[ZIP Production Export] Starting archive generation for "${options.projectName}" (ID: ${options.projectId || "in-memory"}) with ${options.files?.length || 0} initial files`
  );

  const rawDomain =
    options.domain ||
    options.businessDetails?.websiteDomain ||
    options.formData?.websiteDomain ||
    `${(options.projectName || "website").toLowerCase().replace(/[^a-z0-9]/g, "") || "website"}.com`;
  const domain = rawDomain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  const workingFiles: ProductionWebsiteFile[] = (options.files || []).map((f) => ({
    path: f.path.replace(/^\/+/, ""),
    content: f.content,
    mimeType: f.mimeType,
  }));

  const existingPaths = new Set<string>(workingFiles.map((f) => f.path.toLowerCase()));
  let omittedCount = 0;

  // 1. Resolve and fetch any remote images needed for production packaging
  const remoteImagesToFetch: Array<{ url: string; localPath: string; altText?: string }> = [];

  if (Array.isArray(options.photos)) {
    for (const p of options.photos) {
      const url = p.downloadUrl || p.remoteUrl || p.url;
      if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
        const localPath = p.localPath.replace(/^\/+/, "");
        if (!existingPaths.has(localPath.toLowerCase())) {
          remoteImagesToFetch.push({ url, localPath });
        }
      }
    }
  }

  // Also check HTML files for unbundled images with data-remote-src
  for (const file of workingFiles) {
    if (!file.path.endsWith(".html")) continue;
    const content = typeof file.content === "string" ? file.content : file.content.toString("utf-8");

    const imgRegex = /<img[^>]*?src=["'](images\/[^"']+)["'][^>]*?data-remote-src=["']([^"']+)["'][^>]*?>/gi;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      const localPath = match[1].replace(/^\/+/, "");
      const remoteUrl = match[2];
      if (!existingPaths.has(localPath.toLowerCase()) && (remoteUrl.startsWith("http://") || remoteUrl.startsWith("https://"))) {
        if (!remoteImagesToFetch.some((r) => r.localPath === localPath)) {
          remoteImagesToFetch.push({ url: remoteUrl, localPath });
        }
      }
    }
  }

  // Fetch remote images in small batches with strict timeouts
  const BATCH_SIZE = 5;
  for (let i = 0; i < remoteImagesToFetch.length; i += BATCH_SIZE) {
    const batch = remoteImagesToFetch.slice(i, i + BATCH_SIZE);
    await Promise.all(
      batch.map(async (item) => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 6000);

          const res = await fetch(item.url, {
            signal: controller.signal,
            headers: {
              "User-Agent": "Mozilla/5.0 (compatible; RankLocalBuilder/1.0)",
            },
          });
          clearTimeout(timeoutId);

          if (res.ok) {
            const arrayBuffer = await res.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            if (buffer.length > 0) {
              workingFiles.push({
                path: item.localPath,
                content: buffer,
                mimeType: item.localPath.endsWith(".svg") ? "image/svg+xml" : "image/jpeg",
              });
              existingPaths.add(item.localPath.toLowerCase());
            }
          } else {
            // Provide clean SVG fallback so ZIP never has broken images
            const fallbackSvg = generateSvgImageFallback(item.localPath.replace(/^images\//, "").replace(/\.[^.]+$/, ""));
            const svgPath = item.localPath.replace(/\.(jpg|jpeg|png|webp)$/i, ".svg");
            workingFiles.push({
              path: svgPath,
              content: fallbackSvg,
              mimeType: "image/svg+xml",
            });
            omittedCount++;
          }
        } catch {
          // Provide clean SVG fallback so ZIP never has broken images
          const fallbackSvg = generateSvgImageFallback(item.localPath.replace(/^images\//, "").replace(/\.[^.]+$/, ""));
          const svgPath = item.localPath.replace(/\.(jpg|jpeg|png|webp)$/i, ".svg");
          workingFiles.push({
            path: svgPath,
            content: fallbackSvg,
            mimeType: "image/svg+xml",
          });
          omittedCount++;
        }
      })
    );
  }

  // 2. Generate the verified production website ZIP (includes all 5 pre-ZIP audits)
  const result = await generateProductionWebsiteZip({
    projectName: options.projectName,
    files: workingFiles,
    domain,
    businessDetails: options.businessDetails,
    formData: options.formData,
    photos: options.photos,
  });

  console.log(
    `[ZIP Production Export] Completed in ${Date.now() - startTime}ms (${result.stats.totalFiles} files, ${omittedCount} assets resolved with fallback)`
  );

  return {
    stream: result.stream,
    safeFilename: result.safeFilename,
    stats: {
      totalFiles: result.stats.totalFiles,
      omittedAssets: omittedCount,
    },
    auditReport: result.auditReport,
  };
}
