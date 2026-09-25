/**
 * Permanent IndexedDB Project Storage Engine
 * Auto-saves websites, exports/imports .siteproject bundles, generates 301 redirects,
 * and packages full or changed-only static site ZIPs.
 */

import { SavedProject, URLRedirect, ProjectChangeLogEntry } from "./project-types";
import JSZip from "jszip";

const DB_NAME = "altofox_projects_db";
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
      return cloudProjects;
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
        resolve(list);
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
    if (cloud) return cloud;
  } catch (err) {
    console.warn("[DB] Supabase project fetch exception:", err);
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result || null);
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
  const netlify = redirects.map((r) => `${r.oldUrl} ${r.newUrl} ${r.code}!`).join("\n");
  const htaccess = `
RewriteEngine On
${redirects
  .map((r) => {
    const from = r.oldUrl.replace(/^\//, "");
    return `RewriteRule ^${from}$ ${r.newUrl} [R=${r.code},L]`;
  })
  .join("\n")}
`.trim();

  const plainList = redirects.map((r) => `${r.oldUrl} -> ${r.newUrl} (${r.code})`).join("\n");

  return {
    netlifyRedirects: netlify,
    htaccess,
    plainList,
  };
}

/**
 * Exports a project as a downloadable `.siteproject` ZIP containing project.json.
 */
export async function exportProjectBackup(project: SavedProject): Promise<Blob> {
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
  sinceTimestamp?: number
): Promise<{ blob: Blob; changedFilesCount: number; changedFilePaths: string[] }> {
  const zip = new JSZip();
  const redirects = generateRedirectFiles(project.redirects || []);

  const changedFilePaths: string[] = [];
  const referenceTime = sinceTimestamp || project.lastDownloadedAt || 0;

  for (const f of project.files) {
    const isChanged = !referenceTime || (f.lastModified && f.lastModified > referenceTime);
    if (mode === "full" || isChanged) {
      zip.file(f.path, f.content);
      if (isChanged) {
        changedFilePaths.push(f.path);
      }
    }
  }

  // Always include redirects & sitemap in both full and changed ZIPs
  if (project.redirects && project.redirects.length > 0) {
    zip.file("_redirects", redirects.netlifyRedirects);
    zip.file(".htaccess", redirects.htaccess);
    zip.file("redirects.txt", redirects.plainList);
  }

  // Always ensure sitemap is included
  const sitemap = project.files.find((f) => f.path === "sitemap.xml");
  if (sitemap && !zip.file("sitemap.xml")) {
    zip.file("sitemap.xml", sitemap.content);
  }

  const blob = await zip.generateAsync({ type: "blob" });
  return {
    blob,
    changedFilesCount: changedFilePaths.length,
    changedFilePaths,
  };
}
