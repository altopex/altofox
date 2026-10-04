import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

export async function POST(req: NextRequest) {
  const response = NextResponse.json(
    { success: true, message: "Logged out successfully" },
    { headers: corsHeaders }
  );
  
  const host = req.headers.get("host") || "";
  const isRankLocal = host.includes("ranklocal.site");

  // Clear all auth cookies (both host-only and wildcard domain)
  const cookieNames = [
    "ranklocal_token",
    "ranklocal_status",
    "altofox_token",
    "altofox_status",
    "sb-access-token",
    "sb-refresh-token",
  ];

  for (const name of cookieNames) {
    // 1. Host-only clear
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });

    // 2. Wildcard domain clear
    if (isRankLocal) {
      response.cookies.set(name, "", {
        path: "/",
        domain: ".ranklocal.site",
        maxAge: 0,
        expires: new Date(0),
      });
    }
  }

  return response;
}

export async function GET(req: NextRequest) {
  return POST(req);
}
