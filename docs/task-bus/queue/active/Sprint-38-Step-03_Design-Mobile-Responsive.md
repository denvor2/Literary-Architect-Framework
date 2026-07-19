# Sprint-38-Step-03: Design Mobile & Tablet Responsive

**Статус:** PENDING  
**Приоритет:** 🟡 СРЕДНИЙ  
**Зависит от:** Sprint-38-Step-01 (Stats), Sprint-38-Step-02-Continuation (Experts)

---

## Требование

После реализации Statistics (Step-01) и Custom Experts (Step-02) интерфейс нужно адаптировать для **мобильных и планшетных экранов**. Сейчас все работает на desktop, но на мобилях:

- Текст может быть слишком мелким или длинным
- Кнопки могут быть неудобными для касания
- Лейауты ломаются на узких экранах
- AssistantPanel может перекрывать контент

---

## Что нужно сделать

### Part A: Брейкпоинты и Тестирование

**Тестировать на:**
- 📱 Mobile: 320px, 375px (iPhone), 414px
- 📱 Tablet: 768px (iPad), 1024px (iPad Pro)
- 🖥️ Desktop: 1920px, 2560px (для проверки что не сломано)

**Инструмент:** Chrome DevTools → Toggle device toolbar

### Part B: Ключевые компоненты для адаптации

1. **Header** (`src/components/Header.tsx`)
   - На мобилях: скрыть некритичные кнопки, сделать меню hamburger
   - Логотип должен быть видим
   - Поиск на мобилях может быть скрыт

2. **Sidebar** (`src/components/Sidebar.tsx`)
   - На мобилях: скрыть/свернуть по умолчанию (или drawer menu)
   - На планшетах: сделать более узкой

3. **EditorArea** (`src/components/EditorArea.tsx`)
   - На мобилях: AssistantPanel может быть внизу в drawer (не сбоку)
   - Textarea должна быть удобна для касания (padding, размер)

4. **AssistantPanel** (`src/components/AssistantPanel.tsx`)
   - На мобилях: может быть в нижнем drawer или заменять editor
   - Кнопки (режимы, эксперты) должны быть больше для касания
   - Текст input должен быть удобным

5. **StatsFooter** (`src/components/StatsFooter.tsx`)
   - ✅ Уже адаптирована (проверить на мобилях)

### Part C: Tailwind Utility Classes

Используй существующие Tailwind breakpoints:
```
sm:   @media (min-width: 640px)    ← планшеты
md:   @media (min-width: 768px)    ← планшеты
lg:   @media (min-width: 1024px)   ← desktop
xl:   @media (min-width: 1280px)   ← большие мониторы
2xl:  @media (min-width: 1536px)   ← очень большие
```

**Примеры:**
- `text-sm md:text-base` — меньший размер на мобилях, нормальный на планшетах
- `hidden md:block` — скрыть на мобилях, показать на планшетах
- `w-full md:w-80` — полная ширина на мобилях, фиксированная на планшетах

### Part D: Удобство касания

- **Touch target минимум:** 44x44px (Apple guidelines)
- Кнопки должны быть не менее 44px high
- Spacing между кнопками ≥ 8px
- Не полагайся на hover — на мобилях его нет!

### Part E: E2E Тесты

Добавить тесты для мобильного вида:
```typescript
// e2e/responsive.spec.ts
test("mobile: sidebar collapses on small screens", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  // проверить что sidebar скрыта или drawer
});

test("mobile: assistant panel is accessible", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  // проверить что эксперты видны и кликаются
});
```

---

## Файлы для изменения

**Обязательно:**
1. src/components/Header.tsx
2. src/components/Sidebar.tsx
3. src/components/EditorArea.tsx
4. src/components/AssistantPanel.tsx
5. src/app/page.tsx (главный layout)

**Опционально:**
- Любые другие компоненты которые выглядят плохо на мобилях

**Новые файлы:**
- e2e/responsive.spec.ts (тесты на responsive)

---

## Стоп-условие (Definition of Done)

✅ Header работает на мобилях (текст читаемый, кнопки кликаются)
✅ Sidebar адаптирована (не перекрывает контент)
✅ EditorArea читаемо на 375px и 768px
✅ AssistantPanel доступна и удобна на мобилях
✅ Все кнопки ≥ 44px и удобны для касания
✅ E2E тесты на 375px и 768px viewports
✅ npm run build проходит
✅ npm run test:e2e проходит
✅ Нет регрессий на desktop (1920px)

---

## Acceptance Criteria

- [ ] На 375px все компоненты видны и доступны (не обрезаны)
- [ ] На 768px (iPad) интерфейс удобный и не слишком узкий
- [ ] На 1920px (desktop) регрессий нет
- [ ] Все кнопки имеют минимум 44x44px
- [ ] Текст читаемый на всех размерах (не слишком мелкий)
- [ ] E2E тесты проходят на mobile viewports
- [ ] Dark mode работает везде
- [ ] Нет горизонтального скролла на узких экранах

---

## Примечание

Это не переделка дизайна — это адаптация существующего дизайна для меньших экранов. Используй те же colors, components, patterns.

Если что-то выглядит очень плохо на мобилях → обсуди с Product Owner перед кодингом.

