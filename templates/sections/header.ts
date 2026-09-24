import { SiteContentJSON } from "../../lib/generator/content-schema";

export function renderHeader(site: SiteContentJSON["site"], variant: string = "standard"): string {
  const phone = site.phone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const bizName = site.businessName || "Local Services";

  const renderDesktopNavItems = () => {
    return site.nav
      .map((item) => {
        const href = item.slug.endsWith(".html") || item.slug.startsWith("#") ? item.slug : `${item.slug}.html`;
        if (item.children && item.children.length > 0) {
          return `
          <li class="nav-dropdown">
            <a href="${href}" class="nav-link">${item.label} ▾</a>
            <ul class="dropdown-menu">
              ${item.children
                .map((child) => {
                  const childHref = child.slug.endsWith(".html") ? child.slug : `${child.slug}.html`;
                  return `<li><a href="${childHref}">${child.label}</a></li>`;
                })
                .join("\n              ")}
            </ul>
          </li>`;
        }
        return `<li><a href="${href}" class="nav-link">${item.label}</a></li>`;
      })
      .join("\n          ");
  };

  const renderMobileNavItems = () => {
    return site.nav
      .map((item) => {
        const href = item.slug.endsWith(".html") || item.slug.startsWith("#") ? item.slug : `${item.slug}.html`;
        if (item.children && item.children.length > 0) {
          return `
          <li>
            <a href="${href}" class="mobile-nav-link">${item.label}</a>
            <ul class="mobile-nav-sublist">
              ${item.children
                .map((child) => {
                  const childHref = child.slug.endsWith(".html") ? child.slug : `${child.slug}.html`;
                  return `<li><a href="${childHref}" class="mobile-nav-sublink">${child.label}</a></li>`;
                })
                .join("\n              ")}
            </ul>
          </li>`;
        }
        return `<li><a href="${href}" class="mobile-nav-link">${item.label}</a></li>`;
      })
      .join("\n          ");
  };

  const isCentered = variant === "centered";

  return `
  <!-- Site Header -->
  <header class="site-header ${isCentered ? "header-centered" : ""}" id="site-header">
    <div class="header-container container">
      <a href="index.html" class="brand-logo" aria-label="${bizName} Home">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary);"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
        <span>${bizName}</span>
      </a>

      <!-- Desktop Navigation -->
      <nav class="main-nav" aria-label="Main Navigation">
        <ul class="nav-list">
          ${renderDesktopNavItems()}
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
      <button class="nav-toggle" id="nav-toggle" aria-label="Toggle navigation menu" aria-expanded="false">
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
        <span class="hamburger-bar"></span>
      </button>
    </div>

    <!-- Mobile Slide-in Drawer -->
    <div class="mobile-drawer" id="mobile-drawer" aria-label="Mobile Navigation">
      <ul class="mobile-nav-list">
        ${renderMobileNavItems()}
      </ul>
      <div style="margin-top: auto; padding-top: 1.5rem; border-top: 1px solid var(--color-border);">
        <a href="tel:${cleanPhone}" class="btn btn-primary" style="width: 100%; margin-bottom: 0.75rem;">Call Now: ${phone}</a>
        <a href="contact.html" class="btn btn-outline" style="width: 100%;">Get a Free Quote</a>
      </div>
    </div>
  </header>`;
}
