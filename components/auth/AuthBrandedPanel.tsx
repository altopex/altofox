"use client";

import React from "react";
import { Sparkles, CheckCircle2, ShieldCheck, Zap, Globe, Layers } from "lucide-react";

export function AuthBrandedPanel() {
  return (
    <div className="hidden lg:flex flex-col justify-between p-10 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white relative overflow-hidden rounded-3xl border border-indigo-500/20 shadow-2xl">
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />

      {/* Top Brand Header */}
      <div className="relative z-10 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-400 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-2xl font-black tracking-tight text-white">
            Alto<span className="text-indigo-400">Fox</span>
          </span>
          <p className="text-[11px] font-medium text-indigo-200/70 tracking-wide uppercase">
            Local Website Builder
          </p>
        </div>
      </div>

      {/* Center Value Proposition & Showcase Card */}
      <div className="relative z-10 my-8 space-y-6">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-300 text-xs font-semibold mb-4">
            <Zap className="w-3.5 h-3.5 text-indigo-400" />
            <span>Built For Local Service Dominance</span>
          </div>
          <h2 className="text-2xl xl:text-3xl font-bold text-white tracking-tight leading-snug">
            Turn local searchers into booked calls.
          </h2>
          <p className="text-sm text-slate-300 mt-2 leading-relaxed">
            Generate 100% zero-build, static websites calibrated for local Google rankings with 20 trade niche packs, multi-city service pages, and Schema.org markup.
          </p>
        </div>

        {/* Builder Mock Preview Card */}
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-700/60 shadow-xl space-y-3.5 text-xs text-slate-300">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
              <span className="text-[11px] font-mono text-slate-400 ml-1">altofox-builder.html</span>
            </div>
            <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
              SEO 98/100
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Niche Pack</span>
              <span className="font-semibold text-white">Plumbing &amp; Emergency Rooter</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Target Locations</span>
              <span className="font-semibold text-white">Austin, TX + 8 Suburbs</span>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Pages Generated</span>
              <span className="font-semibold text-indigo-300">14 Static SEO Pages</span>
            </div>
          </div>

          {/* Feature checklist */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800/80 text-[11px] text-slate-300">
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Zero-Build HTML</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Local Schema.org</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>Rank Tracker</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>GSC Optimizer</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Security / Trust Footer */}
      <div className="relative z-10 flex items-center justify-between pt-4 border-t border-indigo-500/20 text-xs text-indigo-200/60">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <span>Private Team Platform · Supabase RLS</span>
        </div>
        <span>v2.4 Pro</span>
      </div>
    </div>
  );
}
