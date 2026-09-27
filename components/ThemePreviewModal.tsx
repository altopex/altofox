"use client";

import React, { useState, useEffect } from "react";
import { Theme } from "@/lib/themes";
import {
  X,
  Monitor,
  Tablet,
  Smartphone,
  Check,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface ThemePreviewModalProps {
  theme: Theme | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectTheme: (themeId: string) => void;
  isSelected?: boolean;
}

export function ThemePreviewModal({
  theme,
  isOpen,
  onClose,
  onSelectTheme,
  isSelected = false,
}: ThemePreviewModalProps) {
  const [device, setDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !theme) {
      setHtmlContent("");
      setError(null);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    fetch(`/api/themes/preview?themeId=${encodeURIComponent(theme.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (data.success && data.html) {
          setHtmlContent(data.html);
        } else {
          setError(data.error || "Failed to render theme preview");
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err.message || "Network error loading preview");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, theme]);

  if (!isOpen || !theme) return null;

  const deviceWidthMap = {
    desktop: "w-full",
    tablet: "w-[768px] max-w-full",
    mobile: "w-[375px] max-w-full",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-[20px] shadow-2xl border border-slate-200 w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0 flex-wrap gap-2">
          {/* Left: Theme Info */}
          <div className="flex items-center space-x-3">
            <div
              className="w-4 h-4 rounded-full border border-black/10 shrink-0"
              style={{ backgroundColor: theme.colors.primary }}
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">{theme.name}</h3>
                {isSelected ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Currently Selected
                  </span>
                ) : null}
              </div>
              <p className="text-xs text-slate-500 line-clamp-1">{theme.description}</p>
            </div>
          </div>

          {/* Center: Device Switcher */}
          <div className="flex items-center bg-white border border-slate-200 p-1 rounded-xl shadow-2xs space-x-1">
            <button
              type="button"
              onClick={() => setDevice("desktop")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                device === "desktop"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="Desktop View (100%)"
            >
              <Monitor className="w-4 h-4" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice("tablet")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                device === "tablet"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="Tablet View (768px)"
            >
              <Tablet className="w-4 h-4" />
              <span className="hidden sm:inline">Tablet</span>
            </button>
            <button
              type="button"
              onClick={() => setDevice("mobile")}
              className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                device === "mobile"
                  ? "bg-indigo-600 text-white shadow-2xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-4 h-4" />
              <span className="hidden sm:inline">Mobile</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => {
                onSelectTheme(theme.id);
                onClose();
              }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 shadow-2xs ${
                isSelected
                  ? "bg-emerald-600 text-white hover:bg-emerald-700"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isSelected ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Selected</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Select Theme</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Design Characteristics Ribbon */}
        {theme.designCharacteristics && theme.designCharacteristics.length > 0 && (
          <div className="px-5 py-2 bg-indigo-50/50 border-b border-indigo-100/60 flex items-center overflow-x-auto gap-2 text-xs shrink-0">
            <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
              Design Features:
            </span>
            <div className="flex items-center gap-1.5">
              {theme.designCharacteristics.map((char, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full bg-white text-slate-700 border border-indigo-200 text-[11px] font-medium whitespace-nowrap shadow-2xs"
                >
                  {char}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Modal Iframe Stage Area */}
        <div className="flex-1 bg-slate-200/70 p-2 sm:p-4 flex items-center justify-center overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-xs font-semibold text-slate-700">
                Rendering live theme preview with realistic local service data…
              </p>
            </div>
          ) : error ? (
            <div className="p-6 bg-white rounded-xl border border-red-200 text-center max-w-md space-y-2">
              <p className="text-sm font-bold text-red-600">Could not load theme preview</p>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          ) : (
            <div
              className={`h-full transition-all duration-300 bg-white rounded-[12px] shadow-lg overflow-hidden border border-slate-300 flex flex-col ${deviceWidthMap[device]}`}
            >
              <iframe
                title={`Live Preview of ${theme.name}`}
                srcDoc={htmlContent}
                className="w-full h-full border-0"
                sandbox="allow-same-origin allow-scripts"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
