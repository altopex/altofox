import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { DEFAULT_TEMPLATES } from "@/lib/templates";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let templates = await db.template.findMany({
      orderBy: { createdAt: "asc" },
    });

    // If database was just created or unseeded in production, seed default templates
    if (templates.length === 0) {
      try {
        await Promise.all(
          DEFAULT_TEMPLATES.map((t) => db.template.create({ data: t }))
        );
        templates = await db.template.findMany({
          orderBy: { createdAt: "asc" },
        });
      } catch {
        // Fallback in-memory if DB write is temporarily unavailable
        return NextResponse.json({
          success: true,
          templates: DEFAULT_TEMPLATES.map((t, idx) => ({
            id: `default-${idx}`,
            ...t,
            createdAt: new Date().toISOString(),
          })),
        });
      }
    }

    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error("Error fetching templates:", error);
    // Return default templates so the UI never breaks
    return NextResponse.json({
      success: true,
      templates: DEFAULT_TEMPLATES.map((t, idx) => ({
        id: `default-${idx}`,
        ...t,
        createdAt: new Date().toISOString(),
      })),
    });
  }
}

