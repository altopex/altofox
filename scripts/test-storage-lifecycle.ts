import { db } from "../lib/db";
import { tempStorage } from "../lib/storage/temp-storage";

async function runStorageLifecycleTests() {
  console.log("================================================================================");
  console.log("          RANKLOCAL — WEBSITE STORAGE & LIFECYCLE VERIFICATION SUITE            ");
  console.log("================================================================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${testName}`);
      if (details) console.error(`     Details: ${details}`);
      throw new Error(`Test failed: ${testName} - ${details || ""}`);
    }
  }

  // --- Test 1: System Data Preservation Audit ---
  console.log("\n[Test 1] Auditing System Data & Credentials Preservation...");
  const apiKeysCount = await db.apiKey.count();
  const templatesCount = await db.template.count();
  const projectsCountInitial = await db.project.count();
  const projectFilesCountInitial = await db.projectFile.count();

  assert(apiKeysCount > 0, "ApiKey records (API credentials) are 100% preserved", `Found ${apiKeysCount} keys`);
  assert(templatesCount >= 5, "Template records (Niche templates) are 100% preserved", `Found ${templatesCount} templates`);
  assert(projectsCountInitial === 0, "All previous generated website records were cleaned from db", `Projects in db: ${projectsCountInitial}`);
  assert(projectFilesCountInitial === 0, "All previous generated website files were cleaned from db", `Files in db: ${projectFilesCountInitial}`);

  // --- Test 2: Ephemeral Temporary Storage Lifecycle ---
  console.log("\n[Test 2] Testing Ephemeral Temporary Storage Manager...");
  const mockTempId = `temp-test-${Date.now()}`;
  const mockFiles = [
    { path: "index.html", content: "<!DOCTYPE html><html><body><h1>Home</h1></body></html>", mimeType: "text/html" },
    { path: "styles.css", content: "body { margin: 0; }", mimeType: "text/css" },
  ];

  tempStorage.register({
    id: mockTempId,
    name: "Dallas Roofing Pros",
    files: mockFiles,
    domain: "dallasroofingpros.com",
    themeName: "Modern Pro",
    ttlMs: 500, // 500ms short TTL for expiration test
  });

  assert(tempStorage.has(mockTempId), "TempStorage registers ephemeral generated website");
  const retrieved = tempStorage.get(mockTempId);
  assert(retrieved !== null && retrieved.files.length === 2, "TempStorage retrieves active temporary website with files");

  // Wait for TTL expiration
  await new Promise((r) => setTimeout(r, 600));
  const expired = tempStorage.get(mockTempId);
  assert(expired === null, "TempStorage automatically expires unsaved websites after TTL");

  // --- Test 3: Unsaved Generation by Default (Stateless API) ---
  console.log("\n[Test 3] Simulating Default Website Generation (Unsaved by Default)...");
  const generatePayload = {
    demo: true,
    formData: {
      businessName: "Lone Star Electricians",
      websiteDomain: "lonestarelectric.com",
      city: "Austin",
      stateRegion: "TX",
      businessType: "Electrician",
      keywords: "electrician austin, emergency electrician",
      targetKeywords: "electrician austin, emergency electrician",
    },
    saveToDb: false, // Default
  };

  // Import route directly to test API handler logic
  const { POST: generateRoute } = await import("../app/api/generate/route");
  const fakeReq = new Request("http://localhost:3000/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(generatePayload),
  });

  const genResponse = await generateRoute(fakeReq as any);
  const genData = await genResponse.json();

  assert(genData.success === true, "Website generation succeeded");
  assert(genData.isSaved === false, "Generated website is NOT saved to permanent database by default (isSaved: false)");
  assert(typeof genData.projectId === "string" && genData.projectId.startsWith("temp-"), "Generated website received ephemeral temporary ID");
  assert(Array.isArray(genData.files) && genData.files.length > 0, `Generated files returned in memory (${genData.files.length} files)`);

  // Verify that SQLite database was NOT touched
  const projectsAfterGen = await db.project.count();
  const filesAfterGen = await db.projectFile.count();
  assert(projectsAfterGen === 0, "Zero permanent project records were written to SQLite during generation");
  assert(filesAfterGen === 0, "Zero permanent project files were written to SQLite during generation");

  // Verify temporary store has the files for immediate preview and download
  assert(tempStorage.has(genData.projectId), "Temporary website is stored in ephemeral memory cache for Preview & Download");

  // --- Test 4: Download Unsaved Website from Ephemeral Storage ---
  console.log("\n[Test 4] Testing ZIP Download of Unsaved Website from TempStorage...");
  const { GET: downloadRoute } = await import("../app/api/projects/[id]/download/route");
  const downloadReq = new Request(`http://localhost:3000/api/projects/${genData.projectId}/download`);
  const downloadRes = await downloadRoute(downloadReq as any, { params: { id: genData.projectId } });

  assert(downloadRes.status === 200, "Download route returns 200 OK for unsaved ephemeral website");
  assert(downloadRes.headers.get("content-type") === "application/zip", "Download returns valid application/zip stream");
  assert(downloadRes.headers.get("x-storage-type") === "ephemeral-temp", "Download header confirms source is ephemeral-temp memory");

  // --- Test 5: Explicit Save Flow (User chooses 'Save for future optimization') ---
  console.log("\n[Test 5] Testing Explicit Save Endpoint (POST /api/projects/save)...");
  const { POST: saveRoute } = await import("../app/api/projects/save/route");
  const savePayload = {
    projectId: genData.projectId,
    name: "Lone Star Electricians",
    businessName: "Lone Star Electricians",
    domain: "lonestarelectric.com",
    themeName: "Modern Pro",
    niche: "Electrician",
    city: "Austin",
    state: "TX",
    services: ["Panel Upgrades", "Emergency Repairs", "Wiring"],
    keywords: ["electrician austin tx", "emergency electrical austin"],
    files: genData.files,
  };

  const saveReq = new Request("http://localhost:3000/api/projects/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(savePayload),
  });

  const saveRes = await saveRoute(saveReq as any);
  const saveData = await saveRes.json();

  assert(saveData.success === true, "Explicit project save returned success");
  assert(saveData.status === "saved", "Project status set to 'saved'");

  // Verify SQLite now contains exactly 1 project and its files
  const projectsAfterSave = await db.project.count();
  const filesAfterSave = await db.projectFile.count();
  assert(projectsAfterSave === 1, "Exactly 1 project record was created in SQLite after explicit user choice");
  assert(filesAfterSave === genData.files.length, `All ${genData.files.length} project files saved into SQLite`);

  const savedRecord = await db.project.findUnique({ where: { id: saveData.projectId } });
  assert(savedRecord !== null, "Saved project record exists in SQLite");
  const parsedNotes = JSON.parse(savedRecord?.notes || "{}");
  assert(parsedNotes.businessName === "Lone Star Electricians", "Saved project notes contains businessName metadata");
  assert(parsedNotes.domain === "lonestarelectric.com", "Saved project notes contains domain metadata");
  assert(Array.isArray(parsedNotes.services) && parsedNotes.services.length === 3, "Saved project notes contains services for future optimization");

  // Verify temporary store was cleaned up after save
  assert(!tempStorage.has(genData.projectId), "Temporary cache entry pruned after permanent save");

  // --- Test 6: Permanent Project Deletion (DELETE /api/projects/[id]) ---
  console.log("\n[Test 6] Testing Project Deletion (DELETE /api/projects/[id])...");
  const { DELETE: deleteRoute } = await import("../app/api/projects/[id]/route");
  const deleteReq = new Request(`http://localhost:3000/api/projects/${saveData.projectId}`, {
    method: "DELETE",
  });
  const deleteRes = await deleteRoute(deleteReq as any, { params: { id: saveData.projectId } });
  const deleteData = await deleteRes.json();

  assert(deleteData.success === true, "Project DELETE API returned success");

  // Verify SQLite is back to clean state
  const projectsAfterDelete = await db.project.count();
  const filesAfterDelete = await db.projectFile.count();
  assert(projectsAfterDelete === 0, "Project was removed from SQLite");
  assert(filesAfterDelete === 0, "Project files were cascaded and removed from SQLite");

  // Verify API credentials and system data remain 100% untouched
  const apiKeysFinal = await db.apiKey.count();
  const templatesFinal = await db.template.count();
  assert(apiKeysFinal === apiKeysCount, "ApiKey records remain 100% preserved after deletion");
  assert(templatesFinal === templatesCount, "Template records remain 100% preserved after deletion");

  console.log("\n================================================================================");
  console.log(`🎉 ALL ${passed}/${total} STORAGE LIFECYCLE TESTS PASSED (100%)!`);
  console.log("================================================================================");
}

runStorageLifecycleTests().catch((err) => {
  console.error("Storage lifecycle tests failed:", err);
  process.exit(1);
});
