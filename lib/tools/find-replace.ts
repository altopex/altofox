/**
 * Find & Replace Engine with Smart Phone Number Replacement & Undo History (10 versions)
 */

export interface FindReplaceMatch {
  id: string; // unique match id
  pagePath: string;
  foundText: string;
  replacementText: string;
  snippet: string; // surrounding text for preview
  lineEstimate: number;
  selected: boolean;
  type: "text" | "heading" | "button" | "meta" | "alt" | "schema" | "phone";
}

export interface FindReplaceOptions {
  find: string;
  replaceWith: string;
  matchCase: boolean;
  wholeWord: boolean;
  scope: "all" | "selected" | "text-only" | "include-meta-links";
  selectedPages?: string[];
  isPhoneReplace?: boolean;
}

export interface VersionSnapshot {
  id: string;
  timestamp: number;
  label: string;
  files: { path: string; content: string }[];
}

/**
 * Normalizes phone numbers to clean digits e.g. "+12145550198" or "2145550198"
 */
export function normalizePhoneDigits(phone: string): string {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits;
}

/**
 * Scans generated HTML files and finds all occurrences according to options.
 */
export function findMatches(
  files: { path: string; content: string }[],
  options: FindReplaceOptions
): FindReplaceMatch[] {
  const matches: FindReplaceMatch[] = [];
  const { find, replaceWith, matchCase, wholeWord, scope, selectedPages, isPhoneReplace } = options;

  if (!find || !find.trim()) return [];

  // Determine regex pattern
  let regex: RegExp;
  if (isPhoneReplace) {
    // Smart phone match: find various formats of the given phone number or generic phone pattern
    const digitsOnly = find.replace(/\D/g, "");
    if (digitsOnly.length >= 7) {
      // Create flexible regex matching spaces, dots, dashes, parentheses between digits
      const digitPattern = digitsOnly.split("").join("[\\s.-]?");
      regex = new RegExp(`(?:\\+?1[\\s.-]?)?\\(?${digitPattern}\\)?`, "g");
    } else {
      const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      regex = new RegExp(escaped, matchCase ? "g" : "gi");
    }
  } else {
    const escaped = find.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = wholeWord ? `\\b${escaped}\\b` : escaped;
    regex = new RegExp(pattern, matchCase ? "g" : "gi");
  }

  for (const file of files) {
    if (!file.path.endsWith(".html") && !file.path.endsWith(".xml") && !file.path.endsWith(".json")) {
      continue;
    }

    if (scope === "selected" && selectedPages && !selectedPages.includes(file.path)) {
      continue;
    }

    const content = file.content;
    let match: RegExpExecArray | null;
    const localRegex = new RegExp(regex.source, regex.flags);

    let matchIdx = 0;
    while ((match = localRegex.exec(content)) !== null) {
      matchIdx++;
      const index = match.index;
      const matchedText = match[0];

      // Extract surrounding context (up to 40 chars before and after)
      const start = Math.max(0, index - 40);
      const end = Math.min(content.length, index + matchedText.length + 40);
      const snippet = content.slice(start, end).replace(/\s+/g, " ");

      // Determine type
      let type: FindReplaceMatch["type"] = "text";
      if (isPhoneReplace) {
        type = "phone";
      } else if (snippet.includes("<h1") || snippet.includes("<h2") || snippet.includes("<h3")) {
        type = "heading";
      } else if (snippet.includes("<button") || snippet.includes("btn")) {
        type = "button";
      } else if (snippet.includes("<title") || snippet.includes("name=\"description\"")) {
        type = "meta";
      } else if (snippet.includes("alt=")) {
        type = "alt";
      } else if (snippet.includes("application/ld+json") || snippet.includes("\"@type\"")) {
        type = "schema";
      }

      // If scope is text-only, skip meta tags or json-ld
      if (scope === "text-only" && (type === "meta" || type === "schema")) {
        continue;
      }

      matches.push({
        id: `${file.path}-${index}-${matchIdx}`,
        pagePath: file.path,
        foundText: matchedText,
        replacementText: replaceWith,
        snippet: `…${snippet}…`,
        lineEstimate: content.slice(0, index).split("\n").length,
        selected: true,
        type,
      });
    }
  }

  return matches;
}

/**
 * Applies replacements for selected matches across all files.
 * Handles smart phone replacement (visible text + tel: links + JSON-LD schema).
 */
export function applyReplacements(
  files: { path: string; content: string }[],
  matchesToApply: FindReplaceMatch[],
  options: FindReplaceOptions
): { path: string; content: string }[] {
  const { isPhoneReplace, replaceWith } = options;
  const selectedMatchIds = new Set(matchesToApply.filter((m) => m.selected).map((m) => m.id));

  const updatedFiles = files.map((file) => {
    let content = file.content;

    // Filter matches for this file
    const fileMatches = matchesToApply.filter((m) => m.pagePath === file.path && selectedMatchIds.has(m.id));

    if (fileMatches.length === 0 && !isPhoneReplace) {
      return file;
    }

    if (isPhoneReplace) {
      // Smart Phone Replacement:
      // 1. Textual occurrences
      for (const m of fileMatches) {
        content = content.replace(m.foundText, replaceWith);
      }

      // 2. Also update all tel: links
      const cleanNewDigits = normalizePhoneDigits(replaceWith);
      content = content.replace(/href=["']tel:[^"']+["']/gi, `href="tel:${cleanNewDigits}"`);

      // 3. Update schema.org "telephone" property
      content = content.replace(
        /(["']telephone["']\s*:\s*["'])[^"']+(["'])/gi,
        `$1${replaceWith}$2`
      );
    } else {
      // Standard replacement in reverse order of index to preserve character positions
      for (const m of fileMatches) {
        content = content.replace(m.foundText, m.replacementText);
      }
    }

    return { ...file, content };
  });

  return updatedFiles;
}

/**
 * Manages 10-version undo history stack.
 */
export class VersionHistoryManager {
  private history: VersionSnapshot[] = [];
  private maxVersions = 10;

  pushVersion(label: string, files: { path: string; content: string }[]): VersionSnapshot {
    const snapshot: VersionSnapshot = {
      id: `ver-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      label,
      files: files.map((f) => ({ ...f })),
    };

    this.history.unshift(snapshot);
    if (this.history.length > this.maxVersions) {
      this.history.pop();
    }
    return snapshot;
  }

  undo(): VersionSnapshot | null {
    if (this.history.length > 1) {
      this.history.shift(); // remove current
      return this.history[0] || null; // return previous
    }
    return null;
  }

  getSnapshots(): VersionSnapshot[] {
    return [...this.history];
  }

  canUndo(): boolean {
    return this.history.length > 1;
  }
}
