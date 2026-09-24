import { SectionJSON } from "../../lib/generator/content-schema";

export function renderServiceAreas(
  section: SectionJSON,
  siteAreas: string[] = [],
  mapEmbed?: string
): string {
  const content = section.content || {};
  const eyebrow = content.eyebrow || "Coverage Area";
  const headline = content.headline || "Communities We Proudly Serve";
  const subheadline = content.subheadline || "Stationed local mobile units enable fast, guaranteed arrival times across all serviced cities.";
  const areas: { name: string; slug?: string }[] = content.areas || (
    siteAreas.length > 0 ? siteAreas.map((a) => ({ name: a })) : [
      { name: "Dallas" }, { name: "Plano" }, { name: "Frisco" }, { name: "McKinney" }, { name: "Irving" }, { name: "Richardson" }
    ]
  );

  return `
  <!-- Service Areas Section -->
  <section class="section section-alt" id="service-areas">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
        ${areas
          .map((a) => {
            const href = a.slug ? (a.slug.endsWith(".html") ? a.slug : `${a.slug}.html`) : "contact.html";
            return `
        <a href="${href}" class="card reveal" style="padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; font-weight: 700; color: var(--color-secondary);">
          <span>📍 ${a.name}</span>
          <span style="color: var(--color-primary);">→</span>
        </a>`;
          })
          .join("\n        ")}
      </div>
      ${
        mapEmbed
          ? `
      <div class="reveal" style="margin-top: 3rem; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-md);">
        ${mapEmbed}
      </div>`
          : ""
      }
    </div>
  </section>`;
}
