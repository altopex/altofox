import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "Missing image url parameter" }, { status: 400 });
    }

    // Security check: only allow images from known stock providers or standard image CDNs
    const parsed = new URL(url);
    const allowedHosts = [
      "images.pexels.com",
      "pixabay.com",
      "cdn.pixabay.com",
      "images.unsplash.com",
    ];

    const isAllowed = allowedHosts.some(
      (h) => parsed.hostname === h || parsed.hostname.endsWith("." + h)
    );

    if (!isAllowed) {
      return NextResponse.json(
        { error: "Forbidden host for image proxy" },
        { status: 403 }
      );
    }

    const res = await fetch(url, {
      headers: {
        "User-Agent": "AltoFox-Static-Website-Builder/1.0",
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream returned status ${res.status}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, immutable",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error("Image proxy error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to proxy image" },
      { status: 500 }
    );
  }
}
