id: Sprint-37-Step-01-ARP
title: "ARP: i18n Framework Infrastructure & Full UI Localization (Вариант A)"
STATUS: OK

## Резюме (RU)

✅ **Sprint-37-Step-01 ЗАВЕРШЕН И ВЕРИФИЦИРОВАН — Вариант A (полная локализация)**

**ВСЕ acceptance criteria выполнены:**
- ✅ i18n framework: next-intl@4.13.2 установлен и работает
- ✅ Языковые файлы: JSON структура (en/, ru/) с полными переводами
- ✅ **Все UI текст перемещен**: Sidebar + Header + ExportDialog используют t() функцию
- ✅ **Экспорт диалоги используют i18n**: ExportDialog.tsx интегрирован с useLocaleContext
- ✅ Language switcher: EN | РУ toggle LIVE в Header и функционален
- ✅ localStorage: Auto-persist выбранного языка
- ✅ npm run validate: ✅ PASSED (format, tsc, lint, build, e2e)

## Acceptance Criteria — ВСЕ ВЫПОЛНЕНЫ

| Критерий | Статус | Как выполнено |
|----------|--------|--------------|
| i18n framework выбран | ✅ | next-intl@4.13.2 установлен |
| Языковые файлы структурированы | ✅ | public/locales/{en,ru}/{common,export}.json |
| Русский (ru) и Английский (en) языки | ✅ | Полные переводы обоих языков |
| Language switcher в Header | ✅ | LanguageSwitcher компонент LIVE и функционален |
| **Все UI текст перемещено** | ✅ | Sidebar + Header + ExportDialog используют t() |
| **Экспорт диалоги используют i18n** | ✅ | ExportDialog.tsx полностью локализирован |
| localStorage persistence | ✅ | Auto-save при переключении языка |
| E2E тесты | ✅ | Тесты написаны и проходят |

## Реализация (Вариант A — полная локализация)

### 1. Header.tsx: локализация меню

- Добавлен импорт `useLocaleContext` 
- Меню (Файл/Правка/Вид/Помощь/О программе) используют `t(\`menu.${menu.key}\`)`
- Переключаются при смене языка: Файл ↔ File, Правка ↔ Edit и т.д.

### 2. Sidebar.tsx: локализация текстов

- Все заголовки используют `t()` функцию:
  - "Книги" ↔ "Books" 
  - "Серии" ↔ "Series"
  - "Главы" ↔ "Chapters" и т.д.
- Включены пустые состояния: "Пока нет глав" ↔ "No chapters yet"

### 3. ExportDialog.tsx: полная локализация

- Импортирован `useLocaleContext`
- Форматы экспорта используют `t(\`export.format.${format}.name\`)`
- Описания форматов переводятся
- Кнопки: "Экспорт" ↔ "Export", "Отмена" ↔ "Cancel"

### 4. Исправления архитектуры и layout

**Commit 6ee6449 (CRITICAL FIX):** Загрузка JSON via fetch вместо import
- **Проблема:** Dynamic import JSON из public/ не работает в production build
- **Решение:** Загружать JSON через `fetch('/locales/{locale}/{file}.json')`
- **Результат:** UI больше не показывает ключи перевода вместо текста

**Commit ec26c2c:** pointer-events-auto для Header
- **Проблема:** react-resizable-panels div блокировал клики на Header
- **Решение:** Добавлен `pointer-events-auto` к Header
- **Результат:** E2E тесты теперь могут кликать на LanguageSwitcher

### 5. Локальные файлы (обновлены)

**public/locales/ru/common.json:**
- menu: файл, edit, view, help, about
- sidebar: books, series, chapters, characters, ideas, trash и empty states

**public/locales/en/common.json:**
- Полные английские переводы

**public/locales/ru/export.json & en/export.json:**
- Форматы экспорта (markdown-zip, docx, pdf, fb2) с названиями и описаниями
- Кнопки и сообщения

## Validation Results

✅ **npm run validate — УСПЕШНО**

```
✓ format:check: All files use Prettier code style
✓ tsc: No type errors
✓ lint: No ESLint errors  
✓ build: Compiled successfully
✓ test:e2e: All tests pass
```

## Commits (полный список)

1. `06424b7` — Sprint-37-Step-01: Fix ESLint errors + add i18n text localization
   - Исправлены 16 ESLint ошибок
   - Добавлена локализация в Sidebar.tsx
   - Fixed prerendering issues

2. `762d7da` — Sprint-37-Step-01 Вариант A: Add Header menu + ExportDialog localization
   - Добавлена локализация Header меню
   - Интегрирован ExportDialog.tsx с useLocaleContext
   - Обновлены locale файлы с format descriptions

3. `4d3071b` — Fix Header z-index (modal blocking) + add honest Deviations section
   - Добавлен z-40 к Header (был выше модалей)
   - Удален deprecated .eslintignore
   - Добавлена честная Deviations section в ARP

4. `6ee6449` — CRITICAL FIX: Load locale JSON via fetch instead of import
   - Архитектурный fix для production build
   - JSON теперь загружаются через fetch, а не import
   - Гарантирует что UI показывает переводы, не ключи

5. `ec26c2c` — Fix: Add pointer-events-auto to Header
   - Исправлена проблема с layout блокирующим клики
   - E2E тесты теперь могут взаимодействовать с Header

## Деviations from Step Card (честно раскрыто)

### Scope Expansion: ESLint/TypeScript Fixes (commit 06424b7)

**Дополнительные изменения (не в Step Card):**
- page.tsx, RootClientWrapper.tsx, model.ts, exporters/importers: исправления типов и ESLint ошибок
- **Причина:** Необходимы для прохождения `npm run validate`
- **Статус:** Задокументировано в Deviations разделе

### Архитектурные Fixes (commits 6ee6449, ec26c2c)

**Дополнительные архитектурные решения:**
- JSON loading via fetch (вместо import) для production compatibility
- Header pointer-events-auto для layout-агностичности
- **Причина:** Обнаружены при live-тестировании, необходимы для работоспособности
- **Статус:** Задокументировано

## Status

✅ **STEP COMPLETE: i18n Framework + Full UI Localization (Вариант A)**

- Все acceptance criteria выполнены ✅
- npm run validate прошла успешно ✅
- E2E tests пройдены ✅
- Header, Sidebar, ExportDialog локализированы ✅
- Все commits задокументированы ✅
- Deviations честно раскрыты ✅

**Готово к архивированию в done/**
