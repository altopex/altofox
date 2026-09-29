"use client";

import React, { useState } from "react";
import { THEMES, Theme, ThemeColors } from "@/lib/themes";
import { ThemeMiniPreview } from "./ThemeMiniPreview";
import { ThemePreviewModal } from "./ThemePreviewModal";
import {
  Palette,
  Eye,
  Sparkles,
  Check,
  Search,
  ArrowRight,
  ShieldCheck,
  SlidersHorizontal,
  Compass,
} from "lucide-react";

interface ThemesGalleryProps {
  onSelectAndBuild: (themeId: string) => void;
  selectedThemeId?: string;
}

export function ThemesGallery({ onSelectAndBuild, selectedThemeId }: ThemesGalleryProps) {
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);

  const filterTabs = [
    { id: "all", label: "All Themes" },
    { id: "plumbing", label: "🔧 Plumbing" },
    { id: "electrical", label: "⚡ Electrical" },
    { id: "hvac", label: "❄️ HVAC" },
    { id: "roofing", label: "🏠 Roofing" },
    { id: "landscaping", label: "🌳 Landscaping" },
    { id: "cleaning", label: "✨ Cleaning" },
    { id: "auto", label: "🔩 Auto Repair" },
    { id: "remodeling", label: "🏗️ Remodeling" },
    { id: "pest", label: "🛡️ Pest & Home" },
    { id: "emergency", label: "🚨 Emergency" },
  ];

  const activeThemes = THEMES.filter((t) => !t.isLegacy);

  const filteredThemes = activeThemes.filter((theme) => {
    // Search query filter
    const matchesSearch =
      !searchQuery ||
      theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theme.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      theme.bestFor.some((b) => b.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (theme.tradeSeoPrefix && theme.tradeSeoPrefix.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedFilter === "all") return true;
    if (selectedFilter === "plumbing") return theme.id === "pipe-and-wrench";
    if (selectedFilter === "electrical") return theme.id === "spark-and-wire";
    if (selectedFilter === "hvac") return theme.id === "cool-breeze";
    if (selectedFilter === "roofing") return theme.id === "storm-shield";
    if (selectedFilter === "landscaping") return theme.id === "green-roots";
    if (selectedFilter === "cleaning") return theme.id === "clean-sweep";
    if (selectedFilter === "auto") return theme.id === "iron-grip";
    if (selectedFilter === "remodeling") return theme.id === "master-craft";
    if (selectedFilter === "pest") return theme.id === "secure-home";
    if (selectedFilter === "emergency") return theme.id === "rapid-response";

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Website Themes & Design Systems
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Browse our 10 purpose-built local trade themes. Each has a distinct visual layout, typography pairing, and color hierarchy optimized for local SEO.
          </p>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search themes or trades…"
            className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Trade Category Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-thin">
        {filterTabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setSelectedFilter(tab.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              selectedFilter === tab.id
                ? "bg-indigo-600 text-white shadow-2xs"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Themes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredThemes.map((theme) => {
          const isSelected = selectedThemeId === theme.id;
          const c = theme.colors;

          return (
            <div
              key={theme.id}
              className={`bg-white dark:bg-slate-900 rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden shadow-xs hover:shadow-md ${
                isSelected
                  ? "border-indigo-600 ring-2 ring-indigo-500/20"
                  : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
              }`}
            >
              {/* Card Top: Theme Mini Preview */}
              <div className="p-3 bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800/80">
                <ThemeMiniPreview theme={theme} />
              </div>

              {/* Card Body: Details */}
              <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-base text-slate-900 dark:text-white">
                      {theme.name}
                    </h3>
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                        <Check className="w-3 h-3 stroke-[3]" />
                        <span>Active</span>
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {theme.description}
                  </p>
                </div>

                {/* Color Palette Swatches */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <span>Palette</span>
                    <span className="font-mono lowercase text-slate-400">{theme.borderRadius} radius</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: c.primary }}
                        title={`Primary: ${c.primary}`}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: c.secondary }}
                        title={`Secondary: ${c.secondary}`}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: c.accent }}
                        title={`Accent: ${c.accent}`}
                      />
                      <span
                        className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: c.background }}
                        title={`Background: ${c.background}`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono truncate">
                      {theme.fonts.heading} + {theme.fonts.body}
                    </span>
                  </div>
                </div>

                {/* Best For Tags */}
                <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    Best For:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {theme.bestFor.map((trade) => (
                      <span
                        key={trade}
                        className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-medium border border-slate-200/80 dark:border-slate-700/80"
                      >
                        {trade}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Card Actions: Preview & Build */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setPreviewTheme(theme);
                      setIsPreviewOpen(true);
                    }}
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-400 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Live Preview</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSelectAndBuild(theme.id)}
                    className="flex-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Build With This</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Responsive Preview Modal */}
      <ThemePreviewModal
        theme={previewTheme}
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        onSelectTheme={(themeId) => {
          setIsPreviewOpen(false);
          onSelectAndBuild(themeId);
        }}
        isSelected={selectedThemeId === previewTheme?.id}
      />
    </div>
  );
}
