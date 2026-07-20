# Sprint-39-Step-02: Header Component + Drawer State Management

**Статус:** PENDING  
**Приоритет:** 🔴 КРИТИЧЕСКИЙ  
**Зависит от:** Sprint-39-Step-01 (Drawer Navigation)

---

## Требование

Header отображает два состояния:
- **A (без книги):** Logo "Lib" + Avatar + Settings icon
- **B (с открытой книгой):** Back button + Book title + Breadcrumb + Avatar + Settings icon

На мобилях header всегда видна в top-fixed позиции, title/breadcrumb реактивно обновляются при переключении глав/сцен.

---

## Что нужно сделать

### Part A: Header Component Creation

**Файл:** `src/components/Header.tsx` (рефакторинг для мобилей)

1. **Props:**
   ```typescript
   interface HeaderProps {
     book?: Book | null;
     chapter?: Chapter | null;
     scene?: Scene | null;
     onBackClick?: () => void;
     onSettingsClick?: () => void;
     isDrawerOpen?: boolean;
     onDrawerToggle?: () => void;
   }
   ```

2. **Состояние A (без книги):**
   - Левый край: Logo "Lib" (16px, 500 weight)
   - Правый край: Avatar (26px circle) + Settings icon (20px)
   - Padding: 12px horizontal, 10px vertical

3. **Состояние B (с книгой):**
   - Left: chevron-left icon (20px, clickable back button) + Book title (15px/500, ellipsis max-width)
   - Under title: Breadcrumb (12px, muted) — "Series · Chapter N / Scene M" (or just "Chapter N" if no series)
   - Right: Avatar (24px) + Settings icon (18px)
   - Padding: 10px horizontal, 8px vertical (compact)
   - Title area: `min-width: 0` to enable ellipsis

### Part B: Responsive Behavior

**На мобилях (375px-640px):**
- Header всегда fixed top, z-index: 30
- Background: `--surface-2`
- Border-bottom: 0.5px solid `--border`
- Height: ~52px (state A) / ~60px (state B, with breadcrumb)

**На планшетах (768px+):**
- Header тот же, но title может быть шире
- Hamburger меню (если реализовано в Step-01) может быть скрыто

### Part C: Chevron-Left (Back Button) Behavior

- Показывается только в состоянии B (когда книга открыта)
- On click: вызвать `onBackClick()` → переход в Library/Collection screen
- Color: `--text-secondary`
- Hover: слегка светлеет
- Tap target: минимум 44x44px (padding вокруг иконки)

### Part D: Title + Breadcrumb Reactivity

- **Обновляется в реальном времени** при переключении chapter/scene в редакторе
- Для breadcrumb логика:
  - Если `book.seriesId` → показать "Series name · Chapter N / Scene M"
  - Если нет series → показать только "Chapter N / Scene M"
  - Truncate с ellipsis, если строка > 40 символов
- Text color: title — `--text-primary`, breadcrumb — `--text-muted`

### Part E: Integration with page.tsx

**В page.tsx:**
- Pass `book`, `chapter`, `scene` props в `<Header />`
- Implement `onBackClick` → `setActiveTab('collection')` (переключение на Library screen)
- Implement `onSettingsClick` → open settings bottom sheet (реализовано в Step-04)

---

## Файлы для изменения

**Обязательно:**
1. [src/components/Header.tsx](src/components/Header.tsx) — полный рефакторинг для мобилей
2. [src/app/page.tsx](src/app/page.tsx) — pass book/chapter/scene props, handle back/settings clicks

**Опционально:**
- Tailwind config — если нужны custom media queries

---

## Стоп-условие (Definition of Done)

✅ Header отображает состояние A (без книги) корректно  
✅ Header отображает состояние B (с книгой) с breadcrumb  
✅ Chevron-left (back button) видим только в состоянии B  
✅ Back button работает: переводит в Collection screen  
✅ Title + breadcrumb реактивно обновляются при переключении chapter/scene  
✅ Tap target back button ≥ 44x44px  
✅ Header fixed-top на мобилях, не смещает контент  
✅ npm run build успешен  
✅ Нет регрессий vs Sprint-38-Step-03 (responsive)  
✅ E2E тест: header state changes при переключении сцены  

---

## Acceptance Criteria

- [ ] Header состояние A видимо и точно совпадает с макетом (02-header-states.html)
- [ ] Header состояние B видимо с back button, title, breadcrumb
- [ ] Breadcrumb обновляется реактивно при смене chapter/scene
- [ ] Back button нажимается, переводит в Collection (меняет tab)
- [ ] На 375px header компактный, title имеет ellipsis
- [ ] На 768px+ title может быть шире без проблем
- [ ] Avatar отображает инициал пользователя
- [ ] Settings icon кликабельна, размер ≥ 44x44px
- [ ] E2E тест: select scene → check header title updated

---

## Ссылки на макеты

- **State A:** 02-header-states.html (top section "Без выбранной книги")
- **State B:** 02-header-states.html (bottom section "Книга выбрана")

