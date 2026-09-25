"use client";

import React, { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { useAuth } from "@/lib/auth/AuthContext";
import { logActivity } from "@/lib/supabase/activity";
import {
  Database,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  UploadCloud,
  FileCheck,
  FolderGit2,
} from "lucide-react";

interface ImportLocalDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: () => void;
}

export function ImportLocalDataModal({
  isOpen,
  onClose,
  onImportComplete,
}: ImportLocalDataModalProps) {
  const { user } = useAuth();
  const [localProjects, setLocalProjects] = useState<any[]>([]);
  const [loadingScan, setLoadingScan] = useState(true);
  const [importing, setImporting] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [importReport, setImportReport] = useState<{
    projectsImported: number;
    pagesImported: number;
    versionsImported: number;
    errors: string[];
  } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Scan localStorage / IndexedDB for legacy AltoFox projects
    setLoadingScan(true);
    try {
      const found: any[] = [];

      // 1. Check localStorage for altofox_saved_projects
      const rawStored = localStorage.getItem("altofox_saved_projects");
      if (rawStored) {
        try {
          const parsed = JSON.parse(rawStored);
          if (Array.isArray(parsed)) found.push(...parsed);
        } catch {}
      }

      // 2. Check individual project keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("altofox_project_")) {
          try {
            const item = JSON.parse(localStorage.getItem(key) || "{}");
            if (item && item.id && !found.some((p) => p.id === item.id)) {
              found.push(item);
            }
          } catch {}
        }
      }

      setLocalProjects(found);
    } catch (err) {
      console.error("Local scan error:", err);
    } finally {
      setLoadingScan(false);
    }
  }, [isOpen]);

  const handleStartMigration = async () => {
    if (localProjects.length === 0) return;
    setImporting(true);
    setProgressPercent(5);
    setStatusMessage("Connecting to Supabase team workspace…");

    const supabase = getSupabaseBrowserClient();
    let projectsCount = 0;
    let pagesCount = 0;
    let versionsCount = 0;
    const errors: string[] = [];

    try {
      const totalSteps = localProjects.length;

      for (let i = 0; i < localProjects.length; i++) {
        const p = localProjects[i];
        const stepProgress = Math.round(((i + 1) / totalSteps) * 90);
        setProgressPercent(stepProgress);
        setStatusMessage(`Migrating project ${i + 1} of ${totalSteps}: "${p.name || "Untitled"}"…`);

        try {
          // Insert Project into Supabase
          const { data: projectData, error: projErr } = await supabase
            .from("projects")
            .insert({
              name: p.name || "Migrated Website",
              domain: p.domain || p.businessDetails?.websiteDomain || null,
              niche: p.niche || null,
              main_city: p.mainCity || p.businessDetails?.city || null,
              state: p.state || p.businessDetails?.state || null,
              theme_id: p.themeId || p.theme?.id || null,
              settings: p.settings || {},
              business_details: p.businessDetails || p.business_details || {},
              wizard_inputs: p.wizardInputs || {},
              status: "active",
              created_by: user?.id || null,
              updated_by: user?.id || null,
            })
            .select()
            .single();

          if (projErr || !projectData) {
            errors.push(`Project "${p.name}": ${projErr?.message || "Failed to insert"}`);
            continue;
          }

          projectsCount++;
          const newProjectId = projectData.id;

          // Migrate Pages
          if (Array.isArray(p.pages) && p.pages.length > 0) {
            const pageRows = p.pages.map((pg: any, idx: number) => ({
              project_id: newProjectId,
              type: pg.type || "custom",
              slug: pg.slug || `page-${idx}`,
              url_path: pg.urlPath || `/${pg.slug || `page-${idx}`}.html`,
              title: pg.title || pg.seo?.h1 || "Page",
              seo: pg.seo || {},
              content: pg.content || {},
              keywords: pg.keywords || [],
              sort_order: pg.sortOrder || idx,
              created_by: user?.id || null,
              updated_by: user?.id || null,
            }));

            const { error: pageErr } = await supabase.from("pages").insert(pageRows);
            if (pageErr) {
              errors.push(`Pages for "${p.name}": ${pageErr.message}`);
            } else {
              pagesCount += pageRows.length;
            }
          }

          // Migrate Versions if present
          if (Array.isArray(p.versions) && p.versions.length > 0) {
            const versionRows = p.versions.slice(0, 10).map((v: any) => ({
              project_id: newProjectId,
              snapshot: v.snapshot || v,
              summary: v.summary || "Legacy version",
              note: v.note || null,
              created_by: user?.id || null,
            }));
            const { error: verErr } = await supabase.from("versions").insert(versionRows);
            if (!verErr) versionsCount += versionRows.length;
          }

          // Log migration activity
          await logActivity({
            projectId: newProjectId,
            action: "import",
            entityType: "project",
            entityId: newProjectId,
            details: {
              description: `Imported local website project "${p.name}" into Supabase team workspace`,
              projectName: p.name,
              pagesCount: p.pages?.length || 0,
            },
          });
        } catch (itemErr: any) {
          errors.push(`Project "${p.name}": ${itemErr.message}`);
        }
      }

      setProgressPercent(100);
      setStatusMessage("Migration complete!");
      setImportReport({
        projectsImported: projectsCount,
        pagesImported: pagesCount,
        versionsImported: versionsCount,
        errors,
      });

      if (onImportComplete) onImportComplete();
    } catch (err: any) {
      errors.push(`Fatal migration error: ${err.message}`);
      setImportReport({
        projectsImported: projectsCount,
        pagesImported: pagesCount,
        versionsImported: versionsCount,
        errors,
      });
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Import Local Data to Supabase
              </h3>
              <p className="text-[11px] text-slate-500">
                Safely transfer projects from browser storage to your private team database.
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={importing}
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        {loadingScan ? (
          <div className="py-8 text-center space-y-2 text-slate-400 text-xs">
            <Loader2 className="w-5 h-5 animate-spin mx-auto text-indigo-600" />
            <p>Scanning browser storage for existing projects…</p>
          </div>
        ) : importReport ? (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Migration Finished</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-[11px] pt-1">
                <li>{importReport.projectsImported} project(s) imported to Supabase</li>
                <li>{importReport.pagesImported} page(s) transferred with SEO &amp; content</li>
                <li>{importReport.versionsImported} snapshot version(s) preserved</li>
              </ul>
            </div>

            {importReport.errors.length > 0 && (
              <div className="p-3 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-[11px] space-y-1 max-h-32 overflow-y-auto">
                <span className="font-semibold">Notice / Errors encountered:</span>
                {importReport.errors.map((e, idx) => (
                  <div key={idx}>• {e}</div>
                ))}
              </div>
            )}

            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Note: Your local browser storage was retained as a backup and has not been deleted.
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs"
            >
              Done &amp; Return to Dashboard
            </button>
          </div>
        ) : localProjects.length === 0 ? (
          <div className="py-8 text-center space-y-2 text-slate-500 text-xs">
            <Database className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-semibold text-slate-800 dark:text-slate-200">
              No legacy local projects found
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Your browser storage does not contain any previous offline projects. You can generate or import new sites directly into Supabase!
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Found {localProjects.length} project(s) in local storage:
              </span>
              <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl">
                {localProjects.map((p, idx) => (
                  <div key={p.id || idx} className="p-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <FolderGit2 className="w-3.5 h-3.5 text-indigo-500" />
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {p.name || "Untitled Project"}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {p.pages?.length || 0} pages
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {importing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                    {statusMessage}
                  </span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {progressPercent}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 transition-all duration-200"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={importing}
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={handleStartMigration}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs flex items-center gap-2"
              >
                {importing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Importing…</span>
                  </>
                ) : (
                  <>
                    <span>Start Migration</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
