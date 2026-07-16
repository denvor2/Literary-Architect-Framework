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

## ⏳ Sprint-36: Текущий

| # | Функция | E2E Тест | Статус | Примечания |
|---|---------|----------|--------|-----------|
| 8 | Global Accordion: one section expanded | `e2e/sidebar-accordion.spec.ts` | ✅ VERIFIED (live) | Step-02: only one section at a time |
| 9 | Global Accordion: persist in localStorage | `e2e/sidebar-accordion.spec.ts` | ✅ VERIFIED (live) | expandedSidebarSection state + localStorage |

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

- **E2E tests**: 9 функций (Sprint-35: 7 + Sprint-36: 2)
- **Coverage**: ~45% критичного функционала
- **Goal**: 100% критичного функционала покрыто тестами к Sprint-40
