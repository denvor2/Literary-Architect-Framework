'use client';

import { useEffect, useState, ReactNode } from 'react';
import { LocaleProvider } from '@/context/LocaleContext';
import { getLocaleFromStorage, setLocaleInStorage, getMessages, type Locale, type Messages } from '@/lib/i18n';

export function RootClientWrapper({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>('ru');
  const [messages, setMessages] = useState<Messages>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize locale from storage on client-side only
    const storedLocale = getLocaleFromStorage();
    setLocale(storedLocale);

    getMessages(storedLocale).then((msgs) => {
      setMessages(msgs);
      setIsLoading(false);
    });
  }, []);

  const switchLocale = (newLocale: Locale) => {
    setLocale(newLocale);
    setLocaleInStorage(newLocale);

    getMessages(newLocale).then((msgs) => {
      setMessages(msgs);
    });
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = messages;

    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        return key;
      }
    }

    return typeof value === 'string' ? value : key;
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
