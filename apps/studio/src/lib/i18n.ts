export type Locale = "en" | "ru";

export const locales: Locale[] = ["en", "ru"];
export const defaultLocale: Locale = "ru";

export interface Messages {
  [key: string]: Record<string, unknown>;
}

const messagesCache: { [key in Locale]?: Messages } = {};

export async function getMessages(locale: Locale): Promise<Messages> {
  if (messagesCache[locale]) {
    return messagesCache[locale];
  }

  try {
    const commonRes = await fetch(`/locales/${locale}/common.json`);
    const exportRes = await fetch(`/locales/${locale}/export.json`);

    if (!commonRes.ok || !exportRes.ok) {
      throw new Error(
        `Failed to fetch locales: common=${commonRes.status}, export=${exportRes.status}`,
      );
    }

    const common = await commonRes.json();
    const export_ = await exportRes.json();

    const messages = {
      ...common,
      export: export_,
    };

    messagesCache[locale] = messages;
    return messages;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    return {};
  }
}

export function getLocaleFromStorage(): Locale {
  if (typeof window === "undefined") {
    return defaultLocale;
  }

  const stored = localStorage.getItem("locale");
  if (stored === "en" || stored === "ru") {
    return stored;
  }

  return defaultLocale;
}

export function setLocaleInStorage(locale: Locale): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("locale", locale);
  }
}

export function getMessage(messages: Messages, key: string): string {
  const keys = key.split(".");
  let value: unknown = messages;

  for (const k of keys) {
    if (value && typeof value === "object") {
      value = (value as Record<string, unknown>)[k];
    } else {
      return key;
    }
  }

  return typeof value === "string" ? value : key;
}
