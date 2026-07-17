"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { Plan } from "@/generated/prisma/client";
import { Check } from "lucide-react";

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      const res = await fetch("/api/billing", { credentials: "include" });
      const data = (await res.json()) as { plans?: Plan[] };
      setPlans((data.plans || []).sort((a, b) => a.price - b.price));
    } catch (error) {
      console.error("Failed to load plans:", error);
    } finally {
      setLoading(false);
    }
  }

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
        <div className="mx-auto max-w-6xl">
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
        <div className="mx-auto max-w-6xl">
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
  const pricePerMonth = (plan.price / 100).toFixed(2);

  return (
    <div
      className={`rounded-lg border-2 p-6 transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50 dark:border-blue-600 dark:bg-blue-950/20"
          : "border-zinc-200 dark:border-zinc-800"
      }`}
    >
      <h3 className="mb-2 text-xl font-bold text-black dark:text-white">
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
              ${pricePerMonth}
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">в месяц</p>
          </>
        )}
      </div>

      {plan.description && (
        <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
          {plan.description}
        </p>
      )}

      {/* Features */}
      <ul className="mb-6 space-y-3">
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
            {features.includes("unlimited_books")
              ? "Неограниченное"
              : features.includes("up_to_50_books")
                ? "До 50"
                : features.includes("up_to_10_books")
                  ? "До 10"
                  : "До 3"}{" "}
            количество книг
          </span>
        </li>
        {features.map((feature, idx) => (
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
            : isSelected
              ? "bg-blue-500 text-white dark:bg-blue-600"
              : "bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
        }`}
      >
        {isFree ? "Начать бесплатно" : "Подписаться"}
      </button>
    </div>
  );
}

function featureLabel(feature: string): string {
  const labels: Record<string, string> = {
    basic_editing: "Базовое редактирование",
    advanced_editing: "Продвинутое редактирование",
    one_assistant: "1 помощник",
    three_assistants: "3 помощника",
    five_assistants: "5 помощников",
    ten_assistants: "10 помощников",
    custom_prompts: "Кастомные промпты",
    priority_support: "Приоритетная поддержка",
    advanced_analytics: "Продвинутая аналитика",
    unlimited_editing: "Полное редактирование",
    unlimited_books: "Неограниченные книги",
  };
  return labels[feature] || feature;
}
