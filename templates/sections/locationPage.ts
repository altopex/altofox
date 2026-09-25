import { Theme } from "../../lib/themes";
import { SiteInfoJSON } from "../../lib/generator/content-schema";
import { CityData, getNearestSelectedCities } from "../../lib/data/us-cities";

export interface LocationPageContext {
  city: string;
  stateId: string;
  stateName: string;
  county: string;
  population?: number;
  distanceOffset?: string; // e.g. "12 miles southwest"
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
}

/**
 * Builds the Breadcrumbs HTML for Location Page
 */
function renderBreadcrumbs(city: string, stateId: string): string {
  return `
  <nav aria-label="Breadcrumb" class="py-3 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-xs text-slate-500">
    <ol class="flex items-center space-x-2">
      <li><a href="index.html" class="hover:text-indigo-600 font-medium">Home</a></li>
      <li><span class="text-slate-400">/</span></li>
      <li><a href="service-areas.html" class="hover:text-indigo-600 font-medium">Service Areas</a></li>
      <li><span class="text-slate-400">/</span></li>
      <li class="font-semibold text-slate-900" aria-current="page">${city}, ${stateId}</li>
    </ol>
  </nav>
  `;
}

/**
 * Renders an accessible app-built Location Page complying with design system & Google policies
 */
export function renderLocationPage(
  ctx: LocationPageContext,
  site: SiteInfoJSON,
  theme: Theme,
  allSelectedCities: { city: string; stateId: string; lat: number; lng: number; slug?: string }[] = [],
  currentCityCoords?: { lat: number; lng: number }
): string {
  const cityQuery = encodeURIComponent(`${ctx.city}, ${ctx.stateId}`);
  const mapEmbedUrl = `https://maps.google.com/maps?q=${cityQuery}&t=&z=12&ie=UTF8&iwloc=&output=embed`;

  // Compute 3-5 nearest selected cities if not already passed
  const nearby =
    ctx.nearestCities && ctx.nearestCities.length > 0
      ? ctx.nearestCities
      : currentCityCoords
      ? getNearestSelectedCities(
          { lat: currentCityCoords.lat, lng: currentCityCoords.lng, city: ctx.city, stateId: ctx.stateId },
          allSelectedCities,
          4
        )
      : [];

  const breadcrumbsHtml = renderBreadcrumbs(ctx.city, ctx.stateId);

  return `
${breadcrumbsHtml}

<!-- Location Hero Section -->
<section class="location-hero py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
  <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
    <div class="lg:col-span-7 space-y-4">
      <div class="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs font-bold text-indigo-700">
        <span>📍 Dedicated Coverage: ${ctx.city}, ${ctx.stateId}</span>
        ${ctx.distanceOffset ? `<span class="text-slate-400">•</span><span>${ctx.distanceOffset}</span>` : ""}
      </div>
      <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
        ${ctx.h1}
      </h1>
      <p class="text-base sm:text-lg text-slate-600 leading-relaxed">
        ${ctx.introParagraph}
      </p>
      <div class="flex flex-wrap gap-3 pt-2">
        <a href="tel:${site.phone.replace(/[^\d+]/g, "")}" class="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md transition transform hover:-translate-y-0.5">
          Call ${site.phone}
        </a>
        <a href="contact.html" class="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-slate-800 bg-white border border-slate-300 hover:bg-slate-50 transition">
          Request Service in ${ctx.city}
        </a>
      </div>
      ${
        ctx.zipCodes && ctx.zipCodes.length > 0
          ? `<p class="text-xs text-slate-500 pt-1">Serving all ${ctx.city} ZIP codes including: ${ctx.zipCodes.slice(0, 6).join(", ")}.</p>`
          : ""
      }
    </div>

    <!-- Embedded City Map -->
    <div class="lg:col-span-5">
      <div class="rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-100 h-[340px] relative">
        <iframe
          title="Service map for ${ctx.city}, ${ctx.stateId}"
          width="100%"
          height="100%"
          frameborder="0"
          scrolling="no"
          marginheight="0"
          marginwidth="0"
          src="${mapEmbedUrl}"
          class="w-full h-full border-0 filter saturate-110"
          loading="lazy"
        ></iframe>
      </div>
    </div>
  </div>
</section>

<!-- Unique Regional Angle / Local Context Section -->
<section class="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
  <div class="bg-slate-50 border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-4">
    <div class="inline-block text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/60 px-2.5 py-1 rounded">
      Local Context &amp; Standards
    </div>
    <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">
      ${ctx.angleSectionHeadline}
    </h2>
    <div class="prose prose-slate max-w-none text-slate-700 text-sm sm:text-base leading-relaxed space-y-3">
      ${ctx.angleSectionContent}
    </div>
    ${
      ctx.localNotes
        ? `<div class="mt-4 p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-900 leading-relaxed font-medium">
             <strong>Local Service Note:</strong> ${ctx.localNotes}
           </div>`
        : ""
    }
  </div>
</section>

<!-- Services Available in City -->
<section class="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
  <div class="text-center max-w-3xl mx-auto mb-10 space-y-2">
    <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">
      Comprehensive Services We Provide in ${ctx.city}
    </h2>
    <p class="text-sm sm:text-base text-slate-600">
      Prompt, upfront, and fully licensed solutions for residential and commercial properties across ${ctx.county} County.
    </p>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
    ${ctx.servicesIncluded
      .map(
        (srv) => `
      <div class="p-5 rounded-xl border border-slate-200 bg-white hover:border-indigo-300 hover:shadow-sm transition">
        <h3 class="text-base font-bold text-slate-900 mb-1.5 flex items-center justify-between">
          <span>${srv}</span>
          <span class="text-indigo-600 text-xs font-semibold">In ${ctx.city}</span>
        </h3>
        <p class="text-xs text-slate-600 leading-relaxed">
          Complete diagnosis, repairs, and installations backed by our satisfaction guarantee and honest flat-rate pricing.
        </p>
        <div class="mt-3 pt-2 border-t border-slate-100">
          <a href="contact.html" class="text-xs font-bold text-indigo-600 hover:text-indigo-800">
            Book ${srv} in ${ctx.city} →
          </a>
        </div>
      </div>
    `
      )
      .join("")}
  </div>
</section>

<!-- Local Process Steps -->
<section class="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-slate-50 rounded-2xl border border-slate-200 my-8">
  <div class="text-center max-w-2xl mx-auto mb-10 space-y-2">
    <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">
      How Our Service Works in ${ctx.city}
    </h2>
    <p class="text-sm text-slate-600">
      From your first phone call to complete cleanup, we make scheduling easy and transparent.
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
    ${ctx.processSteps
      .map(
        (step, idx) => `
      <div class="bg-white p-6 rounded-xl border border-slate-200 space-y-2">
        <div class="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold text-sm flex items-center justify-center">
          ${idx + 1}
        </div>
        <h3 class="text-base font-bold text-slate-900">${step.title}</h3>
        <p class="text-xs text-slate-600 leading-relaxed">${step.desc}</p>
      </div>
    `
      )
      .join("")}
  </div>
</section>

<!-- Frequently Asked Questions Specific to City -->
${
  ctx.faqs && ctx.faqs.length > 0
    ? `
<section class="py-12 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
  <div class="text-center mb-8 space-y-1">
    <h2 class="text-2xl sm:text-3xl font-bold text-slate-900">
      ${ctx.city} Service FAQs
    </h2>
    <p class="text-xs sm:text-sm text-slate-600">Answers to common customer questions in ${ctx.city} and ${ctx.county} County.</p>
  </div>

  <div class="space-y-3">
    ${ctx.faqs
      .map(
        (faq) => `
      <details class="group bg-white border border-slate-200 rounded-xl p-4 [&_summary::-webkit-details-marker]:hidden transition open:ring-1 open:ring-indigo-500">
        <summary class="flex items-center justify-between cursor-pointer font-bold text-sm text-slate-900 select-none">
          <span>${faq.question}</span>
          <span class="ml-2 text-indigo-600 transition group-open:rotate-180">▼</span>
        </summary>
        <p class="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">
          ${faq.answer}
        </p>
      </details>
    `
      )
      .join("")}
  </div>
</section>
`
    : ""
}

<!-- Nearby Areas Links Section -->
${
  nearby.length > 0
    ? `
<section class="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-200">
  <div class="bg-indigo-50/60 border border-indigo-100 rounded-xl p-6 sm:p-8 space-y-3">
    <h3 class="text-sm font-bold uppercase tracking-wider text-indigo-900">
      Areas Near ${ctx.city} We Also Serve
    </h3>
    <p class="text-xs text-slate-600">
      Need dispatch outside ${ctx.city}? We also serve these nearby communities with the same prompt arrival and warranty protection:
    </p>
    <div class="flex flex-wrap gap-2 pt-2">
      ${nearby
        .map((n) => {
          const targetSlug = n.slug || `plumber-${n.city.toLowerCase().replace(/\s+/g, "-")}-${n.stateId.toLowerCase()}.html`;
          return `
        <a href="${targetSlug}" class="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-400 text-xs font-semibold text-slate-800 hover:text-indigo-600 transition shadow-2xs">
          <span>${n.city}, ${n.stateId}</span>
          <span class="text-[10px] text-slate-400 font-normal">(${n.distanceMiles} mi)</span>
        </a>
      `;
        })
        .join("")}
      <a href="service-areas.html" class="inline-flex items-center px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white transition">
        View All Service Areas →
      </a>
    </div>
  </div>
</section>
`
    : ""
}

<!-- Final Location Call-to-Action Banner -->
<section class="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto my-8">
  <div class="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
    <h2 class="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
      Ready For Fast, Professional Service in ${ctx.city}?
    </h2>
    <p class="text-slate-300 max-w-2xl mx-auto text-sm sm:text-base">
      Call now for direct dispatch, upfront quotes, and experienced local specialists.
    </p>
    <div class="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
      <a href="tel:${site.phone.replace(/[^\d+]/g, "")}" class="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-slate-900 bg-white hover:bg-slate-100 transition shadow-md">
        Call ${site.phone}
      </a>
      <a href="contact.html" class="w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition">
        Book Online
      </a>
    </div>
  </div>
</section>
  `.trim();
}

/**
 * Builds the Schema.org JSON-LD for a Location Page
 * Includes: Service (with areaServed as City), BreadcrumbList, and FAQPage.
 */
export function buildLocationPageSchema(
  ctx: LocationPageContext,
  site: SiteInfoJSON,
  domain: string,
  pageSlug: string
): string {
  const schemaList: any[] = [];

  // 1. BreadcrumbList Schema
  schemaList.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `https://${domain}/index.html`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Service Areas",
        item: `https://${domain}/service-areas.html`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: `${ctx.city}, ${ctx.stateId}`,
        item: `https://${domain}/${pageSlug}`,
      },
    ],
  });

  // 2. Service Schema with specific areaServed
  schemaList.push({
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: ctx.h1,
    provider: {
      "@type": "LocalBusiness",
      name: site.businessName,
      telephone: site.phone,
      url: `https://${domain}`,
    },
    areaServed: {
      "@type": "City",
      name: ctx.city,
      containedInPlace: {
        "@type": "AdministrativeArea",
        name: `${ctx.county} County`,
      },
    },
    description: ctx.metaDescription,
  });

  // 3. FAQPage Schema if FAQs exist
  if (ctx.faqs && ctx.faqs.length > 0) {
    schemaList.push({
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
    });
  }

  return schemaList
    .map((s) => `<script type="application/ld+json">\n${JSON.stringify(s, null, 2)}\n</script>`)
    .join("\n");
}
