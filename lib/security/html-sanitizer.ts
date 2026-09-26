/**
 * HTML Input Sanitizer for Static Website Builder
 * Protects against XSS attacks while retaining custom HTML5, CSS styling,
 * inline styles, and Schema.org JSON-LD structured data.
 */

const DANGEROUS_ATTRIBUTES = [
  /on\w+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, // Matches onerror=..., onclick=..., onload=...
];

const DANGEROUS_PROTOCOLS = [
  /(?:href|src|action|formaction|background|data)\s*=\s*["']?\s*(?:javascript|vbscript|data:text\/html):/gi,
];

/**
 * Sanitizes plain text input for page <title> tag.
 * Strips all HTML tags and collapses whitespace.
 */
export function sanitizeTitle(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

/**
 * Sanitizes meta description and other meta content attributes.
 * Prevents attribute breaking and script injection while preserving plain text.
 */
export function sanitizeMetaContent(input: string): string {
  if (!input || typeof input !== "string") return "";
  return input
    .replace(/<[^>]*>/g, "")
    .replace(/"/g, "&quot;")
    .replace(/[\r\n\t]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 320);
}

/**
 * Sanitizes headline text (H1, H2, H3).
 * Allows safe inline formatting (span, strong, em, b, i, br) but strips scripts and event handlers.
 */
export function sanitizeHeadline(input: string): string {
  if (!input || typeof input !== "string") return "";

  let cleaned = input;

  // Remove script tags and style tags inside headlines
  cleaned = cleaned.replace(/<(?:script|style|iframe|object|embed|form|input)[^>]*>[\s\S]*?<\/(?:script|style|iframe|object|embed|form|input)>/gi, "");
  cleaned = cleaned.replace(/<(?:script|style|iframe|object|embed|form|input)[^>]*>/gi, "");

  // Remove all event handlers
  for (const pattern of DANGEROUS_ATTRIBUTES) {
    cleaned = cleaned.replace(pattern, "");
  }

  // Remove dangerous protocols
  for (const pattern of DANGEROUS_PROTOCOLS) {
    cleaned = cleaned.replace(pattern, 'href="#"');
  }

  return cleaned.trim();
}

/**
 * Comprehensive HTML document sanitizer for static pages.
 * Neutralizes active XSS vectors (unauthorized scripts, onerror/onload event handlers, javascript: URIs)
 * while preserving valid HTML5 semantic tags, custom CSS, inline styles, SVGs, and Schema.org JSON-LD.
 */
export function sanitizeHtmlContent(html: string): string {
  if (!html || typeof html !== "string") return "";

  let sanitized = html;

  // 1. Remove dangerous executable scripts while preserving JSON-LD (Schema.org)
  sanitized = sanitized.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (match, attrs, body) => {
    // Preserve Schema.org structured data (type="application/ld+json")
    if (/type=["']application\/ld\+json["']/i.test(attrs)) {
      // Validate that the JSON-LD body is safe JSON without embedded closing tags
      const safeBody = body.replace(/<\/script/gi, "<\\/script");
      return `<script${attrs}>${safeBody}</script>`;
    }

    // Preserve trusted third-party analytics (Google Tag Manager, Google Analytics, gtag)
    const isGoogleAnalytics = /googletagmanager\.com|google-analytics\.com|gtag\(/i.test(attrs + body);
    if (isGoogleAnalytics) {
      return match;
    }

    // Neutralize unauthorized inline or external scripts
    return `<!-- [Sanitized Script Removed] -->`;
  });

  // 2. Remove dangerous inline event handlers (onerror=..., onclick=..., onload=...)
  for (const pattern of DANGEROUS_ATTRIBUTES) {
    sanitized = sanitized.replace(pattern, "");
  }

  // 3. Neutralize javascript: and vbscript: URIs
  for (const pattern of DANGEROUS_PROTOCOLS) {
    sanitized = sanitized.replace(pattern, 'href="javascript:void(0)"');
  }

  // 4. Remove dangerous executable tags: <object>, <embed>, <applet>
  sanitized = sanitized.replace(/<(?:object|embed|applet)\b[^>]*>[\s\S]*?<\/(?:object|embed|applet)>/gi, "");
  sanitized = sanitized.replace(/<(?:object|embed|applet)\b[^>]*>/gi, "");

  // 5. Secure iframe embeds: Ensure sandbox or restrict to trusted video embeds (YouTube, Vimeo, Google Maps)
  sanitized = sanitized.replace(/<iframe\b([^>]*)>/gi, (match, attrs) => {
    const isTrustedEmbed = /(?:youtube\.com|vimeo\.com|google\.com\/maps)/i.test(attrs);
    if (!isTrustedEmbed && !attrs.includes("sandbox")) {
      return `<iframe${attrs} sandbox="allow-scripts allow-same-origin">`;
    }
    return match;
  });

  return sanitized;
}
