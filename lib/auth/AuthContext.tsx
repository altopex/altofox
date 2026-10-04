"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Profile, UserRole, UserStatus } from "@/lib/supabase/types";
import { getAuthToken } from "@/lib/auth/client-token";

export type AuthStage = "INITIALIZING" | "AUTHENTICATED" | "UNAUTHENTICATED";

interface SignUpParams {
  email: string;
  password: string;
  fullName: string;
  companyName?: string;
  plan?: "starter" | "agency";
}

interface AuthContextValue {
  user: User | null;
  profile: Profile | null;
  role: UserRole;
  status: UserStatus;
  isOwner: boolean;
  isApproved: boolean;
  loading: boolean;
  authStage: AuthStage;
  session: Session | null;
  signInWithPassword: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (params: SignUpParams) => Promise<{ success: boolean; status?: string; requiresEmailConfirmation?: boolean; error?: string }>;
  signInWithOtp: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  resetPasswordForEmail: (email: string) => Promise<{ success: boolean; message?: string; error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (fullName: string, avatarUrl?: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getCookieDomain(): string {
  if (typeof window === "undefined") return "";
  const host = window.location.hostname;
  if (host.endsWith("ranklocal.site")) return "; Domain=.ranklocal.site";
  return "";
}

function setAuthCookies(token?: string | null, status?: string | null) {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  const domainPart = getCookieDomain();

  if (token && typeof token === "string" && token.trim().length > 10) {
    const cleanToken = token.trim();
    document.cookie = `ranklocal_token=${encodeURIComponent(cleanToken)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}${domainPart}`;
    document.cookie = `altofox_token=${encodeURIComponent(cleanToken)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}${domainPart}`;
    // Also set host-only cookie for maximum cross-browser compatibility
    if (domainPart) {
      document.cookie = `ranklocal_token=${encodeURIComponent(cleanToken)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}`;
      document.cookie = `altofox_token=${encodeURIComponent(cleanToken)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}`;
    }
    try {
      localStorage.setItem("ranklocal_token_persist", cleanToken);
    } catch {}
  }

  if (status && typeof status === "string" && status.trim().length > 0) {
    const cleanStatus = status.trim();
    document.cookie = `ranklocal_status=${encodeURIComponent(cleanStatus)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}${domainPart}`;
    document.cookie = `altofox_status=${encodeURIComponent(cleanStatus)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}${domainPart}`;
    if (domainPart) {
      document.cookie = `ranklocal_status=${encodeURIComponent(cleanStatus)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}`;
      document.cookie = `altofox_status=${encodeURIComponent(cleanStatus)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}`;
    }
  }
}

function clearAuthCookies() {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  const domainPart = getCookieDomain();

  const cookieNames = [
    "ranklocal_token",
    "altofox_token",
    "ranklocal_status",
    "altofox_status",
    "sb-access-token",
  ];

  for (const name of cookieNames) {
    document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax${isSecure}`;
    if (domainPart) {
      document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax${isSecure}${domainPart}`;
    }
  }

  try {
    localStorage.removeItem("ranklocal_token_persist");
    localStorage.removeItem("ranklocal_team_auth");
    localStorage.removeItem("altofox_team_auth");
  } catch {}
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authStage, setAuthStage] = useState<AuthStage>("INITIALIZING");
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const profileRef = useRef<Profile | null>(null);
  // Keep ref in sync with state via effect (not during render)
  useEffect(() => { profileRef.current = profile; }, [profile]);

  const loadUserProfile = useCallback(async (userId: string, userEmail?: string, currentToken?: string) => {
    try {
      // 1. Fast local check-status lookup (< 1ms)
      const headers: Record<string, string> = {};
      if (currentToken) {
        headers["Authorization"] = `Bearer ${currentToken}`;
      }

      const res = await fetch("/api/auth/check-status", {
        headers,
        credentials: "same-origin",
      }).catch(() => null);

      if (res && res.ok) {
        const sData = await res.json().catch(() => null);
        if (sData?.authenticated) {
          const email = sData.email || userEmail;
          const isOwner =
            sData.role === "owner" ||
            email?.toLowerCase() === "russ@altopex.com" ||
            email?.toLowerCase() === "russell@altopex.com" ||
            email?.toLowerCase() === "admin@ranklocal.site" ||
            email?.toLowerCase() === "admin@altopex.com";

          const loadedProfile: Profile = {
            id: sData.id || userId,
            email,
            full_name: sData.fullName || email?.split("@")[0] || "User",
            avatar_url: null,
            role: (isOwner ? "owner" : sData.role || "editor") as UserRole,
            status: (isOwner ? "approved" : sData.status || "approved") as UserStatus,
            company_name: null,
            plan: isOwner ? "unlimited" : "starter",
            website_limit: isOwner ? 999999 : 5,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            last_active_at: new Date().toISOString(),
          };
          setProfile(loadedProfile);
          setAuthCookies(currentToken || undefined, loadedProfile.status);
          return;
        }
      }

      // 2. Instant fallback default profile
      const isOwnerEmail =
        userEmail?.toLowerCase() === "russ@altopex.com" ||
        userEmail?.toLowerCase() === "russell@altopex.com" ||
        userEmail?.toLowerCase() === "admin@ranklocal.site" ||
        userEmail?.toLowerCase() === "admin@altopex.com";

      const fallbackProfile: Profile = {
        id: userId,
        full_name: userEmail?.split("@")[0] || "Team Member",
        avatar_url: null,
        role: isOwnerEmail ? "owner" : "editor",
        status: isOwnerEmail ? "approved" : "approved",
        company_name: null,
        plan: isOwnerEmail ? "unlimited" : "starter",
        website_limit: isOwnerEmail ? 999999 : 5,
        last_active_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        email: userEmail,
      };
      setProfile(fallbackProfile);
      setAuthCookies(currentToken || undefined, fallbackProfile.status);
    } catch (err) {
      console.warn("[Auth] Profile load exception:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    async function initAuth() {
      try {
        // 0. Fast Instant Synchronous Hydration from local token (< 0.1ms)
        const storedToken = getAuthToken();
        if (storedToken && storedToken.includes(".")) {
          try {
            const parts = storedToken.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
              if (payload.exp && payload.exp * 1000 > Date.now()) {
                const isOwner = payload.role === "owner" || payload.email?.toLowerCase() === "russ@altopex.com";
                const instantProfile: Profile = {
                  id: payload.sub || "usr-current",
                  email: payload.email,
                  full_name: payload.user_metadata?.full_name || payload.email?.split("@")[0] || "User",
                  avatar_url: null,
                  role: (isOwner ? "owner" : payload.role || "editor") as UserRole,
                  status: (isOwner ? "approved" : payload.status || "approved") as UserStatus,
                  company_name: payload.user_metadata?.company_name || null,
                  plan: isOwner ? "unlimited" : payload.user_metadata?.plan || "starter",
                  website_limit: isOwner ? 999999 : payload.user_metadata?.website_limit || 5,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  last_active_at: new Date().toISOString(),
                };
                if (mounted) {
                  setProfile(instantProfile);
                  setUser({
                    id: instantProfile.id,
                    email: instantProfile.email,
                    app_metadata: {},
                    user_metadata: { full_name: instantProfile.full_name, role: instantProfile.role },
                    aud: "authenticated",
                    created_at: instantProfile.created_at,
                  });
                  setAuthStage("AUTHENTICATED");
                  setLoading(false);
                }
              }
            }
          } catch {}
        } else {
          setAuthStage("INITIALIZING");
          setLoading(true);
        }

        // 1. Proactively check Supabase local session
        let activeSession: Session | null = null;
        try {
          const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
          if (!sessionErr && sessionData?.session) {
            activeSession = sessionData.session;
          }
        } catch (e) {
          console.warn("[Auth] getSession check notice:", e);
        }

        // Check if access token is expired or expiring in < 60 seconds
        const isTokenExpired = activeSession?.expires_at
          ? activeSession.expires_at * 1000 <= Date.now() + 60000
          : false;

        // Proactive Session Refresh if expired
        if (activeSession && isTokenExpired) {
          try {
            console.log("[Auth] Session near expiry, performing resilient refresh...");
            const { data: refreshData, error: refreshErr } = await supabase.auth.refreshSession();
            if (!refreshErr && refreshData?.session) {
              activeSession = refreshData.session;
              console.log("[Auth] Session refreshed successfully!");
            }
          } catch (refErr) {
            console.warn("[Auth] Proactive refresh attempt note:", refErr);
          }
        }

        // 2. Fallback: Restore from localStorage if Supabase client memory didn't have it
        if (!activeSession?.user && typeof window !== "undefined") {
          try {
            for (const key of ["ranklocal_team_auth", "altofox_team_auth"]) {
              const raw = localStorage.getItem(key);
              if (raw) {
                const parsed = JSON.parse(raw);
                if (parsed?.access_token && parsed?.refresh_token) {
                  const { data: restored, error: restoreErr } = await supabase.auth.setSession({
                    access_token: parsed.access_token,
                    refresh_token: parsed.refresh_token,
                  });
                  if (!restoreErr && restored?.session) {
                    activeSession = restored.session;
                    break;
                  }
                }
              }
            }
          } catch (storageErr) {
            console.warn("[Auth] LocalStorage session restore notice:", storageErr);
          }
        }

        // If we have an active session with a user
        if (activeSession?.user) {
          if (!mounted) return;
          setSession(activeSession);
          setUser(activeSession.user);
          setAuthStage("AUTHENTICATED");
          if (activeSession.access_token) {
            setAuthCookies(activeSession.access_token, "approved");
          }
          await loadUserProfile(activeSession.user.id, activeSession.user.email, activeSession.access_token);
          if (mounted) setLoading(false);
          return;
        }

        // 3. Fallback check via /api/auth/check-status (cookie & bearer token verification)
        try {
          const storedToken = getAuthToken();
          const checkHeaders: Record<string, string> = {};
          if (storedToken) {
            checkHeaders["Authorization"] = `Bearer ${storedToken}`;
          }

          const statusRes = await fetch("/api/auth/check-status", {
            credentials: "same-origin",
            headers: checkHeaders,
          });

          if (statusRes.ok) {
            const statusData = await statusRes.json();
            if (statusData?.authenticated && mounted) {
              const isOwner = statusData.role === "owner" || statusData.email?.toLowerCase() === "russ@altopex.com";
              const loadedProfile: Profile = {
                id: statusData.id || "usr-current",
                email: statusData.email,
                full_name: statusData.fullName || statusData.email?.split("@")[0] || "User",
                avatar_url: null,
                role: (isOwner ? "owner" : statusData.role || "editor") as UserRole,
                status: (isOwner ? "approved" : statusData.status || "approved") as UserStatus,
                company_name: null,
                plan: isOwner ? "unlimited" : "starter",
                website_limit: isOwner ? 999999 : 5,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                last_active_at: new Date().toISOString(),
              };
              setProfile(loadedProfile);
              setUser({
                id: loadedProfile.id,
                email: loadedProfile.email,
                app_metadata: {},
                user_metadata: { full_name: loadedProfile.full_name, role: loadedProfile.role },
                aud: "authenticated",
                created_at: loadedProfile.created_at,
              });
              setAuthStage("AUTHENTICATED");

              const effectiveToken = statusData.token || storedToken || undefined;
              if (effectiveToken) {
                setAuthCookies(effectiveToken, loadedProfile.status);
              } else {
                setAuthCookies(undefined, loadedProfile.status);
              }

              if (mounted) setLoading(false);
              return;
            }
          }
        } catch (checkErr) {
          // Network error: DO NOT LOG OUT! If we have a stored JWT token that is unexpired, keep session!
          console.warn("[Auth] check-status network notice:", checkErr);
          const storedToken = getAuthToken();
          if (storedToken && storedToken.includes(".")) {
            try {
              const parts = storedToken.split(".");
              if (parts.length === 3) {
                const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
                if (payload.exp && payload.exp * 1000 > Date.now()) {
                  // Token is still valid in time! Maintain session through network blip
                  const isOwner = payload.role === "owner" || payload.email?.toLowerCase() === "russ@altopex.com";
                  const fallbackProfile: Profile = {
                    id: payload.sub || "usr-current",
                    email: payload.email,
                    full_name: payload.user_metadata?.full_name || payload.email?.split("@")[0] || "User",
                    avatar_url: null,
                    role: (isOwner ? "owner" : payload.role || "editor") as UserRole,
                    status: (isOwner ? "approved" : payload.status || "approved") as UserStatus,
                    company_name: payload.user_metadata?.company_name || null,
                    plan: isOwner ? "unlimited" : payload.user_metadata?.plan || "starter",
                    website_limit: isOwner ? 999999 : payload.user_metadata?.website_limit || 5,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                    last_active_at: new Date().toISOString(),
                  };
                  if (mounted) {
                    setProfile(fallbackProfile);
                    setUser({
                      id: fallbackProfile.id,
                      email: fallbackProfile.email,
                      app_metadata: {},
                      user_metadata: { full_name: fallbackProfile.full_name, role: fallbackProfile.role },
                      aud: "authenticated",
                      created_at: fallbackProfile.created_at,
                    });
                    setAuthStage("AUTHENTICATED");
                    setLoading(false);
                  }
                  return;
                }
              }
            } catch {}
          }
        }

        // 4. Definitively unauthenticated
        if (mounted) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setAuthStage("UNAUTHENTICATED");
          clearAuthCookies();
        }
      } catch (err) {
        console.error("[Auth] Init error:", err);
        if (mounted) {
          setAuthStage("UNAUTHENTICATED");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    // Listen to Supabase Auth state changes.
    // IMPORTANT: onAuthStateChange fires INITIAL_SESSION (or SIGNED_IN) immediately
    // when the Supabase client finds a cached session. This races with initAuth above.
    // We suppress listener reactions until initAuth completes to avoid duplicate
    // loadUserProfile calls and state-flip race conditions.
    let isInitializing = true;

    let subscription: any = null;
    try {
      const subRes = supabase.auth.onAuthStateChange(
        async (event, currentSession) => {
          if (!mounted) return;

          // Suppress INITIAL_SESSION and the first SIGNED_IN that Supabase fires
          // automatically during initialization — initAuth handles that pass.
          if (isInitializing && (event === "INITIAL_SESSION" || event === "SIGNED_IN")) {
            return;
          }

          console.log(`[Auth] Auth event: ${event}`);

          if (event === "SIGNED_OUT") {
            setSession(null);
            setUser(null);
            setProfile(null);
            setAuthStage("UNAUTHENTICATED");
            clearAuthCookies();
            return;
          }

          if (currentSession?.user) {
            setSession(currentSession);
            setUser(currentSession.user);
            setAuthStage("AUTHENTICATED");
            if (currentSession.access_token) {
              setAuthCookies(currentSession.access_token, profileRef.current?.status || "approved");
            }
            if (event === "SIGNED_IN" || !profileRef.current) {
              await loadUserProfile(currentSession.user.id, currentSession.user.email, currentSession.access_token);
            }
          }

          if (event === "TOKEN_REFRESHED" && currentSession?.access_token) {
            setAuthCookies(currentSession.access_token, profileRef.current?.status || "approved");
          }
        }
      );
      subscription = subRes.data?.subscription;
    } catch {}

    // Run initAuth and clear the isInitializing flag when it completes,
    // allowing the listener to react to real post-init events.
    initAuth().finally(() => {
      isInitializing = false;
    });

    // Tab wake-up / visibility change listener: silently refresh tokens when user returns to tab
    const handleVisibilityChange = async () => {
      if (document.visibilityState === "visible") {
        try {
          const { data } = await supabase.auth.getSession();
          if (data?.session?.expires_at && data.session.expires_at * 1000 <= Date.now() + 120000) {
            console.log("[Auth] Tab visible and session expiring soon; proactively refreshing...");
            await supabase.auth.refreshSession();
          }
        } catch {}
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const signInWithPassword = async (email: string, password: string) => {
    try {
      // 1. Resilient server-side sign-in route (handles Supabase + local fallback with cookies)
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data?.error || "Incorrect email or password. Please verify your credentials.",
        };
      }

      if (data.user && data.session) {
        const token = data.session.access_token;
        const refreshToken = data.session.refresh_token;
        const status = data.profile?.status || "approved";

        // Synchronize with Supabase browser client so autoRefreshToken and listeners work!
        const supabase = getSupabaseBrowserClient();
        if (token && refreshToken) {
          try {
            await supabase.auth.setSession({
              access_token: token,
              refresh_token: refreshToken,
            });
          } catch (e) {
            console.warn("[Auth] Supabase browser setSession notice:", e);
          }
        }

        // Persist cookies & localStorage
        setAuthCookies(token, status);

        // Update React state
        setUser(data.user);
        setSession(data.session);
        setProfile(data.profile);
        setAuthStage("AUTHENTICATED");
        setLoading(false);
      }
      return { success: true };
    } catch (err: any) {
      const msg = err?.message || "";
      if (msg.toLowerCase().includes("failed to fetch")) {
        return {
          success: false,
          error: "Connection error: Unable to reach authentication server. Please check your internet connection or try again.",
        };
      }
      return { success: false, error: msg || "Failed to sign in. Please try again." };
    }
  };

  const signUp = async ({
    email,
    password,
    fullName,
    companyName,
    plan = "starter",
  }: SignUpParams) => {
    try {
      const cleanEmail = email.trim();
      const chosenPlan = plan || "starter";

      // 1. Primary: Use dedicated server signup endpoint that auto-confirms user
      // and completely avoids Supabase free SMTP email rate limits
      try {
        const apiRes = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            password,
            fullName: fullName.trim(),
            companyName: companyName?.trim() || null,
            plan: chosenPlan,
          }),
        });

        const apiData = await apiRes.json();

        if (apiRes.ok && apiData.success) {
          if (apiData.session && apiData.user) {
            setUser(apiData.user);
            setSession(apiData.session);
            setAuthStage("AUTHENTICATED");
            setLoading(false);
            const supabase = getSupabaseBrowserClient();
            try {
              await supabase.auth.setSession({
                access_token: apiData.session.access_token,
                refresh_token: apiData.session.refresh_token,
              });
            } catch (_) {}
            setAuthCookies(apiData.session.access_token, apiData.status || "pending");
            await loadUserProfile(apiData.user.id, cleanEmail, apiData.session.access_token);
          } else {
            await signInWithPassword(cleanEmail, password);
          }
          return {
            success: true,
            status: apiData.status || "pending",
            requiresEmailConfirmation: false,
          };
        } else if (apiRes.status === 409) {
          return {
            success: false,
            error: apiData.error || "An account with this email address already exists. Please sign in.",
          };
        } else if (apiRes.status >= 400 && apiRes.status < 500) {
          return {
            success: false,
            error: apiData.error || "Registration validation error.",
          };
        }
      } catch (apiErr) {
        console.warn("[Auth] Server signup route failed, falling back to client SDK:", apiErr);
      }

      // 2. Fallback: Client-side SDK signup
      const supabase = getSupabaseBrowserClient();
      const websiteLimit = chosenPlan === "agency" ? 30 : 5;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            company_name: companyName?.trim() || null,
            plan: chosenPlan,
            website_limit: websiteLimit,
          },
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      });

      if (error) {
        if (
          error.message.toLowerCase().includes("rate limit") ||
          error.message.toLowerCase().includes("over_email_send_rate_limit")
        ) {
          return {
            success: false,
            error: "Email verification service is temporarily busy. Please wait a minute or sign in if you already registered.",
          };
        }
        return { success: false, error: error.message };
      }

      if (data.user) {
        if (data.session) {
          setUser(data.user);
          setSession(data.session);
          setAuthStage("AUTHENTICATED");
          setLoading(false);
          setAuthCookies(data.session.access_token, "pending");
          await loadUserProfile(data.user.id, data.user.email, data.session.access_token);
        }
        return {
          success: true,
          requiresEmailConfirmation: !data.session,
        };
      }
      return { success: false, error: "Failed to create account" };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to create account" };
    }
  };

  const signInWithOtp = async (email: string) => {
    // Wrap in a timeout so a paused/unreachable Supabase project doesn't hang the UI forever
    const timeoutMs = 7000;
    try {
      const supabase = getSupabaseBrowserClient();
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs)
      );
      const { error } = await Promise.race([
        supabase.auth.signInWithOtp({
          email: email.trim(),
          options: {
            shouldCreateUser: false,
            emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
          },
        }),
        timeout,
      ]) as any;

      if (error) {
        return { success: false, error: error.message };
      }
      return {
        success: true,
        message: "Login link sent! Please check your email inbox.",
      };
    } catch (err: any) {
      if (err?.message === "timeout" || err?.message?.includes("fetch")) {
        return {
          success: false,
          error: "Email service is temporarily unavailable. Please use your password to sign in instead.",
        };
      }
      return { success: false, error: err.message || "Failed to send magic link." };
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    // Wrap in a timeout so a paused/unreachable Supabase project doesn't hang the UI forever
    const timeoutMs = 7000;
    try {
      const supabase = getSupabaseBrowserClient();
      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), timeoutMs)
      );
      const { error } = await Promise.race([
        supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
        }),
        timeout,
      ]) as any;

      if (error) {
        return { success: false, error: error.message };
      }
      return {
        success: true,
        message: "Password reset link sent! Please check your email inbox.",
      };
    } catch (err: any) {
      if (err?.message === "timeout" || err?.message?.includes("fetch")) {
        return {
          success: false,
          error: "Email service is temporarily unavailable. To reset your password, please contact support at russ@altopex.com.",
        };
      }
      return { success: false, error: err.message || "Failed to send reset link." };
    }
  };

  const updatePassword = async (newPassword: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update password" };
    }
  };

  const updateProfile = async (fullName: string, avatarUrl?: string) => {
    if (!user) return { success: false, error: "Not authenticated" };
    try {
      const supabase = getSupabaseBrowserClient();
      const updates: any = {
        full_name: fullName.trim(),
        updated_at: new Date().toISOString(),
      };
      if (avatarUrl !== undefined) updates.avatar_url = avatarUrl.trim();

      const { error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", user.id);

      if (error) return { success: false, error: error.message };

      setProfile((prev) => (prev ? { ...prev, ...updates } : null));
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to update profile" };
    }
  };

  const signOut = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut().catch(() => {});
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setAuthStage("UNAUTHENTICATED");
      clearAuthCookies();
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserProfile(user.id, user.email, session?.access_token);
    }
  };

  const role: UserRole = profile?.role || "editor";
  const status: UserStatus = profile?.status || "pending";
  const isApproved = status === "approved";
  const isOwner = role === "owner" && isApproved;

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        status,
        isOwner,
        isApproved,
        loading: authStage === "INITIALIZING",
        authStage,
        session,
        signInWithPassword,
        signUp,
        signInWithOtp,
        resetPasswordForEmail,
        updatePassword,
        updateProfile,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      profile: null,
      role: "editor",
      status: "pending",
      isOwner: false,
      isApproved: false,
      loading: false,
      authStage: "UNAUTHENTICATED",
      session: null,
      signInWithPassword: async () => ({ success: false, error: "AuthProvider not mounted" }),
      signUp: async () => ({ success: false, error: "AuthProvider not mounted" }),
      signInWithOtp: async () => ({ success: false, error: "AuthProvider not mounted" }),
      resetPasswordForEmail: async () => ({ success: false, error: "AuthProvider not mounted" }),
      updatePassword: async () => ({ success: false, error: "AuthProvider not mounted" }),
      updateProfile: async () => ({ success: false, error: "AuthProvider not mounted" }),
      signOut: async () => {},
      refreshProfile: async () => {},
    };
  }
  return context;
}
