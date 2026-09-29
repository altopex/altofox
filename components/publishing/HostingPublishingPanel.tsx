"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Globe,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  RefreshCw,
  Copy,
  Check,
  Server,
  Layers,
  Sparkles,
  ShieldCheck,
  Clock,
  Terminal,
} from "lucide-react";
import { HostingProviderType, DnsRecordGuidance } from "@/lib/publishing/types";

export interface HostingPublishingPanelProps {
  projectName: string;
  projectId?: string;
  files?: Array<{ path: string; content: string }>;
  photos?: any[];
  websiteDomain?: string;
  onOpenSettings?: () => void;
  onPublished?: (result: { provider: string; liveUrl: string }) => void;
}

interface ProviderInfo {
  id: HostingProviderType;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  iconBg: string;
}

const PROVIDERS: ProviderInfo[] = [
  {
    id: "cloudflare",
    name: "Cloudflare Pages",
    badge: "Edge",
    badgeColor: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
    description: "Fast global CDN with free SSL and edge asset caching",
    iconBg: "bg-orange-500",
  },
  {
    id: "vercel",
    name: "Vercel",
    badge: "Speed",
    badgeColor: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
    description: "Zero-config edge network with instant atomic deployments",
    iconBg: "bg-black text-white",
  },
  {
    id: "netlify",
    name: "Netlify",
    badge: "Atomic",
    badgeColor: "bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300",
    description: "Instant ZIP deploys with atomic rollbacks & global CDN",
    iconBg: "bg-teal-600",
  },
  {
    id: "github",
    name: "GitHub Pages",
    badge: "Git",
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300",
    description: "Version-controlled static repository hosting on github.io",
    iconBg: "bg-purple-600",
  },
];

export function HostingPublishingPanel({
  projectName,
  projectId,
  files = [],
  photos = [],
  websiteDomain,
  onOpenSettings,
  onPublished,
}: HostingPublishingPanelProps) {
  const [selectedProvider, setSelectedProvider] = useState<HostingProviderType>("cloudflare");

  // Multi-provider status state
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [providerStatuses, setProviderStatuses] = useState<Record<string, { connected: boolean; maskedToken?: string; accountName?: string }>>({});

  // Inline connect form state
  const [inlineToken, setInlineToken] = useState("");
  const [inlineAccountId, setInlineAccountId] = useState("");
  const [inlineOwner, setInlineOwner] = useState("");
  const [inlineTeamId, setInlineTeamId] = useState("");
  const [isSavingCreds, setIsSavingCreds] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

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
  const [existingDestinations, setExistingDestinations] = useState<Array<{ id: string; name: string; url?: string }>>([]);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  // Deployment state
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStep, setDeployStep] = useState<string>("");
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [liveUrl, setLiveUrl] = useState<string>("");
  const [deploymentDuration, setDeploymentDuration] = useState<number | null>(null);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);

  // Custom Domain state
  const [customDomainInput, setCustomDomainInput] = useState<string>(websiteDomain || "");
  const [isConnectingDomain, setIsConnectingDomain] = useState(false);
  const [domainStatus, setDomainStatus] = useState<"none" | "pending" | "active" | "action_required">("none");
  const [domainDnsRecords, setDomainDnsRecords] = useState<DnsRecordGuidance[]>([]);
  const [domainMessage, setDomainMessage] = useState<string | null>(null);
  const [copiedTarget, setCopiedTarget] = useState(false);

  // Load status for all providers
  const loadProviderStatuses = useCallback(async () => {
    setCheckingStatus(true);
    try {
      const res = await fetch("/api/hosting/status");
      const data = await res.json();
      if (data.success && data.providers) {
        setProviderStatuses(data.providers);
      }
    } catch {
      // Fallback
    } finally {
      setCheckingStatus(false);
    }
  }, []);

  useEffect(() => {
    loadProviderStatuses();
  }, [loadProviderStatuses]);

  // Load existing destinations when provider changes
  const loadDestinations = useCallback(async (provider: HostingProviderType) => {
    setLoadingDestinations(true);
    try {
      const res = await fetch("/api/hosting/destinations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider }),
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.destinations)) {
        setExistingDestinations(data.destinations);
      } else {
        setExistingDestinations([]);
      }
    } catch {
      setExistingDestinations([]);
    } finally {
      setLoadingDestinations(false);
    }
  }, []);

  useEffect(() => {
    const status = providerStatuses[selectedProvider];
    if (status?.connected) {
      loadDestinations(selectedProvider);
    } else {
      setExistingDestinations([]);
    }
  }, [selectedProvider, providerStatuses, loadDestinations]);

  // Reset inputs when target project name or website domain changes
  useEffect(() => {
    const clean = (projectName || "my-website")
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50);
    setTargetProjectName(clean || "ranklocal-site");

    if (websiteDomain) {
      setCustomDomainInput(websiteDomain.replace(/^https?:\/\//, "").replace(/\/+$/, ""));
    }
  }, [projectName, websiteDomain]);

  // Handle Save Credentials
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineToken.trim()) {
      setConnectError("Please enter an API Token.");
      return;
    }

    if (selectedProvider === "cloudflare" && !inlineAccountId.trim()) {
      setConnectError("Cloudflare Account ID is required.");
      return;
    }

    setIsSavingCreds(true);
    setConnectError(null);

    try {
      const res = await fetch("/api/hosting/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          apiToken: inlineToken.trim(),
          accountId: inlineAccountId.trim() || undefined,
          teamId: inlineTeamId.trim() || undefined,
          owner: inlineOwner.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInlineToken("");
        setInlineAccountId("");
        setInlineOwner("");
        setInlineTeamId("");
        await loadProviderStatuses();
        loadDestinations(selectedProvider);
      } else {
        setConnectError(data.error || "Failed to verify credentials.");
      }
    } catch (err: any) {
      setConnectError(err?.message || "Network error verifying credentials.");
    } finally {
      setIsSavingCreds(false);
    }
  };

  // Handle Publish
  const handlePublish = async () => {
    if (!targetProjectName.trim()) {
      setDeployError("Please enter a destination project name.");
      return;
    }

    setIsDeploying(true);
    setDeployError(null);
    setDeploySuccess(false);
    setDeployStep(`Preparing canonical files for ${selectedProvider}…`);

    try {
      await new Promise((r) => setTimeout(r, 200));
      setDeployStep(`Uploading & deploying to ${selectedProvider} edge engine…`);

      const payload = {
        provider: selectedProvider,
        projectName: targetProjectName.trim(),
        projectId: projectId || undefined,
        files: files.length > 0 ? files : undefined,
        domain: websiteDomain || customDomainInput || undefined,
      };

      const res = await fetch("/api/hosting/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Deployment to ${selectedProvider} failed.`);
      }

      setDeployStep("Deployment verified live!");
      setDeploySuccess(true);
      setLiveUrl(data.publishedUrl || "");
      if (data.deploymentDurationMs) {
        setDeploymentDuration(data.deploymentDurationMs);
      }
      if (Array.isArray(data.logs)) {
        setDeploymentLogs(data.logs);
      }

      if (onPublished && data.publishedUrl) {
        onPublished({ provider: selectedProvider, liveUrl: data.publishedUrl });
      }

      // Auto-connect custom domain if provided
      if (customDomainInput.trim()) {
        handleConnectDomain(targetProjectName.trim(), customDomainInput.trim());
      }
    } catch (err: any) {
      console.error("[Hosting Publish Error]:", err);
      setDeployError(err?.message || "Deployment failed. Please check credentials and try again.");
    } finally {
      setIsDeploying(false);
    }
  };

  // Handle Connect Domain
  const handleConnectDomain = async (overrideProject?: string, overrideDomain?: string) => {
    const proj = overrideProject || targetProjectName;
    const dom = overrideDomain || customDomainInput;

    if (!dom.trim()) {
      setDomainMessage("Please enter a domain name (e.g. mybusiness.com).");
      return;
    }

    setIsConnectingDomain(true);
    setDomainMessage(null);

    try {
      const res = await fetch("/api/hosting/domain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: selectedProvider,
          projectName: proj,
          customDomain: dom.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || data.message || "Failed to configure domain.");
      }

      setDomainStatus(data.status || "pending");
      setDomainDnsRecords(data.dnsRecords || []);
      setDomainMessage(data.message || "Domain configured on hosting provider.");
    } catch (err: any) {
      setDomainMessage(err?.message || "Could not connect custom domain.");
    } finally {
      setIsConnectingDomain(false);
    }
  };

  const handleCopyTarget = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTarget(true);
    setTimeout(() => setCopiedTarget(false), 2000);
  };

  const currentStatus = providerStatuses[selectedProvider] || { connected: false };

  return (
    <div className="space-y-6 text-xs text-slate-800 dark:text-slate-200">
      {/* 1. PROVIDER SELECTOR TABS */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider block">
          Choose Hosting Destination
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PROVIDERS.map((p) => {
            const isSelected = selectedProvider === p.id;
            const status = providerStatuses[p.id];
            const isConn = status?.connected;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedProvider(p.id);
                  setDeploySuccess(false);
                  setDeployError(null);
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all relative cursor-pointer ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/70 dark:bg-indigo-950/40 shadow-sm ring-2 ring-indigo-500/20"
                    : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.badgeColor}`}>
                    {p.badge}
                  </span>
                  {isConn ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Connected" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" title="Not connected" />
                  )}
                </div>
                <div className="font-bold text-xs text-slate-900 dark:text-white">{p.name}</div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                  {p.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CONNECTION STATUS / CREDENTIALS FORM */}
      {checkingStatus ? (
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-2 text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Checking {selectedProvider} connection…</span>
        </div>
      ) : currentStatus.connected ? (
        <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div>
              <div className="font-bold text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                <span>Connected to {PROVIDERS.find((p) => p.id === selectedProvider)?.name}</span>
                <span className="text-[11px] font-normal text-emerald-700 dark:text-emerald-400">
                  ({currentStatus.accountName || "Verified Account"})
                </span>
              </div>
              <div className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                Token: {currentStatus.maskedToken}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={loadProviderStatuses}
            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition cursor-pointer"
            title="Refresh status"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <div className="font-bold text-amber-950 dark:text-amber-200">
                {PROVIDERS.find((p) => p.id === selectedProvider)?.name} Not Connected
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                Connect your account below. Tokens are encrypted with AES-256 and stored securely in SQLite.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveCredentials} className="space-y-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                API Token / Access Token <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={inlineToken}
                onChange={(e) => setInlineToken(e.target.value)}
                placeholder={
                  selectedProvider === "cloudflare"
                    ? "Cloudflare API Token with Pages Edit permissions"
                    : selectedProvider === "vercel"
                    ? "Vercel Personal Access Token"
                    : selectedProvider === "netlify"
                    ? "Netlify Personal Access Token"
                    : "GitHub Personal Access Token with repo scope"
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
              />
            </div>

            {selectedProvider === "cloudflare" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cloudflare Account ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={inlineAccountId}
                  onChange={(e) => setInlineAccountId(e.target.value)}
                  placeholder="32-character hexadecimal Account ID from Cloudflare dashboard"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            )}

            {selectedProvider === "github" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  GitHub Username / Organization (optional)
                </label>
                <input
                  type="text"
                  value={inlineOwner}
                  onChange={(e) => setInlineOwner(e.target.value)}
                  placeholder="e.g. octocat (leave empty to autodetect from token)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            )}

            {selectedProvider === "vercel" && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vercel Team ID (optional)
                </label>
                <input
                  type="text"
                  value={inlineTeamId}
                  onChange={(e) => setInlineTeamId(e.target.value)}
                  placeholder="team_... (leave empty for personal account)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>
            )}

            {connectError && (
              <div className="p-2.5 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs font-medium">
                {connectError}
              </div>
            )}

            <button
              type="submit"
              disabled={isSavingCreds}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow-xs disabled:opacity-50 cursor-pointer"
            >
              {isSavingCreds ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
              <span>Verify &amp; Save Credentials</span>
            </button>
          </form>
        </div>
      )}

      {/* 3. DESTINATION CONFIGURATION */}
      <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-900 dark:text-white">
            Destination Project / Repository
          </label>
          {existingDestinations.length > 0 && (
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => setDestinationMode("new")}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  destinationMode === "new" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-500"
                }`}
              >
                Create New
              </button>
              <button
                type="button"
                onClick={() => setDestinationMode("existing")}
                className={`px-2.5 py-1 rounded-md font-semibold transition ${
                  destinationMode === "existing" ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs" : "text-slate-500"
                }`}
              >
                Select Existing ({existingDestinations.length})
              </button>
            </div>
          )}
        </div>

        {destinationMode === "new" ? (
          <div>
            <input
              type="text"
              value={targetProjectName}
              onChange={(e) => setTargetProjectName(e.target.value)}
              placeholder="e.g. dallas-emergency-plumbing"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs focus:bg-white focus:outline-indigo-500 transition"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Lowercase letters, numbers, and hyphens. Will form your deployment subdomain.
            </p>
          </div>
        ) : (
          <div>
            <select
              value={targetProjectName}
              onChange={(e) => setTargetProjectName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold"
            >
              {existingDestinations.map((d) => (
                <option key={d.id} value={d.name}>
                  {d.name} {d.url ? `(${d.url})` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4. ONE-CLICK PUBLISH ACTION */}
      <div className="space-y-3">
        {deployError && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-bold">Publish Failed:</span> {deployError}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={handlePublish}
          disabled={isDeploying || !currentStatus.connected}
          className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white font-extrabold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isDeploying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{deployStep}</span>
            </>
          ) : (
            <>
              <UploadCloud className="w-4 h-4" />
              <span>Publish Directly to {PROVIDERS.find((p) => p.id === selectedProvider)?.name}</span>
            </>
          )}
        </button>
      </div>

      {/* 5. DEPLOYMENT SUCCESS & LIVE URL CARD */}
      {deploySuccess && liveUrl && (
        <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-100 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Website is Live!</span>
            </div>
            {deploymentDuration && (
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span>Deployed in {(deploymentDuration / 1000).toFixed(1)}s</span>
              </span>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-3 flex items-center justify-between gap-3">
            <div className="font-mono font-bold text-xs text-indigo-700 dark:text-indigo-400 truncate">
              {liveUrl}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleCopyTarget(liveUrl)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs flex items-center gap-1 hover:bg-slate-100 transition cursor-pointer"
              >
                {copiedTarget ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedTarget ? "Copied" : "Copy"}</span>
              </button>
              <a
                href={liveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition"
              >
                <span>Open Live Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {deploymentLogs.length > 0 && (
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                <Terminal className="w-3 h-3" />
                <span>Deployment Steps</span>
              </span>
              <div className="bg-slate-950 text-slate-300 p-2.5 rounded-xl font-mono text-[10px] space-y-0.5 max-h-28 overflow-y-auto">
                {deploymentLogs.map((log, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span>
                    <span>{log}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. CUSTOM DOMAIN CONNECTION */}
      <div className="space-y-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-indigo-600" />
              <span>Connect Custom Domain</span>
            </h4>
            <p className="text-[11px] text-slate-500">
              Point your branded domain (e.g. plumberdallas.com) to your published website.
            </p>
          </div>
          {domainStatus !== "none" && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                domainStatus === "active"
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
              }`}
            >
              {domainStatus.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={customDomainInput}
            onChange={(e) => setCustomDomainInput(e.target.value)}
            placeholder="e.g. www.lonestarplumbingdfw.com"
            className="flex-1 px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs focus:bg-white focus:outline-indigo-500 transition"
          />
          <button
            type="button"
            onClick={() => handleConnectDomain()}
            disabled={isConnectingDomain || !customDomainInput.trim()}
            className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 hover:bg-slate-800 text-white dark:text-slate-900 font-bold text-xs transition disabled:opacity-50 cursor-pointer"
          >
            {isConnectingDomain ? "Connecting…" : "Connect"}
          </button>
        </div>

        {domainMessage && (
          <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs">
            {domainMessage}
          </div>
        )}

        {/* DNS Guidance Table */}
        {domainDnsRecords.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
              Add these DNS records to your domain registrar (GoDaddy, Namecheap, Cloudflare, etc.):
            </span>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-bold text-[10px] uppercase">
                  <tr>
                    <th className="p-2.5">Type</th>
                    <th className="p-2.5">Host / Name</th>
                    <th className="p-2.5">Target / Value</th>
                    <th className="p-2.5">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                  {domainDnsRecords.map((rec, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <td className="p-2.5 font-bold text-indigo-600">{rec.type}</td>
                      <td className="p-2.5">{rec.name}</td>
                      <td className="p-2.5 truncate max-w-[200px]">{rec.content}</td>
                      <td className="p-2.5">
                        <button
                          type="button"
                          onClick={() => handleCopyTarget(rec.content || rec.target || "")}
                          className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 text-[10px] hover:bg-slate-100 transition cursor-pointer font-sans"
                        >
                          Copy Target
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
