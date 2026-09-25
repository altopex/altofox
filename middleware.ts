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

  // 1. Skip static assets, Next internals, and favicon
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/favicon.ico" ||
    PUBLIC_FILE_EXTENSIONS.some((ext) => pathname.endsWith(ext))
  ) {
    return NextResponse.next();
  }

  // Extract token from cookie OR Authorization header
  let token = req.cookies.get("ranklocal_token")?.value || req.cookies.get("altofox_token")?.value;
  let status = req.cookies.get("ranklocal_status")?.value || req.cookies.get("altofox_status")?.value;

  const authHeader = req.headers.get("authorization");
  if (!token && authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.replace("Bearer ", "").trim();
  }

  const isAuthenticated = Boolean(token);
  const isApproved = isAuthenticated && status === "approved";

  // 2. Handle /dashboard and protected app routes
  const isDashboardRoute = pathname.startsWith("/dashboard");

  if (isDashboardRoute) {
    if (!isAuthenticated) {
      const redirectUrl = new URL("/login", req.url);
      const destination = pathname + search;
      redirectUrl.searchParams.set("redirect", destination);
      return NextResponse.redirect(redirectUrl);
    }

    if (!isApproved) {
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
    if (isAuthenticated && !isApproved) {
      return NextResponse.redirect(new URL("/pending", req.url));
    }
    return NextResponse.next();
  }

  // 5. Handle Protected API routes
  const isProtectedApiRoute =
    pathname.startsWith("/api/projects") ||
    pathname.startsWith("/api/team") ||
    pathname.startsWith("/api/storage") ||
    pathname.startsWith("/api/search-console") ||
    pathname.startsWith("/api/seo") ||
    pathname.startsWith("/api/blog") ||
    pathname.startsWith("/api/settings/keys");

  if (isProtectedApiRoute) {
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized. Authentication required." },
        { status: 401 }
      );
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
