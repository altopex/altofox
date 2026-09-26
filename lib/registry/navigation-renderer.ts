import { PageRegistry, RegistryPage, linkTo, LinkStyle, assetPath } from "./page-registry";
import { SiteInfoJSON } from "../generator/content-schema";

export interface HeaderRenderOptions {
  registry: PageRegistry;
  currentPage: RegistryPage;
  site: SiteInfoJSON;
  linkStyle?: LinkStyle;
  variant?: "standard" | "centered";
}

/**
 * Renders the responsive Header + Navigation strictly from the Master Page Registry
 */
export function renderHeaderFromRegistry(options: HeaderRenderOptions): string {
  const { registry, currentPage, site, linkStyle = "web", variant = "standard" } = options;
  const phone = site.phone || "(555) 123-4567";
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const bizName = site.businessName || "Local Services";

  const homePage = registry.getByType("home")[0];
  const servicesHub = registry.getByType("services hub")[0];
  const servicePages = registry.getByType("service");
  const areasHub = registry.getByType("areas hub")[0];
  const locationPages = registry.getByType("location");
  const blogHub = registry.getByType("blog hub")[0];
  const blogPages = registry.getByType("blog");
  const aboutPage = registry.getByType("about").find((p) => p.id === "page-about") || registry.getByType("about")[0];
  const contactPage = registry.getByType("contact")[0];

  const homeHref = homePage ? linkTo(currentPage, homePage, linkStyle) : "index.html";

  // Build Desktop Nav Items
  const navItems: string[] = [];

  // 1. Home
  navItems.push(`<li><a href="${homeHref}" class="nav-link ${currentPage.id === "home" ? "active" : ""}">Home</a></li>`);

  // 2. Services Dropdown
  if (servicePages.length > 0 || servicesHub) {
    const servicesMainHref = servicesHub ? linkTo(currentPage, servicesHub, linkStyle) : (servicePages[0] ? linkTo(currentPage, servicePages[0], linkStyle) : "#");
    const subItems = servicePages.map((s) => `<li><a href="${linkTo(currentPage, s, linkStyle)}">${s.navLabel}</a></li>`);
    if (servicesHub && servicePages.length > 0) {
      subItems.unshift(`<li><a href="${servicesMainHref}" style="font-weight: 700; border-bottom: 1px solid var(--color-border); padding-bottom: 0.5rem; margin-bottom: 0.25rem;">All Services →</a></li>`);
    }

    if (subItems.length > 0) {
      navItems.push(`
      <li class="nav-dropdown">
        <a href="${servicesMainHref}" class="nav-link ${currentPage.pageType === "service" || currentPage.pageType === "services hub" ? "active" : ""}">Services ▾</a>
        <ul class="dropdown-menu">
          ${subItems.join("\n          ")}
        </ul>
      </li>`);
    } else if (servicesHub) {
      navItems.push(`<li><a href="${servicesMainHref}" class="nav-link">Services</a></li>`);
    }
  }

  // 3. Areas Dropdown
  if (locationPages.length > 0 || areasHub) {
    const areasMainHref = areasHub ? linkTo(currentPage, areasHub, linkStyle) : (locationPages[0] ? linkTo(currentPage, locationPages[0], linkStyle) : "#");
    const topAreas = locationPages.slice(0, 8);
    const subItems = topAreas.map((l) => `<li><a href="${linkTo(currentPage, l, linkStyle)}">${l.navLabel}</a></li>`);
    if (areasHub) {
      subItems.push(`<li><a href="${areasMainHref}" style="font-weight: 700; border-top: 1px solid var(--color-border); padding-top: 0.5rem; margin-top: 0.25rem;">View All Areas →</a></li>`);
    }

    navItems.push(`
    <li class="nav-dropdown">
      <a href="${areasMainHref}" class="nav-link ${currentPage.pageType === "location" || currentPage.pageType === "areas hub" ? "active" : ""}">Areas ▾</a>
      <ul class="dropdown-menu">
        ${subItems.join("\n        ")}
      </ul>
    </li>`);
  }

  // 4. Blog (if any)
  if (blogPages.length > 0 || blogHub) {
    const blogHref = blogHub ? linkTo(currentPage, blogHub, linkStyle) : (blogPages[0] ? linkTo(currentPage, blogPages[0], linkStyle) : "#");
    navItems.push(`<li><a href="${blogHref}" class="nav-link ${currentPage.pageType === "blog" || currentPage.pageType === "blog hub" ? "active" : ""}">Blog</a></li>`);
  }

  // 5. About
  if (aboutPage) {
    navItems.push(`<li><a href="${linkTo(currentPage, aboutPage, linkStyle)}" class="nav-link ${currentPage.id === aboutPage.id ? "active" : ""}">About</a></li>`);
  }

  // 5.5 FAQ
  const faqPage = registry.getById("page-faq") || registry.getByPath("faq.html");
  if (faqPage) {
    navItems.push(`<li><a href="${linkTo(currentPage, faqPage, linkStyle)}" class="nav-link ${currentPage.id === faqPage.id ? "active" : ""}">FAQ</a></li>`);
  }

  // 6. Contact
  if (contactPage) {
    navItems.push(`<li><a href="${linkTo(currentPage, contactPage, linkStyle)}" class="nav-link ${currentPage.id === contactPage.id ? "active" : ""}">Contact</a></li>`);
  }

  // Mobile Nav Items
  const mobileNavItems: string[] = [];
  mobileNavItems.push(`<li><a href="${homeHref}" class="mobile-nav-link">Home</a></li>`);

  if (servicePages.length > 0 || servicesHub) {
    const servicesMainHref = servicesHub ? linkTo(currentPage, servicesHub, linkStyle) : "#";
    const subLinks = servicePages.map((s) => `<li><a href="${linkTo(currentPage, s, linkStyle)}" class="mobile-nav-sublink">${s.navLabel}</a></li>`).join("\n          ");
    mobileNavItems.push(`
    <li>
      <a href="${servicesMainHref}" class="mobile-nav-link">Services</a>
      <ul class="mobile-nav-sublist">
        ${subLinks}
      </ul>
    </li>`);
  }

  if (locationPages.length > 0 || areasHub) {
    const areasMainHref = areasHub ? linkTo(currentPage, areasHub, linkStyle) : "#";
    const subLinks = locationPages.slice(0, 6).map((l) => `<li><a href="${linkTo(currentPage, l, linkStyle)}" class="mobile-nav-sublink">${l.navLabel}</a></li>`).join("\n          ");
    mobileNavItems.push(`
    <li>
      <a href="${areasMainHref}" class="mobile-nav-link">Areas We Serve</a>
      <ul class="mobile-nav-sublist">
        ${subLinks}
        ${areasHub ? `<li><a href="${areasMainHref}" class="mobile-nav-sublink" style="font-weight: 700;">All Service Areas →</a></li>` : ""}
      </ul>
    </li>`);
  }

  if (blogPages.length > 0 || blogHub) {
    const blogHref = blogHub ? linkTo(currentPage, blogHub, linkStyle) : "#";
    mobileNavItems.push(`<li><a href="${blogHref}" class="mobile-nav-link">Blog</a></li>`);
  }

  if (aboutPage) {
    mobileNavItems.push(`<li><a href="${linkTo(currentPage, aboutPage, linkStyle)}" class="mobile-nav-link">About</a></li>`);
  }

  if (faqPage) {
    mobileNavItems.push(`<li><a href="${linkTo(currentPage, faqPage, linkStyle)}" class="mobile-nav-link">FAQ</a></li>`);
  }

  if (contactPage) {
    mobileNavItems.push(`<li><a href="${linkTo(currentPage, contactPage, linkStyle)}" class="mobile-nav-link">Contact</a></li>`);
  }

  const contactHref = contactPage ? linkTo(currentPage, contactPage, linkStyle) : "#";

  return `
  <!-- Site Header -->
  <header class="site-header ${variant === "centered" ? "header-centered" : ""}" id="site-header">
    <div class="header-container container">
      <a href="${homeHref}" class="brand-logo" aria-label="${bizName} Home">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary);"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
        <span>${bizName}</span>
      </a>

      <!-- Desktop Navigation -->
      <nav class="main-nav" aria-label="Main Navigation">
        <ul class="nav-list">
          ${navItems.join("\n          ")}
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
        ${mobileNavItems.join("\n        ")}
      </ul>
      <div style="margin-top: auto; padding-top: 1.5rem; border-top: 1px solid var(--color-border);">
        <a href="tel:${cleanPhone}" class="btn btn-primary" style="width: 100%; margin-bottom: 0.75rem;">Call Now: ${phone}</a>
        <a href="${contactHref}" class="btn btn-outline" style="width: 100%;">Get a Free Quote</a>
      </div>
    </div>
  </header>`;
}

export interface FooterRenderOptions {
  registry: PageRegistry;
  currentPage: RegistryPage;
  site: SiteInfoJSON;
  linkStyle?: LinkStyle;
}

/**
 * Renders the 4-Column Footer strictly from the Master Page Registry
 */
export function renderFooterFromRegistry(options: FooterRenderOptions): string {
  const { registry, currentPage, site, linkStyle = "web" } = options;
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

  // Pages from registry
  const homePage = registry.getByType("home")[0];
  const aboutPage = registry.getByType("about").find((p) => p.id === "page-about") || registry.getByType("about")[0];
  const contactPage = registry.getByType("contact")[0];
  const reviewsPage = registry.getByPath("reviews.html") || registry.getById("page-reviews");
  const servicesHub = registry.getByType("services hub")[0];
  const servicePages = registry.getByType("service");
  const areasHub = registry.getByType("areas hub")[0];
  const locationPages = registry.getByType("location");
  const faqPage = registry.getById("page-faq") || registry.getByPath("faq.html");

  // Quick Links
  const quickLinks: { label: string; href: string }[] = [];
  if (homePage) quickLinks.push({ label: "Home", href: linkTo(currentPage, homePage, linkStyle) });
  if (aboutPage) quickLinks.push({ label: "About Us", href: linkTo(currentPage, aboutPage, linkStyle) });
  if (servicesHub) quickLinks.push({ label: "All Services", href: linkTo(currentPage, servicesHub, linkStyle) });
  if (areasHub) quickLinks.push({ label: "Service Areas", href: linkTo(currentPage, areasHub, linkStyle) });
  if (reviewsPage) quickLinks.push({ label: "Reviews", href: linkTo(currentPage, reviewsPage, linkStyle) });
  if (faqPage) quickLinks.push({ label: "FAQ", href: linkTo(currentPage, faqPage, linkStyle) });
  if (contactPage) quickLinks.push({ label: "Contact Us", href: linkTo(currentPage, contactPage, linkStyle) });

  // Services Links
  const displayedServices = servicePages.slice(0, 6);

  // Areas Links
  const displayedAreas = locationPages.slice(0, 5);

  return `
  <!-- Site Footer: 4-Column Layout -->
  <footer class="site-footer" id="site-footer">
    <div class="container">
      <div class="footer-grid">
        <!-- Col 1: Brand & Phone -->
        <div class="footer-col">
          <div class="brand-logo" style="color: #FFFFFF; margin-bottom: 1rem;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--color-accent);"><path d="M12 2L2 7l10 5 10-5-10-5z"></path><path d="M2 17l10 5 10-5"></path><path d="M2 12l10 5 10-5"></path></svg>
            <span>${bizName}</span>
          </div>
          <p>${tagline}</p>
          <div style="margin-top: 1.5rem;">
            <a href="tel:${cleanPhone}" style="color: var(--color-accent); font-weight: 800; font-size: 1.25rem;">${phone}</a>
          </div>
        </div>

        <!-- Col 2: Quick Links -->
        <div class="footer-col">
          <h4>Quick Links</h4>
          <ul class="footer-links">
            ${quickLinks.map((q) => `<li><a href="${q.href}">${q.label}</a></li>`).join("\n            ")}
          </ul>
        </div>

        <!-- Col 3: Services / Areas -->
        <div class="footer-col">
          ${displayedServices.length > 0 ? `
          <h4>Our Services</h4>
          <ul class="footer-links">
            ${displayedServices.map((s) => `<li><a href="${linkTo(currentPage, s, linkStyle)}">${s.navLabel}</a></li>`).join("\n            ")}
            ${servicesHub ? `<li><a href="${linkTo(currentPage, servicesHub, linkStyle)}" style="color: var(--color-accent); font-weight: 700;">View All Services →</a></li>` : ""}
          </ul>
          ` : `
          <h4>Service Areas</h4>
          <ul class="footer-links">
            ${displayedAreas.map((a) => `<li><a href="${linkTo(currentPage, a, linkStyle)}">${a.navLabel}</a></li>`).join("\n            ")}
            ${areasHub ? `<li><a href="${linkTo(currentPage, areasHub, linkStyle)}" style="color: var(--color-accent); font-weight: 700;">View All Areas →</a></li>` : ""}
          </ul>
          `}
        </div>

        <!-- Col 4: Contact & Hours -->
        <div class="footer-col">
          <h4>Dispatch & Contact</h4>
          <p>${addressDisplay}</p>
          ${email ? `<p style="margin-top: 0.5rem;"><a href="mailto:${email}" style="color: #CBD5E1;">${email}</a></p>` : ""}
          <p style="margin-top: 0.75rem; font-size: 0.85rem; color: #94A3B8;">${site.hours?.[0] || "24/7 Priority Emergency Service"}</p>
          ${areasHub && displayedServices.length > 0 ? `
          <div style="margin-top: 1rem;">
            <a href="${linkTo(currentPage, areasHub, linkStyle)}" style="color: var(--color-accent); font-size: 0.9rem; font-weight: 600;">Explore Service Areas Hub →</a>
          </div>` : ""}
        </div>
      </div>

      <div class="footer-bottom">
        <p>© <span data-current-year>${new Date().getFullYear()}</span> ${bizName}. All rights reserved. Locally Owned & Operated.</p>
      </div>
    </div>
  </footer>`;
}
