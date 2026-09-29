import { NextRequest, NextResponse } from "next/server";
import {
  addCustomDomain,
  verifyCustomDomain,
  sanitizePagesProjectName,
} from "@/lib/cloudflare/cloudflare-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { projectName, domain, action = "add" } = body || {};

    if (!projectName || typeof projectName !== "string" || !projectName.trim()) {
      return NextResponse.json(
        { success: false, error: "Project name is required." },
        { status: 400 }
      );
    }

    if (!domain || typeof domain !== "string" || !domain.trim()) {
      return NextResponse.json(
        { success: false, error: "Custom domain name is required." },
        { status: 400 }
      );
    }

    const cleanProject = sanitizePagesProjectName(projectName);
    const cleanDomain = domain.toLowerCase().trim().replace(/^https?:\/\//, "").replace(/\/+$/, "");

    if (action === "verify") {
      const result = await verifyCustomDomain({
        projectName: cleanProject,
        domain: cleanDomain,
      });
      return NextResponse.json({ ...result });
    } else {
      const result = await addCustomDomain({
        projectName: cleanProject,
        domain: cleanDomain,
      });
      return NextResponse.json({ ...result });
    }
  } catch (error: any) {
    console.error("[Cloudflare Domain API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Failed to process custom domain request.",
      },
      { status: 500 }
    );
  }
}
