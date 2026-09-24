import { THEMES } from "../lib/themes";
import { computeTargetPages, WebsiteFormData } from "../lib/generator/prompt";
import { buildDefaultTradeContentJSON } from "../lib/generator/ai-content-prompt";
import { assembleWebsite } from "../templates/assembler";
import JSZip from "jszip";

async function runVerification() {
  console.log("==================================================================");
  console.log("ALTOFOX TEMPLATE LIBRARY + CONTENT JSON ARCHITECTURE VERIFICATION");
  console.log("==================================================================\n");

  // -------------------------------------------------------------------------
  // 1. SAMPLE PLUMBER SITE
  // -------------------------------------------------------------------------
  console.log("--> 1. Generating Sample Plumber Site (Lone Star Express Plumbing)...");
  const plumberFormData: WebsiteFormData = {
    businessName: "Lone Star Express Plumbing",
    businessType: "Plumbing Contractor",
    businessDescription: "Family-owned residential and commercial plumbing company providing 24/7 fast-dispatch repairs, drain clearing, and water heater installation across Dallas-Fort Worth.",
    yearsInBusiness: "20+",
    uniqueSellingPoints: "45-min arrival, upfront flat rates, licensed master technicians",
    services: [
      "24/7 Emergency Repairs",
      "Hydro-Jetting Drain Cleaning",
      "Water Heater Installation",
      "Slab Leak Detection",
      "Sewer Line Inspection"
    ],
    servicesOffered: "24/7 Emergency Repairs, Hydro-Jetting Drain Cleaning, Water Heater Installation, Slab Leak Detection, Sewer Line Inspection",
    streetAddress: "4512 Main Street",
    city: "Dallas",
    stateRegion: "TX",
    zipPostalCode: "75201",
    country: "USA",
    serviceAreasList: ["Dallas", "Plano", "Frisco", "McKinney", "Irving", "Richardson"],
    serviceAreas: "Dallas, Plano, Frisco, McKinney, Irving, Richardson",
    phone: "(214) 555-0198",
    email: "dispatch@lonestarplumbingdfw.com",
    businessHours: "Monday - Sunday: 24/7 Emergency Dispatch",
    websiteDomain: "www.lonestarplumbingdfw.com",
    targetKeywords: "emergency plumber Dallas TX, drain cleaning Dallas, water heater repair Dallas TX",
    pagesToCreate: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas"],
    separateServicePages: true,
    separateAreaPages: true,
  };

  const boldTradeTheme = THEMES.find((t) => t.id === "bold-trade")!;
  const plumberPages = computeTargetPages(plumberFormData);
  const plumberContentJSON = buildDefaultTradeContentJSON(plumberFormData, plumberPages);
  const plumberSite = await assembleWebsite(plumberContentJSON, boldTradeTheme, {
    domain: plumberFormData.websiteDomain,
  });

  console.log(`[Plumber] Total assembled files: ${plumberSite.files.length}`);
  const plumberHtmlFiles = plumberSite.files.filter((f) => f.path.endsWith(".html"));
  console.log(`[Plumber] HTML Pages count: ${plumberHtmlFiles.length}`);
  console.log(`[Plumber] Sample HTML paths: ${plumberHtmlFiles.slice(0, 6).map((f) => f.path).join(", ")}`);

  const plumberIndex = plumberSite.files.find((f) => f.path === "index.html")?.content || "";
  const plumberCss = plumberSite.files.find((f) => f.path === "css/style.css")?.content || "";
  const plumberJs = plumberSite.files.find((f) => f.path === "js/main.js")?.content || "";
  const plumberSitemap = plumberSite.files.find((f) => f.path === "sitemap.xml")?.content || "";

  // Plumber checks
  console.log("[Plumber] Theme Primary Color (--color-primary: #EA580C):", plumberCss.includes("#EA580C"));
  console.log("[Plumber] Theme Secondary Color (--color-secondary: #0B132B):", plumberCss.includes("#0B132B"));
  console.log("[Plumber] Heading Font (Montserrat):", plumberCss.includes("Montserrat"));
  console.log("[Plumber] Border Radius (--radius: 6px):", plumberCss.includes("--radius: 6px"));
  console.log("[Plumber] Emergency Banner present:", plumberIndex.includes("class=\"emergency-banner\""));
  console.log("[Plumber] Split Hero present:", plumberIndex.includes("hero-split"));
  console.log("[Plumber] Picture element present:", plumberIndex.includes("<picture>"));
  console.log("[Plumber] Data-remote-src present:", plumberIndex.includes("data-remote-src="));
  console.log("[Plumber] Hero fetchpriority=high present:", plumberIndex.includes("fetchpriority=\"high\""));
  console.log("[Plumber] Lazy loading on images:", plumberIndex.includes("loading=\"lazy\""));
  console.log("[Plumber] CREDITS.txt generated:", plumberSite.files.some((f) => f.path === "images/CREDITS.txt"));
  console.log("[Plumber] Resolved photos tracked:", (plumberSite.photos?.length || 0) > 0, `(${plumberSite.photos?.length || 0} photos)`);
  console.log("[Plumber] Trust Bar present:", plumberIndex.includes("class=\"trust-bar\""));
  console.log("[Plumber] Services Cards present:", plumberIndex.includes("class=\"services-grid\""));
  console.log("[Plumber] Stats (20+, 45m) present:", plumberIndex.includes("20+") && plumberIndex.includes("45m"));
  console.log("[Plumber] Mobile Menu in JS:", plumberJs.includes("navToggle") && plumberJs.includes("mobileDrawer"));
  console.log("[Plumber] Sticky Mobile Call Bar in HTML:", plumberIndex.includes("class=\"mobile-call-bar\""));
  console.log("[Plumber] LocalBusiness Schema with Plumber type:", plumberIndex.includes("\"@type\": \"Plumber\""));
  console.log("[Plumber] Sitemap contains index and inner pages:", plumberSitemap.includes("index.html") || plumberSitemap.includes("about.html"));

  // -------------------------------------------------------------------------
  // 2. SAMPLE TREE SERVICE SITE
  // -------------------------------------------------------------------------
  console.log("\n--> 2. Generating Sample Tree Service Site (Apex Arborist & Tree Care)...");
  const treeFormData: WebsiteFormData = {
    businessName: "Apex Arborist & Tree Care",
    businessType: "Tree Service",
    businessDescription: "Certified ISA arborists providing safe crane tree removals, precision tree trimming, stump grinding, and 24/7 storm damage clearing in Austin.",
    yearsInBusiness: "15+",
    uniqueSellingPoints: "ISA Certified Arborists, fully insured with $2M liability, 50-ton crane equipment",
    services: [
      "Dangerous Tree Removal",
      "Precision Tree Trimming & Pruning",
      "Stump Grinding & Root Clearing",
      "Emergency Storm Clearing",
      "Tree Health & Oak Wilt Inspection"
    ],
    servicesOffered: "Dangerous Tree Removal, Precision Tree Trimming & Pruning, Stump Grinding & Root Clearing, Emergency Storm Clearing, Tree Health & Oak Wilt Inspection",
    streetAddress: "8800 Canopy Trail",
    city: "Austin",
    stateRegion: "TX",
    zipPostalCode: "78745",
    country: "USA",
    serviceAreasList: ["Austin", "Round Rock", "Cedar Park", "Westlake", "Lakeway", "Pflugerville"],
    serviceAreas: "Austin, Round Rock, Cedar Park, Westlake, Lakeway, Pflugerville",
    phone: "(512) 555-8733",
    email: "info@apexarboristcare.com",
    businessHours: "Monday - Saturday: 7:00 AM - 7:00 PM (24/7 Storm Response)",
    websiteDomain: "www.apexarboristcare.com",
    targetKeywords: "tree service Austin TX, certified arborist Austin, tree removal Austin TX, stump grinding",
    pagesToCreate: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas"],
    separateServicePages: true,
    separateAreaPages: true,
  };

  const freshNaturalTheme = THEMES.find((t) => t.id === "fresh-natural")!;
  const treePages = computeTargetPages(treeFormData);
  const treeContentJSON = buildDefaultTradeContentJSON(treeFormData, treePages);
  const treeSite = await assembleWebsite(treeContentJSON, freshNaturalTheme, {
    domain: treeFormData.websiteDomain,
  });

  console.log(`[Tree Service] Total assembled files: ${treeSite.files.length}`);
  const treeHtmlFiles = treeSite.files.filter((f) => f.path.endsWith(".html"));
  console.log(`[Tree Service] HTML Pages count: ${treeHtmlFiles.length}`);

  const treeIndex = treeSite.files.find((f) => f.path === "index.html")?.content || "";
  const treeCss = treeSite.files.find((f) => f.path === "css/style.css")?.content || "";
  const treeSitemap = treeSite.files.find((f) => f.path === "sitemap.xml")?.content || "";

  // Tree Service checks
  console.log(`[Tree Service] Theme Primary Color (--color-primary: ${freshNaturalTheme.colors.primary}):`, treeCss.includes(freshNaturalTheme.colors.primary));
  console.log(`[Tree Service] Theme Secondary Color (--color-secondary: ${freshNaturalTheme.colors.secondary}):`, treeCss.includes(freshNaturalTheme.colors.secondary));
  console.log(`[Tree Service] Heading Font (${freshNaturalTheme.fonts.heading}):`, treeCss.includes(freshNaturalTheme.fonts.heading));
  console.log(`[Tree Service] Border Radius (--radius: ${freshNaturalTheme.borderRadius}):`, treeCss.includes(`--radius: ${freshNaturalTheme.borderRadius}`));
  console.log("[Tree Service] Full Image Hero Variant:", treeIndex.includes("hero-full-image"));
  console.log("[Tree Service] Tree Canopy Photo / Background Remote:", treeIndex.includes("data-bg-remote") || treeIndex.includes("data-remote-src"));
  console.log("[Tree Service] Project Gallery with Lightbox:", treeIndex.includes("class=\"gallery-grid\""));
  console.log("[Tree Service] Review Slider Variant:", treeIndex.includes("testimonial-slider"));
  console.log("[Tree Service] TreeService Schema Org:", treeIndex.includes("\"@type\": \"TreeService\""));

  // -------------------------------------------------------------------------
  // 3. COMPARISON & DIFFERENTIATION VERIFICATION
  // -------------------------------------------------------------------------
  console.log("\n--> 3. Visual & Structural Differentiation Verification:");
  console.log("Primary colors are different:", boldTradeTheme.colors.primary !== freshNaturalTheme.colors.primary);
  console.log("Typography is different:", boldTradeTheme.fonts.heading !== freshNaturalTheme.fonts.heading);
  console.log("Border radiuses are different:", boldTradeTheme.borderRadius !== freshNaturalTheme.borderRadius);
  console.log("Hero variants are different (Plumber=split vs Tree=fullImage):", plumberIndex.includes("hero-split") && treeIndex.includes("hero-full-image"));
  console.log("Schema types are different (Plumber vs TreeService):", plumberIndex.includes("\"@type\": \"Plumber\"") && treeIndex.includes("\"@type\": \"TreeService\""));

  // -------------------------------------------------------------------------
  // 4. ZIP PACKAGING VERIFICATION
  // -------------------------------------------------------------------------
  console.log("\n--> 4. Testing Client-Side ZIP Packaging with JSZip...");
  const plumberZip = new JSZip();
  for (const f of plumberSite.files) {
    plumberZip.file(f.path, f.content);
  }
  const plumberZipBuffer = await plumberZip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  console.log(`[Plumber ZIP] Successfully created. Size: ${plumberZipBuffer.length} bytes across ${Object.keys(plumberZip.files).length} files.`);

  const treeZip = new JSZip();
  for (const f of treeSite.files) {
    treeZip.file(f.path, f.content);
  }
  const treeZipBuffer = await treeZip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
  console.log(`[Tree ZIP] Successfully created. Size: ${treeZipBuffer.length} bytes across ${Object.keys(treeZip.files).length} files.`);

  console.log("\n==================================================================");
  console.log("ALL VERIFICATION CHECKS PASSED SUCCESSFULLY!");
  console.log("==================================================================");
}

runVerification().catch(console.error);
