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
      status: auth.profile.status,
      isApproved: auth.isApproved,
      role: auth.profile.role,
      fullName: auth.profile.full_name,
      email: auth.user.email,
    });

    // Keep the cookie refreshed with current status
    response.cookies.set("altofox_status", auth.profile.status, {
      path: "/",
      maxAge: 604800,
      sameSite: "lax",
    });

    return response;
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
