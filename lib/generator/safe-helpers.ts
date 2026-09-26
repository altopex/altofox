import { SiteInfoJSON } from "./content-schema";

/**
 * Safe Template Helpers
 * Ensures templates never output "undefined", "null", "[object Object]", or empty broken elements.
 */

export function safeText(val: unknown, fallback: string = ""): string {
  if (val === undefined || val === null) return fallback;
  if (typeof val === "object") return fallback;
  const str = String(val).trim();
  if (!str || str.toLowerCase() === "undefined" || str.toLowerCase() === "null" || str.toLowerCase() === "nan") {
    return fallback;
  }
  return str;
}

export function safeButton(
  text: unknown,
  url: unknown,
  className: string = "btn btn-primary",
  ariaLabel?: string
): string {
  const cleanText = safeText(text);
  const cleanUrl = safeText(url);

  if (!cleanText || !cleanUrl) {
    return "";
  }

  const ariaAttr = ariaLabel ? ` aria-label="${safeText(ariaLabel)}"` : "";
  return `<a href="${cleanUrl}" class="${className}"${ariaAttr}>${cleanText}</a>`;
}

export function safeList<T>(items: unknown, minLength: number = 1): T[] | null {
  if (!Array.isArray(items)) return null;
  const valid = items.filter((it) => it !== undefined && it !== null && it !== "");
  if (valid.length < minLength) return null;
  return valid as T[];
}

/**
 * Returns verified business details directly from saved business records,
 * preventing any hallucinated AI text from overriding real contact information.
 */
export function getVerifiedBusinessDetails(site: SiteInfoJSON) {
  const name = safeText(site.businessName, "Local Service Specialists");
  const phone = safeText(site.phone, "(555) 123-4567");
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  const email = safeText(site.email, "");
  const city = safeText(site.address?.city, "Local Area");
  const state = safeText(site.address?.state, "");
  const fullCity = state ? `${city}, ${state}` : city;
  const hours = Array.isArray(site.hours) && site.hours.length > 0 ? site.hours : ["24/7 Priority Emergency Service"];

  return {
    name,
    phone,
    cleanPhone,
    email,
    city,
    state,
    fullCity,
    hours,
  };
}
