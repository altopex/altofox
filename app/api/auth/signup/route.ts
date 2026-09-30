import { NextRequest, NextResponse } from "next/server";
import { db, ensureDbInitialized } from "@/lib/db";
import bcrypt from "bcryptjs";
import { signUserSessionToken } from "@/lib/auth/auth-service";
import { Profile, UserRole, UserStatus } from "@/lib/supabase/types";
import { User } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Requested-With",
};

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders,
  });
}

// RFC 5322 compliant email regex
const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON request payload." },
        { status: 400, headers: corsHeaders }
      );
    }

    const { email, password, fullName, companyName, plan = "starter" } = body;

    const cleanEmail = (typeof email === "string" ? email : "").trim().toLowerCase();
    const cleanPassword = typeof password === "string" ? password : "";
    const cleanFullName = (typeof fullName === "string" ? fullName : "").trim();
    const cleanCompany = (typeof companyName === "string" ? companyName : "").trim();
    const chosenPlan = plan === "agency" ? "agency" : "starter";
    const websiteLimit = chosenPlan === "agency" ? 30 : 5;

    // 1. Request Validation
    if (!cleanEmail) {
      return NextResponse.json(
        { error: "Email address is required." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!EMAIL_REGEX.test(cleanEmail)) {
      return NextResponse.json(
        { error: "Please enter a valid email address (e.g. yourname@company.com)." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!cleanFullName || cleanFullName.length < 2) {
      return NextResponse.json(
        { error: "Please enter your full name (at least 2 characters)." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!cleanPassword || cleanPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long." },
        { status: 400, headers: corsHeaders }
      );
    }

    await ensureDbInitialized().catch(() => {});

    // 2. Check if email is already registered in local SQLite database
    const existingUser = await db.user.findUnique({
      where: { email: cleanEmail },
    }).catch(() => null);

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please sign in or reset your password." },
        { status: 409, headers: corsHeaders }
      );
    }

    // 3. Determine role and status
    const isOwnerTarget =
      cleanEmail === "russ@altopex.com" ||
      cleanEmail === "russell@altopex.com" ||
      cleanEmail === "admin@ranklocal.site" ||
      cleanEmail === "admin@altopex.com";

    const userRole = isOwnerTarget ? "owner" : "editor";
    const userStatus = "approved";
    const userPlan = isOwnerTarget ? "unlimited" : chosenPlan;
    const userLimit = isOwnerTarget ? 999999 : websiteLimit;

    // 4. Create user in SQLite
    const passwordHash = bcrypt.hashSync(cleanPassword, 10);
    const newUserId = isOwnerTarget
      ? "usr-owner-russ-altopex"
      : `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    let createdUser: any = null;
    try {
      createdUser = await db.user.create({
        data: {
          id: newUserId,
          email: cleanEmail,
          passwordHash,
          fullName: cleanFullName,
          companyName: cleanCompany || null,
          role: userRole,
          status: userStatus,
          plan: userPlan,
          websiteLimit: userLimit,
        },
      });
    } catch {
      createdUser = {
        id: newUserId,
        email: cleanEmail,
        passwordHash,
        fullName: cleanFullName,
        companyName: cleanCompany || null,
        role: userRole,
        status: userStatus,
        plan: userPlan,
        websiteLimit: userLimit,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    // 5. Generate authenticated session token
    const token = await signUserSessionToken(createdUser);

    const profile: Profile = {
      id: createdUser.id,
      email: createdUser.email,
      full_name: createdUser.fullName,
      avatar_url: null,
      role: createdUser.role as UserRole,
      status: createdUser.status as UserStatus,
      company_name: createdUser.companyName,
      plan: createdUser.plan as any,
      website_limit: createdUser.websiteLimit,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
    };

    const authUser: User = {
      id: createdUser.id,
      app_metadata: {},
      user_metadata: {
        full_name: profile.full_name,
        role: profile.role,
        status: profile.status,
        company_name: profile.company_name,
      },
      aud: "authenticated",
      created_at: profile.created_at,
      email: profile.email,
    };

    const session = {
      access_token: token,
      token_type: "bearer",
      expires_in: 7 * 86400,
      expires_at: Math.floor(Date.now() / 1000) + 7 * 86400,
      user: authUser,
    };

    // 6. Return response with authoritative cookies
    const response = NextResponse.json(
      {
        success: true,
        userId: createdUser.id,
        user: authUser,
        session,
        profile,
        status: userStatus,
        role: userRole,
        message: "Account registered successfully.",
      },
      { status: 201, headers: corsHeaders }
    );

    const isSecure = process.env.NODE_ENV === "production";
    const host = req.headers.get("host") || "";
    const isRankLocal = host.includes("ranklocal.site");

    const hostOpts = {
      path: "/",
      sameSite: "lax" as const,
      maxAge: 604800,
      secure: isSecure,
    };

    response.cookies.set("ranklocal_token", token, hostOpts);
    response.cookies.set("altofox_token", token, hostOpts);
    response.cookies.set("ranklocal_status", userStatus, hostOpts);
    response.cookies.set("altofox_status", userStatus, hostOpts);

    if (isRankLocal) {
      const domainOpts = { ...hostOpts, domain: ".ranklocal.site" };
      response.cookies.set("ranklocal_token", token, domainOpts);
      response.cookies.set("altofox_token", token, domainOpts);
      response.cookies.set("ranklocal_status", userStatus, domainOpts);
      response.cookies.set("altofox_status", userStatus, domainOpts);
    }

    return response;
  } catch (err: any) {
    console.error("[SignUp Route] Error creating user:", err);
    return NextResponse.json(
      { error: err.message || "Failed to create account. Please try again." },
      { status: 500, headers: corsHeaders }
    );
  }
}
