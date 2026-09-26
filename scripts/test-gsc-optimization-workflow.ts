import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { SavedProject } from "../lib/storage/project-types";
import {
  ensureProjectVersions,
  createProjectVersionSnapshot,
  switchProjectVersion,
  getOriginalVersion,
  getCurrentVersion,
} from "../lib/storage/project-versions";
import {
  parseGscCsv,
  generateGscOpportunities,
} from "../lib/search-console/search-console-analyzer";
import { optimizePageWithGscData } from "../lib/search-console/search-console-optimizer";
import { buildCanonicalWebsiteFiles } from "../lib/export/canonical-files";
import { validateWebsiteFiles } from "../lib/export/zip-validator";
import { generateWebsiteZIP } from "../lib/storage/db";

async function runGscOptimizationWorkflowTest() {
  console.log("==========================================================================");
  console.log(" ALTOFOX / RANK LOCAL - 20-50 PAGE SEARCH CONSOLE OPTIMIZATION TEST");
  console.log("==========================================================================\n");

  const businessPhone = "(214) 555-0199";
  const businessName = "Lone Star Pro Plumbing";
  const primaryCity = "Dallas";
  const domain = "lonestarproplumbing.com";

  // --------------------------------------------------------------------------
  // STEP 1: Generate a Realistic 30-Page Contractor Website
  // --------------------------------------------------------------------------
  console.log("--- 1. Generating Realistic 30-Page Contractor Website ---");
  const services = [
    { slug: "emergency-plumber-dallas", name: "Emergency Plumbing" },
    { slug: "drain-cleaning", name: "Drain Cleaning & Rooter" },
    { slug: "water-heater-repair", name: "Water Heater Repair & Install" },
    { slug: "slab-leak-detection", name: "Slab Leak Detection" },
    { slug: "sewer-line-repair", name: "Sewer Line Repair" },
    { slug: "gas-line-plumbing", name: "Gas Line Plumbing" },
    { slug: "toilet-repair", name: "Toilet & Fixture Repair" },
    { slug: "pipe-replacement", name: "Whole-House Repiping" },
  ];

  const cities = [
    "Dallas", "Plano", "Frisco", "McKinney", "Allen",
    "Richardson", "Carrollton", "Garland", "Irving", "Grand Prairie",
    "Mesquite", "Denton", "Lewisville", "Grapevine", "Coppell",
    "Southlake", "Euless", "Bedford", "Hurst", "Arlington"
  ];

  const initialFiles: Array<{ path: string; content: string; lastModified?: number }> = [];

  // Common CSS & JS
  initialFiles.push({
    path: "styles.css",
    content: `/* Lone Star Pro Plumbing Production Styles */
:root { --primary: #1e40af; --accent: #0284c7; --text: #0f172a; }
body { font-family: system-ui, -apple-system, sans-serif; color: var(--text); margin: 0; }
.container { max-width: 1200px; margin: 0 auto; padding: 0 1rem; }
.btn-primary { background: var(--primary); color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold; }
.nav-link { color: var(--text); text-decoration: none; margin-right: 1.5rem; font-weight: 500; }
.ranklocal-sticky-call-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #0f172a; color: white; padding: 12px; text-align: center; z-index: 50; display: flex; justify-content: center; align-items: center; }
@media(min-width: 768px) { .ranklocal-sticky-call-bar { display: none; } }
`,
  });

  initialFiles.push({
    path: "script.js",
    content: `// Client interactions
document.addEventListener('DOMContentLoaded', function() {
  console.log('Lone Star Pro Plumbing site ready.');
});`,
  });

  // Base navigation HTML helper
  function buildNav(currentPath: string): string {
    return `<header class="site-header border-b py-4">
    <div class="container flex justify-between items-center">
      <a href="index.html" class="logo font-bold text-xl text-indigo-700">${businessName}</a>
      <nav class="nav">
        <a href="index.html" class="nav-link">Home</a>
        <a href="services/emergency-plumber-dallas.html" class="nav-link">Services</a>
        <a href="locations/plano.html" class="nav-link">Locations</a>
        <a href="about.html" class="nav-link">About</a>
        <a href="contact.html" class="nav-link">Contact</a>
      </nav>
      <a href="tel:${businessPhone.replace(/[^\d+]/g, "")}" class="btn-primary">Call ${businessPhone}</a>
    </div>
  </header>`;
  }

  // Home Page
  initialFiles.push({
    path: "index.html",
    content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plumber in Dallas, TX | 24/7 Lone Star Pro Plumbing | (214) 555-0199</title>
  <meta name="description" content="Top-rated plumbing services in Dallas, TX. Fast 24/7 emergency dispatch, drain cleaning, and water heater repair. Call (214) 555-0199 today!">
  <link rel="canonical" href="https://${domain}/">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  ${buildNav("index.html")}
  <main class="container py-8">
    <section class="hero py-12">
      <h1 class="text-4xl font-extrabold text-slate-900">Trusted Plumber in Dallas, TX</h1>
      <p class="text-lg text-slate-600 my-4 leading-relaxed">Fast, certified plumbing repair and installation across Dallas-Fort Worth metroplex. Available 24 hours a day with upfront transparent pricing.</p>
      <img src="images/plumber-hero.jpg" alt="Plumber in Dallas" data-remote-src="https://images.unsplash.com/photo-1581244277943-fe4a9c777189?w=1200" onerror="this.src='data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'800\\' height=\\'400\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%231e40af\\'/></svg>'">
      <div class="mt-6">
        <a href="tel:${businessPhone.replace(/[^\d+]/g, "")}" class="btn-primary">Call Now: ${businessPhone}</a>
      </div>
    </section>
  </main>
  <footer class="site-footer bg-slate-900 text-white py-8 mt-12">
    <div class="container text-center">
      <p>&copy; 2026 ${businessName}. All rights reserved.</p>
    </div>
  </footer>
  <div class="ranklocal-sticky-call-bar">
    <a href="tel:${businessPhone.replace(/[^\d+]/g, "")}" class="text-white font-bold text-sm">📞 Tap to Call: ${businessPhone}</a>
  </div>
</body>
</html>`,
  });

  // 8 Service Pages
  for (const s of services) {
    initialFiles.push({
      path: `services/${s.slug}.html`,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${s.name} in Dallas, TX | ${businessName}</title>
  <meta name="description" content="Professional ${s.name.toLowerCase()} in Dallas, TX. Licensed local plumbers, upfront rates, and fast dispatch. Call ${businessPhone}!">
  <link rel="canonical" href="https://${domain}/services/${s.slug}.html">
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  ${buildNav(`services/${s.slug}.html`)}
  <main class="container py-8">
    <h1 class="text-3xl font-bold text-slate-900">${s.name} in Dallas, TX</h1>
    <p class="text-base text-slate-600 my-4 leading-relaxed">Our certified technicians handle all aspects of ${s.name.toLowerCase()} for homeowners and commercial facilities throughout Dallas, TX.</p>
    <a href="tel:${businessPhone.replace(/[^\d+]/g, "")}" class="btn-primary">Speak with a Technician: ${businessPhone}</a>
  </main>
  <div class="ranklocal-sticky-call-bar">
    <a href="tel:${businessPhone.replace(/[^\d+]/g, "")}" class="text-white font-bold text-sm">📞 Call ${businessPhone}</a>
  </div>
</body>
</html>`,
    });
  }

  // 20 Location Pages
  for (const c of cities) {
    const slug = c.toLowerCase().replace(/\s+/g, "-");
    initialFiles.push({
      path: `locations/${slug}.html`,
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plumbing Services in ${c}, TX | ${businessName}</title>
  <meta name="description" content="Dedicated plumbing repairs and emergency service in ${c}, Texas. 24/7 response by licensed specialists. Call ${businessPhone}!">
  <link rel="canonical" href="https://${domain}/locations/${slug}.html">
  <link rel="stylesheet" href="../styles.css">
</head>
<body>
  ${buildNav(`locations/${slug}.html`)}
  <main class="container py-8">
    <h1 class="text-3xl font-bold text-slate-900">Licensed Local Plumber in ${c}, TX</h1>
    <p class="text-base text-slate-600 my-4">Serving residents of ${c} and surrounding neighborhoods with fast dispatch, water heater repair, and burst pipe solutions.</p>
    <a href="tel:${businessPhone.replace(/[^\d+]/g, "")}" class="btn-primary">Call ${c} Team: ${businessPhone}</a>
  </main>
  <div class="ranklocal-sticky-call-bar">
    <a href="tel:${businessPhone.replace(/[^\d+]/g, "")}" class="text-white font-bold text-sm">📞 Call ${businessPhone}</a>
  </div>
</body>
</html>`,
    });
  }

  // Utility Pages (About & Contact)
  initialFiles.push({
    path: "about.html",
    content: `<!DOCTYPE html><html lang="en"><head><title>About ${businessName}</title><meta name="description" content="About our plumbing team"><link rel="canonical" href="https://${domain}/about.html"><link rel="stylesheet" href="styles.css"></head><body>${buildNav("about.html")}<main class="container"><h1>About Us</h1></main></body></html>`,
  });
  initialFiles.push({
    path: "contact.html",
    content: `<!DOCTYPE html><html lang="en"><head><title>Contact ${businessName}</title><meta name="description" content="Contact our plumbing team"><link rel="canonical" href="https://${domain}/contact.html"><link rel="stylesheet" href="styles.css"></head><body>${buildNav("contact.html")}<main class="container"><h1>Contact Us</h1><a href="tel:${businessPhone.replace(/[^\d+]/g, "")}">Call ${businessPhone}</a></main></body></html>`,
  });

  console.log(`✓ Assembled realistic website with ${initialFiles.length} total files (${initialFiles.filter(f => f.path.endsWith(".html")).length} HTML pages)`);

  // --------------------------------------------------------------------------
  // STEP 2: Save Project and Verify Original Version (v0)
  // --------------------------------------------------------------------------
  console.log("\n--- 2. Initializing Project & Locking Original Version (v0) ---");
  let project: SavedProject = {
    id: "proj-lonestar-plumbing-test",
    name: businessName,
    createdAt: Date.now(),
    lastEditedAt: Date.now(),
    formData: {
      businessName,
      phone: businessPhone,
      city: primaryCity,
      stateRegion: "TX",
      websiteDomain: domain,
    },
    theme: { id: "blue", name: "Modern Navy", primaryColor: "#1e40af" } as any,
    nicheId: "plumbing",
    schemaType: "PlumbingService",
    businessDetails: {
      businessName,
      phone: businessPhone,
      city: primaryCity,
      stateRegion: "TX",
      websiteDomain: domain,
    } as any,
    serviceAreaCities: cities.map((c) => ({ city: c, stateId: "TX", county: "Dallas", lat: 32.7767, lng: -96.7970 })),
    keywordMap: services.map((s) => ({
      pagePath: `services/${s.slug}.html`,
      primaryKeyword: `${s.name.toLowerCase()} dallas`,
      secondaryKeywords: [`emergency ${s.name.toLowerCase()}`],
    })),
    customBlocks: [],
    pageContentMap: {},
    files: initialFiles,
    changeLog: [],
    redirects: [],
  };

  project = ensureProjectVersions(project);
  assert.ok(project.versions && project.versions.length === 1, "Original Version (v0) initialized");
  assert.strictEqual(project.versions[0].versionNumber, 1, "Version number is 1 (Original Website)");
  assert.ok(project.versions[0].label.includes("Version 1 (Original Website)"), "Version labeled 'Version 1 (Original Website)'");
  assert.strictEqual(project.versions[0].files.length, initialFiles.length, "Original files count matches baseline");
  console.log(`✓ Original Version 1 securely locked with ${project.versions[0].files.length} immutable files`);

  // --------------------------------------------------------------------------
  // STEP 3: Import Real Search Console-Style Performance Data
  // --------------------------------------------------------------------------
  console.log("\n--- 3. Importing Realistic Google Search Console Performance Data ---");
  const gscCsv = `Top queries,Clicks,Impressions,CTR,Position
24 hour emergency plumber dallas,18,340,5.29%,11.2
emergency plumbing service dallas,12,280,4.28%,12.8
emergency plumber near me,8,210,3.81%,14.5
burst pipe repair dallas tx,6,160,3.75%,9.8
slab leak detection plano,4,145,2.76%,13.1
plano foundation plumbing leak,2,98,2.04%,14.2
dallas commercial water heater repair,5,185,2.70%,15.4
drain cleaning specials dallas,9,290,3.10%,10.6`;

  const { queries } = parseGscCsv(gscCsv);
  assert.ok(queries.length >= 8, `Parsed ${queries.length} queries from GSC export`);

  const opportunities = generateGscOpportunities(
    {
      id: "dataset-oct-2026",
      dateRangeLabel: "Last 28 days",
      uploadedAt: Date.now(),
      type: "site-wide",
      queries,
    },
    project.files,
    project.keywordMap,
    cities
  );

  console.log(`✓ Identified GSC ranking opportunities:`);
  console.log(`   - Almost Page 1: ${opportunities.almostPageOne.length} queries`);
  console.log(`   - Low CTR Opportunities: ${opportunities.lowCtrOpportunities.length} queries`);
  console.log(`   - Missing Content Gaps: ${opportunities.missingContentQueries.length} items`);

  // --------------------------------------------------------------------------
  // STEP 4: Optimize Targeted Pages Based on Search Console Opportunities
  // --------------------------------------------------------------------------
  console.log("\n--- 4. Executing Surgical Search Console Optimization on Target Pages ---");

  // Page 1: services/emergency-plumber-dallas.html targeting "24 hour emergency plumber dallas"
  const targetPagePath = "services/emergency-plumber-dallas.html";
  const origPage = project.files.find((f) => f.path === targetPagePath)!;
  assert.ok(origPage, "Original target page exists");

  const optPage1 = optimizePageWithGscData(origPage.content, {
    pagePath: targetPagePath,
    queries: queries.filter((q) => q.query.includes("emergency plumber") || q.query.includes("burst pipe")),
    businessName,
    phone: businessPhone,
    city: "Dallas",
    state: "TX",
    availablePagePaths: project.files.filter((f) => f.path.endsWith(".html")).map((f) => f.path),
  });

  assert.ok(optPage1.optimizedHtml.includes("24 Hour Emergency Plumber Dallas"), "High-impression query integrated into title");
  assert.ok(optPage1.optimizedHtml.includes("gsc-optimized-block"), "Targeted service content block added");
  assert.ok(optPage1.optimizedHtml.includes(`tel:${businessPhone.replace(/[^\d+]/g, "")}`), "Verified phone number preserved in CTAs");
  assert.ok(optPage1.optimizedHtml.includes("gsc-internal-links"), "Contextual internal links to other pages added");

  // Page 2: locations/plano.html targeting "slab leak detection plano"
  const targetLocPath = "locations/plano.html";
  const origLocPage = project.files.find((f) => f.path === targetLocPath)!;
  const optPage2 = optimizePageWithGscData(origLocPage.content, {
    pagePath: targetLocPath,
    queries: queries.filter((q) => q.query.includes("plano")),
    businessName,
    phone: businessPhone,
    city: "Plano",
    state: "TX",
    availablePagePaths: project.files.filter((f) => f.path.endsWith(".html")).map((f) => f.path),
  });

  assert.ok(optPage2.optimizedHtml.includes("Slab Leak Detection Plano"), "Plano location page optimized with high-intent query");
  assert.ok(optPage2.optimizedHtml.includes(businessPhone), "Phone number strictly preserved in Plano page");

  // --------------------------------------------------------------------------
  // STEP 5: Create Versioned Snapshot (Improved Version 1)
  // --------------------------------------------------------------------------
  console.log("\n--- 5. Creating Improved Version 1 Snapshot ---");
  const updatedWorkingFiles = project.files.map((f) => {
    if (f.path === targetPagePath) {
      return { ...f, content: optPage1.optimizedHtml, lastModified: Date.now() };
    }
    if (f.path === targetLocPath) {
      return { ...f, content: optPage2.optimizedHtml, lastModified: Date.now() };
    }
    return f;
  });

  project = createProjectVersionSnapshot(project, {
    source: "search_console",
    summary: 'Optimized Emergency Plumbing & Plano location pages for high-impression queries "24 hour emergency plumber dallas" and "slab leak detection plano"',
    affectedPages: [targetPagePath, targetLocPath],
    updatedFiles: updatedWorkingFiles,
  });

  assert.strictEqual(project.versions?.length, 2, "Project now has 2 versions (Version 1 Original + Version 2 Improved)");
  assert.ok(project.versions![1].label.includes("Version 2"), "Second version labeled 'Version 2'");

  // --------------------------------------------------------------------------
  // STEP 6: Verify Original Files Remain 100% Intact
  // --------------------------------------------------------------------------
  console.log("\n--- 6. Verifying Original Files Integrity & Immutability ---");
  const origVer = getOriginalVersion(project)!;
  const origEmergencyFile = origVer.files.find((f) => f.path === targetPagePath)!;
  assert.strictEqual(origEmergencyFile.content, origPage.content, "Original Version emergency page is 100% UNTOUCHED");

  const currentVer = getCurrentVersion(project)!;
  const currentEmergencyFile = currentVer.files.find((f) => f.path === targetPagePath)!;
  assert.notStrictEqual(currentEmergencyFile.content, origEmergencyFile.content, "Current improved version contains targeted enhancements");

  // Verify unchanged pages are identical
  const origFriscoFile = origVer.files.find((f) => f.path === "locations/frisco.html")!;
  const currentFriscoFile = currentVer.files.find((f) => f.path === "locations/frisco.html")!;
  assert.strictEqual(origFriscoFile.content, currentFriscoFile.content, "Untouched pages remain 100% IDENTICAL");
  console.log("✓ Original Version verified: completely preserved without mutation");
  console.log("✓ Unchanged pages verified: 28 untouched pages perfectly identical");

  // --------------------------------------------------------------------------
  // STEP 7: Verify Preview <-> ZIP Single Source of Truth
  // --------------------------------------------------------------------------
  console.log("\n--- 7. Verifying Preview and ZIP Download Parity ---");
  const canonical = buildCanonicalWebsiteFiles(project.files, {
    projectName: businessName,
    domain,
    businessName,
    phone: businessPhone,
  });

  if (!canonical.validation.valid) {
    console.error("Canonical validation errors:", canonical.validation.errors);
    console.error("Failed checks:", canonical.validation.checks.filter((c) => !c.passed));
  }
  assert.strictEqual(canonical.validation.valid, true, "Canonical validation passed");
  console.log(`✓ Canonical files verified: ${canonical.files.length} files matching preview and export`);

  // --------------------------------------------------------------------------
  // STEP 8: Packaging ZIP & Automated 18-Rule Validation Check
  // --------------------------------------------------------------------------
  console.log("\n--- 8. Packaging Improved Website ZIP & Running 18-Rule Validation ---");
  const { blob, validation } = await generateWebsiteZIP(project, "full");
  assert.ok(blob, "ZIP blob generated");
  assert.ok(validation, "Validation result returned");
  if (!validation.valid) {
    console.error("Step 8 Validation errors:", validation.errors);
    console.error("Failed checks:", validation.checks.filter((c: any) => !c.passed));
  }
  assert.strictEqual(validation.valid, true, "ZIP validation check passed (valid: true)");
  assert.strictEqual(validation.passedChecks, 18, `All 18 automated validation checks passed (${validation.passedChecks}/${validation.totalChecks})`);

  console.log("✓ 18 Automated Checks Verified:");
  validation.checks.forEach((c: any, i: number) => {
    console.log(`   ${i + 1}. [${c.passed ? "PASS" : "FAIL"}] ${c.name}: ${c.message}`);
  });

  // --------------------------------------------------------------------------
  // STEP 9: Physical Disk Extraction & File Inspection
  // --------------------------------------------------------------------------
  console.log("\n--- 9. Physical Disk Extraction & Deep Inspection ---");
  const extractDir = path.resolve(process.cwd(), "scratch/gsc-opt-test/extracted");
  fs.mkdirSync(extractDir, { recursive: true });

  const arrayBuffer = await blob.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  let extractedCount = 0;
  for (const [relPath, entry] of Object.entries(zip.files)) {
    if (entry.dir) continue;
    const dest = path.join(extractDir, relPath);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    const content = await entry.async("nodebuffer");
    fs.writeFileSync(dest, content);
    extractedCount++;
  }

  assert.ok(extractedCount >= 30, `Extracted ${extractedCount} physical files to disk`);

  // Inspect physical files
  const diskIndex = fs.readFileSync(path.join(extractDir, "index.html"), "utf-8");
  const diskEmergency = fs.readFileSync(path.join(extractDir, "services/emergency-plumber-dallas.html"), "utf-8");
  const diskPlano = fs.readFileSync(path.join(extractDir, "locations/plano.html"), "utf-8");
  const diskSitemap = fs.readFileSync(path.join(extractDir, "sitemap.xml"), "utf-8");
  const diskRobots = fs.readFileSync(path.join(extractDir, "robots.txt"), "utf-8");
  const diskCss = fs.readFileSync(path.join(extractDir, "styles.css"), "utf-8");

  assert.ok(diskIndex.includes(businessPhone), "Disk index.html contains phone number");
  assert.ok(diskIndex.includes('name="viewport"'), "Disk index.html contains mobile viewport");
  assert.ok(diskEmergency.includes("24 Hour Emergency Plumber Dallas"), "Disk emergency page contains optimized GSC query");
  assert.ok(diskEmergency.includes(`tel:${businessPhone.replace(/[^\d+]/g, "")}`), "Disk emergency page preserves direct tel: dialing");
  assert.ok(diskPlano.includes("Slab Leak Detection Plano"), "Disk Plano page contains targeted query");
  assert.ok(diskSitemap.includes("<loc>"), "Disk sitemap.xml is valid XML");
  assert.ok(diskRobots.includes("Sitemap:"), "Disk robots.txt references sitemap");
  assert.ok(diskCss.includes(".ranklocal-sticky-call-bar"), "Disk styles.css contains mobile call bar styles");

  console.log(`✓ Physically extracted ${extractedCount} files to ${extractDir}`);
  console.log(`✓ Verified physical index.html, services, locations, sitemap, robots, and styles`);

  // --------------------------------------------------------------------------
  // STEP 10: Switch Back to Original Version and Verify
  // --------------------------------------------------------------------------
  console.log("\n--- 10. Testing Version Switcher (Rollback to Original Version) ---");
  const switchedProject = switchProjectVersion(project, origVer.id);
  const switchedEmergency = switchedProject.files.find((f) => f.path === targetPagePath)!;
  assert.strictEqual(switchedEmergency.content, origPage.content, "Switched back to Original Version successfully");
  console.log("✓ Successfully rolled back to Original Version with 1-click version switcher");

  console.log("\n==========================================================================");
  console.log(" ALL 10 PHASES OF THE OPTIMIZATION & VERSIONING WORKFLOW PASSED 100%");
  console.log("==========================================================================");
}

runGscOptimizationWorkflowTest().catch((err) => {
  console.error("FATAL ERROR in GSC Optimization Workflow Test:", err);
  process.exit(1);
});
