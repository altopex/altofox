/**
 * Image URL & Asset Validator (RankLocal / Altofox)
 * 
 * Verifies that image URLs are genuinely accessible, return valid image MIME types,
 * have non-empty payloads, and do not return HTML error pages disguised as 200 OK.
 * 
 * Includes timeout guards (AbortController) to ensure slow external CDN requests
 * never stall or crash site generation.
 */

export interface ImageValidationResult {
  valid: boolean;
  url: string;
  statusCode?: number;
  contentType?: string;
  contentLength?: number;
  reason?: string;
  sourceType: "data-uri" | "local" | "remote";
}

// In-memory cache to prevent redundant HTTP requests across pages
const VALIDATION_CACHE = new Map<string, ImageValidationResult>();

/**
 * Validates any image URL or asset string
 */
export async function validateImageUrl(
  url: string | undefined | null,
  timeoutMs: number = 2500
): Promise<ImageValidationResult> {
  if (!url || typeof url !== "string" || !url.trim()) {
    return {
      valid: false,
      url: url || "",
      reason: "Empty or invalid URL parameter",
      sourceType: "remote",
    };
  }

  const trimmed = url.trim();

  // 1. Data URIs (e.g. data:image/svg+xml, data:image/png)
  if (trimmed.startsWith("data:image/")) {
    const isValidDataUri = trimmed.length > 60 && trimmed.includes(",");
    return {
      valid: isValidDataUri,
      url: trimmed,
      reason: isValidDataUri ? undefined : "Malformed data URI",
      sourceType: "data-uri",
      contentType: trimmed.slice(5, trimmed.indexOf(";")),
    };
  }

  // 2. Local relative paths (e.g. images/hero.jpg, /images/logo.svg)
  if (trimmed.startsWith("images/") || trimmed.startsWith("/images/")) {
    return {
      valid: true,
      url: trimmed,
      sourceType: "local",
    };
  }

  // Check cache
  if (VALIDATION_CACHE.has(trimmed)) {
    return VALIDATION_CACHE.get(trimmed)!;
  }

  // 3. Remote HTTP/HTTPS URLs
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) {
    const res: ImageValidationResult = {
      valid: false,
      url: trimmed,
      reason: "Unsupported protocol or non-image format",
      sourceType: "remote",
    };
    VALIDATION_CACHE.set(trimmed, res);
    return res;
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    let res: Response | null = null;

    try {
      // First attempt: lightweight HEAD request
      res = await fetch(trimmed, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "AltoFox-Static-Builder/1.0 (Image Validator)",
          Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        },
      });

      // If HEAD returns 405 Method Not Allowed, fallback to partial GET
      if (res.status === 405) {
        res = await fetch(trimmed, {
          method: "GET",
          signal: controller.signal,
          headers: {
            "User-Agent": "AltoFox-Static-Builder/1.0 (Image Validator)",
            Range: "bytes=0-2047",
            Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
          },
        });
      }
    } finally {
      clearTimeout(timer);
    }

    if (!res || !res.ok) {
      const result: ImageValidationResult = {
        valid: false,
        url: trimmed,
        statusCode: res?.status,
        reason: `HTTP status ${res?.status || "failed"}`,
        sourceType: "remote",
      };
      VALIDATION_CACHE.set(trimmed, result);
      return result;
    }

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    const contentLengthHeader = res.headers.get("content-length");
    const contentLength = contentLengthHeader ? parseInt(contentLengthHeader, 10) : undefined;

    // Strict validation: Reject HTML or JSON responses
    if (
      contentType.includes("text/html") ||
      contentType.includes("application/json") ||
      contentType.includes("text/plain")
    ) {
      const result: ImageValidationResult = {
        valid: false,
        url: trimmed,
        statusCode: res.status,
        contentType,
        reason: `Response is ${contentType} rather than image`,
        sourceType: "remote",
      };
      VALIDATION_CACHE.set(trimmed, result);
      return result;
    }

    // Must be image/* or binary stream
    const isImageMime =
      contentType.startsWith("image/") ||
      contentType === "application/octet-stream";

    if (!isImageMime && contentType) {
      const result: ImageValidationResult = {
        valid: false,
        url: trimmed,
        statusCode: res.status,
        contentType,
        reason: `Invalid MIME type: ${contentType}`,
        sourceType: "remote",
      };
      VALIDATION_CACHE.set(trimmed, result);
      return result;
    }

    // Reject 0 bytes or suspiciously tiny images (< 150 bytes)
    if (contentLength !== undefined && contentLength < 150) {
      const result: ImageValidationResult = {
        valid: false,
        url: trimmed,
        statusCode: res.status,
        contentLength,
        reason: `Image content too small (${contentLength} bytes), likely empty or tracking pixel`,
        sourceType: "remote",
      };
      VALIDATION_CACHE.set(trimmed, result);
      return result;
    }

    const validResult: ImageValidationResult = {
      valid: true,
      url: trimmed,
      statusCode: res.status,
      contentType,
      contentLength,
      sourceType: "remote",
    };
    VALIDATION_CACHE.set(trimmed, validResult);
    return validResult;
  } catch (err: any) {
    const isTimeout = err?.name === "AbortError";
    const result: ImageValidationResult = {
      valid: false,
      url: trimmed,
      reason: isTimeout ? `Request timed out after ${timeoutMs}ms` : (err?.message || "Network error"),
      sourceType: "remote",
    };
    VALIDATION_CACHE.set(trimmed, result);
    return result;
  }
}

/**
 * Resets the in-memory validation cache (useful for testing)
 */
export function clearImageValidationCache(): void {
  VALIDATION_CACHE.clear();
}
