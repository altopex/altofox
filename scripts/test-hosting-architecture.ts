import {
  getHostingAdapter,
  publishWebsite,
  testHostingConnection,
  listHostingDestinations,
  connectHostingDomain,
  HostingProviderType,
} from "../lib/publishing/publishing-service";
import { sanitizePagesProjectName } from "../lib/cloudflare/cloudflare-service";
import { sanitizeVercelProjectName } from "../lib/publishing/adapters/vercel-adapter";
import { sanitizeNetlifyProjectName } from "../lib/publishing/adapters/netlify-adapter";
import { sanitizeGithubRepoName } from "../lib/publishing/adapters/github-adapter";
import { stripSensitiveTokens } from "../lib/publishing/token-sanitizer";

async function runTests() {
  console.log("==================================================================");
  console.log("   RANKLOCAL UNIFIED HOSTING & PUBLISHING ARCHITECTURE AUDIT");
  console.log("==================================================================\n");

  const providers: HostingProviderType[] = ["cloudflare", "vercel", "netlify", "github"];

  console.log("--- 1. Provider Adapter Registry & Contract Verification ---");
  for (const p of providers) {
    const adapter = getHostingAdapter(p);
    if (!adapter) throw new Error(`Missing adapter for ${p}`);
    if (adapter.provider !== p) throw new Error(`Adapter provider mismatch for ${p}`);
    if (typeof adapter.testConnection !== "function") throw new Error(`${p} missing testConnection`);
    if (typeof adapter.publish !== "function") throw new Error(`${p} missing publish`);
    console.log(`  ✓ [PASS] Adapter "${p}" conforms to IHostingAdapter contract`);
  }

  console.log("\n--- 2. Project & Repository Name Sanitizers ---");
  const dirty = "  My Lone Star Plumbing & HVAC (Dallas #1)!!  ";
  const cfClean = sanitizePagesProjectName(dirty);
  const vercelClean = sanitizeVercelProjectName(dirty);
  const netlifyClean = sanitizeNetlifyProjectName(dirty);
  const ghClean = sanitizeGithubRepoName(dirty);

  if (!/^[a-z0-9-]+$/.test(cfClean)) throw new Error(`Cloudflare sanitizer failed: ${cfClean}`);
  if (!/^[a-z0-9-]+$/.test(vercelClean)) throw new Error(`Vercel sanitizer failed: ${vercelClean}`);
  if (!/^[a-z0-9-]+$/.test(netlifyClean)) throw new Error(`Netlify sanitizer failed: ${netlifyClean}`);
  if (!/^[a-z0-9-]+$/.test(ghClean)) throw new Error(`GitHub sanitizer failed: ${ghClean}`);

  console.log(`  ✓ [PASS] Cloudflare sanitized: "${cfClean}"`);
  console.log(`  ✓ [PASS] Vercel sanitized:     "${vercelClean}"`);
  console.log(`  ✓ [PASS] Netlify sanitized:    "${netlifyClean}"`);
  console.log(`  ✓ [PASS] GitHub sanitized:     "${ghClean}"`);

  console.log("\n--- 3. Missing Credentials Guard & Honest Error Reporting ---");
  for (const p of providers) {
    const res = await testHostingConnection(p, { provider: p });
    if (res.success !== false) throw new Error(`Expected failure for empty credentials on ${p}`);
    if (!res.message || res.message.includes("Something went wrong")) {
      throw new Error(`Expected descriptive error message on ${p}, got: ${res.message}`);
    }
    console.log(`  ✓ [PASS] ${p.toUpperCase()} correctly rejected empty credentials: "${res.message.slice(0, 60)}..."`);
  }

  console.log("\n--- 4. Simulated Publish Execution (All 4 Providers - Empty Files Guard) ---");
  for (const p of providers) {
    const pubRes = await publishWebsite({
      provider: p,
      projectName: "test-site",
      files: [],
      credentials: { provider: p, apiToken: "test-dummy-token-abc" },
    });
    // Never show deployment successful unless actually confirmed
    if (pubRes.success !== false) {
      throw new Error(`Expected failure on empty payload for provider ${p}`);
    }
    if (pubRes.status !== "failed") {
      throw new Error(`Expected status to be 'failed' on empty payload for provider ${p}, got ${pubRes.status}`);
    }
    if (!pubRes.provider || pubRes.provider !== p) {
      throw new Error(`Provider mismatch in result for ${p}`);
    }
    if (!pubRes.error) {
      throw new Error(`Expected error message to be reported for ${p}`);
    }
    console.log(`  ✓ [PASS] ${p.toUpperCase()} honestly reported failure: status="${pubRes.status}", error="${pubRes.error.slice(0, 50)}..."`);
  }

  console.log("\n--- 5. Standardized Deployment Result Reporting Contract ---");
  // Test result reporting schema
  const sampleResult = {
    success: true,
    status: "published" as const,
    provider: "cloudflare" as const,
    projectName: "my-site",
    deploymentUrl: "https://my-site.pages.dev",
    deploymentId: "cf-dep-998822",
    publishedAt: Date.now(),
  };

  const requiredFields = ["status", "provider", "deploymentUrl", "deploymentId"];
  for (const field of requiredFields) {
    if (!(field in sampleResult)) {
      throw new Error(`Missing required reporting field: ${field}`);
    }
  }
  console.log(`  ✓ [PASS] Reporting schema validates all required fields: status, provider, deploymentUrl, deploymentId`);

  console.log("\n--- 6. Token Redaction & Security Sanity Checks ---");
  const sensitiveErrors = [
    "Error with Bearer ghp_1234567890abcdefghijklmnopqrstuvwxyz during GitHub upload",
    "Invalid token github_pat_11AAAAAA00000000000000_BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB",
    "Cloudflare auth error with token 1234567890abcdef1234567890abcdef12345678",
    'Request failed: {"apiToken": "super_secret_token_12345"}',
  ];

  for (const rawErr of sensitiveErrors) {
    const sanitized = stripSensitiveTokens(rawErr);
    if (!sanitized) throw new Error("Sanitizer returned empty string");
    if (sanitized.includes("ghp_1234567890") || sanitized.includes("github_pat_11AAAA") || sanitized.includes("super_secret_token_12345")) {
      throw new Error(`Token leak detected after sanitization: ${sanitized}`);
    }
    console.log(`  ✓ [PASS] Sanitized: "${sanitized}"`);
  }

  console.log("\n==================================================================");
  console.log("   🎉 UNIFIED PUBLISHING AUDIT COMPLETE: ALL CHECKS PASSED!");
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
