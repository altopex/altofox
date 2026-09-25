"use client";

import React, { useState } from "react";
import {
  findMatches,
  applyReplacements,
  FindReplaceMatch,
  FindReplaceOptions,
} from "../lib/tools/find-replace";
import {
  GlobalBusinessDetails,
  CustomContentBlock,
  interpolateGlobalVariables,
  injectCustomContentBlocks,
} from "../lib/tools/custom-content";
import {
  Search,
  Replace,
  RotateCcw,
  CheckSquare,
  Square,
  Building,
  Layers,
  Plus,
  Trash2,
  PhoneCall,
  Check,
  X,
  FileText,
  AlertCircle,
} from "lucide-react";

interface FindReplaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  files: { path: string; content: string }[];
  onUpdateFiles: (newFiles: { path: string; content: string }[], logSummary: string) => void;
  businessDetails: GlobalBusinessDetails;
  onUpdateBusinessDetails: (details: GlobalBusinessDetails) => void;
  customBlocks: CustomContentBlock[];
  onUpdateCustomBlocks: (blocks: CustomContentBlock[]) => void;
  mustIncludeText: string;
  onUpdateMustIncludeText: (text: string) => void;
  canUndo: boolean;
  onUndo: () => void;
}

export function FindReplaceModal({
  isOpen,
  onClose,
  files,
  onUpdateFiles,
  businessDetails,
  onUpdateBusinessDetails,
  customBlocks,
  onUpdateCustomBlocks,
  mustIncludeText,
  onUpdateMustIncludeText,
  canUndo,
  onUndo,
}: FindReplaceModalProps) {
  const [activeTab, setActiveTab] = useState<"find-replace" | "business-details" | "custom-content">("find-replace");

  // Find & Replace Form State
  const [findText, setFindText] = useState("");
  const [replaceWith, setReplaceWith] = useState("");
  const [matchCase, setMatchCase] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [scope, setScope] = useState<"all" | "selected" | "text-only" | "include-meta-links">("include-meta-links");
  const [isPhoneReplace, setIsPhoneReplace] = useState(false);
  const [matches, setMatches] = useState<FindReplaceMatch[]>([]);
  const [previewDone, setPreviewDone] = useState(false);

  // Business Details Form State
  const [details, setDetails] = useState<GlobalBusinessDetails>(businessDetails);

  // Custom Content Blocks Form State
  const [blocks, setBlocks] = useState<CustomContentBlock[]>(customBlocks);
  const [newBlockTitle, setNewBlockTitle] = useState("");
  const [newBlockContent, setNewBlockContent] = useState("");
  const [newBlockPlacement, setNewBlockPlacement] = useState<CustomContentBlock["placement"]>("all");
  const [newBlockPosition, setNewBlockPosition] = useState<CustomContentBlock["position"]>("after-hero");
  const [newBlockMode, setNewBlockMode] = useState<"exact" | "blend">("exact");

  if (!isOpen) return null;

  // Run Find Preview
  const handlePreview = () => {
    const opts: FindReplaceOptions = {
      find: findText,
      replaceWith,
      matchCase,
      wholeWord,
      scope,
      isPhoneReplace,
    };
    const found = findMatches(files, opts);
    setMatches(found);
    setPreviewDone(true);
  };

  // Toggle selection of a match
  const toggleMatch = (id: string) => {
    setMatches(matches.map((m) => (m.id === id ? { ...m, selected: !m.selected } : m)));
  };

  const selectAllMatches = (selected: boolean) => {
    setMatches(matches.map((m) => ({ ...m, selected })));
  };

  // Apply Find & Replace
  const handleApplyReplace = () => {
    const opts: FindReplaceOptions = {
      find: findText,
      replaceWith,
      matchCase,
      wholeWord,
      scope,
      isPhoneReplace,
    };
    const updatedFiles = applyReplacements(files, matches, opts);
    const count = matches.filter((m) => m.selected).length;
    onUpdateFiles(
      updatedFiles,
      `Replaced "${findText}" with "${replaceWith}" across ${count} occurrences`
    );
    setMatches([]);
    setPreviewDone(false);
    setFindText("");
    setReplaceWith("");
  };

  // Instant Site Rebuild with Global Business Details
  const handleRebuildWithDetails = () => {
    onUpdateBusinessDetails(details);
    const updatedFiles = files.map((file) => ({
      ...file,
      content: interpolateGlobalVariables(file.content, details),
    }));
    onUpdateFiles(
      updatedFiles,
      `Global rebuild: updated business details for "${details.businessName}"`
    );
  };

  // Add Custom Block
  const handleAddBlock = () => {
    if (!newBlockTitle.trim() || !newBlockContent.trim()) return;

    const newBlock: CustomContentBlock = {
      id: `block-${Date.now()}`,
      title: newBlockTitle.trim(),
      content: newBlockContent.trim(),
      placement: newBlockPlacement,
      position: newBlockPosition,
      mode: newBlockMode,
      active: true,
    };

    const updatedBlocks = [...blocks, newBlock];
    setBlocks(updatedBlocks);
    onUpdateCustomBlocks(updatedBlocks);

    // Apply to files
    const updatedFiles = files.map((f) => ({
      ...f,
      content: injectCustomContentBlocks(f.content, f.path, updatedBlocks),
    }));
    onUpdateFiles(updatedFiles, `Added custom content block "${newBlock.title}"`);

    setNewBlockTitle("");
    setNewBlockContent("");
  };

  // Remove Custom Block
  const handleRemoveBlock = (id: string) => {
    const updatedBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(updatedBlocks);
    onUpdateCustomBlocks(updatedBlocks);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="p-4 px-6 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">
              Site Tools: Find &amp; Replace &amp; Global Details
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {canUndo && (
              <button
                type="button"
                onClick={onUndo}
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 text-xs font-bold text-amber-800 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Undo Last Change</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6">
          <button
            type="button"
            onClick={() => setActiveTab("find-replace")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
              activeTab === "find-replace"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>1. Find &amp; Replace</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("business-details")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
              activeTab === "business-details"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>2. Global Business Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("custom-content")}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center space-x-2 transition ${
              activeTab === "custom-content"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3. Custom Content &amp; Must-Include</span>
          </button>
        </div>

        {/* TAB 1: FIND & REPLACE */}
        {activeTab === "find-replace" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Find</label>
                <input
                  type="text"
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder="e.g. (214) 555-0198 or Dallas Plumber"
                  className="input-base text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Replace With</label>
                <input
                  type="text"
                  value={replaceWith}
                  onChange={(e) => setReplaceWith(e.target.value)}
                  placeholder="e.g. (214) 555-9999 or Fort Worth Plumber"
                  className="input-base text-xs bg-white"
                />
              </div>
            </div>

            {/* Options Row */}
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={matchCase}
                  onChange={(e) => setMatchCase(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600"
                />
                <span className="text-slate-700">Match Case</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wholeWord}
                  onChange={(e) => setWholeWord(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600"
                />
                <span className="text-slate-700">Whole Word Only</span>
              </label>

              <label className="flex items-center space-x-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPhoneReplace}
                  onChange={(e) => setIsPhoneReplace(e.target.checked)}
                  className="w-3.5 h-3.5 rounded text-indigo-600"
                />
                <span className="font-semibold text-indigo-700">
                  ⚡ Smart Phone Replace (Updates text, tel: links, &amp; schema)
                </span>
              </label>

              <div className="flex items-center space-x-1 ml-auto">
                <span className="text-slate-500">Scope:</span>
                <select
                  value={scope}
                  onChange={(e) => setScope(e.target.value as any)}
                  className="text-xs p-1 border border-slate-300 rounded bg-white"
                >
                  <option value="include-meta-links">All (Text, Meta, Links, Schema)</option>
                  <option value="text-only">Text Content Only</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={handlePreview}
                disabled={!findText.trim()}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition disabled:opacity-50"
              >
                Find &amp; Preview Occurrences
              </button>
            </div>

            {/* Preview Occurrences List */}
            {previewDone && (
              <div className="space-y-3 pt-3 border-t border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Found {matches.length} matching occurrences
                  </span>
                  {matches.length > 0 && (
                    <div className="flex items-center space-x-3 text-xs">
                      <button
                        type="button"
                        onClick={() => selectAllMatches(true)}
                        className="text-indigo-600 hover:underline"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={() => selectAllMatches(false)}
                        className="text-slate-500 hover:underline"
                      >
                        Deselect All
                      </button>
                    </div>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
                  {matches.map((m) => (
                    <div
                      key={m.id}
                      onClick={() => toggleMatch(m.id)}
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-start space-x-3 transition ${
                        m.selected ? "border-indigo-300 bg-indigo-50/40" : "border-slate-200 bg-white"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={m.selected}
                        onChange={() => toggleMatch(m.id)}
                        className="mt-0.5 w-3.5 h-3.5 rounded text-indigo-600"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[11px] font-bold text-slate-700">
                            {m.pagePath} (Line ~{m.lineEstimate})
                          </span>
                          <span className="text-[10px] uppercase font-semibold bg-slate-100 px-1.5 py-0.2 rounded text-slate-600">
                            {m.type}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] font-mono mt-1 break-all">
                          {m.snippet}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {matches.length > 0 && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={handleApplyReplace}
                      className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
                    >
                      Apply Replacements ({matches.filter((m) => m.selected).length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GLOBAL BUSINESS DETAILS */}
        {activeTab === "business-details" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-950 flex items-start space-x-2">
              <Building className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <strong>Single Source of Truth:</strong> Values updated here automatically replace variables (e.g. <code>{"{{phone}}"}</code>, <code>{"{{businessName}}"}</code>) across every page, header, footer, and LocalBusiness schema without needing an AI call.
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Business Name</label>
                <input
                  type="text"
                  value={details.businessName}
                  onChange={(e) => setDetails({ ...details, businessName: e.target.value })}
                  className="input-base text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={details.phone}
                  onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                  className="input-base text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Email Address</label>
                <input
                  type="email"
                  value={details.email}
                  onChange={(e) => setDetails({ ...details, email: e.target.value })}
                  className="input-base text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">City &amp; State</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={details.city}
                    onChange={(e) => setDetails({ ...details, city: e.target.value })}
                    placeholder="City"
                    className="input-base text-xs bg-white"
                  />
                  <input
                    type="text"
                    value={details.stateRegion}
                    onChange={(e) => setDetails({ ...details, stateRegion: e.target.value })}
                    placeholder="State"
                    className="input-base text-xs bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Business Hours</label>
                <input
                  type="text"
                  value={details.businessHours}
                  onChange={(e) => setDetails({ ...details, businessHours: e.target.value })}
                  className="input-base text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Website Domain</label>
                <input
                  type="text"
                  value={details.websiteDomain}
                  onChange={(e) => setDetails({ ...details, websiteDomain: e.target.value })}
                  className="input-base text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">License Number</label>
                <input
                  type="text"
                  value={details.licenseNumber || ""}
                  onChange={(e) => setDetails({ ...details, licenseNumber: e.target.value })}
                  className="input-base text-xs bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">Google Review URL</label>
                <input
                  type="text"
                  value={details.googleReviewUrl || ""}
                  onChange={(e) => setDetails({ ...details, googleReviewUrl: e.target.value })}
                  className="input-base text-xs bg-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={handleRebuildWithDetails}
                className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm"
              >
                Rebuild Site Instantly with Updated Details
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: CUSTOM CONTENT & MUST-INCLUDE TEXT */}
        {activeTab === "custom-content" && (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Must-Include Text Section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <h3 className="text-xs font-bold text-slate-900 flex items-center space-x-2">
                <span>Must-Include Text for the AI</span>
                <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-100 px-2 py-0.5 rounded">
                  Policy Enforced
                </span>
              </h3>
              <p className="text-[11px] text-slate-500">
                Text that must appear word-for-word on generated or optimized pages (e.g. required state license disclaimer or warranty guarantee).
              </p>
              <textarea
                rows={2}
                value={mustIncludeText}
                onChange={(e) => onUpdateMustIncludeText(e.target.value)}
                placeholder="e.g. Regulated by the Texas Department of Licensing and Regulation, License #M-41920."
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
              />
            </div>

            {/* Custom Content Blocks Manager */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900">Custom Content Blocks</h3>
                <span className="text-xs text-slate-500">{blocks.length} active blocks</span>
              </div>

              {/* Add New Block Form */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-800">Add New Custom Block</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Block Title</label>
                    <input
                      type="text"
                      value={newBlockTitle}
                      onChange={(e) => setNewBlockTitle(e.target.value)}
                      placeholder="e.g. Seasonal Spring Discount"
                      className="input-base text-xs bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Placement</label>
                    <select
                      value={newBlockPlacement}
                      onChange={(e) => setNewBlockPlacement(e.target.value as any)}
                      className="input-base text-xs bg-white"
                    >
                      <option value="all">All Pages</option>
                      <option value="location-pages">All Location Pages</option>
                      <option value="service-pages">All Service Pages</option>
                      <option value="blog-posts">All Blog Posts</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Position</label>
                    <select
                      value={newBlockPosition}
                      onChange={(e) => setNewBlockPosition(e.target.value as any)}
                      className="input-base text-xs bg-white"
                    >
                      <option value="top-announcement">Top Announcement Bar</option>
                      <option value="after-hero">After Hero Section</option>
                      <option value="before-footer-cta">Before Footer CTA</option>
                      <option value="footer">Inside Footer</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Content (Plain text or HTML)
                  </label>
                  <textarea
                    rows={3}
                    value={newBlockContent}
                    onChange={(e) => setNewBlockContent(e.target.value)}
                    placeholder="e.g. 📢 Limited Time: Get $50 Off Any Water Heater Repair or Replacement this month! Call now."
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleAddBlock}
                    disabled={!newBlockTitle.trim() || !newBlockContent.trim()}
                    className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition disabled:opacity-50"
                  >
                    + Add Block
                  </button>
                </div>
              </div>

              {/* List of Existing Blocks */}
              {blocks.length > 0 && (
                <div className="space-y-2">
                  {blocks.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-white border border-slate-200 rounded-xl flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <strong className="text-slate-900">{b.title}</strong>
                          <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                            {b.placement} • {b.position}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px]">{b.content}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveBlock(b.id)}
                        className="text-slate-400 hover:text-red-600 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
