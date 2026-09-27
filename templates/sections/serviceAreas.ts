import { SectionJSON } from "../../lib/generator/content-schema";

export function renderServiceAreas(
  section: SectionJSON,
  siteAreas: string[] = [],
  siteCity?: string,
  siteState?: string
): string {
  const content = section.content || {};
  const eyebrow = content.eyebrow || "Coverage Area";
  const headline = content.headline || "Communities We Proudly Serve";
  const subheadline =
    content.subheadline ||
    "Stationed local dispatch teams provide prompt, guaranteed response times across all serviced cities and neighboring areas.";

  // Normalize areas whether they are strings, objects, or site areas
  const rawAreas =
    Array.isArray(content.areas) && content.areas.length > 0
      ? content.areas
      : siteAreas.length > 0
      ? siteAreas
      : [
          siteCity ? `${siteCity}${siteState ? `, ${siteState}` : ""}` : "Dallas, TX",
          siteState ? `Fort Worth, ${siteState}` : "Fort Worth, TX",
          siteState ? `Arlington, ${siteState}` : "Arlington, TX",
          siteState ? `Plano, ${siteState}` : "Plano, TX",
          siteState ? `Irving, ${siteState}` : "Irving, TX",
          siteState ? `Frisco, ${siteState}` : "Frisco, TX",
        ];

  const normalizedAreas: Array<{ name: string; slug: string }> = [];

  for (const item of rawAreas) {
    let name = "";
    let slug = "contact.html";

    if (typeof item === "string") {
      name = item.trim();
    } else if (item && typeof item === "object") {
      name = (item.name || item.city || item.title || "").trim();
      if (item.slug) {
        slug = item.slug.endsWith(".html") ? item.slug : `${item.slug}.html`;
      }
    }

    if (!name) continue;

    // Clean any accidentally embedded emoji from the text
    name = name.replace(/^📍\s*/, "").trim();

    // If state is available and not already formatted, append it (e.g. "Dallas, TX")
    if (siteState && !name.includes(",") && !name.toLowerCase().includes(siteState.toLowerCase())) {
      name = `${name}, ${siteState}`;
    }

    if (slug === "contact.html") {
      const cleanSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      slug = cleanSlug ? `${cleanSlug}.html` : "contact.html";
    }

    normalizedAreas.push({ name, slug });
  }

  // De-duplicate by name
  const seen = new Set<string>();
  const uniqueAreas = normalizedAreas.filter((a) => {
    const key = a.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  return `
  <!-- Service Areas Section: Nearby Locations List (No Map) -->
  <section class="section section-alt" id="service-areas">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>

      <div class="service-area-grid">
        ${uniqueAreas
          .map(
            (a) => `
        <a href="${a.slug}" class="service-area-card reveal" aria-label="Services in ${a.name}">
          <span class="service-area-pin-name">
            <span class="service-area-pin" aria-hidden="true">📍</span>
            <span class="service-area-name">${a.name}</span>
          </span>
          <span class="service-area-arrow" aria-hidden="true">→</span>
        </a>`
          )
          .join("\n        ")}
      </div>
    </div>
  </section>`;
}
