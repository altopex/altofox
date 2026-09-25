"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  SavedProject,
  OptimizationCycle,
  PageMetricSnapshot,
  AppliedPageOptimization,
  ProjectChangeLogEntry,
} from "../lib/storage/project-types";
import {
  parseGscCsv,
  generateGscOpportunities,
  compareGscDatasets,
  getExpectedCtrForPosition,
  GSCUploadDataset,
  GSCQueryRow,
  GSCPageRow,
} from "../lib/search-console/search-console-analyzer";
import { auditPageSEO } from "../lib/seo/on-page-scorer";
import { generateWebsiteZIP, exportProjectBackup, saveProjectToDB } from "../lib/storage/db";
import { BRAND } from "@/config/brand";
import {
  Sparkles,
  Upload,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  FileText,
  Clock,
  Download,
  Calendar,
  Layers,
  ChevronRight,
  ChevronLeft,
  Check,
  X,
  ShieldAlert,
  HelpCircle,
  BarChart3,
  FileCheck,
  Loader2,
} from "lucide-react";

interface MonthlyOptimizationCycleModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: SavedProject;
  onCycleSaved: (updatedProject: SavedProject) => void;
}

interface PriorityOpportunityPage {
  pagePath: string;
  primaryQuery: string;
  impressions: number;
  position: number;
  ctr: number;
  reason: string;
  opportunityType: "striking-distance" | "low-ctr" | "missing-content";
  isTooRecent: boolean;
  daysSinceLastEdit: number;
  selected: boolean;
}

export function MonthlyOptimizationCycleModal({
  isOpen,
  onClose,
  project,
  onCycleSaved,
}: MonthlyOptimizationCycleModalProps) {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const cycleStartTime = useMemo(() => Date.now(), []);

  // Step 1: Upload State
  const defaultDateRange = useMemo(() => {
    const d = new Date();
    return `Last 28 days, ending ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  }, []);
  const [dateRangeInput, setDateRangeInput] = useState(defaultDateRange);
  const [csvQueriesText, setCsvQueriesText] = useState("");
  const [csvPagesText, setCsvPagesText] = useState("");
  const [parsedQueries, setParsedQueries] = useState<GSCQueryRow[]>([]);
  const [parsedPages, setParsedPages] = useState<GSCPageRow[]>([]);

  // Step 3: Priority Pages Selection
  const [priorityPages, setPriorityPages] = useState<PriorityOpportunityPage[]>([]);

  // Step 4: Optimization Workbench
  const [activeOptimizingIndex, setActiveOptimizingIndex] = useState<number>(0);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [workingFiles, setWorkingFiles] = useState<{ path: string; content: string }[]>([]);
  const [appliedOptimizations, setAppliedOptimizations] = useState<AppliedPageOptimization[]>([]);
  const [currentSuggestions, setCurrentSuggestions] = useState<string[]>([]);
  const [candidateHtml, setCandidateHtml] = useState<string>("");

  // Step 6 & 7: Notes & Export
  const [cycleNotes, setCycleNotes] = useState("");
  const [isExportingZip, setIsExportingZip] = useState(false);
  const [isExportingBackup, setIsExportingBackup] = useState(false);

  // Initialize working files from project
  useEffect(() => {
    if (project && project.files) {
      setWorkingFiles(project.files.map((f) => ({ path: f.path, content: f.content })));
    }
  }, [project]);

  // Previous Cycle Info (if any)
  const previousCycle: OptimizationCycle | null = useMemo(() => {
    const list = project.optimizationCycles || [];
    return list.length > 0 ? list[list.length - 1] : null;
  }, [project.optimizationCycles]);

  // Handle Quick Sample Data Load
  const handleLoadSampleData = () => {
    const bizType = project.formData?.businessType || "Plumbing Service";
    const city = project.formData?.city || "Dallas";
    const sampleQueriesCsv = `Query,Clicks,Impressions,CTR,Position
emergency ${bizType.toLowerCase()} ${city},142,1850,7.67%,2.8
${bizType.toLowerCase()} repair near me,88,2400,3.67%,7.4
24 hour ${bizType.toLowerCase()} ${city} tx,64,1200,5.33%,4.2
licensed master ${bizType.toLowerCase()},35,950,3.68%,8.9
affordable ${bizType.toLowerCase()} inspection,22,1480,1.48%,11.3
commercial ${bizType.toLowerCase()} contractors,18,890,2.02%,9.1
water leak detection ${city},12,1650,0.72%,14.5
drain cleaning and unclogging,45,1900,2.37%,6.8
tankless water heater installation,29,1320,2.19%,8.5
sewer line camera inspection,15,1150,1.30%,12.2`;

    const samplePagesCsv = `Page,Clicks,Impressions,CTR,Position
https://${project.businessDetails?.websiteDomain || "example.com"}/index.html,210,3800,5.52%,4.5
https://${project.businessDetails?.websiteDomain || "example.com"}/services.html,95,2900,3.28%,7.2
https://${project.businessDetails?.websiteDomain || "example.com"}/emergency-repair.html,78,1650,4.72%,3.9
https://${project.businessDetails?.websiteDomain || "example.com"}/contact.html,42,850,4.94%,5.1
https://${project.businessDetails?.websiteDomain || "example.com"}/about.html,15,620,2.42%,9.8`;

    setCsvQueriesText(sampleQueriesCsv);
    setCsvPagesText(samplePagesCsv);

    const qResult = parseGscCsv(sampleQueriesCsv);
    const pResult = parseGscCsv(samplePagesCsv);
    setParsedQueries(qResult.queries);
    setParsedPages(pResult.pages);
  };

  // Step 1: Process Search Console Files
  const handleProcessUploads = () => {
    let queries = parsedQueries;
    let pages = parsedPages;

    if (csvQueriesText && queries.length === 0) {
      const qRes = parseGscCsv(csvQueriesText);
      queries = qRes.queries;
      setParsedQueries(queries);
    }

    if (csvPagesText && pages.length === 0) {
      const pRes = parseGscCsv(csvPagesText);
      pages = pRes.pages;
      setParsedPages(pages);
    }

    if (queries.length === 0 && pages.length === 0) {
      alert("Please upload Search Console CSV queries or pages data, or click 'Load Realistic Sample Data'.");
      return;
    }

    // Synthesize priority opportunities list for Step 3
    computePriorityOpportunities(queries, pages);
    setCurrentStep(2);
  };

  // Compute Priority List with Plain-Language Explanations & 4-Week Safety Cooldown
  const computePriorityOpportunities = (queries: GSCQueryRow[], pages: GSCPageRow[]) => {
    const list: PriorityOpportunityPage[] = [];
    const now = Date.now();
    const fourWeeksMs = 28 * 24 * 60 * 60 * 1000;

    // Check project changeLog for page edit history
    const pageLastEditedMap: Record<string, number> = {};
    if (project.changeLog) {
      for (const log of project.changeLog) {
        if (log.affectedPages) {
          for (const p of log.affectedPages) {
            if (!pageLastEditedMap[p] || log.timestamp > pageLastEditedMap[p]) {
              pageLastEditedMap[p] = log.timestamp;
            }
          }
        }
      }
    }

    // Group queries by matched or associated page
    const htmlFiles = project.files.filter((f) => f.path.endsWith(".html"));

    for (const file of htmlFiles) {
      const lastEdited = pageLastEditedMap[file.path] || (file as any).lastModified || (now - 35 * 86400000);
      const daysSince = Math.floor((now - lastEdited) / (1000 * 60 * 60 * 24));
      const isTooRecent = (now - lastEdited) < fourWeeksMs;

      // Find top queries for this page or matching title
      const pageQueries = queries.filter(
        (q) => !q.pageUrl || q.pageUrl.includes(file.path) || file.path === "index.html"
      );

      // Check Striking Distance: position 4 - 20
      const striking = pageQueries.find((q) => q.position >= 4 && q.position <= 20 && q.impressions >= 100);
      // Check Low CTR: high impressions, CTR below benchmark
      const lowCtr = pageQueries.find((q) => {
        const expected = getExpectedCtrForPosition(q.position);
        return q.impressions >= 250 && q.ctr < expected * 0.7;
      });

      if (striking) {
        list.push({
          pagePath: file.path,
          primaryQuery: striking.query,
          impressions: striking.impressions,
          position: striking.position,
          ctr: striking.ctr,
          reason: `Position ${striking.position.toFixed(1)} with ${striking.impressions.toLocaleString()} monthly impressions. Moving this into top 3 can double traffic.`,
          opportunityType: "striking-distance",
          isTooRecent,
          daysSinceLastEdit: daysSince,
          selected: !isTooRecent,
        });
      } else if (lowCtr) {
        list.push({
          pagePath: file.path,
          primaryQuery: lowCtr.query,
          impressions: lowCtr.impressions,
          position: lowCtr.position,
          ctr: lowCtr.ctr,
          reason: `High impressions (${lowCtr.impressions.toLocaleString()}) but below-average CTR (${(lowCtr.ctr * 100).toFixed(1)}%). Improving title tag & meta description will capture more clicks.`,
          opportunityType: "low-ctr",
          isTooRecent,
          daysSinceLastEdit: daysSince,
          selected: !isTooRecent,
        });
      } else if (pageQueries.length > 0) {
        const topQ = pageQueries[0];
        list.push({
          pagePath: file.path,
          primaryQuery: topQ.query,
          impressions: topQ.impressions,
          position: topQ.position,
          ctr: topQ.ctr,
          reason: `Top search keyword (${topQ.query}). Adding FAQ item and subheading will reinforce keyword relevance.`,
          opportunityType: "missing-content",
          isTooRecent,
          daysSinceLastEdit: daysSince,
          selected: false,
        });
      }
    }

    // Sort by impressions descending, limit to top 8
    list.sort((a, b) => b.impressions - a.impressions);
    setPriorityPages(list.slice(0, 8));
  };

  // Step 2 Calculations: Current Site-Wide Metrics & Deltas vs Previous Cycle
  const currentMetrics = useMemo(() => {
    const totalClicks = parsedQueries.reduce((acc, q) => acc + q.clicks, 0) || parsedPages.reduce((acc, p) => acc + p.clicks, 0);
    const totalImpressions = parsedQueries.reduce((acc, q) => acc + q.impressions, 0) || parsedPages.reduce((acc, p) => acc + p.impressions, 0);
    const avgPosition = parsedQueries.length > 0
      ? parsedQueries.reduce((acc, q) => acc + q.position, 0) / parsedQueries.length
      : parsedPages.length > 0
      ? parsedPages.reduce((acc, p) => acc + p.position, 0) / parsedPages.length
      : 0;
    const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) : 0;

    return {
      clicks: totalClicks,
      impressions: totalImpressions,
      avgPosition: Number(avgPosition.toFixed(1)),
      ctr: Number((ctr * 100).toFixed(2)),
    };
  }, [parsedQueries, parsedPages]);

  const metricsDelta = useMemo(() => {
    if (!previousCycle) return null;
    const prev = previousCycle.siteMetrics;
    return {
      clicks: currentMetrics.clicks - prev.clicks,
      impressions: currentMetrics.impressions - prev.impressions,
      avgPosition: Number((prev.position - currentMetrics.avgPosition).toFixed(1)), // positive means improved rank
      ctr: Number((currentMetrics.ctr - (prev.ctr * 100)).toFixed(2)),
    };
  }, [currentMetrics, previousCycle]);

  // Selected Pages for Optimization in Step 4
  const selectedPagesForOptimization = useMemo(() => {
    return priorityPages.filter((p) => p.selected);
  }, [priorityPages]);

  // Step 4: Run AI Optimization for Selected Page
  const handleFetchOptimizationSuggestions = async (opp: PriorityOpportunityPage) => {
    const file = workingFiles.find((f) => f.path === opp.pagePath);
    if (!file) return;

    setIsAiGenerating(true);
    setCurrentSuggestions([]);
    setCandidateHtml("");

    try {
      const res = await fetch("/api/search-console/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagePath: opp.pagePath,
          currentHtml: file.content,
          query: opp.primaryQuery,
          impressions: opp.impressions,
          position: opp.position,
          dateRange: dateRangeInput,
          businessType: project.formData?.businessType || "Contractor",
          city: project.formData?.city || "Local",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setCurrentSuggestions(data.suggestions || []);
        setCandidateHtml(data.optimizedHtml || file.content);
      } else {
        alert(data.error || "Could not generate optimization suggestions.");
      }
    } catch (err: any) {
      alert(`Optimization request failed: ${err.message}`);
    } finally {
      setIsAiGenerating(false);
    }
  };

  // Step 4: Apply Candidate Optimization to Working File
  const handleApplyOptimization = (opp: PriorityOpportunityPage) => {
    if (!candidateHtml) return;

    const oldFile = workingFiles.find((f) => f.path === opp.pagePath);
    const scoreBefore = oldFile ? auditPageSEO(oldFile.content, opp.pagePath, opp.primaryQuery).totalScore : 70;
    const scoreAfter = auditPageSEO(candidateHtml, opp.pagePath, opp.primaryQuery).totalScore;

    setWorkingFiles((prev) =>
      prev.map((f) => (f.path === opp.pagePath ? { ...f, content: candidateHtml } : f))
    );

    const newOpt: AppliedPageOptimization = {
      pagePath: opp.pagePath,
      targetQuery: opp.primaryQuery,
      previousPosition: opp.position,
      impressions: opp.impressions,
      summary: currentSuggestions.slice(0, 2).join(". ") || `Optimized for ${opp.primaryQuery}`,
      appliedAt: Date.now(),
      seoScoreBefore: scoreBefore,
      seoScoreAfter: scoreAfter,
    };

    setAppliedOptimizations((prev) => [
      ...prev.filter((item) => item.pagePath !== opp.pagePath),
      newOpt,
    ]);

    // Move to next page in list if available
    if (activeOptimizingIndex < selectedPagesForOptimization.length - 1) {
      setActiveOptimizingIndex(activeOptimizingIndex + 1);
    }
  };

  // Step 6: Download Changed Files Only ZIP
  const handleDownloadChangedZip = async () => {
    setIsExportingZip(true);
    try {
      const mockProject: SavedProject = {
        ...project,
        files: workingFiles.map((wf) => {
          const isModified = appliedOptimizations.some((ao) => ao.pagePath === wf.path);
          return {
            path: wf.path,
            content: wf.content,
            lastModified: isModified ? Date.now() : 0,
          };
        }),
      };

      const { blob, changedFilesCount } = await generateWebsiteZIP(
        mockProject,
        "changed-only",
        cycleStartTime - 1000
      );

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-cycle-updates.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Export failed: ${err.message}`);
    } finally {
      setIsExportingZip(false);
    }
  };

  // Step 6: Download Backup .siteproject
  const handleDownloadBackup = async () => {
    setIsExportingBackup(true);
    try {
      const mockProject: SavedProject = {
        ...project,
        files: workingFiles.map((f) => ({
          path: f.path,
          content: f.content,
          lastModified: Date.now(),
        })),
      };
      const blob = await exportProjectBackup(mockProject);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-backup.siteproject`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Backup failed: ${err.message}`);
    } finally {
      setIsExportingBackup(false);
    }
  };

  // Step 7: Finalize & Save Optimization Cycle to Project
  const handleSaveCycle = async () => {
    const cycleNum = (project.optimizationCycles?.length || 0) + 1;
    const now = Date.now();
    const dateStr = new Date().toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    const pagesChanged = appliedOptimizations.map((ao) => ao.pagePath);

    // Snapshot page metrics
    const pageMetricsSnapshot: PageMetricSnapshot[] = parsedPages.map((p) => ({
      pagePath: p.matchedPagePath || p.pageUrl,
      clicks: p.clicks,
      impressions: p.impressions,
      ctr: p.ctr,
      position: p.position,
    }));

    const newCycle: OptimizationCycle = {
      id: `cycle-${now}`,
      cycleNumber: cycleNum,
      date: new Date().toISOString().split("T")[0],
      dateStr,
      dateRange: dateRangeInput,
      timestamp: now,
      notes: cycleNotes.trim() || undefined,
      siteMetrics: {
        clicks: currentMetrics.clicks,
        impressions: currentMetrics.impressions,
        ctr: currentMetrics.ctr / 100,
        position: currentMetrics.avgPosition,
      },
      pageMetrics: pageMetricsSnapshot,
      pagesChanged,
      appliedOptimizations,
    };

    const newChangeLogEntry: ProjectChangeLogEntry = {
      id: `log-cycle-${now}`,
      timestamp: now,
      dateStr,
      summary: `Completed Monthly Optimization Cycle #${cycleNum} (${dateRangeInput})`,
      affectedPages: pagesChanged,
      note: cycleNotes || `Optimized ${pagesChanged.length} pages targeting Search Console ranking opportunities.`,
    };

    const updatedFiles = workingFiles.map((wf) => ({
      path: wf.path,
      content: wf.content,
      lastModified: pagesChanged.includes(wf.path) ? now : undefined,
    }));

    const updatedProject: SavedProject = {
      ...project,
      files: updatedFiles,
      lastEditedAt: now,
      optimizationCycles: [...(project.optimizationCycles || []), newCycle],
      changeLog: [newChangeLogEntry, ...(project.changeLog || [])],
    };

    await saveProjectToDB(updatedProject);
    onCycleSaved(updatedProject);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[94vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold">Monthly Optimization Cycle</h2>
                <span className="text-[10px] font-bold bg-indigo-500/30 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full">
                  Step {currentStep} of 7
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {project.name} • Systematic ranking optimization with Google Search Console
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between text-[11px] font-semibold text-slate-600 overflow-x-auto shrink-0">
          {[
            { step: 1, label: "Upload Data" },
            { step: 2, label: "Results vs Last Cycle" },
            { step: 3, label: "Priority Opportunities" },
            { step: 4, label: "Optimize" },
            { step: 5, label: "Review Changes" },
            { step: 6, label: "Export Files" },
            { step: 7, label: "Save Cycle" },
          ].map((s) => (
            <div
              key={s.step}
              className={`flex items-center space-x-1.5 whitespace-nowrap px-1.5 ${
                currentStep === s.step
                  ? "text-indigo-600 font-bold"
                  : currentStep > s.step
                  ? "text-emerald-700 font-semibold"
                  : "text-slate-400"
              }`}
            >
              <span
                className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  currentStep === s.step
                    ? "bg-indigo-600 text-white"
                    : currentStep > s.step
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-500"
                }`}
              >
                {currentStep > s.step ? "✓" : s.step}
              </span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Body Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* STEP 1: UPLOAD DATA */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Step 1: Upload Search Console Performance Data
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Export CSV files from Google Search Console (Performance &gt; Export &gt; CSV) and upload Queries and Pages.
                </p>
              </div>

              {/* Date Range Selector & Sample Trigger */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex-1 max-w-sm">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Reporting Date Range
                  </label>
                  <input
                    type="text"
                    value={dateRangeInput}
                    onChange={(e) => setDateRangeInput(e.target.value)}
                    placeholder="e.g. Last 28 days, ending Oct 20"
                    className="input-base text-xs bg-white"
                  />
                </div>

                <div className="sm:text-right">
                  <span className="block text-[11px] text-slate-500 mb-1">
                    Need instant test data?
                  </span>
                  <button
                    type="button"
                    onClick={handleLoadSampleData}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold hover:bg-indigo-100 transition shadow-2xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Load Realistic Sample GSC Data</span>
                  </button>
                </div>
              </div>

              {/* CSV Upload Areas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Queries File */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                      <FileText className="w-4 h-4 text-indigo-600" />
                      <span>Queries.csv (Site-wide or Page)</span>
                    </span>
                    {parsedQueries.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {parsedQueries.length} Queries Loaded
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={5}
                    value={csvQueriesText}
                    onChange={(e) => {
                      setCsvQueriesText(e.target.value);
                      const res = parseGscCsv(e.target.value);
                      setParsedQueries(res.queries);
                    }}
                    placeholder="Paste CSV text here or choose file below..."
                    className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 bg-slate-50"
                  />
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const txt = ev.target?.result as string;
                        setCsvQueriesText(txt);
                        const res = parseGscCsv(txt);
                        setParsedQueries(res.queries);
                      };
                      reader.readAsText(file);
                    }}
                    className="text-xs text-slate-500"
                  />
                </div>

                {/* Pages File */}
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                      <Layers className="w-4 h-4 text-indigo-600" />
                      <span>Pages.csv (Optional)</span>
                    </span>
                    {parsedPages.length > 0 && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        {parsedPages.length} Pages Loaded
                      </span>
                    )}
                  </div>
                  <textarea
                    rows={5}
                    value={csvPagesText}
                    onChange={(e) => {
                      setCsvPagesText(e.target.value);
                      const res = parseGscCsv(e.target.value);
                      setParsedPages(res.pages);
                    }}
                    placeholder="Paste CSV text here or choose file below..."
                    className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-200 bg-slate-50"
                  />
                  <input
                    type="file"
                    accept=".csv,.tsv,.txt"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const txt = ev.target?.result as string;
                        setCsvPagesText(txt);
                        const res = parseGscCsv(txt);
                        setParsedPages(res.pages);
                      };
                      reader.readAsText(file);
                    }}
                    className="text-xs text-slate-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: RESULTS VS LAST CYCLE */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Step 2: Results vs. Last Optimization Cycle
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Performance comparison against previous monthly cycle benchmarks.
                </p>
              </div>

              {/* Site-Wide Metric Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Total Clicks */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Total Clicks
                  </span>
                  <div className="text-xl font-extrabold text-slate-900">
                    {currentMetrics.clicks.toLocaleString()}
                  </div>
                  {metricsDelta ? (
                    <div
                      className={`text-xs font-bold flex items-center space-x-0.5 ${
                        metricsDelta.clicks >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {metricsDelta.clicks >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {metricsDelta.clicks >= 0 ? "+" : ""}
                        {metricsDelta.clicks} vs last cycle
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">Baseline cycle</span>
                  )}
                </div>

                {/* Total Impressions */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Impressions
                  </span>
                  <div className="text-xl font-extrabold text-slate-900">
                    {currentMetrics.impressions.toLocaleString()}
                  </div>
                  {metricsDelta ? (
                    <div
                      className={`text-xs font-bold flex items-center space-x-0.5 ${
                        metricsDelta.impressions >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {metricsDelta.impressions >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {metricsDelta.impressions >= 0 ? "+" : ""}
                        {metricsDelta.impressions.toLocaleString()} vs last cycle
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">Baseline cycle</span>
                  )}
                </div>

                {/* Average Position */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Avg Position
                  </span>
                  <div className="text-xl font-extrabold text-slate-900">
                    {currentMetrics.avgPosition.toFixed(1)}
                  </div>
                  {metricsDelta ? (
                    <div
                      className={`text-xs font-bold flex items-center space-x-0.5 ${
                        metricsDelta.avgPosition >= 0 ? "text-emerald-600" : "text-amber-600"
                      }`}
                    >
                      {metricsDelta.avgPosition >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {metricsDelta.avgPosition >= 0 ? "+" : ""}
                        {metricsDelta.avgPosition} rank change
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">Baseline cycle</span>
                  )}
                </div>

                {/* Average CTR */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    Organic CTR
                  </span>
                  <div className="text-xl font-extrabold text-slate-900">
                    {currentMetrics.ctr}%
                  </div>
                  {metricsDelta ? (
                    <div
                      className={`text-xs font-bold flex items-center space-x-0.5 ${
                        metricsDelta.ctr >= 0 ? "text-emerald-600" : "text-red-600"
                      }`}
                    >
                      {metricsDelta.ctr >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {metricsDelta.ctr >= 0 ? "+" : ""}
                        {metricsDelta.ctr}% vs last cycle
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-slate-400">Baseline cycle</span>
                  )}
                </div>
              </div>

              {/* Previous Cycle Edits Overview */}
              {previousCycle ? (
                <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>
                      Previous Cycle #{previousCycle.cycleNumber} ({previousCycle.dateStr})
                    </span>
                  </h4>
                  <p className="text-xs text-slate-600">
                    {previousCycle.pagesChanged.length} pages were modified in the previous cycle:{" "}
                    <span className="font-mono">{previousCycle.pagesChanged.join(", ")}</span>
                  </p>
                  {previousCycle.notes && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                      &quot;{previousCycle.notes}&quot;
                    </p>
                  )}
                </div>
              ) : (
                <div className="border border-dashed border-slate-300 rounded-xl p-4 text-center text-xs text-slate-500">
                  This is your first recorded optimization cycle. {BRAND.name} will record this upload as your baseline to compare against next month!
                </div>
              )}
            </div>
          )}

          {/* STEP 3: PRIORITY LIST */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Step 3: High-Potential Priority Opportunities
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Top pages ranked by search impressions and opportunity. Select the pages you want to optimize this month.
                </p>
              </div>

              {priorityPages.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  No striking-distance ranking opportunities detected in this dataset.
                </div>
              ) : (
                <div className="space-y-3">
                  {priorityPages.map((opp, idx) => (
                    <div
                      key={opp.pagePath}
                      onClick={() => {
                        setPriorityPages((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, selected: !p.selected } : p))
                        );
                      }}
                      className={`p-4 rounded-xl border transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        opp.selected
                          ? "bg-indigo-50/40 border-indigo-300 ring-1 ring-indigo-300"
                          : "bg-white border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          type="checkbox"
                          checked={opp.selected}
                          onChange={() => {}}
                          className="mt-1 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono font-bold text-xs text-slate-900">
                              /{opp.pagePath}
                            </span>
                            {opp.isTooRecent ? (
                              <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full">
                                <Clock className="w-3 h-3" />
                                <span>wait — too recent to judge ({opp.daysSinceLastEdit}d ago)</span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                                Ready for optimization
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-700">
                            <strong>Query:</strong> &quot;{opp.primaryQuery}&quot; •{" "}
                            <strong>Position:</strong> {opp.position.toFixed(1)} •{" "}
                            <strong>Impressions:</strong> {opp.impressions.toLocaleString()}
                          </p>
                          <p className="text-[11px] text-slate-500 leading-relaxed">{opp.reason}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 4: OPTIMIZE WORKBENCH */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Step 4: Optimize Selected Pages
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review keyword targeting adjustments and apply enhancements directly to your pages.
                </p>
              </div>

              {selectedPagesForOptimization.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  No pages selected for optimization. Go back to Step 3 and check at least one page.
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selector Tabs across selected pages */}
                  <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200">
                    {selectedPagesForOptimization.map((opp, idx) => {
                      const isDone = appliedOptimizations.some((ao) => ao.pagePath === opp.pagePath);
                      return (
                        <button
                          key={opp.pagePath}
                          type="button"
                          onClick={() => {
                            setActiveOptimizingIndex(idx);
                            setCurrentSuggestions([]);
                            setCandidateHtml("");
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap flex items-center space-x-1.5 transition ${
                            activeOptimizingIndex === idx
                              ? "bg-indigo-600 text-white"
                              : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                          }`}
                        >
                          {isDone ? <span>✓</span> : <span>#{idx + 1}</span>}
                          <span>/{opp.pagePath}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Page Card */}
                  {selectedPagesForOptimization[activeOptimizingIndex] && (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                      {(() => {
                        const opp = selectedPagesForOptimization[activeOptimizingIndex];
                        const isApplied = appliedOptimizations.some(
                          (ao) => ao.pagePath === opp.pagePath
                        );

                        return (
                          <>
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                              <div>
                                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                                  <span>Target Page: /{opp.pagePath}</span>
                                  {isApplied && (
                                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                                      Optimized &amp; Applied
                                    </span>
                                  )}
                                </h4>
                                <p className="text-xs text-slate-500">
                                  Query: <strong>&quot;{opp.primaryQuery}&quot;</strong> (Pos{" "}
                                  {opp.position.toFixed(1)}, {opp.impressions} impressions)
                                </p>
                              </div>

                              <button
                                type="button"
                                disabled={isAiGenerating}
                                onClick={() => handleFetchOptimizationSuggestions(opp)}
                                className="inline-flex items-center space-x-1 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
                              >
                                {isAiGenerating ? (
                                  <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    <span>Generating recommendations…</span>
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span>Run Page Optimization</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {/* Suggestions Display */}
                            {currentSuggestions.length > 0 && (
                              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                                <h5 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                                  <Sparkles className="w-4 h-4 text-indigo-600" />
                                  <span>Search Console Recommendations</span>
                                </h5>
                                <ul className="space-y-1.5 text-xs text-slate-700 list-disc list-inside">
                                  {currentSuggestions.map((sug, i) => (
                                    <li key={i} className="leading-relaxed">
                                      {sug}
                                    </li>
                                  ))}
                                </ul>

                                <div className="pt-2 flex items-center justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleApplyOptimization(opp)}
                                    className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                                  >
                                    <Check className="w-4 h-4" />
                                    <span>Apply Recommendations to Page</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 5: REVIEW CHANGES */}
          {currentStep === 5 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Step 5: Review Applied Changes &amp; Scores
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Confirm quality checks and on-page SEO scores for all pages updated during this cycle.
                </p>
              </div>

              {appliedOptimizations.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500">
                  No optimizations applied yet. You can still proceed to export or complete the cycle.
                </div>
              ) : (
                <div className="space-y-3">
                  {appliedOptimizations.map((opt) => (
                    <div
                      key={opt.pagePath}
                      className="p-4 bg-white border border-slate-200 rounded-xl space-y-2 shadow-2xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          /{opt.pagePath}
                        </span>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-slate-500">Score:</span>
                          <span className="font-bold text-slate-400 line-through">
                            {opt.seoScoreBefore || 70}
                          </span>
                          <span>→</span>
                          <span className="font-bold text-emerald-600">
                            {opt.seoScoreAfter || 92} / 100
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600">
                        <strong>Target Query:</strong> &quot;{opt.targetQuery}&quot; (Previous Pos{" "}
                        {opt.previousPosition?.toFixed(1)})
                      </p>
                      <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2 rounded border border-slate-100">
                        {opt.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* STEP 6: EXPORT FILES */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Step 6: Export Updated Files
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Deploy only the files that changed, or save an updated .siteproject backup.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Changed Files Only ZIP */}
                <div className="p-5 bg-indigo-50/50 border border-indigo-200 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                      <Download className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Download Changed Files (ZIP)
                    </h4>
                    <p className="text-xs text-slate-600">
                      Packages only the pages edited this cycle, plus updated sitemap.xml and redirects. Perfect for quick FTP / server upload!
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isExportingZip}
                    onClick={handleDownloadChangedZip}
                    className="w-full inline-flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExportingZip ? "Generating ZIP…" : "Download Changed Files ZIP"}</span>
                  </button>
                </div>

                {/* Full .siteproject Backup */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center">
                      <Layers className="w-5 h-5" />
                    </div>
                    <h4 className="text-xs font-bold text-slate-900">
                      Download Backup (.siteproject)
                    </h4>
                    <p className="text-xs text-slate-600">
                      Exports full project state including all cycles history, business details, images, and keywords.
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isExportingBackup}
                    onClick={handleDownloadBackup}
                    className="w-full inline-flex items-center justify-center space-x-1.5 py-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 text-xs font-bold transition shadow-2xs"
                  >
                    <Download className="w-4 h-4" />
                    <span>{isExportingBackup ? "Creating Backup…" : "Download Backup File"}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 7: SAVE CYCLE */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Step 7: Record Optimization Cycle
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Save cycle summary and metric snapshots into project history for next month&apos;s comparison.
                </p>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Cycle Number</span>
                    <strong className="text-slate-900 font-bold">
                      #{(project.optimizationCycles?.length || 0) + 1}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Date</span>
                    <strong className="text-slate-900 font-bold">
                      {new Date().toLocaleDateString()}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Reporting Window</span>
                    <strong className="text-slate-900 font-bold">{dateRangeInput}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Pages Changed</span>
                    <strong className="text-slate-900 font-bold">
                      {appliedOptimizations.length} pages
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Cycle Notes &amp; Observations (Optional)
                  </label>
                  <textarea
                    rows={3}
                    value={cycleNotes}
                    onChange={(e) => setCycleNotes(e.target.value)}
                    placeholder="e.g. Added emergency drain cleaning FAQs, updated index meta description for higher CTR..."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            disabled={currentStep === 1}
            onClick={() => setCurrentStep((prev) => Math.max(prev - 1, 1))}
            className={`inline-flex items-center space-x-1 px-4 py-2 rounded-xl text-xs font-semibold transition ${
              currentStep === 1
                ? "opacity-40 cursor-not-allowed text-slate-400"
                : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-2">
            {currentStep < 7 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1) {
                    handleProcessUploads();
                  } else {
                    setCurrentStep((prev) => Math.min(prev + 1, 7));
                  }
                }}
                className="inline-flex items-center space-x-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
              >
                <span>Continue</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSaveCycle}
                className="inline-flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Optimization Cycle</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
