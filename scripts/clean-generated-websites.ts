import { db } from "../lib/db";

async function cleanGeneratedWebsites() {
  console.log("================================================================================");
  console.log("              RANKLOCAL — DATABASE GENERATED DATA CLEANUP                       ");
  console.log("================================================================================");

  // 1. Audit current counts before cleanup
  const apiKeysCountBefore = await db.apiKey.count();
  const templatesCountBefore = await db.template.count();
  const projectsCountBefore = await db.project.count();
  const projectFilesCountBefore = await db.projectFile.count();
  const downloadTokensCountBefore = await db.downloadToken.count();

  console.log("\n[Pre-Cleanup Database Audit]");
  console.log(`  - ApiKey records (API Providers & Keys): ${apiKeysCountBefore} (MUST PRESERVE)`);
  console.log(`  - Template records (Built-in Niche Templates): ${templatesCountBefore} (MUST PRESERVE)`);
  console.log(`  - Project records (Generated Websites): ${projectsCountBefore} (TARGET FOR CLEANUP)`);
  console.log(`  - ProjectFile records (Generated Files/Assets): ${projectFilesCountBefore} (TARGET FOR CLEANUP)`);
  console.log(`  - DownloadToken records (Temporary Tokens): ${downloadTokensCountBefore} (TARGET FOR CLEANUP)`);

  if (projectsCountBefore === 0 && projectFilesCountBefore === 0 && downloadTokensCountBefore === 0) {
    console.log("\n✅ Database is already clean. No generated website records found.");
    return;
  }

  // 2. Perform safe, scoped deletion of generated website data ONLY
  console.log("\n[Cleaning Generated Website Data...]");

  // A. Delete ProjectFiles (HTML, CSS, JS, SVG, and binary assets)
  const deletedFiles = await db.projectFile.deleteMany({});
  console.log(`  ✓ Safely deleted ${deletedFiles.count} ProjectFile record(s).`);

  // B. Delete DownloadTokens
  const deletedTokens = await db.downloadToken.deleteMany({});
  console.log(`  ✓ Safely deleted ${deletedTokens.count} DownloadToken record(s).`);

  // C. Delete Projects
  const deletedProjects = await db.project.deleteMany({});
  console.log(`  ✓ Safely deleted ${deletedProjects.count} Project record(s).`);

  // 3. Post-cleanup verification
  const apiKeysCountAfter = await db.apiKey.count();
  const templatesCountAfter = await db.template.count();
  const projectsCountAfter = await db.project.count();
  const projectFilesCountAfter = await db.projectFile.count();
  const downloadTokensCountAfter = await db.downloadToken.count();

  console.log("\n[Post-Cleanup Verification]");
  console.log(`  - ApiKey records: ${apiKeysCountAfter} (Preserved: ${apiKeysCountAfter === apiKeysCountBefore ? "YES" : "NO"})`);
  console.log(`  - Template records: ${templatesCountAfter} (Preserved: ${templatesCountAfter === templatesCountBefore ? "YES" : "NO"})`);
  console.log(`  - Project records: ${projectsCountAfter} (Expected: 0)`);
  console.log(`  - ProjectFile records: ${projectFilesCountAfter} (Expected: 0)`);
  console.log(`  - DownloadToken records: ${downloadTokensCountAfter} (Expected: 0)`);

  if (apiKeysCountAfter !== apiKeysCountBefore) {
    throw new Error("CRITICAL SAFETY VIOLATION: ApiKey records were modified or deleted!");
  }
  if (templatesCountAfter !== templatesCountBefore) {
    throw new Error("CRITICAL SAFETY VIOLATION: Template records were modified or deleted!");
  }
  if (projectsCountAfter !== 0 || projectFilesCountAfter !== 0 || downloadTokensCountAfter !== 0) {
    throw new Error("Cleanup verification failed: Remaining generated website records found.");
  }

  console.log("\n================================================================================");
  console.log("🎉 DATABASE CLEANUP COMPLETED SAFELY AND SUCCESSFULLY!");
  console.log("   - All generated website files and projects were removed.");
  console.log("   - All API credentials, templates, and application settings remain 100% intact.");
  console.log("================================================================================");
}

cleanGeneratedWebsites().catch((err) => {
  console.error("Cleanup error:", err);
  process.exit(1);
});
