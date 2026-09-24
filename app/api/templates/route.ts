import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const templates = await db.template.findMany({
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load templates" },
      { status: 500 }
    );
  }
}
