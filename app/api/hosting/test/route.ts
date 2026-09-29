import { NextRequest, NextResponse } from "next/server";
import { testHostingConnection, HostingProviderType } from "@/lib/publishing/publishing-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider = "cloudflare", credentials = {} } = body || {};

    const result = await testHostingConnection(provider as HostingProviderType, {
      provider,
      ...credentials,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to test hosting connection.",
      },
      { status: 500 }
    );
  }
}
