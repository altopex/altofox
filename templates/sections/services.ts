import { SectionJSON } from "../../lib/generator/content-schema";
import { ResolvedImage } from "../../lib/photos/photo-service";

export function renderServices(
  section: SectionJSON,
  images: ResolvedImage[] = []
): string {
  const content = section.content || {};
  const variant = section.variant || "cards";

  const eyebrow = content.eyebrow || "What We Do";
  const headline = content.headline || "Comprehensive Local Services";
  const subheadline = content.subheadline || "Delivered with precision, safety, and guaranteed craftsmanship by certified professionals.";
  const items: { title: string; description: string; slug?: string }[] = content.items || [
    { title: "Emergency Repairs", description: "Immediate 24/7 dispatch for urgent breakdowns with upfront flat rates." },
    { title: "Diagnostic Inspection", description: "Comprehensive testing using advanced camera and scanner technology." },
    { title: "System Installation", description: "Professional installation backed by manufacturer and labor warranties." },
  ];

  // Helper icon SVG
  const defaultIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;

  // Variant 1: Cards Grid with Photo
  if (variant === "cards") {
    return `
  <!-- Services Section: Photo Cards Variant -->
  <section class="section" id="services">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="services-grid">
        ${items
          .map((item, idx) => {
            const fallbackImg: ResolvedImage = {
              url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
              alt: item.title,
              slot: "service",
            };
            const img = images[idx] || images[0] || fallbackImg;
            const linkHref = item.slug ? (item.slug.endsWith(".html") ? item.slug : `${item.slug}.html`) : "contact.html";
            return `
        <div class="card service-card reveal">
          <picture>
            <source srcset="${img.url || img.localWebpPath || img.localPath}" type="image/webp">
            <img src="${img.url || img.localPath}" data-remote-src="${img.url}" alt="${img.alt || item.title}" class="img-card" width="800" height="533" loading="lazy"${img.fallbackUrl ? ` onerror="this.onerror=null;this.src='${img.fallbackUrl}';"` : ""}>
          </picture>
          <div class="service-card-body">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <a href="${linkHref}" class="btn btn-outline btn-sm" style="margin-top: 1rem; align-self: flex-start;">
              <span>Learn More</span>
              <span>→</span>
            </a>
          </div>
        </div>`;
          })
          .join("\n        ")}
      </div>
    </div>
  </section>`;
  }

  // Variant 2: Icon Cards Grid
  if (variant === "icons") {
    return `
  <!-- Services Section: Icon Cards Variant -->
  <section class="section" id="services">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="services-grid">
        ${items
          .map((item) => {
            const linkHref = item.slug ? (item.slug.endsWith(".html") ? item.slug : `${item.slug}.html`) : "contact.html";
            return `
        <div class="card reveal" style="display: flex; flex-direction: column;">
          <div class="service-icon-box">
            ${defaultIcon}
          </div>
          <h3>${item.title}</h3>
          <p style="flex: 1;">${item.description}</p>
          <a href="${linkHref}" class="link-subtle" style="font-weight: 700; color: var(--color-primary); margin-top: 1rem; display: inline-flex; align-items: center; gap: 0.35rem;">
            <span>Explore Service</span>
            <span>→</span>
          </a>
        </div>`;
          })
          .join("\n        ")}
      </div>
    </div>
  </section>`;
  }

  // Variant 3: Alternating Image/Text Rows
  return `
  <!-- Services Section: Alternating Variant -->
  <section class="section" id="services">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="services-alternating">
        ${items
          .map((item, idx) => {
            const fallbackImg: ResolvedImage = {
              url: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
              alt: item.title,
              slot: "service",
            };
            const img = images[idx] || images[0] || fallbackImg;
            const isReverse = idx % 2 === 1;
            const linkHref = item.slug ? (item.slug.endsWith(".html") ? item.slug : `${item.slug}.html`) : "contact.html";
            return `
        <div class="service-alt-row ${isReverse ? "reverse" : ""} reveal">
          <div class="service-alt-image">
            <picture>
              <source srcset="${img.url || img.localWebpPath || img.localPath}" type="image/webp">
              <img src="${img.url || img.localPath}" data-remote-src="${img.url}" alt="${img.alt || item.title}" class="img-card" style="aspect-ratio: 4/3;" width="800" height="600" loading="lazy"${img.fallbackUrl ? ` onerror="this.onerror=null;this.src='${img.fallbackUrl}';"` : ""}>
            </picture>
          </div>
          <div class="service-alt-text">
            <span class="badge">Specialty ${idx + 1}</span>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <a href="${linkHref}" class="btn btn-primary" style="margin-top: 1rem;">Schedule Service →</a>
          </div>
        </div>`;
          })
          .join("\n        ")}
      </div>
    </div>
  </section>`;
}
