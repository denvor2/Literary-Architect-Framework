#!/usr/bin/env node

/**
 * Database Restore Script — Restore data from backup
 * Usage: node scripts/restore-db.js [backup_file.json]
 * If no file specified, uses most recent backup
 */

const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const glob = require("glob");

const prisma = new PrismaClient();

async function restore(backupFile) {
  try {
    console.log("📂 Database Restore\n");

    // Find backup file
    let filepath = backupFile;
    if (!filepath) {
      const backups = glob
        .sync(path.join(__dirname, "../db_backup_*.json"))
        .sort()
        .reverse();

      if (backups.length === 0) {
        console.error("❌ No backup files found in apps/studio/");
        process.exit(1);
      }

      filepath = backups[0];
      console.log(`📦 Using most recent backup: ${path.basename(filepath)}\n`);
    }

    // Read backup
    if (!fs.existsSync(filepath)) {
      console.error(`❌ Backup file not found: ${filepath}`);
      process.exit(1);
    }

    const backup = JSON.parse(fs.readFileSync(filepath, "utf-8"));
    console.log(`✅ Loaded backup from ${path.basename(filepath)}`);
    console.log(`   Timestamp: ${backup.timestamp}`);
    console.log(`   Version: ${backup.version}\n`);

    // Restore tables
    console.log("🔄 Restoring data...");

    // Note: We clear the tables first to avoid duplicates
    // This assumes referential integrity won't be violated
    const tables = [
      { name: "events", model: prisma.event },
      { name: "payments", model: prisma.payment },
      { name: "userSubscriptions", model: prisma.userSubscription },
      { name: "ideas", model: prisma.idea },
      { name: "characters", model: prisma.character },
      { name: "scenes", model: prisma.scene },
      { name: "chapters", model: prisma.chapter },
      { name: "series", model: prisma.series },
      { name: "plans", model: prisma.plan },
      { name: "books", model: prisma.book },
      { name: "users", model: prisma.user },
    ];

    for (const table of tables) {
      if (backup.tables[table.name]) {
        const records = backup.tables[table.name];
        console.log(
          `  • ${table.name}: ${records.length} record(s)`,
        );

        // Clear existing data
        await table.model.deleteMany({});

        // Restore data
        if (records.length > 0) {
          // Use raw create for bulk insert
          for (const record of records) {
            try {
              await table.model.create({ data: record });
            } catch (e) {
              console.warn(`    ⚠️  Skipped record in ${table.name}: ${e.message}`);
            }
          }
        }
      }
    }

    console.log("\n✅ Restore complete!");

    // Summary
    const counts = await Promise.all([
      prisma.user.count(),
      prisma.book.count(),
      prisma.chapter.count(),
      prisma.scene.count(),
      prisma.plan.count(),
    ]);

    console.log("\nFinal state:");
    console.log(`  • Users: ${counts[0]}`);
    console.log(`  • Books: ${counts[1]}`);
    console.log(`  • Chapters: ${counts[2]}`);
    console.log(`  • Scenes: ${counts[3]}`);
    console.log(`  • Plans: ${counts[4]}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Restore failed:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const backupFile = process.argv[2];
restore(backupFile);
