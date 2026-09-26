"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Smartphone,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Search,
  Sparkles,
  Link2,
  Layers,
  FileCheck,
  Loader2,
  RotateCcw,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { QualityReport, QualityCheckItem } from "../lib/quality/quality-checker";
import { PageMobileAuditResult } from "../lib/quality/mobile-checker";
import { WebsiteQualityAuditReport, AuditRecommendation } from "../lib/quality/website-quality-auditor";
import { ImprovementActionType } from "../lib/quality/website-improver";

interface QualityScorecardProps {
  report: QualityReport | WebsiteQualityAuditReport;
  mobileAudit?: PageMobileAuditResult | null;
  activePage: string;
  isMobileAuditing?: boolean;
  onImproveAction?: (actionType: ImprovementActionType) => void;
  isImproving?: boolean;
  improvingStep?: string;
  activeAction?: string | null;
  hasOriginalVersion?: boolean;
  activeVersion?: "original" | "improved";
  onToggleVersion?: (version: "original" | "improved") => void;
  recentChanges?: string[];
}

export function QualityScorecard({
  report,
  mobileAudit,
  activePage,
  isMobileAuditing = false,
  onImproveAction,
  isImproving = false,
  improvingStep = "",
  activeAction = null,
  hasOriginalVersion = false,
  activeVersion = "improved",
  onToggleVersion,
  recentChanges = [],
}: QualityScorecardProps) {
  const [showAllChecks, setShowAllChecks] = useState(false);
  const [showRecentChanges, setShowRecentChanges] = useState(true);
  const [showDetails, setShowDetails] = useState(true);

  // Recalculate combined score factoring mobile audit
  const mobileHasOverflow = mobileAudit?.hasAnyOverflow || false;
  const mobilePenalty = mobileHasOverflow ? 10 : 0;
  const tapTargetPenalty = mobileAudit?.minTapTargetHeight && mobileAudit.minTapTargetHeight < 40 ? 5 : 0;
  const baseScore = report.overallScore || 0;
  const finalScore = Math.max(0, Math.min(100, baseScore - mobilePenalty - tapTargetPenalty));

  const targetReached = finalScore >= 95;

  const getScoreColor = (score: number) => {
    if (score >= 95)
      return {
        ring: "border-[#10B981]",
        text: "text-[#10B981]",
        bg: "bg-[#ECFDF5]",
        label: "Quality Target Reached (95+) • Ready to Publish",
      };
    if (score >= 88)
      return {
        ring: "border-[#3B82F6]",
        text: "text-[#3B82F6]",
        bg: "bg-[#EFF6FF]",
        label: "Good Quality • Ready for 95+ Polish",
      };
    if (score >= 75)
      return {
        ring: "border-[#F59E0B]",
        text: "text-[#F59E0B]",
        bg: "bg-[#FFFBEB]",
        label: "Needs Improvement to Reach 95",
      };
    return {
      ring: "border-[#EF4444]",
      text: "text-[#EF4444]",
      bg: "bg-[#FEF2F2]",
      label: "Needs Work • Multiple Issues Detected",
    };
  };

  const scoreTheme = getScoreColor(finalScore);

  // Extract recommendations if available from unified auditor
  const recommendations: AuditRecommendation[] =
    "recommendations" in report && Array.isArray(report.recommendations) ? report.recommendations : [];

  // Extract items from report
  const rawItems: any[] =
    "criteria" in report && Array.isArray(report.criteria)
      ? report.criteria.map((c) => ({
          id: c.id,
          name: c.name,
          category: c.category,
          score: c.maxScore,
          earned: c.earnedScore,
          passed: c.passed,
          description: c.description,
          warning: !c.passed ? c.details : undefined,
          status: c.status,
        }))
      : "items" in report && Array.isArray(report.items)
      ? report.items
      : [];

  const passedItems = rawItems.filter((i) => i.passed);
  const failedItems = rawItems.filter((i) => !i.passed);
  const displayedItems = showAllChecks ? rawItems : passedItems.slice(0, 6);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm space-y-4">
      {/* Header with Version Safety Toggle */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-[#4F46E5] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Automated Quality &amp; SEO Engine</span>
          </span>
          <h3 className="text-base font-bold text-[#0F172A]">Website Quality Score</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Target: <strong className="text-[#0F172A]">95 / 100</strong> • Real verifiable checks
          </p>
        </div>

        {/* Circular Score Gauge */}
        <div
          className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 ${scoreTheme.ring} ${scoreTheme.bg} shrink-0 shadow-2xs`}
        >
          <span className={`text-xl font-black ${scoreTheme.text} leading-none`}>{finalScore}</span>
          <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-tighter">/100</span>
        </div>
      </div>

      {/* Version Safety Indicator (Original vs Improved) */}
      {hasOriginalVersion && onToggleVersion && (
        <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
          <span className="text-slate-600 font-medium">Viewing Version:</span>
          <div className="flex items-center gap-1.5 bg-slate-200/80 p-0.5 rounded-md">
            <button
              type="button"
              onClick={() => onToggleVersion("original")}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition ${
                activeVersion === "original"
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Original
            </button>
            <button
              type="button"
              onClick={() => onToggleVersion("improved")}
              className={`px-2.5 py-1 rounded text-[11px] font-semibold transition flex items-center gap-1 ${
                activeVersion === "improved"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <span>Improved</span>
              <Sparkles className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}

      {/* Target Status Banner */}
      <div
        className={`flex items-center justify-between px-3 py-2.5 rounded-[10px] ${scoreTheme.bg} border border-[#E2E8F0] text-xs font-semibold ${scoreTheme.text}`}
      >
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{scoreTheme.label}</span>
        </span>
        <span className="text-[11px] font-mono text-[#64748B]">
          {passedItems.length}/{rawItems.length} Checks
        </span>
      </div>

      {/* Improve All Master Action Button (Shown when score < 95 or issues exist) */}
      {onImproveAction && (
        <div className="pt-1">
          {targetReached ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 flex items-center justify-between">
              <span className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Quality target reached (95+). Website is ready for download or publishing.</span>
              </span>
              <button
                type="button"
                onClick={() => onImproveAction("improve_all")}
                disabled={isImproving}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline ml-2 shrink-0"
              >
                Re-check
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onImproveAction("improve_all")}
              disabled={isImproving}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
            >
              {isImproving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{improvingStep || "Improving Website & Resolving Issues…"}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Improve Website to 95+ (Fix All Issues)</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* Detected Issues & Actionable Recommendations */}
      {recommendations.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
            <span className="flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>
                Detected Issues &amp; Recommendations ({recommendations.length})
              </span>
            </span>
          </div>

          <div className="space-y-2">
            {recommendations.map((rec) => (
              <div
                key={rec.id}
                className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-3 text-xs space-y-1.5 transition hover:bg-amber-50"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span>{rec.title}</span>
                      <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded font-bold">
                        +{rec.impactScore} pts
                      </span>
                    </h4>
                    <p className="text-[11px] text-amber-950 mt-0.5 leading-snug">{rec.issue}</p>
                    <p className="text-[10px] text-slate-500 mt-1 italic">{rec.reason}</p>
                  </div>

                  {onImproveAction && (
                    <button
                      type="button"
                      onClick={() => onImproveAction(rec.actionType)}
                      disabled={isImproving}
                      className="shrink-0 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[11px] transition shadow-2xs flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                    >
                      {isImproving && activeAction === rec.actionType ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Sparkles className="w-3 h-3" />
                      )}
                      <span>Improve</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Improvements Log */}
      {recentChanges.length > 0 && (
        <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-3 text-xs space-y-2">
          <div
            className="flex items-center justify-between cursor-pointer font-bold text-indigo-900"
            onClick={() => setShowRecentChanges(!showRecentChanges)}
          >
            <span className="flex items-center gap-1.5 text-indigo-700">
              <Wrench className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Improvements Applied ({recentChanges.length})</span>
            </span>
            {showRecentChanges ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>

          {showRecentChanges && (
            <ul className="space-y-1 text-[11px] pl-4 list-disc text-indigo-900">
              {recentChanges.slice(-6).map((change, idx) => (
                <li key={idx}>{change}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Verified Real Quality Checklist */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
          <span>Verified Quality Checklist</span>
          <button
            type="button"
            onClick={() => setShowAllChecks(!showAllChecks)}
            className="text-[11px] font-semibold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1 cursor-pointer"
          >
            <span>{showAllChecks ? "Show Less" : `View All (${rawItems.length})`}</span>
            {showAllChecks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <ul className="space-y-2 text-xs text-[#0F172A]">
          {displayedItems.map((item) => (
            <li
              key={item.id}
              className="flex items-start space-x-2.5 p-2 rounded-[8px] bg-slate-50 border border-slate-100"
            >
              {item.passed ? (
                <CheckCircle2 className="w-4 h-4 text-[#10B981] shrink-0 mt-0.5" />
              ) : item.status === "not_checked" ? (
                <div className="w-4 h-4 rounded-full border border-slate-300 bg-slate-200 flex items-center justify-center text-[9px] font-bold text-slate-600 shrink-0 mt-0.5">
                  -
                </div>
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-xs text-[#0F172A] truncate">{item.name}</span>
                  <span className="text-[10px] font-mono text-[#64748B] shrink-0">
                    +{item.earned} pts
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">{item.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
