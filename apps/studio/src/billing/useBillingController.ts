"use client";

import { useEffect, useState } from "react";
import type { Plan, UserSubscription } from "@/generated/prisma/client";

export type BillingState = {
  currentPlan: Plan | null;
  currentSubscription: UserSubscription | null;
  daysUntilExpiry: number | null;
  isExpired: boolean;
  isLoading: boolean;
  error: string | null;
};

export type BillingActions = {
  loadCurrentPlan: () => Promise<void>;
  selectPlan: (planId: string) => Promise<{
    subscription?: UserSubscription;
    stripePaymentIntent?: { clientSecret: string };
  }>;
  cancelSubscription: () => Promise<void>;
};

export function useBillingController(): BillingState & BillingActions {
  const [state, setState] = useState<BillingState>({
    currentPlan: null,
    currentSubscription: null,
    daysUntilExpiry: null,
    isExpired: false,
    isLoading: false,
    error: null,
  });

  // Загрузить текущий план при монтировании
  useEffect(() => {
    void loadCurrentPlan();
  }, []);

  // Загрузить текущий план пользователя
  const loadCurrentPlan = async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch("/api/billing/plan");
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        plan?: Plan;
        subscription?: UserSubscription;
      };
      if (!data.ok) throw new Error(data.error);

      // Вычислить дни до истечения
      let daysUntilExpiry = null;
      let isExpired = false;
      if (data.subscription?.endDate) {
        const end = new Date(data.subscription.endDate);
        const now = new Date();
        daysUntilExpiry = Math.ceil(
          (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        isExpired = daysUntilExpiry <= 0;
      }

      setState((prev) => ({
        ...prev,
        currentPlan: data.plan || null,
        currentSubscription: data.subscription || null,
        daysUntilExpiry,
        isExpired,
        isLoading: false,
      }));
    } catch (error) {
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Failed to load plan",
        isLoading: false,
      }));
    }
  };

  // Выбрать и перейти на новый план (инициировать покупку)
  const selectPlan = async (planId: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch("/api/billing/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        subscription?: UserSubscription;
        stripePaymentIntent?: { clientSecret: string };
      };
      if (!data.ok) throw new Error(data.error);

      // Инициирование платежа (Step-06 обработает Stripe Payment Element)
      return {
        subscription: data.subscription,
        stripePaymentIntent: data.stripePaymentIntent,
      };
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to select plan";
      setState((prev) => ({ ...prev, error: errorMsg, isLoading: false }));
      throw error;
    }
  };

  // Отменить подписку (downgrade на Free)
  const cancelSubscription = async () => {
    // TBD: реализация отмены подписки (если needed)
  };

  return {
    ...state,
    loadCurrentPlan,
    selectPlan,
    cancelSubscription,
  };
}
