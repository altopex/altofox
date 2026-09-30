import { SectionJSON } from "../../lib/generator/content-schema";
import { ResolvedImage } from "../../lib/photos/photo-service";
import { renderStaticImageTag } from "../../lib/photos/image-provider";

export function renderGallery(
  section: SectionJSON,
  images: ResolvedImage[] = []
): string {
  const content = section.content || {};
  const eyebrow = content.eyebrow || "Real Local Work";
  const headline = content.headline || "Our Recent Project Gallery";
  const subheadline = content.subheadline || "Browse real completed jobs across our service territory. Click any photo to enlarge.";

  const galleryImages = images.length > 0 ? images : [
    { url: "https://images.pexels.com/photos/6419125/pexels-photo-6419125.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Completed project", slot: "gallery" },
    { url: "https://images.pexels.com/photos/4792487/pexels-photo-4792487.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Modern repair", slot: "gallery" },
    { url: "https://images.pexels.com/photos/8005400/pexels-photo-8005400.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Commercial installation", slot: "gallery" },
    { url: "https://images.pexels.com/photos/8486974/pexels-photo-8486974.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Inspection in progress", slot: "gallery" },
    { url: "https://images.pexels.com/photos/5691622/pexels-photo-5691622.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "System overhaul", slot: "gallery" },
    { url: "https://images.pexels.com/photos/6419124/pexels-photo-6419124.jpeg?auto=compress&cs=tinysrgb&w=800", alt: "Clean fixture setup", slot: "gallery" },
  ];

  return `
  <!-- Gallery Section -->
  <section class="section" id="gallery">
    <div class="container">
      <div class="section-header reveal">
        <span class="badge">${eyebrow}</span>
        <h2>${headline}</h2>
        <p>${subheadline}</p>
      </div>
      <div class="gallery-grid">
        ${galleryImages
          .map(
            (img, idx) => `
        <div class="gallery-item reveal" tabindex="0" role="button" aria-label="View photo ${idx + 1}">
          ${renderStaticImageTag({
            src: img.url || img.localPath || "",
            alt: img.alt || "Completed service project",
            fallbackUrl: img.fallbackUrl,
            allFallbacks: img.allFallbacks,
            localSvg: img.localSvgFallback,
            width: 800,
            height: 600,
            loading: "lazy",
            className: "img-gallery",
          })}
        </div>`
          )
          .join("\n        ")}
      </div>
    </div>
  </section>`;
}
