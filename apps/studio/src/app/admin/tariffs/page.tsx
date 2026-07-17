"use client";

import { useState, useEffect } from "react";
import type { Plan } from "@/generated/prisma/client";
import { useRouter } from "next/navigation";

export default function AdminTariffsPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const res = await fetch("/api/billing", { credentials: "include" });
      const data = (await res.json()) as { plans?: Plan[] };
      setPlans(data.plans || []);
    } catch (error) {
      console.error("Failed to load plans:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(plan: Plan) {
    try {
      console.log("📤 Отправляю данные:", {
        id: plan.id,
        name: plan.name,
        price: plan.price,
        maxBooks: plan.maxBooks,
        maxAssistants: plan.maxAssistants,
        maxAssistantRequests: plan.maxAssistantRequests,
      });

      const res = await fetch(`/api/admin/plans/${plan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(plan),
      });

      const responseData = await res.json();
      console.log("📥 Ответ от сервера:", responseData);

      if (res.ok) {
        console.log("✓ План сохранён:", plan.name);
        await loadPlans();
        setEditingId(null);
      } else {
        console.error("Ошибка сохранения:", responseData);
        alert(`Ошибка: ${responseData.error || "Не удалось сохранить план"}`);
      }
    } catch (error) {
      console.error("Ошибка при сохранении плана:", error);
      alert("Ошибка подключения к серверу");
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-zinc-400">Загрузка тарифов...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-black dark:text-white">
        Управление тарифами
      </h1>

      <div className="space-y-4">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isEditing={editingId === plan.id}
            onEdit={() => setEditingId(plan.id)}
            onSave={handleSave}
            onCancel={() => setEditingId(null)}
          />
        ))}
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  isEditing,
  onEdit,
  onSave,
  onCancel,
}: {
  plan: Plan;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (plan: Plan) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState(plan);

  if (isEditing) {
    return (
      <div className="space-y-4 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-zinc-500">
              Название
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500">
              Цена (центы, макс 5)
            </label>
            <input
              type="number"
              maxLength={5}
              value={formData.price}
              onChange={(e) =>
                setFormData({ ...formData, price: Number(e.target.value) })
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500">
              Макс запросов (макс 6)
            </label>
            <input
              type="number"
              maxLength={6}
              value={formData.maxAssistantRequests}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxAssistantRequests: Number(e.target.value),
                })
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500">
              Макс книг (макс 3, 0=∞)
            </label>
            <input
              type="number"
              maxLength={3}
              value={formData.maxBooks}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxBooks: Number(e.target.value),
                })
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500">
              Макс помощников (макс 3, 0=∞)
            </label>
            <input
              type="number"
              maxLength={3}
              value={formData.maxAssistants}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  maxAssistants: Number(e.target.value),
                })
              }
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-white"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-500">
              Активно
            </label>
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.checked })
              }
              className="mt-3"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onSave(formData)}
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black"
          >
            Сохранить
          </button>
          <button
            onClick={onCancel}
            className="rounded-full border border-zinc-300 px-4 py-2 text-sm font-medium text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
          >
            Отмена
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 dark:bg-zinc-950">
      <div>
        <h3 className="font-semibold text-black dark:text-white">
          {plan.name}
        </h3>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          ${(plan.price / 100).toFixed(2)}/мес • {plan.maxAssistantRequests}{" "}
          запросов • {plan.maxBooks === 0 ? "∞" : plan.maxBooks} книг •{" "}
          {plan.maxAssistants === 0 ? "∞" : plan.maxAssistants} помощников
        </p>
      </div>
      <button
        onClick={onEdit}
        className="rounded-full bg-zinc-100 px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
      >
        Редактировать
      </button>
    </div>
  );
}
