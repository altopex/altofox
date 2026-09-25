import { SiteInfoJSON } from "../../lib/generator/content-schema";
import { Theme } from "../../lib/themes";
import { SIMPLEMAPS_ATTRIBUTION } from "../../lib/data/geo-utils";

export interface ServiceAreaCityItem {
  city: string;
  stateId: string;
  county: string;
  slug: string;
  population?: number;
  distanceOffset?: string;
}

/**
 * Renders the Service Areas Hub Page (service-areas.html)
 * Groups all covered cities by County with links to dedicated location landing pages.
 */
export function renderServiceAreasHub(
  cities: ServiceAreaCityItem[],
  site: SiteInfoJSON,
  theme: Theme,
  mainCity: string,
  state: string
): string {
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
<!-- Breadcrumbs -->
<nav aria-label="Breadcrumb" class="py-3 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-xs text-slate-500">
  <ol class="flex items-center space-x-2">
    <li><a href="index.html" class="hover:text-indigo-600 font-medium">Home</a></li>
    <li><span class="text-slate-400">/</span></li>
    <li class="font-semibold text-slate-900" aria-current="page">Service Areas</li>
  </ol>
</nav>

<!-- Hero Section -->
<section class="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-4">
  <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700 mx-auto">
    <span>📍 Regional Dispatch &amp; Fast Coverage</span>
  </div>
  <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight">
    Areas We Serve Across ${mainCity} and Surrounding Counties
  </h1>
  <p class="max-w-2xl mx-auto text-base sm:text-lg text-slate-600 leading-relaxed">
    Providing prompt, certified, and upfront residential and commercial services across ${cities.length} local communities.
  </p>
  <div class="pt-2 flex flex-wrap justify-center gap-3">
    <a href="tel:${site.phone.replace(/[^\d+]/g, "")}" class="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition">
      Call ${site.phone}
    </a>
    <a href="contact.html" class="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 transition">
      Book Online
    </a>
  </div>
</section>

<!-- Counties & Cities Directory Grid -->
<section class="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-10">
  ${countiesSorted
    .map(
      ([countyName, cityList]) => `
    <div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <h2 class="text-xl sm:text-2xl font-bold text-slate-900 flex items-center space-x-2">
          <span>🏛️</span>
          <span>${countyName}</span>
        </h2>
        <span class="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
          ${cityList.length} ${cityList.length === 1 ? "Community" : "Communities"}
        </span>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        ${cityList
          .map(
            (c) => `
          <a href="${c.slug}" class="group p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-indigo-50/60 hover:border-indigo-300 transition flex flex-col justify-between">
            <div>
              <span class="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition block">
                ${c.city}, ${c.stateId}
              </span>
              ${
                c.distanceOffset
                  ? `<span class="text-[11px] text-slate-500 block mt-0.5">${c.distanceOffset}</span>`
                  : ""
              }
            </div>
            <div class="mt-2 text-xs font-semibold text-indigo-600 group-hover:translate-x-0.5 transition inline-flex items-center">
              <span>View local services</span>
              <span class="ml-1">→</span>
            </div>
          </a>
        `
          )
          .join("")}
      </div>
    </div>
  `
    )
    .join("")}
</section>

<!-- SimpleMaps Attribution -->
<section class="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center text-xs text-slate-400">
  <p>
    ${SIMPLEMAPS_ATTRIBUTION.attributionText}
    <a href="${SIMPLEMAPS_ATTRIBUTION.url}" target="_blank" rel="noopener noreferrer" class="underline hover:text-slate-600">
      ${SIMPLEMAPS_ATTRIBUTION.name}
    </a>.
  </p>
</section>
  `.trim();
}
