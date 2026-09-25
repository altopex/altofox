import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { source, apiKey } = body;

    const trimmedKey = (apiKey || "").trim();
    if (source === "bing") {
      return NextResponse.json({
        success: true,
        message: "Bing Free Image CDN is active! Generates high-relevance keyword photos with zero API keys required.",
      });
    }

    if (!trimmedKey) {
      return NextResponse.json(
        { success: false, message: "Please provide an API key to test." },
        { status: 400 }
      );
    }

    if (source === "pexels") {
      try {
        const res = await fetch("https://api.pexels.com/v1/curated?per_page=1", {
          headers: {
            Authorization: trimmedKey,
          },
        });

        if (res.status === 200) {
          const data = await res.json();
          if (Array.isArray(data?.photos)) {
            return NextResponse.json({
              success: true,
              message: "Connected to Pexels! Your API key is active and ready to fetch photos.",
            });
          }
        }

        if (res.status === 401 || res.status === 403) {
          return NextResponse.json({
            success: false,
            message: "Authentication failed. Please verify your Pexels API key.",
          });
        }

        return NextResponse.json({
          success: false,
          message: `Pexels returned status ${res.status}. Please check your key.`,
        });
      } catch (err) {
        return NextResponse.json({
          success: false,
          message: err instanceof Error ? err.message : "Network error contacting Pexels API.",
        });
      }
    }

    if (source === "pixabay") {
      try {
        const res = await fetch(
          `https://pixabay.com/api/?key=${encodeURIComponent(trimmedKey)}&q=plumbing&per_page=3`
        );

        if (res.status === 200) {
          const data = await res.json();
          if (Array.isArray(data?.hits)) {
            return NextResponse.json({
              success: true,
              message: "Connected to Pixabay! Your API key is active and ready to fetch photos.",
            });
          }
        }

        const errText = await res.text();
        return NextResponse.json({
          success: false,
          message: errText || `Pixabay returned status ${res.status}. Please verify your key.`,
        });
      } catch (err) {
        return NextResponse.json({
          success: false,
          message: err instanceof Error ? err.message : "Network error contacting Pixabay API.",
        });
      }
    }

    return NextResponse.json(
      { success: false, message: "Invalid image source. Must be 'bing', 'pexels', or 'pixabay'." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Test image key error:", error);
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Error testing image API key.",
      },
      { status: 500 }
    );
  }
}
