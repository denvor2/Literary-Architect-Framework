"use client";

import { useState } from "react";

export type PaymentFormProps = {
  /** Phase 2: Used for Stripe Payment Element integration */
  clientSecret?: string;
  planName: string;
  amount: number;
  onPaymentComplete?: () => void;
  onPaymentError?: (error: string) => void;
};

export function PaymentForm(props: PaymentFormProps) {
  const { planName, amount, clientSecret, onPaymentComplete, onPaymentError } =
    props;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePayment() {
    setError(null);
    setIsLoading(true);

    try {
      // Phase 1: Mock payment processing
      // Phase 2: Will use clientSecret for Stripe Payment Element
      console.debug("Payment mock - clientSecret:", !!clientSecret);
      await new Promise((resolve) => setTimeout(resolve, 500));

      // For now, simulate success
      setIsLoading(false);
      onPaymentComplete?.();
    } catch (err) {
      const errorMsg =
        err instanceof Error ? err.message : "Payment failed. Try again.";
      setError(errorMsg);
      onPaymentError?.(errorMsg);
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="flex justify-between">
          <span className="text-sm font-medium text-black dark:text-zinc-50">
            {planName}
          </span>
          <span className="text-sm font-medium text-black dark:text-zinc-50">
            ${(amount / 100).toFixed(2)}
          </span>
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      )}

      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="rounded-full bg-black px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {isLoading ? "..." : "Pay"}
      </button>
    </div>
  );
}
