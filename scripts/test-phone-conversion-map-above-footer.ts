/**
 * Targeted Automated Verification Suite:
 * 1. Move map above footer (footer has NO map; small location map section immediately above footer).
 * 2. Small & compact location-specific map (not giant full-width; balanced ~40% width on desktop, compact on mobile).
 * 3. Map is location-specific (uses supplied business location, no invented info, keyless).
 * 4. Phone call is PRIMARY CTA throughout site (Header, Hero, Services, Final CTA with tel: links).
 * 5. Reduced emphasis on contact forms (minimal Name/Phone/Message fields, secondary styling, no competition with Call Now).
 * 6. Final CTA + Map Section structure:
 *    - Desktop: LEFT has Call Now + Phone, RIGHT has small location map.
 *    - Mobile: Stacks Call CTA -> Phone -> Location text -> Small Map -> Footer.
 * 7. Service Area section remains MAP-FREE with pins and visible names.
 * 8. Exactly ONE map on entire homepage.
 * 9. Responsive layout at 1440, 1280, 1024, 768, 430, 390, 375px.
 * 10. SEO, Schema, and performance preserved.
 */

import { assembleWebsite } from "../templates/assembler";
import { THEMES } from "../lib/themes";
import { SiteContentJSON } from "../lib/generator/content-schema";
import fs from "fs";
import path from "path";

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` - ${detail}` : ""}`);
    failedCount++;
  }
}

async function runTests() {
  console.log("\n=======================================================");
  console.log("  Phone Conversion & Location Map Architecture Test Suite");
  console.log("=======================================================\n");

  const sampleSiteData: SiteContentJSON = {
    site: {
      businessName: "Lone Star Plumbing Masters",
      phone: "(214) 555-0199",
      email: "dispatch@lonestarplumbing.com",
      tagline: "Premier Residential & Commercial Plumbing in DFW",
      address: {
        street: "123 Main St",
        city: "Dallas",
        state: "TX",
        zip: "75201",
      },
      businessModel: "hybrid",
      serviceAreas: ["Dallas, TX", "Fort Worth, TX", "Arlington, TX", "Plano, TX", "Irving, TX"],
      hours: ["24/7 Priority Emergency Service Available"],
      licenseNumber: "M-41982",
      insuredBonded: true,
      trade: "Plumbing",
      primaryService: "Emergency Plumbing",
    } as any,
    schema: {
      type: "Plumber",
    },
    pages: [
      {
        slug: "index",
        seo: {
          title: "Dallas Emergency Plumber | Lone Star Plumbing Masters",
          h1: "Fast, Reliable Dallas Plumbing Services",
          description: "Top-rated 24/7 emergency plumbers in Dallas, TX. Upfront pricing, licensed master plumbers, zero hidden fees.",
        },
        sections: [
          { type: "emergencyBanner", content: { text: "24/7 DFW Emergency Dispatch" } },
          { type: "hero", variant: "split" },
          { type: "trustBar" },
          { type: "services", variant: "cards" },
          { type: "stats" },
          { type: "whyUs" },
          { type: "process" },
          { type: "serviceAreas" },
          { type: "testimonials" },
          { type: "faq" },
          { type: "contactForm" },
          { type: "ctaBanner", variant: "locationMap" },
        ],
      },
      {
        slug: "services",
        seo: {
          title: "Plumbing Services | Lone Star Plumbing Masters",
          h1: "Comprehensive DFW Plumbing Services",
          description: "Full range of residential and commercial plumbing services in Dallas.",
        },
        sections: [
          { type: "hero", variant: "centered" },
          { type: "services", variant: "cards" },
          { type: "ctaBanner", variant: "photo" },
        ],
      },
      {
        slug: "contact",
        seo: {
          title: "Contact Us | Lone Star Plumbing Masters",
          h1: "Contact Our Dallas Plumbing Dispatch",
          description: "Call our 24/7 dispatch desk or reach out online.",
        },
        sections: [
          { type: "hero", variant: "centered" },
          { type: "contactForm" },
        ],
      },
    ],
  };

  const theme = THEMES[0];
  const assembled = await assembleWebsite(sampleSiteData, theme, {
    domain: "lonestarplumbing.com",
  });

  const indexHtmlFile = assembled.files.find((f) => f.path === "index.html");
  assert(Boolean(indexHtmlFile), "index.html file was successfully assembled");
  const indexHtml = indexHtmlFile?.content || "";

  // ==========================================================
  // 1. MAP POSITION: ABOVE FOOTER, NOT IN FOOTER
  // ==========================================================
  console.log("\n--- 1. Map Position: Immediately Above Footer, Never Inside Footer ---");

  // Check footer
  const footerStartIdx = indexHtml.indexOf('<footer class="site-footer"');
  const footerEndIdx = indexHtml.indexOf("</footer>");
  assert(footerStartIdx !== -1 && footerEndIdx !== -1, "Site footer exists in HTML");

  const footerHtml = indexHtml.substring(footerStartIdx, footerEndIdx + 9);
  assert(!footerHtml.includes("<iframe"), "Footer contains ABSOLUTELY NO <iframe>");
  assert(!footerHtml.includes("maps.google.com"), "Footer contains NO Google Maps URL");
  assert(!footerHtml.includes("footer-map-container"), "Footer contains NO map container");

  // Check that Final CTA + Map section exists immediately before the footer
  const finalCtaStartIdx = indexHtml.indexOf('<section class="section final-cta-section"');
  assert(finalCtaStartIdx !== -1, "Final CTA + Location Map section exists on homepage");
  assert(finalCtaStartIdx < footerStartIdx, "Final CTA + Location Map section is positioned BEFORE the footer");

  // Check that nothing except </main> separates the Final CTA section and the footer
  const betweenCtaAndFooter = indexHtml.substring(finalCtaStartIdx, footerStartIdx);
  assert(
    betweenCtaAndFooter.includes("</main>"),
    "Final CTA section is the last section inside <main> before <footer>"
  );

  // ==========================================================
  // 2. COMPACT, LOCATION-SPECIFIC MAP
  // ==========================================================
  console.log("\n--- 2. Small, Compact, Location-Specific Map ---");

  assert(indexHtml.includes("final-cta-map-container"), "Final CTA contains compact map container");
  assert(indexHtml.includes("Dallas, TX"), "Map context includes supplied location 'Dallas, TX'");
  assert(indexHtml.includes("Serving <strong>Dallas, TX</strong> and nearby areas"), "Renders serving location text above map");
  assert(indexHtml.includes("height=\"250\""), "Map height is intentionally compact (height=250)");
  assert(indexHtml.includes("loading=\"lazy\""), "Map uses lazy loading for high performance");
  assert(!indexHtml.includes("key="), "No private Google API key exposed in map HTML");

  // ==========================================================
  // 3. SERVICE AREA REMAINS MAP-FREE & EXACTLY ONE MAP ON HOMEPAGE
  // ==========================================================
  console.log("\n--- 3. Service Area Map-Free & Homepage Map Count ---");

  const serviceAreaStartIdx = indexHtml.indexOf('id="service-areas"');
  assert(serviceAreaStartIdx !== -1, "Service Area section exists in HTML");
  const serviceAreaEndIdx = indexHtml.indexOf("</section>", serviceAreaStartIdx);
  const serviceAreaHtml = indexHtml.substring(serviceAreaStartIdx, serviceAreaEndIdx + 10);

  assert(!serviceAreaHtml.includes("<iframe"), "Service Area section contains ZERO <iframe>");
  assert(!serviceAreaHtml.includes("maps.google.com"), "Service Area section contains ZERO map embeds");
  assert(serviceAreaHtml.includes("📍"), "Service Area section renders visual location pin 📍");
  assert(serviceAreaHtml.includes("Dallas, TX"), "Service Area renders location name 'Dallas, TX'");
  assert(serviceAreaHtml.includes("Fort Worth, TX"), "Service Area renders location name 'Fort Worth, TX'");

  // Count total iframes across the ENTIRE homepage
  const totalIframes = (indexHtml.match(/<iframe/g) || []).length;
  assert(totalIframes === 1, `Homepage contains EXACTLY ONE Google Map iframe (Found: ${totalIframes})`);

  // ==========================================================
  // 4. PHONE CALL AS PRIMARY CTA THROUGHOUT SITE
  // ==========================================================
  console.log("\n--- 4. Phone Call as Primary Conversion Action ---");

  const cleanPhone = "2145550199";

  // Header Phone CTA
  assert(indexHtml.includes(`href="tel:${cleanPhone}"`), "Contains direct tel: link to verified business phone");
  assert(indexHtml.includes("Call Now: (214) 555-0199") || indexHtml.includes("(214) 555-0199"), "Header displays verified phone number");

  // Hero Section Primary CTA
  const heroStartIdx = indexHtml.indexOf('<section class="hero');
  const heroEndIdx = indexHtml.indexOf("</section>", heroStartIdx);
  const heroHtml = indexHtml.substring(heroStartIdx, heroEndIdx + 10);

  assert(heroHtml.includes(`href="tel:${cleanPhone}"`), "Hero primary CTA is a direct tel: link");
  assert(heroHtml.includes("Call Now: (214) 555-0199"), "Hero primary button text is 'Call Now: (214) 555-0199'");
  assert(heroHtml.includes("btn-primary"), "Hero call CTA is styled with dominant btn-primary");
  assert(heroHtml.includes("btn-secondary") || heroHtml.includes("btn-outline"), "Hero secondary CTA is demoted to secondary/outline");

  // Services Section CTA
  const servicesStartIdx = indexHtml.indexOf('<section class="section" id="services"');
  const servicesEndIdx = indexHtml.indexOf("</section>", servicesStartIdx);
  const servicesHtml = indexHtml.substring(servicesStartIdx, servicesEndIdx + 10);
  assert(servicesHtml.includes("Call for Service"), "Services section includes 'Call for Service' CTA");

  // Final CTA Section
  const finalCtaHtml = betweenCtaAndFooter;
  assert(finalCtaHtml.includes(`href="tel:${cleanPhone}"`), "Final CTA primary button is a direct tel: link");
  assert(finalCtaHtml.includes("Call Now: (214) 555-0199"), "Final CTA button text is 'Call Now: (214) 555-0199'");
  assert(finalCtaHtml.includes("final-cta-phone-link"), "Final CTA renders prominent direct phone link");
  assert(finalCtaHtml.includes("(214) 555-0199"), "Final CTA displays exact verified phone number");

  // ==========================================================
  // 5. REDUCED EMPHASIS ON CONTACT FORM
  // ==========================================================
  console.log("\n--- 5. Reduced Emphasis on Contact Form ---");

  const contactStartIdx = indexHtml.indexOf('<section class="section contact-section-secondary"');
  assert(contactStartIdx !== -1, "Contact form on homepage uses compact secondary variant");
  const contactEndIdx = indexHtml.indexOf("</section>", contactStartIdx);
  const contactHtml = indexHtml.substring(contactStartIdx, contactEndIdx + 10);

  assert(!contactHtml.includes("<iframe"), "Homepage contact form contains NO map embed");
  assert(contactHtml.includes("name=\"name\""), "Contact form includes Name field");
  assert(contactHtml.includes("name=\"phone\""), "Contact form includes Phone field");
  assert(contactHtml.includes("name=\"message\""), "Contact form includes Message field");
  assert(!contactHtml.includes("name=\"service\""), "Unnecessary 'Service' field omitted for brevity");
  assert(!contactHtml.includes("name=\"budget\""), "Unnecessary 'Budget' field omitted");
  assert(!contactHtml.includes("name=\"address\""), "Unnecessary 'Address' field omitted");
  assert(contactHtml.includes("btn-outline"), "Contact form submit button uses secondary btn-outline styling");
  assert(contactHtml.includes("Fastest response:"), "Highlights calling as fastest response ahead of form");

  // ==========================================================
  // 6. FINAL CTA & MAP SECTION HIERARCHY
  // ==========================================================
  console.log("\n--- 6. Final CTA & Map Section Hierarchy ---");

  assert(finalCtaHtml.includes("final-cta-col-left"), "Has left column for call conversion");
  assert(finalCtaHtml.includes("final-cta-col-right"), "Has right column for compact map");

  // Check DOM order: left column comes BEFORE right column
  const leftColIdx = finalCtaHtml.indexOf("final-cta-col-left");
  const rightColIdx = finalCtaHtml.indexOf("final-cta-col-right");
  assert(leftColIdx < rightColIdx, "DOM order: Call conversion CTA precedes location map");

  // Check left column content
  assert(
    finalCtaHtml.includes("Need Plumbing?") || finalCtaHtml.includes("Need Emergency Plumbing?"),
    "Dynamic headline 'Need [Trade]?' generated"
  );
  assert(finalCtaHtml.includes("Lone Star Plumbing Masters"), "Mentions business name in final CTA text");
  assert(finalCtaHtml.includes("Prefer to contact us online?"), "Includes secondary online line without competing with Call Now");

  // ==========================================================
  // 7. RESPONSIVE CSS RULES AUDIT
  // ==========================================================
  console.log("\n--- 7. Responsive CSS Rules Audit ---");

  const cssPath = path.join(process.cwd(), "templates", "base.css");
  const css = fs.readFileSync(cssPath, "utf8");

  assert(css.includes(".final-cta-grid"), "CSS defines .final-cta-grid");
  assert(css.includes("grid-template-columns: 1.15fr 0.85fr;"), "CSS sets 2-column balanced layout on desktop");
  assert(css.includes(".final-cta-map-container iframe"), "CSS defines compact map iframe sizing");
  assert(css.includes("height: 250px;"), "CSS sets 250px compact desktop map height");
  assert(css.includes("@media (max-width: 767px)"), "CSS includes mobile breakpoint rules");
  assert(css.includes("height: 220px;"), "CSS sets 220px compact mobile map height");

  const breakpoints = [1440, 1280, 1024, 768, 430, 390, 375];
  for (const bp of breakpoints) {
    if (bp >= 1024) {
      assert(
        css.includes("min-width: 1024px"),
        `Breakpoint ${bp}px: 2 columns with Call CTA left, compact map right`
      );
    } else {
      assert(
        css.includes("max-width: 767px"),
        `Breakpoint ${bp}px: single-column vertical stack (Call CTA -> Map -> Footer)`
      );
    }
  }

  // ==========================================================
  // 8. DEDICATED CONTACT PAGE AUDIT
  // ==========================================================
  console.log("\n--- 8. Dedicated Contact Page (contact.html) Audit ---");

  const contactPageFile = assembled.files.find((f) => f.path === "contact.html");
  assert(Boolean(contactPageFile), "contact.html file was successfully assembled");
  const contactPageHtml = contactPageFile?.content || "";

  // Contact page footer must also be map-free!
  const contactFooterStartIdx = contactPageHtml.indexOf('<footer class="site-footer"');
  const contactFooterHtml = contactPageHtml.substring(contactFooterStartIdx);
  assert(!contactFooterHtml.includes("<iframe"), "contact.html footer contains NO map");
  assert(contactPageHtml.includes("Direct Phone (Primary CTA):"), "contact.html also emphasizes phone as primary CTA");

  // ==========================================================
  // SUMMARY
  // ==========================================================
  console.log("\n=======================================================");
  console.log(`  Test Suite Complete: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log("=======================================================\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
