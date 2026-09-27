/**
 * Google Maps Embed Engine (RankLocal / Altofox)
 * Generates responsive, keyless, secure Google Maps <iframe> embeds
 * with direct "Open in Google Maps" external navigation links.
 */

export interface GoogleMapsEmbedOptions {
  input?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  city?: string;
  state?: string;
  businessName?: string;
  className?: string;
  height?: number;
}

/**
 * Sanitizes and extracts query/embed URL from diverse Google Maps inputs:
 * - Full <iframe> HTML snippets
 * - Direct embed URLs
 * - Google Maps share links (maps.google.com, goo.gl, maps.app.goo.gl)
 * - Raw street addresses or city/state strings
 */
export function resolveGoogleMapsData(options: GoogleMapsEmbedOptions): {
  embedUrl: string;
  directMapUrl: string;
  displayAddress: string;
} {
  const { input = "", address, city, state, businessName = "Our Location" } = options;
  const rawInput = input.trim();

  // 1. If user pasted a full <iframe ...> snippet, extract the src
  if (rawInput.includes("<iframe") && rawInput.includes("src=")) {
    const srcMatch = rawInput.match(/src=["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      const extractedSrc = srcMatch[1];
      const display = address?.city
        ? `${address.street ? address.street + ", " : ""}${address.city}${address.state ? ", " + address.state : ""}`
        : city || businessName;
      return {
        embedUrl: extractedSrc,
        directMapUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(display)}`,
        displayAddress: display,
      };
    }
  }

  // 2. Determine target query from address fields if input is empty or just a URL
  const constructedAddress = [
    address?.street,
    address?.city || city,
    address?.state || state,
    address?.zip,
  ]
    .filter(Boolean)
    .join(", ");

  let query = "";
  let directMapUrl = "";

  if (rawInput && !rawInput.startsWith("http://") && !rawInput.startsWith("https://")) {
    // Raw address or place name
    query = rawInput;
    directMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  } else if (rawInput.startsWith("http://") || rawInput.startsWith("https://")) {
    directMapUrl = rawInput;

    // Check if URL has q= query parameter
    try {
      const parsedUrl = new URL(rawInput);
      const qParam = parsedUrl.searchParams.get("q") || parsedUrl.searchParams.get("query");
      if (qParam) {
        query = qParam;
      }
    } catch {
      // invalid URL structure
    }

    if (!query) {
      query = constructedAddress || (city ? `${city}${state ? `, ${state}` : ""}` : businessName);
    }
  } else {
    query = constructedAddress || (city ? `${city}${state ? `, ${state}` : ""}` : businessName);
    directMapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }

  const cleanQuery = query.trim() || "United States";
  const embedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(cleanQuery)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return {
    embedUrl,
    directMapUrl: directMapUrl || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cleanQuery)}`,
    displayAddress: cleanQuery,
  };
}

/**
 * Renders a responsive, accessible embedded Google Map component
 */
export function renderGoogleMapEmbed(options: GoogleMapsEmbedOptions): string {
  const { embedUrl, directMapUrl, displayAddress } = resolveGoogleMapsData(options);
  const height = options.height || 380;
  const businessName = options.businessName || "Local Service Provider";
  const containerClass = options.className || "ranklocal-map-container";

  return `
<!-- Embedded Google Maps -->
<div class="${containerClass}" style="position: relative; width: 100%; border-radius: var(--radius); overflow: hidden; box-shadow: var(--shadow-md); border: 1px solid var(--color-border); background: var(--color-surface, #F8FAFC);">
  <div style="position: relative; width: 100%; height: ${height}px; background: #e2e8f0;">
    <iframe
      src="${embedUrl}"
      width="100%"
      height="${height}"
      style="border: 0; display: block; width: 100%; height: 100%;"
      allowfullscreen=""
      loading="lazy"
      referrerpolicy="no-referrer-when-downgrade"
      title="${businessName} - Google Maps Location"
      aria-label="Interactive Google Map showing ${displayAddress}"
    ></iframe>
  </div>
  <div style="padding: 0.85rem 1.25rem; background: var(--color-surface, #FFFFFF); border-top: 1px solid var(--color-border); display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 0.75rem;">
    <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem; color: var(--color-text); font-weight: 500;">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--color-primary); flex-shrink: 0;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
      <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 480px;">${displayAddress}</span>
    </div>
    <a href="${directMapUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" style="font-size: 0.8125rem; padding: 0.4rem 0.9rem; text-decoration: none; display: inline-flex; align-items: center; gap: 0.35rem; font-weight: 600;">
      <span>Open in Google Maps</span>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
    </a>
  </div>
</div>`;
}
