#!/usr/bin/env node

/**
 * Database Backup Script — Export all data using Prisma
 * Usage: node scripts/backup-db.js
 * Output: db_backup_YYYYMMDD_HHMMSS.json
 */

const { PrismaClient } = require("../src/generated/prisma");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

async function backup() {
  try {
    console.log("📦 Starting database backup...");

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
    const backupFile = path.join(__dirname, `../db_backup_${timestamp}.json`);

    const data = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      tables: {},
    };

    // Backup all tables
    console.log("  • Users...");
    data.tables.users = await prisma.user.findMany();

    console.log("  • Books...");
    data.tables.books = await prisma.book.findMany();

    console.log("  • Chapters...");
    data.tables.chapters = await prisma.chapter.findMany();

    console.log("  • Scenes...");
    data.tables.scenes = await prisma.scene.findMany();

    console.log("  • Plans...");
    data.tables.plans = await prisma.plan.findMany();

    console.log("  • Series...");
    data.tables.series = await prisma.series.findMany();

    console.log("  • Characters...");
    data.tables.characters = await prisma.character.findMany();

    console.log("  • Ideas...");
    data.tables.ideas = await prisma.idea.findMany();

    console.log("  • UserSubscriptions...");
    data.tables.userSubscriptions = await prisma.userSubscription.findMany();

    console.log("  • Events...");
    data.tables.events = await prisma.event.findMany();

    console.log("  • Payments...");
    data.tables.payments = await prisma.payment.findMany();

    // Write backup file
    fs.writeFileSync(backupFile, JSON.stringify(data, null, 2));

    const sizeKB = (fs.statSync(backupFile).size / 1024).toFixed(2);
    console.log(`\n✅ Backup complete: ${backupFile}`);
    console.log(`   Size: ${sizeKB} KB`);
    console.log(`   Records: Users=${data.tables.users.length}, Books=${data.tables.books.length}, Plans=${data.tables.plans.length}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Backup failed:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

backup();
