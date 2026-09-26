import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const reportPath = path.join(process.cwd(), "checker-report", "results.json");
    if (!fs.existsSync(reportPath)) {
      return NextResponse.json(
        { success: false, error: "No checker report found. Please run the site checker first." },
        { status: 404 }
      );
    }

    const raw = fs.readFileSync(reportPath, "utf8");
    const data = JSON.parse(raw);
    return NextResponse.json({ success: true, results: data });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load checker report." },
      { status: 500 }
    );
  }
}
