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

  console.log("\n--- 4. Simulated Publish Execution (Empty Files Guard) ---");
  const publishMissingFiles = await publishWebsite({
    provider: "vercel",
    projectName: "test-site",
    files: [],
    credentials: { provider: "vercel", apiToken: "test-token" },
  });
  if (publishMissingFiles.success !== false) {
    throw new Error("Expected publish failure when no files provided");
  }
  console.log(`  ✓ [PASS] Vercel correctly halted publish on empty payload`);

  console.log("\n==================================================================");
  console.log("   🎉 UNIFIED PUBLISHING AUDIT COMPLETE: ALL CHECKS PASSED!");
  console.log("==================================================================");
}

runTests().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
