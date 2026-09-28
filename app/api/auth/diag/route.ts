import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { authenticateCredentials } from "@/lib/auth/auth-service";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const testPass = url.searchParams.get("pass") || "AltofoxRuss2026!#";
  const testEmail = url.searchParams.get("email") || "russ@altopex.com";

  let dbUsers: any[] = [];
  let dbError: string | null = null;
  try {
    dbUsers = await db.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        plan: true,
        passwordHash: true,
      },
    });
  } catch (e: any) {
    dbError = e?.message || String(e);
  }

  let authResult: any = null;
  try {
    authResult = await authenticateCredentials(testEmail, testPass);
  } catch (e: any) {
    authResult = { exception: e?.message || String(e) };
  }

  return NextResponse.json({
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      HAS_OWNER_PASSWORD: Boolean(process.env.OWNER_PASSWORD),
      OWNER_PASSWORD_VAL: process.env.OWNER_PASSWORD ? `${process.env.OWNER_PASSWORD.slice(0, 3)}***` : "none",
      DATABASE_URL_PREFIX: (process.env.DATABASE_URL || "").slice(0, 20),
    },
    dbUsersCount: dbUsers.length,
    dbUsers: dbUsers.map((u) => ({
      ...u,
      passwordHashPrefix: u.passwordHash ? u.passwordHash.slice(0, 10) : null,
    })),
    dbError,
    authResultTest: {
      success: authResult?.success,
      source: authResult?.source,
      error: authResult?.error,
      exception: authResult?.exception,
    },
  });
}
