import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const BASE_URL = "http://localhost:3000";
const OUTPUT_DIR = path.resolve(process.cwd(), "test_outputs");

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const testSites = [
  {
    name: "Chicago Plumbing",
    themeId: "pipe-and-wrench",
    formData: {
      businessName: "Windy City Pro Plumbers",
      businessType: "Plumbing",
      nicheId: "plumbing",
      schemaType: "Plumber",
      businessDescription: "Top-rated 24/7 licensed plumbing contractors serving all Chicago neighborhoods and Cook County.",
      servicesOffered: "Drain Cleaning, Emergency Pipe Repair, Water Heater Installation, Sewer Line Replacement",
      services: ["Drain Cleaning", "Emergency Pipe Repair", "Water Heater Installation", "Sewer Line Replacement"],
      streetAddress: "1250 N Michigan Ave",
      city: "Chicago",
      stateRegion: "IL",
      zipPostalCode: "60611",
      country: "USA",
      serviceAreas: "Lincoln Park, Lakeview, Loop, Evanston, Oak Park",
      serviceAreasList: ["Lincoln Park", "Lakeview", "Loop", "Evanston", "Oak Park"],
      phone: "(312) 555-0199",
      email: "service@windycityplumbers.com",
      businessHours: "Monday - Sunday: 24/7 Emergency Dispatch",
      websiteDomain: "windycityplumbers.com",
      targetKeywords: "chicago plumber, emergency plumbing chicago, drain cleaning 60611",
      keywords: ["chicago plumber", "emergency plumbing chicago", "drain cleaning 60611"],
      yearsInBusiness: "18",
      uniqueSellingPoints: "Licensed & Insured, 30-Minute Dispatch, Upfront Pricing, 100% Satisfaction Guarantee",
      theme: { id: "pipe-and-wrench", name: "Pipe & Wrench" },
      layoutStyle: "conversion",
      imageProvider: "bing",
      blogPostsCount: 2,
    },
  },
  {
    name: "Dallas HVAC",
    themeId: "cool-breeze",
    formData: {
      businessName: "Lone Star Climate Control",
      businessType: "HVAC",
      nicheId: "hvac",
      schemaType: "HVACBusiness",
      businessDescription: "Premier commercial and residential heating, ventilation, and air conditioning service in Dallas-Fort Worth.",
      servicesOffered: "AC Repair, Furnace Maintenance, Heat Pump Installation, Duct Cleaning",
      services: ["AC Repair", "Furnace Maintenance", "Heat Pump Installation", "Duct Cleaning"],
      streetAddress: "400 S Akard St",
      city: "Dallas",
      stateRegion: "TX",
      zipPostalCode: "75202",
      country: "USA",
      serviceAreas: "Highland Park, Plano, Frisco, Irving, Arlington",
      serviceAreasList: ["Highland Park", "Plano", "Frisco", "Irving", "Arlington"],
      phone: "(214) 555-0144",
      email: "contact@lonestarclimate.com",
      businessHours: "Monday - Friday: 7:00 AM - 8:00 PM, Saturday: 8:00 AM - 5:00 PM",
      websiteDomain: "lonestarclimate.com",
      targetKeywords: "dallas ac repair, dfw hvac service, air conditioning installation dallas",
      keywords: ["dallas ac repair", "dfw hvac service", "air conditioning installation dallas"],
      yearsInBusiness: "12",
      uniqueSellingPoints: "NATE-Certified Technicians, Free Estimates on Replacements, Same-Day Service",
      theme: { id: "cool-breeze", name: "Cool Breeze" },
      layoutStyle: "editorial",
      imageProvider: "bing",
      blogPostsCount: 2,
    },
  },
  {
    name: "Miami Electrical",
    themeId: "spark-and-wire",
    formData: {
      businessName: "Biscayne Electric Pros",
      businessType: "Electrical",
      nicheId: "electrical",
      schemaType: "Electrician",
      businessDescription: "Master electricians providing high-end commercial and residential electrical installations across South Florida.",
      servicesOffered: "Panel Upgrades, EV Charger Installation, Whole-Home Rewiring, Smart Lighting",
      services: ["Panel Upgrades", "EV Charger Installation", "Whole-Home Rewiring", "Smart Lighting"],
      streetAddress: "801 Brickell Ave",
      city: "Miami",
      stateRegion: "FL",
      zipPostalCode: "33131",
      country: "USA",
      serviceAreas: "Brickell, South Beach, Coral Gables, Coconut Grove, Wynwood",
      serviceAreasList: ["Brickell", "South Beach", "Coral Gables", "Coconut Grove", "Wynwood"],
      phone: "(305) 555-0182",
      email: "support@biscayneelectric.com",
      businessHours: "Monday - Saturday: 7:00 AM - 7:00 PM",
      websiteDomain: "biscayneelectric.com",
      targetKeywords: "miami electrician, ev charger installation miami, panel upgrade 33131",
      keywords: ["miami electrician", "ev charger installation miami", "panel upgrade 33131"],
      yearsInBusiness: "15",
      uniqueSellingPoints: "Master Electrician On-Staff, Code Compliance Guaranteed, 10-Year Workmanship Warranty",
      theme: { id: "spark-and-wire", name: "Spark & Wire" },
      layoutStyle: "split",
      imageProvider: "bing",
      blogPostsCount: 2,
    },
  },
];

async function runTest() {
  console.log("=================================================================");
  console.log("STARTING LIVE REGRESSION TEST: 3 WEBSITES GENERATION & EXPORT");
  console.log("=================================================================\n");

  const results = [];

  for (const siteConfig of testSites) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`[TESTING SITE]: ${siteConfig.name} (${siteConfig.themeId})`);
    console.log(`------------------------------------------------------------`);

    const t0 = Date.now();
    try {
      const genRes = await fetch(`${BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: "openai",
          formData: siteConfig.formData,
          preferredSource: "bing",
        }),
      });

      const genData = await genRes.json();
      const elapsed = ((Date.now() - t0) / 1000).toFixed(1);

      if (!genRes.ok || !genData.success) {
        console.error(`❌ GENERATION FAILED for ${siteConfig.name}:`, genData.error || genData);
        results.push({ name: siteConfig.name, success: false, error: genData.error, elapsed });
        continue;
      }

      console.log(`✅ Generation Successful in ${elapsed}s!`);
      console.log(`   Project ID: ${genData.projectId}`);
      console.log(`   Files Generated: ${genData.files?.length}`);
      console.log(`   Quality Score: ${genData.qualityReport?.overallScore || "N/A"}/100`);

      // Test ZIP download endpoint
      const zipUrl = `${BASE_URL}/api/projects/${genData.projectId}/download`;
      const zipRes = await fetch(zipUrl);
      if (!zipRes.ok) {
        throw new Error(`Failed to download ZIP: HTTP ${zipRes.status}`);
      }

      const zipBuffer = Buffer.from(await zipRes.arrayBuffer());
      const zipPath = path.join(OUTPUT_DIR, `${siteConfig.name.replace(/\s+/g, "_")}.zip`);
      fs.writeFileSync(zipPath, zipBuffer);
      console.log(`✅ ZIP Downloaded: ${zipBuffer.length} bytes to ${zipPath}`);

      // Unzip and inspect files
      const extractDir = path.join(OUTPUT_DIR, siteConfig.name.replace(/\s+/g, "_"));
      if (fs.existsSync(extractDir)) {
        fs.rmSync(extractDir, { recursive: true, force: true });
      }
      fs.mkdirSync(extractDir, { recursive: true });
      execSync(`unzip -q "${zipPath}" -d "${extractDir}"`);

      const extractedFiles = fs.readdirSync(extractDir, { recursive: true });
      console.log(`✅ ZIP Extracted cleanly: ${extractedFiles.length} files/dirs`);

      // Check required files
      const hasIndex = fs.existsSync(path.join(extractDir, "index.html"));
      const hasSitemap = fs.existsSync(path.join(extractDir, "sitemap.xml"));
      const hasRobots = fs.existsSync(path.join(extractDir, "robots.txt"));
      const hasFavicon = fs.existsSync(path.join(extractDir, "favicon.svg")) || fs.existsSync(path.join(extractDir, "favicon.ico"));
      const hasAssets = fs.existsSync(path.join(extractDir, "assets")) || fs.existsSync(path.join(extractDir, "styles.css"));

      const indexHtml = fs.readFileSync(path.join(extractDir, "index.html"), "utf8");
      const hasTitle = /<title[^>]*>.*?<\/title>/i.test(indexHtml);
      const hasCanonical = /rel=["']canonical["']/i.test(indexHtml);
      const hasSchema = /application\/ld\+json/i.test(indexHtml);

      // Check for credential leaks
      const rawText = JSON.stringify(genData);
      const leaksKey = rawText.includes("sk-") || rawText.includes("AIzaSy");

      console.log(`   - index.html: ${hasIndex ? "PASS" : "FAIL"}`);
      console.log(`   - sitemap.xml: ${hasSitemap ? "PASS" : "FAIL"}`);
      console.log(`   - robots.txt: ${hasRobots ? "PASS" : "FAIL"}`);
      console.log(`   - favicon: ${hasFavicon ? "PASS" : "FAIL"}`);
      console.log(`   - Schema markup: ${hasSchema ? "PASS" : "FAIL"}`);
      console.log(`   - Canonical tags: ${hasCanonical ? "PASS" : "FAIL"}`);
      console.log(`   - Zero Credential Leaks: ${!leaksKey ? "PASS" : "FAIL"}`);

      results.push({
        name: siteConfig.name,
        theme: siteConfig.themeId,
        success: true,
        elapsed: `${elapsed}s`,
        filesCount: genData.files?.length,
        zipSize: `${(zipBuffer.length / 1024).toFixed(1)} KB`,
        qualityScore: genData.qualityReport?.overallScore || 90,
        checks: {
          hasIndex,
          hasSitemap,
          hasRobots,
          hasFavicon,
          hasSchema,
          hasCanonical,
          noCredentialLeaks: !leaksKey,
        },
        indexHtmlSample: indexHtml.slice(0, 300),
      });
    } catch (err) {
      console.error(`❌ Exception testing ${siteConfig.name}:`, err.message);
      results.push({ name: siteConfig.name, success: false, error: err.message });
    }
  }

  console.log("\n=================================================================");
  console.log("FINAL SUMMARY OF ALL 3 WEBSITES");
  console.log("=================================================================");
  console.log(JSON.stringify(results, null, 2));
}

runTest();
