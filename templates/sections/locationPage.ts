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
  processSteps: { title: string; desc: string }[];
  faqs: { question: string; answer: string }[];
  heroImage?: {
    localPath: string;
    alt: string;
    width: number;
    height: number;
  };
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
  const heroImageSrc = ctx.heroImage
    ? assetPath(currentPage, ctx.heroImage.localPath)
    : assetPath(currentPage, `images/hero-${ctx.city.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`);
  const heroImageAlt = ctx.heroImage?.alt || `Professional technicians in ${ctx.city}, ${ctx.stateId}`;

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
            fetchpriority="high"
          >
          <div class="map-embed-container" style="margin-top: 1rem; border-radius: var(--radius); overflow: hidden; height: 220px; border: 1px solid var(--color-border);">
            <iframe
              title="Service map for ${ctx.city}, ${ctx.stateId}"
              width="100%"
              height="100%"
              style="border: 0;"
              loading="lazy"
              src="${mapEmbedUrl}"
            ></iframe>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

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
          <p>${step.desc}</p>
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
