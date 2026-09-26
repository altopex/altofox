"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Profile, UserRole, UserStatus } from "@/lib/supabase/types";

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

function setAuthCookies(token: string | null, status: string | null) {
  if (typeof document === "undefined") return;
  const isSecure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";
  if (token) {
    document.cookie = `ranklocal_token=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}`;
    document.cookie = `altofox_token=${encodeURIComponent(token)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}`;
    try {
      localStorage.setItem("ranklocal_token_persist", token);
    } catch {}
  } else {
    document.cookie = `ranklocal_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax${isSecure}`;
    document.cookie = `altofox_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax${isSecure}`;
    try {
      localStorage.removeItem("ranklocal_token_persist");
    } catch {}
  }
  if (status) {
    document.cookie = `ranklocal_status=${encodeURIComponent(status)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}`;
    document.cookie = `altofox_status=${encodeURIComponent(status)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}`;
  } else {
    document.cookie = `ranklocal_status=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax${isSecure}`;
    document.cookie = `altofox_status=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax${isSecure}`;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const lastActiveUpdateRef = useRef<number>(0);

  const loadUserProfile = useCallback(async (userId: string, userEmail?: string, currentToken?: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (data && !error) {
        const loadedProfile: Profile = {
          ...data,
          email: userEmail,
          status: (data.status as UserStatus) || "pending",
          plan: data.plan || "starter",
          website_limit: data.website_limit ?? (data.plan === "agency" ? 30 : 5),
        };
        setProfile(loadedProfile);
        setAuthCookies(currentToken || null, loadedProfile.status);

        // Touch last_active_at in background at most once every 15 minutes
        const now = Date.now();
        if (now - lastActiveUpdateRef.current > 15 * 60 * 1000) {
          lastActiveUpdateRef.current = now;
          supabase
            .from("profiles")
            .update({ last_active_at: new Date().toISOString() })
            .eq("id", userId)
            .then();
        }
      } else {
        // Fallback default profile if trigger hasn't completed yet
        const isOwnerEmail = userEmail?.toLowerCase() === "russ@altopex.com";
        const fallbackProfile: Profile = {
          id: userId,
          full_name: userEmail?.split("@")[0] || "Team Member",
          avatar_url: null,
          role: isOwnerEmail ? "owner" : "editor",
          status: isOwnerEmail ? "approved" : "pending",
          company_name: null,
          plan: isOwnerEmail ? "unlimited" : "starter",
          website_limit: isOwnerEmail ? 999999 : 5,
          last_active_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          email: userEmail,
        };
        setProfile(fallbackProfile);
        setAuthCookies(currentToken || null, fallbackProfile.status);
      }
    } catch (err) {
      console.warn("[Auth] Profile load exception:", err);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    const supabase = getSupabaseBrowserClient();

    async function initAuth() {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (initialSession?.user) {
          setSession(initialSession);
          setUser(initialSession.user);
          await loadUserProfile(initialSession.user.id, initialSession.user.email, initialSession.access_token);
        } else {
          // Check persisted token fallback on hard refresh
          let restored = false;
          try {
            const persisted = typeof localStorage !== "undefined" ? localStorage.getItem("ranklocal_token_persist") : null;
            if (persisted) {
              const { data: userData } = await supabase.auth.getUser(persisted);
              if (userData?.user && mounted) {
                setUser(userData.user);
                await loadUserProfile(userData.user.id, userData.user.email, persisted);
                restored = true;
              }
            }
          } catch {}

          if (!restored && mounted) {
            setSession(null);
            setUser(null);
            setProfile(null);
            setAuthCookies(null, null);
          }
        }
      } catch (err) {
        console.error("[Auth] Init error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    initAuth();

    // Listen to Supabase Auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!mounted) return;
        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          if (currentSession.access_token) {
            setAuthCookies(currentSession.access_token, profile?.status || "approved");
          }
          await loadUserProfile(currentSession.user.id, currentSession.user.email, currentSession.access_token);
        } else {
          setProfile(null);
          setAuthCookies(null, null);
        }
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile, profile?.status]);

  const signInWithPassword = async (email: string, password: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
        await loadUserProfile(data.user.id, data.user.email, data.session.access_token);
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to sign in" };
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
            const supabase = getSupabaseBrowserClient();
            try {
              await supabase.auth.setSession({
                access_token: apiData.session.access_token,
                refresh_token: apiData.session.refresh_token,
              });
            } catch (_) {}
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
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: typeof window !== "undefined" ? `${window.location.origin}/auth/callback` : undefined,
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return {
        success: true,
        message: "Login link sent! Please check your email inbox.",
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to send magic link" };
    }
  };

  const resetPasswordForEmail = async (email: string) => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: typeof window !== "undefined" ? `${window.location.origin}/reset-password` : undefined,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return {
        success: true,
        message: "Password reset link sent! Please check your email inbox.",
      };
    } catch (err: any) {
      return { success: false, error: err.message || "Failed to send reset link" };
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
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setAuthCookies(null, null);
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
        loading,
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
