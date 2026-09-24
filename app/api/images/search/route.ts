import { NextRequest, NextResponse } from "next/server";
import { resolveStockPhoto, StockPhotoSearchOptions } from "@/lib/photos/stock-service";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      query,
      alt,
      slot = "service",
      preferredSource = "pexels",
      pexelsKey,
      pixabayKey,
      usedPhotoIds = [],
      tradeCategory,
      businessName,
      city,
      index = 0,
    } = body;

    const usedSet = new Set<string>(Array.isArray(usedPhotoIds) ? usedPhotoIds : []);

    const photo = await resolveStockPhoto({
      query: (query || "").trim(),
      alt: (alt || "").trim(),
      slot,
      preferredSource,
      pexelsKey: pexelsKey?.trim() || undefined,
      pixabayKey: pixabayKey?.trim() || undefined,
      usedPhotoIds: usedSet,
      tradeCategory,
      city,
      businessName,
      index,
    });

    return NextResponse.json({
      success: true,
      photo,
    });
  } catch (error) {
    console.error("Stock photo search error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to search stock photos.",
      },
      { status: 500 }
    );
  }
}
