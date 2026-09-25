"use client";

import React, { useState, useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Search, FolderGit2, FileCode, ArrowRight, X, Sparkles } from "lucide-react";

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (projectId: string) => void;
  onSelectPage?: (projectId: string, pageId: string) => void;
}

export function GlobalSearchModal({
  isOpen,
  onClose,
  onSelectProject,
  onSelectPage,
}: GlobalSearchModalProps) {
  const [query, setQuery] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setProjects([]);
      setPages([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setProjects([]);
      setPages([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const supabase = getSupabaseBrowserClient();
        const cleanQuery = `%${query.trim()}%`;

        // Search projects
        const { data: projData } = await supabase
          .from("projects")
          .select("id, name, domain, niche, main_city")
          .or(`name.ilike.${cleanQuery},domain.ilike.${cleanQuery},main_city.ilike.${cleanQuery}`)
          .limit(6);

        // Search pages
        const { data: pageData } = await supabase
          .from("pages")
          .select("id, project_id, title, slug, url_path, type")
          .or(`title.ilike.${cleanQuery},slug.ilike.${cleanQuery}`)
          .limit(8);

        setProjects(projData || []);
        setPages(pageData || []);
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setLoading(false);
      }
    }, 180);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-100">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3">
          <Search className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search projects, domains, pages, slugs… (Type to filter)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
            ESC
          </span>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-3 space-y-4">
          {loading && (
            <div className="p-6 text-center text-xs text-slate-400">
              Searching team workspace…
            </div>
          )}

          {!loading && !query && (
            <div className="p-8 text-center space-y-1.5 text-slate-400 text-xs">
              <Sparkles className="w-6 h-6 mx-auto text-indigo-400" />
              <p className="font-semibold text-slate-700 dark:text-slate-300">
                Quick Project &amp; Page Navigator
              </p>
              <p className="text-[11px] text-slate-400">
                Type any project name, city, service page, or keyword to jump directly there.
              </p>
            </div>
          )}

          {!loading && query && projects.length === 0 && pages.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-400">
              No matching projects or pages found for &quot;{query}&quot;.
            </div>
          )}

          {/* Projects Results */}
          {projects.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                Projects ({projects.length})
              </div>
              <div className="space-y-1">
                {projects.map((proj) => (
                  <button
                    key={proj.id}
                    type="button"
                    onClick={() => {
                      onSelectProject(proj.id);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl flex items-center justify-between text-left hover:bg-indigo-50/70 dark:hover:bg-indigo-950/40 text-xs transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FolderGit2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          {proj.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {proj.domain || "No domain"} • {proj.main_city || "All regions"}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Pages Results */}
          {pages.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 pt-2">
                Pages ({pages.length})
              </div>
              <div className="space-y-1">
                {pages.map((pg) => (
                  <button
                    key={pg.id}
                    type="button"
                    onClick={() => {
                      if (onSelectPage) onSelectPage(pg.project_id, pg.id);
                      else onSelectProject(pg.project_id);
                      onClose();
                    }}
                    className="w-full p-2.5 rounded-xl flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs transition group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {pg.title}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {pg.url_path} • <span className="capitalize">{pg.type}</span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
