import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    // Find admin user
    let user = await prisma.user.findFirst();
    
    if (!user) {
      console.log("No users found, creating admin...");
      user = await prisma.user.create({
        data: {
          email: "admin@test.com",
          password: "hashed",
          role: "admin",
        },
      });
    }

    console.log("User:", user.email, "(id:", user.id + ")");

    // Check all books
    const allBooks = await prisma.book.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        title: true,
        deletedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("\n=== BOOKS ===");
    console.log("Total:", allBooks.length);
    
    const active = allBooks.filter(b => !b.deletedAt);
    const deleted = allBooks.filter(b => b.deletedAt);
    
    console.log(`\nActive (${active.length}):`);
    active.forEach(b => console.log(`  • ${b.title}`));
    
    console.log(`\nDeleted/Trash (${deleted.length}):`);
    deleted.forEach(b => console.log(`  • ${b.title} (deleted at: ${b.deletedAt})`));
    
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(console.error);
