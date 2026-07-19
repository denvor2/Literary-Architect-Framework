import { extractToken, verifyJWT } from "@/lib/auth";
import { getUserById } from "@/repositories/userRepository";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

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
 * GET /api/user/assistant-preferences — Get user's last selected mode/expert
 */
export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[assistant-preferences GET] user fields:", {
      id: user.id,
      lastSelectedMode: user.lastSelectedMode,
      lastSelectedExpertId: user.lastSelectedExpertId,
      allUserKeys: Object.keys(user),
    });

    const response = {
      lastSelectedMode: user.lastSelectedMode || "coauthor",
      lastSelectedExpertId: user.lastSelectedExpertId || null,
    };
    console.log("[assistant-preferences GET] response:", response);

    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/user/assistant-preferences error:", error);
    return NextResponse.json(
      { error: "Failed to load preferences" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/user/assistant-preferences — Save user's selected mode/expert
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { lastSelectedMode, lastSelectedExpertId } = body;

    // Validate mode if provided
    const validModes = ["coauthor", "editor", "critic", "reader"];
    if (lastSelectedMode && !validModes.includes(lastSelectedMode)) {
      return NextResponse.json(
        { error: "Invalid mode" },
        { status: 400 }
      );
    }

    // Update user preferences using raw SQL to bypass ORM issues
    console.log("[assistant-preferences PUT] Сохраняем:", {
      userId: user.id,
      lastSelectedMode,
      lastSelectedExpertId,
    });

    // Прочитаем ПЕРЕД update
    const beforeUpdate = await (prisma as any).$queryRaw`
      SELECT "lastSelectedMode", "lastSelectedExpertId" FROM "User" WHERE id = ${user.id}
    ` as Array<{ lastSelectedMode: string | null; lastSelectedExpertId: string | null }>;
    console.log("[assistant-preferences PUT] ПЕРЕД UPDATE:", beforeUpdate[0]);

    console.log("[assistant-preferences PUT] UPDATE parameters:", {
      mode: lastSelectedMode || "coauthor",
      expertId: lastSelectedExpertId,
      userId: user.id,
    });

    // Явно передаём значения для UPDATE
    const modeToSave = lastSelectedMode || "coauthor";
    const expertIdToSave = lastSelectedExpertId; // может быть null или string

    await (prisma as any).$executeRaw`
      UPDATE "User"
      SET "lastSelectedMode" = ${modeToSave},
          "lastSelectedExpertId" = ${expertIdToSave}
      WHERE id = ${user.id}
    `;

    // Прочитаем ПОСЛЕ update
    const afterUpdate = await (prisma as any).$queryRaw`
      SELECT "lastSelectedMode", "lastSelectedExpertId" FROM "User" WHERE id = ${user.id}
    ` as Array<{ lastSelectedMode: string | null; lastSelectedExpertId: string | null }>;
    console.log("[assistant-preferences PUT] ПОСЛЕ UPDATE:", afterUpdate[0]);

    return NextResponse.json({
      lastSelectedMode: lastSelectedMode || "coauthor",
      lastSelectedExpertId: lastSelectedExpertId || null,
    });
  } catch (error) {
    console.error("PUT /api/user/assistant-preferences error:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}
