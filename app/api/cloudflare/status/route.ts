import { NextResponse } from "next/server";
import { getCloudflareStatus } from "@/lib/cloudflare/cloudflare-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await getCloudflareStatus();
    return NextResponse.json({ success: true, ...status });
  } catch (error: any) {
    console.error("[Cloudflare Status API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        connected: false,
        error: error?.message || "Failed to retrieve Cloudflare status",
      },
      { status: 500 }
    );
  }
}
