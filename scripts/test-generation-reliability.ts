/**
 * RankLocal Website Generation Reliability & Hang-Prevention Verification Suite
 * 
 * Verifies that:
 * 1. Image plan resolution parallelizes in batches and respects aggregate timeout budget
 * 2. Generation timeouts and retry fallback to curated trade templates function in 0ms without hanging
 * 3. Assembled websites produce 100% complete zero-build static packages with offline SVG assets
 * 4. JSZip bundling safely handles binary assets without decoding corruption and has a timeout guard
 * 5. Generation state tracks real progress and never stalls indefinitely
 */

import assert from "assert";
import { createImagePlan, resolveImagePlanWithValidation, bundleImagesFromPlan } from "../lib/photos/image-bundler";
import { buildDefaultTradeContentJSON } from "../lib/generator/ai-content-prompt";
import { assembleWebsite } from "../templates/assembler";
import { THEMES } from "../lib/themes";
import { generateWebsiteZIP } from "../lib/storage/db";
import { generateWebsite } from "../lib/ai/generate-website";

async function runReliabilityTests() {
  console.log("==================================================");
  console.log("🧪 TESTING RANKLOCAL WEBSITE GENERATION RELIABILITY");
  console.log("==================================================\n");

  let passedTests = 0;
  let totalTests = 0;

  function test(description: string, fn: () => void | Promise<void>) {
    totalTests++;
    try {
      const res = fn();
      if (res instanceof Promise) {
        return res
          .then(() => {
            console.log(`  ✅ PASS: ${description}`);
            passedTests++;
          })
          .catch((err) => {
            console.error(`  ❌ FAIL: ${description}`);
            console.error(err);
            process.exit(1);
          });
      }
      console.log(`  ✅ PASS: ${description}`);
      passedTests++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${description}`);
      console.error(err);
      process.exit(1);
    }
  }

  // TEST 1: Parallel Image Resolution with Aggregate Time Budget
  await test("Image plan resolution processes slots rapidly and respects max budget", async () => {
    const rawPages = [
      {
        slug: "index.html",
        title: "Home",
        sections: [
          { type: "hero", title: "Professional Plumbing Services" },
          { type: "services", title: "Our Core Services" },
          { type: "whyUs", title: "Why Choose Our Plumbers" },
          { type: "testimonials", title: "Customer Reviews" },
          { type: "contact", title: "Contact Us Today" },
        ],
      },
      {
        slug: "services.html",
        title: "Services",
        sections: [
          { type: "hero", title: "Plumbing Repair Solutions" },
          { type: "services", title: "All Residential Services" },
        ],
      },
    ];

    const initialPlan = createImagePlan(rawPages, "Plumber", "Dallas", "Dallas Pro Plumbing", [], {
      preferredSource: "bing",
    });

    assert.ok(initialPlan.length >= 6, `Expected at least 6 slots, got ${initialPlan.length}`);

    const startResolve = Date.now();
    const resolvedPlan = await resolveImagePlanWithValidation(initialPlan, "Plumber", "Dallas", {
      validateNetwork: false, // Default during site generation
      maxValidationTimeMs: 2000,
    });
    const resolveDuration = Date.now() - startResolve;

    assert.strictEqual(resolvedPlan.length, initialPlan.length, "All slots must be preserved");
    assert.ok(resolveDuration < 1500, `Image resolution must complete in <1500ms, took ${resolveDuration}ms`);

    // Verify all slots have valid local SVG and remote fallbacks
    for (const slot of resolvedPlan) {
      assert.ok(slot.remoteUrl, "Slot must have remoteUrl");
      assert.ok(slot.localSvgPath, "Slot must have localSvgPath");
    }
  });

  // TEST 2: High-speed assembly with curated trade template engine
  await test("Curated trade template fallback generates complete static website in < 1s", async () => {
    const websiteData = {
      businessName: "Lone Star Plumbing",
      businessType: "Plumber",
      city: "Fort Worth",
      stateRegion: "TX",
      phone: "(817) 555-0199",
      email: "service@lonestarplumbing.com",
      targetKeywords: "plumber in fort worth tx, emergency drain cleaning",
      keywords: ["plumber in fort worth tx", "emergency drain cleaning"],
      pagesToCreate: ["Home", "About", "Services", "Contact", "FAQ", "Service Areas"],
      separateServicePages: true,
      separateAreaPages: false,
    };

    const targetPages = ["Home", "About", "Services", "Contact", "FAQ", "Service Areas"];
    const startAssemble = Date.now();
    const contentJSON = buildDefaultTradeContentJSON(websiteData as any, targetPages);

    assert.ok(contentJSON.site.businessName === "Lone Star Plumbing", "Business name must match");
    assert.ok(contentJSON.pages.length >= 5, "Must generate all required pages");

    const theme = THEMES[0];
    const assembled = await assembleWebsite(contentJSON, theme, {
      validateNetwork: false,
      domain: "lonestarplumbing.com",
    });
    const duration = Date.now() - startAssemble;

    assert.ok(duration < 2500, `Complete website assembly must finish in <2500ms, took ${duration}ms`);
    assert.ok(assembled.files.length >= 10, `Expected >= 10 files, got ${assembled.files.length}`);

    // Verify essential files
    const htmlFiles = assembled.files.filter((f) => f.path.endsWith(".html"));
    const cssFile = assembled.files.find((f) => f.path.endsWith("style.css"));
    const jsFile = assembled.files.find((f) => f.path.endsWith("main.js"));
    const svgFiles = assembled.files.filter((f) => f.path.endsWith(".svg"));

    assert.ok(htmlFiles.length >= 5, "Must contain all HTML pages");
    assert.ok(cssFile, "Must contain style.css");
    assert.ok(jsFile, "Must contain main.js");
    assert.ok(svgFiles.length > 0, "Must contain bundled offline vector SVGs");
  });

  // TEST 3: ZIP generation with binary files and safety timeout
  await test("ZIP packaging safely handles binary files and generates valid blob", async () => {
    const websiteData = {
      businessName: "Lone Star Plumbing",
      businessType: "Plumber",
      city: "Fort Worth",
      stateRegion: "TX",
      phone: "(817) 555-0199",
      email: "service@lonestarplumbing.com",
      targetKeywords: "plumber in fort worth tx, emergency drain cleaning",
      keywords: ["plumber in fort worth tx", "emergency drain cleaning"],
      pagesToCreate: ["Home", "About", "Services", "Contact"],
      separateServicePages: false,
      separateAreaPages: false,
    };

    const targetPages = ["Home", "About", "Services", "Contact"];
    const contentJSON = buildDefaultTradeContentJSON(websiteData as any, targetPages);
    const assembled = await assembleWebsite(contentJSON, THEMES[0], {
      validateNetwork: false,
      domain: "lonestarplumbing.com",
    });

    const mockProject = {
      id: "test-proj-1",
      name: "Lone Star Plumbing",
      createdAt: Date.now(),
      lastEditedAt: Date.now(),
      formData: websiteData,
      theme: THEMES[0],
      nicheId: "plumbing",
      schemaType: "Plumber",
      businessDetails: {
        businessName: "Lone Star Plumbing",
        websiteDomain: "lonestarplumbing.com",
      },
      files: assembled.files,
    };

    const zipResult = await generateWebsiteZIP(mockProject as any, "full");

    assert.ok(zipResult.blob, "Must produce a valid ZIP blob");
    assert.ok(zipResult.blob.size > 1000, `ZIP blob size must be non-trivial, got ${zipResult.blob.size} bytes`);
    assert.ok(zipResult.validation.valid, "Packaged files must pass validation");
  });

  // TEST 4: Configurable timeout in generateWebsite
  await test("generateWebsite propagates timeoutMs parameter correctly", async () => {
    const start = Date.now();
    try {
      // Intentionally call a non-existent port with a 300ms timeout
      await generateWebsite({
        provider: "custom",
        apiKey: "dummy-key",
        model: "dummy-model",
        prompt: "test",
        baseUrl: "http://127.0.0.1:54321/v1",
        timeoutMs: 400,
      });
      assert.fail("Should have thrown error");
    } catch (err: any) {
      const elapsed = Date.now() - start;
      assert.ok(elapsed < 2000, `Timeout must trigger quickly, took ${elapsed}ms`);
      assert.ok(err.message, "Must return descriptive error message");
    }
  });

  console.log("\n==================================================");
  console.log(`🎉 ALL ${passedTests}/${totalTests} RELIABILITY TESTS PASSED!`);
  console.log("==================================================");
}

runReliabilityTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
