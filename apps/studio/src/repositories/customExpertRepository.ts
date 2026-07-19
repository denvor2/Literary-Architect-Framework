import type {
  CustomExpert,
  PublicExpert,
  UserPublicExpert,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

console.log("[customExpertRepository] Module loaded. prisma type:", typeof prisma);

export const customExpertRepository = {
  // ==================== ЛИЧНЫЕ ЭКСПЕРТЫ ====================

  async loadMyExperts(userId: string): Promise<CustomExpert[]> {
    if (!prisma) throw new Error("Database connection unavailable");
    return prisma.customExpert.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "asc" },
    });
  },

  async createExpert(
    userId: string,
    name: string,
    systemPrompt: string,
    typicalRequests: string[],
    icon: string,
    isPublic: boolean,
  ): Promise<CustomExpert & { publicId?: string }> {
    if (!prisma) throw new Error("Database connection unavailable");

    // Валидация
    if (!name || name.trim().length < 1 || name.length > 50) {
      throw new Error("Имя эксперта должно быть от 1 до 50 символов");
    }
    if (
      !systemPrompt ||
      systemPrompt.trim().length < 10 ||
      systemPrompt.length > 5000
    ) {
      throw new Error("Промпт должен быть от 10 до 5000 символов");
    }
    if (!Array.isArray(typicalRequests) || typicalRequests.length > 10) {
      throw new Error("Максимум 10 типовых запросов");
    }
    typicalRequests.forEach((req) => {
      if (!req || req.length < 10 || req.length > 200) {
        throw new Error("Каждый запрос должен быть 10-200 символов");
      }
    });

    // Проверить уникальность имени using raw query since ORM model not available
    const { customAlphabet } = await import("nanoid");
    const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);

    const typicalRequestsArray = typicalRequests.map((r) => r.trim());

    const existingCheck = await (prisma as any).$queryRaw`
      SELECT id FROM "CustomExpert" WHERE "userId" = ${userId} AND name = ${name.trim()} AND "deletedAt" IS NULL
    ` as Array<{ id: string }>;
    if (existingCheck.length > 0) {
      throw new Error(`Эксперт с именем "${name}" уже существует`);
    }

    // Create using raw query
    const expertId = nanoid();

    await (prisma as any).$executeRaw`
      INSERT INTO "CustomExpert" (id, "userId", name, "systemPrompt", "typicalRequests", icon, "isPublic", "createdAt", "updatedAt")
      VALUES (${expertId}, ${userId}, ${name.trim()}, ${systemPrompt.trim()}, ${typicalRequestsArray}, ${icon || "🤖"}, ${isPublic}, NOW(), NOW())
    `;

    // If public, create copy
    let publicId: string | undefined;
    if (isPublic) {
      const pubId = nanoid();
      await (prisma as any).$executeRaw`
        INSERT INTO "PublicExpert" (id, "creatorId", "originalId", name, "systemPrompt", "typicalRequests", icon, "createdAt", "updatedAt")
        VALUES (${pubId}, ${userId}, ${expertId}, ${name.trim()}, ${systemPrompt.trim()}, ${typicalRequestsArray}, ${icon || "🤖"}, NOW(), NOW())
      `;
      publicId = pubId;
    }

    return {
      id: expertId,
      userId,
      name: name.trim(),
      systemPrompt: systemPrompt.trim(),
      typicalRequests: typicalRequests.map((r) => r.trim()),
      icon: icon || "🤖",
      isPublic,
      deletedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      publicId,
    } as any;
  },

  async updateExpert(
    id: string,
    userId: string,
    data: {
      name?: string;
      systemPrompt?: string;
      typicalRequests?: string[];
      icon?: string;
      isPublic?: boolean;
    },
  ): Promise<CustomExpert> {
    if (!prisma) throw new Error("Database connection unavailable");

    const expert = await prisma.customExpert.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!expert) {
      throw new Error("Эксперт не найден или вы не владелец");
    }

    // Валидация
    if (data.name !== undefined) {
      if (!data.name || data.name.length > 50) {
        throw new Error("Имя должно быть 1-50 символов");
      }
      data.name = data.name.trim();

      // Проверить уникальность
      const dup = await prisma.customExpert.findFirst({
        where: {
          userId,
          name: data.name,
          id: { not: id },
        },
      });
      if (dup) {
        throw new Error(`Эксперт с именем "${data.name}" уже существует`);
      }
    }

    if (data.systemPrompt !== undefined) {
      if (
        !data.systemPrompt ||
        data.systemPrompt.length < 10 ||
        data.systemPrompt.length > 5000
      ) {
        throw new Error("Промпт должен быть 10-5000 символов");
      }
      data.systemPrompt = data.systemPrompt.trim();
    }

    if (data.typicalRequests !== undefined) {
      if (
        !Array.isArray(data.typicalRequests) ||
        data.typicalRequests.length > 10
      ) {
        throw new Error("Максимум 10 типовых запросов");
      }
      data.typicalRequests = data.typicalRequests.map((r) => r.trim());
    }

    return prisma.customExpert.update({
      where: { id },
      data,
    });
  },

  async deleteExpert(id: string, userId: string): Promise<void> {
    if (!prisma) throw new Error("Database connection unavailable");

    // Check ownership
    const expert = (await (prisma as any).$queryRaw`
      SELECT id FROM "CustomExpert" WHERE id = ${id} AND "userId" = ${userId}
    `) as Array<{ id: string }>;

    if (!expert.length) {
      throw new Error("Эксперт не найден или вы не владелец");
    }

    // Soft delete
    await (prisma as any).$executeRaw`
      UPDATE "CustomExpert" SET "deletedAt" = NOW() WHERE id = ${id}
    `;
  },

  // ==================== ПУБЛИЧНЫЕ ЭКСПЕРТЫ ====================

  async loadPublicExperts(excludeUserId?: string): Promise<PublicExpert[]> {
    if (!prisma) throw new Error("Database connection unavailable");
    return prisma.publicExpert.findMany({
      where: excludeUserId ? { creatorId: { not: excludeUserId } } : undefined,
      orderBy: { createdAt: "desc" },
    });
  },

  async getPublicExpert(id: string): Promise<PublicExpert | null> {
    if (!prisma) return null;
    return prisma.publicExpert.findUnique({ where: { id } });
  },

  // ==================== МИНИ ЭКСПЕРТЫ (ДОБАВЛЕННЫЕ) ====================

  async loadMyAccessibleExperts(
    userId: string,
  ): Promise<(CustomExpert | PublicExpert)[]> {
    if (!prisma) throw new Error("Database connection unavailable");

    // Мои эксперты (raw SQL)
    const mine = (await (prisma as any).$queryRaw`
      SELECT id, "userId", name, "systemPrompt", "typicalRequests", icon, "isPublic", "deletedAt", "createdAt", "updatedAt"
      FROM "CustomExpert"
      WHERE "userId" = ${userId} AND "deletedAt" IS NULL
      ORDER BY "createdAt" ASC
    `) as CustomExpert[];

    // Добавленные от других
    const addedRecords = (await (prisma as any).$queryRaw`
      SELECT "publicId" FROM "UserPublicExpert" WHERE "userId" = ${userId}
    `) as Array<{ publicId: string }>;

    let added: PublicExpert[] = [];
    if (addedRecords.length > 0) {
      const addedIds = addedRecords.map((r) => r.publicId);
      // Use IN with placeholders for each ID
      const ids_str = addedIds.join(',');
      added = (await (prisma as any).$queryRaw`
        SELECT id, "creatorId", "originalId", name, "systemPrompt", "typicalRequests", icon, "createdAt", "updatedAt"
        FROM "PublicExpert"
        WHERE id = ANY(${addedIds}::text[])
      `) as PublicExpert[];
    }

    return [...mine, ...added];
  },

  async addPublicExpertToMe(
    userId: string,
    publicId: string,
  ): Promise<UserPublicExpert> {
    if (!prisma) throw new Error("Database connection unavailable");

    // Проверить что публичный эксперт существует
    const publicExpert = await prisma.publicExpert.findUnique({
      where: { id: publicId },
    });
    if (!publicExpert) {
      throw new Error("Публичный эксперт не найден");
    }

    // Проверить что не добавлен уже
    const existing = await prisma.userPublicExpert.findFirst({
      where: { userId, publicId },
    });
    if (existing) {
      throw new Error("Этот эксперт уже добавлен");
    }

    return prisma.userPublicExpert.create({
      data: { userId, publicId },
    });
  },

  async removePublicExpertFromMe(
    userId: string,
    publicId: string,
  ): Promise<void> {
    if (!prisma) throw new Error("Database connection unavailable");

    const record = await prisma.userPublicExpert.findFirst({
      where: { userId, publicId },
    });
    if (!record) {
      throw new Error("Эксперт не найден в вашем списке");
    }

    await prisma.userPublicExpert.delete({ where: { id: record.id } });
  },
};
