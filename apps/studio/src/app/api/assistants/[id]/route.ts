import { customAssistantRepository } from "@/repositories/customAssistantRepository";
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
 * PUT /api/assistants/:id — Update custom assistant
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

    // Verify ownership
    const owns = await customAssistantRepository.ownsAssistant(user.id, id);
    if (!owns) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { name, systemPrompt } = body;

    if (!name && !systemPrompt) {
      return NextResponse.json(
        { error: "At least one of name or systemPrompt must be provided" },
        { status: 400 },
      );
    }

    const data: { name?: string; systemPrompt?: string } = {};
    if (name !== undefined) data.name = name;
    if (systemPrompt !== undefined) data.systemPrompt = systemPrompt;

    const assistant = await customAssistantRepository.updateCustomAssistant(
      id,
      data,
    );

    return NextResponse.json(assistant);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update assistant";
    console.error("PUT /api/assistants/:id error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * DELETE /api/assistants/:id — Delete custom assistant
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

    // Verify ownership
    const owns = await customAssistantRepository.ownsAssistant(user.id, id);
    if (!owns) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await customAssistantRepository.deleteCustomAssistant(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete assistant";
    console.error("DELETE /api/assistants/:id error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
