import assert from "assert";
import {
  generateDynamicImageQuery,
  buildBingThumbnailUrl,
  normalizeBingQuery,
  resolvePageImage,
  renderStaticImageTag,
} from "../lib/photos/image-provider";
import { createImagePlan } from "../lib/photos/image-bundler";
import { assembleWebsite } from "../templates/assembler";
import { THEMES } from "../lib/themes";
import { SiteContentJSON } from "../lib/generator/content-schema";

console.log("==================================================");
console.log("RUNNING RANK LOCAL - IMAGE RELIABILITY AUDIT SUITE");
console.log("==================================================\n");

let passedChecks = 0;
function trackCheck(name: string, fn: () => void | Promise<void>) {
  try {
    const result = fn();
    if (result instanceof Promise) {
      return result
        .then(() => {
          passedChecks++;
          console.log(`  [PASS] ${name}`);
        })
        .catch((err) => {
          console.error(`  [FAIL] ${name}`);
          console.error(err);
          process.exit(1);
        });
    } else {
      passedChecks++;
      console.log(`  [PASS] ${name}`);
    }
  } catch (err: any) {
    console.error(`  [FAIL] ${name}`);
    console.error(err);
    process.exit(1);
  }
}

async function runAllTests() {
  // ----------------------------------------------------
  // 1. Dynamic Query Generation (User Examples)
  // ----------------------------------------------------
  console.log("1. Dynamic Contextual Query Generation:");

  trackCheck("Example 1: Plumber in Texas -> plumber in texas", () => {
    const res = generateDynamicImageQuery({
      trade: "Plumber",
      state: "Texas",
      slot: "hero",
      pageType: "location",
    });
    assert.strictEqual(res.query, "plumber in texas");
    assert.ok(res.alt.toLowerCase().includes("plumber"));
    assert.ok(res.alt.toLowerCase().includes("texas"));
  });

  trackCheck("Example 2: Emergency Pipe Repair Florida -> emergency pipe repair florida", () => {
    const res = generateDynamicImageQuery({
      trade: "Plumber",
      serviceName: "Emergency Pipe Repair",
      state: "Florida",
      slot: "hero",
      pageType: "service",
    });
    assert.strictEqual(res.query, "emergency pipe repair florida");
    assert.ok(res.alt.toLowerCase().includes("emergency pipe repair"));
  });

  trackCheck("Example 3: Water Heater Repair Dallas -> water heater repair dallas", () => {
    const res = generateDynamicImageQuery({
      trade: "Plumber",
      serviceName: "Water Heater Repair",
      city: "Dallas",
      stateCode: "TX",
      slot: "hero",
      pageType: "service",
    });
    assert.ok(res.query.includes("water heater repair dallas"));
    assert.ok(res.alt.toLowerCase().includes("water heater repair"));
  });

  trackCheck("Example 4: Sewer Line Repair Austin -> sewer line repair austin", () => {
    const res = generateDynamicImageQuery({
      trade: "Plumber",
      serviceName: "Sewer Line Repair",
      city: "Austin",
      slot: "hero",
      pageType: "service",
    });
    assert.strictEqual(res.query, "sewer line repair austin");
  });

  trackCheck("Deduplication across 20+ batch location pages ensures unique queries", () => {
    const usedQueries = new Set<string>();
    const cities = ["Plano", "Frisco", "McKinney", "Allen", "Dallas", "Fort Worth", "Arlington", "Denton", "Garland", "Irving"];
    const queries: string[] = [];

    for (const city of cities) {
      const q = generateDynamicImageQuery(
        {
          trade: "Plumber",
          city,
          state: "Texas",
          slot: "hero",
          pageType: "location",
        },
        usedQueries
      );
      queries.push(q.query);
    }

    assert.strictEqual(new Set(queries).size, cities.length, "Every city must receive a unique image query");
  });

  // ----------------------------------------------------
  // 2. Bing Thumbnail URL Builder & Normalization
  // ----------------------------------------------------
  console.log("\n2. Bing Thumbnail URL Builder & Normalization:");

  trackCheck("normalizeBingQuery strips illegal punctuation and formats with +", () => {
    const clean1 = normalizeBingQuery("Water Heater Repair in Dallas, TX!");
    assert.strictEqual(clean1, "water+heater+repair+in+dallas+tx");

    const clean2 = normalizeBingQuery("24/7 Emergency Pipe Repair (Fast Dispatch)");
    assert.strictEqual(clean2, "24+7+emergency+pipe+repair+fast+dispatch");
  });

  trackCheck("buildBingThumbnailUrl generates valid CDN URL with dimensions and shards", () => {
    const url1 = buildBingThumbnailUrl("water heater repair houston", 1200, 600, 1);
    assert.ok(url1.startsWith("https://tse2.mm.bing.net/th?q=water+heater+repair+houston&w=1200&h=600"));

    const url2 = buildBingThumbnailUrl("plumber in texas", 800, 533, 4);
    assert.ok(url2.startsWith("https://tse1.mm.bing.net/th?q=plumber+in+texas&w=800&h=533"));
  });

  // ----------------------------------------------------
  // 3. Fallback & Image Resolution Strategy
  // ----------------------------------------------------
  console.log("\n3. Image Resolution & Fallback Strategy:");

  trackCheck("resolvePageImage returns primary Bing URL and guaranteed Unsplash fallback", () => {
    const result = resolvePageImage({
      trade: "Plumber",
      serviceName: "Drain Cleaning",
      city: "Houston",
      slot: "hero",
      pageType: "service",
    });

    assert.ok(result.url.includes("tse"), "Primary URL should be Bing thumbnail CDN");
    assert.ok(result.url.includes("drain+cleaning+houston"), "Primary URL should include dynamic query");
    assert.ok(result.fallbackUrl.includes("images.unsplash.com"), "Fallback URL must be reliable Unsplash trade photo");
    assert.ok(result.alt.length > 0, "Alt text must be present");
  });

  trackCheck("renderStaticImageTag generates clean HTML with onerror fallback and lazy loading", () => {
    const tag = renderStaticImageTag({
      src: "https://tse1.mm.bing.net/th?q=plumber+in+texas&w=800&h=533",
      alt: "Professional plumber in Texas",
      fallbackUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
      width: 800,
      height: 533,
      loading: "lazy",
    });

    assert.ok(tag.includes('src="https://tse1.mm.bing.net/th?q=plumber+in+texas&w=800&h=533"'));
    assert.ok(tag.includes('alt="Professional plumber in Texas"'));
    assert.ok(tag.includes('onerror="this.onerror=null;this.src=\'https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80\';"'));
    assert.ok(tag.includes('loading="lazy"'));
  });

  // ----------------------------------------------------
  // 4. Assembler Integration Audit
  // ----------------------------------------------------
  console.log("\n4. Full Website Assembler Image Verification:");

  await trackCheck("assembleWebsite integrates dynamic images across all generated pages", async () => {
    const mockContent: SiteContentJSON = {
      site: {
        businessName: "Lone Star Plumbing",
        phone: "(214) 555-0199",
        address: { city: "Dallas", state: "TX" },
        nav: [{ label: "Home", slug: "index.html" }, { label: "Services", slug: "services.html" }],
      },
      pages: [
        {
          slug: "index.html",
          seo: { title: "Plumber in Dallas, TX", description: "Top plumber in Dallas", h1: "Expert Plumber in Dallas, TX" },
          sections: [
            { type: "hero", content: { h1: "Expert Plumber in Dallas, TX" } },
            { type: "services", content: { items: [{ title: "Water Heater Repair" }, { title: "Drain Cleaning" }] } },
            { type: "about", content: {} },
          ],
        },
        {
          slug: "water-heater-repair.html",
          seo: { title: "Water Heater Repair in Dallas, TX", description: "Fast water heater repair", h1: "Water Heater Repair in Dallas" },
          sections: [
            { type: "hero", content: { h1: "Water Heater Repair in Dallas" } },
          ],
        },
      ],
    };

    const assembled = await assembleWebsite(mockContent, THEMES[0], {
      serviceAreaCities: [
        { city: "Plano", stateId: "TX", county: "Collin County", lat: 33.0198, lng: -96.6989 },
      ],
    });

    const indexHtml = assembled.files.find((f) => f.path === "index.html")?.content as string;
    assert.ok(indexHtml, "index.html must exist");
    assert.ok(indexHtml.includes("tse"), "Hero image must use high-speed dynamic Bing URL");
    assert.ok(indexHtml.includes("onerror="), "Image must have onerror fallback protection");

    const waterHeaterHtml = assembled.files.find((f) => f.path === "water-heater-repair.html")?.content as string;
    assert.ok(waterHeaterHtml, "water-heater-repair.html must exist");
    assert.ok(waterHeaterHtml.includes("onerror="), "Service page must have onerror fallback protection");

    const planoLocationHtml = assembled.files.find((f) => f.path.includes("plano") && f.path.endsWith(".html"))?.content as string;
    assert.ok(planoLocationHtml, "Plano location page must exist");
    assert.ok(planoLocationHtml.includes("onerror="), "Location page hero must have onerror fallback");
    assert.ok(planoLocationHtml.includes("plano"), "Location page image query must be specific to Plano");
  });

  console.log("\n==================================================");
  console.log(`ALL AUDIT CHECKS PASSED: ${passedChecks}/${passedChecks}`);
  console.log("==================================================");
}

runAllTests().catch((e) => {
  console.error("Test execution fatal error:", e);
  process.exit(1);
});
