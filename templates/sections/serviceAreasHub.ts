import { SiteInfoJSON } from "../../lib/generator/content-schema";
import { Theme } from "../../lib/themes";
import { SIMPLEMAPS_ATTRIBUTION } from "../../lib/data/geo-utils";
import { PageRegistry, RegistryPage, linkTo, LinkStyle, renderBreadcrumbs } from "../../lib/registry/page-registry";
import { safeText } from "../../lib/generator/safe-helpers";

export interface ServiceAreaCityItem {
  city: string;
  stateId: string;
  county: string;
  slug: string;
  population?: number;
  distanceOffset?: string;
}

/**
 * Renders the Service Areas Hub Page strictly using the Master Page Registry
 */
export function renderServiceAreasHub(
  cities: ServiceAreaCityItem[],
  site: SiteInfoJSON,
  theme: Theme,
  mainCity: string,
  state: string,
  registry: PageRegistry,
  currentPage: RegistryPage,
  linkStyle: LinkStyle = "web"
): string {
  const phone = safeText(site.phone, "(555) 123-4567");
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  // Breadcrumbs
  const { html: breadcrumbsHtml } = renderBreadcrumbs(registry, currentPage, "example.com", linkStyle);

  // Contact Page link
  const contactPage = registry.getByType("contact")[0];
  const contactHref = contactPage ? linkTo(currentPage, contactPage, linkStyle) : "contact.html";

  // Group cities by County
  const byCounty = new Map<string, ServiceAreaCityItem[]>();

  for (const c of cities) {
    const countyKey = c.county ? `${c.county} County` : "Regional Communities";
    const existing = byCounty.get(countyKey) || [];
    existing.push(c);
    byCounty.set(countyKey, existing);
  }

  const countiesSorted = Array.from(byCounty.entries()).sort(([a], [b]) => a.localeCompare(b));

  return `
${breadcrumbsHtml}

<!-- Hero Section -->
<section class="section">
  <div class="container text-center">
    <div class="badge">📍 Regional Dispatch &amp; Fast Coverage</div>
    <h1>Areas We Serve Across ${mainCity} and Surrounding Counties</h1>
    <p class="lead-text" style="max-width: 720px; margin: 0 auto 2rem auto;">
      Providing prompt, certified, and upfront residential and commercial services across ${cities.length} local communities.
    </p>
    <div class="hub-hero-actions" style="display: flex; justify-content: center; gap: 1rem; flex-wrap: wrap;">
      <a href="tel:${cleanPhone}" class="btn btn-primary">Call ${phone}</a>
      <a href="${contactHref}" class="btn btn-outline">Book Online</a>
    </div>
  </div>
</section>

<!-- Counties & Cities Directory Grid -->
<section class="section section-alt">
  <div class="container">
    <div class="counties-stack" style="display: flex; flex-direction: column; gap: 2rem;">
      ${countiesSorted
        .map(
          ([countyName, cityList]) => `
        <div class="card county-card">
          <div class="county-header" style="display: flex; align-items: center; justify-content: space-between; padding-bottom: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid var(--color-border);">
            <h2 style="font-size: 1.5rem; margin-bottom: 0;">🏛️ ${countyName}</h2>
            <span class="badge">${cityList.length} ${cityList.length === 1 ? "Community" : "Communities"}</span>
          </div>

          <div class="cities-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem;">
            ${cityList
              .map((c) => {
                // Find matching location page in registry
                const locPage = registry.getByType("location").find(
                  (l) => l.data?.city?.toLowerCase() === c.city.toLowerCase() ||
                         l.outputFilePath.toLowerCase().includes(c.city.toLowerCase())
                );
                const href = locPage ? linkTo(currentPage, locPage, linkStyle) : c.slug;

                return `
              <a href="${href}" class="city-chip-card" style="display: block; padding: 1rem; border-radius: var(--radius); background: var(--color-background); border: 1px solid var(--color-border); transition: var(--transition);">
                <div style="font-weight: 700; color: var(--color-secondary);">${c.city}, ${c.stateId}</div>
                ${c.distanceOffset ? `<div style="font-size: 0.8rem; color: var(--color-muted); margin-top: 0.25rem;">${c.distanceOffset}</div>` : ""}
                <div style="font-size: 0.85rem; font-weight: 600; color: var(--color-primary); margin-top: 0.5rem;">View local services →</div>
              </a>`;
              })
              .join("\n            ")}
          </div>
        </div>`
        )
        .join("\n      ")}
    </div>
  </div>
</section>

<!-- Attribution -->
<section class="section" style="padding-top: 2rem; padding-bottom: 2rem; text-align: center; font-size: 0.85rem; color: var(--color-muted);">
  <div class="container">
    <p>
      ${SIMPLEMAPS_ATTRIBUTION.attributionText}
      <a href="${SIMPLEMAPS_ATTRIBUTION.url}" target="_blank" rel="noopener noreferrer" style="text-decoration: underline;">
        ${SIMPLEMAPS_ATTRIBUTION.name}
      </a>.
    </p>
  </div>
</section>
  `.trim();
}
