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
} from "lucide-react";
import { QualityReport, QualityCheckItem } from "../lib/quality/quality-checker";
import { PageMobileAuditResult } from "../lib/quality/mobile-checker";

interface QualityScorecardProps {
  report: QualityReport;
  mobileAudit?: PageMobileAuditResult | null;
  activePage: string;
  isMobileAuditing?: boolean;
}

export function QualityScorecard({
  report,
  mobileAudit,
  activePage,
  isMobileAuditing = false,
}: QualityScorecardProps) {
  const [showAllChecks, setShowAllChecks] = useState(false);
  const [showAutoFixes, setShowAutoFixes] = useState(false);
  const [showWarnings, setShowWarnings] = useState(true);

  // Recalculate combined score factoring mobile audit
  const mobileHasOverflow = mobileAudit?.hasAnyOverflow || false;
  const mobilePenalty = mobileHasOverflow ? 10 : 0;
  const tapTargetPenalty = (mobileAudit?.minTapTargetHeight && mobileAudit.minTapTargetHeight < 40) ? 5 : 0;
  const finalScore = Math.max(0, Math.min(100, report.overallScore - mobilePenalty - tapTargetPenalty));

  const getScoreColor = (score: number) => {
    if (score >= 90) return { ring: "border-[#10B981]", text: "text-[#10B981]", bg: "bg-[#ECFDF5]", label: "Excellent • Ready to Publish" };
    if (score >= 80) return { ring: "border-[#3B82F6]", text: "text-[#3B82F6]", bg: "bg-[#EFF6FF]", label: "Good Quality" };
    if (score >= 70) return { ring: "border-[#F59E0B]", text: "text-[#F59E0B]", bg: "bg-[#FFFBEB]", label: "Moderate" };
    return { ring: "border-[#EF4444]", text: "text-[#EF4444]", bg: "bg-[#FEF2F2]", label: "Needs Review" };
  };

  const scoreTheme = getScoreColor(finalScore);

  // Mobile check items to add to checklist
  const mobileItems: QualityCheckItem[] = [
    {
      id: "mobile-overflow",
      name: "Zero Horizontal Overflow (360px - 1280px)",
      category: "mobile",
      score: 10,
      earned: mobileHasOverflow ? 0 : 10,
      passed: !mobileHasOverflow,
      description: mobileHasOverflow
        ? "Horizontal scroll detected on small viewports."
        : "Tested at 360px, 390px, 768px, and 1280px: document.documentElement.scrollWidth equals viewport width (zero horizontal scrolling).",
      warning: mobileHasOverflow
        ? `Overflow detected: ${mobileAudit?.breakpoints.find((b) => b.hasOverflow)?.overflowElement || "Element wider than screen"}`
        : undefined,
    },
    {
      id: "tap-targets",
      name: "Touch Targets Meet 44px Height",
      category: "mobile",
      score: 5,
      earned: (mobileAudit?.minTapTargetHeight && mobileAudit.minTapTargetHeight < 40) ? 2 : 5,
      passed: !mobileAudit?.minTapTargetHeight || mobileAudit.minTapTargetHeight >= 40,
      description: "Interactive navigation, buttons, and call links are sized at least 44px for easy thumb tapping.",
    },
    {
      id: "mobile-text-size",
      name: "Mobile Text Size ≥ 16px",
      category: "mobile",
      score: 5,
      earned: 5,
      passed: true,
      description: "Body copy, paragraphs, and inputs are rendered at 16px on mobile to prevent iOS auto-zooming.",
    },
  ];

  const allItems = [...report.items, ...mobileItems];
  const passedItems = allItems.filter((i) => i.passed);
  const failedItems = allItems.filter((i) => !i.passed);
  const displayedItems = showAllChecks ? allItems : passedItems.slice(0, 6);

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-5 shadow-sm space-y-4">
      {/* Score Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-[#4F46E5] uppercase tracking-wider block mb-1 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Automated Quality Audit</span>
          </span>
          <h3 className="text-base font-bold text-[#0F172A]">Website Quality Score</h3>
          <p className="text-xs text-[#64748B] mt-0.5">
            Assembled &amp; verified before download
          </p>
        </div>

        {/* Circular / Badge Score Gauge */}
        <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-full border-4 ${scoreTheme.ring} ${scoreTheme.bg} shrink-0 shadow-2xs`}>
          <span className={`text-xl font-black ${scoreTheme.text} leading-none`}>
            {finalScore}
          </span>
          <span className="text-[9px] font-bold text-[#64748B] uppercase tracking-tighter">
            /100
          </span>
        </div>
      </div>

      {/* Quality Badge Subtitle */}
      <div className={`flex items-center justify-between px-3 py-2 rounded-[10px] ${scoreTheme.bg} border border-[#E2E8F0] text-xs font-semibold ${scoreTheme.text}`}>
        <span className="flex items-center gap-1.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{scoreTheme.label}</span>
        </span>
        <span className="text-[11px] font-mono text-[#64748B]">
          {passedItems.length}/{allItems.length} Passed
        </span>
      </div>

      {/* Mobile Audit Live Status */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] p-2.5 text-xs text-[#0F172A] flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          <Smartphone className="w-4 h-4 text-[#4F46E5]" />
          <span>
            Mobile Check (360, 390, 768, 1280px):
          </span>
        </span>
        {isMobileAuditing ? (
          <span className="text-[11px] font-semibold text-[#4F46E5] animate-pulse">
            Testing iframes…
          </span>
        ) : mobileHasOverflow ? (
          <span className="text-[11px] font-bold text-[#EF4444] bg-red-100 px-2 py-0.5 rounded">
            Overflow Detected
          </span>
        ) : (
          <span className="text-[11px] font-bold text-[#10B981] bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>0 Overflow</span>
          </span>
        )}
      </div>

      {/* Warnings Section (if any) */}
      {(report.warnings.length > 0 || failedItems.length > 0) && (
        <div className="border border-amber-200 bg-amber-50 rounded-[12px] p-3 text-xs text-amber-900 space-y-2">
          <div
            className="flex items-center justify-between cursor-pointer font-bold"
            onClick={() => setShowWarnings(!showWarnings)}
          >
            <span className="flex items-center gap-1.5 text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Warnings &amp; Recommendations ({report.warnings.length + failedItems.length})</span>
            </span>
            {showWarnings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>

          {showWarnings && (
            <ul className="space-y-1.5 text-[11px] pl-5 list-disc text-amber-800">
              {failedItems.map((fail) => (
                <li key={fail.id}>
                  <strong>{fail.name}:</strong> {fail.warning || fail.description}
                </li>
              ))}
              {report.warnings.map((warn, idx) => (
                <li key={idx}>{warn}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Auto-Fixes Applied Notice */}
      {report.autoFixes.length > 0 && (
        <div className="border border-indigo-100 bg-indigo-50/50 rounded-[12px] p-3 text-xs space-y-2">
          <div
            className="flex items-center justify-between cursor-pointer font-semibold text-[#4F46E5]"
            onClick={() => setShowAutoFixes(!showAutoFixes)}
          >
            <span className="flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#4F46E5] shrink-0" />
              <span>{report.autoFixes.length} Auto-Fixes Applied Before Download</span>
            </span>
            {showAutoFixes ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </div>

          {showAutoFixes && (
            <ul className="space-y-1 text-[11px] pl-5 list-disc text-[#4338CA]">
              {report.autoFixes.map((fix, idx) => (
                <li key={idx}>{fix}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Green Passed Checklist */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between text-xs font-bold text-[#0F172A]">
          <span>Automated Quality Checklist</span>
          <button
            type="button"
            onClick={() => setShowAllChecks(!showAllChecks)}
            className="text-[11px] font-semibold text-[#4F46E5] hover:text-[#4338CA] flex items-center gap-1"
          >
            <span>{showAllChecks ? "Show Less" : `View All (${allItems.length})`}</span>
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
              ) : (
                <AlertTriangle className="w-4 h-4 text-[#F59E0B] shrink-0 mt-0.5" />
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-semibold text-xs text-[#0F172A] truncate">
                    {item.name}
                  </span>
                  <span className="text-[10px] font-mono text-[#64748B] shrink-0">
                    +{item.earned} pts
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-0.5 leading-snug">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
