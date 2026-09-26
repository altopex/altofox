import JSZip from "jszip";
import { Readable } from "stream";
import { BRAND } from "@/config/brand";
import { optimizeStaticFile, generateRobotsTxt } from "@/lib/export/optimizer";

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

  // 1. Process and append all project files (HTML, CSS, JS, JSON, etc.)
  const files = Array.isArray(options.files) ? options.files : [];
  for (const file of files) {
    if (!file || !file.path) continue;

    try {
      const normalizedPath = file.path.replace(/^\/+/, "");
      const ext = normalizedPath.split(".").pop()?.toLowerCase() || "";
      const isTextFile = ["html", "css", "js", "json", "txt", "xml", "svg", "md"].includes(ext);

      if (isTextFile) {
        // Optimize text files (HTML, CSS, JS minification)
        const optimizedContent = optimizeStaticFile(normalizedPath, file.content || "");
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

  // 2. Automatically generate robots.txt if missing
  if (!addedPaths.has("robots.txt")) {
    try {
      const domain = `${options.projectName.toLowerCase().replace(/[^a-z0-9]/g, "") || "website"}.com`;
      const robotsContent = generateRobotsTxt(domain);
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
