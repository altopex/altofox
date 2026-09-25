"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { TeamMember, SignupMode } from "@/lib/supabase/types";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Shield,
  MoreVertical,
  Mail,
  Clock,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Search,
  Check,
  Building2,
  UserCheck,
  UserX,
  Settings,
  HelpCircle,
} from "lucide-react";

export function TeamManagement() {
  const { user, profile, isOwner, session } = useAuth();

  const [members, setMembers] = useState<TeamMember[]>([]);
  const [pendingRequests, setPendingRequests] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "owner">("editor");
  const [submittingInvite, setSubmittingInvite] = useState(false);
  const [inviteFeedback, setInviteFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [updatingRoleId, setUpdatingRoleId] = useState<string | null>(null);
  const [processingPendingId, setProcessingPendingId] = useState<string | null>(null);

  // Sign-up mode settings (Owner only)
  const [signupMode, setSignupMode] = useState<SignupMode>("approval_required");
  const [contactEmail, setContactEmail] = useState("support@altopex.com");
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsFeedback, setSettingsFeedback] = useState<string | null>(null);

  // Plan editing modal state (Owner only)
  const [updatingPlanMember, setUpdatingPlanMember] = useState<TeamMember | null>(null);
  const [selectedNewPlan, setSelectedNewPlan] = useState<"starter" | "agency" | "unlimited">("starter");
  const [customLimit, setCustomLimit] = useState<number>(5);
  const [savingPlan, setSavingPlan] = useState(false);

  const handleSavePlan = async () => {
    if (!updatingPlanMember) return;
    try {
      setSavingPlan(true);
      const res = await fetch("/api/team/plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          userId: updatingPlanMember.id,
          plan: selectedNewPlan,
          websiteLimit: selectedNewPlan === "unlimited" ? 999999 : Number(customLimit) || 5,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMembers((prev) =>
          prev.map((m) =>
            m.id === updatingPlanMember.id
              ? { ...m, plan: selectedNewPlan, website_limit: data.websiteLimit }
              : m
          )
        );
        setUpdatingPlanMember(null);
      } else {
        alert(data.error || "Failed to update plan");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update plan");
    } finally {
      setSavingPlan(false);
    }
  };

  const fetchMembers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/team/members", {
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });
      const data = await res.json();
      if (Array.isArray(data.members)) {
        setMembers(data.approvedMembers || data.members.filter((m: TeamMember) => m.status === "approved"));
        setPendingRequests(data.pendingRequests || data.members.filter((m: TeamMember) => m.status === "pending"));
      }
    } catch (err) {
      console.error("Failed to load members:", err);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token]);

  const fetchSignupSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/team/signup-mode", {
        headers: {
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.signup_mode) setSignupMode(data.signup_mode);
        if (data.contact_email) setContactEmail(data.contact_email);
      }
    } catch {
      // Ignore
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchMembers();
    if (isOwner) {
      fetchSignupSettings();
    }
  }, [fetchMembers, fetchSignupSettings, isOwner]);

  const handleApproveRequest = async (userId: string, role: "editor" | "owner" = "editor") => {
    setProcessingPendingId(userId);
    try {
      const res = await fetch("/api/team/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ userId, role }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchMembers();
      } else {
        alert(data.error || "Failed to approve user.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to approve user.");
    } finally {
      setProcessingPendingId(null);
    }
  };

  const handleDeclineRequest = async (userId: string, deletePermanently: boolean = true) => {
    if (!confirm("Are you sure you want to decline this access request?")) return;
    setProcessingPendingId(userId);
    try {
      const res = await fetch("/api/team/decline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ userId, deletePermanently }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await fetchMembers();
      } else {
        alert(data.error || "Failed to decline user.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to decline user.");
    } finally {
      setProcessingPendingId(null);
    }
  };

  const handleSaveSignupSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setSettingsFeedback(null);
    try {
      const res = await fetch("/api/team/signup-mode", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ signupMode, contactEmail }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSettingsFeedback("Sign-up settings updated successfully!");
        setTimeout(() => setSettingsFeedback(null), 3000);
      } else {
        alert(data.error || "Failed to update settings.");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setSubmittingInvite(true);
    setInviteFeedback(null);

    try {
      const res = await fetch("/api/team/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          fullName: inviteName.trim(),
          role: inviteRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setInviteFeedback({ success: true, message: data.message });
        setInviteEmail("");
        setInviteName("");
        setTimeout(() => {
          setIsInviteOpen(false);
          setInviteFeedback(null);
          fetchMembers();
        }, 1200);
      } else {
        setInviteFeedback({ success: false, message: data.error || "Failed to send invitation." });
      }
    } catch (err: any) {
      setInviteFeedback({ success: false, message: err.message || "Network error." });
    } finally {
      setSubmittingInvite(false);
    }
  };

  const handleRoleChange = async (memberId: string, newRole: "owner" | "editor") => {
    setUpdatingRoleId(memberId);
    try {
      const res = await fetch("/api/team/role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ userId: memberId, role: newRole }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMembers((prev) =>
          prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
        );
      } else {
        alert(data.error || "Failed to update role");
      }
    } catch (err: any) {
      alert(err.message || "Failed to update role");
    } finally {
      setUpdatingRoleId(null);
    }
  };

  const handleRemoveMember = async (member: TeamMember) => {
    if (
      !confirm(
        `Are you sure you want to remove ${member.full_name || member.email} from the workspace? They will immediately lose access.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/team/remove", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ userId: member.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMembers((prev) => prev.filter((m) => m.id !== member.id));
      } else {
        alert(data.error || "Failed to remove member");
      }
    } catch (err: any) {
      alert(err.message || "Failed to remove member");
    }
  };

  const filteredMembers = members.filter(
    (m) =>
      m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.role?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Team Workspace Members
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Manage roles, user approval requests, and sign-up security modes.
              </p>
            </div>
          </div>
        </div>

        {isOwner && (
          <button
            type="button"
            onClick={() => {
              setIsInviteOpen(true);
              setInviteFeedback(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite Team Member</span>
          </button>
        )}
      </div>

      {/* 1. PENDING ACCESS REQUESTS SECTION (Top) */}
      {isOwner && pendingRequests.length > 0 && (
        <div className="bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
              <h2 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                Pending Access Requests ({pendingRequests.length})
              </h2>
            </div>
            <span className="text-[11px] font-medium text-amber-700 dark:text-amber-300">
              Users waiting for your approval to enter the workspace
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 rounded-xl p-4 flex flex-col justify-between shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-bold flex items-center justify-center text-sm">
                      {req.full_name?.charAt(0).toUpperCase() || req.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {req.full_name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {req.email}
                      </div>
                      {req.company_name && (
                        <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span>{req.company_name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(req.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={processingPendingId === req.id}
                    onClick={() => handleApproveRequest(req.id, "editor")}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
                  >
                    {processingPendingId === req.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    <span>Approve (Editor)</span>
                  </button>

                  <button
                    type="button"
                    disabled={processingPendingId === req.id}
                    onClick={() => handleApproveRequest(req.id, "owner")}
                    className="py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/60 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-semibold transition"
                    title="Approve with Owner privileges"
                  >
                    <span>As Owner</span>
                  </button>

                  <button
                    type="button"
                    disabled={processingPendingId === req.id}
                    onClick={() => handleDeclineRequest(req.id)}
                    className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 dark:bg-slate-800 dark:hover:bg-rose-950 text-xs font-semibold transition"
                    title="Decline request"
                  >
                    <UserX className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. SIGN-UP ACCESS MODE SETTINGS (Owner Only) */}
      {isOwner && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center space-x-2.5">
              <Shield className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                Workspace Registration &amp; Sign-Up Mode
              </h2>
            </div>
            {settingsFeedback && (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                {settingsFeedback}
              </span>
            )}
          </div>

          <form onSubmit={handleSaveSignupSettings} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Option 1: Approval Required */}
              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition text-left space-y-1 block ${
                  signupMode === "approval_required"
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-white"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Approval Required</span>
                  <input
                    type="radio"
                    name="signup_mode"
                    value="approval_required"
                    checked={signupMode === "approval_required"}
                    onChange={() => setSignupMode("approval_required")}
                    className="w-4 h-4 text-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Anyone can sign up. New accounts stay pending until you approve them.
                </p>
              </label>

              {/* Option 2: Invite Only */}
              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition text-left space-y-1 block ${
                  signupMode === "invite_only"
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-white"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Invite Only</span>
                  <input
                    type="radio"
                    name="signup_mode"
                    value="invite_only"
                    checked={signupMode === "invite_only"}
                    onChange={() => setSignupMode("invite_only")}
                    className="w-4 h-4 text-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Public sign-up is disabled. Visitors see contact email to request access.
                </p>
              </label>

              {/* Option 3: Open */}
              <label
                className={`p-3.5 rounded-xl border cursor-pointer transition text-left space-y-1 block ${
                  signupMode === "open"
                    ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-950 dark:text-white"
                    : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Open Access</span>
                  <input
                    type="radio"
                    name="signup_mode"
                    value="open"
                    checked={signupMode === "open"}
                    onChange={() => setSignupMode("open")}
                    className="w-4 h-4 text-indigo-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  New users are approved automatically upon email verification.
                </p>
              </label>
            </div>

            {/* Contact Email field */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <div className="space-y-0.5">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Inquiry / Contact Email
                </label>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Displayed on the invite-only sign-up screen for access requests.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white w-64"
                />
                <button
                  type="submit"
                  disabled={savingSettings}
                  className="px-4 py-1.5 rounded-xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 text-white text-xs font-semibold transition disabled:opacity-50"
                >
                  {savingSettings ? "Saving…" : "Save Mode"}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* 3. APPROVED MEMBERS TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Search Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search active team members…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            {filteredMembers.length} active {filteredMembers.length === 1 ? "member" : "members"}
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
            <span>Loading team members…</span>
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-xs">
            No active team members matched your search.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-400 font-semibold">
                  <th className="py-3 px-5">Member</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Plan &amp; Quota</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Last Active</th>
                  {isOwner && <th className="py-3 px-5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredMembers.map((m) => {
                  const isCurrent = m.id === user?.id;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition">
                      <td className="py-3.5 px-5">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-xs">
                            {m.full_name?.charAt(0).toUpperCase() || m.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{m.full_name}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.2 rounded-sm">
                                  You
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400">
                              {m.email}
                            </div>
                            {m.company_name && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {m.company_name}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700">
                          {m.role === "owner" ? (
                            <>
                              <ShieldCheck className="w-3 h-3 text-indigo-600" />
                              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                                Owner
                              </span>
                            </>
                          ) : (
                            <>
                              <Shield className="w-3 h-3 text-slate-500" />
                              <span className="text-slate-700 dark:text-slate-300">
                                Editor
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase ${
                              m.role === "owner" || m.plan === "unlimited"
                                ? "bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800"
                                : m.plan === "agency"
                                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                                : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {m.role === "owner" ? "Unlimited" : m.plan === "agency" ? "Agency" : m.plan === "unlimited" ? "Unlimited" : "Starter"}
                          </span>
                          <span className="text-[11px] text-slate-500 font-mono">
                            {m.role === "owner" || m.plan === "unlimited" ? "∞ sites" : `${m.website_limit ?? 5} sites`}
                          </span>
                          {isOwner && (
                            <button
                              type="button"
                              onClick={() => {
                                setUpdatingPlanMember(m);
                                const currentPlan = (m.plan as any) || "starter";
                                setSelectedNewPlan(currentPlan);
                                setCustomLimit(
                                  m.website_limit ?? (currentPlan === "agency" ? 30 : currentPlan === "unlimited" ? 999999 : 5)
                                );
                              }}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 font-semibold underline underline-offset-2 ml-1"
                            >
                              Edit
                            </button>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>Approved</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {new Date(m.last_active_at).toLocaleDateString()}
                      </td>

                      {isOwner && (
                        <td className="py-3.5 px-5 text-right">
                          {!isCurrent && (
                            <div className="flex items-center justify-end gap-2">
                              {m.role === "editor" ? (
                                <button
                                  type="button"
                                  disabled={updatingRoleId === m.id}
                                  onClick={() => handleRoleChange(m.id, "owner")}
                                  className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition"
                                >
                                  Make Owner
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled={updatingRoleId === m.id}
                                  onClick={() => handleRoleChange(m.id, "editor")}
                                  className="text-xs text-slate-600 hover:text-slate-800 font-semibold transition"
                                >
                                  Demote to Editor
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveMember(m)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                                title="Remove member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Invite Team Member
                </h3>
                <p className="text-xs text-slate-500">
                  Pre-approve an account by sending an email invite.
                </p>
              </div>
            </div>

            {inviteFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  inviteFeedback.success
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : "bg-rose-50 text-rose-700 border border-rose-200"
                }`}
              >
                {inviteFeedback.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                <span>{inviteFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleSendInvite} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Full name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Alex Rivera"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  placeholder="alex@example.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Assigned Role
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInviteRole("editor")}
                    className={`p-2 text-xs rounded-xl border font-semibold ${
                      inviteRole === "editor"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    Editor
                  </button>
                  <button
                    type="button"
                    onClick={() => setInviteRole("owner")}
                    className={`p-2 text-xs rounded-xl border font-semibold ${
                      inviteRole === "owner"
                        ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300"
                        : "border-slate-200 dark:border-slate-700"
                    }`}
                  >
                    Owner
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingInvite}
                className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
              >
                {submittingInvite && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Send Workspace Invitation</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Change Plan / Quota Modal */}
      {updatingPlanMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl relative space-y-4">
            <button
              type="button"
              onClick={() => setUpdatingPlanMember(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Change Plan &amp; Quota
                </h3>
                <p className="text-xs text-slate-500">
                  {updatingPlanMember.full_name || updatingPlanMember.email}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNewPlan("starter");
                    setCustomLimit(5);
                  }}
                  className={`p-3 rounded-xl border text-center transition ${
                    selectedNewPlan === "starter"
                      ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/60 text-indigo-900 dark:text-white font-bold ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="text-xs font-bold">Starter</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">5 sites</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNewPlan("agency");
                    setCustomLimit(30);
                  }}
                  className={`p-3 rounded-xl border text-center transition ${
                    selectedNewPlan === "agency"
                      ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/60 text-indigo-900 dark:text-white font-bold ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="text-xs font-bold">Agency</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">30 sites</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNewPlan("unlimited");
                    setCustomLimit(999999);
                  }}
                  className={`p-3 rounded-xl border text-center transition ${
                    selectedNewPlan === "unlimited"
                      ? "border-indigo-600 bg-indigo-50/60 dark:bg-indigo-950/60 text-indigo-900 dark:text-white font-bold ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                  }`}
                >
                  <div className="text-xs font-bold">Unlimited</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">∞ sites</div>
                </button>
              </div>

              {selectedNewPlan !== "unlimited" && (
                <div className="space-y-1 pt-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Custom Website Quota Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={10000}
                    value={customLimit}
                    onChange={(e) => setCustomLimit(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <p className="text-[10px] text-slate-400">
                    Maximum number of active websites this account can generate and save.
                  </p>
                </div>
              )}

              <div className="flex items-center gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setUpdatingPlanMember(null)}
                  className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingPlan}
                  onClick={handleSavePlan}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {savingPlan && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Plan</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
