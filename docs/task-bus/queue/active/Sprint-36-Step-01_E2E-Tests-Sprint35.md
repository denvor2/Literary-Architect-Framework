# Sprint-36-Step-01: E2E Tests for Sprint-35 Critical Features

## Objective
Написать comprehensive E2E тесты для всех критичных функций добавленных в Sprint-35.

Цель: Поймать регрессии на CI перед merge.

## Why Now
- Sprint-35 добавили 7 новых функций
- Нет E2E тестов → никто не узнает если они сломаются
- CRITICAL_FEATURES.md требует E2E тесты для каждой функции

## Acceptance Criteria
- [ ] `e2e/trash-persistence.spec.ts` ✅ Trash работает после reload
  - Create book → delete → verify in trash
  - Reload page → trash содержит книгу
  - Works for books, scenes, characters
  
- [ ] `e2e/sidebar-accordion.spec.ts` ✅ Accordion для chapters/characters/ideas
  - Click chapter → expands, shows scenes
  - Click another chapter → first collapses, second expands
  - Same for characters, same for ideas
  - Click again → collapses (toggle)

- [ ] `e2e/ideas-panel.spec.ts` ✅ Ideas panel behavior
  - Create idea → auto-expands (pустая идея)
  - Can type text immediately
  - Text persists on reload
  - Empty ideas are always expanded

- [ ] `e2e/ui-labels.spec.ts` ✅ UI text correct
  - "Идеи" label (not "Заметки")
  - "+ Добавить идею" button text

- [ ] All tests in CI pass locally
- [ ] All tests added to CRITICAL_FEATURES.md

## Implementation

### Test Files to Create
```
apps/studio/e2e/
├── trash-persistence.spec.ts      (chapters, series, scenes, characters)
├── sidebar-accordion.spec.ts       (chapters, characters, ideas toggle)
├── ideas-panel.spec.ts             (create, auto-expand, persist)
└── ui-labels.spec.ts               (renamed labels)
```

### Test Structure (Playwright)
```typescript
test.describe('Sprint-35: Trash Persistence', () => {
  test('delete book → reload → verify in trash', async ({ page }) => {
    // 1. Create book
    // 2. Delete to trash
    // 3. Verify in trash section
    // 4. Reload page
    // 5. Verify still in trash
  });

  test('delete scene → reload → verify in trash', async ({ page }) => {
    // Similar flow for scenes
  });
});
```

### Run Tests
```bash
# All E2E tests
npm run test:e2e

# Specific test file
npm run test:e2e e2e/trash-persistence.spec.ts

# Interactive UI mode (watch changes)
npm run test:e2e:ui

# Debug mode (step-by-step)
npm run test:e2e:debug
```

## Updated CRITICAL_FEATURES.md

После написания тестов - добавить в таблицу:
```
| 1 | Trash: books persist | e2e/trash-persistence.spec.ts | ✅ VERIFIED |
| 2 | Trash: scenes persist | e2e/trash-persistence.spec.ts | ✅ VERIFIED |
| 3 | Trash: characters persist | e2e/trash-persistence.spec.ts | ✅ VERIFIED |
| 4 | Accordion: chapters | e2e/sidebar-accordion.spec.ts | ✅ VERIFIED |
| 5 | Accordion: characters | e2e/sidebar-accordion.spec.ts | ✅ VERIFIED |
| 6 | Accordion: ideas | e2e/sidebar-accordion.spec.ts | ✅ VERIFIED |
| 7 | Ideas: auto-expand on create | e2e/ideas-panel.spec.ts | ✅ VERIFIED |
```

## Testing & Validation
- [ ] All tests pass locally
- [ ] Tests pass on CI (GitHub Actions)
- [ ] No flaky tests (run 3 times)
- [ ] Coverage: 100% of critical features

## Complexity Estimate
- 2-3 hours (writing tests, not features)

## Notes
После этого Step Card остальные функции будут protected тестами.
При следующей регрессии - тесты падают на CI, PR не merge.
