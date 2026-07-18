import type { CustomAssistant } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export const customAssistantRepository = {
  /**
   * Загрузить все пользовательские помощники пользователя
   */
  async loadCustomAssistants(userId: string): Promise<CustomAssistant[]> {
    if (!prisma) throw new Error("Database connection unavailable");
    return prisma.customAssistant.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
  },

  /**
   * Создать нового пользовательского помощника
   */
  async createCustomAssistant(
    userId: string,
    name: string,
    systemPrompt: string,
  ): Promise<CustomAssistant> {
    // Валидация
    if (!name || name.trim().length === 0 || name.length > 50) {
      throw new Error("Имя помощника должно быть от 1 до 50 символов");
    }
    if (
      !systemPrompt ||
      systemPrompt.trim().length < 10 ||
      systemPrompt.length > 5000
    ) {
      throw new Error("Промпт должен быть от 10 до 5000 символов");
    }

    // Проверить уникальность имени для пользователя
    if (!prisma) throw new Error("Database connection unavailable");
    const existing = await prisma.customAssistant.findFirst({
      where: { userId, name: name.trim() },
    });

    if (existing) {
      throw new Error(`Помощник с именем "${name}" уже существует`);
    }

    return prisma!.customAssistant.create({
      data: {
        userId,
        name: name.trim(),
        systemPrompt: systemPrompt.trim(),
      },
    });
  },

  /**
   * Обновить пользовательского помощника
   */
  async updateCustomAssistant(
    id: string,
    data: {
      name?: string;
      systemPrompt?: string;
    },
  ): Promise<CustomAssistant> {
    if (!prisma) throw new Error("Database connection unavailable");

    // Валидация имени если обновляется
    if (data.name !== undefined) {
      if (!data.name || data.name.length > 50) {
        throw new Error("Имя помощника должно быть от 1 до 50 символов");
      }
      data.name = data.name.trim();
    }

    // Валидация промпта если обновляется
    if (data.systemPrompt !== undefined) {
      if (
        !data.systemPrompt ||
        data.systemPrompt.length < 10 ||
        data.systemPrompt.length > 5000
      ) {
        throw new Error("Промпт должен быть от 10 до 5000 символов");
      }
      data.systemPrompt = data.systemPrompt.trim();
    }

    const assistant = await prisma.customAssistant.findUnique({
      where: { id },
    });
    if (!assistant) {
      throw new Error("Помощник не найден");
    }

    // Проверить уникальность имени если оно меняется
    if (data.name && data.name !== assistant.name) {
      const existing = await prisma.customAssistant.findFirst({
        where: {
          userId: assistant.userId,
          name: data.name,
          id: { not: id }, // Исключить текущий помощник
        },
      });

      if (existing) {
        throw new Error(`Помощник с именем "${data.name}" уже существует`);
      }
    }

    return prisma.customAssistant.update({
      where: { id },
      data,
    });
  },

  /**
   * Удалить пользовательского помощника
   */
  async deleteCustomAssistant(id: string): Promise<void> {
    if (!prisma) throw new Error("Database connection unavailable");
    const assistant = await prisma.customAssistant.findUnique({
      where: { id },
    });
    if (!assistant) {
      throw new Error("Помощник не найден");
    }

    await prisma.customAssistant.delete({ where: { id } });
  },

  /**
   * Получить одного помощника по ID (для проверки владения)
   */
  async getCustomAssistant(id: string): Promise<CustomAssistant | null> {
    if (!prisma) return null;
    return prisma.customAssistant.findUnique({ where: { id } });
  },

  /**
   * Проверить владение помощником
   */
  async ownsAssistant(userId: string, assistantId: string): Promise<boolean> {
    if (!prisma) return false;
    const assistant = await prisma.customAssistant.findUnique({
      where: { id: assistantId },
    });
    return assistant?.userId === userId;
  },
};
