import { NextRequest, NextResponse } from "next/server";
import { listHostingDestinations, HostingProviderType } from "@/lib/publishing/publishing-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider = "cloudflare", credentials = {} } = body || {};

    const destinations = await listHostingDestinations(provider as HostingProviderType, {
      provider,
      ...credentials,
    });

    return NextResponse.json({ success: true, destinations });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        destinations: [],
        error: error instanceof Error ? error.message : "Failed to list destinations.",
      },
      { status: 500 }
    );
  }
}
