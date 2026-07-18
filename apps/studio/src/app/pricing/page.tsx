"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Plan } from "@/generated/prisma/client";
import { Check } from "lucide-react";

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const loadPlans = useCallback(async () => {
    try {
      const res = await fetch("/api/billing", { credentials: "include" });
      const data = (await res.json()) as { plans?: Plan[] };
      setPlans(data.plans || []);
    } catch (error) {
      console.error("Ошибка загрузки планов:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlans();
  }, []);

  async function handleSubscribe(planId: string) {
    setSelectedPlan(planId);
    // Redirect to payment/subscription flow
    // For now, just log
    console.log("Subscribe to plan:", planId);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-zinc-950">
        <p className="text-zinc-400">Загрузка тарифов...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="border-b border-zinc-200 px-4 py-6 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl text-center">
          <h1 className="mb-2 text-4xl font-bold text-black dark:text-white">
            Тарифные планы
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400">
            Выберите план, который подходит для ваших нужд
          </p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="px-4 py-12">
        <div className="mx-auto max-w-7xl flex justify-center">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                isSelected={selectedPlan === plan.id}
                onSubscribe={handleSubscribe}
              />
            ))}
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="border-t border-zinc-200 px-4 py-12 dark:border-zinc-800">
        <div className="mx-auto max-w-2xl space-y-6">
          <h2 className="text-2xl font-bold text-black dark:text-white">
            Часто задаваемые вопросы
          </h2>

          <div>
            <h3 className="font-semibold text-black dark:text-white">
              Могу ли я изменить тариф?
            </h3>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Да, вы можете обновить или понизить свой тариф в любой момент.
              Изменения вступят в силу со следующего периода.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-black dark:text-white">
              Что происходит при истечении подписки?
            </h3>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Ваш аккаунт автоматически переходит на бесплатный тариф. Вы можете
              возобновить подписку в любой момент.
            </p>
          </div>

          <div>
            <h3 className="font-semibold text-black dark:text-white">
              Какие способы оплаты вы принимаете?
            </h3>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">
              Мы принимаем платежи через Tbank (банковские карты, Apple Pay,
              Google Pay).
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="border-t border-zinc-200 px-4 py-12 dark:border-zinc-800">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="mb-4 text-2xl font-bold text-black dark:text-white">
            Готовы начать?
          </h2>
          <p className="mb-6 text-zinc-600 dark:text-zinc-400">
            Выберите тариф выше и начните писать прямо сейчас
          </p>
          <Link
            href="/login"
            className="inline-block rounded-full bg-black px-6 py-3 font-medium text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            Войти или создать аккаунт
          </Link>
        </div>
      </div>
    </div>
  );
}

function PlanCard({
  plan,
  isSelected,
  onSubscribe,
}: {
  plan: Plan;
  isSelected: boolean;
  onSubscribe: (planId: string) => void;
}) {
  const features = Array.isArray(plan.features) ? plan.features : [];
  const isFree = plan.price === 0;
  const isRecommended = plan.name === "Pro";
  const pricePerMonth = (plan.price / 100).toFixed(2);

  const description = plan.description || "Описание плана";

  return (
    <div
      className={`flex flex-col rounded-lg border-2 p-6 transition-all ${
        isRecommended
          ? "border-black shadow-lg dark:border-white scale-105"
          : isSelected
            ? "border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/20"
            : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      {isRecommended && (
        <div className="mb-3 inline-block bg-black px-3 py-1 text-xs font-bold text-white dark:bg-white dark:text-black w-fit">
          ★ Рекомендуем
        </div>
      )}
      <h3 className="mb-2 text-center text-xl font-bold text-black dark:text-white">
        {plan.name}
      </h3>

      <div className="mb-6">
        {isFree ? (
          <p className="text-3xl font-bold text-black dark:text-white">
            Бесплатно
          </p>
        ) : (
          <>
            <p className="text-4xl font-bold text-black dark:text-white">
              ₽{Math.round(parseFloat(pricePerMonth) * 90)}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">в месяц</p>
          </>
        )}
      </div>

      {description && (
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          {description}
        </p>
      )}

      {/* Features */}
      <ul className="mb-6 flex-1 space-y-3">
        <li className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            {plan.maxBooks === 0
              ? "Неограниченное"
              : plan.maxBooks === 3
                ? "До 3-х книг"
                : `До ${plan.maxBooks} книг`}
          </span>
        </li>
        <li className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            {getAssistantsList(plan.maxAssistants)}
          </span>
        </li>
        <li className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            {plan.maxAssistantRequests === 0
              ? "Неограниченные"
              : plan.maxAssistantRequests}{" "}
            запросов в месяц
          </span>
        </li>
        <li className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Главы, сцены, персонажи, идеи
          </span>
        </li>
        <li className="flex items-start gap-3">
          <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Импорт и экспорт (DOCX, PDF)
          </span>
        </li>
        {plan.name === "Basic" && (
          <li className="flex items-start gap-3">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Стандартная поддержка
            </span>
          </li>
        )}
        {features
          .filter(
            (f) =>
              ![
                "one_assistant",
                "three_assistants",
                "five_assistants",
                "ten_assistants",
                "custom_prompts",
              ].includes(f),
          )
          .map((feature, idx) => (
            <li key={idx} className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400" />
              <span className="text-sm text-zinc-700 dark:text-zinc-300">
                {featureLabel(feature)}
              </span>
            </li>
          ))}
      </ul>

      <button
        onClick={() => onSubscribe(plan.id)}
        disabled={isSelected}
        className={`w-full rounded-full py-2 font-medium transition-colors ${
          isFree
            ? "border border-zinc-300 text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
            : isRecommended
              ? "bg-black text-white hover:bg-zinc-800 dark:bg-black dark:text-white dark:hover:bg-zinc-900"
              : isSelected
                ? "bg-blue-500 text-white dark:bg-blue-600"
                : "border border-zinc-300 text-black hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
        }`}
      >
        {isFree ? "Начать бесплатно" : "Подписаться"}
      </button>
    </div>
  );
}

function getAssistantsList(maxAssistants: number): string {
  const assistants = ["Соавтор", "Редактор", "Критик", "Читатель"];

  if (maxAssistants === 0) {
    return "AI помощники: Неограниченные + собственные";
  }

  if (maxAssistants <= 4) {
    return "AI помощники: " + assistants.slice(0, maxAssistants).join(", ");
  }

  const remaining = maxAssistants - 4;
  return (
    "AI помощники: " +
    assistants.join(", ") +
    ` + ${remaining} ${remaining === 1 ? "свой" : "своих"}`
  );
}

function featureLabel(feature: string): string {
  const labels: Record<string, string> = {
    basic_editing: "Базовое редактирование",
    advanced_editing: "Продвинутое редактирование",
    unlimited_editing: "Полное редактирование",
    priority_support: "Приоритетная поддержка",
    advanced_analytics: "Продвинутая аналитика",
    unlimited_books: "Неограниченные книги",
  };
  return labels[feature] || feature;
}
