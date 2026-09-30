import { NextRequest, NextResponse } from "next/server";
import { authenticateCredentials } from "@/lib/auth/auth-service";

export const dynamic = "force-dynamic";

// Restrict CORS to our own domain in production; allow any origin in dev
function getCorsHeaders(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const allowed =
    process.env.NODE_ENV !== "production" ||
    origin === "https://www.ranklocal.site" ||
    origin === "https://ranklocal.site" ||
    origin === "";

  return {
    "Access-Control-Allow-Origin": allowed ? (origin || "*") : "https://www.ranklocal.site",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS(req: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(req),
  });
}

export async function POST(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Please provide both email and password." },
        { status: 400, headers: corsHeaders }
      );
    }

    const result = await authenticateCredentials(email, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401, headers: corsHeaders }
      );
    }

    // Guard against unexpected missing session/profile fields
    if (!result.session?.access_token || !result.profile) {
      return NextResponse.json(
        { success: false, error: "Authentication failed. Please try again." },
        { status: 500, headers: corsHeaders }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
        user: result.user,
        session: result.session,
        profile: result.profile,
        source: result.source,
      },
      { headers: corsHeaders }
    );

    const isSecure = process.env.NODE_ENV === "production";
    const token = result.session.access_token;
    const status = result.profile.status || "approved";

    const host = req.headers.get("host") || "";
    const isRankLocal = host.includes("ranklocal.site");

    // Set authoritative auth cookies for middleware & client
    const hostOpts = {
      path: "/",
      maxAge: 604800,
      sameSite: "lax" as const,
      secure: isSecure,
    };
    response.cookies.set("ranklocal_token", token, hostOpts);
    response.cookies.set("ranklocal_status", status, hostOpts);
    response.cookies.set("altofox_token", token, hostOpts);
    response.cookies.set("altofox_status", status, hostOpts);

    if (isRankLocal) {
      const domainOpts = { ...hostOpts, domain: ".ranklocal.site" };
      response.cookies.set("ranklocal_token", token, domainOpts);
      response.cookies.set("ranklocal_status", status, domainOpts);
      response.cookies.set("altofox_token", token, domainOpts);
      response.cookies.set("altofox_status", status, domainOpts);
    }

    return response;
  } catch (error: any) {
    console.error("[Login API] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during sign-in." },
      { status: 500, headers: corsHeaders }
    );
  }
}
