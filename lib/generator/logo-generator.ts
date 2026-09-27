/**
 * AI & Trade-Calibrated Vector Logo Generator (RankLocal / Altofox)
 * Generates lightweight, crisp vector SVG logo marks calibrated to the trade/industry
 * with bulletproof responsive sizing and typography truncation.
 */

export interface BrandLogoOptions {
  businessName: string;
  trade?: string;
  logoUrl?: string;
  href?: string | null;
  isFooter?: boolean;
  className?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Normalizes trade/industry string to an icon key
 */
export function detectTradeIconKey(tradeOrBiz?: string): string {
  if (!tradeOrBiz) return "general";
  const s = tradeOrBiz.toLowerCase();

  if (s.includes("plumb") || s.includes("pipe") || s.includes("drain") || s.includes("water heater") || s.includes("sewer")) {
    return "plumbing";
  }
  if (s.includes("hvac") || s.includes("air condition") || s.includes("cooling") || s.includes("heating") || s.includes("furnace")) {
    return "hvac";
  }
  if (s.includes("electr") || s.includes("wire") || s.includes("solar") || s.includes("power") || s.includes("lighting")) {
    return "electrical";
  }
  if (s.includes("roof") || s.includes("gutter") || s.includes("shingle") || s.includes("siding")) {
    return "roofing";
  }
  if (s.includes("clean") || s.includes("maid") || s.includes("janitor") || s.includes("carpet") || s.includes("wash") || s.includes("pressure")) {
    return "cleaning";
  }
  if (s.includes("landscap") || s.includes("lawn") || s.includes("tree") || s.includes("yard") || s.includes("garden")) {
    return "landscaping";
  }
  if (s.includes("law") || s.includes("legal") || s.includes("attorney") || s.includes("lawyer")) {
    return "legal";
  }
  if (s.includes("dent") || s.includes("orthodont") || s.includes("smile")) {
    return "dental";
  }
  if (s.includes("auto") || s.includes("car") || s.includes("mechanic") || s.includes("tire") || s.includes("towing") || s.includes("transmission") || s.includes("collision")) {
    return "auto";
  }
  if (s.includes("pest") || s.includes("termite") || s.includes("bug") || s.includes("rodent") || s.includes("exterminat")) {
    return "pest";
  }
  if (s.includes("paint") || s.includes("drywall") || s.includes("coating")) {
    return "painting";
  }
  if (s.includes("mov") || s.includes("haul") || s.includes("storage")) {
    return "moving";
  }
  if (s.includes("construct") || s.includes("remodel") || s.includes("builder") || s.includes("contract") || s.includes("carpenter")) {
    return "construction";
  }

  return "general";
}

/**
 * Returns a sharp, self-contained SVG emblem for the specified trade
 */
export function getTradeSvgEmblem(tradeKey: string, isFooter: boolean = false): string {
  const primaryColor = isFooter ? "var(--color-accent, #38BDF8)" : "var(--color-primary, #2563EB)";
  const secondaryColor = isFooter ? "#FFFFFF" : "var(--color-secondary, #0F172A)";

  switch (tradeKey) {
    case "plumbing":
      return `
      <svg class="brand-svg" width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="36" height="36" rx="8" fill="${primaryColor}" fill-opacity="0.12"/>
        <path d="M18 7C14.5 12 11 15.5 11 20C11 23.866 14.134 27 18 27C21.866 27 25 23.866 25 20C25 15.5 21.5 12 18 7Z" fill="${primaryColor}"/>
        <path d="M15.5 19.5C15.5 17.5 17 15.5 18 14C19 15.5 20.5 17.5 20.5 19.5C20.5 20.88 19.38 22 18 22C16.62 22 15.5 20.88 15.5 19.5Z" fill="#FFFFFF"/>
        <path d="M8 29H28" stroke="${primaryColor}" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;

    case "hvac":
      return `
      <svg class="brand-svg" width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="36" height="36" rx="8" fill="${primaryColor}" fill-opacity="0.12"/>
        <path d="M18 8V28M8 18H28M11 11L25 25M25 11L11 25" stroke="${primaryColor}" stroke-width="2.4" stroke-linecap="round"/>
        <circle cx="18" cy="18" r="4" fill="${primaryColor}"/>
        <circle cx="18" cy="18" r="2" fill="#FFFFFF"/>
      </svg>`;

    case "electrical":
      return `
      <svg class="brand-svg" width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="36" height="36" rx="8" fill="${primaryColor}" fill-opacity="0.12"/>
        <path d="M19.5 7L10.5 19H17.5L16.5 29L25.5 17H18.5L19.5 7Z" fill="${primaryColor}" stroke="${secondaryColor}" stroke-width="1.2" stroke-linejoin="round"/>
      </svg>`;

    case "roofing":
      return `
      <svg class="brand-svg" width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="36" height="36" rx="8" fill="${primaryColor}" fill-opacity="0.12"/>
        <path d="M7 21L18 10L29 21" stroke="${primaryColor}" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M11 17.5V26H25V17.5" stroke="${secondaryColor}" stroke-width="2" stroke-linecap="round"/>
        <path d="M23 12V8H26V15" stroke="${primaryColor}" stroke-width="2" stroke-linecap="round"/>
      </svg>`;

    case "cleaning":
      return `
      <svg class="brand-svg" width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="36" height="36" rx="8" fill="${primaryColor}" fill-opacity="0.12"/>
        <path d="M18 8L20 14L26 16L20 18L18 24L16 18L10 16L16 14L18 8Z" fill="${primaryColor}"/>
        <circle cx="26" cy="10" r="2.5" fill="${secondaryColor}"/>
        <circle cx="10" cy="24" r="2" fill="${secondaryColor}"/>
      </svg>`;

    case "landscaping":
      return `
      <svg class="brand-svg" width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="36" height="36" rx="8" fill="${primaryColor}" fill-opacity="0.12"/>
        <path d="M18 28V15M18 15C18 15 13 13 13 8C18 8 20 11 20 11M18 15C18 15 23 13 23 8C18 8 16 11 16 11" stroke="${primaryColor}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M9 28C14 26 22 26 27 28" stroke="${secondaryColor}" stroke-width="2" stroke-linecap="round"/>
      </svg>`;

    case "legal":
      return `
      <svg class="brand-svg" width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="36" height="36" rx="8" fill="${primaryColor}" fill-opacity="0.12"/>
        <path d="M18 8V27M18 11L11 15L18 11ZM18 11L25 15L18 11Z" stroke="${primaryColor}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
        <path d="M11 15L8 21H14L11 15ZM25 15L22 21H28L25 15Z" stroke="${secondaryColor}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M13 27H23" stroke="${primaryColor}" stroke-width="2.5" stroke-linecap="round"/>
      </svg>`;

    case "dental":
      return `
      <svg class="brand-svg" width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="36" height="36" rx="8" fill="${primaryColor}" fill-opacity="0.12"/>
        <path d="M12 11C12 8.5 14.5 8 18 8C21.5 8 24 8.5 24 11C24 14.5 23 18 22 24C21.5 26.5 19.5 27 18.5 24C18 22.5 17.5 22.5 17 24C16 27 14 26.5 13.5 24C12.5 18 12 14.5 12 11Z" fill="${primaryColor}" stroke="${secondaryColor}" stroke-width="1.2"/>
        <circle cx="15.5" cy="13" r="1.5" fill="#FFFFFF"/>
      </svg>`;

    case "auto":
      return `
      <svg class="brand-svg" width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="36" height="36" rx="8" fill="${primaryColor}" fill-opacity="0.12"/>
        <path d="M8 21L11 14H25L28 21V25H8V21Z" stroke="${primaryColor}" stroke-width="2.2" stroke-linejoin="round"/>
        <circle cx="13" cy="24" r="2.5" fill="${secondaryColor}"/>
        <circle cx="23" cy="24" r="2.5" fill="${secondaryColor}"/>
        <path d="M13 18H23" stroke="${primaryColor}" stroke-width="1.5"/>
      </svg>`;

    case "pest":
      return `
      <svg class="brand-svg" width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="36" height="36" rx="8" fill="${primaryColor}" fill-opacity="0.12"/>
        <path d="M18 8L26 12V18C26 23.5 22.5 26.5 18 28C13.5 26.5 10 23.5 10 18V12L18 8Z" fill="${primaryColor}" fill-opacity="0.2" stroke="${primaryColor}" stroke-width="2"/>
        <circle cx="18" cy="18" r="4" fill="${secondaryColor}"/>
        <path d="M18 11V15M18 21V25M11 18H15M21 18H25" stroke="${primaryColor}" stroke-width="1.8" stroke-linecap="round"/>
      </svg>`;

    case "painting":
      return `
      <svg class="brand-svg" width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="36" height="36" rx="8" fill="${primaryColor}" fill-opacity="0.12"/>
        <rect x="10" y="10" width="16" height="7" rx="2" fill="${primaryColor}"/>
        <path d="M18 17V22H15V27H17V24H19V27H21V22H18" fill="${secondaryColor}"/>
      </svg>`;

    case "moving":
      return `
      <svg class="brand-svg" width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="36" height="36" rx="8" fill="${primaryColor}" fill-opacity="0.12"/>
        <path d="M9 13L18 8L27 13V23L18 28L9 23V13Z" stroke="${primaryColor}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M18 8V28M9 13L18 18L27 13" stroke="${secondaryColor}" stroke-width="1.8"/>
      </svg>`;

    case "construction":
      return `
      <svg class="brand-svg" width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="36" height="36" rx="8" fill="${primaryColor}" fill-opacity="0.12"/>
        <path d="M8 26L18 10L28 26H8Z" stroke="${primaryColor}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M14 26V20H22V26" stroke="${secondaryColor}" stroke-width="2"/>
        <path d="M18 10V16" stroke="${primaryColor}" stroke-width="2"/>
      </svg>`;

    default: // General Pro
      return `
      <svg class="brand-svg" width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect width="36" height="36" rx="8" fill="${primaryColor}" fill-opacity="0.12"/>
        <path d="M18 8L27 13.5V22.5L18 28L9 22.5V13.5L18 8Z" stroke="${primaryColor}" stroke-width="2.4" stroke-linejoin="round"/>
        <circle cx="18" cy="18" r="3.5" fill="${primaryColor}"/>
      </svg>`;
  }
}

/**
 * Renders the complete brand logo HTML element with responsive image/svg support
 */
export function renderBrandLogo(options: BrandLogoOptions): string {
  const { businessName, trade, logoUrl, href = "index.html", isFooter = false, className = "brand-logo" } = options;
  const safeName = escapeHtml(businessName || "Local Services");
  const tradeKey = detectTradeIconKey(trade || businessName);
  const tradeSvg = getTradeSvgEmblem(tradeKey, isFooter);

  let visualElement = "";

  if (logoUrl && logoUrl.trim()) {
    const safeLogo = escapeHtml(logoUrl.trim());
    visualElement = `
      <img src="${safeLogo}" alt="${safeName} Logo" class="brand-img" width="140" height="36" loading="eager" onerror="this.style.display='none'; this.nextElementSibling.style.display='inline-flex';" />
      <span class="brand-icon brand-icon-fallback" style="display:none;">${tradeSvg}</span>`;
  } else {
    visualElement = `<span class="brand-icon">${tradeSvg}</span>`;
  }

  const textColor = isFooter ? "#FFFFFF" : "var(--color-secondary, #0F172A)";

  if (href) {
    return `
      <a href="${escapeHtml(href)}" class="${className}" aria-label="${safeName} Home" style="color: ${textColor};">
        ${visualElement}
        <span class="brand-text">${safeName}</span>
      </a>`;
  }

  return `
    <div class="${className}" style="color: ${textColor};">
      ${visualElement}
      <span class="brand-text">${safeName}</span>
    </div>`;
}
