"use client";

import React, { useState, useMemo } from "react";
import {
  parseGscCsv,
  generateGscOpportunities,
  compareGscDatasets,
  GSCUploadDataset,
  GSCOpportunitiesReport,
} from "../lib/search-console/search-console-analyzer";
import {
  buildComprehensiveOpportunityList,
  GSCOpportunityRecommendation,
  OpportunityAction,
} from "@/lib/seo/opportunity-engine";
import { AddNewPageInitialData } from "@/components/AddNewPageModal";
import {
  TrendingUp,
  Upload,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  FileText,
  Search,
  CheckCircle2,
  Calendar,
  Layers,
  ChevronRight,
  Check,
  FilePlus,
  ShieldCheck,
  Target,
  ExternalLink,
} from "lucide-react";
import { BRAND } from "@/config/brand";

interface SearchConsoleHubProps {
  files: { path: string; content: string }[];
  keywordMap: { pagePath: string; primaryKeyword: string }[];
  serviceAreas: string[];
  businessType: string;
  city: string;
  changeLog: { dateStr: string; summary: string }[];
  customContentInstructions?: string;
  onApplyOptimization?: (pagePath: string, newHtml: string, summary: string) => void;
  onRequestCreateDedicatedPage?: (initialData: AddNewPageInitialData) => void;
  onSelectExistingPage?: (pagePath: string) => void;
}

export function SearchConsoleHub({
  files,
  keywordMap,
  serviceAreas,
  businessType,
  city,
  changeLog,
  customContentInstructions,
  onApplyOptimization,
  onRequestCreateDedicatedPage,
  onSelectExistingPage,
}: SearchConsoleHubProps) {
  const [datasets, setDatasets] = useState<GSCUploadDataset[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null);

  // Upload Form State
  const [dateRangeLabel, setDateRangeLabel] = useState("Last 28 days, ending Oct 20");
  const [uploadType, setUploadType] = useState<"site-wide" | "per-page">("site-wide");
  const [targetPagePath, setTargetPagePath] = useState<string>("index.html");
  const [csvText, setCsvText] = useState("");

  // Filter state for Strategic Opportunities
  const [strategyFilter, setStrategyFilter] = useState<"all" | "create_page" | "improve_page">("all");

  // AI Optimization Action State
  const [optimizingQuery, setOptimizingQuery] = useState<any | null>(null);
  const [isAiOptimizing, setIsAiOptimizing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any | null>(null);

  // Active Dataset
  const activeDataset = useMemo(() => {
    return datasets.find((d) => d.id === selectedDatasetId) || datasets[0] || null;
  }, [datasets, selectedDatasetId]);

  // Generate Standard Opportunity Report
  const opportunities: GSCOpportunitiesReport | null = useMemo(() => {
    if (!activeDataset) return null;
    return generateGscOpportunities(activeDataset, files, keywordMap, serviceAreas);
  }, [activeDataset, files, keywordMap, serviceAreas]);

  // Generate Strategic Opportunity Engine Recommendations
  const strategicOpportunities: GSCOpportunityRecommendation[] = useMemo(() => {
    if (!activeDataset || !activeDataset.queries || activeDataset.queries.length === 0) return [];
    return buildComprehensiveOpportunityList(
      activeDataset.queries,
      files,
      keywordMap,
      {
        businessType,
        city,
        serviceAreas,
      }
    );
  }, [activeDataset, files, keywordMap, businessType, city, serviceAreas]);

  const filteredStrategicOpportunities = useMemo(() => {
    if (strategyFilter === "all") return strategicOpportunities;
    return strategicOpportunities.filter((item) => item.action === strategyFilter);
  }, [strategicOpportunities, strategyFilter]);

  // Comparison with Previous Upload
  const comparison = useMemo(() => {
    if (datasets.length < 2) return null;
    return compareGscDatasets(datasets[1], datasets[0]);
  }, [datasets]);

  // Handle CSV File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  };

  // Process & Save Dataset
  const handleSaveDataset = () => {
    if (!csvText.trim()) return;

    const { queries, pages } = parseGscCsv(
      csvText,
      uploadType === "per-page" ? targetPagePath : undefined
    );

    if (queries.length === 0 && pages.length === 0) {
      alert("No valid Search Console rows detected. Please check CSV format.");
      return;
    }

    const newDataset: GSCUploadDataset = {
      id: `dataset-${Date.now()}`,
      dateRangeLabel: dateRangeLabel.trim() || `Upload on ${new Date().toLocaleDateString()}`,
      uploadedAt: Date.now(),
      type: uploadType,
      targetPagePath: uploadType === "per-page" ? targetPagePath : undefined,
      queries,
      pages,
    };

    setDatasets([newDataset, ...datasets]);
    setSelectedDatasetId(newDataset.id);
    setCsvText("");
  };

  // Run AI Optimization for Existing Page
  const handleRunGscOptimize = async (
    query: string,
    pagePath: string,
    impressions: number,
    position: number
  ) => {
    const file = files.find((f) => f.path === pagePath);
    if (!file) {
      alert(`Could not find page content for ${pagePath}`);
      return;
    }

    setIsAiOptimizing(true);
    setOptimizingQuery({ query, pagePath, impressions, position });

    let storedProvider = "custom";
    let storedKey = "";
    let storedModel = "";
    try {
      const saved = localStorage.getItem("altofox_ai_provider");
      if (saved) storedProvider = saved;
      const key = localStorage.getItem(`altofox_api_key_${storedProvider}`);
      if (key) storedKey = key;
      const model = localStorage.getItem(`altofox_model_${storedProvider}`);
      if (model) storedModel = model;
    } catch {}

    try {
      const res = await fetch("/api/search-console/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagePath,
          currentHtml: file.content,
          query,
          impressions,
          position,
          dateRange: activeDataset?.dateRangeLabel,
          businessType,
          city,
          customContentInstructions,
          provider: storedProvider,
          apiKey: storedKey || undefined,
          model: storedModel,
        }),
      });

      const data = await res.json();
      if (data.success && data.suggestions) {
        setAiSuggestions(data);
      } else {
        alert(data.error || "Failed to generate Search Console optimization suggestions.");
      }
    } catch (err: any) {
      alert(`Optimization error: ${err.message}`);
    } finally {
      setIsAiOptimizing(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <span>Search Console Optimization Helper</span>
          </h2>
          <p className="text-xs text-slate-600 mt-0.5">
            Upload CSV/TSV performance exports from Google Search Console. {BRAND.name} determines whether to improve existing pages or create dedicated landing pages with zero keyword cannibalization.
          </p>
        </div>

        {onRequestCreateDedicatedPage && (
          <button
            type="button"
            onClick={() => onRequestCreateDedicatedPage({})}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs self-start sm:self-auto shrink-0"
          >
            <FilePlus className="w-4 h-4" />
            <span>+ Add New Page</span>
          </button>
        )}
      </div>

      {/* Upload Box */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
            <Upload className="w-4 h-4 text-indigo-600" />
            <span>Upload Performance Export (CSV or TSV)</span>
          </span>
          {datasets.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">Active Period:</span>
              <select
                value={selectedDatasetId || ""}
                onChange={(e) => setSelectedDatasetId(e.target.value)}
                className="text-xs p-1 rounded border border-slate-300 bg-white"
              >
                {datasets.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.dateRangeLabel} ({d.queries.length} queries)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Date Range Label
            </label>
            <input
              type="text"
              value={dateRangeLabel}
              onChange={(e) => setDateRangeLabel(e.target.value)}
              placeholder="e.g. Last 28 days, ending Oct 20"
              className="input-base text-xs bg-white"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-700 mb-1">
              Export Scope
            </label>
            <select
              value={uploadType}
              onChange={(e) => setUploadType(e.target.value as any)}
              className="input-base text-xs bg-white"
            >
              <option value="site-wide">Site-Wide Performance</option>
              <option value="per-page">Single Filtered Page</option>
            </select>
          </div>

          {uploadType === "per-page" && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Target Page
              </label>
              <select
                value={targetPagePath}
                onChange={(e) => setTargetPagePath(e.target.value)}
                className="input-base text-xs bg-white"
              >
                {files
                  .filter((f) => f.path.endsWith(".html"))
                  .map((f) => (
                    <option key={f.path} value={f.path}>
                      {f.path}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          <input
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={handleFileUpload}
            className="text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
          />
          <button
            type="button"
            onClick={handleSaveDataset}
            disabled={!csvText.trim()}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition disabled:opacity-50 ml-auto"
          >
            Process &amp; Save Export
          </button>
        </div>
      </div>

      {/* Metric Diffs Comparison Card */}
      {comparison && (
        <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-900 block">
            Performance Movement vs Previous Period ({datasets[1]?.dateRangeLabel})
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Clicks Delta</span>
              <span
                className={`text-sm font-extrabold flex items-center ${
                  comparison.totalClicksDelta >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {comparison.totalClicksDelta >= 0 ? "+" : ""}
                {comparison.totalClicksDelta}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Impressions Delta</span>
              <span
                className={`text-sm font-extrabold flex items-center ${
                  comparison.totalImpressionsDelta >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {comparison.totalImpressionsDelta >= 0 ? "+" : ""}
                {comparison.totalImpressionsDelta}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-[11px]">Avg Position</span>
              <span
                className={`text-sm font-extrabold flex items-center ${
                  comparison.avgPositionDelta >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {comparison.avgPositionDelta >= 0 ? "▲ +" : "▼ "}
                {comparison.avgPositionDelta}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
              <span className="text-slate-500 block text-[11px]">CTR Delta</span>
              <span
                className={`text-sm font-extrabold flex items-center ${
                  comparison.ctrDelta >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {comparison.ctrDelta >= 0 ? "+" : ""}
                {comparison.ctrDelta}%
              </span>
            </div>
          </div>
        </div>
      )}

      {/* STRATEGIC ACTION RECOMMENDATIONS (Tier 1 Opportunity Engine) */}
      {strategicOpportunities.length > 0 && (
        <div className="bg-white border border-indigo-100 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-50 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <Target className="w-4 h-4 text-indigo-600" />
                <span>Strategic Opportunity Engine: Improve Page vs Create New Page</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Evaluates query impressions, search intent, topical depth, and cannibalization risk to recommend the highest-ROI action.
              </p>
            </div>

            <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-lg text-[11px] font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => setStrategyFilter("all")}
                className={`px-2.5 py-1 rounded-md transition ${
                  strategyFilter === "all" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "hover:text-slate-900"
                }`}
              >
                All ({strategicOpportunities.length})
              </button>
              <button
                type="button"
                onClick={() => setStrategyFilter("create_page")}
                className={`px-2.5 py-1 rounded-md transition ${
                  strategyFilter === "create_page" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "hover:text-slate-900"
                }`}
              >
                Create Dedicated Page (
                {strategicOpportunities.filter((s) => s.action === "create_page").length})
              </button>
              <button
                type="button"
                onClick={() => setStrategyFilter("improve_page")}
                className={`px-2.5 py-1 rounded-md transition ${
                  strategyFilter === "improve_page" ? "bg-white text-indigo-700 shadow-2xs font-bold" : "hover:text-slate-900"
                }`}
              >
                Improve Existing (
                {strategicOpportunities.filter((s) => s.action === "improve_page").length})
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 space-y-3">
            {filteredStrategicOpportunities.slice(0, 10).map((opp) => (
              <div key={opp.id} className="pt-3 first:pt-0 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-xs">{opp.query}</span>
                      {opp.action === "create_page" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                          ✨ Create Dedicated Page
                        </span>
                      ) : opp.action === "improve_page" ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          🛠️ Improve Existing Page
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          👁️ Monitor Query
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-slate-500">
                        {opp.searchIntent.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      <strong>Rationale:</strong> {opp.reason}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-0.5">
                      <span>
                        Position: <strong>{opp.position.toFixed(1)}</strong>
                      </span>
                      <span>
                        Impressions: <strong>{opp.impressions.toLocaleString()}</strong>
                      </span>
                      <span>
                        CTR: <strong>{(opp.ctr * 100).toFixed(1)}%</strong>
                      </span>
                      {opp.cannibalization.hasRisk ? (
                        <span className="text-amber-700 font-semibold flex items-center space-x-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          <span>Similar to: {opp.cannibalization.conflictingPage}</span>
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>No Cannibalization Risk</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center space-x-2">
                    {opp.action === "create_page" && onRequestCreateDedicatedPage ? (
                      <button
                        type="button"
                        onClick={() =>
                          onRequestCreateDedicatedPage({
                            primaryQuery: opp.query,
                            serviceName: opp.serviceName,
                            locationCity: opp.locationCity,
                            searchIntent: opp.searchIntent,
                            title: opp.suggestedTitle,
                            slug: opp.suggestedSlug,
                            relatedQueries: opp.relatedQueries,
                            impressions: opp.impressions,
                            position: opp.position,
                          })
                        }
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs"
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                        <span>Create Dedicated Page</span>
                      </button>
                    ) : opp.targetExistingPage && onSelectExistingPage ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (opp.targetExistingPage) {
                            onSelectExistingPage(opp.targetExistingPage);
                          }
                        }}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Edit {opp.targetExistingPage}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleRunGscOptimize(
                            opp.query,
                            opp.targetExistingPage || "index.html",
                            opp.impressions,
                            opp.position
                          )
                        }
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Optimize Page</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STANDARD OPPORTUNITY REPORTS */}
      {opportunities && (
        <div className="space-y-6">
          {/* Report: New Dedicated Page Ideas */}
          {opportunities.newPageIdeas.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <FilePlus className="w-4 h-4 text-indigo-600" />
                  <span>🌟 High-Value Dedicated Landing Page Ideas</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Queries matching distinct service areas or specialty trades that do not currently have dedicated pages.
                </p>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {opportunities.newPageIdeas.map((idea, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-900 block">{idea.query}</span>
                      <span className="text-[11px] text-slate-500">
                        Suggested Title: <strong>{idea.suggestedTitle}</strong> • Impressions:{" "}
                        <strong>{idea.impressions.toLocaleString()}</strong>
                      </span>
                    </div>

                    {onRequestCreateDedicatedPage && (
                      <button
                        type="button"
                        onClick={() =>
                          onRequestCreateDedicatedPage({
                            primaryQuery: idea.query,
                            title: idea.suggestedTitle,
                            impressions: idea.impressions,
                          })
                        }
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shrink-0 transition shadow-xs"
                      >
                        <FilePlus className="w-3.5 h-3.5" />
                        <span>Create Dedicated Page</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Report 1: Almost Page 1 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                  <span>🚀 &quot;Almost Page 1&quot; Queries (Position 8–20)</span>
                  <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                    High ROI
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Queries on the cusp of top rankings with active search volume. Adding an H2 or dedicated FAQ section can push these to page 1.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {opportunities.almostPageOne.map((q, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="truncate">
                    <span className="font-bold text-slate-900 block truncate">{q.query}</span>
                    <span className="text-[11px] text-slate-500">
                      Position: <strong>{q.position.toFixed(1)}</strong> • Impressions:{" "}
                      <strong>{q.impressions.toLocaleString()}</strong> • Clicks: {q.clicks}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleRunGscOptimize(
                        q.query,
                        q.pageUrl || "index.html",
                        q.impressions,
                        q.position
                      )
                    }
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs shrink-0 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Optimize for this Query</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Report 2: Low Click Rate Opportunities */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
                <span>🎯 Low Click-Through Rate (CTR) Opportunities</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Good ranking and high impressions, but users aren&apos;t clicking. Improving title tags and meta descriptions will unlock immediate traffic.
              </p>
            </div>

            <div className="divide-y divide-slate-100 text-xs">
              {opportunities.lowCtrOpportunities.map((q, i) => (
                <div key={i} className="py-2.5 flex items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-slate-900">{q.query}</span>
                    <span className="text-[11px] text-slate-500 block">
                      CTR: <strong>{(q.ctr * 100).toFixed(1)}%</strong> • Impressions:{" "}
                      {q.impressions.toLocaleString()} • Position: {q.position.toFixed(1)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handleRunGscOptimize(
                        q.query,
                        q.pageUrl || "index.html",
                        q.impressions,
                        q.position
                      )
                    }
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs shrink-0 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Rewrite Title / Meta</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Report 3: Missing Content */}
          {opportunities.missingContentQueries.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 shadow-xs">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  ⚠️ Missing Content Queries
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Queries your pages receive impressions for, but the keywords do not actually appear in your body text.
                </p>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {opportunities.missingContentQueries.map((m, i) => (
                  <div key={i} className="py-2.5 flex items-center justify-between gap-3">
                    <div>
                      <span className="font-bold text-slate-900">{m.query}</span>
                      <span className="text-[11px] text-slate-500 block">
                        Page: <code>{m.pagePath}</code> • Missing terms:{" "}
                        <strong className="text-red-600">{m.missingWords.join(", ")}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleRunGscOptimize(m.query, m.pagePath, m.impressions, 12)
                      }
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs shrink-0"
                    >
                      Add Section
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Optimization Drawer */}
          {aiSuggestions && (
            <div className="p-5 rounded-2xl bg-indigo-50 border border-indigo-200 space-y-4 animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-indigo-200 pb-2">
                <h4 className="text-xs font-bold text-indigo-950 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>
                    Search Console Optimization Plan: <strong>{optimizingQuery?.query}</strong>
                  </span>
                </h4>
                <button
                  type="button"
                  onClick={() => setAiSuggestions(null)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                >
                  Close Plan
                </button>
              </div>

              <div className="space-y-2 text-xs">
                {aiSuggestions.suggestions.map((s: string, idx: number) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-indigo-100 flex items-start space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span className="text-slate-800 leading-relaxed">{s}</span>
                  </div>
                ))}
              </div>

              {aiSuggestions.optimizedHtml && (
                <div className="flex justify-end space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onApplyOptimization) {
                        onApplyOptimization(
                          optimizingQuery.pagePath,
                          aiSuggestions.optimizedHtml,
                          `Optimized from Search Console data for query "${optimizingQuery.query}" (${activeDataset?.dateRangeLabel})`
                        );
                      }
                      setAiSuggestions(null);
                    }}
                    className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    Apply Optimization &amp; Create Version
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
