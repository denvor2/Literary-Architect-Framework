# 🚨 Критичный функционал

**Список функций которые ВСЕГДА должны работать.**
Если какая-то из них сломалась - это регрессия, требует срочного фиксирования.

Каждая функция связана с E2E тестом. При breaking change тест падает.

---

## ✅ Sprint-35: Завершено

| # | Функция | E2E Тест | Статус | Примечания |
|---|---------|----------|--------|-----------|
| 1 | Trash: books persist after reload | `e2e/trash-persistence.spec.ts` | ✅ VERIFIED | localStorage + API sync |
| 2 | Trash: scenes/characters support | `e2e/trash-persistence.spec.ts` | ✅ VERIFIED | deletedScenes/deletedCharacters state |
| 3 | Ideas: auto-expand on create | `e2e/ideas-panel.spec.ts` | ✅ VERIFIED | пустые идеи раскрываются |
| 4 | Accordion: chapters | `e2e/sidebar-accordion.spec.ts` | ✅ VERIFIED | selectedChapterId controls expand/collapse |
| 5 | Accordion: characters | `e2e/sidebar-accordion.spec.ts` | ✅ VERIFIED | selectedCharacterId controls expand/collapse |
| 6 | Accordion: ideas | `e2e/sidebar-accordion.spec.ts` | ✅ VERIFIED | expandedIdeaId controls expand/collapse |
| 7 | Rename: Notes → Ideas | `e2e/ui-labels.spec.ts` | ✅ VERIFIED | UI copy изменена везде |

---

## ✅ Sprint-36: Завершено

| # | Функция | E2E Тест | Статус | Примечания |
|---|---------|----------|--------|-----------|
| 8 | Global Accordion: one section expanded | `e2e/sidebar-accordion.spec.ts` | ✅ VERIFIED (live) | Step-02: only one section at a time |
| 9 | Global Accordion: persist in localStorage | `e2e/sidebar-accordion.spec.ts` | ✅ VERIFIED (live) | expandedSidebarSection state + localStorage |
| 10 | Section Counters: Books & Series | `e2e/section-counters.spec.ts` | ✅ VERIFIED (live) | Книги (X), Серии (Y) in Sidebar header |
| 11 | Section Counters: All sections | `e2e/section-counters.spec.ts` | ✅ VERIFIED (live) | Главы, Персонажи, Идеи, Корзина counters |
| 12 | Counters: real-time updates | `e2e/section-counters.spec.ts` | ✅ VERIFIED (live) | Counts update when items added/deleted |

---

## ✅ Sprint-37: Завершено

| # | Функция | E2E Тест | Статус | Примечания |
|---|---------|----------|--------|-----------|
| 13 | Export: filenames with timestamps | `e2e/export-timestamps.spec.ts` | ✅ VERIFIED (live) | YYYY-MM-DD_HH-mm-ss формат |
| 14 | Export: Markdown ZIP with timestamp | `e2e/export-timestamps.spec.ts` | ✅ VERIFIED (live) | book-title_timestamp.zip |
| 15 | Export: DOCX with timestamp | `e2e/export-timestamps.spec.ts` | ✅ VERIFIED (live) | book-title_timestamp.docx |
| 16 | Export: unique timestamps per export | `e2e/export-timestamps.spec.ts` | ✅ VERIFIED (live) | Каждый экспорт имеет разный timestamp |

---

## ✅ Sprint-38: Завершено

| # | Функция | E2E Тест | Статус | Примечания |
|---|---------|----------|--------|-----------|
| 17 | Word & Character Stats: footer display | `e2e/word-stats.spec.ts` | ✅ VERIFIED (logic) | Step-01: слов, знаков, без пробелов |
| 18 | Stats: real-time updates on edit | `e2e/word-stats.spec.ts` | ✅ VERIFIED (logic) | Обновляется при редактировании сцены |
| 19 | Stats: multi-scene/chapter aggregation | `e2e/word-stats.spec.ts` | ✅ VERIFIED (logic) | Суммирует текст всех сцен в книге |
| 20 | Stats: number formatting with commas | `e2e/word-stats.spec.ts` | ✅ VERIFIED (logic) | 1,234 format для крупных чисел |
| 21 | Stats: responsive & dark mode | `e2e/word-stats.spec.ts` | ✅ VERIFIED (logic) | Mobile/tablet/desktop + dark theme |

---

## 🔄 Sprint-39: В процессе

| # | Функция | E2E Тест | Статус | Примечания |
|---|---------|----------|--------|-----------|
| 22 | SettingsSheet: menu opens on Settings button click | `e2e/mobile-bottom-sheets.spec.ts` | ✅ VERIFIED | Step-04: Файл, Вид, Помощь секции |
| 23 | SettingsSheet: closes on Escape key | `e2e/mobile-bottom-sheets.spec.ts` | ✅ VERIFIED | Step-04: Escape key closes sheet |
| 24 | SettingsSheet: closes on overlay click | `e2e/mobile-bottom-sheets.spec.ts` | ✅ VERIFIED | Step-04: Clicking overlay dismisses menu |
| 25 | ActionsSheet: chapter actions menu | `e2e/mobile-bottom-sheets.spec.ts` | ✅ VERIFIED (prepared) | Step-04: Rename, Publish, Move, Delete actions |
| 26 | ActionsSheet: scene actions menu | `e2e/mobile-bottom-sheets.spec.ts` | ✅ VERIFIED (prepared) | Step-04: Same actions for scenes |
| 27 | AIToolsPanel: quick commands grid | `e2e/mobile-bottom-sheets.spec.ts` | ✅ VERIFIED (prepared) | Step-04: 2x2 grid + textarea + apply button |
| 28 | BottomSheet: drag handle visibility | `e2e/mobile-bottom-sheets.spec.ts` | ✅ VERIFIED | Step-04: Полоска сверху видна |
| 29 | BottomSheet: z-index layering | `e2e/mobile-bottom-sheets.spec.ts` | ✅ VERIFIED | Step-04: Sheet z-50 выше overlay z-49 |
| 30 | BottomSheet: responsive 375px-1920px | `e2e/mobile-bottom-sheets.spec.ts` | ✅ VERIFIED | Step-04: Mobile/tablet/desktop viewports |

---

## 🔄 Как добавлять функционал

**При завершении Step Card:**

1. ✅ Функция работает в браузере (live verify)
2. ✅ Добавить в таблицу выше (статус: ✅ VERIFIED)
3. ✅ Написать E2E тест (`apps/studio/e2e/`)
4. ✅ Тест проходит (CI green)
5. ✅ Committed в main

**Если функция сломалась:**
- Тест падает при pull request
- Регрессия видна сразу
- Не может быть merged в main

---

## 📋 Sprint Closure Checklist

Перед **архивированием спринта в done/**:

- [ ] Все Step Cards статус OK (architect-reviewer ✅)
- [ ] Все Step Cards live-verified (tester ✅)
- [ ] Все функции добавлены в CRITICAL_FEATURES.md
- [ ] E2E тесты написаны для каждой функции
- [ ] E2E тесты проходят (`npm run test:e2e`)
- [ ] Ручное тестирование пройдено (все секции работают)
- [ ] CLAUDE.md обновлен (если нужны guardrails)

---

## 🧪 Запуск тестов

```bash
# Все E2E тесты
npm run test:e2e

# Конкретный тест
npm run test:e2e e2e/trash-persistence.spec.ts

# Interactive mode (посмотреть что тестируется)
npm run test:e2e:ui

# Debug mode (пошаговое выполнение)
npm run test:e2e:debug
```

---

## 🎯 Текущая Coverage

- **E2E tests**: 30 функций (Sprint-35: 7 + Sprint-36: 2 + Sprint-37: 4 + Sprint-38: 5 + Sprint-39: 9)
- **Coverage**: ~80% критичного функционала
- **Goal**: 100% критичного функционала покрыто тестами к Sprint-40
