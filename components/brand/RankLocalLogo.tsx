"use client";

import React from "react";
import Link from "next/link";
import { BRAND } from "@/config/brand";

interface RankLocalLogoProps {
  variant?: "full" | "icon" | "wordmark";
  mode?: "dark" | "light" | "auto";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  showTagline?: boolean;
  href?: string;
}

const SIZES = {
  xs: { icon: "w-5 h-5", text: "text-base", sub: "text-[9px]" },
  sm: { icon: "w-7 h-7", text: "text-lg", sub: "text-[10px]" },
  md: { icon: "w-9 h-9", text: "text-xl", sub: "text-[11px]" },
  lg: { icon: "w-11 h-11", text: "text-2xl", sub: "text-xs" },
  xl: { icon: "w-14 h-14", text: "text-3xl", sub: "text-sm" },
};

/**
 * RankLocal Icon: Location Pin combined with an Upward Ranking Arrow
 */
export function RankLocalIcon({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="RankLocal Logo Icon"
    >
      <defs>
        {/* Pin Gradient: Deep Indigo to Vibrant Violet */}
        <linearGradient id="rankPinGrad" x1="6" y1="4" x2="34" y2="36" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4F46E5" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>

        {/* Upward Rank Arrow Gradient: Emerald to Cyan */}
        <linearGradient id="rankArrowGrad" x1="14" y1="24" x2="26" y2="10" gradientUnits="userSpaceOnUse">
          <stop stopColor="#10B981" />
          <stop offset="1" stopColor="#06B6D4" />
        </linearGradient>

        {/* Ambient Drop Shadow */}
        <filter id="rankShadow" x="2" y="2" width="36" height="38" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2" stdDeviation="2.5" floodColor="#4F46E5" floodOpacity="0.35" />
        </filter>
      </defs>

      {/* Main Location Pin Body with soft shadow */}
      <path
        d="M20 4C12.82 4 7 9.82 7 17C7 26.2 18.5 35.2 19.35 35.85C19.74 36.15 20.26 36.15 20.65 35.85C21.5 35.2 33 26.2 33 17C33 9.82 27.18 4 20 4Z"
        fill="url(#rankPinGrad)"
        filter="url(#rankShadow)"
      />

      {/* Inner Pin Circular Window */}
      <circle cx="20" cy="17" r="9" fill="#0B0F19" fillOpacity="0.45" />

      {/* Upward Ranking Chevron / Arrow */}
      {/* 1. Bar 1 (left small) */}
      <rect x="14" y="19" width="3" height="4" rx="1" fill="#FFFFFF" fillOpacity="0.75" />
      
      {/* 2. Bar 2 (center medium) */}
      <rect x="18.5" y="15.5" width="3" height="7.5" rx="1" fill="#FFFFFF" fillOpacity="0.9" />

      {/* 3. Upward Trend Arrow Head and Stem */}
      <path
        d="M23 12H27V16M26.5 12.5L18.5 20.5"
        stroke="url(#rankArrowGrad)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function RankLocalLogo({
  variant = "full",
  mode = "auto",
  size = "md",
  className = "",
  showTagline = false,
  href = "/",
}: RankLocalLogoProps) {
  const currentSize = SIZES[size] || SIZES.md;

  // Text color based on mode
  const wordColor =
    mode === "dark"
      ? "text-white"
      : mode === "light"
      ? "text-slate-900"
      : "text-slate-900 dark:text-white";

  const content = (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {variant !== "wordmark" && (
        <div className="shrink-0 transition-transform hover:scale-105">
          <RankLocalIcon className={currentSize.icon} />
        </div>
      )}

      {variant !== "icon" && (
        <div className="flex flex-col">
          <div className={`font-black tracking-tight leading-none ${currentSize.text} ${wordColor}`}>
            <span>Rank</span>
            <span className="text-indigo-600 dark:text-indigo-400">Local</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5 align-baseline" />
          </div>
          {showTagline && (
            <span className={`font-semibold tracking-wider uppercase text-slate-400 dark:text-slate-400 mt-0.5 ${currentSize.sub}`}>
              Local Website Builder
            </span>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex items-center focus:outline-hidden focus:ring-2 focus:ring-indigo-500 rounded-lg">
        {content}
      </Link>
    );
  }

  return content;
}

export default RankLocalLogo;
