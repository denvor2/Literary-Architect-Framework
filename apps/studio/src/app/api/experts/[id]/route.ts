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
 * PUT /api/experts/:id — Update expert
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, systemPrompt, typicalRequests, icon, isPublic } = body;

    const data: Record<string, unknown> = {};
    if (name !== undefined && name) data.name = name;
    if (systemPrompt !== undefined && systemPrompt) data.systemPrompt = systemPrompt;
    if (typicalRequests !== undefined && Array.isArray(typicalRequests)) data.typicalRequests = typicalRequests;
    if (icon !== undefined && icon) data.icon = icon;
    if (isPublic !== undefined) data.isPublic = isPublic;

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { error: "At least one field must be provided" },
        { status: 400 },
      );
    }

    const expert = await customExpertRepository.updateExpert(id, user.id, data);

    return NextResponse.json(expert);
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Failed to update expert";
    const isConstraintError = errorMsg.includes("duplicate key") || errorMsg.includes("23505");

    let message = errorMsg;
    if (isConstraintError) {
      message = "Эксперт с таким именем уже существует у вас";
    }

    console.error("PUT /api/experts/:id error:", {
      message: errorMsg,
      isConstraint: isConstraintError,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * DELETE /api/experts/:id — Delete expert (soft delete)
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

    await customExpertRepository.deleteExpert(id, user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete expert";
    console.error("DELETE /api/experts/:id error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
