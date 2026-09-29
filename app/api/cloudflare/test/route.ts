import { NextRequest, NextResponse } from "next/server";
import { verifyCloudflareConnection } from "@/lib/cloudflare/cloudflare-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      // Body may be empty if testing saved credentials
    }

    const { apiToken, accountId } = body || {};

    const result = await verifyCloudflareConnection(apiToken, accountId);

    if (!result.valid) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          error: result.error || "Cloudflare credential verification failed.",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      valid: true,
      accountName: result.accountName,
      accountId: result.accountId,
    });
  } catch (error: any) {
    console.error("[Cloudflare Test API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        error: error?.message || "Internal server error testing Cloudflare connection.",
      },
      { status: 500 }
    );
  }
}
