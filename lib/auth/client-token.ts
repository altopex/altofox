"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Safely extracts the active authentication JWT token from:
 * 1. localStorage ("ranklocal_token_persist")
 * 2. document.cookie ("ranklocal_token" or "altofox_token")
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  // 1. Direct persisted token in localStorage
  try {
    const persisted = localStorage.getItem("ranklocal_token_persist");
    if (persisted && persisted.trim().length > 10) {
      return persisted.trim();
    }
  } catch {}

  // 2. Supabase storageKey ("ranklocal_team_auth" and "altofox_team_auth")
  try {
    for (const key of ["ranklocal_team_auth", "altofox_team_auth"]) {
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          const token = parsed?.access_token || (Array.isArray(parsed) ? parsed[0] : null);
          if (token && typeof token === "string" && token.trim().length > 10) {
            return token.trim();
          }
        } catch {}
      }
    }

    // Check any dynamic Supabase project key in localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            const token = parsed?.access_token || (Array.isArray(parsed) ? parsed[0] : null);
            if (token && typeof token === "string" && token.trim().length > 10) {
              return token.trim();
            }
          } catch {}
        }
      }
    }
  } catch {}

  // 3. Document cookies (ranklocal_token, altofox_token, sb-access-token, etc.)
  try {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [rawKey, ...valParts] = cookie.trim().split("=");
      const key = rawKey.trim();
      const value = valParts.join("=");
      if (
        (key === "ranklocal_token" ||
          key === "altofox_token" ||
          key === "sb-access-token" ||
          (key.startsWith("sb-") && key.endsWith("-auth-token"))) &&
        value
      ) {
        const decoded = decodeURIComponent(value).trim();
        if (decoded.startsWith("{") || decoded.startsWith("[")) {
          try {
            const parsed = JSON.parse(decoded);
            const token = parsed?.access_token || (Array.isArray(parsed) ? parsed[0] : null);
            if (token && typeof token === "string" && token.trim().length > 10) {
              return token.trim();
            }
          } catch {}
        } else if (decoded.length > 10) {
          return decoded;
        }
      }
    }
  } catch {}

  return null;
}

/**
 * Returns an HTTP headers object with a valid Authorization Bearer header if a token exists.
 * Never returns an empty "Bearer " string to avoid triggering 401s in strict middleware.
 */
export function getAuthHeaders(sessionToken?: string | null): Record<string, string> {
  const token = (sessionToken && sessionToken.trim().length > 10) ? sessionToken.trim() : getAuthToken();
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }
  return {};
}

/**
 * Enhanced fetch wrapper for API endpoints that:
 * 1. Automatically attaches the freshest JWT Authorization header.
 * 2. Enforces credentials: "same-origin" so auth cookies are consistently attached.
 * 3. Intercepts 401 responses and attempts automatic session refresh via Supabase before retrying once.
 */
export async function authFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers || {});

  // If Authorization is not explicitly passed or is empty, resolve freshest token
  const existingAuth = headers.get("Authorization");
  if (!existingAuth || existingAuth === "Bearer " || existingAuth === "Bearer") {
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else {
      headers.delete("Authorization");
    }
  }

  const mergedInit: RequestInit = {
    ...init,
    headers,
    credentials: init?.credentials || "same-origin",
  };

  let response = await fetch(input, mergedInit);

  // If 401 Unauthorized, attempt proactive session refresh and retry once
  if (response.status === 401 && typeof window !== "undefined") {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();

      if (refreshData?.session?.access_token && !refreshError) {
        const newToken = refreshData.session.access_token;

        // Sync fresh token to cookies & localStorage with domain coverage
        const isSecure = window.location.protocol === "https:" ? "; Secure" : "";
        const domainPart = window.location.hostname.endsWith("ranklocal.site") ? "; Domain=.ranklocal.site" : "";
        document.cookie = `ranklocal_token=${encodeURIComponent(newToken)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}${domainPart}`;
        document.cookie = `altofox_token=${encodeURIComponent(newToken)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}${domainPart}`;
        if (domainPart) {
          document.cookie = `ranklocal_token=${encodeURIComponent(newToken)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}`;
          document.cookie = `altofox_token=${encodeURIComponent(newToken)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}`;
        }
        try {
          localStorage.setItem("ranklocal_token_persist", newToken);
        } catch {}

        // Retry request with fresh token
        headers.set("Authorization", `Bearer ${newToken}`);
        response = await fetch(input, {
          ...mergedInit,
          headers,
        });
      }
    } catch (refreshErr) {
      console.warn("[authFetch] Automatic session renewal attempt failed:", refreshErr);
    }
  }

  return response;
}
