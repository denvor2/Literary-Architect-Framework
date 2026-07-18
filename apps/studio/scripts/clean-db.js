#!/usr/bin/env node

/**
 * Database Cleanup Script — Remove duplicate records
 * Usage: node scripts/clean-db.js
 *
 * Removes duplicate Plan records (keeps earliest by createdAt)
 * Fixes migration conflicts before prisma migrate dev
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanup() {
  try {
    console.log("🧹 Starting database cleanup...\n");

    // Step 1: Check for duplicate Plans
    console.log("📊 Checking Plan table for duplicates...");
    const planGroups = await prisma.plan.groupBy({
      by: ["name"],
      _count: { id: true },
      having: {
        id: { _gt: 1 },
      },
    });

    if (planGroups.length === 0) {
      console.log("✅ No duplicate Plans found");
    } else {
      console.log(`⚠️  Found ${planGroups.length} plan names with duplicates:`);
      planGroups.forEach((g) => console.log(`   - ${g.name}: ${g._count.id} records`));

      // Step 2: Delete duplicates (keep only the earliest)
      console.log("\n🗑️  Removing duplicate Plans (keeping earliest by createdAt)...");

      for (const group of planGroups) {
        const plans = await prisma.plan.findMany({
          where: { name: group.name },
          orderBy: { createdAt: "asc" },
        });

        if (plans.length > 1) {
          const keep = plans[0];
          const toDelete = plans.slice(1);

          console.log(`   ${group.name}:`);
          console.log(`     • Keep: ${keep.id} (${keep.createdAt.toISOString()})`);
          console.log(`     • Delete: ${toDelete.length} record(s)`);

          // Delete duplicates
          const deleteResult = await prisma.plan.deleteMany({
            where: {
              id: { in: toDelete.map((p) => p.id) },
            },
          });

          console.log(`     ✓ Deleted ${deleteResult.count} record(s)`);
        }
      }
    }

    // Step 3: Verify final state
    console.log("\n✅ Final Plan table state:");
    const finalPlans = await prisma.plan.findMany({
      select: { id: true, name: true, tier: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    });

    console.log(`   Total: ${finalPlans.length} records`);
    finalPlans.forEach((p) => {
      console.log(`   - ${p.name} (${p.tier}): ${p.id}`);
    });

    console.log("\n✅ Cleanup complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
