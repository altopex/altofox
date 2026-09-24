"use client";

import React from "react";
import { Theme, ThemeColors } from "@/lib/themes";

interface ThemeMiniPreviewProps {
  theme: Theme;
  colors?: ThemeColors;
}

export function ThemeMiniPreview({ theme, colors }: ThemeMiniPreviewProps) {
  const activeColors = colors || theme.colors;

  // Hero background styling based on theme identity
  const getHeroBackground = () => {
    if (theme.id === "bold-trade") {
      return "bg-[#0B132B]"; // Heavy industrial dark navy
    }
    if (theme.id === "vibrant-modern") {
      return "bg-gradient-to-br from-[#FAF5FF] via-[#FDF4FF] to-[#FCE7F3]";
    }
    if (theme.id === "modern-pro") {
      return "bg-gradient-to-r from-[#EFF6FF] to-[#DBEAFE]";
    }
    return activeColors.background;
  };

  const isDarkHero = theme.id === "bold-trade";

  return (
    <div
      className="w-full h-32 sm:h-36 rounded-[10px] overflow-hidden border border-black/10 flex flex-col shadow-inner select-none pointer-events-none transition-all"
      style={{ backgroundColor: activeColors.background }}
    >
      {/* Mini Browser Bar */}
      <div
        className="h-5 px-2 flex items-center justify-between border-b shrink-0"
        style={{
          backgroundColor: isDarkHero ? "#070E20" : "#FFFFFF",
          borderColor: isDarkHero ? "rgba(255,255,255,0.1)" : "#E2E8F0",
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
            className="w-2 h-2 rounded-full inline-block shrink-0"
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
          {/* Mini CTA Pill */}
          <span
            className="w-6 h-2 rounded text-[7px] font-bold text-white flex items-center justify-center shadow-2xs"
            style={{
              backgroundColor: activeColors.primary,
              borderRadius: theme.borderRadius === "20px" ? "9999px" : "4px",
            }}
          />
        </div>
      </div>

      {/* Mini Hero Area */}
      <div
        className={`px-3 py-2 flex-1 flex flex-col justify-between ${
          theme.id === "bold-trade" || theme.id === "vibrant-modern" || theme.id === "modern-pro"
            ? getHeroBackground()
            : ""
        }`}
        style={
          theme.id !== "bold-trade" && theme.id !== "vibrant-modern" && theme.id !== "modern-pro"
            ? { backgroundColor: activeColors.background }
            : {}
        }
      >
        <div className="flex items-start justify-between gap-2">
          {/* Hero Left: Headlines & Button */}
          <div className="flex-1 space-y-1">
            {/* Pill badge */}
            <div
              className="w-10 h-1.5 rounded-full"
              style={{
                backgroundColor: activeColors.accent,
                opacity: isDarkHero ? 0.9 : 0.85,
              }}
            />

            {/* Main Headline Bar */}
            <div
              className="h-2.5 rounded w-24"
              style={{
                backgroundColor: isDarkHero ? "#FFFFFF" : activeColors.text,
                borderRadius: theme.borderRadius === "2px" ? "1px" : "3px",
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
                  backgroundColor:
                    theme.id === "vibrant-modern" ? "#7C3AED" : activeColors.primary,
                  backgroundImage:
                    theme.id === "vibrant-modern"
                      ? "linear-gradient(to right, #7C3AED, #EC4899)"
                      : undefined,
                  borderRadius:
                    theme.borderRadius === "20px"
                      ? "9999px"
                      : theme.borderRadius === "2px"
                      ? "2px"
                      : theme.borderRadius === "6px"
                      ? "4px"
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
                  borderRadius:
                    theme.borderRadius === "20px"
                      ? "9999px"
                      : theme.borderRadius === "2px"
                      ? "2px"
                      : "4px",
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
            className="w-12 h-12 rounded border p-1 flex flex-col justify-between shadow-xs shrink-0"
            style={{
              backgroundColor: isDarkHero ? "#15203B" : activeColors.surface,
              borderColor: isDarkHero ? "rgba(255,255,255,0.15)" : "#E2E8F0",
              borderRadius: theme.borderRadius,
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
              className="p-1 border rounded shadow-2xs flex items-center space-x-1"
              style={{
                backgroundColor: isDarkHero ? "#101B33" : activeColors.surface,
                borderColor: isDarkHero ? "rgba(255,255,255,0.1)" : "#E2E8F0",
                borderRadius: theme.borderRadius === "2px" ? "2px" : "6px",
              }}
            >
              <span
                className="w-2 h-2 rounded shrink-0"
                style={{
                  backgroundColor: idx === 1 ? activeColors.primary : idx === 2 ? activeColors.accent : activeColors.secondary,
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
