import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Routes that do NOT require authentication
const PUBLIC_FILE_EXTENSIONS = [
  ".ico",
  ".png",
  ".jpg",
  ".jpeg",
  ".svg",
  ".css",
  ".js",
  ".map",
  ".txt",
  ".xml",
  ".woff",
  ".woff2",
];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const host = req.headers.get("host") || "";

  // 0. Canonical domain redirect for apex domain ranklocal.site -> www.ranklocal.site on page visits
  if (host === "ranklocal.site" && !pathname.startsWith("/api") && req.method === "GET") {
    const canonicalUrl = new URL(pathname + search, "https://www.ranklocal.site");
    return NextResponse.redirect(canonicalUrl, 301);
  }

  // 1. Skip static assets, Next internals, and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    PUBLIC_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext))
  ) {
    return NextResponse.next();
  }

  // Extract token from cookie OR Authorization header
  let token = req.cookies.get("ranklocal_token")?.value || req.cookies.get("altofox_token")?.value;
  let status = req.cookies.get("ranklocal_status")?.value || req.cookies.get("altofox_status")?.value;

  // Also check Supabase cookie variants if not found in custom cookies
  if (!token && typeof req.cookies?.getAll === "function") {
    const allCookies = req.cookies.getAll();
    if (Array.isArray(allCookies)) {
      for (const cookie of allCookies) {
        if (
          cookie.name === "sb-access-token" ||
          (cookie.name.startsWith("sb-") && cookie.name.endsWith("-auth-token"))
        ) {
          try {
            const raw = decodeURIComponent(cookie.value).trim();
            if (raw.startsWith("[") || raw.startsWith("{")) {
              const parsed = JSON.parse(raw);
              token = parsed.access_token || parsed[0] || raw;
            } else {
              token = raw;
            }
            if (token) break;
          } catch {
            token = cookie.value;
            break;
          }
        }
      }
    }
  }

  const authHeader = req.headers.get("authorization");
  if (!token && authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    token = authHeader.replace(/^[Bb]earer\s+/, "").trim();
  }

  // Fast check: verify if JWT payload is expired (with 10-second clock-skew allowance)
  let isExpired = false;
  if (token && token.includes(".")) {
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payloadBase64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
        const payloadJson = atob(payloadBase64);
        const payload = JSON.parse(payloadJson);
        if (payload.exp && typeof payload.exp === "number") {
          isExpired = Date.now() >= (payload.exp * 1000) - 10000;
        }
      }
    } catch {
      // If parsing fails for a non-JWT string, let downstream routes decide
    }
  }

  const isAuthenticated = Boolean(token) && !isExpired;
  // An authenticated user is treated as approved unless explicitly pending or disabled
  const isExplicitlyPending = status === "pending" || status === "disabled";
  const isApproved = isAuthenticated && !isExplicitlyPending;

  // 2. Handle /dashboard and protected app routes
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (isDashboardRoute) {
    if (!isAuthenticated) {
      const redirectUrl = new URL("/login", req.url);
      const destination = pathname + search;
      redirectUrl.searchParams.set("redirect", destination);
      const res = NextResponse.redirect(redirectUrl);
      if (isExpired) {
        res.cookies.delete("ranklocal_token");
        res.cookies.delete("altofox_token");
        res.cookies.delete("ranklocal_status");
        res.cookies.delete("altofox_status");
      }
      return res;
    }

    if (isExplicitlyPending) {
      return NextResponse.redirect(new URL("/pending", req.url));
    }

    return NextResponse.next();
  }

  // 3. Handle /pending route
  if (pathname === "/pending") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", req.url));
    }
    if (isApproved) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  }

  // 4. Handle /login and /signup when already authenticated
  if (pathname === "/login" || pathname === "/signup") {
    if (isApproved) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    if (isExplicitlyPending) {
      return NextResponse.redirect(new URL("/pending", req.url));
    }
    if (isExpired) {
      const res = NextResponse.next();
      res.cookies.delete("ranklocal_token");
      res.cookies.delete("altofox_token");
      res.cookies.delete("ranklocal_status");
      res.cookies.delete("altofox_status");
      return res;
    }
    return NextResponse.next();
  }

  // 5. Handle Protected API routes (Team, storage, project management, keys)
  const isPublicBuilderProjectEndpoint =
    pathname.startsWith("/api/projects/export") ||
    pathname.startsWith("/api/projects/analyze") ||
    pathname.startsWith("/api/projects/improve") ||
    pathname.startsWith("/api/projects/temp-") ||
    pathname.includes("/preview") ||
    pathname.includes("/download");

  const isProtectedApiRoute =
    (pathname.startsWith("/api/projects") && !isPublicBuilderProjectEndpoint) ||
    pathname.startsWith("/api/team") ||
    pathname.startsWith("/api/storage") ||
    pathname.startsWith("/api/search-console") ||
    pathname.startsWith("/api/seo") ||
    pathname.startsWith("/api/blog") ||
    pathname.startsWith("/api/settings/keys");

  if (isProtectedApiRoute) {
    if (!isAuthenticated) {
      const res = NextResponse.json(
        { error: isExpired ? "Unauthorized. Session expired." : "Unauthorized. Authentication required." },
        { status: 401 }
      );
      if (isExpired) {
        res.cookies.delete("ranklocal_token");
        res.cookies.delete("altofox_token");
        res.cookies.delete("ranklocal_status");
        res.cookies.delete("altofox_status");
      }
      return res;
    }

    // If explicit status cookie indicates pending or disabled, reject with 403
    if (status && status !== "approved") {
      return NextResponse.json(
        {
          error: "Forbidden. Account awaiting approval or disabled.",
          status: status,
        },
        { status: 403 }
      );
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
