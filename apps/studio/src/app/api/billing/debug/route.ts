import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    if (!prisma) {
      return NextResponse.json(
        { error: "Database unavailable" },
        { status: 503 },
      );
    }

    const allPlans = await prisma.plan.findMany({
      orderBy: { price: "asc" },
    });

    return NextResponse.json({
      total: allPlans.length,
      plans: allPlans.map((p) => ({
        id: p.id,
        name: p.name,
        tier: p.tier,
        price: p.price,
        isActive: p.isActive,
        maxAssistantRequests: p.maxAssistantRequests,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
