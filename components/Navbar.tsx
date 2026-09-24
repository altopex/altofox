"use client";

import React, { useState } from "react";
import { Key, Sparkles, FolderArchive, ArrowUpRight } from "lucide-react";
import { ProviderType } from "@/lib/ai/types";

interface NavbarProps {
  onOpenKeys: () => void;
  onOpenProjects: () => void;
  activeProvider?: ProviderType;
  hasKeyForActiveProvider?: boolean;
}

export function Navbar({
  onOpenKeys,
  onOpenProjects,
  activeProvider = "gemini",
  hasKeyForActiveProvider = false,
}: NavbarProps) {
  const providerNames: Record<string, string> = {
    gemini: "Gemini",
    openai: "ChatGPT (OpenAI)",
    anthropic: "Claude",
    groq: "Groq",
    deepseek: "DeepSeek",
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold tracking-tight text-white">
                Alto<span className="text-orange-400">Fox</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300">
                Local Web Builder
              </span>
            </div>
          </div>
        </div>

        {/* Actions & Status */}
        <div className="flex items-center space-x-3">
          {/* Recent Projects Button */}
          <button
            onClick={onOpenProjects}
            className="hidden sm:inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 hover:bg-slate-800 text-xs font-medium text-slate-300 transition"
          >
            <FolderArchive className="w-3.5 h-3.5 text-slate-400" />
            <span>Recent Sites</span>
          </button>

          {/* Connect API Key Button / Status Indicator */}
          <button
            onClick={onOpenKeys}
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition ${
              hasKeyForActiveProvider
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                : "border-sky-500/40 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20 ring-1 ring-sky-500/30"
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  hasKeyForActiveProvider ? "bg-emerald-400 animate-pulse" : "bg-sky-400"
                }`}
              />
              <span>
                {hasKeyForActiveProvider
                  ? `${providerNames[activeProvider] || activeProvider} Connected`
                  : "Connect API Key"}
              </span>
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
