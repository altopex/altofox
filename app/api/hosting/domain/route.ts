import { NextRequest, NextResponse } from "next/server";
import { connectHostingDomain, HostingProviderType } from "@/lib/publishing/publishing-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      provider = "cloudflare",
      domain,
      projectName,
      credentials = {},
    } = body || {};

    if (!domain || typeof domain !== "string" || !domain.trim()) {
      return NextResponse.json(
        { success: false, message: "Domain name is required." },
        { status: 400 }
      );
    }

    if (!projectName || typeof projectName !== "string" || !projectName.trim()) {
      return NextResponse.json(
        { success: false, message: "Project / Site name is required." },
        { status: 400 }
      );
    }

    const result = await connectHostingDomain(
      provider as HostingProviderType,
      domain.trim(),
      projectName.trim(),
      {
        provider,
        ...credentials,
      }
    );

    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Failed to connect domain.",
      },
      { status: 500 }
    );
  }
}
