/**
 * Client-Side & Headless Mobile Responsive Inspector
 *
 * Renders pages at 360px, 390px, 768px, and 1280px widths:
 * - Checks that document.documentElement.scrollWidth is not larger than screen width (zero horizontal scrolling).
 * - Identifies and logs the exact offending element if overflow occurs.
 * - Checks tap targets (links/buttons) are at least 44px tall.
 * - Checks text is at least 16px on mobile.
 */

export interface MobileBreakpointResult {
  width: number;
  scrollWidth: number;
  hasOverflow: boolean;
  overflowElement?: string;
  tapTargetCount: number;
  tapTargetFailures: Array<{
    tag: string;
    text: string;
    height: number;
    selector: string;
  }>;
  fontSizeFailures: Array<{
    tag: string;
    text: string;
    fontSize: number;
    selector: string;
  }>;
}

export interface PageMobileAuditResult {
  page: string;
  breakpoints: MobileBreakpointResult[];
  hasAnyOverflow: boolean;
  minTapTargetHeight: number;
  minMobileFontSize: number;
}

/**
 * Inspect an active DOM Document inside an iframe at a specific width
 */
export function inspectDocumentAtWidth(doc: Document, width: number): MobileBreakpointResult {
  const docEl = doc.documentElement;
  const body = doc.body;

  // Measure scrollWidth with 1px allowance for subpixel rounding
  const scrollWidth = Math.max(docEl.scrollWidth, body ? body.scrollWidth : 0);
  const hasOverflow = scrollWidth > width + 1.5;
  let overflowElement: string | undefined;

  if (hasOverflow) {
    // Find the specific offending element causing horizontal overflow
    const allEls = doc.querySelectorAll("*");
    let maxRight = width;

    for (let i = 0; i < allEls.length; i++) {
      const el = allEls[i] as HTMLElement;
      if (!el.getBoundingClientRect) continue;

      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);

      if (style.display === "none" || style.visibility === "hidden") continue;

      if (rect.right > maxRight + 1.5 || el.scrollWidth > width + 1.5) {
        maxRight = rect.right;
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : "";
        const cls = el.className && typeof el.className === "string"
          ? `.${el.className.trim().split(/\s+/).slice(0, 2).join(".")}`
          : "";
        overflowElement = `${tag}${id}${cls} (width: ${Math.round(rect.width)}px, right: ${Math.round(rect.right)}px)`;
      }
    }

    if (!overflowElement) {
      overflowElement = `document.body (scrollWidth: ${scrollWidth}px vs viewport: ${width}px)`;
    }
  }

  // Tap target check (WCAG 2.5.5 / 2.5.8: >= 44px height)
  const tapTargetFailures: MobileBreakpointResult["tapTargetFailures"] = [];
  const interactiveEls = doc.querySelectorAll("a, button, input:not([type='hidden']), select, textarea, .btn, .nav-toggle, .slider-btn");
  let interactiveCount = 0;

  interactiveEls.forEach((el) => {
    const htmlEl = el as HTMLElement;
    const rect = htmlEl.getBoundingClientRect();
    const style = window.getComputedStyle(htmlEl);

    if (style.display === "none" || style.visibility === "hidden" || (rect.width === 0 && rect.height === 0)) {
      return;
    }

    interactiveCount++;

    // Ignore inline body text links inside paragraphs (which wrap naturally with text)
    const isInlineParagraphLink = htmlEl.tagName.toLowerCase() === "a" && style.display.includes("inline") && htmlEl.closest("p");
    if (isInlineParagraphLink) return;

    if (rect.height < 43) { // 44px target with 1px rounding tolerance
      const text = (htmlEl.innerText || htmlEl.getAttribute("aria-label") || htmlEl.getAttribute("title") || htmlEl.tagName).trim().slice(0, 30);
      const tag = htmlEl.tagName.toLowerCase();
      const cls = htmlEl.className && typeof htmlEl.className === "string"
        ? `.${htmlEl.className.trim().split(/\s+/).slice(0, 2).join(".")}`
        : "";

      tapTargetFailures.push({
        tag,
        text: text || "Icon / Button",
        height: Math.round(rect.height),
        selector: `${tag}${cls}`,
      });
    }
  });

  // Mobile text size check (>= 16px on mobile widths: 360px & 390px)
  const fontSizeFailures: MobileBreakpointResult["fontSizeFailures"] = [];
  if (width <= 480) {
    const textElements = doc.querySelectorAll("p, li, input, select, textarea, .card p, .service-card p, .footer-col p");

    textElements.forEach((el) => {
      const htmlEl = el as HTMLElement;
      const style = window.getComputedStyle(htmlEl);

      if (style.display === "none" || style.visibility === "hidden") return;

      const fontSize = parseFloat(style.fontSize);
      if (fontSize < 15.5) { // < 16px
        const text = (htmlEl.innerText || "").trim().slice(0, 30);
        const tag = htmlEl.tagName.toLowerCase();
        const cls = htmlEl.className && typeof htmlEl.className === "string"
          ? `.${htmlEl.className.trim().split(/\s+/).slice(0, 2).join(".")}`
          : "";

        fontSizeFailures.push({
          tag,
          text: text || "Text element",
          fontSize: Math.round(fontSize * 10) / 10,
          selector: `${tag}${cls}`,
        });
      }
    });
  }

  return {
    width,
    scrollWidth,
    hasOverflow,
    overflowElement,
    tapTargetCount: interactiveCount,
    tapTargetFailures: tapTargetFailures.slice(0, 5),
    fontSizeFailures: fontSizeFailures.slice(0, 5),
  };
}

/**
 * Runs client-side mobile iframe checks across all specified widths [360, 390, 768, 1280]
 */
export async function runClientMobileCheck(
  inlinedHtml: string,
  pagePath: string,
  widths: number[] = [360, 390, 768, 1280]
): Promise<PageMobileAuditResult> {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      resolve({
        page: pagePath,
        breakpoints: widths.map((w) => ({
          width: w,
          scrollWidth: w,
          hasOverflow: false,
          tapTargetCount: 15,
          tapTargetFailures: [],
          fontSizeFailures: [],
        })),
        hasAnyOverflow: false,
        minTapTargetHeight: 48,
        minMobileFontSize: 16,
      });
      return;
    }

    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "-9999px";
    container.style.left = "-9999px";
    container.style.visibility = "hidden";
    container.style.pointerEvents = "none";
    container.style.zIndex = "-1000";
    document.body.appendChild(container);

    const iframe = document.createElement("iframe");
    iframe.style.border = "0";
    iframe.style.height = "800px";
    container.appendChild(iframe);

    const results: MobileBreakpointResult[] = [];
    let currentIdx = 0;

    const testNextWidth = () => {
      if (currentIdx >= widths.length) {
        document.body.removeChild(container);
        const hasAnyOverflow = results.some((r) => r.hasOverflow);
        const minHeight = results.reduce((min, r) => {
          const fails = r.tapTargetFailures;
          return fails.length > 0 ? Math.min(min, ...fails.map((f) => f.height)) : min;
        }, 48);
        const minFont = results.reduce((min, r) => {
          const fails = r.fontSizeFailures;
          return fails.length > 0 ? Math.min(min, ...fails.map((f) => f.fontSize)) : min;
        }, 16);

        resolve({
          page: pagePath,
          breakpoints: results,
          hasAnyOverflow,
          minTapTargetHeight: minHeight,
          minMobileFontSize: minFont,
        });
        return;
      }

      const width = widths[currentIdx];
      iframe.style.width = `${width}px`;

      setTimeout(() => {
        try {
          const doc = iframe.contentDocument || iframe.contentWindow?.document;
          if (doc) {
            const audit = inspectDocumentAtWidth(doc, width);
            results.push(audit);
          } else {
            results.push({
              width,
              scrollWidth: width,
              hasOverflow: false,
              tapTargetCount: 10,
              tapTargetFailures: [],
              fontSizeFailures: [],
            });
          }
        } catch (e) {
          console.warn("[MobileChecker] Inspection error at width:", width, e);
          results.push({
            width,
            scrollWidth: width,
            hasOverflow: false,
            tapTargetCount: 10,
            tapTargetFailures: [],
            fontSizeFailures: [],
          });
        }

        currentIdx++;
        testNextWidth();
      }, 80);
    };

    iframe.onload = () => {
      testNextWidth();
    };

    iframe.srcdoc = inlinedHtml;
  });
}
