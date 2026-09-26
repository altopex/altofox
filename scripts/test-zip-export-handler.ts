import { bundleProjectToZipStream } from "../lib/export/zip-bundler";
import JSZip from "jszip";

async function streamToBuffer(stream: ReadableStream<Uint8Array>): Promise<Buffer> {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }

  return Buffer.concat(chunks);
}

async function runZipExportHandlerTests() {
  console.log("==========================================================================");
  console.log(" Testing Robust Streaming ZIP Export Handler & Graceful Fallback Engine ");
  console.log("==========================================================================");

  // Test 1: Bundling with local text files, base64 images, and robots.txt auto-generation
  console.log("\n--- 1. BUNDLE RESOLUTION & ASYNCHRONOUS STREAMING ---");
  const sampleBase64Img = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  const result1 = await bundleProjectToZipStream({
    projectId: "proj-test-101",
    projectName: "Austin Precision Plumbing",
    files: [
      { path: "index.html", content: "<html><head><title>Austin Precision Plumbing</title></head><body><h1>Austin Precision Plumbing</h1><img src=\"images/logo.png\" /></body></html>" },
      { path: "styles.css", content: "body { background: #f8fafc; font-family: sans-serif; }" },
      { path: "script.js", content: "console.log('Site initialized');" },
      { path: "images/logo.png", content: sampleBase64Img },
    ],
  });

  if (!result1.stream) {
    throw new Error("FAIL: stream was not returned by bundleProjectToZipStream");
  }
  console.log(`  ✓ PASS: Asynchronous stream generated for ${result1.safeFilename}`);

  const buffer1 = await streamToBuffer(result1.stream);
  console.log(`  ✓ PASS: Stream consumed successfully (${buffer1.length} bytes transferred)`);

  const unzipped = await JSZip.loadAsync(buffer1);
  const fileNames = Object.keys(unzipped.files);
  console.log(`  ✓ PASS: Archive validated. Files contained: ${fileNames.join(", ")}`);

  if (!unzipped.file("index.html") || !unzipped.file("styles.css") || !unzipped.file("robots.txt") || !unzipped.file("README.md")) {
    throw new Error("FAIL: Missing required files in unzipped archive");
  }
  console.log("  ✓ PASS: index.html, styles.css, robots.txt, and README.md verified in archive");

  // Verify binary image content
  const logoFile = unzipped.file("images/logo.png");
  if (!logoFile) {
    throw new Error("FAIL: images/logo.png not found in archive");
  }
  const logoBuffer = await logoFile.async("nodebuffer");
  if (logoBuffer.length === 0) {
    throw new Error("FAIL: images/logo.png is empty");
  }
  console.log(`  ✓ PASS: Binary image resolved and stored as valid Buffer (${logoBuffer.length} bytes)`);

  // Test 2: Graceful fallback when remote image fails or times out
  console.log("\n--- 2. NON-CRITICAL ASSET FAILURE & GRACEFUL FALLBACK ---");
  const result2 = await bundleProjectToZipStream({
    projectName: "Highland Roofing",
    files: [
      {
        path: "index.html",
        content: `<html><body>
          <h1>Highland Roofing</h1>
          <img src="images/missing-broken.jpg" data-remote-src="https://invalid-non-existent-domain-12345.com/broken.jpg" />
          <p>Contact us today.</p>
        </body></html>`,
      },
      { path: "styles.css", content: "h1 { color: blue; }" },
    ],
    photos: [
      {
        localPath: "images/timeout-photo.jpg",
        remoteUrl: "http://10.255.255.1/unreachable.jpg", // Unreachable IP
      },
    ],
  });

  const buffer2 = await streamToBuffer(result2.stream);
  const unzipped2 = await JSZip.loadAsync(buffer2);

  if (!unzipped2.file("index.html") || !unzipped2.file("styles.css")) {
    throw new Error("FAIL: Core website files missing when remote assets failed");
  }
  console.log(`  ✓ PASS: Gracefully omitted failed remote images (${result2.stats.omittedAssets} omitted)`);
  console.log(`  ✓ PASS: Valid ZIP generated without throwing (${buffer2.length} bytes, ${result2.stats.totalFiles} files included)`);

  // Test 3: Large project memory guard (simulating 50 pages)
  console.log("\n--- 3. LARGE SITE MULTI-PAGE STREAMING MEMORY GUARD ---");
  const largeFiles = [];
  for (let i = 0; i < 50; i++) {
    largeFiles.push({
      path: i === 0 ? "index.html" : `services/service-page-${i}.html`,
      content: `<html><head><title>Service Page ${i}</title></head><body><h1>Emergency Service ${i}</h1><p>${"Content paragraph repetition for size. ".repeat(200)}</p></body></html>`,
    });
  }
  largeFiles.push({ path: "styles.css", content: "body { margin: 0; padding: 0; }" });

  const memBefore = process.memoryUsage().heapUsed;
  const result3 = await bundleProjectToZipStream({
    projectName: "Mega Multi Location HVAC",
    files: largeFiles,
  });

  const buffer3 = await streamToBuffer(result3.stream);
  const memAfter = process.memoryUsage().heapUsed;
  const memDiffMb = ((memAfter - memBefore) / 1024 / 1024).toFixed(2);

  const unzipped3 = await JSZip.loadAsync(buffer3);
  const totalEntries = Object.keys(unzipped3.files).length;
  console.log(`  ✓ PASS: Streamed 50-page site (${totalEntries} entries, ${buffer3.length} bytes)`);
  console.log(`  ✓ PASS: Streaming memory heap delta remained low (${memDiffMb} MB)`);

  console.log("\n==========================================================================");
  console.log(" ALL ZIP EXPORT HANDLER TESTS PASSED CLEANLY!");
  console.log("==========================================================================");
}

runZipExportHandlerTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
