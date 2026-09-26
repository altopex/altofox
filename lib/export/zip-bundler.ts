import JSZip from "jszip";
import { Readable } from "stream";
import { BRAND } from "@/config/brand";
import {
  optimizeStaticFile,
  generateRobotsTxt,
  generateProjectSitemapXml,
  generateProjectRobotsTxt,
  minifyCss,
  ExportSeoOptions,
} from "@/lib/export/optimizer";

export interface BundlerFile {
  path: string;
  content: string;
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
 * Asynchronously bundles static website project files into a high-performance streaming ZIP archive.
 * Follows streaming standards to prevent memory exhaustion on large websites.
 * Gracefully omits non-critical missing assets so the user always gets a valid ZIP package.
 */
export async function bundleProjectToZipStream(options: ZipBundlerOptions): Promise<{
  stream: ReadableStream<Uint8Array>;
  safeFilename: string;
  stats: { totalFiles: number; omittedAssets: number };
}> {
  const startTime = Date.now();
  const zip = new JSZip();
  let fileCount = 0;
  let omittedCount = 0;

  console.log(`[ZIP Export] Starting archive generation for "${options.projectName}" (ID: ${options.projectId || "in-memory"}) with ${options.files?.length || 0} files`);

  // Track existing paths to avoid duplicates
  const addedPaths = new Set<string>();

  // Determine canonical domain
  const rawDomain =
    options.domain ||
    options.businessDetails?.websiteDomain ||
    options.formData?.websiteDomain ||
    `${options.projectName.toLowerCase().replace(/[^a-z0-9]/g, "") || "website"}.com`;
  const domain = rawDomain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  const files = Array.isArray(options.files) ? options.files : [];

  // Extract critical CSS from styles.css if present to inline into HTML <head>
  const stylesFile = files.find((f) => f && (f.path === "styles.css" || f.path === "style.css" || f.path === "css/styles.css"));
  const criticalCss = stylesFile?.content ? minifyCss(stylesFile.content).slice(0, 35000) : undefined;

  // 1. Process and append all project files (HTML, CSS, JS, JSON, etc.)
  for (const file of files) {
    if (!file || !file.path) continue;

    try {
      const normalizedPath = file.path.replace(/^\/+/, "");
      const ext = normalizedPath.split(".").pop()?.toLowerCase() || "";
      const isTextFile = ["html", "css", "js", "json", "txt", "xml", "svg", "md"].includes(ext);

      if (isTextFile) {
        // Build Google SEO options for HTML files
        let seoOpts: ExportSeoOptions | undefined = undefined;
        if (ext === "html" || ext === "htm") {
          seoOpts = {
            pagePath: normalizedPath,
            projectName: options.projectName,
            domain,
            businessName: options.businessDetails?.businessName || options.formData?.businessName || options.projectName,
            businessType: options.businessDetails?.businessType || options.formData?.businessType,
            phone: options.businessDetails?.phone || options.formData?.phone,
            email: options.businessDetails?.email || options.formData?.email,
            city: options.businessDetails?.city || options.formData?.city,
            state: options.businessDetails?.stateRegion || options.formData?.stateRegion,
            address: options.businessDetails?.streetAddress || options.formData?.streetAddress,
            zipCode: options.businessDetails?.zipPostalCode || options.formData?.zipPostalCode,
            serviceAreaCities: Array.isArray(options.businessDetails?.serviceAreaCities)
              ? options.businessDetails.serviceAreaCities
              : (options.formData?.cities || []),
            description: options.businessDetails?.description || options.formData?.description,
            criticalCss,
          };
        }

        // Optimize text files (HTML SEO & minification, CSS/JS minification)
        const optimizedContent = optimizeStaticFile(normalizedPath, file.content || "", seoOpts);
        const buffer = Buffer.from(optimizedContent, "utf-8");
        zip.file(normalizedPath, buffer);
      } else {
        // Handle binary assets (e.g. data URI or base64)
        const rawContent = file.content || "";
        if (rawContent.startsWith("data:") && rawContent.includes(";base64,")) {
          const base64Data = rawContent.split(";base64,")[1];
          const buffer = Buffer.from(base64Data, "base64");
          zip.file(normalizedPath, buffer);
        } else if (/^[A-Za-z0-9+/=]+$/.test(rawContent) && rawContent.length > 100) {
          // Plain base64 string
          const buffer = Buffer.from(rawContent, "base64");
          zip.file(normalizedPath, buffer);
        } else {
          // Standard buffer or string fallback
          const buffer = Buffer.from(rawContent, "utf-8");
          zip.file(normalizedPath, buffer);
        }
      }

      addedPaths.add(normalizedPath);
      fileCount++;
    } catch (fileErr: any) {
      console.warn(`[ZIP Export] Non-critical error processing file "${file.path}":`, fileErr?.message || fileErr);
      omittedCount++;
    }
  }

  // 2. Automatically generate sitemap.xml if missing
  if (!addedPaths.has("sitemap.xml")) {
    try {
      const sitemapContent = generateProjectSitemapXml(files, domain);
      zip.file("sitemap.xml", Buffer.from(sitemapContent, "utf-8"));
      addedPaths.add("sitemap.xml");
      fileCount++;
    } catch (sitemapErr) {
      console.warn("[ZIP Export] Could not generate sitemap.xml:", sitemapErr);
    }
  }

  // 3. Automatically generate robots.txt if missing
  if (!addedPaths.has("robots.txt")) {
    try {
      const robotsContent = generateProjectRobotsTxt(domain);
      zip.file("robots.txt", Buffer.from(robotsContent, "utf-8"));
      addedPaths.add("robots.txt");
      fileCount++;
    } catch (robotsErr) {
      console.warn("[ZIP Export] Could not generate default robots.txt:", robotsErr);
    }
  }

  // 3. Add clean production README
  if (!addedPaths.has("README.md")) {
    try {
      const readmeContent = `# ${options.projectName}

Static website generated with ${BRAND.name} Static Website Builder.
AI Model: ${(options.provider || "anthropic").toUpperCase()} (${options.model || "standard"})
Generated at: ${options.createdAt ? new Date(options.createdAt).toISOString() : new Date().toISOString()}

## How to Run & Preview Locally
No build tools, Node.js, or complex servers are required!
1. Double-click \`index.html\` to open the website in Google Chrome, Safari, Firefox, or Edge.
2. If opening directly causes local asset restrictions in certain browsers, you can use any static server:
   - Python: \`python3 -m http.server 8000\`
   - VS Code: Open with the "Live Server" extension
   - Node: \`npx serve .\`

## 1-Click Production Deploy
- **Netlify**: Drag and drop this unzipped folder into Netlify Drop (https://app.netlify.com/drop).
- **Vercel**: Import this folder or deploy with \`npx vercel\`.
- **Cloudflare Pages**: Connect or upload this folder to Cloudflare Pages.
`;
      zip.file("README.md", Buffer.from(readmeContent, "utf-8"));
      addedPaths.add("README.md");
      fileCount++;
    } catch (readmeErr) {
      console.warn("[ZIP Export] Could not add README.md:", readmeErr);
    }
  }

  // 4. Resolve local and remote images gracefully
  const remoteImagesToFetch: Array<{ url: string; localPath: string }> = [];

  // A. Check explicit photos in options
  if (Array.isArray(options.photos)) {
    for (const p of options.photos) {
      const url = p.downloadUrl || p.remoteUrl || p.url;
      if (url && (url.startsWith("http://") || url.startsWith("https://"))) {
        const localPath = p.localPath.replace(/^\/+/, "");
        if (!addedPaths.has(localPath)) {
          remoteImagesToFetch.push({ url, localPath });
        }
      }
    }
  }

  // B. Scan HTML files for unbundled images with data-remote-src or data-bg-remote
  for (const file of files) {
    if (!file || !file.path || !file.path.endsWith(".html")) continue;
    const content = file.content || "";

    const imgRegex = /<img[^>]*?src=["'](images\/[^"']+)["'][^>]*?data-remote-src=["']([^"']+)["'][^>]*?>/gi;
    let match;
    while ((match = imgRegex.exec(content)) !== null) {
      const localPath = match[1].replace(/^\/+/, "");
      const remoteUrl = match[2];
      if (!addedPaths.has(localPath) && (remoteUrl.startsWith("http://") || remoteUrl.startsWith("https://"))) {
        if (!remoteImagesToFetch.some((r) => r.localPath === localPath)) {
          remoteImagesToFetch.push({ url: remoteUrl, localPath });
        }
      }
    }

    const bgRegex = /style=["']background-image:\s*url\(['"](images\/[^'"]+)['"]\);["'][^>]*?data-bg-remote=["']([^"']+)["']/gi;
    let bgMatch;
    while ((bgMatch = bgRegex.exec(content)) !== null) {
      const localPath = bgMatch[1].replace(/^\/+/, "");
      const remoteUrl = bgMatch[2];
      if (!addedPaths.has(localPath) && (remoteUrl.startsWith("http://") || remoteUrl.startsWith("https://"))) {
        if (!remoteImagesToFetch.some((r) => r.localPath === localPath)) {
          remoteImagesToFetch.push({ url: remoteUrl, localPath });
        }
      }
    }
  }

  // Fetch remote images concurrently in small batches with strict timeouts
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
              zip.file(item.localPath, buffer);
              addedPaths.add(item.localPath);
              fileCount++;
            }
          } else {
            console.warn(`[ZIP Export] Remote image returned HTTP ${res.status}, omitting: ${item.url}`);
            omittedCount++;
          }
        } catch (fetchErr: any) {
          console.warn(`[ZIP Export] Failed to fetch non-critical image "${item.localPath}" (${item.url}), omitting:`, fetchErr?.message || fetchErr);
          omittedCount++;
          // Fall back gracefully - omitting non-critical image
        }
      })
    );
  }

  // 5. Build safe download filename
  const safeFilename =
    (options.projectName || "website")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "website";

  // 6. Generate asynchronous streaming response
  const nodeStream = zip.generateNodeStream({
    type: "nodebuffer",
    streamFiles: true,
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  const webStream = Readable.toWeb(nodeStream as unknown as Readable) as ReadableStream<Uint8Array>;

  console.log(`[ZIP Export] Package generated successfully in ${Date.now() - startTime}ms (${fileCount} files included, ${omittedCount} non-critical assets omitted)`);

  return {
    stream: webStream,
    safeFilename: `${safeFilename}.zip`,
    stats: {
      totalFiles: fileCount,
      omittedAssets: omittedCount,
    },
  };
}
