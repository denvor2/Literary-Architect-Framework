"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useLocaleContext } from "@/context/LocaleContext";

type RegisterDialogProps = {
  onRegister: (
    email: string,
    password: string,
    captchaToken: string,
  ) => Promise<boolean>;
  onSwitchToLogin: () => void;
  isLoading?: boolean;
  error?: string;
};

function validatePassword(password: string): {
  isValid: boolean;
  errorKeys: string[];
} {
  const errorKeys: string[] = [];

  if (password.length < 8) {
    errorKeys.push("auth.register.password_errors.min_length");
  }

  if (!/[a-zA-Z]/.test(password)) {
    errorKeys.push("auth.register.password_errors.needs_letter");
  }

  if (!/\d/.test(password)) {
    errorKeys.push("auth.register.password_errors.needs_digit");
  }

  return {
    isValid: errorKeys.length === 0,
    errorKeys,
  };
}

function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

export function RegisterDialog({
  onRegister,
  onSwitchToLogin,
  isLoading = false,
  error,
}: RegisterDialogProps) {
  const { t } = useLocaleContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [passwordErrorKeys, setPasswordErrorKeys] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const passwordValidation = validatePassword(password);
  const emailValid = email.length === 0 || validateEmail(email);

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (value.length > 0) {
      setPasswordErrorKeys(validatePassword(value).errorKeys);
    } else {
      setPasswordErrorKeys([]);
    }
  };

  const canSubmit =
    email.trim().length > 0 &&
    emailValid &&
    passwordValidation.isValid &&
    password === passwordConfirm &&
    password.length > 0 &&
    !isSubmitting &&
    !isLoading;

  async function handleSubmit() {
    if (!canSubmit) return;

    setIsSubmitting(true);
    setLocalError(null);

    try {
      const captchaToken = `placeholder-${Date.now()}`;

      const success = await onRegister(email.trim(), password, captchaToken);
      if (!success) {
        setLocalError(error || t("auth.register.error"));
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : t("auth.login.error_generic");
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

  const passwordMismatch =
    password.length > 0 &&
    passwordConfirm.length > 0 &&
    password !== passwordConfirm;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-zinc-200 bg-white p-6 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="mb-4 text-lg font-semibold text-black dark:text-zinc-50">
          {t("auth.register.title")}
        </h2>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("auth.register.email_label")}
            </span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@email.com"
              disabled={isSubmitting || isLoading}
              className={`rounded-md border bg-white p-2 text-sm text-black outline-none placeholder:text-zinc-400 disabled:opacity-50 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600 ${
                !emailValid
                  ? "border-red-300 dark:border-red-700"
                  : "border-zinc-300"
              }`}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("auth.register.password_label")}
            </span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => handlePasswordChange(event.target.value)}
                placeholder="••••••••"
                disabled={isSubmitting || isLoading}
                className={`w-full rounded-md border bg-white p-2 pr-10 text-sm text-black outline-none placeholder:text-zinc-400 disabled:opacity-50 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600 ${
                  passwordErrorKeys.length > 0
                    ? "border-red-300 dark:border-red-700"
                    : "border-zinc-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isSubmitting || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-300"
                aria-label={t("auth.register.show_password")}
                title={t("auth.register.show_password")}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordErrorKeys.length > 0 && (
              <div className="flex flex-col gap-1">
                {passwordErrorKeys.map((key, idx) => (
                  <span
                    key={idx}
                    className="text-xs text-red-600 dark:text-red-400"
                  >
                    • {t(key)}
                  </span>
                ))}
              </div>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              {t("auth.register.password_confirm_label")}
            </span>
            <div className="relative">
              <input
                type={showPasswordConfirm ? "text" : "password"}
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="••••••••"
                disabled={isSubmitting || isLoading}
                className={`w-full rounded-md border bg-white p-2 pr-10 text-sm text-black outline-none placeholder:text-zinc-400 disabled:opacity-50 focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-900 dark:text-white dark:placeholder:text-zinc-600 ${
                  passwordMismatch
                    ? "border-red-300 dark:border-red-700"
                    : "border-zinc-300"
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                disabled={isSubmitting || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-700 disabled:opacity-50 dark:text-zinc-400 dark:hover:text-zinc-300"
                aria-label={t("auth.register.show_password")}
                title={t("auth.register.show_password")}
              >
                {showPasswordConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {passwordMismatch && (
              <span className="text-xs text-red-600 dark:text-red-400">
                {t("auth.register.password_mismatch")}
              </span>
            )}
          </label>

          <div className="rounded-md bg-zinc-50 p-3 text-xs text-zinc-600 dark:bg-zinc-900/50 dark:text-zinc-400">
            <div className="font-semibold mb-1">CAPTCHA (Phase 1)</div>
            <div>
              Заполнитель для Google reCAPTCHA v3. При регистрации будет
              использован токен заполнителя.
            </div>
          </div>

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
            {isSubmitting || isLoading
              ? `${t("auth.register.submit")}...`
              : t("auth.register.submit")}
          </button>

          <div className="text-center text-sm text-zinc-600 dark:text-zinc-400">
            {t("auth.register.have_account")}{" "}
            <button
              onClick={onSwitchToLogin}
              disabled={isSubmitting || isLoading}
              className="font-medium text-black underline hover:text-zinc-700 disabled:opacity-50 dark:text-white dark:hover:text-zinc-300"
            >
              {t("auth.register.switch_to_login")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
