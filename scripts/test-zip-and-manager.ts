import { generateWebsiteZIP, exportProjectBackup } from "../lib/storage/db";
import { SavedProject } from "../lib/storage/project-types";

async function runZipAndManagerTest() {
  console.log("=== Testing Website ZIP Download & Project Resiliency ===");

  // Test 1: Full project with all fields
  const completeProject: any = {
    id: "test-complete-1",
    name: "Apex Roofing Specialists",
    createdAt: Date.now(),
    lastEditedAt: Date.now(),
    files: [
      { path: "index.html", content: "<html><head><title>Apex Roofing</title></head><body><h1>Apex Roofing</h1><p>Test</p></body></html>" },
      { path: "styles.css", content: "body { font-family: sans-serif; }" },
      { path: "robots.txt", content: "User-agent: *\nAllow: /" },
    ],
    keywordMap: [{ pagePath: "index.html", primaryKeyword: "Roofing in Austin", secondaryKeywords: [] }],
    serviceAreaCities: [{ city: "Austin", state: "TX" }],
    customBlocks: [],
    changeLog: [],
    redirects: [{ from: "/old-page", to: "/index.html", statusCode: 301 }],
    optimizationCycles: [
      {
        id: "cycle-1",
        cycleNumber: 1,
        dateStr: "May 2026",
        dateRange: "Apr 1 - Apr 30",
        timestamp: Date.now(),
        pagesChanged: ["index.html"],
        siteMetrics: { clicks: 120, impressions: 3400, position: 14.2, ctr: 0.035 },
      },
    ],
    theme: {
      id: "modern-pro",
      name: "Modern Pro",
      fonts: { body: "Inter", heading: "Plus Jakarta Sans" },
      colors: {
        primary: "#1D4ED8",
        secondary: "#0F172A",
        accent: "#0EA5E9",
        background: "#F8FAFC",
        surface: "#FFFFFF",
        text: "#0F172A",
        muted: "#64748B",
      },
      heroStyle: "Split hero",
      buttonStyle: "Rounded 12px",
      borderRadius: "12px",
      sectionStyle: "Card-based",
      description: "Modern professional theme",
      designNotes: "Clean, trustworthy aesthetic",
    },
    businessDetails: {
      websiteDomain: "apexroofing.com",
    },
  };

  const res1 = await generateWebsiteZIP(completeProject, "full");
  if (!res1.blob || res1.blob.size === 0) {
    throw new Error("Failed generating ZIP for complete project");
  }
  console.log(`  ✓ Complete Project ZIP generated successfully (${res1.blob.size} bytes, ${res1.changedFilesCount} files)`);

  // Test 2: Legacy or minimal project with missing optional fields (theme, serviceAreaCities, optimizationCycles, redirects, businessDetails)
  const legacyProject: any = {
    id: "test-legacy-2",
    name: "Legacy Plumbing Co",
    createdAt: Date.now(),
    files: [
      { path: "index.html", content: "<html><head><title>Legacy</title></head><body><h1>Legacy</h1></body></html>" },
    ],
    // missing theme, serviceAreaCities, keywordMap, businessDetails, optimizationCycles
  };

  const res2 = await generateWebsiteZIP(legacyProject, "full");
  if (!res2.blob || res2.blob.size === 0) {
    throw new Error("Failed generating ZIP for legacy project");
  }
  console.log(`  ✓ Legacy Project ZIP generated successfully with null fallbacks (${res2.blob.size} bytes, ${res2.changedFilesCount} files)`);

  // Test 3: Project Backup Export
  const backupBlob = await exportProjectBackup(legacyProject);
  if (!backupBlob || backupBlob.size === 0) {
    throw new Error("Failed generating backup blob");
  }
  console.log(`  ✓ Project Backup exported successfully (${backupBlob.size} bytes)`);

  // Test 4: Changed-files-only ZIP
  const resChanged = await generateWebsiteZIP(completeProject, "changed-only", Date.now() - 10000);
  console.log(`  ✓ Changed-files ZIP generated successfully (${resChanged.blob.size} bytes)`);

  console.log("=== All ZIP & Manager Resiliency Tests Passed! ===");
}

runZipAndManagerTest().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
