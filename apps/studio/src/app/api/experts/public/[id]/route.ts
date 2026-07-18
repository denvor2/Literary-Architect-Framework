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
 * POST /api/experts/public/:id — Add public expert to my list
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const record = await customExpertRepository.addPublicExpertToMe(user.id, id);

    return NextResponse.json({ success: true, record }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to add expert";
    console.error("POST /api/experts/public/:id error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * DELETE /api/experts/public/:id — Remove public expert from my list
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await customExpertRepository.removePublicExpertFromMe(user.id, id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to remove expert";
    console.error("DELETE /api/experts/public/:id error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
