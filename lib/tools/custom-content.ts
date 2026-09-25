/**
 * Custom Content Blocks, Global Business Variables & Must-Include Text Engine
 */

export interface GlobalBusinessDetails {
  businessName: string;
  phone: string;
  email: string;
  streetAddress?: string;
  city: string;
  stateRegion: string;
  zipPostalCode?: string;
  businessHours: string;
  websiteDomain: string;
  googleReviewUrl?: string;
  socialLinks?: string;
  licenseNumber?: string;
  businessModel?: "storefront" | "service-area";
}

export interface CustomContentBlock {
  id: string;
  title: string;
  content: string; // Plain text or HTML formatting (headings, bold, lists, links)
  placement: "all" | "specific" | "location-pages" | "service-pages" | "blog-posts";
  specificPages?: string[]; // e.g. ["index.html", "about.html"]
  position: "top-announcement" | "after-hero" | "before-footer-cta" | "end-of-main" | "footer";
  mode: "exact" | "blend"; // "Keep exactly as written" vs "Blend into content"
  active: boolean;
}

/**
 * Interpolates global variables like {{businessName}}, {{phone}}, etc. across all files
 * and in JSON-LD schema without calling an AI model.
 */
export function interpolateGlobalVariables(
  content: string,
  details: GlobalBusinessDetails
): string {
  let updated = content;

  // Define variable mappings
  const addressString =
    details.businessModel === "service-area"
      ? `Serving ${details.city} and surrounding areas`
      : [details.streetAddress, details.city, details.stateRegion, details.zipPostalCode]
          .filter(Boolean)
          .join(", ");

  const cleanPhoneDigits = details.phone.replace(/[^\d+]/g, "");

  const vars: Record<string, string> = {
    "{{businessName}}": details.businessName,
    "{{phone}}": details.phone,
    "{{phoneDigits}}": cleanPhoneDigits,
    "{{email}}": details.email,
    "{{city}}": details.city,
    "{{state}}": details.stateRegion,
    "{{stateRegion}}": details.stateRegion,
    "{{address}}": addressString,
    "{{streetAddress}}": details.streetAddress || "",
    "{{hours}}": details.businessHours,
    "{{businessHours}}": details.businessHours,
    "{{domain}}": details.websiteDomain,
    "{{websiteDomain}}": details.websiteDomain,
    "{{googleReviewUrl}}": details.googleReviewUrl || "",
    "{{licenseNumber}}": details.licenseNumber || "",
  };

  for (const [key, val] of Object.entries(vars)) {
    if (val !== undefined) {
      const escapedKey = key.replace(/[{}]/g, "\\$&");
      updated = updated.replace(new RegExp(escapedKey, "g"), val);
    }
  }

  // Update tel links
  if (cleanPhoneDigits) {
    updated = updated.replace(/href=["']tel:[^"']+["']/gi, `href="tel:${cleanPhoneDigits}"`);
  }

  // Update schema telephone
  if (details.phone) {
    updated = updated.replace(
      /(["']telephone["']\s*:\s*["'])[^"']+(["'])/gi,
      `$1${details.phone}$2`
    );
  }

  // Update schema name
  if (details.businessName) {
    updated = updated.replace(
      /(["']name["']\s*:\s*["'])[^"']+(["'])/gi,
      `$1${details.businessName}$2`
    );
  }

  return updated;
}

/**
 * Injects custom content blocks into HTML at their designated positions.
 */
export function injectCustomContentBlocks(
  html: string,
  pagePath: string,
  blocks: CustomContentBlock[]
): string {
  let updated = html;

  const activeBlocks = blocks.filter((b) => b.active);

  for (const block of activeBlocks) {
    // Check placement criteria
    let shouldInject = false;
    if (block.placement === "all") {
      shouldInject = true;
    } else if (block.placement === "specific") {
      shouldInject = Array.isArray(block.specificPages) && block.specificPages.includes(pagePath);
    } else if (block.placement === "location-pages") {
      shouldInject = pagePath.split("-").length >= 3 && !pagePath.startsWith("blog/");
    } else if (block.placement === "service-pages") {
      shouldInject = pagePath.includes("service") || pagePath.includes("-repair");
    } else if (block.placement === "blog-posts") {
      shouldInject = pagePath.startsWith("blog/") || pagePath.includes("blog");
    }

    if (!shouldInject) continue;

    // Render block HTML markup
    const blockMarkup = `
<!-- Custom Block: ${block.title} -->
<div class="custom-content-block custom-block-${block.position} my-6 p-4 rounded-xl border border-indigo-100 bg-indigo-50/50 text-slate-800 text-sm leading-relaxed" data-block-id="${block.id}">
  ${block.content}
</div>
`;

    // Position-specific injection
    if (block.position === "top-announcement") {
      // Inject right after opening <body...>, or before <header
      if (updated.includes("<header")) {
        const announcementMarkup = `
<div class="bg-indigo-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center space-x-2" data-block-id="${block.id}">
  <span>${block.content}</span>
</div>
`;
        updated = updated.replace("<header", `${announcementMarkup}\n<header`);
      }
    } else if (block.position === "after-hero") {
      // Inject after </section> of hero
      const heroMatch = updated.match(/<section[^>]*?class=["'][^"']*?hero[\s\S]*?<\/section>/i);
      if (heroMatch) {
        updated = updated.replace(heroMatch[0], `${heroMatch[0]}\n${blockMarkup}`);
      } else {
        // Fallback: after first section
        updated = updated.replace(/<\/section>/i, `</section>\n${blockMarkup}`);
      }
    } else if (block.position === "before-footer-cta") {
      // Inject before CTA section or before <footer>
      if (updated.includes("<footer")) {
        updated = updated.replace("<footer", `${blockMarkup}\n<footer`);
      } else {
        updated = updated.replace("</body>", `${blockMarkup}\n</body>`);
      }
    } else if (block.position === "end-of-main") {
      if (updated.includes("</main>")) {
        updated = updated.replace("</main>", `${blockMarkup}\n</main>`);
      } else if (updated.includes("<footer")) {
        updated = updated.replace("<footer", `${blockMarkup}\n<footer`);
      }
    } else if (block.position === "footer") {
      if (updated.includes("</footer>")) {
        updated = updated.replace("</footer>", `${blockMarkup}\n</footer>`);
      }
    }
  }

  return updated;
}

/**
 * Verifies that must-include text appears exactly in the HTML content.
 */
export function verifyMustIncludeText(
  html: string,
  mustIncludeText: string
): { present: boolean; missingSnippet?: string } {
  if (!mustIncludeText || !mustIncludeText.trim()) {
    return { present: true };
  }

  const cleanBody = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const cleanMust = mustIncludeText.trim().replace(/\s+/g, " ");

  if (cleanBody.toLowerCase().includes(cleanMust.toLowerCase())) {
    return { present: true };
  }

  return {
    present: false,
    missingSnippet: mustIncludeText.trim(),
  };
}
