"use client";

import React, { useState } from "react";
import { SavedProject, RankRentConfig, CapturedLead } from "@/lib/storage/project-types";
import {
  createDefaultRankRentConfig,
  applyTenantBranding,
  testLeadWebhook,
  recordCapturedLead,
} from "@/lib/rankrent/rankrent-service";
import { saveProjectToDB } from "@/lib/storage/db";
import {
  Key,
  DollarSign,
  Phone,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Send,
  Sparkles,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
} from "lucide-react";

interface RankRentManagerProps {
  project: SavedProject;
  onProjectUpdated: (updatedProject: SavedProject) => void;
  onShowToast?: (msg: string, type?: "success" | "error" | "info") => void;
}

export function RankRentManager({
  project,
  onProjectUpdated,
  onShowToast,
}: RankRentManagerProps) {
  const [config, setConfig] = useState<RankRentConfig>(() => {
    return project.rankRentConfig || createDefaultRankRentConfig(project);
  });

  const [isApplying, setIsApplying] = useState(false);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<{
    success?: boolean;
    error?: string;
  } | null>(null);

  const monthlyRent = config.monthlyRent || 0;
  const annualValue = monthlyRent * 12;
  const leads = project.leads || [];

  const handleConfigChange = <K extends keyof RankRentConfig>(
    key: K,
    val: RankRentConfig[K]
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  // 1-Click Apply Tenant Rebrand & Phone Swapper
  const handleApplyChanges = async () => {
    setIsApplying(true);
    try {
      const { updatedProject, affectedPagesCount } = applyTenantBranding(
        project,
        config
      );

      await saveProjectToDB(updatedProject);
      onProjectUpdated(updatedProject);

      if (onShowToast) {
        onShowToast(
          `Rank & Rent updated! Tracking number & branding applied across ${affectedPagesCount} pages.`,
          "success"
        );
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast("Failed to apply changes: " + err.message, "error");
      }
    } finally {
      setIsApplying(false);
    }
  };

  // Test Webhook
  const handleTestWebhook = async () => {
    if (!config.leadWebhookUrl) {
      if (onShowToast) {
        onShowToast("Please enter a webhook URL first.", "error");
      }
      return;
    }

    setIsTestingWebhook(true);
    setWebhookTestResult(null);

    const res = await testLeadWebhook(config.leadWebhookUrl, {
      siteName: project.name,
      trade: project.formData?.businessType || "Contractor",
      city: project.formData?.city || project.businessDetails?.city || "Local",
      tenantName: config.clientName,
    });

    setIsTestingWebhook(false);
    setWebhookTestResult(res);

    if (res.success) {
      if (onShowToast) {
        onShowToast("Webhook test successful! Sample lead sent.", "success");
      }
    } else {
      if (onShowToast) {
        onShowToast(`Webhook failed: ${res.error || "Unknown error"}`, "error");
      }
    }
  };

  // Add Sample Lead for Verification
  const handleAddSampleLead = async () => {
    const sampleLead = {
      name: "Alex Johnson",
      phone: "(503) 555-0144",
      email: "alex.j@example.com",
      service: "Emergency Service Request",
      message: "Need immediate inspection for pipe leak in basement.",
      sourcePage: "/services/drain-cleaning.html",
      deliveredTo: config.leadWebhookUrl ? "Webhook + Email" : "Email",
      status: "delivered" as const,
    };

    const updated = recordCapturedLead(project, sampleLead);
    await saveProjectToDB(updated);
    onProjectUpdated(updated);

    if (onShowToast) {
      onShowToast("Sample lead captured and recorded!", "success");
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Key className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Rank &amp; Rent Command Center
            </h2>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                config.status === "rented"
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : config.status === "available"
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : config.status === "prospecting"
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-slate-100 text-slate-600 border-slate-200"
              }`}
            >
              {config.status === "rented"
                ? "🟢 Active Tenant"
                : config.status === "available"
                ? "🔵 Available to Rent"
                : config.status === "prospecting"
                ? "🟡 Prospecting / Trial"
                : "⚪ Paused"}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            Manage your digital real estate, tenant leases, call tracking numbers, and automated lead forwarding.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <select
            value={config.status}
            onChange={(e) => handleConfigChange("status", e.target.value as any)}
            className="text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 shadow-2xs focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="available">Status: Available for Lease</option>
            <option value="rented">Status: Rented (Active Tenant)</option>
            <option value="prospecting">Status: Prospecting / Trial</option>
            <option value="paused">Status: Paused</option>
          </select>

          <button
            type="button"
            onClick={handleApplyChanges}
            disabled={isApplying}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-sm disabled:opacity-50 cursor-pointer"
          >
            {isApplying ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Applying...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Apply Rebrand to Site</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Financial & Lease KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Monthly Rent
          </span>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="text-2xl font-black text-slate-900">
              ${monthlyRent.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-semibold">/ month</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Recurring lease revenue
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Annual Asset Value
          </span>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="text-2xl font-black text-indigo-600">
              ${annualValue.toLocaleString()}
            </span>
            <span className="text-xs text-slate-500 font-semibold">/ yr</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Based on active lease rate
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Lease Status
          </span>
          <div className="mt-1 flex items-center space-x-1.5">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span className="text-sm font-bold text-slate-800">
              {config.leaseRenewalDate ? `Renews ${config.leaseRenewalDate}` : "Month-to-month"}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {config.leaseStartDate ? `Started ${config.leaseStartDate}` : "No active term"}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Total Leads Captured
          </span>
          <div className="mt-1 flex items-baseline space-x-1">
            <span className="text-2xl font-black text-emerald-600">
              {leads.length}
            </span>
            <span className="text-xs text-slate-500 font-semibold">inquiries</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Direct &amp; forwarded leads
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Information & Call Tracking */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Building className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Tenant &amp; Call Tracking Configuration
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tenant / Client Business Name
              </label>
              <input
                type="text"
                value={config.clientName || ""}
                onChange={(e) => handleConfigChange("clientName", e.target.value)}
                placeholder="e.g. Apex Master Plumbing LLC"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tenant Contact Name
                </label>
                <input
                  type="text"
                  value={config.clientContact || ""}
                  onChange={(e) => handleConfigChange("clientContact", e.target.value)}
                  placeholder="e.g. Dave Miller"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tenant Email Address
                </label>
                <input
                  type="email"
                  value={config.clientEmail || ""}
                  onChange={(e) => handleConfigChange("clientEmail", e.target.value)}
                  placeholder="dave@clientcompany.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Virtual Tracking Phone Number (Displayed on Site)
              </label>
              <div className="relative">
                <Phone className="w-3.5 h-3.5 text-indigo-600 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={config.trackingPhone || ""}
                  onChange={(e) => handleConfigChange("trackingPhone", e.target.value)}
                  placeholder="(555) 019-2834 (CallRail, Twilio, Grasshopper)"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Clicking &quot;Apply Rebrand to Site&quot; replaces all phone numbers &amp; tel: links across every page with this number.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Monthly Rent ($ USD)
                </label>
                <div className="relative">
                  <DollarSign className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    value={config.monthlyRent || ""}
                    onChange={(e) => handleConfigChange("monthlyRent", Number(e.target.value))}
                    placeholder="750"
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Lease Renewal Date
                </label>
                <input
                  type="date"
                  value={config.leaseRenewalDate || ""}
                  onChange={(e) => handleConfigChange("leaseRenewalDate", e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Lead Automation & Webhook Delivery */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <Send className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Lead Forwarding &amp; Webhook Delivery
            </h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lead Notification Email (Instant Alert)
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={config.leadForwardEmail || ""}
                  onChange={(e) => handleConfigChange("leadForwardEmail", e.target.value)}
                  placeholder="leads@clientcompany.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                When a visitor requests a quote, notification is dispatched here.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Lead Webhook URL (Zapier, Make.com, GoHighLevel)
              </label>
              <input
                type="url"
                value={config.leadWebhookUrl || ""}
                onChange={(e) => handleConfigChange("leadWebhookUrl", e.target.value)}
                placeholder="https://services.leadconnectorhq.com/hooks/... or Zapier webhook"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
              />
              <div className="flex items-center justify-between mt-2">
                <button
                  type="button"
                  onClick={handleTestWebhook}
                  disabled={isTestingWebhook || !config.leadWebhookUrl}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition disabled:opacity-40 cursor-pointer"
                >
                  <Send className="w-3 h-3 text-indigo-600" />
                  <span>{isTestingWebhook ? "Sending Test..." : "Send Test Lead to Webhook"}</span>
                </button>

                {webhookTestResult && (
                  <span
                    className={`inline-flex items-center space-x-1 font-bold ${
                      webhookTestResult.success ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {webhookTestResult.success ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Webhook Active!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Failed: {webhookTestResult.error}</span>
                      </>
                    )}
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <label className="block font-semibold text-slate-700 mb-1">
                Lease Management Notes
              </label>
              <textarea
                rows={2}
                value={config.notes || ""}
                onChange={(e) => handleConfigChange("notes", e.target.value)}
                placeholder="Internal lease agreement notes, payment terms, or client requests..."
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* "Rent This Site" Prospect Banner (for available sites) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-900">
              &quot;Rent This Site&quot; Prospect Banner (for Available Sites)
            </h3>
          </div>

          <label className="inline-flex items-center cursor-pointer space-x-2">
            <span className="text-xs font-semibold text-slate-600">Banner Active</span>
            <input
              type="checkbox"
              checked={Boolean(config.showProspectBanner)}
              onChange={(e) => handleConfigChange("showProspectBanner", e.target.checked)}
              className="w-4 h-4 text-indigo-600 rounded-sm border-slate-300 focus:ring-indigo-500 cursor-pointer"
            />
          </label>
        </div>

        <div className="space-y-3 text-xs">
          <p className="text-slate-500">
            When your website ranks on Page 1 and is available for lease, show a discreet, high-converting banner inviting local contractors to rent the site from you.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Banner Pitch Text
              </label>
              <input
                type="text"
                value={config.prospectBannerText || ""}
                onChange={(e) => handleConfigChange("prospectBannerText", e.target.value)}
                placeholder="Attention local contractors: This top-ranking website is available for exclusive lease!"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Leasing Phone Number
              </label>
              <input
                type="text"
                value={config.prospectContactPhone || ""}
                onChange={(e) => handleConfigChange("prospectContactPhone", e.target.value)}
                placeholder="(555) 000-0000"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          {/* Banner Live Preview */}
          {config.showProspectBanner && (
            <div className="mt-3 p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                <span className="bg-indigo-600 text-[10px] font-black uppercase px-2 py-0.5 rounded-sm">
                  Preview
                </span>
                <span>{config.prospectBannerText || "This top-ranking website is available for exclusive lease."}</span>
              </div>
              <span className="font-bold underline text-indigo-300">
                Inquire: {config.prospectContactPhone || "(555) 000-0000"} &rarr;
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Captured Leads Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Captured Leads &amp; Delivery Log ({leads.length})
            </h3>
          </div>

          <button
            type="button"
            onClick={handleAddSampleLead}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition cursor-pointer"
          >
            + Simulate Test Lead
          </button>
        </div>

        {leads.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            No leads captured yet. Leads submitted through the contact form or quote forms will automatically show here and forward to your tenant&apos;s webhook.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead>
                <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] tracking-wider font-bold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3">Phone</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Message</th>
                  <th className="py-2.5 px-3">Forwarded</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {leads.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                      {l.dateStr}
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900 whitespace-nowrap">
                      {l.name}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-indigo-600 whitespace-nowrap">
                      <a href={`tel:${l.phone}`}>{l.phone}</a>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {l.service || "General"}
                    </td>
                    <td className="py-2.5 px-3 text-slate-500 max-w-xs truncate" title={l.message}>
                      {l.message || "—"}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center space-x-1 text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Delivered</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
