import { NextRequest, NextResponse } from "next/server";
import {
  saveCloudflareCredentials,
  verifyCloudflareConnection,
} from "@/lib/cloudflare/cloudflare-service";
import { maskApiKey } from "@/lib/ai/encryption";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiToken, accountId, accountName } = body || {};

    if (!apiToken || typeof apiToken !== "string" || !apiToken.trim()) {
      return NextResponse.json(
        { success: false, error: "Cloudflare API Token is required." },
        { status: 400 }
      );
    }

    if (!accountId || typeof accountId !== "string" || !accountId.trim()) {
      return NextResponse.json(
        { success: false, error: "Cloudflare Account ID is required." },
        { status: 400 }
      );
    }

    const cleanToken = apiToken.trim();
    const cleanAccount = accountId.trim();
    const cleanName = accountName?.trim() || undefined;

    // Verify token with Cloudflare API before saving
    const verify = await verifyCloudflareConnection(cleanToken, cleanAccount);
    if (!verify.valid) {
      return NextResponse.json(
        {
          success: false,
          error:
            verify.error ||
            "Failed to verify credentials with Cloudflare. Please check token permissions and account ID.",
        },
        { status: 400 }
      );
    }

    const resolvedAccountName = cleanName || verify.accountName || "Connected Account";

    // Encrypt and persist
    await saveCloudflareCredentials(cleanToken, cleanAccount, resolvedAccountName);

    return NextResponse.json({
      success: true,
      accountName: resolvedAccountName,
      accountId: cleanAccount,
      maskedToken: maskApiKey(cleanToken),
      message: "Cloudflare credentials saved securely.",
    });
  } catch (error: any) {
    console.error("[Cloudflare Save API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to save Cloudflare credentials.",
      },
      { status: 500 }
    );
  }
}
