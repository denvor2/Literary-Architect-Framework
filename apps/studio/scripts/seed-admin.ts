import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const email = "denvor2@gmail.com";
  const password = "Admin123";

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create or update admin user
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      passwordHash: hashedPassword,
      role: "admin",
      isBlocked: false,
    },
    create: {
      email,
      passwordHash: hashedPassword,
      role: "admin",
      isBlocked: false,
    },
  });

  console.log("✅ Admin user created/updated:");
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Password: ${password}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log("\n✅ Done!");
  })
  .catch(async (e) => {
    console.error("❌ Error:", e);
    await prisma.$disconnect();
    process.exit(1);
  });
