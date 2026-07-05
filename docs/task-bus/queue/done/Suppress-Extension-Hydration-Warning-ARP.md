# ARP — Suppress-Extension-Hydration-Warning

**Задача:** Подавить hydration warning от браузерных расширений (`suppressHydrationWarning` на `<html>`)
**Статус выполнения:** Готово к ревью

## Что сделано

В `apps/studio/src/app/layout.tsx` добавлен проп `suppressHydrationWarning` на тег `<html>`,
рядом с уже существующими `lang="en"` и `className`. Больше ничего в файле не менялось —
изменение ровно одна строка.

## Изменённый файл целиком

### apps/studio/src/app/layout.tsx

```tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Literary Studio",
  description: "An AI-powered IDE for writers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
```

## Валидация

```
npm run build → успешно (Compiled successfully, TypeScript без ошибок)
npm run lint  → чисто
git status --short → ровно 1 файл (layout.tsx, M) — единственный Allowed path
```

**Живая проверка (честно, ограничение среды):** предупреждение о hydration mismatch — это
предупреждение в консоли браузера во время React-гидратации на клиенте, а не что-то видимое
в исходном серверном HTML или через `curl`. В этой среде нет инструмента браузерной
автоматизации (то же ограничение, что и во всех предыдущих UI-шагах), поэтому я не могу лично
открыть DevTools, вставить произвольный `data-*` атрибут на `<html>` до гидратации и убедиться,
что warning не всплывает — ни у меня нет установленного расширения-кошелька, ни браузера с
консолью. Что реально проверено: `suppressHydrationWarning` — официально документированный
проп React/Next.js именно для этого случая (несовпадение атрибутов на одном конкретном DOM-
узле, не отключает проверки гидратации во всём дереве); build/lint подтверждают, что проп
принят TypeScript'ом и не ломает сборку. **Прошу вас лично открыть приложение в браузере и
убедиться, что warning действительно пропал** (вручную вставленным `data-*` атрибутом на
`<html>` через DevTools, как и предлагает сам Step Card) — я не могу заменить это код-ревью.

## Отклонения от Step Card

Нет. Изменение — ровно один проп на `<html>`, ничего больше не тронуто.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
