import { NextResponse } from "next/server";
import { getHostingCredentialsStatus } from "@/lib/publishing/credential-store";
import { HostingProviderType } from "@/lib/publishing/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const providers: HostingProviderType[] = ["cloudflare", "vercel", "netlify", "github"];
    const statusMap: Record<string, any> = {};

    for (const p of providers) {
      statusMap[p] = await getHostingCredentialsStatus(p);
    }

    return NextResponse.json({
      success: true,
      providers: statusMap,
    });
  } catch (error: any) {
    console.error("[Hosting Status API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to retrieve hosting credentials status",
      },
      { status: 500 }
    );
  }
}
