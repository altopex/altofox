import { assembleWebsite } from "../templates/assembler";
import { THEMES, Theme } from "../lib/themes";
import { SiteContentJSON } from "../lib/generator/content-schema";
import { MasterPageRegistry } from "../lib/registry/page-registry";

const sampleSiteData: SiteContentJSON = {
  site: {
    businessName: "Apex Plumbing & Drain Solutions",
    tagline: "24/7 Fast, Dependable Plumbing Specialists",
    phone: "(704) 555-0199",
    email: "dispatch@apexplumbing.com",
    address: {
      street: "123 Tradesman Way",
      city: "Charlotte",
      state: "NC",
      zip: "28202",
    },
    serviceAreas: ["Charlotte", "Matthews", "Huntersville", "Concord", "Pineville"],
    businessModel: "service-area",
    licenseNumber: "NC-PL-84920",
    insuredBonded: true,
    yearsInBusiness: "15+ Years",
    warrantyGuarantee: "100% Satisfaction Guarantee",
    emergency247: true,
  },
  schema: {
    type: "Plumber",
    priceRange: "$$",
  },
  pages: [
    {
      slug: "index",
      seo: {
        title: "Apex Plumbing | 24/7 Emergency Plumber in Charlotte NC",
        description: "Fast 24/7 emergency plumbing, drain cleaning, and water heater repair in Charlotte NC. Call now for immediate dispatch!",
        h1: "Trusted 24/7 Emergency Plumbing Services in Charlotte, NC",
      },
      sections: [
        { type: "emergencyBanner", content: { text: "24/7 Emergency Plumbing Dispatch Available in Charlotte, NC" } },
        {
          type: "hero",
          content: {
            eyebrow: "Licensed Master Plumbers",
            h1: "Trusted 24/7 Emergency Plumbing Services in Charlotte, NC",
            subheadline: "Rapid 30-minute dispatch, flat-rate pricing, and guaranteed plumbing repairs for homes and businesses.",
            primaryCta: "(704) 555-0199",
            secondaryCta: "Schedule by Phone",
          },
        },
        { type: "trustBar", content: {} },
        {
          type: "services",
          content: {
            eyebrow: "Our Core Services",
            headline: "Complete Residential & Commercial Plumbing",
            subheadline: "From sudden burst pipes to complex sewer line replacements, our master plumbers handle it all.",
            items: [
              { title: "Emergency Leak Repair", description: "Immediate 24/7 dispatch to isolate leaks and stop flooding fast.", slug: "emergency-leak-repair.html" },
              { title: "Drain Cleaning & Hydro-Jetting", description: "Clear tough grease, sludge, and tree roots with advanced jetting.", slug: "drain-cleaning.html" },
              { title: "Water Heater Installation", description: "High-efficiency tankless and conventional water heater replacements.", slug: "water-heater-replacement.html" },
            ],
          },
        },
        { type: "whyUs", content: {} },
        { type: "process", content: {} },
        { type: "serviceAreas", content: {} },
        { type: "faq", content: {} },
        { type: "ctaBanner", variant: "locationMap", content: {} },
      ],
    },
    {
      slug: "services",
      seo: {
        title: "Plumbing Services | Apex Plumbing Charlotte NC",
        description: "Explore our complete range of certified plumbing and drain repair services.",
        h1: "Professional Plumbing Services in Charlotte NC",
      },
      sections: [
        {
          type: "hero",
          content: {
            h1: "Professional Plumbing Services in Charlotte NC",
            subheadline: "Comprehensive repairs, installations, and preventative maintenance delivered by master tradesmen.",
          },
        },
        { type: "services", content: {} },
        { type: "faq", content: {} },
        { type: "ctaBanner", variant: "photo", content: {} },
      ],
    },
    {
      slug: "emergency-leak-repair",
      seo: {
        title: "Emergency Leak Repair in Charlotte NC | Apex Plumbing",
        description: "24/7 rapid response emergency water leak detection and repair in Charlotte NC.",
        h1: "24/7 Emergency Leak Detection & Pipe Repair",
      },
      sections: [
        {
          type: "hero",
          content: {
            h1: "24/7 Emergency Leak Detection & Pipe Repair",
            subheadline: "Stop water damage in its tracks with immediate dispatch from certified local plumbers.",
          },
        },
        { type: "about", content: {} },
        { type: "process", content: {} },
        { type: "faq", content: {} },
        { type: "ctaBanner", variant: "gradient", content: {} },
      ],
    },
    {
      slug: "about",
      seo: {
        title: "About Us | Apex Plumbing Charlotte NC",
        description: "Learn about Apex Plumbing, our certified team, core values, and community commitment.",
        h1: "About Apex Plumbing & Drain Solutions",
      },
      sections: [
        {
          type: "hero",
          content: {
            h1: "About Apex Plumbing & Drain Solutions",
            subheadline: "15+ years serving Charlotte with master plumbing craftsmanship and honest upfront pricing.",
          },
        },
        { type: "about", content: {} },
        { type: "whyUs", content: {} },
        { type: "ctaBanner", variant: "gradient", content: {} },
      ],
    },
    {
      slug: "contact",
      seo: {
        title: "Contact Dispatch & Support | Apex Plumbing",
        description: "Call our 24/7 dispatch desk directly for immediate plumbing service and quotes.",
        h1: "Contact Our Charlotte Plumbing Dispatch Desk",
      },
      sections: [
        {
          type: "hero",
          content: {
            h1: "Contact Our Charlotte Plumbing Dispatch Desk",
            subheadline: "Call directly for immediate emergency dispatch, upfront quotes, and service scheduling.",
          },
        },
        { type: "contactForm", content: {} },
        { type: "faq", content: {} },
      ],
    },
    {
      slug: "faq",
      seo: {
        title: "Plumbing FAQ | Apex Plumbing Charlotte NC",
        description: "Frequently asked questions about plumbing emergencies, pricing, and warranties.",
        h1: "Plumbing Questions & Expert Answers",
      },
      sections: [
        {
          type: "hero",
          content: {
            h1: "Plumbing Questions & Expert Answers",
            subheadline: "Transparent answers to common homeowner questions regarding our repairs, guarantees, and dispatch.",
          },
        },
        { type: "faq", content: {} },
        { type: "whyUs", content: {} },
        { type: "ctaBanner", variant: "gradient", content: {} },
      ],
    },
  ],
};

async function runTestSuite() {
  console.log("================================================================");
  console.log("RANKLOCAL THEME SYSTEM & PHONE CONVERSION TEST SUITE");
  console.log("================================================================\n");

  let totalTestsPassed = 0;
  let totalTestsFailed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`  ✓ ${msg}`);
      totalTestsPassed++;
    } else {
      console.error(`  ❌ FAILED: ${msg}`);
      totalTestsFailed++;
    }
  }

  const activeThemes = THEMES.filter((t) => !t.isLegacy);
  console.log(`Auditing ${activeThemes.length} Active Modern Themes:`);
  activeThemes.forEach((t, i) => {
    console.log(`  ${i + 1}. [${t.id}] ${t.name} (Layout: ${t.layoutStructure?.heroLayout || "default"}, Header: ${t.layoutStructure?.headerVariant || "default"}, Service: ${t.layoutStructure?.serviceCardVariant || "default"})`);
  });
  console.log("\n----------------------------------------------------------------");

  for (const theme of activeThemes) {
    console.log(`\nTesting Theme: ${theme.name} (${theme.id})`);

    const assembled = await assembleWebsite(sampleSiteData, theme, {
      domain: "apexplumbingcharlotte.com",
      serviceAreaCities: [
        { city: "Matthews", stateId: "NC", county: "Mecklenburg", lat: 35.1168, lng: -80.7234 },
        { city: "Huntersville", stateId: "NC", county: "Mecklenburg", lat: 35.4107, lng: -80.8429 },
      ],
      fastOfflinePreview: true,
    });

    const htmlFiles = assembled.files.filter((f) => f.path.endsWith(".html"));
    assert(htmlFiles.length >= 7, `${theme.id} generated ${htmlFiles.length} HTML pages`);

    for (const htmlFile of htmlFiles) {
      const html = htmlFile.content;

      // 1. CRITICAL: Zero <form>, <input>, <textarea>, submit buttons
      const hasForm = /<form[\s>]/i.test(html);
      const hasInput = /<input[\s>]/i.test(html);
      const hasTextarea = /<textarea[\s>]/i.test(html);
      const hasSubmit = /type=["']submit["']/i.test(html);

      assert(!hasForm, `[${theme.id}] ${htmlFile.path} has ZERO <form> tags`);
      assert(!hasInput, `[${theme.id}] ${htmlFile.path} has ZERO <input> tags`);
      assert(!hasTextarea, `[${theme.id}] ${htmlFile.path} has ZERO <textarea> tags`);
      assert(!hasSubmit, `[${theme.id}] ${htmlFile.path} has ZERO submit buttons`);

      // 2. Click-to-call tel: links presence
      const telCount = (html.match(/href="tel:[^"]+"/g) || []).length;
      assert(telCount >= 3, `[${theme.id}] ${htmlFile.path} has prominent phone call triggers (${telCount} tel: links)`);

      // 3. Exactly ONE <h1> per page
      const h1Matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
      assert(
        h1Matches.length === 1,
        `[${theme.id}] ${htmlFile.path} has EXACTLY ONE <h1> (found: ${h1Matches.length})`
      );

      // 4. Proper <h2> presence
      const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
      assert(h2Count >= 1, `[${theme.id}] ${htmlFile.path} has semantic <h2> sections (${h2Count} found)`);
    }

    // Check specific contact.html page
    const contactPage = htmlFiles.find((f) => f.path === "contact.html");
    if (contactPage) {
      assert(
        contactPage.content.includes("Immediate Dispatch &amp; Office Details") ||
        contactPage.content.includes("Immediate Dispatch & Office Details"),
        `[${theme.id}] contact.html contains Dispatch Details Hub`
      );
      assert(
        contactPage.content.includes("Priority Phone Booking") ||
        contactPage.content.includes("Fastest Service by Phone"),
        `[${theme.id}] contact.html contains Priority Phone Booking Desk`
      );
    }
  }

  console.log("\n================================================================");
  console.log(`TEST SUITE RESULTS: ${totalTestsPassed} PASSED, ${totalTestsFailed} FAILED`);
  console.log("================================================================\n");

  if (totalTestsFailed > 0) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
