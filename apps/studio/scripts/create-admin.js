#!/usr/bin/env node

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = "denvor2@gmail.com";
    const password = "Dnvor127273";

    // Check if already exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      console.log(`❌ User ${email} already exists`);
      process.exit(1);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "admin",
        isBlocked: false,
      },
    });

    console.log(`✅ Admin created successfully!`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   ID: ${admin.id}`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
