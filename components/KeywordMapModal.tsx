"use client";

import React, { useState, useMemo } from "react";
import {
  auditPageSEO,
  detectKeywordCannibalization,
  suggestKeywordsForPage,
  parseBulkKeywordPaste,
  PageSEOResult,
} from "../lib/seo/on-page-scorer";
import {
  Search,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  ArrowRight,
  ClipboardPaste,
  Check,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export interface KeywordMapEntry {
  pagePath: string;
  title?: string;
  primaryKeyword: string;
  secondaryKeywords: string[];
  seoScore?: number;
}

interface KeywordMapModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: { path: string; content: string }[];
  businessType: string;
  city: string;
  state: string;
  services: string[];
  keywordMap: KeywordMapEntry[];
  onUpdateKeywordMap: (updated: KeywordMapEntry[]) => void;
  onApplyOptimizedHtml?: (pagePath: string, newHtml: string) => void;
}

export function KeywordMapModal({
  isOpen,
  onClose,
  files,
  businessType,
  city,
  state,
  services,
  keywordMap,
  onUpdateKeywordMap,
  onApplyOptimizedHtml,
}: KeywordMapModalProps) {
  const [entries, setEntries] = useState<KeywordMapEntry[]>(keywordMap);
  const [showBulkPaste, setShowBulkPaste] = useState(false);
  const [bulkText, setBulkText] = useState("");
  const [editingRow, setEditingRow] = useState<string | null>(null);

  // Single Page Optimize State
  const [optimizingPage, setOptimizingPage] = useState<string | null>(null);
  const [optimizeInstructions, setOptimizeInstructions] = useState("");
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationDiff, setOptimizationDiff] = useState<{
    pagePath: string;
    oldHtml: string;
    newHtml: string;
    oldScore: number;
    newScore: number;
    notes: string[];
  } | null>(null);

  // Selected SEO Audit Details
  const [selectedAuditPage, setSelectedAuditPage] = useState<string | null>(null);

  // Sync entries if props change
  React.useEffect(() => {
    if (keywordMap && keywordMap.length > 0) {
      setEntries(keywordMap);
    } else {
      // Auto-fill initial suggestions
      const initial: KeywordMapEntry[] = files
        .filter((f) => f.path.endsWith(".html"))
        .map((f) => {
          const suggestions = suggestKeywordsForPage(f.path, businessType, city, state, services);
          return {
            pagePath: f.path,
            primaryKeyword: suggestions.primary,
            secondaryKeywords: suggestions.secondaries,
          };
        });
      setEntries(initial);
      onUpdateKeywordMap(initial);
    }
  }, [files, keywordMap, businessType, city, state, services, onUpdateKeywordMap]);

  // Calculate SEO Scores for all pages
  const seoAudits = useMemo(() => {
    const map = new Map<string, PageSEOResult>();
    for (const entry of entries) {
      const file = files.find((f) => f.path === entry.pagePath);
      if (file) {
        const audit = auditPageSEO(
          file.content,
          entry.pagePath,
          entry.primaryKeyword,
          entry.secondaryKeywords
        );
        map.set(entry.pagePath, audit);
      }
    }
    return map;
  }, [entries, files]);

  // Detect Cannibalization Conflicts
  const cannibalizationConflicts = useMemo(() => {
    return detectKeywordCannibalization(entries);
  }, [entries]);

  const conflictingPageSet = useMemo(() => {
    const set = new Set<string>();
    cannibalizationConflicts.forEach((c) => c.competingPages.forEach((p) => set.add(p)));
    return set;
  }, [cannibalizationConflicts]);

  // Handle Keyword Edit Change
  const updateEntry = (
    path: string,
    field: "primaryKeyword" | "secondaryKeywords",
    val: string | string[]
  ) => {
    const updated = entries.map((e) => {
      if (e.pagePath === path) {
        return { ...e, [field]: val };
      }
      return e;
    });
    setEntries(updated);
    onUpdateKeywordMap(updated);
  };

  // Auto-fill all suggestions
  const handleAutoFillAll = () => {
    const updated = entries.map((e) => {
      const sug = suggestKeywordsForPage(e.pagePath, businessType, city, state, services);
      return {
        ...e,
        primaryKeyword: sug.primary,
        secondaryKeywords: sug.secondaries,
      };
    });
    setEntries(updated);
    onUpdateKeywordMap(updated);
  };

  // Parse bulk paste
  const handleApplyBulkPaste = () => {
    const parsed = parseBulkKeywordPaste(bulkText);
    if (parsed.length === 0) return;

    const updated = [...entries];
    for (const item of parsed) {
      const idx = updated.findIndex((e) => e.pagePath.toLowerCase() === item.pagePath.toLowerCase());
      if (idx !== -1) {
        updated[idx] = {
          ...updated[idx],
          primaryKeyword: item.primaryKeyword,
          secondaryKeywords: item.secondaryKeywords,
        };
      } else {
        updated.push({
          pagePath: item.pagePath,
          primaryKeyword: item.primaryKeyword,
          secondaryKeywords: item.secondaryKeywords,
        });
      }
    }
    setEntries(updated);
    onUpdateKeywordMap(updated);
    setShowBulkPaste(false);
    setBulkText("");
  };

  // Run AI Page Optimization
  const handleRunOptimize = async (pagePath: string) => {
    const file = files.find((f) => f.path === pagePath);
    const entry = entries.find((e) => e.pagePath === pagePath);
    if (!file || !entry) return;

    setIsOptimizing(true);
    setOptimizingPage(pagePath);

    try {
      const res = await fetch("/api/seo/optimize-page", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pagePath,
          currentHtml: file.content,
          primaryKeyword: entry.primaryKeyword,
          secondaryKeywords: entry.secondaryKeywords,
          customInstructions: optimizeInstructions,
          businessType,
          city,
          state,
        }),
      });

      const data = await res.json();
      if (data.success && data.optimizedHtml) {
        const oldAudit = seoAudits.get(pagePath);
        const newAudit = auditPageSEO(
          data.optimizedHtml,
          pagePath,
          entry.primaryKeyword,
          entry.secondaryKeywords
        );

        setOptimizationDiff({
          pagePath,
          oldHtml: file.content,
          newHtml: data.optimizedHtml,
          oldScore: oldAudit ? oldAudit.totalScore : 50,
          newScore: newAudit.totalScore,
          notes: data.notes || ["Improved keyword positioning in H1, opening paragraph, and meta description."],
        });
      } else {
        alert(data.error || "Failed to optimize page. Please verify your AI settings.");
      }
    } catch (err: any) {
      alert(`Optimization error: ${err.message}`);
    } finally {
      setIsOptimizing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="space-y-0.5">
            <h2 className="text-lg font-bold text-slate-900 flex items-center space-x-2">
              <Search className="w-5 h-5 text-indigo-600" />
              <span>Keyword Map &amp; On-Page SEO Engine</span>
            </h2>
            <p className="text-xs text-slate-500">
              Assign focused target keywords to each page, inspect on-page SEO scores (0–100), and prevent keyword cannibalization.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleAutoFillAll}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold text-indigo-700 transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Auto-Fill Suggestions</span>
            </button>
            <button
              type="button"
              onClick={() => setShowBulkPaste(!showBulkPaste)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition"
            >
              <ClipboardPaste className="w-3.5 h-3.5" />
              <span>Bulk Paste</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Cannibalization Warning Banner */}
        {cannibalizationConflicts.length > 0 && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 px-5 flex items-start space-x-3 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-bold">Cannibalization Warning:</strong> Two or more pages are competing for the exact same primary keyword:
              <ul className="list-disc pl-5 mt-1 space-y-0.5 font-medium">
                {cannibalizationConflicts.map((c, i) => (
                  <li key={i}>
                    Keyword <em>&quot;{c.keyword}&quot;</em> is shared between: {c.competingPages.join(", ")}. Give each page a distinct focus.
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Bulk Paste Accordion */}
        {showBulkPaste && (
          <div className="p-4 bg-slate-100 border-b border-slate-200 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>Paste Format: page-url | primary keyword | secondary, keywords</span>
              <button
                type="button"
                onClick={() => setShowBulkPaste(false)}
                className="text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
            <textarea
              rows={4}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`index.html | Plumber in Dallas TX | emergency plumbing, 24/7 drain service\nplumber-plano-tx.html | Plumber in Plano TX | licensed plumber plano, water heater repair plano`}
              className="w-full text-xs font-mono p-2.5 rounded-lg border border-slate-300 bg-white"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleApplyBulkPaste}
                className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Apply Bulk Mapping
              </button>
            </div>
          </div>
        )}

        {/* Main Table Content */}
        <div className="flex-1 overflow-y-auto p-5">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Page / URL</th>
                <th className="py-2.5 px-3">Primary Keyword</th>
                <th className="py-2.5 px-3">Secondary Keywords (up to 5)</th>
                <th className="py-2.5 px-3 text-center">On-Page SEO Score</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {entries.map((entry) => {
                const isConflicting = conflictingPageSet.has(entry.pagePath);
                const audit = seoAudits.get(entry.pagePath);
                const score = audit ? audit.totalScore : 0;

                return (
                  <tr
                    key={entry.pagePath}
                    className={`hover:bg-slate-50/80 transition ${
                      isConflicting ? "bg-amber-50/60" : ""
                    }`}
                  >
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      <div className="flex items-center space-x-1.5">
                        <FileText className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-xs">{entry.pagePath}</span>
                      </div>
                      {isConflicting && (
                        <span className="text-[10px] text-amber-700 font-bold block mt-0.5">
                          ⚠️ Competing Keyword
                        </span>
                      )}
                    </td>

                    {/* Primary Keyword Column */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={entry.primaryKeyword}
                        onChange={(e) =>
                          updateEntry(entry.pagePath, "primaryKeyword", e.target.value)
                        }
                        className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white focus:border-indigo-500"
                        placeholder="Target primary keyword"
                      />
                    </td>

                    {/* Secondary Keywords Column */}
                    <td className="py-3 px-3">
                      <input
                        type="text"
                        value={entry.secondaryKeywords.join(", ")}
                        onChange={(e) =>
                          updateEntry(
                            entry.pagePath,
                            "secondaryKeywords",
                            e.target.value.split(",").map((s) => s.trim()).filter(Boolean)
                          )
                        }
                        className="w-full text-xs p-1.5 border border-slate-200 rounded bg-white focus:border-indigo-500"
                        placeholder="keyword 1, keyword 2, keyword 3"
                      />
                    </td>

                    {/* SEO Score Column */}
                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() =>
                          setSelectedAuditPage(
                            selectedAuditPage === entry.pagePath ? null : entry.pagePath
                          )
                        }
                        className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-bold transition ${
                          score >= 80
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                            : score >= 60
                            ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                            : "bg-red-50 text-red-700 border border-red-200 hover:bg-red-100"
                        }`}
                        title="Click to view detailed checklist"
                      >
                        <span>{score}/100</span>
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </td>

                    {/* Actions Column */}
                    <td className="py-3 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setOptimizingPage(entry.pagePath);
                          setOptimizeInstructions("");
                        }}
                        className="inline-flex items-center space-x-1 px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Optimize</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Expanded SEO Audit Checklist Drawer */}
          {selectedAuditPage && (
            <div className="mt-4 p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-3 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>On-Page SEO Checklist: <strong>{selectedAuditPage}</strong></span>
                </h4>
                <button
                  type="button"
                  onClick={() => setSelectedAuditPage(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-semibold"
                >
                  Close Checklist
                </button>
              </div>

              {seoAudits.get(selectedAuditPage)?.checks.map((chk) => (
                <div
                  key={chk.id}
                  className="p-2.5 rounded-lg border bg-white flex items-start justify-between text-xs gap-3"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          chk.status === "pass"
                            ? "bg-emerald-500"
                            : chk.status === "warning"
                            ? "bg-amber-500"
                            : "bg-red-500"
                        }`}
                      />
                      <strong className="text-slate-900">{chk.name}</strong>
                    </div>
                    <p className="text-slate-600 text-[11px]">{chk.message}</p>
                    {chk.suggestion && (
                      <p className="text-indigo-600 text-[11px] font-medium pt-0.5">
                        Suggestion: {chk.suggestion}
                      </p>
                    )}
                  </div>
                  <span className="font-mono text-slate-500 font-bold shrink-0">
                    +{chk.scoreEarned}/{chk.maxScore}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* AI Page Optimizer Drawer */}
          {optimizingPage && (
            <div className="mt-4 p-4 rounded-xl border border-slate-300 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>AI Page Optimizer: <strong>{optimizingPage}</strong></span>
                </h4>
                <button
                  type="button"
                  onClick={() => setOptimizingPage(null)}
                  className="text-slate-400 hover:text-slate-600 text-xs"
                >
                  Cancel
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Optional Custom Instructions for AI (e.g. &quot;focus more on emergency repair&quot;, &quot;mention free estimates&quot;)
                </label>
                <input
                  type="text"
                  value={optimizeInstructions}
                  onChange={(e) => setOptimizeInstructions(e.target.value)}
                  placeholder="e.g. emphasize 24/7 fast arrival and warranty"
                  className="input-base text-xs bg-white"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleRunOptimize(optimizingPage)}
                  disabled={isOptimizing}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center space-x-1.5 transition disabled:opacity-50"
                >
                  {isOptimizing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Optimizing Content…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Run Optimization (Pass 2)</span>
                    </>
                  )}
                </button>
              </div>

              {/* Before / After Diff Result */}
              {optimizationDiff && (
                <div className="mt-3 p-4 bg-white rounded-xl border border-indigo-200 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      SEO Score Impact: {optimizationDiff.oldScore}/100 →{" "}
                      <strong className="text-emerald-600">{optimizationDiff.newScore}/100</strong>
                    </span>
                    <div className="space-x-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onApplyOptimizedHtml) {
                            onApplyOptimizedHtml(optimizationDiff.pagePath, optimizationDiff.newHtml);
                          }
                          setOptimizationDiff(null);
                          setOptimizingPage(null);
                        }}
                        className="px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                      >
                        Apply Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setOptimizationDiff(null)}
                        className="px-3 py-1 rounded bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold"
                      >
                        Discard
                      </button>
                    </div>
                  </div>

                  <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
                    {optimizationDiff.notes.map((n, i) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">
            {entries.length} pages mapped • Verified for Google policy compliance
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition"
          >
            Save &amp; Close Map
          </button>
        </div>
      </div>
    </div>
  );
}
