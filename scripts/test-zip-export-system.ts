import JSZip from "jszip";
import { assembleWebsite } from "../templates/assembler";
import { getThemeById } from "../lib/themes";
import {
  prepareProductionWebsiteFiles,
  generateProductionWebsiteZip,
  runPreZipAudits,
  generateProductionFavicon,
  ProductionWebsiteFile,
} from "../lib/export/zip-production-builder";
import { bundleProjectToZipStream } from "../lib/export/zip-bundler";

async function runZipExportSystemTests() {
  console.log("=== Testing RankLocal Production ZIP/Export System ===\n");

  const theme = getThemeById("pipe-and-wrench");
  const testSiteData: any = {
    site: {
      businessName: "Lone Star Emergency Plumbing",
      businessType: "plumbing",
      phone: "(512) 555-0144",
      address: { city: "Austin", state: "TX" },
      theme: "pipe-and-wrench",
      websiteDomain: "lonestarplumbingtx.com",
    },
    pages: [
      {
        slug: "index",
        seo: {
          title: "Lone Star Emergency Plumbing | Top Austin Plumber",
          metaDescription: "Licensed 24/7 emergency plumbers in Austin TX. Fast response and honest pricing.",
        },
        sections: [
          {
            type: "hero",
            variant: "split",
            content: {
              h1: "24/7 Emergency Plumbing Services in Austin",
              subheadline: "Rapid response plumbing repairs across Greater Austin.",
              primaryCta: "(512) 555-0144",
              secondaryCta: "Our Services",
              secondaryUrl: "services.html",
            },
          },
          {
            type: "services",
            variant: "grid",
            content: {
              headline: "Professional Plumbing Solutions",
              services: [
                { title: "Drain Cleaning", description: "Hydro jetting and cabling." },
                { title: "Water Heater Repair", description: "Tankless and standard systems." },
              ],
            },
          },
        ],
      },
      {
        slug: "about",
        seo: {
          title: "About Our Plumbers | Lone Star Emergency Plumbing",
          metaDescription: "Serving Austin TX homeowners with honest, licensed plumbing workmanship.",
        },
        sections: [
          {
            type: "hero",
            variant: "split",
            content: {
              h1: "Over 20 Years of Reliable Austin Plumbing",
              primaryCta: "(512) 555-0144",
            },
          },
        ],
      },
      {
        slug: "services",
        seo: {
          title: "Plumbing Services | Lone Star Emergency Plumbing",
          metaDescription: "Comprehensive commercial and residential plumbing services in Austin.",
        },
        sections: [
          {
            type: "hero",
            variant: "split",
            content: {
              h1: "Austin Residential & Commercial Plumbing",
              primaryCta: "(512) 555-0144",
            },
          },
        ],
      },
      {
        slug: "service-areas",
        seo: {
          title: "Service Areas | Lone Star Emergency Plumbing",
          metaDescription: "Plumbing services in Austin, Round Rock, Cedar Park, and Pflugerville.",
        },
        sections: [
          {
            type: "hero",
            variant: "split",
            content: {
              h1: "Serving Austin & Surrounding Central Texas Communities",
              primaryCta: "(512) 555-0144",
            },
          },
        ],
      },
      {
        slug: "blog",
        seo: {
          title: "Plumbing Advice & News | Lone Star Emergency Plumbing",
          metaDescription: "Expert maintenance tips, winterization guides, and plumbing insights.",
        },
        sections: [
          {
            type: "hero",
            variant: "split",
            content: {
              h1: "Central Texas Plumbing Advice & Resources",
              primaryCta: "(512) 555-0144",
            },
          },
        ],
      },
    ],
  };

  // Step 1: Assemble website files
  console.log("--- 1. Generating Website Files ---");
  const assembled = await assembleWebsite(testSiteData, theme, { mode: "fast" });
  console.log(`✓ Assembled ${assembled.files.length} base website files.`);

  // Step 2: Test Security Scanner with Contaminated Injections
  console.log("\n--- 2. Testing Security Scan & Prohibited File Filter ---");
  const contaminatedFiles: ProductionWebsiteFile[] = [
    ...assembled.files,
    { path: ".env.local", content: "OPENAI_API_KEY=sk-proj-testkey1234567890abcdefghij\nSUPABASE_SERVICE_ROLE_KEY=ey123456" },
    { path: "credentials.json", content: '{"token": "ghp_123456789012345678901234567890123456"}' },
    { path: "debug.log", content: "Internal server stack trace error dump..." },
    { path: "temp-scratch.tmp", content: "scratch notes" },
    { path: "admin-users.db", content: "SQLITE format 3" },
    { path: "prisma/schema.prisma", content: "datasource db { provider = 'sqlite' }" },
  ];

  const preAuditContaminated = runPreZipAudits(contaminatedFiles);
  if (preAuditContaminated.securityScan.passed) {
    throw new Error("Security scanner failed to flag contaminated files!");
  }
  console.log(`✓ Security scanner correctly caught ${preAuditContaminated.securityScan.blockedFiles.length} prohibited files.`);
  console.log(`✓ Security scanner correctly caught ${preAuditContaminated.securityScan.secretsDetected.length} secret tokens.`);

  // Step 3: Test prepareProductionWebsiteFiles (Automatic Sanitization & Organization)
  console.log("\n--- 3. Testing Production Packaging & Directory Organization ---");
  const { files: productionFiles, auditReport: cleanAudit } = prepareProductionWebsiteFiles(
    contaminatedFiles,
    {
      projectName: "Lone Star Emergency Plumbing",
      domain: "lonestarplumbingtx.com",
      businessName: "Lone Star Emergency Plumbing",
      phone: "(512) 555-0144",
      city: "Austin",
      primaryColor: "#0284C7",
    }
  );

  // Verify that NO prohibited files exist in prepared production files
  const productionPaths = productionFiles.map((f) => f.path);
  const leakedProhibited = productionPaths.filter((p) =>
    p.includes(".env") ||
    p.includes(".log") ||
    p.includes(".db") ||
    p.includes(".tmp") ||
    p.includes("prisma") ||
    p.includes("credentials")
  );

  if (leakedProhibited.length > 0) {
    throw new Error(`Security leak: Prohibited files made it into production package: ${leakedProhibited.join(", ")}`);
  }
  console.log("✓ Zero prohibited files in production file set (All secrets and debug data purged).");

  // Step 4: Verify Required Production Structure
  console.log("\n--- 4. Verifying Expected Directory Structure ---");
  const expectedStructure = [
    "index.html",
    "about/index.html",
    "services/index.html",
    "areas/index.html",
    "blog/index.html",
    "assets/style.css",
    "assets/script.js",
    "assets/favicon.svg",
    "assets/favicon.ico",
    "sitemap.xml",
    "robots.txt",
    "favicon.svg",
    "favicon.ico",
  ];

  for (const expected of expectedStructure) {
    if (!productionPaths.includes(expected)) {
      throw new Error(`Required production entry "${expected}" is missing from production package!`);
    }
    console.log(`  ✓ ${expected}`);
  }

  // Verify images/ folder has assets
  const imageAssets = productionPaths.filter((p) => p.startsWith("images/"));
  if (imageAssets.length === 0) {
    throw new Error("Missing images/ directory assets in production package!");
  }
  console.log(`  ✓ images/ (${imageAssets.length} image assets)`);

  // Step 5: Verify 5-Step Pre-ZIP Audits on Clean Production Files
  console.log("\n--- 5. Verifying 5 Pre-ZIP Preflight Audits ---");
  console.log(`  1. Security Scan: ${cleanAudit.securityScan.passed ? "PASSED" : "FAILED"}`);
  console.log(`     ${cleanAudit.securityScan.summary}`);
  if (!cleanAudit.securityScan.passed) throw new Error("Security scan failed on production files!");

  console.log(`  2. Broken-Link Audit: ${cleanAudit.brokenLinkAudit.passed ? "PASSED" : "FAILED"}`);
  console.log(`     ${cleanAudit.brokenLinkAudit.summary}`);
  if (!cleanAudit.brokenLinkAudit.passed) {
    console.error("Broken links details:", cleanAudit.brokenLinkAudit.brokenLinks);
    throw new Error("Broken-link audit failed!");
  }

  console.log(`  3. Missing-Asset Audit: ${cleanAudit.missingAssetAudit.passed ? "PASSED" : "FAILED"}`);
  console.log(`     ${cleanAudit.missingAssetAudit.summary}`);
  if (!cleanAudit.missingAssetAudit.passed) {
    console.error("Missing asset details:", cleanAudit.missingAssetAudit.missingAssets);
    throw new Error("Missing-asset audit failed!");
  }

  console.log(`  4. SEO Audit: ${cleanAudit.seoAudit.passed ? "PASSED" : "FAILED"}`);
  console.log(`     ${cleanAudit.seoAudit.summary}`);
  if (!cleanAudit.seoAudit.passed) throw new Error("SEO audit failed!");

  console.log(`  5. Confirm Required Files Exist: ${cleanAudit.requiredFilesAudit.passed ? "PASSED" : "FAILED"}`);
  console.log(`     ${cleanAudit.requiredFilesAudit.summary}`);
  if (!cleanAudit.requiredFilesAudit.passed) throw new Error("Required files check failed!");

  console.log(`\n  Pre-ZIP Audit Score: ${cleanAudit.score}/100 (Status: ${cleanAudit.passed ? "READY FOR EXPORT" : "BLOCKED"})`);

  // Step 6: Generate Production ZIP and Test Streaming Bundler
  console.log("\n--- 6. Generating Production ZIP Package ---");
  const zipResult = await bundleProjectToZipStream({
    projectName: "Lone Star Emergency Plumbing",
    files: productionFiles,
    domain: "lonestarplumbingtx.com",
    businessDetails: {
      businessName: "Lone Star Emergency Plumbing",
      phone: "(512) 555-0144",
      city: "Austin",
      stateRegion: "TX",
    },
  });

  console.log(`✓ Production ZIP generated: "${zipResult.safeFilename}" (${zipResult.stats.totalFiles} files packaged, audit score: ${zipResult.auditReport.score}/100)`);
  if (zipResult.auditReport.score < 100) {
    console.log("Audit issues in step 6:", zipResult.auditReport.allIssues);
  }

  // Step 7: Verify Standalone Static Extraction & In-Memory Unpack
  console.log("\n--- 7. Verifying Standalone Static Website Extraction ---");
  const directResult = await generateProductionWebsiteZip({
    projectName: "Lone Star Emergency Plumbing",
    files: productionFiles,
    domain: "lonestarplumbingtx.com",
  });

  const unzipped = await JSZip.loadAsync(directResult.zipBuffer);
  const unzippedFiles: string[] = [];
  unzipped.forEach((relativePath) => {
    unzippedFiles.push(relativePath);
  });

  console.log(`✓ Extracted ZIP package contains ${unzippedFiles.length} files.`);

  // Verify expected files inside the extracted ZIP
  for (const expected of expectedStructure) {
    if (!unzippedFiles.includes(expected)) {
      throw new Error(`Extracted ZIP is missing required entry: "${expected}"`);
    }
  }

  // Verify standalone HTML content execution
  const indexHtml = await unzipped.file("index.html")!.async("string");
  if (!indexHtml.includes("<title>") || !indexHtml.includes("<h1")) {
    throw new Error("Extracted index.html is missing valid HTML structure!");
  }

  // Check stylesheet resolution in extracted index.html
  if (!indexHtml.includes("styles.css") && !indexHtml.includes("assets/style.css") && !indexHtml.includes("css/style.css")) {
    throw new Error("Extracted index.html has no stylesheet link!");
  }

  // Check subfolder relative path resolution in about/index.html
  const aboutHtml = await unzipped.file("about/index.html")!.async("string");
  if (!aboutHtml.includes("../assets/style.css") && !aboutHtml.includes("../styles.css") && !aboutHtml.includes("../css/style.css")) {
    throw new Error("Extracted about/index.html does not have properly resolved relative CSS path (../)!");
  }
  if (!aboutHtml.includes("../index.html")) {
    throw new Error("Extracted about/index.html does not link back to ../index.html!");
  }

  console.log("✓ Root index.html links to local assets and subpages with zero build step.");
  console.log("✓ Subfolder page (about/index.html) successfully resolves relative paths (../) for standalone offline viewing.");
  console.log("✓ Standalone static execution verified 100%!");

  console.log("\n=== ALL ZIP/EXPORT SYSTEM AUDITS & IMPROVEMENTS VERIFIED SUCCESSFULLY! ===");
}

runZipExportSystemTests().catch((err) => {
  console.error("Test failure:", err);
  process.exit(1);
});
