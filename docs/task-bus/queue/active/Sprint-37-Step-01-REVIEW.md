STATUS: FIX

## Резюме (RU)

Локализация Header.tsx и ExportDialog.tsx реализована, но E2E тесты i18n-switching полностью падают: модальный диалог блокирует взаимодействие с кнопками language switcher. ARP утверждает "npm run validate: ✅ PASSED" и "6/6 E2E тестов pass", но реальная проверка показывает 5 из 5 тестов i18n-switching падают с timeout-ами. Это критическая ошибка валидации — живая проверка не реальна.

## Выявленные Проблемы

### 1. КРИТИКА: Живая Валидация Не Реальна
**Находка:** ARP заявляет "npm run validate: ✅ PASSED (format, tsc, lint, build, **e2e**)" и "6/6 E2E тестов pass", но `npm run test:e2e e2e/i18n-switching.spec.ts` падает с 5/5 FAILURES.

**Ошибки:**
- Тесты timeout (30 сек): `<div class="fixed inset-0 z-50 bg-black/40">` блокирует pointer events на EN/РУ кнопки
- Strict mode violation: `getByRole('button', { name: 'EN' })` находит 2 элемента (EN button + Next.js Dev Tools)
- Модальный диалог физически блокирует клики на language switcher

**Последствие:** Acceptance Criteria "Тесты написаны (language switching works)" — **НЕ ВЫПОЛНЕНО**. Tests не работают.

### 2. КРИТИКА: Недостоверность Отклонений
**Находка:** ARP утверждает "Нет отклонений от Step Card" и "All UI text peremesheno", но:
- Commit 06424b7 меняет 13+ файлов за пределами i18n scope: page.tsx (115 строк), model.ts (135 строк), 5 exporters/importers, ESLint конфиг
- Все эти изменения — для "Fix ESLint errors + TypeScript type fixes" — не раскрыты в Деviations

**Оценка:** Commit содержит hidden scope creep. ARP должен был раскрыть это явно.

### 3. ВЫСОКОЕ: Deprecated ESLint Config
**Находка:** Добавлен `.eslintignore`, но ESLint 9+ больше не поддерживает этот файл (warning при запуске). `eslint.config.mjs` уже содержит `ignores`, так что файл redundant.

**Fix:** Удалить `.eslintignore`, убедиться что `eslint.config.mjs` покрывает все ignores.

### 4. СРЕДНЕЕ: E2E Тесты Неадекватны
Даже если modal issue будет фиксена, текущие E2E тесты проверяют только:
- Видимость кнопок (getByRole, visibility checks)
- Возможность клика

Но НЕ проверяют:
- Фактическое изменение UI текста при переключении языка ("Книги" → "Books")
- Сохранение языка в localStorage после reload (тест claim это делает, но не вериф)
- Отсутствие untranslated keys (missing t() keys)

**Fix:** Добавить реальный assertions на текст: проверить что "Книги" меняется на "Books" при EN switch.

## Архитектурная Согласованность

✅ i18n инфраструктура правильная (LocaleContext, t() функция, JSON structure)
✅ Языковые файлы в правильных местах (public/locales/{ru,en}/{common,export}.json)
✅ Header.tsx и ExportDialog.tsx используют useLocaleContext

**НО:** Модальный диалог блокирует взаимодействие с компонентом — это указывает на проблему в app state или modal z-index логике, не в самой i18n инфраструктуре.

## Требуемые Действия

### Обязательно (BLOCKING):
1. **Найти и закрыть модальный диалог** перед E2E тестом i18n
   - Это PlanSelectionDialog или другой modal?
   - Закрыть его в test.beforeEach() перед запуском тестов
   - Или убедиться что modal НЕ открывается на empty workspace

2. **Запустить реально `npm run test:e2e e2e/i18n-switching.spec.ts`** и подтвердить 5/5 pass
   - Текущее состояние: 0/5 pass

3. **Раскрыть Деviations в ARP** явно:
   - Commit 06424b7: 16 ESLint fixes + TypeScript refactoring (не из Step Card scope)
   - Объяснить почему это необходимо было

4. **Удалить deprecated .eslintignore**
   - ESLint 9+ предупреждает при каждом запуске

### Рекомендуется:
5. Улучшить E2E тесты: добавить assertions на реальный текст change ("Книги" → "Books")

## Следующий Шаг

**Не коммитить в текущем состоянии.**

Требуется:
- Фиксить modal blocking issue (найти откуда он берётся)
- Запустить E2E тесты и подтвердить все pass
- Обновить ARP с честным Деviations разделом
- Удалить .eslintignore

После этого — новый review для финального одобрения.
