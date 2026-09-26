"use client";

import React, { useState } from "react";
import { BuilderRecommendation, RecommendationCategory } from "@/lib/recommendations/recommendation-engine";
import {
  Wand2,
  CheckCircle2,
  AlertTriangle,
  Info,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Eye,
  FileCode,
  Zap,
} from "lucide-react";

interface RecommendationFixPanelProps {
  recommendations: BuilderRecommendation[];
  onApplyFix: (rec: BuilderRecommendation) => void;
  onApplyAll: () => void;
}

export function RecommendationFixPanel({
  recommendations,
  onApplyFix,
  onApplyAll,
}: RecommendationFixPanelProps) {
  const [filter, setFilter] = useState<"all" | RecommendationCategory>("all");
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());

  const filtered = recommendations.filter((r) => {
    if (filter === "all") return true;
    return r.type === filter;
  });

  const seoCount = recommendations.filter((r) => r.type === "seo").length;
  const a11yCount = recommendations.filter((r) => r.type === "accessibility").length;
  const structCount = recommendations.filter((r) => r.type === "structure").length;

  const handleFix = (rec: BuilderRecommendation) => {
    setAppliedIds((prev) => new Set(prev).add(rec.id));
    onApplyFix(rec);
  };

  const handleFixAll = () => {
    recommendations.forEach((r) => setAppliedIds((prev) => new Set(prev).add(r.id)));
    onApplyAll();
  };

  if (recommendations.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center space-x-3 text-xs">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        <div>
          <span className="font-bold block">All Quality Checks Passing!</span>
          <span className="text-[11px] text-emerald-700">
            SEO metadata, visual accessibility, and content structure meet production standards.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
            <Wand2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
              <span>Real-Time Recommendations &amp; Auto-Fixes</span>
              <span className="bg-indigo-100 text-indigo-700 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {recommendations.length}
              </span>
            </h4>
            <p className="text-[11px] text-slate-500">
              One-click fixes for SEO, visual accessibility, and structure. Updates live preview instantly.
            </p>
          </div>
        </div>

        {recommendations.length > 1 && (
          <button
            type="button"
            onClick={handleFixAll}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Apply All Fixes ({recommendations.length})</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-2.5 py-1 rounded-lg transition ${
            filter === "all" ? "bg-white text-slate-900 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          All ({recommendations.length})
        </button>
        <button
          type="button"
          onClick={() => setFilter("seo")}
          className={`px-2.5 py-1 rounded-lg transition ${
            filter === "seo" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          SEO ({seoCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("accessibility")}
          className={`px-2.5 py-1 rounded-lg transition ${
            filter === "accessibility" ? "bg-white text-emerald-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Accessibility ({a11yCount})
        </button>
        <button
          type="button"
          onClick={() => setFilter("structure")}
          className={`px-2.5 py-1 rounded-lg transition ${
            filter === "structure" ? "bg-white text-blue-700 shadow-2xs font-bold" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Structure ({structCount})
        </button>
      </div>

      {/* Recommendations List */}
      <div className="space-y-3">
        {filtered.map((rec) => {
          const isApplied = appliedIds.has(rec.id);

          return (
            <div
              key={rec.id}
              className={`p-3.5 rounded-xl border transition-all ${
                isApplied
                  ? "bg-slate-50/60 border-slate-200 opacity-60"
                  : rec.severity === "critical"
                  ? "bg-rose-50/30 border-rose-200"
                  : rec.severity === "warning"
                  ? "bg-amber-50/30 border-amber-200"
                  : "bg-blue-50/30 border-blue-200"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md border ${
                        rec.type === "seo"
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                          : rec.type === "accessibility"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-blue-50 text-blue-700 border-blue-200"
                      }`}
                    >
                      {rec.type.toUpperCase()}
                    </span>

                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                        rec.severity === "critical"
                          ? "bg-rose-100 text-rose-800"
                          : rec.severity === "warning"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {rec.severity}
                    </span>

                    <h5 className="text-xs font-bold text-slate-900">{rec.title}</h5>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-snug">{rec.description}</p>

                  {/* Proposed Change Box */}
                  <div className="mt-2 p-2 rounded-lg bg-white/80 border border-slate-200/80 font-mono text-[10px] space-y-0.5">
                    {rec.proposedChange.currentValue && (
                      <div className="text-rose-600 truncate">
                        <span className="font-bold text-slate-400 select-none">- Current: </span>
                        {rec.proposedChange.currentValue}
                      </div>
                    )}
                    <div className="text-emerald-700 truncate">
                      <span className="font-bold text-slate-400 select-none">+ Fix: </span>
                      {rec.proposedChange.newValue}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleFix(rec)}
                  disabled={isApplied}
                  className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-2xs shrink-0 cursor-pointer ${
                    isApplied
                      ? "bg-slate-100 text-slate-400 cursor-default"
                      : "bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-indigo-700"
                  }`}
                >
                  {isApplied ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Applied</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Apply Fix</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
