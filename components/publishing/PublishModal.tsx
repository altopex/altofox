"use client";

import React from "react";
import { X, Globe } from "lucide-react";
import { HostingPublishingPanel } from "./HostingPublishingPanel";

export interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId?: string;
  files?: Array<{ path: string; content: string }>;
  photos?: any[];
  websiteDomain?: string;
  onOpenSettings?: () => void;
  onPublished?: (result: { provider: string; liveUrl: string }) => void;
}

export function PublishModal({
  isOpen,
  onClose,
  projectName,
  projectId,
  files = [],
  photos = [],
  websiteDomain,
  onOpenSettings,
  onPublished,
}: PublishModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-900 dark:to-indigo-950/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <span>Publish Website</span>
                <span className="text-[10px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full uppercase">
                  Multi-Cloud Hosting
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deploy directly to Cloudflare Pages, Vercel, Netlify, or GitHub Pages
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          <HostingPublishingPanel
            projectName={projectName}
            projectId={projectId}
            files={files}
            photos={photos}
            websiteDomain={websiteDomain}
            onOpenSettings={onOpenSettings}
            onPublished={onPublished}
          />
        </div>
      </div>
    </div>
  );
}
