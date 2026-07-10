// Sprint-24-Step-03: user repository — the single-user stopgap from
// ADR-0012 Decision 1 ("User Model — Temporary Single-User Stopgap").
//
// The app has no authentication. `getOrCreateDefaultUser()` is the literal
// strategy ADR-0012 fixed: find the existing user (the first one, by
// `createdAt`) or create one if the `User` table is empty. Do not extend
// this into a real multi-user lookup — the ADR names Sprint 28/29 as the
// point where this whole stopgap gets replaced, not incrementally grown.

import { prisma } from "@/lib/db";
import type { User } from "@/generated/prisma/client";

export async function getOrCreateDefaultUser(): Promise<User> {
  const existingUser = await prisma.user.findFirst({
    orderBy: { createdAt: "asc" },
  });
  if (existingUser) {
    return existingUser;
  }
  return prisma.user.create({ data: {} });
}
