/**
 * Utility to sanitize credentials, bearer tokens, and API keys from logs and client responses.
 */

export function stripSensitiveTokens(text?: string | null): string | undefined {
  if (!text || typeof text !== "string") return undefined;

  return text
    // Redact Bearer tokens
    .replace(/Bearer\s+[a-zA-Z0-9_\-\.]+/gi, "Bearer [REDACTED]")
    // Redact GitHub personal access tokens
    .replace(/ghp_[a-zA-Z0-9]{20,}/gi, "ghp_[REDACTED]")
    .replace(/github_pat_[a-zA-Z0-9_]{20,}/gi, "github_pat_[REDACTED]")
    .replace(/gho_[a-zA-Z0-9]{20,}/gi, "gho_[REDACTED]")
    // Redact Cloudflare API tokens (40 hex or base64 chars)
    .replace(/[a-f0-9]{40}/gi, (match) => `${match.slice(0, 4)}...${match.slice(-4)}`)
    // Redact query parameter tokens
    .replace(/([?&]token=)[^&\s]+/gi, "$1[REDACTED]")
    // Redact Google AI / Cloud API keys
    .replace(/AIza[0-9A-Za-z-_]{10,45}/g, "AIza[REDACTED]")
    // Redact OpenAI / Claude / general AI provider keys
    .replace(/sk-[a-zA-Z0-9_-]{10,}/g, "sk-[REDACTED]")
    // Redact JSON/URL-encoded fields
    .replace(
      /(["']?(?:apiToken|api_token|token|password|secret|auth)["']?\s*[:=]\s*["'])([^"']+)(["'])/gi,
      "$1[REDACTED]$3"
    );
}
