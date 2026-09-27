import { SiteContentJSON } from "../../lib/generator/content-schema";
import { PageRegistry, RegistryPage, LinkStyle } from "../../lib/registry/page-registry";
import { renderFooterFromRegistry } from "../../lib/registry/navigation-renderer";
import { renderBrandLogo } from "../../lib/generator/logo-generator";
import { renderGoogleMapEmbed } from "../../lib/location/map-embed";

export function renderFooter(
  site: SiteContentJSON["site"],
  registry?: PageRegistry,
  currentPage?: RegistryPage,
  linkStyle: LinkStyle = "web"
): string {
  if (registry && currentPage) {
    return renderFooterFromRegistry({
      registry,
      currentPage,
      site,
      linkStyle,
    });
  }

  // Fallback if registry not passed
  const bizName = site.businessName || "Local Services";
  const tagline = site.tagline || "Professional, licensed, and guaranteed local services.";
  const phone = site.phone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const address = site.address || { city: "Local Area" };
  const isServiceArea = site.businessModel === "service-area";

  const addressDisplay = isServiceArea
    ? `Serving ${address.city || "local communities"} and surrounding areas`
    : [address.street, address.city, address.state, address.zip].filter(Boolean).join(", ") || `Serving ${address.city || "local communities"}`;

  const email = site.email || "";
  const areas = site.serviceAreas && site.serviceAreas.length > 0 ? site.serviceAreas : [];

  const mapInput = (site as any).googleMaps || (address.street ? `${address.street}, ${address.city || ""}, ${address.state || ""}` : address.city);

  return `
  <!-- Site Footer: 4-Column Layout -->
  <footer class="site-footer" id="site-footer">
    <div class="container">
      <div class="footer-grid">
        <!-- Col 1: About & Brand -->
        <div class="footer-col">
          ${renderBrandLogo({
            businessName: bizName,
            trade: (site as any).trade || (site as any).industry || (site as any).primaryService,
            logoUrl: (site as any).logoUrl || (site as any).logo,
            isFooter: true,
            href: null,
          })}
          <p>${tagline}</p>
          <div style="margin-top: 1.5rem;">
            <a href="tel:${cleanPhone}" style="color: var(--color-accent); font-weight: 800; font-size: 1.25rem;">${phone}</a>
          </div>
        </div>

        <!-- Col 2: Navigation Links -->
        <div class="footer-col">
          <h4>Quick Links</h4>
          <ul class="footer-links">
            <li><a href="index.html">Home</a></li>
            <li><a href="services.html">Services</a></li>
            <li><a href="service-areas.html">Service Areas</a></li>
            <li><a href="about.html">About Us</a></li>
            <li><a href="contact.html">Contact Us</a></li>
          </ul>
        </div>

        <!-- Col 3: Service Areas Covered -->
        <div class="footer-col">
          <h4>Service Areas</h4>
          <p style="color: #94A3B8; font-size: 0.85rem; margin-bottom: 0.75rem;">Serving ${address.city || "local communities"} and surrounding areas.</p>
          <ul class="footer-links">
            <li><a href="service-areas.html" style="color: var(--color-accent); font-weight: 700;">View Service Areas Hub →</a></li>
            ${areas.slice(0, 4).map((a) => `<li><a href="service-areas.html">${a}</a></li>`).join("\n            ")}
          </ul>
        </div>

        <!-- Col 4: Contact & Hours -->
        <div class="footer-col">
          <h4>Dispatch & Contact</h4>
          <p>${addressDisplay}</p>
          ${email ? `<p style="margin-top: 0.5rem;"><a href="mailto:${email}" style="color: #CBD5E1;">${email}</a></p>` : ""}
          <p style="margin-top: 0.75rem; font-size: 0.85rem; color: #94A3B8;">${site.hours?.[0] || "24/7 Priority Emergency Service"}</p>
        </div>
      </div>

      <!-- Footer Location Map: Sole Google Map on the Page -->
      ${
        mapInput
          ? `
      <div class="footer-map-container" style="margin-top: 2.5rem; margin-bottom: 2rem;">
        ${renderGoogleMapEmbed({
          input: mapInput,
          city: address.city,
          state: address.state,
          businessName: bizName,
          height: 320,
        })}
      </div>`
          : ""
      }

      <div class="footer-bottom">
        <p>© <span data-current-year>${new Date().getFullYear()}</span> ${bizName}. All rights reserved. Locally Owned & Operated.</p>
      </div>
    </div>
  </footer>`;
}
