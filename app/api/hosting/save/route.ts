import { NextRequest, NextResponse } from "next/server";
import { saveStoredHostingCredentials } from "@/lib/publishing/credential-store";
import { testHostingConnection } from "@/lib/publishing/publishing-service";
import { HostingProviderType } from "@/lib/publishing/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, apiToken, accountId, teamId, owner } = body || {};

    if (!provider || !["cloudflare", "vercel", "netlify", "github"].includes(provider)) {
      return NextResponse.json(
        { success: false, error: "Invalid provider specified." },
        { status: 400 }
      );
    }

    if (!apiToken || typeof apiToken !== "string" || !apiToken.trim()) {
      return NextResponse.json(
        { success: false, error: "API token is required." },
        { status: 400 }
      );
    }

    const creds = {
      apiToken: apiToken.trim(),
      accountId: accountId ? String(accountId).trim() : undefined,
      teamId: teamId ? String(teamId).trim() : undefined,
      owner: owner ? String(owner).trim() : undefined,
    };

    // 1. Verify token by testing connection first
    const testResult = await testHostingConnection(provider as HostingProviderType, creds);
    if (!testResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: testResult.message || `Failed to authenticate with ${provider}.`,
        },
        { status: 401 }
      );
    }

    // 2. Save encrypted credentials
    await saveStoredHostingCredentials(provider as HostingProviderType, creds);

    return NextResponse.json({
      success: true,
      message: `Successfully connected and saved ${provider} credentials.`,
      accountName: testResult.accountName,
    });
  } catch (error: any) {
    console.error("[Hosting Save API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to save hosting credentials.",
      },
      { status: 500 }
    );
  }
}
