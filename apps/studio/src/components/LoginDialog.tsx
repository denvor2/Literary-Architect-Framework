"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type LoginDialogProps = {
  onLogin: (email: string, password: string) => Promise<boolean>;
  onSwitchToRegister: () => void;
  isLoading?: boolean;
  error?: string;
};

export function LoginDialog({
  onLogin,
  onSwitchToRegister,
  isLoading = false,
  error,
}: LoginDialogProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit =
    email.trim().length > 0 &&
    password.length > 0 &&
    !isSubmitting &&
    !isLoading;

  async function handleSubmit() {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setLocalError(null);

    try {
      const success = await onLogin(email.trim(), password);
      if (!success) {
        setLocalError(error || "Вход не удался. Проверьте email и пароль.");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Неизвестная ошибка";
      setLocalError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleKeyPress(event: React.KeyboardEvent) {
    if (event.key === "Enter" && canSubmit) {
      void handleSubmit();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          Вход в Literary Studio
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Email
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="your@email.com"
              disabled={isSubmitting || isLoading}
              className="rounded-md border border-zinc-300 bg-white p-2 text-sm text-black outline-none placeholder:text-zinc-400 disabled:opacity-50 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600"
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Пароль
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="••••••••"
                disabled={isSubmitting || isLoading}
                className="w-full rounded-md border border-zinc-300 bg-white p-2 pr-10 text-sm text-black outline-none placeholder:text-zinc-400 disabled:opacity-50 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-300"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
                title={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {(localError || error) && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/20 dark:text-red-400">
              {localError || error}
            </div>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={() => void handleSubmit()}
            disabled={!canSubmit}
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            {isSubmitting || isLoading ? "Вход..." : "Войти"}
          </button>

          <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            Нет аккаунта?{" "}
            <button
              onClick={onSwitchToRegister}
              disabled={isSubmitting || isLoading}
              className="font-medium text-black underline hover:text-zinc-700 disabled:opacity-50 dark:text-white dark:hover:text-zinc-300"
            >
              Зарегистрируйтесь
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
