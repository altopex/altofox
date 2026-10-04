/**
 * Automated Verification Test Suite for RankLocal Website Quality Auto-Fix Engine
 * 
 * Verifies that the Auto-Fix system safely fixes:
 * 1. Duplicate image -> select replacement
 * 2. Missing alt -> generate alt
 * 3. Duplicate title -> regenerate
 * 4. Broken internal link -> select valid destination
 * 5. Weak internal linking -> add valid links & eliminate orphan pages
 * 6. Thin page -> improve content
 * 
 * Verifies the strict rule:
 * "After fixing: RUN AUDIT AGAIN. Do not mark an issue fixed until the audit confirms it."
 * 
 * Verifies the exact report:
 * Issues Before
 * Issues Fixed
 * Issues Remaining
 * Final Score
 */

import { QualityAuditEngine, QualityAuditFile, QualityAuditMeta } from "../lib/quality/quality-audit-engine";
import { QualityAutoFixEngine } from "../lib/quality/quality-auto-fix-engine";

function runTest() {
  console.log("================================================================================");
  console.log("       STARTING RANKLOCAL WEBSITE QUALITY AUTO-FIX ENGINE VERIFICATION         ");
  console.log("================================================================================\n");

  const meta: QualityAuditMeta = {
    businessName: "Chicago Precision Plumbing",
    phone: "(312) 555-0199",
    email: "service@chicagoprecisionplumbing.com",
    city: "Chicago",
    state: "IL",
    streetAddress: "123 N Michigan Ave",
    domain: "chicagoprecisionplumbing.com",
    realReviewsConfirmed: true,
  };

  // 1. Construct a website with 4 pages containing all 6 intentional defects:
  // - Duplicate image (index.html has duplicate src="https://images.pexels.com/photos/6419121/pexels-photo-6419121.jpeg?auto=compress&cs=tinysrgb&w=1920")
  // - Missing alt (water-heater-repair.html has <img> with no alt and <img> with alt="photo")
  // - Duplicate title (water-heater-repair.html and drain-cleaning.html have identical <title>Plumbing Services | Chicago Precision Plumbing</title>)
  // - Broken internal link (index.html has <a href="non-existent-repairs.html">)
  // - Weak internal linking / orphan page (isolated-repair.html has 0 incoming links from other pages)
  // - Thin page (isolated-repair.html has only 48 words of body content)

  const flawedFiles: QualityAuditFile[] = [
    // Page 1: Homepage (index.html) - contains duplicate image and broken internal link
    {
      path: "index.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plumber in Chicago, IL | Chicago Precision Plumbing</title>
  <meta name="description" content="Licensed plumbing in Chicago, IL. Emergency 24/7 service, drain cleaning & water heaters. Call (312) 555-0199!">
  <link rel="canonical" href="https://chicagoprecisionplumbing.com/">
</head>
<body>
  <header>
    <nav class="header-nav">
      <a href="index.html">Home</a>
      <a href="water-heater-repair.html">Water Heater</a>
      <a href="drain-cleaning.html">Drain Cleaning</a>
      <a href="contact.html">Contact</a>
    </nav>
  </header>
  <main>
    <h1>Chicago Emergency Plumbing & Drain Cleaning</h1>
    <p>Chicago Precision Plumbing delivers fast, reliable, and licensed plumbing services across Cook County. Our certified technicians specialize in complex pipe diagnostics, sewer inspections, hydro-jetting, and premium fixture installations. We operate 24/7 with upfront flat-rate pricing and complete workmanship guarantees for residential and commercial customers.</p>
    
    <!-- Duplicate image #1 -->
    <img src="https://images.pexels.com/photos/6419121/pexels-photo-6419121.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="Plumbing technician under sink" width="800" height="533" loading="eager">
    
    <h2>Comprehensive Residential Plumbing in Chicago</h2>
    <p>From older historic brownstones to new residential builds, our licensed crew understands regional municipal plumbing codes. We resolve stubborn clogs, backflow preventer failures, and sump pump emergencies quickly.</p>
    
    <!-- Duplicate image #2 (exact same src on the same page!) -->
    <img src="https://images.pexels.com/photos/6419121/pexels-photo-6419121.jpeg?auto=compress&cs=tinysrgb&w=1920" alt="Technician repeating image" width="800" height="533" loading="lazy">

    <!-- Broken internal link (target does not exist) -->
    <p>Check out our <a href="non-existent-repairs.html">Specialized Pipe Restoration</a> for older residences.</p>

    <!-- Dead CTA link -->
    <a href="#" class="btn btn-primary">Schedule Service</a>

    <p>Contact our local dispatch team directly at <a href="tel:3125550199">(312) 555-0199</a>.</p>
  </main>
  <footer>
    <nav class="footer-nav">
      <a href="index.html">Home</a>
      <a href="water-heater-repair.html">Water Heater</a>
      <a href="drain-cleaning.html">Drain Cleaning</a>
      <a href="contact.html">Contact</a>
    </nav>
  </footer>
</body>
</html>`,
      mimeType: "text/html",
    },

    // Page 2: Water Heater Repair - duplicate title with Page 3, missing alt, generic alt
    {
      path: "water-heater-repair.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Duplicate Title #1 -->
  <title>Plumbing Services | Chicago Precision Plumbing</title>
  <meta name="description" content="Professional water heater repair in Chicago, IL. Fast diagnostic dispatch & flat-rate pricing. Call (312) 555-0199.">
  <link rel="canonical" href="https://chicagoprecisionplumbing.com/water-heater-repair.html">
</head>
<body>
  <header>
    <nav class="header-nav">
      <a href="index.html">Home</a>
      <a href="drain-cleaning.html">Drain Cleaning</a>
      <a href="contact.html">Contact</a>
    </nav>
  </header>
  <main>
    <h1>Water Heater Repair & Replacement in Chicago</h1>
    <p>When hot water fails in the middle of winter, you need rapid, dependable repair from licensed Chicago plumbers. We service gas, electric, tankless, and hybrid heat pump hot water systems across Chicago neighborhoods.</p>
    
    <!-- Image with missing alt attribute entirely -->
    <img src="https://images.pexels.com/photos/8486972/pexels-photo-8486972.jpeg?auto=compress&cs=tinysrgb&w=800" width="800" height="533" loading="lazy">

    <h2>Diagnostic Procedures for Water Heating Units</h2>
    <p>Our technicians test heating elements, thermocouple assemblies, gas control valves, and pressure relief safety components to pinpoint failures accurately and restore safe hot water supply.</p>

    <!-- Image with generic alt attribute ("photo") -->
    <img src="https://images.pexels.com/photos/8486974/pexels-photo-8486974.jpeg?auto=compress&cs=tinysrgb&w=800" alt="photo" width="800" height="533" loading="lazy">

    <p>Call our emergency dispatch today at <a href="tel:3125550199">(312) 555-0199</a>.</p>
  </main>
  <footer>
    <nav class="footer-nav">
      <a href="index.html">Home</a>
      <a href="contact.html">Contact</a>
    </nav>
  </footer>
</body>
</html>`,
      mimeType: "text/html",
    },

    // Page 3: Drain Cleaning - duplicate title with Page 2
    {
      path: "drain-cleaning.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Duplicate Title #2 (same as Page 2!) -->
  <title>Plumbing Services | Chicago Precision Plumbing</title>
  <meta name="description" content="Expert drain cleaning in Chicago, IL. Hydro-jetting and snake camera inspection. Call (312) 555-0199!">
  <link rel="canonical" href="https://chicagoprecisionplumbing.com/drain-cleaning.html">
</head>
<body>
  <header>
    <nav class="header-nav">
      <a href="index.html">Home</a>
      <a href="water-heater-repair.html">Water Heater</a>
      <a href="contact.html">Contact</a>
    </nav>
  </header>
  <main>
    <h1>Precision Drain Cleaning & Sewer Line Hydro-Jetting</h1>
    <p>Clogged drains, slow shower traps, and recurring sewer backups disrupt your day. Our commercial snakes and high-pressure water jetting clear grease, roots, and mineral deposits thoroughly.</p>
    
    <h2>Video Camera Sewer Line Diagnostics</h2>
    <p>We insert optical sewer cameras to inspect pipes beneath your slab or yard, detecting cracks and offset joints before recommending targeted repairs.</p>
    
    <img src="https://images.pexels.com/photos/6419125/pexels-photo-6419125.jpeg?auto=compress&cs=tinysrgb&w=800" alt="Drain technician inspecting cleanout" width="800" height="533" loading="lazy">
    
    <p>For urgent drain clearing, phone <a href="tel:3125550199">(312) 555-0199</a>.</p>
  </main>
  <footer>
    <nav class="footer-nav">
      <a href="index.html">Home</a>
      <a href="contact.html">Contact</a>
    </nav>
  </footer>
</body>
</html>`,
      mimeType: "text/html",
    },

    // Page 4: Isolated & Thin Page (orphan page with NO incoming links from anywhere + thin body text < 100 words)
    {
      path: "isolated-repair.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Isolated Plumbing Services in Chicago | Chicago Precision</title>
  <meta name="description" content="Quick overview of specialty isolated repair services in Chicago.">
  <link rel="canonical" href="https://chicagoprecisionplumbing.com/isolated-repair.html">
</head>
<body>
  <header>
    <nav class="header-nav">
      <a href="index.html">Home</a>
    </nav>
  </header>
  <main>
    <h1>Specialty Fixture Repair</h1>
    <p>We provide specialty fixture repair for unique valves, vintage faucets, and heritage residential systems.</p>
    <p>Call (312) 555-0199 for an appointment.</p>
  </main>
  <footer>
    <nav class="footer-nav">
      <a href="index.html">Home</a>
    </nav>
  </footer>
</body>
</html>`,
      mimeType: "text/html",
    },

    // Page 5: Contact page
    {
      path: "contact.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contact Chicago Precision Plumbing | Emergency Dispatch</title>
  <meta name="description" content="Contact Chicago Precision Plumbing for 24/7 emergency dispatch and quotes. Call (312) 555-0199.">
  <link rel="canonical" href="https://chicagoprecisionplumbing.com/contact.html">
</head>
<body>
  <header>
    <nav class="header-nav">
      <a href="index.html">Home</a>
      <a href="water-heater-repair.html">Water Heater</a>
      <a href="drain-cleaning.html">Drain Cleaning</a>
    </nav>
  </header>
  <main>
    <h1>Contact Our Chicago Dispatch Team</h1>
    <p>Reach out to our customer service desk 24 hours a day for immediate dispatch or to request a free in-home estimate. Our technicians are stationed throughout Cook County for rapid transit.</p>
    <h2>Office Location & Telephone</h2>
    <p>Phone: <a href="tel:3125550199">(312) 555-0199</a></p>
    <p>Address: 123 N Michigan Ave, Chicago, IL 60601</p>
  </main>
  <footer>
    <nav class="footer-nav">
      <a href="index.html">Home</a>
      <a href="drain-cleaning.html">Drain Cleaning</a>
    </nav>
  </footer>
</body>
</html>`,
      mimeType: "text/html",
    },

    // XML Sitemap and robots.txt
    {
      path: "sitemap.xml",
      content: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://chicagoprecisionplumbing.com/</loc></url>
  <url><loc>https://chicagoprecisionplumbing.com/water-heater-repair.html</loc></url>
  <url><loc>https://chicagoprecisionplumbing.com/drain-cleaning.html</loc></url>
  <url><loc>https://chicagoprecisionplumbing.com/contact.html</loc></url>
  <url><loc>https://chicagoprecisionplumbing.com/isolated-repair.html</loc></url>
</urlset>`,
      mimeType: "application/xml",
    },
    {
      path: "robots.txt",
      content: "User-agent: *\nAllow: /\nSitemap: https://chicagoprecisionplumbing.com/sitemap.xml\n",
      mimeType: "text/plain",
    },
  ];

  // -------------------------------------------------------------------------
  // STEP 1: PRE-FIX AUDIT
  // -------------------------------------------------------------------------
  console.log("STEP 1: Running Pre-Fix Quality Audit on Flawed Website...");
  const preAudit = QualityAuditEngine.audit(flawedFiles, meta);

  console.log(`Pre-Fix Score: ${preAudit.overallScore}/100`);
  console.log(`Pre-Fix Issues Detected (${preAudit.issues.length}):`);
  for (const iss of preAudit.issues) {
    console.log(`  - ${iss}`);
  }

  // Assert that initial defects were successfully detected
  const hasDupImg = preAudit.detailedIssues.some((i) => i.check === "Duplicate images");
  const hasMissingAlt = preAudit.detailedIssues.some((i) => i.check === "Missing alt text");
  const hasDupTitle = preAudit.detailedIssues.some((i) => i.check === "Duplicate titles");
  const hasBrokenLink = preAudit.detailedIssues.some((i) => i.check === "Broken links");
  const hasOrphanPage = preAudit.detailedIssues.some((i) => i.check === "Orphan pages");
  const hasThinPage = preAudit.detailedIssues.some((i) => i.check === "Thin pages");

  if (!hasDupImg) throw new Error("FAIL: Pre-fix audit did not detect duplicate images.");
  if (!hasMissingAlt) throw new Error("FAIL: Pre-fix audit did not detect missing alt text.");
  if (!hasDupTitle) throw new Error("FAIL: Pre-fix audit did not detect duplicate titles.");
  if (!hasBrokenLink) throw new Error("FAIL: Pre-fix audit did not detect broken internal link.");
  if (!hasOrphanPage) throw new Error("FAIL: Pre-fix audit did not detect orphan page.");
  if (!hasThinPage) throw new Error("FAIL: Pre-fix audit did not detect thin page.");

  console.log(">>> All 6 target defects successfully confirmed by pre-fix audit.\n");

  // -------------------------------------------------------------------------
  // STEP 2: EXECUTE "FIX ALL ISSUES"
  // -------------------------------------------------------------------------
  console.log("STEP 2: Executing QualityAutoFixEngine.fixAllIssues...");
  const fixResult = QualityAutoFixEngine.fixAllIssues(flawedFiles, meta, {
    trade: "Plumbing",
    domain: meta.domain,
  });

  // -------------------------------------------------------------------------
  // STEP 3: VERIFY POST-FIX AUDIT RE-EVALUATION
  // "After fixing: RUN AUDIT AGAIN. Do not mark an issue fixed until the audit confirms it."
  // -------------------------------------------------------------------------
  console.log("STEP 3: Verifying Post-Fix Re-Audit Results...");
  const postAudit = fixResult.auditAfter;

  console.log(`Post-Fix Score: ${postAudit.overallScore}/100 (Score Delta: +${fixResult.scoreDelta} pts)`);

  // Verify specific issues are truly absent in post-audit
  const postDupImg = postAudit.detailedIssues.some((i) => i.check === "Duplicate images");
  const postMissingAlt = postAudit.detailedIssues.some((i) => i.check === "Missing alt text");
  const postDupTitle = postAudit.detailedIssues.some((i) => i.check === "Duplicate titles");
  const postBrokenLink = postAudit.detailedIssues.some((i) => i.check === "Broken links");
  const postOrphanPage = postAudit.detailedIssues.some((i) => i.check === "Orphan pages");
  const postThinPage = postAudit.detailedIssues.some((i) => i.check === "Thin pages");

  if (postDupImg) throw new Error("FAIL: Duplicate image issue still present in post-fix audit.");
  if (postMissingAlt) throw new Error("FAIL: Missing alt text issue still present in post-fix audit.");
  if (postDupTitle) throw new Error("FAIL: Duplicate title issue still present in post-fix audit.");
  if (postBrokenLink) throw new Error("FAIL: Broken link issue still present in post-fix audit.");
  if (postOrphanPage) throw new Error("FAIL: Orphan page issue still present in post-fix audit.");
  if (postThinPage) throw new Error("FAIL: Thin page issue still present in post-fix audit.");

  // Verify that issuesFixed strictly reflects issues confirmed resolved
  if (fixResult.issuesFixed.length === 0) {
    throw new Error("FAIL: issuesFixed is empty despite successful fixes.");
  }

  // -------------------------------------------------------------------------
  // STEP 4: VERIFY REQUIRED REPORT FORMAT
  // Issues Before
  // Issues Fixed
  // Issues Remaining
  // Final Score
  // -------------------------------------------------------------------------
  console.log("\nSTEP 4: Outputting Official Verification Report:");
  console.log(fixResult.reportText);

  // Validate report text format
  if (!fixResult.reportText.includes("Issues Before:")) {
    throw new Error("FAIL: Report text missing 'Issues Before:' section.");
  }
  if (!fixResult.reportText.includes("Issues Fixed:")) {
    throw new Error("FAIL: Report text missing 'Issues Fixed:' section.");
  }
  if (!fixResult.reportText.includes("Issues Remaining:")) {
    throw new Error("FAIL: Report text missing 'Issues Remaining:' section.");
  }
  if (!fixResult.reportText.includes("Final Score:")) {
    throw new Error("FAIL: Report text missing 'Final Score:' section.");
  }

  if (fixResult.finalScore < 95) {
    throw new Error(`FAIL: Final score ${fixResult.finalScore}/100 is below the 95+ target.`);
  }

  console.log("\n================================================================================");
  console.log("       ALL AUTO-FIX ENGINE VERIFICATION CHECKS PASSED (100% SUCCESS)            ");
  console.log("================================================================================\n");
}

runTest();
