import fs from "fs";
import path from "path";
import { WebsiteFormData, computeTargetPages } from "../lib/generator/prompt";
import { buildDefaultTradeContentJSON } from "../lib/generator/ai-content-prompt";
import { assembleWebsite } from "../templates/assembler";
import { THEMES } from "../lib/themes";
import { runSiteChecker, formatMarkdownReport, SiteCheckerResult } from "../lib/checker/site-checker";

async function main() {
  console.log("================================================================================");
  console.log("RANKLOCAL AUTOMATED SITE CHECKER");
  console.log("Generating 3 test sites and running full inspection suite...");
  console.log("================================================================================\n");

  const reportDir = path.join(process.cwd(), "checker-report");
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  // 1. Define 3 Test Sites
  const testSites = [
    {
      id: "plumber-portland-or",
      name: "Rose City Plumbing Pros",
      type: "Plumber",
      city: "Portland",
      state: "OR",
      zip: "97201",
      phone: "(503) 555-0194",
      domain: "rosecityplumbingpros.com",
      theme: THEMES.find((t) => t.id === "modern-indigo") || THEMES[0],
      locationCities: [
        { city: "Beaverton", stateId: "OR", county: "Washington", lat: 45.4871, lng: -122.8037, population: 97494, distanceOffset: "7 miles west of Portland" },
        { city: "Hillsboro", stateId: "OR", county: "Washington", lat: 45.5229, lng: -122.9898, population: 106447, distanceOffset: "18 miles west of Portland" },
        { city: "Gresham", stateId: "OR", county: "Multnomah", lat: 45.4998, lng: -122.4312, population: 114247, distanceOffset: "15 miles east of Portland" },
        { city: "Tigard", stateId: "OR", county: "Washington", lat: 45.4312, lng: -122.7712, population: 54539, distanceOffset: "10 miles southwest of Portland" },
        { city: "Lake Oswego", stateId: "OR", county: "Clackamas", lat: 45.4207, lng: -122.6706, population: 40731, distanceOffset: "8 miles south of Portland" },
      ],
    },
    {
      id: "electrician-dallas-tx",
      name: "Lone Star Spark Electric",
      type: "Electrician",
      city: "Dallas",
      state: "TX",
      zip: "75201",
      phone: "(214) 555-0182",
      domain: "lonestarsparkelectric.com",
      theme: THEMES.find((t) => t.id === "warm-amber") || THEMES[0],
      locationCities: [
        { city: "Garland", stateId: "TX", county: "Dallas", lat: 32.9126, lng: -96.6389, population: 246018, distanceOffset: "14 miles northeast of Dallas" },
        { city: "Irving", stateId: "TX", county: "Dallas", lat: 32.814, lng: -96.9489, population: 256684, distanceOffset: "12 miles northwest of Dallas" },
        { city: "Grand Prairie", stateId: "TX", county: "Dallas", lat: 32.746, lng: -96.9978, population: 196100, distanceOffset: "13 miles west of Dallas" },
        { city: "Mesquite", stateId: "TX", county: "Dallas", lat: 32.7668, lng: -96.5992, population: 150108, distanceOffset: "12 miles east of Dallas" },
        { city: "Carrollton", stateId: "TX", county: "Dallas", lat: 32.9537, lng: -96.8903, population: 133434, distanceOffset: "15 miles north of Dallas" },
      ],
    },
    {
      id: "tree-service-atlanta-ga",
      name: "PeachState Tree Care Specialists",
      type: "Tree Service",
      city: "Atlanta",
      state: "GA",
      zip: "30303",
      phone: "(404) 555-0149",
      domain: "peachstatetreecare.com",
      theme: THEMES.find((t) => t.id === "emerald-clean") || THEMES[0],
      locationCities: [
        { city: "Marietta", stateId: "GA", county: "Cobb", lat: 33.9526, lng: -84.5499, population: 60972, distanceOffset: "19 miles northwest of Atlanta" },
        { city: "Alpharetta", stateId: "GA", county: "Fulton", lat: 34.0754, lng: -84.2941, population: 65818, distanceOffset: "26 miles north of Atlanta" },
        { city: "Roswell", stateId: "GA", county: "Fulton", lat: 34.0232, lng: -84.3616, population: 92833, distanceOffset: "22 miles north of Atlanta" },
        { city: "Sandy Springs", stateId: "GA", county: "Fulton", lat: 33.9304, lng: -84.3733, population: 108080, distanceOffset: "16 miles north of Atlanta" },
        { city: "Smyrna", stateId: "GA", county: "Cobb", lat: 33.8839, lng: -84.5144, population: 56668, distanceOffset: "14 miles northwest of Atlanta" },
      ],
    },
  ];

  const allResults: SiteCheckerResult[] = [];

  for (let idx = 0; idx < testSites.length; idx++) {
    const site = testSites[idx];
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`[Site ${idx + 1}/3] Generating: ${site.name} (${site.type} in ${site.city}, ${site.state})`);
    console.log(`--------------------------------------------------------------------------------`);

    const formData: WebsiteFormData = {
      businessName: site.name,
      businessType: site.type,
      city: site.city,
      stateRegion: site.state,
      zipPostalCode: site.zip,
      phone: site.phone,
      websiteDomain: site.domain,
      targetKeywords: `${site.type.toLowerCase()} in ${site.city}, 24/7 ${site.type.toLowerCase()} service`,
      businessDescription: `Premier licensed ${site.type.toLowerCase()} company serving ${site.city} and neighboring communities with upfront flat pricing and fast emergency dispatch.`,
      pagesToCreate: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas"],
      separateServicePages: false,
      separateAreaPages: true,
      theme: site.theme,
    };

    const targetPages = computeTargetPages(formData);
    const contentJSON = buildDefaultTradeContentJSON(formData, targetPages);

    // Format location cities with exact slugs
    const tradeSlug = site.type.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const serviceAreaCities = site.locationCities.map((c) => ({
      ...c,
      slug: `${tradeSlug}-${c.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${c.stateId.toLowerCase()}.html`,
    }));

    // Assemble website using the CURRENT codebase generator (WITHOUT FIXING ANY BUGS)
    const assembled = await assembleWebsite(contentJSON, site.theme, {
      domain: site.domain,
      serviceAreaCities,
    });

    console.log(`Generated ${assembled.files.length} static files.`);
    const htmlCount = assembled.files.filter((f) => f.path.endsWith(".html")).length;
    console.log(`HTML Pages assembled: ${htmlCount} pages (includes 5 location pages + service-areas.html).`);

    // Save site files to disk under checker-report/sites/<site-id>/
    const siteSaveDir = path.join(reportDir, "sites", site.id);
    if (!fs.existsSync(siteSaveDir)) {
      fs.mkdirSync(siteSaveDir, { recursive: true });
    }

    for (const f of assembled.files) {
      const fullPath = path.join(siteSaveDir, f.path);
      const parentDir = path.dirname(fullPath);
      if (!fs.existsSync(parentDir)) {
        fs.mkdirSync(parentDir, { recursive: true });
      }
      if (Buffer.isBuffer(f.content)) {
        fs.writeFileSync(fullPath, f.content);
      } else {
        fs.writeFileSync(fullPath, f.content, "utf8");
      }
    }

    console.log(`Saved assembled files to: ${siteSaveDir}`);

    // Run Site Checker with full Playwright layout, horizontal scroll, and console error checks
    console.log(`Running Site Checker on ${site.name}...`);
    const checkerResult = await runSiteChecker(assembled.files, {
      siteId: site.id,
      siteName: site.name,
      outputDir: "checker-report",
      runPlaywright: true,
      saveScreenshots: true,
    });

    console.log(`\nResults for ${site.name}:`);
    console.log(`  - Total Issues Found: ${checkerResult.totalIssues}`);
    console.log(`  - 🔴 Critical Issues: ${checkerResult.criticalCount}`);
    console.log(`  - ⚠️  Warning Issues:  ${checkerResult.warningCount}`);
    console.log(`  - 🏝️  Orphan Pages:    ${checkerResult.orphanPages.length}`);

    allResults.push(checkerResult);
  }

  // 2. Generate and save CHECKER_REPORT.md
  const markdownReport = formatMarkdownReport(allResults);
  const reportPath = path.join(process.cwd(), "CHECKER_REPORT.md");
  fs.writeFileSync(reportPath, markdownReport, "utf8");
  console.log(`\n================================================================================`);
  console.log(`SUCCESS: Comprehensive report saved to ${reportPath}`);
  console.log(`================================================================================\n`);

  // 3. Save JSON results for in-app UI
  const jsonReportPath = path.join(reportDir, "results.json");
  fs.writeFileSync(jsonReportPath, JSON.stringify(allResults, null, 2), "utf8");
  console.log(`Saved JSON results for in-app dashboard to: ${jsonReportPath}`);
}

main().catch((err) => {
  console.error("FATAL: Site checker encountered an unhandled exception:", err);
  process.exit(1);
});
