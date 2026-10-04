"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  Eye,
  Download,
  ArrowRight,
  Database,
  CloudOff,
  Sparkles,
  ShieldCheck,
  X,
} from "lucide-react";

export interface GenerationDecisionModalProps {
  isOpen: boolean;
  businessName: string;
  pageCount: number;
  themeName: string;
  isSaving?: boolean;
  onPreview: () => void;
  onDownload: () => void;
  onConfirm: (choice: "download-only" | "save-future") => void;
  onDiscard?: () => void;
  onClose: () => void;
}

export function GenerationDecisionModal({
  isOpen,
  businessName,
  pageCount,
  themeName,
  isSaving = false,
  onPreview,
  onDownload,
  onConfirm,
  onDiscard,
  onClose,
}: GenerationDecisionModalProps) {
  const [selectedChoice, setSelectedChoice] = useState<"download-only" | "save-future">("download-only");

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 text-slate-100 shadow-2xl overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-headline"
      >
        {/* Subtle accent header line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500" />

        {/* Close icon */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-800"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6 md:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-1">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 id="modal-headline" className="text-2xl font-bold tracking-tight text-white">
              Website Generated Successfully
            </h2>
            <p className="text-slate-400 text-sm">
              Your website for <strong className="text-slate-200 font-semibold">{businessName}</strong> ({pageCount} pages, {themeName}) is ready.
            </p>
          </div>

          {/* Quick Action Buttons: Preview & Download */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <button
              type="button"
              onClick={onPreview}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-white font-medium text-sm transition-all shadow-sm active:scale-[0.98]"
            >
              <Eye className="w-4 h-4 text-blue-400" />
              <span>Preview Website</span>
            </button>
            <button
              type="button"
              onClick={onDownload}
              className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-white font-medium text-sm transition-all shadow-sm active:scale-[0.98]"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Download ZIP</span>
            </button>
          </div>

          {/* Decision Section */}
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-semibold text-slate-200">
              Save this website for future optimization?
            </label>

            <div className="space-y-2.5">
              {/* Option 1: No - Download Only (Default) */}
              <label
                onClick={() => setSelectedChoice("download-only")}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedChoice === "download-only"
                    ? "bg-slate-800/90 border-blue-500/80 shadow-md ring-1 ring-blue-500/30"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                }`}
              >
                <input
                  type="radio"
                  name="saveDecision"
                  value="download-only"
                  checked={selectedChoice === "download-only"}
                  onChange={() => setSelectedChoice("download-only")}
                  className="mt-1 h-4 w-4 text-blue-600 border-slate-700 focus:ring-blue-500 bg-slate-900"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                      <CloudOff className="w-3.5 h-3.5 text-slate-400" />
                      No — Download only
                    </span>
                    <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                      Default (Lightweight)
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Website remains available for this session to preview and download. It will <strong className="text-slate-300">not</strong> be stored permanently in the database.
                  </p>
                </div>
              </label>

              {/* Option 2: Yes - Save for Future Optimization */}
              <label
                onClick={() => setSelectedChoice("save-future")}
                className={`flex items-start gap-3.5 p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedChoice === "save-future"
                    ? "bg-slate-800/90 border-emerald-500/80 shadow-md ring-1 ring-emerald-500/30"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850"
                }`}
              >
                <input
                  type="radio"
                  name="saveDecision"
                  value="save-future"
                  checked={selectedChoice === "save-future"}
                  onChange={() => setSelectedChoice("save-future")}
                  className="mt-1 h-4 w-4 text-emerald-600 border-slate-700 focus:ring-emerald-500 bg-slate-900"
                />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-white flex items-center gap-1.5">
                      <Database className="w-3.5 h-3.5 text-emerald-400" />
                      Yes — Save for future optimization
                    </span>
                    <span className="text-[10px] font-medium tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      Dashboard Project
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Saves metadata & page structure to your dashboard for future SEO, internal linking, GSC tracking, and monthly updates.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Action Buttons: Save Website vs Discard */}
          <div className="pt-2 space-y-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={() => onConfirm(selectedChoice)}
              className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving website...</span>
                </>
              ) : selectedChoice === "save-future" ? (
                <>
                  <Database className="w-4 h-4" />
                  <span>SAVE WEBSITE</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Continue to Preview</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {onDiscard && (
              <button
                type="button"
                onClick={onDiscard}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-700 hover:border-rose-500/60 hover:bg-rose-500/10 text-slate-400 hover:text-rose-300 font-medium text-xs transition flex items-center justify-center gap-1.5"
              >
                <span>Discard Website (Do Not Save Anything)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
