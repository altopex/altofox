import { SectionJSON } from "../../lib/generator/content-schema";
import { ResolvedImage, resolvePhoto, detectTradeCategory } from "../../lib/photos/photo-service";
import { renderStaticImageTag } from "../../lib/photos/image-provider";

export function renderServices(
  section: SectionJSON,
  images: ResolvedImage[] = [],
  sitePhone?: string
): string {
  const content = section.content || {};
  const variant = section.variant || "cards";
  const phone = content.phone || sitePhone || "";
  const cleanPhone = phone.replace(/[^\d+]/g, "");

  const eyebrow = content.eyebrow || "What We Do";
  const headline = content.headline || "Comprehensive Local Services";
  const subheadline =
    content.subheadline ||
    "Delivered with precision, safety, and guaranteed craftsmanship by certified professionals.";
  const items: { title: string; description: string; slug?: string }[] = content.items || [
    { title: "Emergency Repairs", description: "Immediate 24/7 dispatch for urgent breakdowns with upfront flat rates." },
    { title: "Diagnostic Inspection", description: "Comprehensive testing using advanced camera and scanner technology." },
    { title: "System Installation", description: "Professional installation backed by manufacturer and labor warranties." },
  ];

  // Helper icon SVG
  const defaultIcon = `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path></svg>`;

  // VARIANT 1: COMPACT-LIST (Bold Conversion Theme)
  if (variant === "compact-list") {
    return `
  <!-- Services Section: Compact High-Conversion List Variant -->
  <section class="section section-compact-services" id="services">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge badge-emergency">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="services-compact-grid">
        ${items
          .map((item, idx) => {
            const fallbackImg: ResolvedImage = resolvePhoto(
              detectTradeCategory(item.title),
              "service",
              item.title,
              idx
            );
            const img = images[idx] || fallbackImg;
            const linkHref = item.slug ? (item.slug.endsWith(".html") ? item.slug : `${item.slug}.html`) : "contact.html";
            return `
        <div class="card service-compact-card reveal">
          <div class="service-compact-img-wrap">
            ${renderStaticImageTag({
              src: img.url || img.localPath || "",
              alt: img.alt || item.title,
              fallbackUrl: img.fallbackUrl,
              allFallbacks: img.allFallbacks,
              localSvg: img.localSvgFallback,
              width: 400,
              height: 300,
              loading: "lazy",
              className: "img-card-thumb",
            })}
          </div>
          <div class="service-compact-content">
            <div class="service-compact-header">
              <h3>${item.title}</h3>
              <span class="service-badge-pill">Immediate Dispatch</span>
            </div>
            <p>${item.description}</p>
            <div class="service-compact-actions">
              ${cleanPhone ? `<a href="tel:${cleanPhone}" class="btn btn-primary btn-sm btn-call-primary" aria-label="Call for ${item.title}">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>Call For Service</span>
              </a>` : ""}
              <a href="${linkHref}" class="btn btn-outline btn-sm">
                <span>Details →</span>
              </a>
            </div>
          </div>
        </div>`;
          })
          .join("\n        ")}
      </div>
    </div>
  </section>`;
  }

  // VARIANT 2: SOFT GRID (Contemporary Soft Theme)
  if (variant === "softGrid") {
    return `
  <!-- Services Section: Soft Grid Variant -->
  <section class="section section-soft" id="services">
    <div class="container">
      <div class="section-header text-center reveal">
        <span class="badge badge-pill">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="services-grid services-soft-grid">
        ${items
          .map((item, idx) => {
            const fallbackImg: ResolvedImage = resolvePhoto(
              detectTradeCategory(item.title),
              "service",
              item.title,
              idx
            );
            const img = images[idx] || fallbackImg;
            const linkHref = item.slug ? (item.slug.endsWith(".html") ? item.slug : `${item.slug}.html`) : "contact.html";
            return `
        <div class="card card-soft service-card reveal">
          <div class="service-soft-media">
            ${renderStaticImageTag({
              src: img.url || img.localPath || "",
              alt: img.alt || item.title,
              fallbackUrl: img.fallbackUrl,
              allFallbacks: img.allFallbacks,
              localSvg: img.localSvgFallback,
              width: 800,
              height: 533,
              loading: "lazy",
              className: "img-card img-card-soft",
            })}
          </div>
          <div class="service-card-body">
            <span class="service-tag-soft">Professional Care</span>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <div class="service-card-footer">
              ${cleanPhone ? `<a href="tel:${cleanPhone}" class="btn btn-primary btn-pill btn-sm"><span>Call for Service</span></a>` : ""}
              <a href="${linkHref}" class="btn btn-outline btn-pill btn-sm"><span>Learn More →</span></a>
            </div>
          </div>
        </div>`;
          })
          .join("\n        ")}
      </div>
    </div>
  </section>`;
  }

  // VARIANT 3: ALTERNATING (Editorial Modern Theme)
  if (variant === "alternating") {
    return `
  <!-- Services Section: Alternating Variant -->
  <section class="section section-editorial" id="services">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge badge-refined">${eyebrow}</span>
        <h2 class="heading-editorial">${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="services-alternating">
        ${items
          .map((item, idx) => {
            const fallbackImg: ResolvedImage = resolvePhoto(
              detectTradeCategory(item.title),
              "service",
              item.title,
              idx
            );
            const img = images[idx] || images[0] || fallbackImg;
            const isReverse = idx % 2 === 1;
            const linkHref = item.slug ? (item.slug.endsWith(".html") ? item.slug : `${item.slug}.html`) : "contact.html";
            return `
        <div class="service-alt-row ${isReverse ? "reverse" : ""} reveal">
          <div class="service-alt-image">
            <div class="editorial-image-frame">
              ${renderStaticImageTag({
                src: img.url || img.localPath || "",
                alt: img.alt || item.title,
                fallbackUrl: img.fallbackUrl,
                allFallbacks: img.allFallbacks,
                localSvg: img.localSvgFallback,
                width: 800,
                height: 600,
                loading: "lazy",
                className: "img-card",
              })}
            </div>
          </div>
          <div class="service-alt-text">
            <span class="badge">Specialty ${String(idx + 1).padStart(2, "0")}</span>
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <div style="display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; margin-top: 1.25rem;">
              ${cleanPhone ? `<a href="tel:${cleanPhone}" class="btn btn-primary btn-call-primary">Call for Service →</a>` : ""}
              <a href="${linkHref}" class="btn btn-outline">Learn More</a>
            </div>
          </div>
        </div>`;
          })
          .join("\n        ")}
      </div>
    </div>
  </section>`;
  }

  // VARIANT 4: ICONS (Clean Minimal Theme)
  if (variant === "icons") {
    return `
  <!-- Services Section: Icon Cards Variant -->
  <section class="section section-minimal" id="services">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge badge-minimal">${eyebrow}</span>
        <h2 class="heading-minimal">${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="services-grid services-minimal-grid">
        ${items
          .map((item) => {
            const linkHref = item.slug ? (item.slug.endsWith(".html") ? item.slug : `${item.slug}.html`) : "contact.html";
            return `
        <div class="card card-minimal reveal" style="display: flex; flex-direction: column;">
          <div class="service-icon-box">
            ${defaultIcon}
          </div>
          <h3>${item.title}</h3>
          <p style="flex: 1;">${item.description}</p>
          <div style="display: flex; gap: 0.75rem; align-items: center; justify-content: space-between; margin-top: 1rem; border-top: 1px solid var(--color-border); padding-top: 0.75rem;">
            ${cleanPhone ? `<a href="tel:${cleanPhone}" class="link-call" style="font-weight: 700; color: var(--color-primary); font-size: 0.85rem;">Call Direct →</a>` : ""}
            <a href="${linkHref}" class="link-subtle" style="font-weight: 600; color: var(--color-muted); font-size: 0.85rem;">
              <span>Learn More</span>
            </a>
          </div>
        </div>`;
          })
          .join("\n        ")}
      </div>
    </div>
  </section>`;
  }

  // VARIANT 5: DEFAULT PHOTO CARDS GRID (Modern Local Pro, Split Hero, High Contrast, Modern Service Grid)
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
            const fallbackImg: ResolvedImage = resolvePhoto(
              detectTradeCategory(item.title),
              "service",
              item.title,
              idx
            );
            const img = images[idx] || fallbackImg;
            const linkHref = item.slug ? (item.slug.endsWith(".html") ? item.slug : `${item.slug}.html`) : "contact.html";
            return `
        <div class="card service-card reveal">
          ${renderStaticImageTag({
            src: img.url || img.localPath || "",
            alt: img.alt || item.title,
            fallbackUrl: img.fallbackUrl,
            allFallbacks: img.allFallbacks,
            localSvg: img.localSvgFallback,
            width: 800,
            height: 533,
            loading: "lazy",
            className: "img-card",
          })}
          <div class="service-card-body">
            <h3>${item.title}</h3>
            <p>${item.description}</p>
            <div style="display: flex; gap: 0.5rem; align-items: center; flex-wrap: wrap; margin-top: 1rem;">
              ${cleanPhone ? `<a href="tel:${cleanPhone}" class="btn btn-primary btn-sm btn-service-call" style="font-weight: 700;"><span>Call for Service</span></a>` : ""}
              <a href="${linkHref}" class="btn btn-outline btn-sm">
                <span>Learn More</span>
                <span>→</span>
              </a>
            </div>
          </div>
        </div>`;
          })
          .join("\n        ")}
      </div>
    </div>
  </section>`;
}
