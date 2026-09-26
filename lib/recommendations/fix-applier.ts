import { BuilderRecommendation } from "./recommendation-engine";

export interface FixResult {
  success: boolean;
  updatedHtml: string;
  appliedChange: string;
  error?: string;
}

/**
 * Applies a single recommendation fix directly to an HTML string AST/DOM.
 */
export function applyRecommendationFix(
  html: string,
  recommendation: BuilderRecommendation
): FixResult {
  if (!html || typeof html !== "string") {
    return { success: false, updatedHtml: html, appliedChange: "", error: "Invalid HTML input" };
  }

  const change = recommendation.proposedChange;
  let updatedHtml = html;
  let applied = false;

  try {
    switch (change.action) {
      case "replace_text": {
        if (change.targetSelector === "title" || recommendation.TargetElementId?.includes("title")) {
          if (/<title[^>]*>[\s\S]*?<\/title>/i.test(updatedHtml)) {
            updatedHtml = updatedHtml.replace(
              /<title[^>]*>[\s\S]*?<\/title>/i,
              `<title>${change.newValue}</title>`
            );
            applied = true;
          }
        } else if (change.currentValue) {
          if (updatedHtml.includes(change.currentValue)) {
            updatedHtml = updatedHtml.replace(change.currentValue, change.newValue);
            applied = true;
          }
        }
        break;
      }

      case "set_attribute": {
        // 1. HTML lang attribute
        if (recommendation.id === "a11y-html-lang-missing" || change.targetSelector === "html") {
          if (/<html\b/i.test(updatedHtml)) {
            updatedHtml = updatedHtml.replace(/<html(\b[^>]*)>/i, (m, attrs) => {
              if (attrs.includes("lang=")) {
                return `<html${attrs.replace(/lang=["'][^"']*["']/i, `lang="${change.newValue}"`)}>`;
              }
              return `<html lang="${change.newValue}"${attrs}>`;
            });
            applied = true;
          }
        }
        // 2. Meta description attribute
        else if (change.targetSelector?.includes("description") || change.attributeName === "content") {
          if (/<meta[^>]*?name=["']description["'][^>]*>/i.test(updatedHtml)) {
            updatedHtml = updatedHtml.replace(
              /<meta([^>]*?name=["']description["'][^>]*?content=["'])([^"']*)(["'][^>]*>)/i,
              `$1${change.newValue}$3`
            );
            applied = true;
          }
        }
        // 3. Image Alt text
        else if (change.attributeName === "alt" && change.targetSelector?.includes("img")) {
          const srcMatch = change.targetSelector.match(/src=["']([^"']*)["']/i);
          const targetSrc = srcMatch ? srcMatch[1] : null;

          if (targetSrc) {
            // Target specific image by src
            const escapedSrc = targetSrc.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const imgRegex = new RegExp(`(<img\\b[^>]*?src=["']${escapedSrc}["'][^>]*?)>`, "i");
            if (imgRegex.test(updatedHtml)) {
              updatedHtml = updatedHtml.replace(imgRegex, (match, prefix) => {
                if (/alt=["'][^"']*["']/i.test(prefix)) {
                  return prefix.replace(/alt=["'][^"']*["']/i, `alt="${change.newValue}"`) + ">";
                }
                return `${prefix} alt="${change.newValue}">`;
              });
              applied = true;
            }
          } else {
            // General first image missing alt
            updatedHtml = updatedHtml.replace(/(<img\b(?![^>]*\balt=)[^>]*?)>/i, `$1 alt="${change.newValue}">`);
            applied = true;
          }
        }
        // 4. Button aria-label
        else if (change.attributeName === "aria-label") {
          updatedHtml = updatedHtml.replace(/(<button\b(?![^>]*\baria-label=)[^>]*?)>/i, `$1 aria-label="${change.newValue}">`);
          applied = true;
        }
        break;
      }

      case "insert_meta": {
        // Insert into <head>
        if (/<\/head>/i.test(updatedHtml)) {
          // If inserting title and title tag already exists, replace it
          if (change.targetTag === "title" && /<title[^>]*>[\s\S]*?<\/title>/i.test(updatedHtml)) {
            updatedHtml = updatedHtml.replace(/<title[^>]*>[\s\S]*?<\/title>/i, change.newValue);
          } else {
            // Insert right before </head>
            updatedHtml = updatedHtml.replace(/(<\/head>)/i, `  ${change.newValue}\n$1`);
          }
          applied = true;
        }
        break;
      }

      case "insert_element": {
        // Insert element into <main> or <body>
        if (/<main[^>]*>/i.test(updatedHtml)) {
          updatedHtml = updatedHtml.replace(/(<main[^>]*>)/i, `$1\n  ${change.newValue}\n`);
          applied = true;
        } else if (/<body[^>]*>/i.test(updatedHtml)) {
          updatedHtml = updatedHtml.replace(/(<body[^>]*>)/i, `$1\n  ${change.newValue}\n`);
          applied = true;
        }
        break;
      }

      case "replace_tag": {
        // e.g. downgrade second H1 to H2
        if (recommendation.id === "structure-multiple-h1") {
          let h1Count = 0;
          updatedHtml = updatedHtml.replace(/(<h1\b[^>]*>)([\s\S]*?)(<\/h1>)/gi, (m, openTag, content, closeTag) => {
            h1Count++;
            if (h1Count > 1) {
              const newOpen = openTag.replace(/^<h1\b/i, "<h2");
              const newClose = closeTag.replace(/^<\/h1>/i, "</h2>");
              return `${newOpen}${content}${newClose}`;
            }
            return m;
          });
          applied = true;
        }
        break;
      }

      case "wrap_element": {
        if (recommendation.id === "structure-main-landmark-missing") {
          if (!updatedHtml.includes("<main") && /<body([^>]*)>/i.test(updatedHtml) && /<\/body>/i.test(updatedHtml)) {
            updatedHtml = updatedHtml.replace(/(<body[^>]*>)([\s\S]*?)(<\/body>)/i, (m, bodyOpen, bodyContent, bodyClose) => {
              // Wrap sections inside <main>
              return `${bodyOpen}\n<main>\n${bodyContent}\n</main>\n${bodyClose}`;
            });
            applied = true;
          }
        }
        break;
      }

      default:
        break;
    }

    if (applied) {
      return {
        success: true,
        updatedHtml,
        appliedChange: change.explanation,
      };
    }

    return {
      success: false,
      updatedHtml: html,
      appliedChange: "",
      error: "Unable to locate target element in HTML to apply change.",
    };
  } catch (err: any) {
    return {
      success: false,
      updatedHtml: html,
      appliedChange: "",
      error: err.message || "Failed to apply fix",
    };
  }
}

/**
 * Applies multiple recommendations in sequence
 */
export function applyAllRecommendations(
  html: string,
  recommendations: BuilderRecommendation[]
): { updatedHtml: string; appliedCount: number; appliedChanges: string[] } {
  let currentHtml = html;
  let appliedCount = 0;
  const appliedChanges: string[] = [];

  for (const rec of recommendations) {
    const res = applyRecommendationFix(currentHtml, rec);
    if (res.success && res.updatedHtml !== currentHtml) {
      currentHtml = res.updatedHtml;
      appliedCount++;
      appliedChanges.push(res.appliedChange);
    }
  }

  return {
    updatedHtml: currentHtml,
    appliedCount,
    appliedChanges,
  };
}
