import type {
  CustomExpert,
  PublicExpert,
  UserPublicExpert,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

console.log("[customExpertRepository] Module loaded. prisma type:", typeof prisma);

export const customExpertRepository = {
  // ==================== ЛИЧНЫЕ ЭКСПЕРТЫ ====================

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

    // Проверить что эксперт существует и принадлежит пользователю (raw SQL)
    const expert = (await (prisma as any).$queryRaw`
      SELECT id, name, "systemPrompt", "typicalRequests", icon, "isPublic"
      FROM "CustomExpert"
      WHERE id = ${id} AND "userId" = ${userId} AND "deletedAt" IS NULL
    `) as Array<CustomExpert>;

    if (!expert.length) {
      throw new Error("Эксперт не найден или вы не владелец");
    }

    // Валидация
    if (data.name !== undefined) {
      if (!data.name || data.name.length > 50) {
        throw new Error("Имя должно быть 1-50 символов");
      }
      data.name = data.name.trim();

      // Проверить уникальность только если имя изменилось
      if (data.name !== expert[0].name) {
        const dup = (await (prisma as any).$queryRaw`
          SELECT id FROM "CustomExpert"
          WHERE "userId" = ${userId} AND name = ${data.name} AND id != ${id} AND "deletedAt" IS NULL
        `) as Array<{ id: string }>;

        if (dup.length > 0) {
          throw new Error(`Эксперт с именем "${data.name}" уже существует`);
        }
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
      if (!Array.isArray(data.typicalRequests)) {
        throw new Error("Типовые запросы должны быть массивом");
      }

      // Фильтруем пустые запросы
      const filtered = data.typicalRequests
        .map((r) => (typeof r === "string" ? r.trim() : ""))
        .filter((r) => r.length > 0);

      if (filtered.length > 10) {
        throw new Error("Максимум 10 типовых запросов");
      }

      // Валидируем каждый запрос
      filtered.forEach((req) => {
        if (req.length < 10 || req.length > 200) {
          throw new Error(`Каждый запрос должен быть 10-200 символов (получен: "${req}" - ${req.length} символов)`);
        }
      });

      data.typicalRequests = filtered;
    }

    // UPDATE с raw SQL
    const updates: string[] = [];
    const updateValues: any[] = [id];

    if (data.name !== undefined) {
      updates.push(`name = $${updateValues.length + 1}`);
      updateValues.push(data.name);
    }
    if (data.systemPrompt !== undefined) {
      updates.push(`"systemPrompt" = $${updateValues.length + 1}`);
      updateValues.push(data.systemPrompt);
    }
    if (data.typicalRequests !== undefined) {
      updates.push(`"typicalRequests" = $${updateValues.length + 1}`);
      updateValues.push(data.typicalRequests);
    }
    if (data.icon !== undefined) {
      updates.push(`icon = $${updateValues.length + 1}`);
      updateValues.push(data.icon);
    }
    if (data.isPublic !== undefined) {
      updates.push(`"isPublic" = $${updateValues.length + 1}`);
      updateValues.push(data.isPublic);
    }

    if (updates.length === 0) {
      return expert[0];
    }

    const currentExpert = expert[0];

    // UPDATE через raw SQL - обновляем все переданные поля
    await (prisma as any).$executeRaw`
      UPDATE "CustomExpert"
      SET
        name = ${data.name !== undefined ? data.name : currentExpert.name},
        "systemPrompt" = ${data.systemPrompt !== undefined ? data.systemPrompt : currentExpert.systemPrompt},
        "typicalRequests" = ${data.typicalRequests !== undefined ? data.typicalRequests : currentExpert.typicalRequests},
        icon = ${data.icon !== undefined ? data.icon : currentExpert.icon},
        "isPublic" = ${data.isPublic !== undefined ? data.isPublic : currentExpert.isPublic},
        "updatedAt" = NOW()
      WHERE id = ${id}
    `;

    // Вернуть обновленный объект
    return {
      ...currentExpert,
      ...data,
      updatedAt: new Date(),
    } as CustomExpert;
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

    if (excludeUserId) {
      return (await (prisma as any).$queryRaw`
        SELECT id, "creatorId", "originalId", name, "systemPrompt", "typicalRequests", icon, "createdAt", "updatedAt"
        FROM "PublicExpert"
        WHERE "creatorId" != ${excludeUserId}
        ORDER BY "createdAt" DESC
      `) as PublicExpert[];
    } else {
      return (await (prisma as any).$queryRaw`
        SELECT id, "creatorId", "originalId", name, "systemPrompt", "typicalRequests", icon, "createdAt", "updatedAt"
        FROM "PublicExpert"
        ORDER BY "createdAt" DESC
      `) as PublicExpert[];
    }
  },

  async getPublicExpert(id: string): Promise<PublicExpert | null> {
    if (!prisma) return null;

    const result = (await (prisma as any).$queryRaw`
      SELECT id, "creatorId", "originalId", name, "systemPrompt", "typicalRequests", icon, "createdAt", "updatedAt"
      FROM "PublicExpert"
      WHERE id = ${id}
    `) as PublicExpert[];

    return result.length > 0 ? result[0] : null;
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

    // Проверить что публичный эксперт существует (raw SQL)
    const publicExpert = (await (prisma as any).$queryRaw`
      SELECT id FROM "PublicExpert" WHERE id = ${publicId}
    `) as Array<{ id: string }>;

    if (!publicExpert.length) {
      throw new Error("Публичный эксперт не найден");
    }

    // Проверить что не добавлен уже
    const existing = (await (prisma as any).$queryRaw`
      SELECT id FROM "UserPublicExpert" WHERE "userId" = ${userId} AND "publicId" = ${publicId}
    `) as Array<{ id: string }>;

    if (existing.length > 0) {
      throw new Error("Этот эксперт уже добавлен");
    }

    // Generate ID
    const { customAlphabet } = await import("nanoid");
    const nanoid = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 21);
    const recordId = nanoid();

    // Create record (raw SQL)
    await (prisma as any).$executeRaw`
      INSERT INTO "UserPublicExpert" (id, "userId", "publicId", "createdAt", "updatedAt")
      VALUES (${recordId}, ${userId}, ${publicId}, NOW(), NOW())
    `;

    return {
      id: recordId,
      userId,
      publicId,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any;
  },

  async removePublicExpertFromMe(
    userId: string,
    publicId: string,
  ): Promise<void> {
    if (!prisma) throw new Error("Database connection unavailable");

    // Find record
    const record = (await (prisma as any).$queryRaw`
      SELECT id FROM "UserPublicExpert" WHERE "userId" = ${userId} AND "publicId" = ${publicId}
    `) as Array<{ id: string }>;

    if (!record.length) {
      throw new Error("Эксперт не найден в вашем списке");
    }

    // Delete record
    await (prisma as any).$executeRaw`
      DELETE FROM "UserPublicExpert" WHERE id = ${record[0].id}
    `;
  },
};
