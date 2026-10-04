import { generateProjectSitemapXml, generateProjectRobotsTxt } from "./optimizer";
import { validateWebsiteFiles, ZipValidationResult } from "./zip-validator";
import {
  prepareProductionWebsiteFiles,
  PreZipAuditReport,
} from "./zip-production-builder";

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
  primaryColor?: string;
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
  preZipAudit: PreZipAuditReport;
} {
  const normalizedDomain = (options.domain || `${(options.projectName || "website").toLowerCase().replace(/[^a-z0-9]/g, "")}.com`)
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");

  // 1. Prepare production website files (favicons, assets, clean folders, security stripping)
  const prepared = prepareProductionWebsiteFiles(
    inputFiles.map((f) => ({
      path: f.path,
      content: f.content,
      mimeType: f.mimeType,
    })),
    {
      projectName: options.projectName,
      domain: normalizedDomain,
      businessName: options.businessName || options.projectName,
      phone: options.phone,
      city: options.city,
      primaryColor: options.primaryColor,
    }
  );

  const finalFiles: CanonicalFileItem[] = prepared.files.map((f) => ({
    path: f.path,
    content: typeof f.content === "string" ? f.content : f.content.toString("utf-8"),
    mimeType: f.mimeType,
    size: typeof f.content === "string" ? f.content.length : (f.content as Buffer).length,
    lastModified: Date.now(),
  }));

  // 2. Run automated validation against this exact file set
  const validation = validateWebsiteFiles({
    files: finalFiles,
    expectedPages: finalFiles.filter((f) => f.path.endsWith(".html")).map((f) => f.path),
    expectedPhone: options.phone,
    domain: normalizedDomain,
  });

  return {
    files: finalFiles,
    validation,
    preZipAudit: prepared.auditReport,
  };
}
