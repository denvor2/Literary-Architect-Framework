import type {
  CustomExpert,
  PublicExpert,
  UserPublicExpert,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

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

    // Проверить уникальность имени
    const existing = await prisma.customExpert.findFirst({
      where: { userId, name: name.trim(), deletedAt: null },
    });
    if (existing) {
      throw new Error(`Эксперт с именем "${name}" уже существует`);
    }

    // Создать эксперта
    const expert = await prisma.customExpert.create({
      data: {
        userId,
        name: name.trim(),
        systemPrompt: systemPrompt.trim(),
        typicalRequests: typicalRequests.map((r) => r.trim()),
        icon: icon || "🤖",
        isPublic,
      },
    });

    // Если публичный — создать копию в PublicExpert
    let publicId: string | undefined;
    if (isPublic) {
      try {
        const publicExpert = await prisma.publicExpert.create({
          data: {
            creatorId: userId,
            originalId: expert.id,
            name: expert.name,
            systemPrompt: expert.systemPrompt,
            typicalRequests: expert.typicalRequests,
            icon: expert.icon,
          },
        });
        publicId = publicExpert.id;
      } catch (error) {
        console.error("[createExpert] Failed to create public expert:", error);
        throw error;
      }
    }

    return { ...expert, publicId };
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

    const expert = await prisma.customExpert.findFirst({
      where: { id, userId },
    });
    if (!expert) {
      throw new Error("Эксперт не найден или вы не владелец");
    }

    // Soft delete
    await prisma.customExpert.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
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

    // Мои эксперты
    const mine = await prisma.customExpert.findMany({
      where: { userId, deletedAt: null },
    });

    // Добавленные от других
    const addedRecords = await prisma.userPublicExpert.findMany({
      where: { userId },
    });

    const addedIds = addedRecords.map((r) => r.publicId);
    const added =
      addedIds.length > 0
        ? await prisma.publicExpert.findMany({
            where: { id: { in: addedIds } },
          })
        : [];

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
