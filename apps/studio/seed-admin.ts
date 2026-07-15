import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import * as bcrypt from "bcrypt";
import { randomUUID } from "crypto";

async function seedAdmin() {
  const connectionString = process.env.DATABASE_URL || "postgresql://literary:literary@127.0.0.1:5432/literary_studio?schema=public";

  const adapter = new PrismaPg({ connectionString });
  const prisma = new PrismaClient({ adapter });

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
        id: randomUUID(),
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
    console.error("❌ Ошибка:", error instanceof Error ? error.message : String(error));
  } finally {
    await prisma.$disconnect();
  }
}

seedAdmin();
