import { useState, useEffect } from 'react';
import { getLocaleFromStorage, setLocaleInStorage, getMessages, type Locale, type Messages } from '@/lib/i18n';

export function useLocale() {
  const [locale, setLocale] = useState<Locale>('ru');
  const [messages, setMessages] = useState<Messages>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

  return {
    locale,
    messages,
    isLoading,
    switchLocale,
    t,
  };
}
