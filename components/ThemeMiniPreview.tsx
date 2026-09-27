"use client";

import React from "react";
import { Theme, ThemeColors } from "@/lib/themes";

interface ThemeMiniPreviewProps {
  theme: Theme;
  colors?: ThemeColors;
}

export function ThemeMiniPreview({ theme, colors }: ThemeMiniPreviewProps) {
  const activeColors = colors || theme.colors;

  // Background styling based on theme identity
  const getHeroBackground = () => {
    if (theme.id === "bold-conversion" || theme.id === "bold-trade") {
      return "bg-[#0B132B]";
    }
    if (theme.id === "split-hero") {
      return "bg-gradient-to-r from-[#EFF6FF] via-[#F8FAFC] to-[#DBEAFE]";
    }
    if (theme.id === "premium-local" || theme.id === "luxury-elegant") {
      return "bg-[#FAFAF9]";
    }
    if (theme.id === "editorial-modern") {
      return "bg-gradient-to-br from-[#F8FAFC] to-[#EEF2FF]";
    }
    if (theme.id === "clean-minimal" || theme.id === "minimal-mono") {
      return "bg-[#FFFFFF]";
    }
    if (theme.id === "trust-first") {
      return "bg-gradient-to-b from-[#F0F9FF] to-[#FFFFFF]";
    }
    if (theme.id === "modern-service-grid") {
      return "bg-gradient-to-b from-[#E0F2FE] via-[#F8FAFC] to-[#FFFFFF]";
    }
    if (theme.id === "contemporary-soft" || theme.id === "clean-medical" || theme.id === "warm-friendly") {
      return "bg-[#F0FDFA]";
    }
    if (theme.id === "high-contrast-modern") {
      return "bg-[#FFFFFF]";
    }
    return "bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE]";
  };

  const isDarkHero = theme.id === "bold-conversion" || theme.id === "bold-trade";
  const isHighContrast = theme.id === "high-contrast-modern";
  const isMinimal = theme.id === "clean-minimal" || theme.id === "minimal-mono";
  const isSoft = theme.id === "contemporary-soft" || theme.id === "clean-medical" || theme.id === "warm-friendly";

  return (
    <div
      className={`w-full h-32 sm:h-36 overflow-hidden flex flex-col shadow-inner select-none pointer-events-none transition-all ${
        isSoft ? "rounded-[16px]" : theme.borderRadius === "4px" || isMinimal ? "rounded-[4px]" : "rounded-[10px]"
      } ${isHighContrast ? "border-2 border-black" : "border border-black/10"}`}
      style={{ backgroundColor: activeColors.background }}
    >
      {/* Mini Top Emergency Bar if applicable */}
      {theme.layoutStructure?.headerVariant === "emergency-bar" && (
        <div className="h-3 bg-[#0B132B] px-2 flex items-center justify-between text-[6px] font-bold text-amber-300">
          <span>⚡ 24/7 DISPATCH</span>
          <span className="text-white">CALL NOW</span>
        </div>
      )}

      {/* Mini Browser Bar */}
      <div
        className="h-5 px-2 flex items-center justify-between border-b shrink-0"
        style={{
          backgroundColor: isDarkHero ? "#070E20" : isMinimal ? "#FFFFFF" : isHighContrast ? "#F8FAFC" : "#FFFFFF",
          borderColor: isDarkHero ? "rgba(255,255,255,0.1)" : isHighContrast ? "#000000" : "#E2E8F0",
        }}
      >
        {/* Browser Dots */}
        <div className="flex items-center space-x-1">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        {/* Tiny Brand & Navigation */}
        <div className="flex items-center space-x-1.5">
          <span
            className={`w-2 h-2 inline-block shrink-0 ${isSoft ? "rounded-full" : "rounded-xs"}`}
            style={{ backgroundColor: activeColors.primary }}
          />
          <div className="flex items-center space-x-1 opacity-70">
            <span
              className="w-4 h-1 rounded-full inline-block"
              style={{ backgroundColor: isDarkHero ? "#94A3B8" : "#94A3B8" }}
            />
            <span
              className="w-4 h-1 rounded-full inline-block"
              style={{ backgroundColor: isDarkHero ? "#94A3B8" : "#CBD5E1" }}
            />
          </div>
          {/* Mini Phone CTA Pill */}
          <span
            className="w-6 h-2 text-[7px] font-bold text-white flex items-center justify-center shadow-2xs"
            style={{
              backgroundColor: isHighContrast ? "#EA580C" : activeColors.primary,
              borderRadius: isSoft ? "9999px" : theme.borderRadius === "4px" ? "2px" : "4px",
            }}
          />
        </div>
      </div>

      {/* Mini Hero Area */}
      <div className={`px-3 py-2 flex-1 flex flex-col justify-between ${getHeroBackground()}`}>
        <div className="flex items-start justify-between gap-2">
          {/* Hero Left: Headlines & Button */}
          <div className="flex-1 space-y-1">
            {/* Pill badge */}
            <div
              className={`h-1.5 ${isSoft ? "w-12 rounded-full" : "w-10 rounded"}`}
              style={{
                backgroundColor: activeColors.accent,
                opacity: isDarkHero ? 0.9 : 0.85,
              }}
            />

            {/* Main Headline Bar */}
            <div
              className={`h-2.5 ${isMinimal ? "w-20" : "w-24"} rounded`}
              style={{
                backgroundColor: isDarkHero ? "#FFFFFF" : isHighContrast ? "#000000" : activeColors.text,
                borderRadius: isSoft ? "4px" : theme.borderRadius === "2px" || isMinimal ? "1px" : "3px",
              }}
            />

            {/* Subtitle Bar */}
            <div
              className="h-1 rounded w-16"
              style={{
                backgroundColor: isDarkHero ? "#94A3B8" : activeColors.muted,
                opacity: 0.7,
              }}
            />

            {/* Mini CTA Button */}
            <div className="pt-1 flex items-center space-x-1.5">
              <div
                className="h-3.5 px-2 flex items-center justify-center shadow-xs"
                style={{
                  backgroundColor: isHighContrast ? "#000000" : activeColors.primary,
                  border: isHighContrast ? "1px solid #EA580C" : undefined,
                  borderRadius: isSoft
                    ? "9999px"
                    : theme.borderRadius === "2px" || isMinimal
                    ? "2px"
                    : theme.borderRadius === "6px"
                    ? "3px"
                    : "6px",
                }}
              >
                <span className="w-5 h-1 bg-white rounded-full inline-block" />
              </div>

              {/* Secondary ghost CTA */}
              <div
                className="h-3.5 px-1.5 border flex items-center justify-center"
                style={{
                  borderColor: isDarkHero ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.15)",
                  borderRadius: isSoft ? "9999px" : "3px",
                }}
              >
                <span
                  className="w-3 h-0.5 rounded-full inline-block"
                  style={{
                    backgroundColor: isDarkHero ? "#CBD5E1" : activeColors.muted,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Hero Right: Mini Visual Card */}
          <div
            className={`w-12 h-12 border p-1 flex flex-col justify-between shadow-xs shrink-0 ${
              isSoft ? "rounded-[12px]" : isMinimal ? "rounded-[2px]" : "rounded-[6px]"
            }`}
            style={{
              backgroundColor: isDarkHero ? "#15203B" : activeColors.surface,
              borderColor: isDarkHero ? "rgba(255,255,255,0.15)" : isHighContrast ? "#000000" : "#E2E8F0",
            }}
          >
            <div
              className="w-3 h-3 rounded-full flex items-center justify-center"
              style={{ backgroundColor: activeColors.accent }}
            >
              <div className="w-1.5 h-1.5 bg-white rounded-full" />
            </div>
            <div className="space-y-0.5">
              <div
                className="h-1 w-full rounded"
                style={{
                  backgroundColor: isDarkHero ? "#FFFFFF" : activeColors.text,
                }}
              />
              <div
                className="h-0.5 w-2/3 rounded"
                style={{
                  backgroundColor: isDarkHero ? "#94A3B8" : activeColors.muted,
                }}
              />
            </div>
          </div>
        </div>

        {/* Bottom Feature Cards Row */}
        <div className="grid grid-cols-3 gap-1 pt-1.5">
          {[1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`p-1 border shadow-2xs flex items-center space-x-1 ${
                isSoft ? "rounded-[8px]" : isMinimal ? "rounded-[2px]" : "rounded-[4px]"
              }`}
              style={{
                backgroundColor: isDarkHero ? "#101B33" : activeColors.surface,
                borderColor: isDarkHero ? "rgba(255,255,255,0.1)" : isHighContrast ? "#000000" : "#E2E8F0",
              }}
            >
              <span
                className="w-2 h-2 rounded shrink-0"
                style={{
                  backgroundColor:
                    idx === 1 ? activeColors.primary : idx === 2 ? activeColors.accent : activeColors.secondary,
                }}
              />
              <div className="space-y-0.5 flex-1 min-w-0">
                <div
                  className="h-1 w-3/4 rounded"
                  style={{
                    backgroundColor: isDarkHero ? "#FFFFFF" : activeColors.text,
                  }}
                />
                <div
                  className="h-0.5 w-1/2 rounded"
                  style={{
                    backgroundColor: isDarkHero ? "#94A3B8" : activeColors.muted,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
