import { db } from "../lib/db";
import bcrypt from "bcryptjs";

export async function seedUsers() {
  console.log("Seeding persistent local user accounts...");

  // 1. Owner account: russ@altopex.com
  const ownerEmail = "russ@altopex.com";
  const ownerExisting = await db.user.findUnique({ where: { email: ownerEmail } });

  // Use existing password hash or hash the owner password
  const ownerPassword = process.env.OWNER_PASSWORD || "AltofoxRuss2026!#";
  const ownerHash = bcrypt.hashSync(ownerPassword, 10);

  if (!ownerExisting) {
    const owner = await db.user.create({
      data: {
        id: "usr-owner-russ-altopex",
        email: ownerEmail,
        passwordHash: ownerHash,
        fullName: "Russell",
        role: "owner",
        status: "approved",
        companyName: "Altopex",
        plan: "unlimited",
        websiteLimit: 999999,
      },
    });
    console.log(`✓ Owner account created in database: ${owner.email} (${owner.id}) [Role: ${owner.role}]`);
  } else {
    // Ensure owner privileges and password hash are current
    const updated = await db.user.update({
      where: { email: ownerEmail },
      data: {
        role: "owner",
        status: "approved",
        plan: "unlimited",
        websiteLimit: 999999,
        passwordHash: ownerHash,
      },
    });
    console.log(`✓ Owner account updated/verified in database: ${updated.email} [Role: ${updated.role}]`);
  }

  // 2. Secondary existing test user: team@ranklocal.site (for regression testing)
  const teamEmail = "team@ranklocal.site";
  const teamExisting = await db.user.findUnique({ where: { email: teamEmail } });
  const teamHash = bcrypt.hashSync("RankLocalTeam2026!#", 10);

  if (!teamExisting) {
    const teamUser = await db.user.create({
      data: {
        id: "usr-team-editor-01",
        email: teamEmail,
        passwordHash: teamHash,
        fullName: "RankLocal Editor",
        role: "editor",
        status: "approved",
        companyName: "RankLocal Services",
        plan: "starter",
        websiteLimit: 5,
      },
    });
    console.log(`✓ Secondary user created: ${teamUser.email} (${teamUser.id}) [Role: ${teamUser.role}]`);
  }

  const userCount = await db.user.count();
  console.log(`Total verified user records in database: ${userCount}`);
}

if (require.main === module || process.argv[1]?.endsWith("seed-users.ts")) {
  seedUsers()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error("User seed error:", err);
      process.exit(1);
    });
}
