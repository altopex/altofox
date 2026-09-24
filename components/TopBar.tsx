"use client";

import React from "react";
import { Settings, Sparkles, CheckCircle2, AlertTriangle, ChevronRight } from "lucide-react";
import { ProviderType } from "@/lib/ai/types";

interface TopBarProps {
  onOpenSettings: (tab?: "models" | "images" | "preferences") => void;
  activeProvider: ProviderType;
  activeModel: string;
  hasKey: boolean;
}

export function TopBar({
  onOpenSettings,
  activeProvider,
  activeModel,
  hasKey,
}: TopBarProps) {
  // Format model display name cleanly
  const getModelDisplayName = () => {
    if (!hasKey) return "No AI connected";
    if (activeModel.includes("gpt-4o-mini")) return "GPT-4o Mini";
    if (activeModel.includes("gpt-4o")) return "GPT-4o";
    if (activeModel.includes("gemini-1.5-pro")) return "Gemini 1.5 Pro";
    if (activeModel.includes("gemini-1.5-flash")) return "Gemini 1.5 Flash";
    if (activeModel.includes("gemini-2.0")) return "Gemini 2.0 Flash";
    if (activeModel.includes("claude-3.5-sonnet")) return "Claude 3.5 Sonnet";
    if (activeModel.includes("llama-3.3")) return "Llama 3.3 70B";
    return activeModel || activeProvider.toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-[#E2E8F0]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* App Logo & Brand Name */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-[10px] bg-gradient-to-tr from-[#4F46E5] to-[#6366F1] flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-xl font-bold tracking-tight text-[#0F172A]">
              Alto<span className="text-[#4F46E5]">Fox</span>
            </span>
            <span className="hidden sm:inline-block text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-[#64748B] border border-slate-200">
              Website Builder
            </span>
          </div>
        </div>

        {/* Right Status Pill & Settings Button */}
        <div className="flex items-center space-x-2.5">
          {/* AI Connection Status Pill */}
          <button
            type="button"
            onClick={() => onOpenSettings("models")}
            className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              hasKey
                ? "bg-[#ECFDF5] text-[#065F46] border-[#A7F3D0] hover:bg-[#D1FAE5]"
                : "bg-[#FFFBEB] text-[#92400E] border-[#FDE68A] hover:bg-[#FEF3C7]"
            }`}
            title="Click to configure AI Model & API Keys"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                hasKey ? "bg-[#10B981] animate-pulse" : "bg-[#F59E0B]"
              }`}
            />
            <span className="font-semibold">{getModelDisplayName()}</span>
            <ChevronRight className="w-3 h-3 opacity-60 ml-0.5" />
          </button>

          {/* Settings Gear Icon Button */}
          <button
            type="button"
            onClick={() => onOpenSettings("models")}
            className="w-9 h-9 rounded-[10px] border border-[#E2E8F0] bg-white hover:bg-slate-50 text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition shadow-sm"
            aria-label="Open AI & Builder Settings"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
