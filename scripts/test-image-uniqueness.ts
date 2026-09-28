import { assembleWebsite } from "../templates/assembler";
import { THEMES } from "../lib/themes";
import { SiteContentJSON } from "../lib/generator/content-schema";
import { extractPhotoId, isCopyrightFreeHeroPhoto } from "../lib/photos/photo-service";

async function runImageUniquenessTests() {
  console.log("================================================================================");
  console.log("       RANKLOCAL — STRICT IMAGE UNIQUENESS & COPYRIGHT-FREE HERO AUDIT          ");
  console.log("================================================================================");

  let passedTests = 0;
  let totalTests = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (details) console.error(`     Details: ${details}`);
      throw new Error(`Test failed: ${testName} - ${details || ""}`);
    }
  }

  // Setup sample comprehensive site content with multiple pages
  const sampleSiteData: SiteContentJSON = {
    site: {
      businessName: "Austin Elite Plumbing Pros",
      tagline: "Licensed & Insured Master Plumbers in Austin, TX",
      phone: "(512) 555-8921",
      email: "dispatch@austineliteplumbing.com",
      address: {
        street: "4100 South Congress Ave",
        city: "Austin",
        state: "TX",
        zip: "78745",
      },
      yearsInBusiness: 18,
      rating: 4.9,
      reviewCount: 387,
      serviceAreas: ["Austin", "Round Rock", "Cedar Park", "Pflugerville", "Georgetown"],
    },
    schema: {
      type: "Plumber",
      areaServed: ["Austin", "Round Rock", "Cedar Park"],
    },
    pages: [
      {
        slug: "index",
        seo: {
          title: "Austin Elite Plumbing Pros | 24/7 Master Plumbers in Austin TX",
          description: "Top-rated Austin emergency plumbers. Licensed master plumbing, drain cleaning, water heaters, and pipe repair.",
          h1: "Fast, Reliable Austin Plumbing Specialists",
        },
        sections: [
          {
            type: "hero",
            variant: "split-clean",
            content: {
              headline: "Fast, Reliable Austin Plumbing Specialists",
              subheadline: "24/7 emergency dispatch, upfront flat-rate quotes, and master-certified technicians at your door.",
              ctaPrimaryText: "Call (512) 555-8921",
              ctaSecondaryText: "View Services",
            },
          },
          {
            type: "trustBar",
            content: {
              stat1Number: "18+",
              stat1Label: "Years in Business",
              stat2Number: "4.9★",
              stat2Label: "Google Rating",
              stat3Number: "24/7",
              stat3Label: "Emergency Dispatch",
            },
          },
          {
            type: "services",
            variant: "interactive-grid",
            content: {
              eyebrow: "Our Core Capabilities",
              headline: "Comprehensive Plumbing Services in Austin",
              subheadline: "From emergency pipe repair to complete water heater installation.",
              items: [
                {
                  title: "Emergency Pipe Leak Repair",
                  description: "Rapid electronic leak detection and burst pipe repair to prevent water damage.",
                  slug: "services/emergency-pipe-leak-repair.html",
                },
                {
                  title: "Tankless Water Heater Installation",
                  description: "High-efficiency tankless and conventional water heater replacement and repair.",
                  slug: "services/water-heater-repair.html",
                },
                {
                  title: "Hydro-Jetting Drain Cleaning",
                  description: "Heavy-duty commercial and residential rooter and drain clearing services.",
                  slug: "services/drain-cleaning.html",
                },
              ],
            },
          },
          {
            type: "about",
            variant: "split-story",
            content: {
              eyebrow: "About Our Company",
              headline: "Decades of Dedicated Craftsmanship in Central Texas",
              leadParagraph: "We have served greater Austin homeowners with honest pricing and uncompromising quality.",
              paragraph2: "Every technician on our crew is background-checked and fully licensed.",
            },
          },
          {
            type: "gallery",
            variant: "showcase",
            content: {
              eyebrow: "Our Real Work",
              headline: "Recent Installations & Repairs",
            },
          },
          {
            type: "ctaBanner",
            variant: "locationMap",
            content: {
              headline: "Need an Expert Plumber in Austin Right Now?",
              subheadline: "Call our master plumbing technicians now for priority dispatch.",
              ctaText: "Call (512) 555-8921",
            },
          },
        ],
      },
      {
        slug: "services",
        seo: {
          title: "Plumbing Services Hub | Austin Elite Plumbing Pros",
          description: "Explore all residential and commercial plumbing services offered in Austin, TX.",
          h1: "All Residential & Commercial Plumbing Services",
        },
        sections: [
          {
            type: "hero",
            variant: "split-clean",
            content: {
              headline: "Full-Spectrum Plumbing Solutions",
              subheadline: "Guaranteed workmanship on every job.",
            },
          },
          {
            type: "services",
            variant: "interactive-grid",
            content: {
              headline: "Complete Trade Capabilities",
              items: [
                { title: "Sewer Line Camera Inspection", slug: "services/sewer-line-inspection.html" },
                { title: "Gas Line Repair & Certification", slug: "services/gas-line-repair.html" },
                { title: "Garbage Disposal Replacement", slug: "services/disposal-repair.html" },
              ],
            },
          },
        ],
      },
      {
        slug: "services/emergency-pipe-leak-repair",
        seo: {
          title: "Emergency Pipe Leak Repair in Austin TX",
          description: "24/7 urgent pipe repair and leak detection in Austin.",
          h1: "Emergency Pipe Leak Repair & Detection",
        },
        sections: [
          {
            type: "hero",
            variant: "split-clean",
            content: {
              headline: "Emergency Pipe Leak Repair & Detection",
              subheadline: "Fast emergency response to shut down leaks and save your property.",
            },
          },
          {
            type: "about",
            content: {
              headline: "How We Diagnose & Repair Water Leaks",
              leadParagraph: "Using non-invasive acoustic and thermal detection instruments.",
            },
          },
        ],
      },
      {
        slug: "services/water-heater-repair",
        seo: {
          title: "Water Heater Repair & Installation Austin TX",
          description: "Top-rated water heater service in Austin.",
          h1: "Water Heater Repair & Tankless Replacement",
        },
        sections: [
          {
            type: "hero",
            variant: "split-clean",
            content: {
              headline: "Water Heater Repair & Replacement",
              subheadline: "Restore reliable hot water today with upfront flat-rate pricing.",
            },
          },
        ],
      },
      {
        slug: "about",
        seo: {
          title: "About Austin Elite Plumbing Pros | Master Plumbers",
          description: "Learn about our history and commitment to Austin homeowners.",
          h1: "About Austin Elite Plumbing Pros",
        },
        sections: [
          {
            type: "hero",
            variant: "split-clean",
            content: {
              headline: "About Our Team & Master Licensing",
              subheadline: "Serving Austin with integrity since 2008.",
            },
          },
          {
            type: "about",
            content: {
              headline: "Our Commitment to Customer Excellence",
              leadParagraph: "Austin homeowners rely on us for punctual, clean, and warrantied service.",
            },
          },
        ],
      },
      {
        slug: "contact",
        seo: {
          title: "Contact Austin Elite Plumbing Pros | 24/7 Phone Dispatch",
          description: "Call our Austin plumbing dispatch for immediate service.",
          h1: "Contact Our Austin Plumbing Office",
        },
        sections: [
          {
            type: "hero",
            variant: "split-clean",
            content: {
              headline: "Get In Touch With Austin Elite Plumbing",
              subheadline: "Immediate dispatch by direct phone call.",
            },
          },
        ],
      },
    ],
  };

  const serviceAreaCities = [
    { city: "Austin", stateId: "TX", county: "Travis County", population: 975000, distanceOffset: "0 miles" },
    { city: "Round Rock", stateId: "TX", county: "Williamson County", population: 125000, distanceOffset: "18 miles" },
    { city: "Cedar Park", stateId: "TX", county: "Williamson County", population: 78000, distanceOffset: "22 miles" },
  ];

  console.log("\n[Test Suite 1] Assembling multi-page site and analyzing image usage...");
  const assembled = await assembleWebsite(sampleSiteData, THEMES[0], {
    domain: "austineliteplumbing.com",
    serviceAreaCities,
    fastOfflinePreview: false,
    validateNetwork: false,
  });

  const htmlFiles = assembled.files.filter((f) => f.path.endsWith(".html"));
  console.log(`Generated ${htmlFiles.length} HTML pages across the website.`);

  // Extract all <img> src attributes and background URLs from rendered HTML
  const imgSrcRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  const collectedImages: Array<{ page: string; src: string; isHero: boolean }> = [];

  for (const file of htmlFiles) {
    let match;
    const content = file.content;
    const isHeroContext = (idx: number) => {
      // Check if image occurs within hero section
      const preContent = content.substring(Math.max(0, idx - 500), idx + 200);
      return preContent.includes("hero") || preContent.includes("banner");
    };

    while ((match = imgSrcRegex.exec(content)) !== null) {
      const src = match[1];
      // Skip inline SVGs or local fallback icons if necessary
      collectedImages.push({
        page: file.path,
        src,
        isHero: isHeroContext(match.index),
      });
    }
  }

  console.log(`Total <img> tags found across all pages: ${collectedImages.length}`);
  console.log("Images on index.html:");
  collectedImages.filter(c => c.page === "index.html").forEach((c, idx) => {
    console.log(` [${idx}] ${extractPhotoId(c.src)} => ${c.src}`);
  });

  // Test 1: Deduplication of remote image URLs
  console.log("\n[Test Suite 2] Strict Image URL & Photo ID Deduplication...");
  const seenPhotoIds = new Map<string, string>(); // photoId -> page found
  const duplicateViolations: string[] = [];

  for (const item of collectedImages) {
    const photoId = extractPhotoId(item.src);
    if (!photoId) continue;

    // Check if this photo ID has already been seen on another page or slot
    if (seenPhotoIds.has(photoId)) {
      duplicateViolations.push(`Duplicate photo [${photoId}] on ${item.page}, first seen on ${seenPhotoIds.get(photoId)}`);
    } else {
      seenPhotoIds.set(photoId, item.page);
    }
  }

  assert(
    duplicateViolations.length === 0,
    "Strict rule: 1 image should NOT be used 2 times across the entire website",
    duplicateViolations.join("; ")
  );

  // Test 2: Hero images must be high-resolution copyright-free photos
  console.log("\n[Test Suite 3] Hero Section Copyright-Free Photography Audit...");
  const heroImages = collectedImages.filter((img) => img.isHero);
  console.log(`Auditing ${heroImages.length} hero images...`);

  let invalidHeroSources: string[] = [];
  for (const h of heroImages) {
    const isCopyrightFree = isCopyrightFreeHeroPhoto(h.src);
    if (!isCopyrightFree) {
      invalidHeroSources.push(`Hero on ${h.page} is not from Pexels, Pixabay, or Unsplash: ${h.src}`);
    }
  }

  assert(
    invalidHeroSources.length === 0,
    "All hero section images must be copyright-free photography from Pexels, Pixabay, or Unsplash (Zero Bing thumbnails for hero)",
    invalidHeroSources.join("; ")
  );

  // Test 3: Bing query keyword mutation check
  console.log("\n[Test Suite 4] Dynamic Keyword Mutation in Search Queries...");
  const bingImages = collectedImages.filter((img) => img.src.includes("bing.com/th"));
  const bingQueries = new Set<string>();
  const duplicateBingQueries: string[] = [];

  for (const b of bingImages) {
    const qMatch = b.src.match(/[?&]q=([^&]+)/);
    if (qMatch) {
      const qVal = decodeURIComponent(qMatch[1]);
      if (bingQueries.has(qVal)) {
        duplicateBingQueries.push(`Duplicate Bing query "${qVal}" on ${b.page}`);
      } else {
        bingQueries.add(qVal);
      }
    }
  }

  assert(
    duplicateBingQueries.length === 0,
    "Bing images dynamically alter keywords (q=keywords+change) to avoid duplicate images",
    duplicateBingQueries.join("; ")
  );

  // Test 4: Verify across all 10 themes that no hero duplicates occur
  console.log("\n[Test Suite 5] Theme Multi-Site Hero Uniqueness Check...");
  for (let t = 0; t < THEMES.length; t++) {
    const theme = THEMES[t];
    const themeAssembled = await assembleWebsite(sampleSiteData, theme, {
      domain: `theme-test-${theme.id}.com`,
      fastOfflinePreview: true,
    });

    const themeHeroImages: string[] = [];
    const themeHtmlFiles = themeAssembled.files.filter((f) => f.path.endsWith(".html"));
    const themeTracker = new Set<string>();
    let themeDuplicateCount = 0;

    for (const f of themeHtmlFiles) {
      let m;
      while ((m = imgSrcRegex.exec(f.content)) !== null) {
        const id = extractPhotoId(m[1]);
        if (id) {
          if (themeTracker.has(id)) {
            themeDuplicateCount++;
          }
          themeTracker.add(id);
        }
      }
    }

    assert(
      themeDuplicateCount === 0,
      `Theme [${theme.id} (${theme.name})] produces zero duplicate images across all pages`,
      `Found ${themeDuplicateCount} duplicate images`
    );
  }

  console.log("\n================================================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} IMAGE UNIQUENESS & COPYRIGHT AUDIT TESTS PASSED!`);
  console.log("================================================================================");
}

runImageUniquenessTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
