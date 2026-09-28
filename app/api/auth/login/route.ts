import { NextRequest, NextResponse } from "next/server";
import { authenticateCredentials } from "@/lib/auth/auth-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Please provide both email and password." },
        { status: 400 }
      );
    }

    const result = await authenticateCredentials(email, password);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      success: true,
      user: result.user,
      session: result.session,
      profile: result.profile,
      source: result.source,
    });

    const isSecure = process.env.NODE_ENV === "production";
    const token = result.session.access_token;
    const status = result.profile.status || "approved";

    // Set authoritative auth cookies for middleware & client
    response.cookies.set("ranklocal_token", token, {
      path: "/",
      maxAge: 604800,
      sameSite: "lax",
      secure: isSecure,
    });
    response.cookies.set("ranklocal_status", status, {
      path: "/",
      maxAge: 604800,
      sameSite: "lax",
      secure: isSecure,
    });
    response.cookies.set("altofox_token", token, {
      path: "/",
      maxAge: 604800,
      sameSite: "lax",
      secure: isSecure,
    });
    response.cookies.set("altofox_status", status, {
      path: "/",
      maxAge: 604800,
      sameSite: "lax",
      secure: isSecure,
    });

    return response;
  } catch (error: any) {
    console.error("[Login API] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during sign-in." },
      { status: 500 }
    );
  }
}
