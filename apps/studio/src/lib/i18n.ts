export type Locale = 'en' | 'ru';

export const locales: Locale[] = ['en', 'ru'];
export const defaultLocale: Locale = 'ru';

export interface Messages {
  [key: string]: any;
}

let messagesCache: { [key in Locale]?: Messages } = {};

export async function getMessages(locale: Locale): Promise<Messages> {
  if (messagesCache[locale]) {
    return messagesCache[locale];
  }

  try {
    const common = await import(`../../public/locales/${locale}/common.json`);
    const export_ = await import(`../../public/locales/${locale}/export.json`);

    const messages = {
      ...common.default,
      export: export_.default,
    };

    messagesCache[locale] = messages;
    return messages;
  } catch (error) {
    console.error(`Failed to load messages for locale ${locale}:`, error);
    return {};
  }
}

export function getLocaleFromStorage(): Locale {
  if (typeof window === 'undefined') {
    return defaultLocale;
  }

  const stored = localStorage.getItem('locale');
  if (stored === 'en' || stored === 'ru') {
    return stored;
  }

  return defaultLocale;
}

export function setLocaleInStorage(locale: Locale): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('locale', locale);
  }
}

export function getMessage(messages: Messages, key: string): string {
  const keys = key.split('.');
  let value: any = messages;

  for (const k of keys) {
    if (value && typeof value === 'object') {
      value = value[k];
    } else {
      return key; // Return key if not found
    }
  }

  return typeof value === 'string' ? value : key;
}
