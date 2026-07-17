import { PrismaClient, PlanTier } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

async function main() {
  console.log("🌱 Seeding tariff plans...");

  // Delete existing plans to avoid duplicates
  await prisma.plan.deleteMany({});

  const now = new Date();
  const plans = [
    {
      id: generateId(),
      name: "Free",
      tier: PlanTier.free,
      price: 0,
      billingPeriodDays: 30,
      maxAssistantRequests: 100,
      maxCharactersPerReq: 50000,
      features: ["basic_editing", "one_assistant"],
      description: "Для начинающих авторов",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: "Basic",
      tier: "basic" as const,
      price: 300,
      billingPeriodDays: 30,
      maxAssistantRequests: 300,
      maxCharactersPerReq: 100000,
      features: [
        "basic_editing",
        "three_assistants",
        "custom_prompts",
        "up_to_10_books",
      ],
      description: "Для активных авторов",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: "Pro",
      tier: "pro" as const,
      price: 500,
      billingPeriodDays: 30,
      maxAssistantRequests: 500,
      maxCharactersPerReq: 200000,
      features: [
        "advanced_editing",
        "five_assistants",
        "custom_prompts",
        "up_to_50_books",
        "priority_support",
      ],
      description: "Для профессиональных авторов",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: "Premium",
      tier: "premium" as const,
      price: 1000,
      billingPeriodDays: 30,
      maxAssistantRequests: 0,
      maxCharactersPerReq: 0,
      features: [
        "unlimited_editing",
        "ten_assistants",
        "custom_prompts",
        "unlimited_books",
        "priority_support",
        "advanced_analytics",
      ],
      description: "Для профессиональных издателей и авторов",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const plan of plans) {
    const created = await prisma.plan.create({
      data: plan,
    });
    console.log(`✅ Created plan: ${created.name} (${created.tier})`);
  }

  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
