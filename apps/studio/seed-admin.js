// Seed admin user with proper bcrypt hashing
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();

async function seedAdmin() {
  try {
    const email = "denvor2@gmail.com";
    const password = "Admin123";

    // Hash password with bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        passwordHash,
        role: "admin",
      },
      create: {
        email,
        passwordHash,
        role: "admin",
        updatedAt: new Date(),
      },
    });

    console.log("✅ Админ добавлен успешно!");
    console.log("");
    console.log("📧 Email:    denvor2@gmail.com");
    console.log("🔐 Password: Admin123");
    console.log("👤 Role:     admin");
    console.log("👤 ID:       " + user.id);
    console.log("");
    console.log("🌐 Откройте http://localhost:3000 и войдите");
  } catch (error) {
    console.error("❌ Ошибка:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
