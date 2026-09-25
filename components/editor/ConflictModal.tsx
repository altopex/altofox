"use client";

import React, { useState } from "react";
import { AlertTriangle, RotateCcw, Save, Eye, X, Check, ArrowRight } from "lucide-react";

export interface ConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageTitle: string;
  changerName: string;
  changerUpdatedAt: string;
  localContent: any;
  remoteContent: any;
  onReloadRemote: () => void;
  onOverwriteKeepMine: () => void;
}

export function ConflictModal({
  isOpen,
  onClose,
  pageTitle,
  changerName,
  changerUpdatedAt,
  localContent,
  remoteContent,
  onReloadRemote,
  onOverwriteKeepMine,
}: ConflictModalProps) {
  const [showDiff, setShowDiff] = useState(false);

  if (!isOpen) return null;

  const formattedTime = new Date(changerUpdatedAt).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-100">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800 rounded-2xl shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Simultaneous Edit Conflict Detected
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              This page was updated by <strong className="text-amber-800 dark:text-amber-300">{changerName}</strong> at {formattedTime} while you were editing.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Diff Review View */}
        {showDiff ? (
          <div className="space-y-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 text-xs max-h-60 overflow-y-auto">
            <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-700">
              <span>Diff Comparison</span>
              <button
                type="button"
                onClick={() => setShowDiff(false)}
                className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                Hide diff
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-amber-600">Teammate&apos;s Version ({changerName})</span>
                <pre className="text-[10px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap overflow-hidden">
                  {JSON.stringify(remoteContent?.seo || remoteContent?.content || remoteContent, null, 2).slice(0, 400)}…
                </pre>
              </div>
              <div className="p-2 bg-white dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800 space-y-1">
                <span className="font-bold text-indigo-600">Your Current Edits</span>
                <pre className="text-[10px] text-slate-600 dark:text-slate-400 whitespace-pre-wrap overflow-hidden">
                  {JSON.stringify(localContent?.seo || localContent?.content || localContent, null, 2).slice(0, 400)}…
                </pre>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-xs text-slate-600 dark:text-slate-400 space-y-1">
            <p>
              To protect both team members&apos; contributions, you can review the differences, discard and load their changes, or overwrite with yours.
            </p>
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              Overwriting will automatically snapshot {changerName}&apos;s version in project history before applying yours.
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2">
          {!showDiff && (
            <button
              type="button"
              onClick={() => setShowDiff(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Review Differences</span>
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
            <button
              type="button"
              onClick={onReloadRemote}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
              <span>Reload Theirs</span>
            </button>

            <button
              type="button"
              onClick={onOverwriteKeepMine}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs transition"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save &amp; Keep Mine</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
