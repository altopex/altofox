"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  FileArchive,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  X,
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  Palette,
  Eye,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { THEMES, Theme } from "../lib/themes";
import { SavedProject } from "../lib/storage/project-types";
import { GlobalBusinessDetails } from "../lib/tools/custom-content";
import {
  importWebsiteZip,
  WebsiteImportSummary,
  MappedPageSummary,
} from "../lib/storage/zip-importer";

interface ImportWebsiteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectImported: (project: SavedProject) => void;
}

export function ImportWebsiteModal({
  isOpen,
  onClose,
  onProjectImported,
}: ImportWebsiteModalProps) {
  const [activeTab, setActiveTab] = useState<"zip" | "siteproject">("zip");
  const [isProcessing, setIsProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<WebsiteImportSummary | null>(null);
  const [preparedProject, setPreparedProject] = useState<SavedProject | null>(null);

  // Editable details in the review step
  const [editableDetails, setEditableDetails] = useState<GlobalBusinessDetails>({
    businessName: "",
    phone: "",
    email: "",
    streetAddress: "",
    city: "",
    stateRegion: "",
    zipPostalCode: "",
    businessHours: "",
    websiteDomain: "",
    businessModel: "service-area",
  });
  const [selectedThemeId, setSelectedThemeId] = useState<string>("modern-pro");
  const [showPagesBreakdown, setShowPagesBreakdown] = useState(false);
  const [showUnmappedBreakdown, setShowUnmappedBreakdown] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { summary, project } = await importWebsiteZip(file);

      // If it's a direct .siteproject backup, and user selected .siteproject tab or it's a backup,
      // it can be directly imported or reviewed
      setImportSummary(summary);
      setPreparedProject(project);
      setEditableDetails(summary.detectedDetails);
      setSelectedThemeId(summary.detectedTheme.id);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to process the uploaded archive.");
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleConfirmImport = () => {
    if (!preparedProject) return;

    // Apply any edited business details & theme
    const chosenTheme = THEMES.find((t) => t.id === selectedThemeId) || preparedProject.theme;

    const finalProject: SavedProject = {
      ...preparedProject,
      name: editableDetails.businessName || preparedProject.name,
      businessDetails: editableDetails,
      theme: chosenTheme,
      formData: {
        ...preparedProject.formData,
        businessName: editableDetails.businessName,
        phone: editableDetails.phone,
        email: editableDetails.email,
        city: editableDetails.city,
        stateRegion: editableDetails.stateRegion,
        websiteDomain: editableDetails.websiteDomain,
        theme: chosenTheme,
      },
    };

    onProjectImported(finalProject);
    onClose();
  };

  const resetImport = () => {
    setImportSummary(null);
    setPreparedProject(null);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {importSummary ? "Confirm Website Import" : "Import Website into Project"}
              </h2>
              <p className="text-xs text-slate-500">
                {importSummary
                  ? "Review detected business details, pages, and theme before creating your project."
                  : "Upload a website ZIP or .siteproject backup to continue editing and optimizing."}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Import Error</p>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {!importSummary ? (
            /* STEP 1: CHOOSE IMPORT METHOD */
            <div className="space-y-6">
              {/* Option Selector Tabs */}
              <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab("zip")}
                  className={`py-2.5 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
                    activeTab === "zip"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <FileArchive className="w-4 h-4" />
                  <span>Website ZIP Archive</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("siteproject")}
                  className={`py-2.5 px-4 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 ${
                    activeTab === "siteproject"
                      ? "bg-white text-indigo-700 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  <span>.siteproject Backup</span>
                </button>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-2xl p-10 text-center cursor-pointer transition flex flex-col items-center justify-center space-y-3"
              >
                <div className="w-14 h-14 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Upload className="w-7 h-7" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {activeTab === "zip"
                      ? "Select or drop your Website ZIP file"
                      : "Select or drop your .siteproject backup"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    {activeTab === "zip"
                      ? "Upload a site generated by this builder or any static HTML site. We'll automatically map pages, preserve URLs, extract images, and keep all content safe."
                      : "Upload an exported .siteproject bundle to restore all settings, keywords, changelog history, and content exactly."}
                  </p>
                </div>

                <div className="pt-2">
                  <span className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isProcessing ? "Analyzing archive…" : "Browse Files"}</span>
                  </span>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept={activeTab === "zip" ? ".zip" : ".siteproject,.zip"}
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Informational Features */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Globe className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Rankings Protected</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Preserves exact URLs and canonical links so existing search rankings are not lost.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Zero Content Loss</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Non-standard sections are preserved as Custom Content Blocks to guarantee nothing is dropped.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <Palette className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Theme Detection</span>
                  </div>
                  <p className="text-slate-500 text-[11px]">
                    Extracts primary colors, fonts, and matches the closest design system automatically.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* STEP 2: REVIEW IMPORT SUMMARY & EDIT DETAILS */
            <div className="space-y-6">
              {/* Header Badge */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
                <div className="flex items-center space-x-2.5">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950">
                      Successfully Analyzed Archive ({importSummary.fileName})
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      Found {importSummary.pageCount} HTML pages, {importSummary.imageCount} images, and{" "}
                      {importSummary.unmappedBlocksCount} custom blocks.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetImport}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline"
                >
                  Choose Different File
                </button>
              </div>

              {/* Warnings if any */}
              {importSummary.warnings.map((warn, i) => (
                <div
                  key={i}
                  className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start space-x-2"
                >
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{warn}</span>
                </div>
              ))}

              {/* Editable Business Details Form */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    <span>Detected Business Details (Editable)</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">Extracted from Schema &amp; Footer</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Business Name
                    </label>
                    <input
                      type="text"
                      value={editableDetails.businessName}
                      onChange={(e) =>
                        setEditableDetails({ ...editableDetails, businessName: e.target.value })
                      }
                      className="input-base text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={editableDetails.phone}
                      onChange={(e) =>
                        setEditableDetails({ ...editableDetails, phone: e.target.value })
                      }
                      className="input-base text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={editableDetails.email}
                      onChange={(e) =>
                        setEditableDetails({ ...editableDetails, email: e.target.value })
                      }
                      className="input-base text-xs bg-white"
                      placeholder="info@example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Website Domain
                    </label>
                    <input
                      type="text"
                      value={editableDetails.websiteDomain}
                      onChange={(e) =>
                        setEditableDetails({ ...editableDetails, websiteDomain: e.target.value })
                      }
                      className="input-base text-xs bg-white"
                      placeholder="example.com"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      City &amp; State
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={editableDetails.city}
                        onChange={(e) =>
                          setEditableDetails({ ...editableDetails, city: e.target.value })
                        }
                        className="input-base text-xs bg-white flex-1"
                        placeholder="City"
                      />
                      <input
                        type="text"
                        value={editableDetails.stateRegion}
                        onChange={(e) =>
                          setEditableDetails({ ...editableDetails, stateRegion: e.target.value })
                        }
                        className="input-base text-xs bg-white w-20 text-center"
                        placeholder="State"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Business Hours
                    </label>
                    <input
                      type="text"
                      value={editableDetails.businessHours}
                      onChange={(e) =>
                        setEditableDetails({ ...editableDetails, businessHours: e.target.value })
                      }
                      className="input-base text-xs bg-white"
                      placeholder="e.g. 24/7 Service"
                    />
                  </div>
                </div>
              </div>

              {/* Theme & Fonts Match */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Palette className="w-4 h-4 text-indigo-600" />
                    <span>Design System &amp; Theme Match</span>
                  </h3>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Fonts: {importSummary.detectedFonts.heading} / {importSummary.detectedFonts.body}
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs">
                  <span className="text-slate-600">Assigned Theme:</span>
                  <select
                    value={selectedThemeId}
                    onChange={(e) => setSelectedThemeId(e.target.value)}
                    className="p-2 rounded-lg border border-slate-300 bg-white font-semibold text-slate-800 text-xs"
                  >
                    {THEMES.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name} ({theme.bestFor.slice(0, 2).join(", ")})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Pages & Section Breakdown Collapsible */}
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => setShowPagesBreakdown(!showPagesBreakdown)}
                  className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-800 transition"
                >
                  <span className="flex items-center space-x-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>
                      Detected Pages &amp; Section Mappings ({importSummary.pages.length} Pages)
                    </span>
                  </span>
                  {showPagesBreakdown ? (
                    <ChevronUp className="w-4 h-4 text-slate-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500" />
                  )}
                </button>

                {showPagesBreakdown && (
                  <div className="p-3 divide-y divide-slate-100 max-h-60 overflow-y-auto">
                    {importSummary.pages.map((p) => (
                      <div key={p.path} className="py-2.5 space-y-1 text-xs">
                        <div className="flex items-center justify-between font-mono font-bold text-slate-900">
                          <span>/{p.path}</span>
                          <span className="text-[10px] font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            {p.sectionsCount} sections mapped
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          Title: {p.title || "None"}
                        </div>
                        {p.mappedSections.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {p.mappedSections.map((s, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 font-mono"
                              >
                                {s.type}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unmapped Custom Blocks Collapsible */}
              {importSummary.unmappedBlocksCount > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
                  <button
                    type="button"
                    onClick={() => setShowUnmappedBreakdown(!showUnmappedBreakdown)}
                    className="w-full p-3.5 bg-amber-50/50 hover:bg-amber-50 flex items-center justify-between text-xs font-bold text-amber-900 transition"
                  >
                    <span className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-amber-600" />
                      <span>
                        Retained Custom Blocks ({importSummary.unmappedBlocksCount} unmapped sections
                        preserved)
                      </span>
                    </span>
                    {showUnmappedBreakdown ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {showUnmappedBreakdown && (
                    <div className="p-3 divide-y divide-slate-100 max-h-48 overflow-y-auto text-xs">
                      {importSummary.customBlocks.map((b) => (
                        <div key={b.id} className="py-2 space-y-0.5">
                          <div className="font-bold text-slate-800">{b.title}</div>
                          <div className="text-[11px] text-slate-500 font-mono">
                            Target: {b.specificPages?.join(", ") || "All pages"} • Position:{" "}
                            {b.position}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 transition"
          >
            Cancel
          </button>

          {importSummary && (
            <button
              type="button"
              onClick={handleConfirmImport}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm &amp; Create Project</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
