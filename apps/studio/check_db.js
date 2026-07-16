const path = require("path");
process.env.DATABASE_URL = "file:./prisma/dev.db";

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  try {
    let user = await prisma.user.findFirst();

    if (!user) {
      console.log("❌ No users found in database");
      return;
    }

    console.log("👤 User:", user.email);

    const allBooks = await prisma.book.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        deletedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("\n📚 === BOOKS ===");
    const active = allBooks.filter((b) => !b.deletedAt);
    const deleted = allBooks.filter((b) => b.deletedAt);

    console.log(`Active: ${active.length}, Deleted: ${deleted.length}`);
    console.log("\nActive:");
    active.forEach((b) => console.log(`  • ${b.title}`));
    console.log("\nTrash:");
    if (deleted.length === 0) console.log("  (empty)");
    deleted.forEach((b) => console.log(`  • ${b.title}`));
  } catch (e) {
    console.error("Error:", e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
