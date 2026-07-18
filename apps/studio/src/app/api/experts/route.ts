import { customExpertRepository } from "@/repositories/customExpertRepository";
import { extractToken, verifyJWT } from "@/lib/auth";
import { getUserById } from "@/repositories/userRepository";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

async function getCurrentUser(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return null;

  const payload = await verifyJWT(token);
  if (!payload) return null;

  const user = await getUserById(payload.sub);
  if (!user || user.isBlocked) return null;

  return user;
}

/**
 * GET /api/experts — List all accessible experts (own + added public)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const experts = await customExpertRepository.loadMyAccessibleExperts(
      user.id,
    );
    return NextResponse.json({ experts });
  } catch (error) {
    console.error("GET /api/experts error:", error);
    return NextResponse.json(
      { error: "Failed to load experts" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/experts — Create new expert
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, systemPrompt, typicalRequests, icon, isPublic } = body;

    if (!name || !systemPrompt) {
      return NextResponse.json(
        { error: "name and systemPrompt are required" },
        { status: 400 },
      );
    }

    const expert = await customExpertRepository.createExpert(
      user.id,
      name,
      systemPrompt,
      typicalRequests || [],
      icon || "🤖",
      isPublic || false,
    );

    return NextResponse.json(expert, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create expert";
    console.error("POST /api/experts error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
