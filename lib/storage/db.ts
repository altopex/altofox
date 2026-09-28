/**
 * Permanent IndexedDB Project Storage Engine
 * Auto-saves websites, exports/imports .siteproject bundles, generates 301 redirects,
 * and packages full or changed-only static site ZIPs.
 */

import { SavedProject, URLRedirect, ProjectChangeLogEntry } from "./project-types";
import {
  parseKeywordList,
  parseLocationList,
  formatKeywordsForStorage,
  formatLocationsForStorage,
} from "../keywords/keyword-parser";

/**
 * Normalizes project formData to ensure keywords, locations, and services are structured as clean string arrays
 * even if saved by legacy versions as single comma-separated strings.
 */
export function normalizeProjectData(project: SavedProject): SavedProject {
  if (!project) return project;
  const formData = project.formData ? { ...project.formData } : {};

  // Normalize keywords
  const rawKeywords = formData.keywords || formData.targetKeywords || [];
  const normalizedKeywords = parseKeywordList(rawKeywords);

  // Normalize locations / service areas
  const rawAreas = formData.serviceAreasList || formData.serviceAreas || formData.locations || [];
  const normalizedAreas = parseLocationList(rawAreas);

  // Normalize services
  const rawServices = formData.services || formData.servicesOffered || [];
  const normalizedServices = parseLocationList(rawServices);

  formData.keywords = normalizedKeywords;
  formData.targetKeywords = formatKeywordsForStorage(normalizedKeywords);
  formData.serviceAreasList = normalizedAreas;
  formData.locations = normalizedAreas;
  formData.serviceAreas = formatLocationsForStorage(normalizedAreas);
  if (normalizedServices.length > 0) {
    formData.services = normalizedServices;
    formData.servicesOffered = normalizedServices.join(", ");
  }

  return {
    ...project,
    formData,
  };
}

const DB_NAME = "ranklocal_projects_db";
const DB_VERSION = 1;
const STORE_NAME = "projects";

/**
 * Opens or initializes the IndexedDB database.
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      return reject(new Error("IndexedDB is only accessible in browser environment."));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

import {
  saveProjectToSupabase,
  getAllProjectsFromSupabase,
  getProjectByIdFromSupabase,
  deleteProjectFromSupabase,
} from "./supabase-project-store";

/**
 * Saves or updates a project in Supabase with IndexedDB offline fallback.
 */
export async function saveProjectToDB(project: SavedProject): Promise<void> {
  // 1. Always save to local IndexedDB for instant responsiveness and offline caching
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const updatedProject = {
        ...project,
        lastEditedAt: Date.now(),
      };
      const req = store.put(updatedProject);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (localErr) {
    console.warn("[DB] Local IndexedDB write error:", localErr);
  }

  // 2. Sync to Supabase team database
  try {
    await saveProjectToSupabase(project);
  } catch (cloudErr) {
    console.warn("[DB] Supabase cloud sync paused (will sync when online):", cloudErr);
  }
}

/**
 * Fetches all saved projects from Supabase with IndexedDB fallback.
 */
export async function getAllProjectsFromDB(): Promise<SavedProject[]> {
  try {
    const cloudProjects = await getAllProjectsFromSupabase();
    if (cloudProjects.length > 0) {
      return cloudProjects.map(normalizeProjectData);
    }
  } catch (err) {
    console.warn("[DB] Could not load from Supabase; using local cache:", err);
  }

  // Offline / local cache fallback
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => {
        const list = (req.result || []) as SavedProject[];
        list.sort((a, b) => b.lastEditedAt - a.lastEditedAt);
        resolve(list.map(normalizeProjectData));
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

/**
 * Retrieves a single project by ID (Supabase first, IndexedDB fallback).
 */
export async function getProjectByIdFromDB(id: string): Promise<SavedProject | null> {
  try {
    const cloud = await getProjectByIdFromSupabase(id);
    if (cloud) return normalizeProjectData(cloud);
  } catch (err) {
    console.warn("[DB] Supabase project fetch exception:", err);
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => {
        const res = req.result as SavedProject | undefined;
        resolve(res ? normalizeProjectData(res) : null);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

/**
 * Deletes a project by ID from Supabase and IndexedDB.
 */
export async function deleteProjectFromDB(id: string): Promise<void> {
  // Delete from Supabase
  try {
    await deleteProjectFromSupabase(id);
  } catch (err) {
    console.warn("[DB] Supabase project delete warning:", err);
  }

  // Delete from IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (localErr) {
    console.warn("[DB] Local project delete warning:", localErr);
  }
}

/**
 * Duplicates a project under a new ID and name.
 */
export async function duplicateProjectInDB(originalId: string): Promise<SavedProject> {
  const orig = await getProjectByIdFromDB(originalId);
  if (!orig) throw new Error("Project not found to duplicate.");

  const newId = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const duplicated: SavedProject = {
    ...orig,
    id: newId,
    name: `${orig.name} (Copy)`,
    createdAt: Date.now(),
    lastEditedAt: Date.now(),
    changeLog: [
      {
        id: `log-${Date.now()}`,
        timestamp: Date.now(),
        dateStr: new Date().toLocaleDateString(),
        summary: `Duplicated from ${orig.name}`,
        affectedPages: [],
      },
    ],
  };

  await saveProjectToDB(duplicated);
  return duplicated;
}

/**
 * Generates server redirect files (_redirects for Netlify, .htaccess for Apache, and redirects.txt).
 */
export function generateRedirectFiles(redirects: URLRedirect[]): {
  netlifyRedirects: string;
  htaccess: string;
  plainList: string;
} {
  const validRedirects = (Array.isArray(redirects) ? redirects : [])
    .map((r: any) => {
      const oldUrl = typeof r?.oldUrl === "string" ? r.oldUrl : typeof r?.from === "string" ? r.from : "";
      const newUrl = typeof r?.newUrl === "string" ? r.newUrl : typeof r?.to === "string" ? r.to : "/";
      const code = r?.code || r?.statusCode || 301;
      return { oldUrl, newUrl, code };
    })
    .filter((r) => r.oldUrl.trim() !== "");

  const netlify = validRedirects.map((r) => `${r.oldUrl} ${r.newUrl} ${r.code}!`).join("\n");
  const htaccess = `
RewriteEngine On
${validRedirects
  .map((r) => {
    const from = r.oldUrl.replace(/^\//, "");
    return `RewriteRule ^${from}$ ${r.newUrl} [R=${r.code},L]`;
  })
  .join("\n")}
`.trim();

  const plainList = validRedirects.map((r) => `${r.oldUrl} -> ${r.newUrl} (${r.code})`).join("\n");

  return {
    netlifyRedirects: netlify,
    htaccess,
    plainList,
  };
}

async function getJSZip() {
  const mod = await import("jszip");
  return (mod as any).default?.default || (mod as any).default || mod;
}

/**
 * Exports a project as a downloadable `.siteproject` ZIP containing project.json.
 */
export async function exportProjectBackup(project: SavedProject): Promise<Blob> {
  const JSZip = await getJSZip();
  const zip = new JSZip();
  const backupData = {
    version: "1.0",
    exportedAt: Date.now(),
    project,
  };
  zip.file("project.json", JSON.stringify(backupData, null, 2));

  // Also include any images
  const imgFolder = zip.folder("images");
  if (imgFolder && Array.isArray(project.files)) {
    for (const f of project.files) {
      if (f.path.startsWith("images/")) {
        imgFolder.file(f.path.replace(/^images\//, ""), f.content);
      }
    }
  }

  return await zip.generateAsync({ type: "blob" });
}

/**
 * Imports a project from an uploaded `.siteproject` ZIP file.
 */
export async function importProjectBackup(file: File): Promise<SavedProject> {
  const JSZip = await getJSZip();
  const zip = await JSZip.loadAsync(file);
  const projFile = zip.file("project.json");
  if (!projFile) {
    throw new Error("Invalid .siteproject archive: missing project.json.");
  }

  const jsonText = await projFile.async("string");
  const parsed = JSON.parse(jsonText);
  const project: SavedProject = parsed.project || parsed;

  // Assign a fresh ID to avoid collisions
  project.id = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  project.name = `${project.name} (Restored)`;
  project.lastEditedAt = Date.now();

  await saveProjectToDB(project);
  return project;
}

/**
 * Creates a downloadable website ZIP:
 * - Full Website ZIP: includes all files, sitemap, and redirects.
 * - Changed Files Only ZIP: only includes files modified after `sinceTimestamp`.
 */
export async function generateWebsiteZIP(
  project: SavedProject,
  mode: "full" | "changed-only" = "full",
  sinceTimestamp?: number,
  optimize: boolean = false
): Promise<{ blob: Blob; changedFilesCount: number; changedFilePaths: string[]; validation?: any }> {
  const JSZip = await getJSZip();
  const {
    generateProjectSitemapXml,
    generateProjectRobotsTxt,
  } = await import("../export/optimizer");
  const { validateWebsiteFiles } = await import("../export/zip-validator");
  const zip = new JSZip();
  const redirects = generateRedirectFiles(project?.redirects || []);

  const changedFilePaths: string[] = [];
  const referenceTime = sinceTimestamp || project?.lastDownloadedAt || 0;
  const files = Array.isArray(project?.files) ? project.files : [];

  const rawDomain =
    project?.businessDetails?.websiteDomain ||
    project?.formData?.websiteDomain ||
    `${(project?.name || "website").toLowerCase().replace(/[^a-z0-9]/g, "")}.com`;
  const domain = rawDomain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");

  for (const f of files) {
    if (!f || !f.path) continue;
    const isChanged = !referenceTime || (f.lastModified && f.lastModified > referenceTime);
    if (mode === "full" || isChanged) {
      const ext = f.path.split(".").pop()?.toLowerCase() || "";
      const isText = ["html", "css", "js", "json", "txt", "xml", "svg", "md"].includes(ext);

      if (isText) {
        // Use exact file content for 100% Preview <-> Download ZIP parity
        zip.file(f.path, f.content || "");
      } else {
        const raw = f.content || "";
        if (typeof raw === "string" && raw.startsWith("data:") && raw.includes(";base64,")) {
          const b64 = raw.split(";base64,")[1];
          zip.file(f.path, b64, { base64: true });
        } else {
          zip.file(f.path, raw);
        }
      }

      if (isChanged) {
        changedFilePaths.push(f.path);
      }
    }
  }

  // Include clean README.md
  if (!zip.file("README.md")) {
    zip.file(
      "README.md",
      `# ${project?.name || "Website"}\n\nGenerated with Rank Local Static Website Builder.\n\n## How to Open\nDouble-click \`index.html\` to open your website in any browser.\nAll relative page links, stylesheets, and assets are self-contained with zero build step required.\n`
    );
  }

  // Always include redirects in full and changed ZIPs
  if (project?.redirects && project.redirects.length > 0) {
    zip.file("_redirects", redirects.netlifyRedirects);
    zip.file(".htaccess", redirects.htaccess);
    zip.file("redirects.txt", redirects.plainList);
  }

  // Always ensure sitemap.xml is included
  if (!zip.file("sitemap.xml")) {
    const sitemapFile = files.find((f) => f && f.path === "sitemap.xml");
    if (sitemapFile && sitemapFile.content) {
      zip.file("sitemap.xml", sitemapFile.content);
    } else {
      zip.file("sitemap.xml", generateProjectSitemapXml(files, domain));
    }
  }

  // Always ensure robots.txt is included
  if (!zip.file("robots.txt")) {
    const robotsFile = files.find((f) => f && f.path === "robots.txt");
    if (robotsFile && robotsFile.content) {
      zip.file("robots.txt", robotsFile.content);
    } else {
      zip.file("robots.txt", generateProjectRobotsTxt(domain));
    }
  }

  // Extract all files currently staged in zip to run validation
  const packagedFiles: Array<{ path: string; content: string | Buffer }> = [];
  for (const path of Object.keys(zip.files)) {
    const entry = zip.files[path];
    if (entry && !entry.dir) {
      const orig = files.find((f) => f.path === path);
      if (orig && orig.content) {
        packagedFiles.push({ path, content: orig.content });
      } else {
        const ext = path.split(".").pop()?.toLowerCase() || "";
        const isText = ["html", "css", "js", "json", "txt", "xml", "svg", "md"].includes(ext);
        if (isText) {
          const text = await entry.async("string");
          packagedFiles.push({ path, content: text });
        } else {
          const u8 = await entry.async("uint8array");
          packagedFiles.push({ path, content: Buffer.from(u8) });
        }
      }
    }
  }

  const validation = validateWebsiteFiles({
    files: packagedFiles,
    expectedPages: files.filter((f) => f.path.endsWith(".html")).map((f) => f.path),
    domain,
  });

  const blob = await Promise.race([
    zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 4 },
    }),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("Static website package generation timed out after 20 seconds")), 20000)
    ),
  ]);

  return {
    blob,
    changedFilesCount: changedFilePaths.length,
    changedFilePaths,
    validation,
  };
}
