/**
 * Static HTML Export Optimizer
 * Minifies and optimizes HTML, CSS, JavaScript, and XML to output
 * clean, lightweight, production-ready static website bundles.
 */

/**
 * Minifies CSS stylesheet content.
 */
export function minifyCss(css: string): string {
  if (!css || typeof css !== "string") return "";

  return css
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove whitespace around selectors and braces
    .replace(/\s*([\{\}\:\;\,])\s*/g, "$1")
    // Remove space around operators
    .replace(/\s*([\>\~\+])\s*/g, "$1")
    // Remove trailing semicolons before closing brace
    .replace(/;\}/g, "}")
    // Collapse multi-spaces into single space
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Minifies JavaScript script content.
 */
export function minifyJs(js: string): string {
  if (!js || typeof js !== "string") return "";

  return js
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove single line comments that are not inside quotes or URLs
    .replace(/(^|[^:])\/\/[^\r\n]*/g, "$1")
    // Collapse excess whitespace
    .replace(/\s*([\{\}\(\)\=\+\-\*\/\:\;\,])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Minifies an HTML document while preserving <pre>, <code>, <textarea>, and JSON-LD blocks.
 */
export function minifyHtml(html: string): string {
  if (!html || typeof html !== "string") return "";

  // 1. Temporarily protect <pre>, <code>, and <textarea> blocks
  const protectedBlocks: string[] = [];
  let processed = html.replace(
    /<(pre|code|textarea)\b([\s\S]*?)<\/\1>/gi,
    (match) => {
      const token = `___PROTECTED_BLOCK_${protectedBlocks.length}___`;
      protectedBlocks.push(match);
      return token;
    }
  );

  // 2. Minify embedded <style> tags
  processed = processed.replace(
    /<style\b([^>]*)>([\s\S]*?)<\/style>/gi,
    (match, attrs, styleBody) => {
      return `<style${attrs}>${minifyCss(styleBody)}</style>`;
    }
  );

  // 3. Minify embedded <script> tags (except application/ld+json)
  processed = processed.replace(
    /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
    (match, attrs, scriptBody) => {
      if (/type=["']application\/ld\+json["']/i.test(attrs)) {
        try {
          const parsed = JSON.parse(scriptBody.trim());
          return `<script${attrs}>${JSON.stringify(parsed)}</script>`;
        } catch {
          return match;
        }
      }
      return `<script${attrs}>${minifyJs(scriptBody)}</script>`;
    }
  );

  // 4. Remove standard HTML comments (preserving conditional comments)
  processed = processed.replace(/<!--(?!\s*\[if)[\s\S]*?-->/g, "");

  // 5. Collapse whitespace between tags
  processed = processed.replace(/>\s+</g, "><");

  // 6. Collapse redundant spaces within tags
  processed = processed.replace(/\s{2,}/g, " ");

  // 7. Restore protected blocks
  protectedBlocks.forEach((block, index) => {
    processed = processed.replace(`___PROTECTED_BLOCK_${index}___`, block);
  });

  return processed.trim();
}

/**
 * Optimizes a file according to its extension.
 */
export function optimizeStaticFile(filePath: string, content: string): string {
  const ext = filePath.toLowerCase().split(".").pop();
  switch (ext) {
    case "html":
    case "htm":
      return minifyHtml(content);
    case "css":
      return minifyCss(content);
    case "js":
      return minifyJs(content);
    case "xml":
      return content.replace(/>\s+</g, "><").trim();
    case "json":
      try {
        return JSON.stringify(JSON.parse(content));
      } catch {
        return content.trim();
      }
    default:
      return content;
  }
}

/**
 * Generates default production robots.txt file with sitemap pointer.
 */
export function generateRobotsTxt(domain: string = "example.com"): string {
  return `User-agent: *
Allow: /

Sitemap: https://${domain}/sitemap.xml
`;
}
