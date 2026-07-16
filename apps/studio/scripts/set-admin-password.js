const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

async function setAdminPassword() {
  const prisma = new PrismaClient();

  try {
    const password = "127273";
    const hashedPassword =
      "$2b$10$lRcQx8P5nfCDQf0CZFoeIeQDzKcY1a9O8awaYL/V.VEzSCWXphUjC";

    const user = await prisma.user.update({
      where: { email: "admin@localhost" },
      data: { passwordHash: hashedPassword },
    });

    console.log("✅ Admin password set successfully!");
    console.log("Email: admin@localhost");
    console.log("Password: 127273");
    console.log("Role:", user.role);
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

setAdminPassword();
