"use client";

import { getSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Safely extracts the active authentication JWT token from:
 * 1. localStorage ("ranklocal_token_persist")
 * 2. document.cookie ("ranklocal_token" or "altofox_token")
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;

  try {
    const persisted = localStorage.getItem("ranklocal_token_persist");
    if (persisted && persisted.trim().length > 10) {
      return persisted.trim();
    }
  } catch {}

  try {
    const cookies = document.cookie.split(";");
    for (const cookie of cookies) {
      const [key, value] = cookie.trim().split("=");
      if ((key === "ranklocal_token" || key === "altofox_token") && value) {
        const decoded = decodeURIComponent(value);
        if (decoded.trim().length > 10) {
          return decoded.trim();
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

        // Sync fresh token to cookies & localStorage
        const isSecure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `ranklocal_token=${encodeURIComponent(newToken)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}`;
        document.cookie = `altofox_token=${encodeURIComponent(newToken)}; Path=/; SameSite=Lax; Max-Age=604800${isSecure}`;
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
