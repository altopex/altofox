import { assembleWebsite } from "../templates/assembler";
import { THEMES } from "../lib/themes";
import { BlogPostData } from "../lib/blog/blog-engine";
import {
  buildConnectivityGraphFromHtmlFiles,
  integrateNewPageIntoProject,
} from "../lib/seo/connectivity-engine";

async function runBlogInternalLinkingTests() {
  console.log("==================================================");
  console.log("🧪 TESTING BLOG INTERNAL LINKING & CONNECTIVITY ENGINE");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, desc: string) {
    if (condition) {
      console.log(`✅ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${desc}`);
      failed++;
    }
  }

  const theme = THEMES[0]; // Modern Local Pro

  const demoBlogPosts: BlogPostData[] = [
    {
      title: "5 Early Warning Signs Your Drain Needs Immediate Cleaning",
      slug: "warning-signs-drain-cleaning",
      primaryKeyword: "drain cleaning warning signs",
      secondaryKeywords: ["emergency plumber", "Dallas drain cleaning"],
      metaDescription: "Notice slow drains, gurgling pipes, or foul odors? Learn the top warning signs before a main sewer line backup occurs.",
      datePublished: "Oct 12, 2026",
      dateModified: "Oct 14, 2026",
      authorName: "Master Technician John",
      authorBio: "Master-certified local drain and sewer specialist.",
      wordCount: 1450,
      contentHtml: "<h2>Recognizing Sewer & Drain Symptoms Early</h2><p>Gurgling sounds and sluggish sink drainage often point directly to tree root intrusions or heavy grease accumulation inside older stack pipes.</p>",
      faqs: [{ question: "Can chemical drain cleaners clear tree roots?", answer: "No, chemical cleaners degrade PVC and copper without cutting through root masses." }],
      relatedSlugs: ["understanding-water-heater-costs", "emergency-plumber-guide"],
      imageUrl: "images/vector-article-1.svg",
      imageAlt: "Technician inspecting residential drain pipe",
    },
    {
      title: "How Much Does Water Heater Repair Typically Cost in Dallas?",
      slug: "understanding-water-heater-costs",
      primaryKeyword: "water heater repair cost",
      secondaryKeywords: ["transparent pricing", "Dallas plumbing"],
      metaDescription: "An honest breakdown of parts, diagnostic fees, and efficiency factors that influence repair versus replacement decisions.",
      datePublished: "Oct 08, 2026",
      dateModified: "Oct 10, 2026",
      authorName: "Master Technician John",
      authorBio: "Master-certified local drain and sewer specialist.",
      wordCount: 1520,
      contentHtml: "<h2>Key Cost Drivers for Water Heating Systems</h2><p>When weighing heating element replacement versus full tank changeouts, age is the determining metric.</p>",
      faqs: [{ question: "How long do traditional water heaters last?", answer: "Traditional tank heaters average 8 to 12 years with routine anode rod maintenance." }],
      relatedSlugs: ["warning-signs-drain-cleaning", "emergency-plumber-guide"],
      imageUrl: "images/vector-article-2.svg",
      imageAlt: "Transparent heating consultation and estimate",
    },
    {
      title: "When to Call an Emergency Plumber vs. Waiting for Regular Hours",
      slug: "emergency-plumber-guide",
      primaryKeyword: "emergency plumber",
      secondaryKeywords: ["24/7 service", "slab leak help"],
      metaDescription: "Learn how to triage urgent home hazards like active slab leaks versus minor faucet drips that can wait.",
      datePublished: "Sep 28, 2026",
      dateModified: "Oct 01, 2026",
      authorName: "Master Technician John",
      authorBio: "Master-certified local drain and sewer specialist.",
      wordCount: 1380,
      contentHtml: "<h2>Triage Urgency: Burst Pipes vs. Minor Seepage</h2><p>Active flooding or gas odors require emergency response, whereas dripping faucets can be isolated at the fixture valve.</p>",
      faqs: [{ question: "What is the first step during an active pipe burst?", answer: "Turn off your home's main water meter immediately." }],
      relatedSlugs: ["warning-signs-drain-cleaning", "understanding-water-heater-costs"],
      imageUrl: "images/vector-article-3.svg",
      imageAlt: "Emergency dispatch van arriving on scene",
    },
  ];

  const siteData: any = {
    site: {
      businessName: "Lone Star Flow Masters",
      trade: "Plumber",
      niche: "Plumbing",
      phone: "(214) 555-0199",
      email: "service@lonestarflow.com",
      address: {
        street: "1200 Main St",
        city: "Dallas",
        state: "TX",
        zip: "75201",
      },
      serviceAreas: "Dallas, Highland Park, University Park, Plano, Richardson",
    },
    pages: [
      {
        slug: "index",
        seo: {
          title: "Lone Star Flow Masters | Premier Dallas Plumbers",
          h1: "Fast, Reliable Residential Plumbing in Dallas, TX",
          description: "Top-rated master plumbing services with 45-minute emergency dispatch.",
        },
        sections: [
          { type: "hero", content: {} },
          { type: "services", content: {} },
          { type: "about", content: {} },
          { type: "testimonials", content: {} },
          { type: "ctaBanner", content: {} },
        ],
      },
      {
        slug: "services",
        seo: {
          title: "Comprehensive Plumbing Services | Dallas, TX",
          h1: "Full-Spectrum Plumbing Repairs & Installations",
          description: "Explore our expert drain cleaning, pipe repair, and water heater solutions.",
        },
        sections: [
          { type: "hero", content: {} },
          { type: "services", content: {} },
          { type: "ctaBanner", content: {} },
        ],
      },
    ],
  };

  const cities = [
    { city: "Dallas", stateId: "TX", county: "Dallas", lat: 32.7767, lng: -96.797 },
    { city: "Plano", stateId: "TX", county: "Collin", lat: 33.0198, lng: -96.6989 },
  ];

  console.log("--- 1. Assembling Website with Blog Posts ---");
  const assembled = await assembleWebsite(siteData, theme, {
    domain: "lonestarflow.com",
    serviceAreaCities: cities,
    blogPosts: demoBlogPosts,
    fastOfflinePreview: true,
  });

  const files = assembled.files;

  // Check 1: blog.html was generated
  const blogHub = files.find((f) => f.path === "blog.html");
  assert(Boolean(blogHub), 'Generated "blog.html" directory hub');

  // Check 2: blog article files were generated
  const blog1 = files.find((f) => f.path === "blog/warning-signs-drain-cleaning.html");
  const blog2 = files.find((f) => f.path === "blog/understanding-water-heater-costs.html");
  const blog3 = files.find((f) => f.path === "blog/emergency-plumber-guide.html");

  assert(Boolean(blog1), 'Generated "blog/warning-signs-drain-cleaning.html"');
  assert(Boolean(blog2), 'Generated "blog/understanding-water-heater-costs.html"');
  assert(Boolean(blog3), 'Generated "blog/emergency-plumber-guide.html"');

  // Check 3: Homepage includes blog section with links to blog articles
  const homeFile = files.find((f) => f.path === "index.html");
  const homeHtml = typeof homeFile?.content === "string" ? homeFile.content : homeFile?.content.toString("utf-8") || "";
  assert(homeHtml.includes("blog-section"), "Homepage includes .blog-section");
  assert(homeHtml.includes("blog/warning-signs-drain-cleaning.html"), "Homepage links to warning signs article");
  assert(homeHtml.includes("blog.html"), "Homepage links to blog.html hub");

  // Check 4: Blog hub links to all articles
  const hubHtml = typeof blogHub?.content === "string" ? blogHub.content : blogHub?.content.toString("utf-8") || "";
  assert(hubHtml.includes("blog/warning-signs-drain-cleaning.html"), "blog.html links to article 1");
  assert(hubHtml.includes("blog/understanding-water-heater-costs.html"), "blog.html links to article 2");
  assert(hubHtml.includes("blog/emergency-plumber-guide.html"), "blog.html links to article 3");

  // Check 5: Blog article contains E-E-A-T author box, Breadcrumbs, and JSON-LD schema
  const blog1Html = typeof blog1?.content === "string" ? blog1.content : blog1?.content.toString("utf-8") || "";
  assert(blog1Html.includes("Master Technician John"), "Blog article renders author name");
  assert(blog1Html.includes("BlogPosting"), "Blog article includes Schema.org BlogPosting");
  assert(blog1Html.includes("FAQPage"), "Blog article includes Schema.org FAQPage");
  assert(blog1Html.includes("tel:2145550199") || blog1Html.includes("tel:(214) 555-0199"), "Blog article has phone-first CTA");

  // Check 6: Connectivity Audit Report has honest Blog Metrics
  const audit = assembled.connectivityAudit;
  assert(Boolean(audit), "Assembled website produced connectivityAudit");
  assert(Boolean(audit?.blogMetrics), "auditReport contains dedicated blogMetrics");

  const bm = audit?.blogMetrics!;
  console.log("\n📊 Observed Blog Metrics:", JSON.stringify(bm, null, 2));

  assert(bm.totalBlogPosts === 3, "blogMetrics.totalBlogPosts === 3");
  assert(bm.blogsWithIncoming === 3, "blogMetrics.blogsWithIncoming === 3 (All have inbound links)");
  assert(bm.blogsWithOutgoing === 3, "blogMetrics.blogsWithOutgoing === 3 (All have outbound links)");
  assert(bm.orphanBlogPosts === 0, "blogMetrics.orphanBlogPosts === 0 (Zero orphan blog articles)");
  assert(bm.weakBlogPosts === 0, "blogMetrics.weakBlogPosts === 0 (Strongly connected)");
  assert(bm.brokenBlogLinks === 0, "blogMetrics.brokenBlogLinks === 0 (Zero 404 links)");
  assert(bm.blogToServiceLinks >= 3, `blogMetrics.blogToServiceLinks >= 3 (Observed: ${bm.blogToServiceLinks})`);
  assert(bm.blogToBlogLinks >= 3, `blogMetrics.blogToBlogLinks >= 3 (Observed: ${bm.blogToBlogLinks})`);
  assert(bm.blogHubConnected === true, "blogMetrics.blogHubConnected === true");

  // Check 7: Sitemap includes blog pages
  const sitemapFile = files.find((f) => f.path === "sitemap.xml");
  const sitemapXml = typeof sitemapFile?.content === "string" ? sitemapFile.content : sitemapFile?.content.toString("utf-8") || "";
  assert(sitemapXml.includes("blog.html"), "sitemap.xml includes blog.html");
  assert(sitemapXml.includes("blog/warning-signs-drain-cleaning.html"), "sitemap.xml includes blog article 1");
  assert(sitemapXml.includes("blog/understanding-water-heater-costs.html"), "sitemap.xml includes blog article 2");
  assert(sitemapXml.includes("blog/emergency-plumber-guide.html"), "sitemap.xml includes blog article 3");

  // Check 8: Incremental Integration of a NEW Blog Post
  console.log("\n--- 2. Incremental Integration of New Blog Post ---");
  const newPostHtml = `<!DOCTYPE html>
<html>
<head><title>Sewer Camera Inspection Guide | Lone Star Flow</title></head>
<body>
  <h1>Sewer Camera Inspection Guide</h1>
  <p>Learn how HD sewer cameras diagnose hidden pipe fractures before digging trenches.</p>
</body>
</html>`;

  const incrementalRes = integrateNewPageIntoProject(
    {
      newPagePath: "blog/sewer-camera-inspection-guide.html",
      newPageTitle: "Sewer Camera Inspection Guide",
      newPageContent: newPostHtml,
      primaryQuery: "sewer camera inspection",
      serviceName: "Sewer Inspection",
      locationCity: "Dallas",
      searchIntent: "informational",
    },
    files,
    {
      businessName: "Lone Star Flow Masters",
      primaryTrade: "Plumber",
      domain: "lonestarflow.com",
    }
  );

  assert(incrementalRes.orphanResolved === true, "New blog post integrated with orphanResolved === true");
  assert(
    incrementalRes.incomingLinksAdded.length > 0,
    `New blog post received incoming links: ${incrementalRes.incomingLinksAdded.join(", ")}`
  );

  const updatedBlogHub = incrementalRes.updatedFiles.find((f) => f.path === "blog.html");
  const updatedHubHtml = typeof updatedBlogHub?.content === "string" ? updatedBlogHub.content : updatedBlogHub?.content.toString("utf-8") || "";
  assert(
    updatedHubHtml.includes("blog/sewer-camera-inspection-guide.html") ||
    incrementalRes.incomingLinksAdded.some((p) => p === "blog.html"),
    "blog.html was updated with link to new blog post"
  );

  const updatedSitemap = incrementalRes.updatedFiles.find((f) => f.path === "sitemap.xml");
  const updatedSitemapXml = typeof updatedSitemap?.content === "string" ? updatedSitemap.content : updatedSitemap?.content.toString("utf-8") || "";
  assert(
    updatedSitemapXml.includes("blog/sewer-camera-inspection-guide.html"),
    "sitemap.xml was automatically updated with new blog post URL"
  );

  console.log(`\n==================================================`);
  console.log(`📊 BLOG INTERNAL LINKING AUDIT: ${passed}/${passed + failed} TESTS PASSED`);
  console.log(`==================================================`);

  if (failed > 0) {
    process.exit(1);
  }
}

runBlogInternalLinkingTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
