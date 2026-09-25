"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth/AuthContext";
import { useProjectPresence } from "@/lib/supabase/presence";
import { GlobalSearchModal } from "./GlobalSearchModal";
import { ProfileModal } from "../team/ProfileModal";
import {
  LayoutDashboard,
  FolderGit2,
  Activity,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Moon,
  Sun,
  LogOut,
  Sparkles,
  User,
  Shield,
  Menu,
  X,
  Bell,
} from "lucide-react";

export type NavTab = "dashboard" | "projects" | "activity" | "team" | "settings";

interface AppShellProps {
  currentTab: NavTab;
  onNavigate: (tab: NavTab) => void;
  children: React.ReactNode;
  activeProjectId?: string;
  onSelectProject?: (projectId: string) => void;
}

export function AppShell({
  currentTab,
  onNavigate,
  children,
  activeProjectId,
  onSelectProject,
}: AppShellProps) {
  const { user, profile, isOwner, signOut } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  // Presence hook
  const { activeUsers } = useProjectPresence(activeProjectId || "workspace");

  // Load / toggle dark mode
  useEffect(() => {
    const savedTheme = localStorage.getItem("altofox_dark_mode") === "true";
    setIsDarkMode(savedTheme);
    if (savedTheme) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleDarkMode = () => {
    const next = !isDarkMode;
    setIsDarkMode(next);
    localStorage.setItem("altofox_dark_mode", String(next));
    if (next) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  };

  // Keyboard shortcut Ctrl/Cmd+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const navItems = [
    { id: "dashboard" as NavTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "projects" as NavTab, label: "Projects", icon: FolderGit2 },
    { id: "activity" as NavTab, label: "Activity Feed", icon: Activity },
    ...(isOwner ? [{ id: "team" as NavTab, label: "Team", icon: Users }] : []),
    { id: "settings" as NavTab, label: "Settings", icon: Settings },
  ];

  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    if (isOwner) {
      fetch("/api/team/members")
        .then((res) => res.json())
        .then((data) => {
          if (typeof data.pendingCount === "number") {
            setPendingCount(data.pendingCount);
          }
        })
        .catch(() => {});
    }
  }, [isOwner, currentTab]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors font-sans">
      {/* 1. LEFT SIDEBAR (Desktop) */}
      <aside
        className={`hidden md:flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-all duration-200 z-30 ${
          sidebarCollapsed ? "w-16" : "w-60"
        }`}
      >
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white flex items-center justify-center shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            {!sidebarCollapsed && (
              <div className="leading-tight">
                <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">
                  AltoFox Studio
                </span>
                <span className="block text-[10px] text-slate-400 font-medium">
                  Private Team
                </span>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2.5 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onNavigate(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
                }`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-indigo-600 dark:text-indigo-400" : ""}`} />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </div>
                {!sidebarCollapsed && item.id === "team" && pendingCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User Mini-Profile at bottom of sidebar */}
        <div className="p-2.5 border-t border-slate-100 dark:border-slate-800">
          <div
            className={`flex items-center gap-2.5 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 ${
              sidebarCollapsed ? "justify-center" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="User" className="w-full h-full rounded-full object-cover" />
              ) : (
                profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                  {profile?.full_name || "Team Member"}
                </div>
                <div className="text-[10px] text-slate-400 capitalize flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-indigo-500" />
                  <span>{profile?.role || "editor"}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* TOP BAR */}
        <header className="h-16 px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Quick Global Search Trigger Button */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-400 hover:border-slate-300 dark:hover:border-slate-600 transition w-64 justify-between group"
            >
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-600" />
                <span>Search projects or pages…</span>
              </div>
              <kbd className="text-[10px] font-semibold text-slate-500 bg-white dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Right Action Icons & User Dropdown */}
          <div className="flex items-center gap-2.5">
            {/* Realtime Active Presence Avatars */}
            {activeUsers.length > 0 && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs"
                title={`${activeUsers.length} active teammate(s) in workspace`}
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-medium hidden sm:inline">
                  {activeUsers.length} online
                </span>
                <div className="flex -space-x-1.5 ml-1">
                  {activeUsers.slice(0, 3).map((u, i) => (
                    <div
                      key={u.userId || i}
                      className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[9px] font-bold flex items-center justify-center border border-white dark:border-slate-800"
                      title={u.fullName}
                    >
                      {u.avatarUrl ? (
                        <img src={u.avatarUrl} alt={u.fullName} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        u.fullName?.charAt(0).toUpperCase() || "U"
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* User Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full rounded-full object-cover" />
                  ) : (
                    profile?.full_name?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"
                  )}
                </div>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {profile?.full_name || "Team Member"}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">{user?.email}</div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      setIsProfileOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>My Profile</span>
                  </button>

                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate("team");
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <Users className="w-4 h-4 text-slate-400" />
                      <span>Manage Team</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      onNavigate("settings");
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Settings</span>
                  </button>

                  <div className="my-1 border-t border-slate-100 dark:border-slate-800" />

                  <button
                    type="button"
                    onClick={() => {
                      setUserDropdownOpen(false);
                      signOut();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onNavigate(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400"
                      : "text-slate-600 dark:text-slate-400 hover:bg-slate-50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Global Search Modal */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectProject={(id) => {
          if (onSelectProject) onSelectProject(id);
          else onNavigate("projects");
        }}
      />

      {/* Profile Modal */}
      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
