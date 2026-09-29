"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  X,
  Globe,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Copy,
  Check,
  ChevronRight,
  Server,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { DnsRecordGuidance } from "@/lib/cloudflare/cloudflare-service";

export interface PublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  projectId?: string;
  files?: Array<{ path: string; content: string }>;
  photos?: any[];
  websiteDomain?: string;
  onOpenSettings?: () => void;
}

export function PublishModal({
  isOpen,
  onClose,
  projectName,
  projectId,
  files = [],
  photos = [],
  websiteDomain,
  onOpenSettings,
}: PublishModalProps) {
  // Connection state
  const [checkingConnection, setCheckingConnection] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [accountName, setAccountName] = useState<string>("");
  const [maskedToken, setMaskedToken] = useState<string>("");
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Quick inline connect states (if not configured yet)
  const [quickApiToken, setQuickApiToken] = useState("");
  const [quickAccountId, setQuickAccountId] = useState("");
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [quickSaveError, setQuickSaveError] = useState<string | null>(null);

  // Destination project state
  const [destinationMode, setDestinationMode] = useState<"new" | "existing">("new");
  const [targetProjectName, setTargetProjectName] = useState(() => {
    return (projectName || "my-website")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
  });
  const [existingProjects, setExistingProjects] = useState<Array<{ name: string; subdomain: string }>>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState<string>("");
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [liveUrl, setLiveUrl] = useState<string>("");
  const [deployedSubdomain, setDeployedSubdomain] = useState<string>("");
  const [publishedAt, setPublishedAt] = useState<number | null>(null);

  // Custom Domain state
  const [customDomainInput, setCustomDomainInput] = useState<string>(websiteDomain || "");
  const [isConnectingDomain, setIsConnectingDomain] = useState(false);
  const [domainStatus, setDomainStatus] = useState<"none" | "pending" | "active" | "action_required">("none");
  const [domainDnsRecords, setDomainDnsRecords] = useState<DnsRecordGuidance[]>([]);
  const [domainMessage, setDomainMessage] = useState<string | null>(null);
  const [copiedTarget, setCopiedTarget] = useState(false);

  const loadExistingProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const res = await fetch("/api/cloudflare/projects");
      const data = await res.json();
      if (data.success && Array.isArray(data.projects)) {
        setExistingProjects(data.projects);
      }
    } catch {
      // Non-critical
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const checkCloudflareStatus = useCallback(async () => {
    setCheckingConnection(true);
    setConnectionError(null);
    try {
      const res = await fetch("/api/cloudflare/status");
      const data = await res.json();
      if (data.connected) {
        setIsConnected(true);
        setAccountName(data.accountName || "Connected Cloudflare Account");
        setMaskedToken(data.maskedToken || "");
        loadExistingProjects();
      } else {
        setIsConnected(false);
        setConnectionError(data.error || "Cloudflare is not connected yet.");
      }
    } catch (err: any) {
      setIsConnected(false);
      setConnectionError("Could not reach Cloudflare status API.");
    } finally {
      setCheckingConnection(false);
    }
  }, [loadExistingProjects]);

  // Reset or fetch on modal open
  useEffect(() => {
    if (!isOpen) return;

    checkCloudflareStatus();

    // Default sanitized project name
    const initialClean = (projectName || "my-website")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
    setTargetProjectName(initialClean || "ranklocal-site");

    if (websiteDomain) {
      setCustomDomainInput(websiteDomain.replace(/^https?:\/\//, "").replace(/\/+$/, ""));
    }
  }, [isOpen, projectName, websiteDomain, checkCloudflareStatus]);

  const handleQuickSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickApiToken.trim() || !quickAccountId.trim()) {
      setQuickSaveError("Please enter both API Token and Account ID.");
      return;
    }

    setIsSavingCreds(true);
    setQuickSaveError(null);

    try {
      const res = await fetch("/api/cloudflare/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiToken: quickApiToken.trim(),
          accountId: quickAccountId.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsConnected(true);
        setAccountName(data.accountName || "Connected Account");
        setMaskedToken(data.maskedToken);
        setQuickApiToken("");
        setQuickAccountId("");
        loadExistingProjects();
      } else {
        setQuickSaveError(data.error || "Failed to verify or save Cloudflare credentials.");
      }
    } catch (err: any) {
      setQuickSaveError(err.message || "Network error saving credentials.");
    } finally {
      setIsSavingCreds(false);
    }
  };

  const handlePublish = async () => {
    if (!targetProjectName.trim()) {
      setDeployError("Please specify a Cloudflare Pages project name.");
      return;
    }

    setIsDeploying(true);
    setDeployError(null);
    setDeployStep("Preparing website files & canonical assets…");

    try {
      // Small timeout to allow UI step update
      await new Promise((r) => setTimeout(r, 200));
      setDeployStep("Connecting to Cloudflare edge deployment engine…");

      const payload = {
        projectName: targetProjectName.trim(),
        projectId: projectId || undefined,
        files: files.length > 0 ? files : undefined,
        photos: photos.length > 0 ? photos : undefined,
        domain: websiteDomain || customDomainInput || undefined,
      };

      const res = await fetch("/api/cloudflare/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Cloudflare deployment failed.");
      }

      setDeployStep("Deployment successfully verified!");
      setDeploySuccess(true);
      setLiveUrl(data.liveUrl || `https://${data.projectName}.pages.dev`);
      setDeployedSubdomain(data.subdomain || `${data.projectName}.pages.dev`);
      setPublishedAt(data.publishedAt || Date.now());

      // If user had a website domain entered, check or prepare its custom domain status
      if (customDomainInput.trim()) {
        handleConnectDomain(data.projectName, customDomainInput.trim());
      }
    } catch (err: any) {
      console.error("[PublishModal] Deploy error:", err);
      setDeployError(err.message || "Failed to deploy to Cloudflare Pages. Please try again.");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleConnectDomain = async (overrideProjectName?: string, overrideDomain?: string) => {
    const proj = overrideProjectName || targetProjectName;
    const dom = overrideDomain || customDomainInput;

    if (!dom.trim()) {
      setDomainMessage("Please enter a domain name (e.g. mybusiness.com).");
      return;
    }

    setIsConnectingDomain(true);
    setDomainMessage(null);

    try {
      const res = await fetch("/api/cloudflare/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: proj,
          domain: dom.trim(),
          action: "add",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to configure domain on Cloudflare Pages.");
      }

      setDomainStatus(data.status || "pending");
      setDomainDnsRecords(data.dnsRecords || []);
      setDomainMessage(data.message || "Domain configured on Cloudflare Pages.");
    } catch (err: any) {
      setDomainMessage(err.message || "Could not connect custom domain.");
    } finally {
      setIsConnectingDomain(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!customDomainInput.trim()) return;

    setIsConnectingDomain(true);
    try {
      const res = await fetch("/api/cloudflare/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectName: targetProjectName,
          domain: customDomainInput.trim(),
          action: "verify",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDomainStatus(data.status || "pending");
        if (data.dnsRecords) setDomainDnsRecords(data.dnsRecords);
        setDomainMessage(data.message || "Verification check complete.");
      } else {
        setDomainMessage(data.error || "Verification pending.");
      }
    } catch (err: any) {
      setDomainMessage(err.message || "Domain verification check failed.");
    } finally {
      setIsConnectingDomain(false);
    }
  };

  const handleCopyTarget = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTarget(true);
    setTimeout(() => setCopiedTarget(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header */}
        <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-xs">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <span>Publish to Cloudflare Pages</span>
                <span className="text-[10px] font-semibold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full uppercase">
                  Edge Hosting
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Deploy fast, SSL-secured static pages directly to Cloudflare edge network
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Connection Status Banner */}
          {checkingConnection ? (
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center space-x-2 text-slate-600">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Checking Cloudflare account connection…</span>
            </div>
          ) : isConnected ? (
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <div>
                  <div className="font-bold text-emerald-950 flex items-center gap-1.5">
                    <span>Connected to Cloudflare</span>
                    <span className="text-[11px] font-normal text-emerald-700">({accountName})</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 font-mono">
                    Token: {maskedToken}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={checkCloudflareStatus}
                title="Refresh connection status"
                className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-3 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-bold text-amber-950">Cloudflare Account Not Connected</div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Connect your Cloudflare account to publish directly to Pages. Your API token is encrypted with AES-256 and never leaves your server.
                  </p>
                </div>
              </div>

              {/* Quick Connect Form */}
              <form onSubmit={handleQuickSaveCredentials} className="space-y-2.5 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Cloudflare API Token
                  </label>
                  <input
                    type="password"
                    value={quickApiToken}
                    onChange={(e) => setQuickApiToken(e.target.value)}
                    placeholder="Enter API token with Pages Edit permission"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Cloudflare Account ID
                  </label>
                  <input
                    type="text"
                    value={quickAccountId}
                    onChange={(e) => setQuickAccountId(e.target.value)}
                    placeholder="32-character Account ID from Cloudflare dashboard"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                </div>

                {quickSaveError && (
                  <div className="p-2 rounded-lg bg-red-100/80 border border-red-200 text-red-800 text-[11px]">
                    {quickSaveError}
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <a
                    href="https://dash.cloudflare.com/profile/api-tokens"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                  >
                    <span>Get API Token</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                  <button
                    type="submit"
                    disabled={isSavingCreds}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSavingCreds ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                    <span>{isSavingCreds ? "Connecting…" : "Connect Account"}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Publishing Configuration (When connected) */}
          {isConnected && !deploySuccess && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Cloudflare Pages Destination
                </label>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setDestinationMode("new")}
                    className={`p-2.5 rounded-xl border text-left transition ${
                      destinationMode === "new"
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <div className="text-xs">Create New Project</div>
                    <div className="text-[10px] text-slate-500 font-normal">Fresh Cloudflare Pages site</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setDestinationMode("existing")}
                    disabled={existingProjects.length === 0}
                    className={`p-2.5 rounded-xl border text-left transition disabled:opacity-50 ${
                      destinationMode === "existing"
                        ? "border-indigo-600 bg-indigo-50/50 text-indigo-900 font-bold shadow-xs"
                        : "border-slate-200 hover:bg-slate-50 text-slate-600"
                    }`}
                  >
                    <div className="text-xs">Deploy to Existing</div>
                    <div className="text-[10px] text-slate-500 font-normal">
                      {existingProjects.length > 0 ? `${existingProjects.length} projects found` : "No projects found"}
                    </div>
                  </button>
                </div>

                {destinationMode === "new" ? (
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
                      <span>Pages Project Name (subdomain)</span>
                      <span className="font-mono text-[10px] text-slate-400">.pages.dev</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={targetProjectName}
                        onChange={(e) => {
                          const sanitized = e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "-")
                            .replace(/-+/g, "-");
                          setTargetProjectName(sanitized);
                        }}
                        placeholder="e.g. lone-star-plumbing"
                        className="w-full pl-3 pr-28 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                      />
                      <span className="absolute right-3 top-2.5 text-[11px] text-slate-400 font-mono">
                        .pages.dev
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">
                      Live URL will be: <strong className="text-slate-700">https://{targetProjectName || "site"}.pages.dev</strong>
                    </p>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Select Cloudflare Pages Project
                    </label>
                    <select
                      value={targetProjectName}
                      onChange={(e) => setTargetProjectName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                    >
                      {existingProjects.map((p) => (
                        <option key={p.name} value={p.name}>
                          {p.name} ({p.subdomain})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Deployment Progress or Errors */}
              {isDeploying && (
                <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 space-y-2">
                  <div className="flex items-center space-x-2 font-bold text-xs">
                    <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                    <span>Deploying Website to Cloudflare Pages…</span>
                  </div>
                  <p className="text-[11px] text-indigo-700 font-medium">{deployStep}</p>
                </div>
              )}

              {deployError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-rose-600" />
                    <span>Deployment Issue</span>
                  </div>
                  <p className="text-[11px] text-rose-700">{deployError}</p>
                </div>
              )}

              {/* Deploy Trigger Button */}
              <button
                type="button"
                onClick={handlePublish}
                disabled={isDeploying || !targetProjectName.trim()}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md transition transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:transform-none flex items-center justify-center space-x-2"
              >
                {isDeploying ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Deploying to Cloudflare…</span>
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4" />
                    <span>Publish to Cloudflare Pages</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Deployment Success & Custom Domain View */}
          {deploySuccess && (
            <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
              {/* Success Card */}
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-emerald-950">Website Live on Cloudflare!</h3>
                    <p className="text-xs text-emerald-800">
                      Distributed across 330+ Cloudflare edge locations with global SSL
                    </p>
                  </div>
                </div>

                {/* Live URL Pill */}
                <div className="p-3 rounded-xl bg-white border border-emerald-300 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center space-x-2 truncate">
                    <Globe className="w-4 h-4 text-emerald-600 shrink-0" />
                    <a
                      href={liveUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-bold text-xs text-indigo-600 hover:underline truncate"
                    >
                      {liveUrl}
                    </a>
                  </div>
                  <a
                    href={liveUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition shadow-xs shrink-0"
                  >
                    <span>Visit Live Site</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Custom Domain Connection Section */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <Server className="w-4 h-4 text-indigo-600" />
                    <span>Connect Custom Domain (Optional)</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Map your own domain name (e.g. www.yourdomain.com) to this Cloudflare Pages deployment.
                  </p>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customDomainInput}
                    onChange={(e) => setCustomDomainInput(e.target.value)}
                    placeholder="e.g. mybusiness.com or www.mybusiness.com"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => handleConnectDomain()}
                    disabled={isConnectingDomain || !customDomainInput.trim()}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition disabled:opacity-50 flex items-center space-x-1.5 shrink-0"
                  >
                    {isConnectingDomain ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                    <span>{isConnectingDomain ? "Connecting…" : "Connect"}</span>
                  </button>
                </div>

                {domainMessage && (
                  <div
                    className={`p-2.5 rounded-xl border text-[11px] ${
                      domainStatus === "active"
                        ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                        : domainStatus === "pending"
                        ? "bg-amber-50 border-amber-200 text-amber-800"
                        : "bg-slate-50 border-slate-200 text-slate-700"
                    }`}
                  >
                    {domainMessage}
                  </div>
                )}

                {/* DNS Configuration Instructions */}
                {domainDnsRecords.length > 0 && (
                  <div className="space-y-2 pt-1 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-700">Required DNS Records</span>
                      <button
                        type="button"
                        onClick={handleVerifyDomain}
                        disabled={isConnectingDomain}
                        className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition"
                      >
                        <RefreshCw className={`w-3 h-3 ${isConnectingDomain ? "animate-spin" : ""}`} />
                        <span>Check Verification Status</span>
                      </button>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden text-[11px]">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                          <tr>
                            <th className="p-2 font-semibold">Type</th>
                            <th className="p-2 font-semibold">Host / Name</th>
                            <th className="p-2 font-semibold">Target / Value</th>
                            <th className="p-2 font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono text-[10px]">
                          {domainDnsRecords.map((rec, i) => (
                            <tr key={i} className="hover:bg-slate-50">
                              <td className="p-2 font-bold text-indigo-700">{rec.type}</td>
                              <td className="p-2 text-slate-800">{rec.name}</td>
                              <td className="p-2 text-slate-800 truncate max-w-[140px]">{rec.target}</td>
                              <td className="p-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopyTarget(rec.target)}
                                  className="text-slate-500 hover:text-slate-800 flex items-center gap-1"
                                >
                                  {copiedTarget ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedTarget ? "Copied" : "Copy"}</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      💡 <strong>Note:</strong> If your DNS is managed by Cloudflare, records are configured automatically. If using GoDaddy, Namecheap, or Google Domains, add the CNAME record above in your DNS manager. DNS propagation typically takes 2–15 minutes.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            {deploySuccess ? "Website successfully published to edge" : "RankLocal Direct Cloudflare Publishing"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition shadow-xs"
          >
            {deploySuccess ? "Done" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
