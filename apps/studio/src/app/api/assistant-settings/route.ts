import { NextResponse } from "next/server";
import { AssistantRole } from "@/generated/prisma/client";
import {
  getAllAssistantSettings,
  upsertAssistantSettings,
} from "@/repositories";

// Sprint-25-Step-03 (ADR-0013): thin REST endpoint over the AssistantSettings
// repository — a plain CRUD surface, not an AI call, so it deliberately does
// NOT go through the AI Bus (ai/aiBus.ts, ai/operations.ts stay untouched by
// this step). One record per AssistantMode (coauthor/editor/critic/reader),
// instance-wide — see schema.prisma's AssistantSettings model comment.
//
// No auth/permission check of any kind (ADR-0013's "Implementation
// constraint for Sprint 25 Step 03" — the current single user has full,
// Admin-equivalent access; there is no second role to gate against yet).
// Do not add one ahead of Sprint 29/ADR-0015.

const VALID_MODES = new Set<string>(Object.values(AssistantRole));

export async function GET() {
  try {
    const settings = await getAllAssistantSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const mode = body?.mode;

  if (typeof mode !== "string" || !VALID_MODES.has(mode)) {
    return NextResponse.json(
      {
        ok: false,
        error: `mode must be one of: ${Array.from(VALID_MODES).join(", ")}.`,
      },
      { status: 400 },
    );
  }

  const displayName =
    typeof body?.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim()
      : null;
  const promptSuffix =
    typeof body?.promptSuffix === "string" && body.promptSuffix.trim()
      ? body.promptSuffix.trim()
      : null;
  const typicalRequests: string[] = Array.isArray(body?.typicalRequests)
    ? body.typicalRequests
        .filter((item: unknown): item is string => typeof item === "string")
        .map((item: string) => item.trim())
        .filter((item: string) => item.length > 0)
    : [];

  try {
    const settings = await upsertAssistantSettings(mode as AssistantRole, {
      displayName,
      promptSuffix,
      typicalRequests,
    });
    return NextResponse.json({ ok: true, settings });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}
