// Sprint-25-Step-03 (ADR-0013): repository for the per-AssistantMode
// settings row (displayName/promptSuffix/typicalRequests) — instance-wide,
// NOT per Book/User (see schema.prisma's AssistantSettings model comment).
// Same shape as bookRepository.ts/userRepository.ts: no HTTP here, no
// domain-model coupling — just Prisma in, plain data out.

import { prisma } from "@/lib/db";
import { AssistantRole } from "@/generated/prisma/client";
import type { AssistantSettings as PrismaAssistantSettings } from "@/generated/prisma/client";

export type AssistantSettingsRecord = {
  mode: AssistantRole;
  displayName: string | null;
  promptSuffix: string | null;
  typicalRequests: string[];
};

function toRecord(row: PrismaAssistantSettings): AssistantSettingsRecord {
  return {
    mode: row.mode,
    displayName: row.displayName,
    promptSuffix: row.promptSuffix,
    typicalRequests: row.typicalRequests,
  };
}

// Absence of a row for a mode is a normal, expected state (no one has
// customized that mode yet) — represented as `null`, not an error. Callers
// (route.ts files, /api/assistant-settings) must treat `null` as "use the
// existing hardcoded default", per the Step Card's backward-compatibility
// rule.
export async function getAssistantSettings(
  mode: AssistantRole,
): Promise<AssistantSettingsRecord | null> {
  if (!prisma) {
    throw new Error(
      "Database connection unavailable. Cannot retrieve assistant settings.",
    );
  }
  const row = await prisma.assistantSettings.findUnique({ where: { mode } });
  return row ? toRecord(row) : null;
}

export async function getAllAssistantSettings(): Promise<
  Record<AssistantRole, AssistantSettingsRecord | null>
> {
  if (!prisma) {
    throw new Error(
      "Database connection unavailable. Cannot retrieve assistant settings.",
    );
  }
  const rows = await prisma.assistantSettings.findMany();
  const map: Record<AssistantRole, AssistantSettingsRecord | null> = {
    coauthor: null,
    editor: null,
    critic: null,
    reader: null,
  };
  for (const row of rows) {
    map[row.mode] = toRecord(row);
  }
  return map;
}

export async function upsertAssistantSettings(
  mode: AssistantRole,
  data: {
    displayName: string | null;
    promptSuffix: string | null;
    typicalRequests: string[];
  },
): Promise<AssistantSettingsRecord> {
  if (!prisma) {
    throw new Error(
      "Database connection unavailable. Cannot save assistant settings.",
    );
  }
  const { customAlphabet } = await import("nanoid");
  const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);
  const row = await prisma.assistantSettings.upsert({
    where: { mode },
    create: { id: nanoid(), mode, ...data, updatedAt: new Date() },
    update: { ...data, updatedAt: new Date() },
  });
  return toRecord(row);
}
