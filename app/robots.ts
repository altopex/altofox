import { MetadataRoute } from "next";
import { BRAND } from "@/config/brand";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/dashboard/", "/pending/"],
    },
    sitemap: `${BRAND.siteUrl}/sitemap.xml`,
  };
}
