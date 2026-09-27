import { NextRequest, NextResponse } from "next/server";
import { getThemeById } from "@/lib/themes";
import { WebsiteFormData, computeTargetPages } from "@/lib/generator/prompt";
import { buildDefaultTradeContentJSON } from "@/lib/generator/ai-content-prompt";
import { assembleWebsite } from "@/templates/assembler";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const themeId = searchParams.get("themeId") || "modern-local-pro";
    const theme = getThemeById(themeId);

    // Realistic sample home-service business: Austin Premier Plumbing
    const sampleFormData: WebsiteFormData = {
      businessName: "Austin Premier Plumbing",
      businessType: "Plumber",
      businessDescription:
        "Licensed master plumbers providing 24/7 emergency dispatch, drain cleaning, water heater repair, and sewer line inspections across Austin and surrounding counties.",
      services: [
        "Emergency Plumbing Repair",
        "Water Heater Replacement",
        "Drain Cleaning & Hydro-Jetting",
        "Slab Leak Detection",
        "Sewer Line Inspection",
        "Commercial Plumbing Services",
      ],
      city: "Austin",
      stateRegion: "TX",
      phone: "(512) 890-4321",
      email: "service@austinpremierplumbing.com",
      streetAddress: "1401 S Congress Ave",
      zipPostalCode: "78704",
      yearsInBusiness: "18+ Years",
      uniqueSellingPoints: "45-min emergency arrival, upfront flat rates, 100% satisfaction guarantee",
      serviceAreas: "Austin, Round Rock, Cedar Park, Pflugerville, Georgetown, Buda",
      targetKeywords: "plumber austin tx, emergency plumber austin, water heater repair austin, drain cleaning austin tx",
      pagesToCreate: ["Home", "About", "Services", "Contact", "FAQ"],
      theme: theme,
    };

    const targetPages = computeTargetPages(sampleFormData);
    const contentJSON = buildDefaultTradeContentJSON(sampleFormData, targetPages);

    const assembled = await assembleWebsite(contentJSON, theme, {
      domain: "austinpremierplumbing.com",
      serviceAreaCities: [
        { city: "Round Rock", stateId: "TX", county: "Williamson", lat: 30.5083, lng: -97.6789 },
        { city: "Cedar Park", stateId: "TX", county: "Williamson", lat: 30.5052, lng: -97.8203 },
        { city: "Pflugerville", stateId: "TX", county: "Travis", lat: 30.4548, lng: -97.6223 },
        { city: "Georgetown", stateId: "TX", county: "Williamson", lat: 30.6333, lng: -97.6778 },
      ],
    });

    const rawIndexHtml = assembled.files.find((f) => f.path === "index.html")?.content || "";
    const rawStyleCss = assembled.files.find((f) => f.path === "css/style.css")?.content || "";

    const indexHtml = typeof rawIndexHtml === "string" ? rawIndexHtml : rawIndexHtml.toString("utf8");
    const styleCss = typeof rawStyleCss === "string" ? rawStyleCss : rawStyleCss.toString("utf8");

    // Inline CSS for instant iframe rendering without external asset dependencies
    let standAloneHtml = indexHtml;
    if (styleCss) {
      standAloneHtml = standAloneHtml.replace(
        /<link[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']*style\.css["'][^>]*>/i,
        `<style>${styleCss}</style>`
      );
    }

    return NextResponse.json({
      success: true,
      theme: {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        designCharacteristics: theme.designCharacteristics || [],
        fonts: theme.fonts,
        colors: theme.colors,
      },
      html: standAloneHtml,
    });
  } catch (err: any) {
    console.error("[Theme Preview API] Error generating theme preview:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to generate theme preview" },
      { status: 500 }
    );
  }
}
