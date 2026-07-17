"use client";

import { useEffect, useState } from "react";
import type { Plan } from "@/generated/prisma/client";
import { PaymentForm } from "./PaymentForm";
import { useLocaleContext } from "@/context/LocaleContext";

export type PlanSelectionDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  currentPlanId?: string | null;
  onSelectPlan: (
    planId: string,
  ) => Promise<{ stripePaymentIntent?: { clientSecret: string } } | undefined>;
};

export function PlanSelectionDialog({
  isOpen,
  onClose,
  currentPlanId,
  onSelectPlan,
}: PlanSelectionDialogProps) {
  const { t } = useLocaleContext();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [paymentData, setPaymentData] = useState<{
    planId: string;
    plan: Plan;
    clientSecret?: string;
  } | null>(null);

  // Load available plans
  useEffect(() => {
    if (!isOpen) return;

    async function loadPlans() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/billing");
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as {
          ok: boolean;
          error?: string;
          plans?: Plan[];
        };
        if (!data.ok) throw new Error(data.error);
        setPlans(data.plans || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load plans");
      } finally {
        setIsLoading(false);
      }
    }

    void loadPlans();
  }, [isOpen]);

  async function handleSelectPlan(plan: Plan) {
    setError(null);
    setSelectedPlanId(plan.id);

    try {
      const result = await onSelectPlan(plan.id);
      setPaymentData({
        planId: plan.id,
        plan,
        clientSecret: result?.stripePaymentIntent?.clientSecret,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to select plan");
      setSelectedPlanId(null);
    }
  }

  function handlePaymentComplete() {
    onClose();
    setPaymentData(null);
    setSelectedPlanId(null);
  }

  if (!isOpen) return null;

  // Payment form shown after plan selection
  if (paymentData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
          <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
            Подтверждение оплаты
          </h2>

          <PaymentForm
            planName={paymentData.plan.name}
            amount={paymentData.plan.price}
            clientSecret={paymentData.clientSecret}
            onPaymentComplete={handlePaymentComplete}
            onPaymentError={(err) => setError(err)}
          />

          <button
            onClick={() => {
              setPaymentData(null);
              setSelectedPlanId(null);
            }}
            className="mt-4 w-full rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
          >
            Назад
          </button>
        </div>
      </div>
    );
  }

  // Plan selection grid
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-4xl rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-6 text-lg font-semibold text-black dark:text-zinc-50">
          Выберите тариф
        </h2>

        {error && (
          <div className="mb-4 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-8">
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              Загрузка тарифов...
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isSelected = plan.id === selectedPlanId;

              return (
                <button
                  key={plan.id}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={selectedPlanId !== null && !isSelected}
                  className={`rounded-lg border-2 p-4 text-left transition-colors disabled:opacity-50 ${
                    isCurrent || isSelected
                      ? "border-blue-400 bg-blue-50 dark:border-blue-600 dark:bg-blue-950"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-black dark:text-zinc-50">
                        {plan.name}
                      </h3>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        {plan.tier.toUpperCase()}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Текущий
                      </span>
                    )}
                  </div>

                  <p className="mt-3 text-lg font-bold text-black dark:text-zinc-50">
                    ${(plan.price / 100).toFixed(2)}
                  </p>

                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                    на {plan.billingPeriodDays} дней
                  </p>

                  <div className="mt-4 flex flex-col gap-1">
                    {plan.features && plan.features.length > 0 ? (
                      plan.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="text-xs text-zinc-600 dark:text-zinc-300"
                        >
                          ✓ {feature}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        Нет дополнительных возможностей
                      </span>
                    )}
                  </div>

                  {plan.maxAssistantRequests > 0 && (
                    <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-300">
                      Запросов: {plan.maxAssistantRequests}/месяц
                    </p>
                  )}
                </button>
              );
            })}
          </div>
        )}

        <button
          onClick={onClose}
          disabled={selectedPlanId !== null}
          className="mt-6 w-full rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:text-white dark:hover:bg-zinc-900"
        >
          Закрыть
        </button>
      </div>
    </div>
  );
}
