import { NextRequest, NextResponse } from "next/server";
import { authenticateServerRequest } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateServerRequest(req);
    if (!auth) {
      return NextResponse.json({ authenticated: false, status: null }, { status: 401 });
    }

    const response = NextResponse.json({
      authenticated: true,
      id: auth.user.id,
      token: auth.accessToken,
      status: auth.profile.status,
      isApproved: auth.isApproved,
      role: auth.profile.role,
      fullName: auth.profile.full_name,
      email: auth.user.email,
    });

    const host = req.headers.get("host") || "";
    const isRankLocal = host.includes("ranklocal.site");
    const isSecure = process.env.NODE_ENV === "production";

    // Set host-only cookie for standard cross-browser reliability
    const hostOpts = {
      path: "/",
      maxAge: 604800,
      sameSite: "lax" as const,
      secure: isSecure,
    };

    response.cookies.set("ranklocal_status", auth.profile.status, hostOpts);
    response.cookies.set("altofox_status", auth.profile.status, hostOpts);
    response.cookies.set("ranklocal_token", auth.accessToken, hostOpts);
    response.cookies.set("altofox_token", auth.accessToken, hostOpts);

    // If on ranklocal.site, also set wildcard domain cookie
    if (isRankLocal) {
      const domainOpts = { ...hostOpts, domain: ".ranklocal.site" };
      response.cookies.set("ranklocal_status", auth.profile.status, domainOpts);
      response.cookies.set("altofox_status", auth.profile.status, domainOpts);
      response.cookies.set("ranklocal_token", auth.accessToken, domainOpts);
      response.cookies.set("altofox_token", auth.accessToken, domainOpts);
    }

    return response;
  } catch {
    // Do not expose internal error details to clients
    return NextResponse.json({ authenticated: false, status: null }, { status: 500 });
  }
}
