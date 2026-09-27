import { Theme } from "../../lib/themes";
import { SiteInfoJSON } from "../../lib/generator/content-schema";
import { PageRegistry, RegistryPage, linkTo, LinkStyle, assetPath, renderBreadcrumbs } from "../../lib/registry/page-registry";
import { safeText, safeButton } from "../../lib/generator/safe-helpers";

export interface LocationPageContext {
  city: string;
  stateId: string;
  stateName: string;
  county: string;
  population?: number;
  distanceOffset?: string;
  zipCodes?: string[];
  localNotes?: string;
  angleUsed?: string;
  nearestCities?: { city: string; stateId: string; slug?: string; distanceMiles: number }[];
  h1: string;
  metaTitle: string;
  metaDescription: string;
  introParagraph: string;
  angleSectionHeadline: string;
  angleSectionContent: string;
  servicesIncluded: string[];
  processSteps: { title: string; desc?: string; description?: string }[];
  faqs: { question: string; answer: string }[];
  heroImage?: {
    localPath?: string;
    url?: string;
    fallbackUrl?: string;
    alt: string;
    width: number;
    height: number;
  };
  searchIntent?: string;
  commonProblemsTitle?: string;
  commonProblems?: Array<{ title: string; description: string; whyItHappens?: string; severity?: string }>;
  whenToCall?: Array<{ symptom: string; action: string }>;
  customerPrepSteps?: string[];
  serviceScopeTitle?: string;
  regionalClimateHeadline?: string;
  regionalClimateContent?: string;
  relatedServices?: Array<{ name: string; slug?: string; description?: string }>;
}

/**
 * Renders an accessible, responsive Location Page complying with design system and master registry.
 */
export function renderLocationPage(
  ctx: LocationPageContext,
  site: SiteInfoJSON,
  theme: Theme,
  registryOrCities?: PageRegistry | any[],
  currentPageOrCoords?: RegistryPage | { lat: number; lng: number },
  linkStyle: LinkStyle = "web"
): string {
  let registry: PageRegistry;
  let currentPage: RegistryPage;

  if (registryOrCities instanceof PageRegistry && currentPageOrCoords && "id" in currentPageOrCoords) {
    registry = registryOrCities;
    currentPage = currentPageOrCoords as RegistryPage;
  } else {
    // Legacy caller compatibility
    const cityClean = ctx.city.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const stateClean = ctx.stateId.toLowerCase();
    const citySlug = `${cityClean}-${stateClean}.html`;
    registry = new PageRegistry();
    currentPage = {
      id: `loc-${cityClean}-${stateClean}`,
      pageType: "location",
      title: ctx.h1,
      navLabel: `${ctx.city}, ${ctx.stateId}`,
      outputFilePath: citySlug,
    };
    registry.register(currentPage);

    if (Array.isArray(registryOrCities)) {
      for (const sc of registryOrCities) {
        if (sc.city && sc.stateId) {
          const scCity = sc.city.toLowerCase().replace(/[^a-z0-9]+/g, "-");
          const scState = sc.stateId.toLowerCase();
          registry.register({
            id: `loc-${scCity}-${scState}`,
            pageType: "location",
            title: `${sc.city}, ${sc.stateId}`,
            navLabel: `${sc.city}, ${sc.stateId}`,
            outputFilePath: sc.slug || `${scCity}-${scState}.html`,
          });
        }
      }
    }
  }

  const phone = safeText(site.phone, "(555) 123-4567");
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const cityQuery = encodeURIComponent(`${ctx.city}, ${ctx.stateId}`);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${cityQuery}&t=&z=12&ie=UTF8&iwloc=&output=embed`;

  // Breadcrumbs from registry
  const { html: breadcrumbsHtml } = renderBreadcrumbs(registry, currentPage, "example.com", linkStyle);

  // Contact Page link
  const contactPage = registry.getByType("contact")[0];
  const contactHref = contactPage ? linkTo(currentPage, contactPage, linkStyle) : "contact.html";

  // Areas Hub link
  const areasHub = registry.getByType("areas hub")[0];
  const areasHubHref = areasHub ? linkTo(currentPage, areasHub, linkStyle) : "service-areas.html";

  // Hero Image
  const heroImageSrc = ctx.heroImage?.url ||
    (ctx.heroImage?.localPath ? assetPath(currentPage, ctx.heroImage.localPath) : "") ||
    assetPath(currentPage, `images/hero-${ctx.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`);
  const heroImageAlt = ctx.heroImage?.alt || `Professional technicians in ${ctx.city}, ${ctx.stateId}`;
  const fallbackAttr = ctx.heroImage?.fallbackUrl ? ` onerror="this.onerror=null;this.src='${ctx.heroImage.fallbackUrl}';"` : "";

  // Nearby locations from registry
  const allLocations = registry.getByType("location").filter((l) => l.id !== currentPage.id);
  const nearbyLocations = allLocations.slice(0, 4);

  return `
${breadcrumbsHtml}

<!-- Location Hero Section -->
<section class="section location-hero-section">
  <div class="container">
    <div class="location-hero-grid">
      <div class="location-hero-content">
        <div class="badge">
          <span>📍 Dedicated Coverage: ${ctx.city}, ${ctx.stateId}</span>
          ${ctx.distanceOffset ? `<span>• ${ctx.distanceOffset}</span>` : ""}
        </div>
        <h1>${ctx.h1}</h1>
        <p class="lead-text">${ctx.introParagraph}</p>
        
        <div class="location-hero-actions">
          <a href="tel:${cleanPhone}" class="btn btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            <span>Call ${phone}</span>
          </a>
          <a href="${contactHref}" class="btn btn-outline">
            Request Service in ${ctx.city}
          </a>
        </div>

        ${
          ctx.zipCodes && ctx.zipCodes.length > 0
            ? `<p class="zip-coverage">Serving all ${ctx.city} ZIP codes including: ${ctx.zipCodes.slice(0, 6).join(", ")}.</p>`
            : ""
        }
      </div>

      <!-- Hero Visual: Local Photo + Interactive Map -->
      <div class="location-hero-media">
        <div class="location-media-card">
          <img
            src="${heroImageSrc}"
            alt="${heroImageAlt}"
            class="img-hero"
            width="${ctx.heroImage?.width || 1200}"
            height="${ctx.heroImage?.height || 800}"
            loading="eager"
            fetchpriority="high"${fallbackAttr}
          >
          <div class="map-embed-container" style="margin-top: 1rem; border-radius: var(--radius); overflow: hidden; border: 1px solid var(--color-border); background: var(--color-surface, #F8FAFC);">
            <div style="height: 200px;">
              <iframe
                title="Service map for ${ctx.city}, ${ctx.stateId}"
                width="100%"
                height="100%"
                style="border: 0; display: block;"
                loading="lazy"
                referrerpolicy="no-referrer-when-downgrade"
                src="${mapEmbedUrl}"
              ></iframe>
            </div>
            <div style="padding: 0.5rem 0.85rem; background: var(--color-surface, #FFFFFF); border-top: 1px solid var(--color-border); display: flex; align-items: center; justify-content: space-between; gap: 0.5rem;">
              <span style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 500;">📍 ${ctx.city}, ${ctx.stateId}</span>
              <a href="https://www.google.com/maps/search/?api=1&query=${cityQuery}" target="_blank" rel="noopener noreferrer" style="font-size: 0.75rem; color: var(--color-primary); font-weight: 600; text-decoration: none; display: inline-flex; align-items: center; gap: 0.25rem;">
                Open in Maps ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

${
  ctx.customerPrepSteps && ctx.customerPrepSteps.length > 0
    ? `
<!-- Homeowner Preparation & Immediate Steps -->
<section class="section">
  <div class="container">
    <div class="card prep-card" style="border-left: 4px solid var(--color-primary); background: var(--color-surface, #F8FAFC); padding: 1.75rem; border-radius: var(--radius);">
      <div class="badge" style="margin-bottom: 0.75rem;">Actionable Homeowner Guidance</div>
      <h2 style="font-size: 1.35rem; margin-bottom: 0.75rem;">Steps to Take Before Our Technician Arrives at Your ${ctx.city} Property</h2>
      <ul class="prep-list" style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.75rem;">
        ${ctx.customerPrepSteps
          .map(
            (step, idx) => `
          <li style="display: flex; align-items: flex-start; gap: 0.75rem;">
            <span style="display: inline-flex; align-items: center; justify-content: center; width: 24px; height: 24px; border-radius: 50%; background: var(--color-primary); color: white; font-weight: bold; font-size: 0.75rem; flex-shrink: 0;">${idx + 1}</span>
            <span style="font-size: 0.95rem; line-height: 1.5; color: var(--color-text);">${step}</span>
          </li>
        `
          )
          .join("")}
      </ul>
    </div>
  </div>
</section>
`
    : ""
}

<!-- Unique Regional Angle / Local Context Section -->
<section class="section section-alt">
  <div class="container">
    <div class="card angle-card">
      <div class="badge">Local Context &amp; Standards</div>
      <h2>${ctx.angleSectionHeadline}</h2>
      <div class="angle-content">
        ${ctx.angleSectionContent}
      </div>
      ${
        ctx.localNotes
          ? `<div class="local-note-box">
               <strong>Local Service Note:</strong> ${ctx.localNotes}
             </div>`
          : ""
      }
    </div>
  </div>
</section>

${
  ctx.commonProblems && ctx.commonProblems.length > 0
    ? `
<!-- Common Trade Problems We Resolve -->
<section class="section">
  <div class="container">
    <div class="section-header">
      <div class="badge">Diagnosis &amp; Root Causes</div>
      <h2>${ctx.commonProblemsTitle || `Common Issues We Resolve in ${ctx.city}`}</h2>
      <p>Understanding why component failures occur helps homeowners make informed, cost-effective decisions.</p>
    </div>

    <div class="cards-grid">
      ${ctx.commonProblems
        .map(
          (prob) => `
        <div class="card problem-card">
          <div class="card-header">
            <h3>${prob.title}</h3>
            ${prob.severity === "critical" ? `<span class="badge" style="background: #FEE2E2; color: #991B1B;">Priority</span>` : ""}
          </div>
          <p>${prob.description}</p>
          ${
            prob.whyItHappens
              ? `
            <div style="margin-top: 0.75rem; padding: 0.75rem; background: rgba(15, 23, 42, 0.03); border-radius: 6px; font-size: 0.85rem; color: var(--color-muted);">
              <strong>Technical Cause:</strong> ${prob.whyItHappens}
            </div>
          `
              : ""
          }
        </div>
      `
        )
        .join("")}
    </div>
  </div>
</section>
`
    : ""
}

${
  ctx.whenToCall && ctx.whenToCall.length > 0
    ? `
<!-- When to Call Professional Diagnostic Service -->
<section class="section section-alt">
  <div class="container">
    <div class="card diagnostic-card" style="padding: 2rem;">
      <div class="badge" style="margin-bottom: 0.75rem;">Troubleshooting Triggers</div>
      <h2>When to Call a Professional in ${ctx.city}</h2>
      <p style="color: var(--color-muted); margin-bottom: 1.5rem;">If you observe any of the following symptoms, scheduling a prompt inspection prevents minor wear from turning into major property damage:</p>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
        ${ctx.whenToCall
          .map(
            (item) => `
          <div style="border: 1px solid var(--color-border); border-radius: var(--radius); padding: 1.25rem; background: var(--color-surface, #fff);">
            <h4 style="font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; color: var(--color-text);">⚠️ ${item.symptom}</h4>
            <p style="font-size: 0.9rem; color: var(--color-muted); margin: 0; line-height: 1.5;">${item.action}</p>
          </div>
        `
          )
          .join("")}
      </div>
    </div>
  </div>
</section>
`
    : ""
}

<!-- Mid-Page Calling Opportunity -->
<section class="section" style="padding: 2rem 0; background: var(--color-primary); color: white;">
  <div class="container" style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 1.5rem;">
    <div>
      <h3 style="color: white; margin: 0 0 0.25rem 0; font-size: 1.25rem;">Facing a Service Problem in ${ctx.city}?</h3>
      <p style="margin: 0; opacity: 0.9; font-size: 0.95rem;">Speak directly with our local dispatch coordinator for upfront pricing and fast arrival.</p>
    </div>
    <div style="display: flex; gap: 0.75rem; align-items: center;">
      <a href="tel:${cleanPhone}" class="btn" style="background: white; color: var(--color-primary); font-weight: bold; padding: 0.75rem 1.5rem; border-radius: var(--radius);">Call ${phone}</a>
    </div>
  </div>
</section>

<!-- Services Available in City -->
<section class="section">
  <div class="container">
    <div class="section-header">
      <div class="badge">Local Capabilities</div>
      <h2>Comprehensive Services We Provide in ${ctx.city}</h2>
      <p>Prompt, upfront, and fully licensed solutions for properties across ${ctx.county} County.</p>
    </div>

    <div class="cards-grid">
      ${ctx.servicesIncluded
        .map(
          (srv) => `
        <div class="card service-location-card">
          <div class="card-header">
            <h3>${srv}</h3>
            <span class="badge badge-sm">In ${ctx.city}</span>
          </div>
          <p>Complete diagnosis, repairs, and installations backed by our satisfaction guarantee and honest flat-rate pricing.</p>
          <div class="card-action">
            <a href="${contactHref}" class="link-arrow">Book ${srv} in ${ctx.city} →</a>
          </div>
        </div>
      `
        )
        .join("\n      ")}
    </div>
  </div>
</section>

<!-- Local Process Steps -->
<section class="section section-alt">
  <div class="container">
    <div class="section-header">
      <div class="badge">How It Works</div>
      <h2>How Our Service Works in ${ctx.city}</h2>
      <p>From your first phone call to complete cleanup, we make scheduling easy and transparent.</p>
    </div>

    <div class="process-grid">
      ${ctx.processSteps
        .map(
          (step, idx) => `
        <div class="card process-step-card">
          <div class="step-badge">${idx + 1}</div>
          <h3>${step.title}</h3>
          <p>${step.desc || step.description || ""}</p>
        </div>
      `
        )
        .join("\n      ")}
    </div>
  </div>
</section>

<!-- Frequently Asked Questions Specific to City -->
${
  ctx.faqs && ctx.faqs.length > 0
    ? `
<section class="section">
  <div class="container">
    <div class="section-header">
      <div class="badge">FAQ</div>
      <h2>${ctx.city} Service FAQs</h2>
      <p>Answers to common customer questions in ${ctx.city} and ${ctx.county} County.</p>
    </div>

    <div class="faq-accordion-container" style="max-width: 800px; margin: 0 auto;">
      ${ctx.faqs
        .map(
          (faq) => `
        <div class="faq-item">
          <button class="faq-question" type="button" aria-expanded="false">
            <span>${faq.question}</span>
            <span class="faq-icon" aria-hidden="true">+</span>
          </button>
          <div class="faq-answer">
            <p>${faq.answer}</p>
          </div>
        </div>
      `
        )
        .join("\n      ")}
    </div>
  </div>
</section>
`
    : ""
}

<!-- Nearby Areas Links Section -->
${
  nearbyLocations.length > 0
    ? `
<section class="section section-alt">
  <div class="container">
    <div class="card nearby-card">
      <h3>Areas Near ${ctx.city} We Also Serve</h3>
      <p>Need dispatch outside ${ctx.city}? We also serve these nearby communities with the same prompt arrival and warranty protection:</p>
      <div class="nearby-links-grid">
        ${nearbyLocations
          .map((n) => {
            const href = linkTo(currentPage, n, linkStyle);
            return `<a href="${href}" class="nearby-chip">${n.navLabel} →</a>`;
          })
          .join("\n        ")}
        <a href="${areasHubHref}" class="nearby-chip chip-highlight">View All Service Areas →</a>
      </div>
    </div>
  </div>
</section>
`
    : ""
}

<!-- Final Location Call-to-Action Banner -->
<section class="section">
  <div class="container">
    <div class="cta-banner-box">
      <h2>Ready For Fast, Professional Service in ${ctx.city}?</h2>
      <p>Call now for direct dispatch, upfront quotes, and experienced local specialists.</p>
      <div class="cta-actions">
        <a href="tel:${cleanPhone}" class="btn btn-primary btn-large">Call ${phone}</a>
        <a href="${contactHref}" class="btn btn-outline btn-large">Book Online</a>
      </div>
    </div>
  </div>
</section>
  `.trim();
}

/**
 * Builds Schema.org JSON-LD for a Location Page
 */
export function buildLocationPageSchema(
  ctx: LocationPageContext,
  site: SiteInfoJSON,
  domain: string,
  slug: string
): string {
  const canonicalUrl = `https://${domain}/${slug === "index" ? "" : `${slug}.html`}`;

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: ctx.h1,
    description: ctx.metaDescription,
    provider: {
      "@type": "LocalBusiness",
      name: site.businessName,
      telephone: site.phone,
    },
    areaServed: {
      "@type": "City",
      name: ctx.city,
      containedIn: {
        "@type": "State",
        name: ctx.stateId,
      },
    },
  };

  const faqSchema = ctx.faqs && ctx.faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: ctx.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  } : null;

  let scripts = `\n  <script type="application/ld+json">\n  ${JSON.stringify(serviceSchema, null, 2)}\n  </script>`;
  if (faqSchema) {
    scripts += `\n  <script type="application/ld+json">\n  ${JSON.stringify(faqSchema, null, 2)}\n  </script>`;
  }

  return scripts;
}
