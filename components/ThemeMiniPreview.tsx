"use client";

import React from "react";
import { Theme, ThemeColors, buildGoogleFontsUrl } from "@/lib/themes";
import { Phone, Shield, Star, CheckCircle, ArrowRight } from "lucide-react";

interface ThemeMiniPreviewProps {
  theme: Theme;
  colors?: ThemeColors;
}

export function ThemeMiniPreview({ theme, colors }: ThemeMiniPreviewProps) {
  const c = colors || theme.colors;
  const isDark = c.background === "#0F172A" || c.background === "#111827" || c.background.toLowerCase().startsWith("#0") || c.background.toLowerCase().startsWith("#1");
  const isSharp = theme.borderRadius === "2px" || theme.borderRadius === "4px" || theme.borderRadius === "6px";
  const isExtraRound = theme.borderRadius === "20px" || theme.borderRadius === "24px" || theme.borderRadius === "16px";

  // Representative sample trade names for the theme
  const tradeSample = theme.bestFor[0] || "Contractor";
  const tradePrefix = theme.tradeSeoPrefix || "Local Specialist";

  return (
    <div
      className="w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col text-[11px] leading-tight select-none transition-all duration-200"
      style={{
        backgroundColor: c.background,
        color: c.text,
        fontFamily: `'${theme.fonts.body}', -apple-system, BlinkMacSystemFont, sans-serif`,
      }}
    >
      {/* Dynamic Font Import */}
      <link rel="stylesheet" href={buildGoogleFontsUrl(theme.fonts.heading, theme.fonts.body)} />

      {/* 1. Mini Top Utility Bar (for emergency trades or standard topbar) */}
      <div
        className="px-2.5 py-1 flex items-center justify-between text-[9px] font-semibold tracking-wide border-b"
        style={{
          backgroundColor: c.secondary,
          color: "#FFFFFF",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>24/7 Dispatch Available</span>
        </span>
        <span className="font-bold flex items-center gap-1 opacity-90">
          <Phone className="w-2.5 h-2.5" />
          <span>(555) 123-4567</span>
        </span>
      </div>

      {/* 2. Mini Site Header */}
      <div
        className="px-2.5 py-1.5 flex items-center justify-between border-b"
        style={{
          backgroundColor: c.surface,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        }}
      >
        {/* Brand */}
        <div className="flex items-center gap-1.5">
          <div
            className="w-4 h-4 flex items-center justify-center font-black text-[9px] text-white"
            style={{
              backgroundColor: c.primary,
              borderRadius: isSharp ? "2px" : isExtraRound ? "9999px" : "4px",
            }}
          >
            {tradeSample.charAt(0)}
          </div>
          <span
            className="font-bold text-[11px] tracking-tight truncate max-w-[110px]"
            style={{
              fontFamily: `'${theme.fonts.heading}', sans-serif`,
              color: c.secondary,
            }}
          >
            Dallas {tradeSample}
          </span>
        </div>

        {/* Nav links */}
        <div className="hidden sm:flex items-center gap-2 text-[9px] font-medium" style={{ color: c.muted }}>
          <span>Services</span>
          <span>Areas</span>
          <span>Reviews</span>
        </div>

        {/* Header CTA Button */}
        <div
          className="px-2 py-0.5 text-[9px] font-bold text-white flex items-center gap-1 shrink-0"
          style={{
            backgroundColor: c.primary,
            borderRadius: theme.borderRadius || "6px",
          }}
        >
          <span>Call Now</span>
        </div>
      </div>

      {/* 3. Mini Hero Section */}
      <div
        className="p-3 border-b relative"
        style={{
          background: isDark
            ? `linear-gradient(135deg, ${c.surface} 0%, ${c.background} 100%)`
            : `linear-gradient(135deg, ${c.surface} 0%, rgba(var(--primary-rgb, 99, 102, 241), 0.04) 100%)`,
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
        }}
      >
        <div className="grid grid-cols-12 gap-2 items-center">
          {/* Left Column: Headlines & CTA */}
          <div className="col-span-8 space-y-1.5">
            {/* Urgency Badge */}
            <div
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[8px] font-bold tracking-wider uppercase"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.04)",
                color: c.primary,
                borderRadius: isExtraRound ? "9999px" : "4px",
                border: `1px solid ${c.primary}33`,
              }}
            >
              <span>⚡</span>
              <span>Dallas Top-Rated {tradeSample}</span>
            </div>

            {/* Hero Main Heading in theme font */}
            <div
              className="text-[13px] sm:text-[14px] font-extrabold leading-snug tracking-tight"
              style={{
                fontFamily: `'${theme.fonts.heading}', sans-serif`,
                color: isDark ? "#FFFFFF" : c.secondary,
              }}
            >
              Expert {tradePrefix} in Dallas, TX
            </div>

            {/* Subtitle */}
            <div className="text-[9px] leading-tight line-clamp-1" style={{ color: c.muted }}>
              Immediate emergency dispatch, upfront flat pricing & 100% guarantee.
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center gap-1.5 pt-0.5">
              <div
                className="px-2 py-1 text-[9px] font-bold text-white flex items-center gap-1 shadow-2xs"
                style={{
                  backgroundColor: c.primary,
                  borderRadius: theme.borderRadius || "6px",
                }}
              >
                <Phone className="w-2.5 h-2.5" />
                <span>(214) 555-0198</span>
              </div>
              <div
                className="px-1.5 py-1 text-[9px] font-semibold border flex items-center gap-0.5"
                style={{
                  borderColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
                  color: isDark ? "#FFFFFF" : c.secondary,
                  borderRadius: theme.borderRadius || "6px",
                }}
              >
                <span>Free Quote</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Visual Card */}
          <div className="col-span-4 flex justify-end">
            <div
              className="w-full h-16 rounded-lg border p-1.5 flex flex-col justify-between shadow-2xs overflow-hidden"
              style={{
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : c.surface,
                borderColor: `${c.primary}40`,
                borderRadius: theme.borderRadius || "8px",
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold" style={{ color: c.primary }}>
                  ★ 5.0 Star
                </span>
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.accent }} />
              </div>
              <div className="space-y-0.5">
                <div className="h-1 w-full rounded-full" style={{ backgroundColor: c.primary, opacity: 0.8 }} />
                <div className="h-1 w-3/4 rounded-full" style={{ backgroundColor: c.accent, opacity: 0.6 }} />
              </div>
              <div className="text-[7px] font-bold uppercase truncate" style={{ color: c.muted }}>
                Licensed & Insured
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Mini Trust Bar */}
      <div
        className="px-2.5 py-1 flex items-center justify-between text-[8px] font-semibold tracking-wide border-b"
        style={{
          backgroundColor: isDark ? "#0A101D" : "#0F172A",
          color: "#FFFFFF",
          borderColor: "rgba(255,255,255,0.06)",
        }}
      >
        <span className="flex items-center gap-1">🛡️ 100% Warranty</span>
        <span className="flex items-center gap-1">💲 Flat Upfront Rates</span>
        <span className="flex items-center gap-1">🕒 45-Min Arrival</span>
      </div>

      {/* 5. Mini Services Grid */}
      <div className="p-2.5 space-y-1.5 border-b" style={{ borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
        <div className="flex items-center justify-between">
          <span
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{
              fontFamily: `'${theme.fonts.heading}', sans-serif`,
              color: isDark ? "#FFFFFF" : c.secondary,
            }}
          >
            Core Services
          </span>
          <span className="text-[8px] font-semibold" style={{ color: c.primary }}>
            All Services →
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          {["Repair & Diagnostics", "Installation", "Emergency Service"].map((svc, i) => (
            <div
              key={i}
              className="p-1.5 border flex flex-col justify-between shadow-2xs"
              style={{
                backgroundColor: c.surface,
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
                borderRadius: theme.borderRadius || "6px",
              }}
            >
              <div
                className="w-3.5 h-3.5 rounded-sm flex items-center justify-center text-[8px] font-bold text-white mb-1"
                style={{
                  backgroundColor: i === 0 ? c.primary : i === 1 ? c.secondary : c.accent,
                  borderRadius: isExtraRound ? "9999px" : "3px",
                }}
              >
                {i + 1}
              </div>
              <div
                className="font-bold text-[8.5px] leading-tight truncate"
                style={{ color: isDark ? "#FFFFFF" : c.text }}
              >
                {svc}
              </div>
              <div className="text-[7px] truncate mt-0.5" style={{ color: c.muted }}>
                Guaranteed Parts
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Mini Service Areas Section */}
      <div
        className="px-2.5 py-1.5 flex items-center justify-between gap-1 border-b"
        style={{
          backgroundColor: isDark ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)",
          borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        }}
      >
        <span className="text-[8px] font-bold uppercase tracking-wider shrink-0" style={{ color: c.muted }}>
          Coverage:
        </span>
        <div className="flex items-center gap-1 overflow-hidden">
          {["Dallas", "Plano", "Highland Park", "Frisco"].map((area, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 text-[7.5px] font-semibold border truncate shrink-0"
              style={{
                backgroundColor: c.surface,
                borderColor: `${c.primary}33`,
                borderRadius: isExtraRound ? "9999px" : "4px",
                color: isDark ? "#E2E8F0" : c.secondary,
              }}
            >
              {area}
            </span>
          ))}
        </div>
      </div>

      {/* 7. Mini CTA Banner */}
      <div
        className="px-3 py-2 flex items-center justify-between gap-2"
        style={{
          background: `linear-gradient(135deg, ${c.secondary} 0%, #0F172A 100%)`,
          color: "#FFFFFF",
        }}
      >
        <div>
          <div
            className="text-[10px] font-bold"
            style={{ fontFamily: `'${theme.fonts.heading}', sans-serif` }}
          >
            Need Help Now in Dallas?
          </div>
          <div className="text-[7.5px] text-slate-300">Certified master specialists ready to dispatch.</div>
        </div>

        <div
          className="px-2 py-1 text-[8.5px] font-bold text-white shrink-0 shadow-xs flex items-center gap-0.5"
          style={{
            backgroundColor: c.primary,
            borderRadius: theme.borderRadius || "4px",
          }}
        >
          <span>Call 24/7</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </div>
      </div>

      {/* 8. Mini Footer */}
      <div
        className="px-2.5 py-1 flex items-center justify-between text-[7.5px] text-slate-400 bg-slate-950 border-t border-slate-900"
      >
        <span>© 2026 Dallas {tradeSample}. All rights reserved.</span>
        <span>Privacy · Terms</span>
      </div>
    </div>
  );
}
