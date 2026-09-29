import {
  sanitizePagesProjectName,
  verifyCloudflareConnection,
} from "../lib/cloudflare/cloudflare-service";

async function main() {
  console.log("=== Testing Cloudflare Unit Functions ===");

  // 1. Project name sanitization test
  const tests = [
    { input: "Lone Star Plumbing & Rooter, LLC!", expected: "lone-star-plumbing-rooter-llc" },
    { input: "--- Dallas - AC - Repair ---", expected: "dallas-ac-repair" },
    { input: "123 Clean & Pure Pools", expected: "123-clean-pure-pools" },
    { input: "___Special!Chars___", expected: "special-chars" },
    { input: "", expected: "ranklocal-site" },
  ];

  for (const t of tests) {
    const res = sanitizePagesProjectName(t.input);
    if (res === t.expected) {
      console.log(`✓ Sanitized "${t.input}" -> "${res}"`);
    } else {
      console.error(`✗ Mismatch: "${t.input}" got "${res}", expected "${t.expected}"`);
      process.exit(1);
    }
  }

  // 2. Test verifyCloudflareConnection with dummy/invalid credentials (must fail gracefully, never throw)
  console.log("\n=== Testing Graceful Error Handling on Bad Credentials ===");
  const badTest = await verifyCloudflareConnection("invalid_token_12345", "invalid_account_abcde");
  if (!badTest.valid && badTest.error) {
    console.log(`✓ Graceful verification failure: "${badTest.error}"`);
  } else {
    console.error("✗ Expected verification failure with bad token, but got:", badTest);
    process.exit(1);
  }

  console.log("\nAll Cloudflare unit tests passed successfully!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
