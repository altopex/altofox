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
  
  // Clear all auth cookies
  const cookieNames = ["ranklocal_token", "ranklocal_status", "altofox_token", "altofox_status"];
  for (const name of cookieNames) {
    response.cookies.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
    });
  }

  return response;
}

export async function GET(req: NextRequest) {
  return POST(req);
}
