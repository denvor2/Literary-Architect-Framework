STATUS: FIX

## Резюме (RU)

Фреймворк i18n установлен и инфраструктура работает, но приёмные критерии степ-карты не полностью выполнены. ARP утверждает, что "все UI текст перемещён в языковые файлы", но только Sidebar локализирован; Header меню, ExportDialog и другие компоненты остаются с hardcoded русским текстом. Плюс, значительные изменения в модели и экспортёрах для ESLint/TypeScript fixes не раскрыты в секции Отклонения. E2E тесты i18n-switching в настоящий момент падают (modal intercepting clicks).

## Список выявленных проблем

### 1. Честность Отклонений (CRITICAL)
- ARP не содержит секции "Отклонения от Step Card"
- Фактические изменения включают файлы, не упомянутые в Step Card: RootClientWrapper.tsx, page.tsx, model.ts, fb2Exporter.ts, hybridArchiveExporter.ts, hybridArchiveImporter.ts, seriesRepository.ts, useWorkspaceController.ts
- Эти файлы были изменены для исправления 16 ESLint ошибок и TypeScript типов, что не было в original scope
- ARP объявляет это как "исправления необходимые" но не раскрывает явно

### 2. Acceptance Criteria — "Все UI текст перемещено" (CRITICAL)
- Step Card требует: "Все UI текст перемещено в языковые файлы"
- Implementation Plan уточняет: "Экспорт диалоги (Export.tsx), Sidebar заголовки, Кнопки и labels, Placeholder texts"
- Реальность: 
  - ✅ Sidebar заголовки (6 sections)
  - ❌ Header.tsx: все меню-кнопки остаются hardcoded ("Файл", "Правка", "Вид" и т.д., поиск placeholder)
  - ❌ ExportDialog.tsx: не обновлён, не использует i18n
  - ❌ Систематическая миграция buttons/labels не сделана
- ARP оправдывает это: "Step Card требует 'все UI текст перемещено' ✅ (Sidebar сделан)" — неправильная интерпретация требования

### 3. Acceptance Criteria — "Экспорт диалоги используют i18n" (CRITICAL)
- Step Card требует: "Экспорт диалоги используют i18n"
- Реальность:
  - ✅ Языковые файлы созданы (public/locales/*/export.json)
  - ❌ ExportDialog.tsx не импортирует useLocaleContext и не использует t() функцию
  - Файлы "готовы" но не интегрированы — это дефер, а не выполнение
- ARP оправдывает: "файлы готовы к использованию" — это не то же самое, что "используют i18n"

### 4. Валидация E2E Тестов (HIGH)
- ARP утверждает: "E2E тесты: 6/6 passed"
- Реальность: `npm run test:e2e e2e/i18n-switching.spec.ts` падает с ошибкой:
  - Modal dialog (PlanSelectionDialog?) блокирует click события на языковый switcher
  - Тесты не проходят в текущем состоянии
  - Либо регрессия с момента написания ARP, либо неправильное reporting результатов

### 5. Качество E2E Тестов (MEDIUM)
- Тесты проверяют видимость кнопок и возможность клика, но НЕ проверяют:
  - Фактическое изменение текста UI при переключении языка (например, "Главы" → "Chapters")
  - Сохранение языка в localStorage после перезагрузки (тест claim это, но не verifies)
  - Отсутствие untranslated keys в отображаемом контенте
- Реальная live verification требует проверки того, что текст Sidebar меняется (например, "Книги" становится "Books")

### 6. Структурные Проблемы
- Создан `.eslintignore` файл, но он deprecated в ESLint 9+ (только для compatibility, warning выводится)
- `eslint.config.mjs` уже содержит `ignores`, так что `.eslintignore` redundant

### 7. Scope Creep в других файлах (MEDIUM)
- `page.tsx`: массивные изменения в инициализации state (проблема React cascading renders)
  - Переместил useState initialization в функции
  - Удалил useEffect, который загружал state из localStorage
  - Добавил `typeof window !== "undefined"` checks для prerendering
- `model.ts`: переписана типизация (проблема `any` types)
- Экспортёры/импортёры: type fixes
- Эти fixes нужны и good, но не были в Step Card scope и должны быть раскрыты

## Архитектурная Согласованность

✅ i18n инфраструктура (LocaleContext, useLocaleContext, getMessage) правильная
✅ Язык сохраняется в localStorage
✅ LanguageSwitcher компонент функционален
✅ Языковые файлы структурированы правильно (JSON, ru/en, nested keys)

## Действия для исправления (REQUIRED)

### Вариант A: Расширить scope (Рекомендуется)
1. Локализировать Header.tsx меню (Файл, Правка, Вид, Помощь, О программе + все пункты меню)
2. Локализировать ExportDialog.tsx (импортировать useLocaleContext, использовать t() для labels)
3. Локализировать другие hardcoded UI strings (search placeholder, dialogs, etc.)
4. Улучшить E2E тесты: добавить проверку что текст Sidebar меняется при переключении (ищем "Книги" → затем EN → ищем "Books")
5. Добавить真实 live verification в ARP: скриншот или лог вывода того, что модальный диалог не блокирует i18n switcher и тесты проходят

### Вариант B: Честно раскрыть Деviations
1. Добавить секцию "Отклонения от Step Card" в ARP:
   - Раскрыть что Header/ExportDialog дефёрены на будущие шаги
   - Раскрыть ESLint/TypeScript fixes как необходимые но unplanned scope
   - Объяснить почему "все UI текст" интерпретируется как "Sidebar только"
2. Переклассифицировать acceptance criteria:
   - "Все UI текст перемещено" → "Sidebar UI текст перемещено (остальное в future steps)"
   - "Экспорт диалоги используют i18n" → "Подготовлены языковые файлы для экспорта (интеграция deferred)"
3. Исправить E2E тест результаты: реально запустить и confirm 6/6 passing или раскрыть что они падают

## Следующий шаг

**Не коммитить в текущем состоянии.**

Выберите:
- **Вариант A**: Расширить локализацию на Header + ExportDialog + другие компоненты + улучшить тесты (требует реальной работы но тогда truly "complete")
- **Вариант B**: Добавить честный Деviations раздел + переписать acceptance criteria как "partial" + fix E2E тесты (quick win но incomplete feature)

Рекомендуется **Вариант A** потому что Step Card явно требует "все UI текст" и "экспорт диалоги используют i18n". Это не optional. Без этого step incomplete по определению.
