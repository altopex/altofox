import { NextRequest, NextResponse } from "next/server";
import {
  deployToCloudflarePages,
  PublishFileInput,
  sanitizePagesProjectName,
} from "@/lib/cloudflare/cloudflare-service";
import { buildCanonicalWebsiteFiles } from "@/lib/export/canonical-files";
import { tempStorage } from "@/lib/storage/temp-storage";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      projectName: rawProjectName,
      projectId,
      files: clientFiles,
      photos,
      branch = "main",
      domain,
    } = body || {};

    if (!rawProjectName || typeof rawProjectName !== "string" || !rawProjectName.trim()) {
      return NextResponse.json(
        { success: false, error: "Cloudflare project name is required." },
        { status: 400 }
      );
    }

    const cleanProjectName = sanitizePagesProjectName(rawProjectName);

    // 1. Gather raw website files
    let rawFiles: Array<{ path: string; content: string }> = [];

    if (Array.isArray(clientFiles) && clientFiles.length > 0) {
      rawFiles = clientFiles.map((f: any) => ({
        path: f.path,
        content: typeof f.content === "string" ? f.content : "",
      }));
    } else if (projectId) {
      // Check ephemeral temporary storage
      const tempProject = tempStorage.get(projectId);
      if (tempProject?.files && tempProject.files.length > 0) {
        rawFiles = tempProject.files.map((f: any) => ({
          path: f.path,
          content: typeof f.content === "string" ? f.content : "",
        }));
      } else {
        // Check SQLite Database
        const dbProject = await db.project.findUnique({
          where: { id: projectId },
          include: { files: true },
        });
        if (dbProject?.files && dbProject.files.length > 0) {
          rawFiles = dbProject.files.map((f: any) => ({
            path: f.path,
            content: f.content || "",
          }));
        }
      }
    }

    if (rawFiles.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: "No website files found to publish. Please generate or open a website first.",
        },
        { status: 400 }
      );
    }

    // 2. Build canonical website files (sitemap.xml, robots.txt, canonical headers)
    const canonical = buildCanonicalWebsiteFiles(rawFiles, {
      projectName: cleanProjectName,
      domain: domain || undefined,
    });

    const deployFilesMap = new Map<string, PublishFileInput>();
    for (const f of canonical.files) {
      if (!f?.path) continue;
      const normalizedPath = f.path.replace(/^\/+/, "");
      deployFilesMap.set(normalizedPath, {
        path: normalizedPath,
        content: f.content,
      });
    }

    // 3. Resolve any missing photos
    const photosToFetch: Array<{ url: string; localPath: string }> = [];
    const seenPhotoPaths = new Set<string>();

    if (Array.isArray(photos)) {
      for (const p of photos) {
        const pUrl = p.downloadUrl || p.remoteUrl || p.url;
        if (pUrl && (pUrl.startsWith("http://") || pUrl.startsWith("https://"))) {
          const lPath = (p.localPath || "").replace(/^\/+/, "");
          if (lPath && !deployFilesMap.has(lPath) && !seenPhotoPaths.has(lPath)) {
            seenPhotoPaths.add(lPath);
            photosToFetch.push({ url: pUrl, localPath: lPath });
          }
        }
      }
    }

    // Also scan HTML files for any images with data-remote-src
    for (const f of rawFiles) {
      if (!f.path.endsWith(".html")) continue;
      const imgRegex = /<img[^>]*?src=["'](images\/[^"']+)["'][^>]*?data-remote-src=["']([^"']+)["'][^>]*?>/gi;
      let match;
      while ((match = imgRegex.exec(f.content)) !== null) {
        const localPath = match[1].replace(/^\/+/, "");
        const remoteUrl = match[2];
        if (
          remoteUrl &&
          (remoteUrl.startsWith("http://") || remoteUrl.startsWith("https://")) &&
          !deployFilesMap.has(localPath) &&
          !seenPhotoPaths.has(localPath)
        ) {
          seenPhotoPaths.add(localPath);
          photosToFetch.push({ url: remoteUrl, localPath });
        }
      }
    }

    // Fetch photos concurrently with a 6-second timeout per photo
    if (photosToFetch.length > 0) {
      await Promise.allSettled(
        photosToFetch.map(async (item) => {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 6000);
            const res = await fetch(item.url, { signal: controller.signal });
            clearTimeout(timeoutId);
            if (res.ok) {
              const arrayBuf = await res.arrayBuffer();
              const buf = Buffer.from(arrayBuf);
              deployFilesMap.set(item.localPath, {
                path: item.localPath,
                content: buf,
              });
            }
          } catch {
            // Non-critical photo fetch failure; continue publishing
          }
        })
      );
    }

    const deployFiles = Array.from(deployFilesMap.values());

    // 4. Deploy directly to Cloudflare Pages via Wrangler deployment engine
    const publishResult = await deployToCloudflarePages({
      projectName: cleanProjectName,
      files: deployFiles,
      branch,
    });

    // 5. Update project metadata (Category B) with publishing record if projectId exists
    if (projectId) {
      try {
        const dbProject = await db.project.findUnique({ where: { id: projectId } });
        if (dbProject) {
          let notesObj: any = {};
          try {
            if (dbProject.notes) notesObj = JSON.parse(dbProject.notes);
          } catch {}

          notesObj.cloudflareProject = cleanProjectName;
          notesObj.liveUrl = publishResult.liveUrl;
          notesObj.lastPublishedAt = publishResult.publishedAt;

          await db.project.update({
            where: { id: projectId },
            data: {
              notes: JSON.stringify(notesObj),
              updatedAt: new Date(),
            },
          });
        }
      } catch (e) {
        console.warn("[Cloudflare Publish API] Failed to update project notes with publish info:", e);
      }
    }

    return NextResponse.json({
      ...publishResult,
    });
  } catch (error: any) {
    console.error("[Cloudflare Publish API] Deployment error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to publish website to Cloudflare Pages.",
      },
      { status: 500 }
    );
  }
}
