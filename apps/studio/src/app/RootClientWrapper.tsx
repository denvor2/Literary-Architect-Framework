"use client";

import { useEffect, useState, ReactNode } from "react";
import { LocaleProvider } from "@/context/LocaleContext";
import {
  getLocaleFromStorage,
  setLocaleInStorage,
  getMessages,
  type Locale,
  type Messages,
} from "@/lib/i18n";

export function RootClientWrapper({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => getLocaleFromStorage());
  const [messages, setMessages] = useState<Messages>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getMessages(locale).then((msgs) => {
      console.log(`[i18n] Loaded messages for ${locale}:`, msgs);
      setMessages(msgs);
      setIsLoading(false);
    });
  }, [locale]);

  const switchLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleInStorage(newLocale);
  };

  const t = (key: string): string => {
    const keys = key.split(".");
    let value: unknown = messages;

    for (const k of keys) {
      if (
        value &&
        typeof value === "object" &&
        k in (value as Record<string, unknown>)
      ) {
        value = (value as Record<string, unknown>)[k];
      } else {
        console.warn(
          `[i18n] Translation missing for "${key}". Messages loaded: ${Object.keys(messages).length > 0 ? "yes" : "NO"}`,
        );
        return key;
      }
    }

    return typeof value === "string" ? value : key;
  };

  return (
    <LocaleProvider
      value={{
        locale,
        messages,
        isLoading,
        switchLocale,
        t,
      }}
    >
      {children}
    </LocaleProvider>
  );
}
