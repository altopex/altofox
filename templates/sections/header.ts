import { SiteContentJSON } from "../../lib/generator/content-schema";
import { PageRegistry, RegistryPage, LinkStyle } from "../../lib/registry/page-registry";
import { renderHeaderFromRegistry } from "../../lib/registry/navigation-renderer";

export function renderHeader(
  site: SiteContentJSON["site"],
  variant: string = "standard",
  registry?: PageRegistry,
  currentPage?: RegistryPage,
  linkStyle: LinkStyle = "web"
): string {
  if (registry && currentPage) {
    return renderHeaderFromRegistry({
      registry,
      currentPage,
      site,
      variant: variant as "standard" | "centered",
      linkStyle,
    });
  }

  // Fallback if registry is not passed
  const phone = site.phone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const bizName = site.businessName || "Local Services";

  return `
  <!-- Site Header -->
  <header class="site-header ${variant === "centered" ? "header-centered" : ""}" id="site-header">
    <div class="header-container container">
      <a href="index.html" class="brand-logo" aria-label="${bizName} Home">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary);"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
        <span>${bizName}</span>
      </a>

      <!-- Desktop Navigation -->
      <nav class="main-nav" aria-label="Main Navigation">
        <ul class="nav-list">
          <li><a href="index.html" class="nav-link active">Home</a></li>
          <li><a href="services.html" class="nav-link">Services</a></li>
          <li><a href="service-areas.html" class="nav-link">Service Areas</a></li>
          <li><a href="about.html" class="nav-link">About</a></li>
          <li><a href="contact.html" class="nav-link">Contact</a></li>
        </ul>
      </nav>

      <!-- Desktop Phone CTA -->
      <div class="header-cta-desktop">
        <a href="tel:${cleanPhone}" class="btn btn-primary">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
          <span>${phone}</span>
        </a>
      </div>

      <!-- Mobile Hamburger Toggle -->
      <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false" aria-controls="mobile-drawer">
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      </button>
    </div>

    <!-- Mobile Slide-in Drawer -->
    <div class="mobile-drawer" id="mobile-drawer" aria-label="Mobile Navigation" role="dialog" aria-modal="true">
      <ul class="mobile-nav-list">
        <li><a href="index.html" class="mobile-nav-link">Home</a></li>
        <li><a href="services.html" class="mobile-nav-link">Services</a></li>
        <li><a href="service-areas.html" class="mobile-nav-link">Service Areas</a></li>
        <li><a href="about.html" class="mobile-nav-link">About</a></li>
        <li><a href="contact.html" class="mobile-nav-link">Contact</a></li>
      </ul>
      <div style="margin-top: auto; padding-top: 1.5rem; border-top: 1px solid var(--color-border);">
        <a href="tel:${cleanPhone}" class="btn btn-primary" style="width: 100%; margin-bottom: 0.75rem;">Call Now: ${phone}</a>
        <a href="contact.html" class="btn btn-outline" style="width: 100%;">Get a Free Quote</a>
      </div>
    </div>
  </header>`;
}
