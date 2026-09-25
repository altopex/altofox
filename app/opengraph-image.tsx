import { ImageResponse } from "next/og";
import { BRAND } from "@/config/brand";

export const runtime = "edge";
export const alt = "RankLocal — AI Static Website Builder for Local SEO";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          backgroundColor: "#0B0F19",
          backgroundImage:
            "radial-gradient(circle at 15% 20%, rgba(79, 70, 229, 0.28) 0%, transparent 45%), radial-gradient(circle at 85% 80%, rgba(16, 185, 129, 0.15) 0%, transparent 40%)",
          padding: "60px 80px",
          fontFamily: "system-ui, -apple-system, sans-serif",
          color: "#FFFFFF",
        }}
      >
        {/* Top Bar: Brand Pill & Domain */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "10px 22px",
              borderRadius: "999px",
              backgroundColor: "rgba(79, 70, 229, 0.15)",
              border: "1px solid rgba(99, 102, 241, 0.35)",
            }}
          >
            <div
              style={{
                width: "10px",
                height: "10px",
                borderRadius: "50%",
                backgroundColor: "#10B981",
              }}
            />
            <span style={{ fontSize: "20px", fontWeight: "700", color: "#818CF8", letterSpacing: "0.05em" }}>
              LOCAL SEO STATIC BUILDER
            </span>
          </div>

          <span style={{ fontSize: "22px", fontWeight: "600", color: "#94A3B8" }}>
            {BRAND.domain}
          </span>
        </div>

        {/* Center: Main Brand Typography & Value Hook */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "980px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            {/* SVG Pin Icon */}
            <svg width="68" height="68" viewBox="0 0 40 40" fill="none">
              <path
                d="M20 4C12.82 4 7 9.82 7 17C7 26.2 18.5 35.2 19.35 35.85C19.74 36.15 20.26 36.15 20.65 35.85C21.5 35.2 33 26.2 33 17C33 9.82 27.18 4 20 4Z"
                fill="#4F46E5"
              />
              <circle cx="20" cy="17" r="9" fill="#0B0F19" fillOpacity="0.45" />
              <rect x="14" y="19" width="3" height="4" rx="1" fill="#FFFFFF" fillOpacity="0.75" />
              <rect x="18.5" y="15.5" width="3" height="7.5" rx="1" fill="#FFFFFF" fillOpacity="0.9" />
              <path d="M23 12H27V16M26.5 12.5L18.5 20.5" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
            </svg>

            <span style={{ fontSize: "64px", fontWeight: "900", letterSpacing: "-0.03em" }}>
              Rank<span style={{ color: "#818CF8" }}>Local</span>
            </span>
          </div>

          <h1
            style={{
              fontSize: "46px",
              fontWeight: "800",
              lineHeight: "1.15",
              color: "#F8FAFC",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            Local Websites Engineered to Dominate Google Search.
          </h1>

          <p style={{ fontSize: "24px", color: "#94A3B8", margin: 0, lineHeight: "1.4" }}>
            20 trade niche packs · Multi-suburb location pages · Schema.org markup · Zero WordPress bloat
          </p>
        </div>

        {/* Footer Features row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "36px",
            borderTop: "1px solid rgba(148, 163, 184, 0.15)",
            paddingTop: "24px",
            width: "100%",
          }}
        >
          <span style={{ fontSize: "18px", color: "#CBD5E1", fontWeight: "600" }}>✓ 100% Static HTML</span>
          <span style={{ fontSize: "18px", color: "#CBD5E1", fontWeight: "600" }}>✓ Sub-Second Lighthouse Speed</span>
          <span style={{ fontSize: "18px", color: "#CBD5E1", fontWeight: "600" }}>✓ Free Commercial Photography</span>
          <span style={{ fontSize: "18px", color: "#CBD5E1", fontWeight: "600" }}>✓ Google Search Console Ready</span>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
