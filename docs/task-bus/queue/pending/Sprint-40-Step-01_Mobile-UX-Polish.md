# Sprint-40-Step-01: Mobile UX Polish (Tab-bar & Stats Visibility)

**Статус:** PENDING  
**Приоритет:** 🟠 ВЫСОКИЙ  
**Зависит от:** Sprint-39-Step-07 (Mobile Layout Fixes)

---

## Требование

На мобилях (375px) Tab-bar (Коллекция/Редактор/Помощники) и StatsFooter должны быть **ВСЕГДА видны**, даже когда открыта боковая панель библиотеки.

Текущий UX: панель библиотеки открывается на полную ширину и скрывает tab-bar и статистику.

---

## Что нужно сделать

### Part A: Z-index Fix

**MobileBottomNav.tsx:**
- Повысить z-index с z-30 на z-60
- Tab-bar всегда над bottom sheets (z-45/50)
- Всегда кликабельна и видима

**StatsFooter.tsx:**
- Добавить z-index: z-55
- Видима над bottom sheets
- Не скрывается при открытии drawer'а

### Part B: Live Verification

На 375px viewport:
- [ ] Открыть библиотеку (боковая панель)
- [ ] Tab-bar видима внизу
- [ ] Stats footer видима (Слов/Знаков/Без пробелов)
- [ ] Обе кликабельны
- [ ] Тап на видимой части Editor закрывает панель

### Part C: E2E Tests

Добавить тесты в mobile-bottom-sheets.spec.ts:
- [ ] Tab-bar z-index >= 60
- [ ] Stats footer z-index >= 55
- [ ] Both visible when bottom sheet open
- [ ] Both clickable on 375px

---

## Стоп-условие

✅ Tab-bar всегда видима (z-60)  
✅ Stats footer всегда видима (z-55)  
✅ Обе кликабельны при открытой панели  
✅ E2E тесты passing  
✅ npm run build успешен  

---

## Acceptance Criteria

- [ ] Tab-bar видима внизу на всех mobile viewports
- [ ] Stats footer видима над tab-bar
- [ ] Z-index stacking: z-60 (tab-bar) > z-55 (stats) > z-50 (sheets)
- [ ] Оба элемента функциональны (кликабельны)
- [ ] E2E тесты verify visibility

