'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { Locale, Messages } from '@/lib/i18n';

interface LocaleContextType {
  locale: Locale;
  messages: Messages;
  isLoading: boolean;
  switchLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const LocaleContext = createContext<LocaleContextType | undefined>(undefined);

export function LocaleProvider({ children, value }: { children: ReactNode; value: LocaleContextType }) {
  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocaleContext(): LocaleContextType {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocaleContext must be used within LocaleProvider');
  }
  return context;
}
