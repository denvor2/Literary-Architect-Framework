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
 * GET /api/experts/public — List all public experts (excluding own)
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    // Public experts can be fetched by anyone, but we exclude own to avoid duplication

    const experts = user
      ? await customExpertRepository.loadPublicExperts(user.id)
      : await customExpertRepository.loadPublicExperts();

    return NextResponse.json({ experts });
  } catch (error) {
    console.error("GET /api/experts/public error:", error);
    return NextResponse.json({ error: "Failed to load public experts" }, { status: 500 });
  }
}
