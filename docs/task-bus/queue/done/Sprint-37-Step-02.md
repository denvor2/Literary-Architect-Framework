# Sprint-37-Step-02: Complete UI Localization (EN/RU Coverage)

## Objective
Достичь 100% локализации UI. После Step-01 (i18n framework + экспорт) остаются десятки hardcoded строк в диалогах, панелях, уведомлениях. Все они должны быть в locale files.

## Why Now
- Step-01 заложил инфраструктуру, но локализация неполная
- Dialogs (Login, Register, NewBook, etc.) — на русском вхолстую
- AssistantPanel, IdeasPanel, Audit, Mobile Nav — всё ещё hardcoded
- Тесты и validation требуют полного покрытия перед product

## Acceptance Criteria
- [ ] Все компоненты с UI используют `useLocaleContext()` (нет hardcoded строк)
- [ ] Locale files имеют ПОЛНОЕ покрытие:
  - `public/locales/ru/common.json` — все UI strings
  - `public/locales/en/common.json` — полные переводы
- [ ] Список компонентов для локализации:
  - LoginDialog.tsx
  - RegisterDialog.tsx
  - NewBookDialog.tsx
  - NewSeriesDialog.tsx
  - BookSettingsDialog.tsx
  - SeriesSettingsDialog.tsx
  - SeriesEditDialog.tsx
  - ImportDialog.tsx
  - LineEditorPanel.tsx
  - AssistantPanel.tsx
  - IdeasPanel.tsx
  - CharacterPanel.tsx
  - MobileBottomNav.tsx
  - AdminAuditPanel.tsx
  - SyncWarningBanner.tsx
  - AuditEventRow.tsx
  - AuditFilters.tsx
  - Notifications / error messages (all)
- [ ] E2E тесты:
  - Language toggle сохраняется в localStorage
  - Все компоненты при переключении EN/RU обновляют UI
  - Dialog labels, buttons, placeholders — all translated
- [ ] `npm run validate` проходит (format/tsc/lint/build/e2e)
- [ ] Нет "translation key" фраз типа "login.title" в UI

## Implementation Plan

### Phase 1: Analyze & Structure
- [ ] Пройти все компоненты, выделить hardcoded strings
- [ ] Структурировать keys в locale files по логике (auth.*, dialogs.*, panels.*, etc.)
- [ ]决定на namespace structure (плоский vs nested)

### Phase 2: Locale Files
- [ ] Дополнить `public/locales/ru/common.json`:
  - auth section (login, register, labels, errors)
  - dialogs section (new-book, new-series, settings, import)
  - panels section (assistant, ideas, character, audit)
  - mobile section (bottom nav labels)
  - system section (warnings, sync messages)
- [ ] Создать полные EN переводы в `public/locales/en/common.json`
- [ ] Проверить что все keys доступны (нет missing translations)

### Phase 3: Component Updates
Для каждого компонента:
- Добавить `"use client"` (если не было)
- Добавить `const { t } = useLocaleContext()`
- Заменить все hardcoded strings на `t("path.to.string")`

### Phase 4: Validation & Testing
- [ ] npm run validate — все passing
- [ ] E2E тесты на локализацию (переключение языка → UI обновляется)
- [ ] Ручная проверка: переключить EN/RU → всё на нужном языке

## Files to Change
```
public/locales/ru/common.json (expand)
public/locales/en/common.json (expand)

apps/studio/src/components/
  - LoginDialog.tsx
  - RegisterDialog.tsx
  - NewBookDialog.tsx
  - NewSeriesDialog.tsx
  - BookSettingsDialog.tsx
  - SeriesSettingsDialog.tsx
  - SeriesEditDialog.tsx
  - ImportDialog.tsx
  - LineEditorPanel.tsx
  - AssistantPanel.tsx
  - IdeasPanel.tsx
  - CharacterPanel.tsx
  - MobileBottomNav.tsx
  - AdminAuditPanel.tsx
  - SyncWarningBanner.tsx
  - AuditEventRow.tsx
  - AuditFilters.tsx
  - (любые другие с hardcoded strings)

e2e/
  - localization-complete.spec.ts (new E2E test)
```

## Testing Strategy
1. **Coverage Test:** Запустить app на EN, затем RU → проверить что нет "key" фраз
2. **Component Test:** Для каждого компонента (dialog, panel, etc.) — переключить язык → строки обновляются
3. **E2E:** Playwright test с переключением EN/RU → assertions на видимый текст

## Complexity Estimate
- 3-4 часа (структура + 18+ компонентов + тесты)

## Notes
- Это финальная полнота для Step-01's i18n framework
- Подготовка к Step-03/04 (PDF/FB2 export) без технических долгов
- После этого — export features на базе уже локализованного фундамента
