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
 * GET /api/assistants — List all custom assistants for current user
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const assistants = await customAssistantRepository.loadCustomAssistants(
      user.id,
    );
    return NextResponse.json({ assistants });
  } catch (error) {
    console.error("GET /api/assistants error:", error);
    return NextResponse.json(
      { error: "Failed to load assistants" },
      { status: 500 },
    );
  }
}

/**
 * POST /api/assistants — Create new custom assistant
 */
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, systemPrompt } = body;

    if (!name || !systemPrompt) {
      return NextResponse.json(
        { error: "name and systemPrompt are required" },
        { status: 400 },
      );
    }

    const assistant = await customAssistantRepository.createCustomAssistant(
      user.id,
      name,
      systemPrompt,
    );

    return NextResponse.json(assistant, { status: 201 });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create assistant";
    console.error("POST /api/assistants error:", message);
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
