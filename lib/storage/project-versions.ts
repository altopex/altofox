import { SavedProject, ProjectVersion, ProjectChangeLogEntry } from "./project-types";

/**
 * Ensures a project has a base "Original Version" snapshot.
 * If no versions exist yet, the baseline files are locked into Version 0.
 */
export function ensureProjectVersions(project: SavedProject): SavedProject {
  const existingVersions = Array.isArray(project.versions) ? [...project.versions] : [];

  if (existingVersions.length === 0) {
    const originalFiles = (project.files || []).map((f) => ({ ...f }));
    const originalVersion: ProjectVersion = {
      id: `v1-original-${project.id || "base"}`,
      versionNumber: 1,
      label: "Version 1 (Original Website)",
      createdAt: project.createdAt || Date.now(),
      dateStr: new Date(project.createdAt || Date.now()).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      source: "original",
      summary: "Original website",
      affectedPages: originalFiles.filter((f) => f.path.endsWith(".html")).map((f) => f.path),
      files: originalFiles,
      qualityScore: (project as any).qualityReport?.overallScore || 90,
    };

    return {
      ...project,
      versions: [originalVersion],
      currentVersionId: originalVersion.id,
    };
  }

  return project;
}

/**
 * Creates a new version snapshot for an optimization session.
 * Permanently preserves all previous versions and the original version.
 */
export function createProjectVersionSnapshot(
  project: SavedProject,
  options: {
    source: "search_console" | "quality_improver" | "manual_edit";
    summary: string;
    affectedPages: string[];
    updatedFiles: { path: string; content: string; mimeType?: string; size?: number; lastModified?: number }[];
    qualityScore?: number;
  }
): SavedProject {
  // 1. Ensure original version is safely preserved
  const projectWithBase = ensureProjectVersions(project);
  const versions = [...(projectWithBase.versions || [])];

  const nextVersionNumber = versions.length + 1; // e.g. 2 for first improvement
  const timestamp = Date.now();
  const dateStr = new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  const reasonLabel =
    options.source === "search_console"
      ? "Search Console optimization"
      : options.source === "quality_improver"
      ? "SEO optimization"
      : "Manual edit";

  const newVersion: ProjectVersion = {
    id: `v${nextVersionNumber}-${options.source}-${timestamp}`,
    versionNumber: nextVersionNumber,
    label: `Version ${nextVersionNumber} (${reasonLabel})`,
    createdAt: timestamp,
    dateStr,
    source: options.source,
    summary: options.summary || reasonLabel,
    affectedPages: options.affectedPages,
    files: options.updatedFiles.map((f) => ({ ...f, lastModified: timestamp })),
    qualityScore: options.qualityScore,
  };

  // Add change log entry
  const logEntry: ProjectChangeLogEntry = {
    id: `log-${timestamp}`,
    timestamp,
    dateStr,
    summary: `[${newVersion.label}] ${options.summary}`,
    affectedPages: options.affectedPages,
  };

  return {
    ...projectWithBase,
    files: newVersion.files,
    versions: [...versions, newVersion],
    currentVersionId: newVersion.id,
    lastEditedAt: timestamp,
    changeLog: [logEntry, ...(projectWithBase.changeLog || [])],
  };
}

/**
 * Switches the active working file set to a specified version (e.g. rollback to Original Version).
 */
export function switchProjectVersion(project: SavedProject, versionId: string): SavedProject {
  const versions = project.versions || [];
  const target = versions.find((v) => v.id === versionId);
  if (!target) return project;

  return {
    ...project,
    currentVersionId: target.id,
    files: target.files.map((f) => ({ ...f })),
    lastEditedAt: Date.now(),
  };
}

/**
 * Retrieves the permanent original version of a project.
 */
export function getOriginalVersion(project: SavedProject): ProjectVersion | undefined {
  if (!project.versions || project.versions.length === 0) return undefined;
  return project.versions.find((v) => v.versionNumber === 1 || v.source === "original" || v.versionNumber === 0) || project.versions[0];
}

/**
 * Retrieves the currently active version of a project.
 */
export function getCurrentVersion(project: SavedProject): ProjectVersion | undefined {
  if (!project.versions || project.versions.length === 0) return undefined;
  if (!project.currentVersionId) return project.versions[project.versions.length - 1];
  return project.versions.find((v) => v.id === project.currentVersionId) || project.versions[project.versions.length - 1];
}
