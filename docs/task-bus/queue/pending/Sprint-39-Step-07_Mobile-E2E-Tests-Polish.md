# Sprint-39-Step-07: Mobile E2E Tests & Polish

**Статус:** PENDING  
**Приоритет:** 🟠 ВЫСОКИЙ  
**Зависит от:** Sprint-39-Step-06 (Assistants Screen)

---

## Требование

Написать E2E тесты для всех мобильных функций (drawer, header, bottom sheets) и провести финальную полировку дизайна (spacing, colors, animations, dark mode).

---

## Что нужно сделать

### Part A: E2E Tests (apps/studio/e2e/mobile-navigation.spec.ts)

**Test Suite 1: Header States**
```
✓ Header без книги отображает Logo + Avatar + Settings
✓ Header с книгой отображает Back + Title + Breadcrumb
✓ Back button переводит в Collection
✓ Title обновляется при смене Scene
✓ Breadcrumb отображает Series · Chapter / Scene
```

**Test Suite 2: Drawer Navigation (375px)**
```
✓ Sidebar скрыта по умолчанию
✓ Hamburger button открывает drawer
✓ Drawer overlay закрывает drawer при клике
✓ Escape закрывает drawer
✓ Клик на Scene в drawer закрывает drawer и показывает редактор
✓ Drawer slide-in animation smooth (не jarring)
```

**Test Suite 3: Bottom Sheets**
```
✓ Settings icon открывает SettingsSheet
✓ Menu dots на Scene открывает ActionsSheet
✓ ActionsSheet меню действия работают (rename, move, etc.)
✓ Delete требует подтверждения (не одним тапом)
✓ Overlay закрывает bottom sheet
✓ Escape закрывает bottom sheet
✓ AI Tools panel открывается кнопкой в toolbar
```

**Test Suite 4: Responsive Behavior**
```
✓ На 375px: drawer visible, sidebar не видна, hamburger видим
✓ На 480px: drawer visible, hamburger видим
✓ На 768px: drawer скрыт, sidebar visible, hamburger скрыт
✓ На 1024px+: desktop layout, no drawer
```

**Test Suite 5: No Horizontal Scroll**
```
✓ На 375px нет горизонтального scroll'а основного контента
✓ Toolbar горизонтально скроллится без breaking layout
✓ Bottom sheet не вызывает горизонтальный scroll
```

### Part B: Design Polish

**Colors & Contrast:**
- ✅ Все text контрастны на светлом фоне (WCAG AA minimum)
- ✅ Dark mode colors протестированы (если есть)
- ✅ Accent color (#185fa5) всегда выделяется

**Spacing & Alignment:**
- ✅ Padding consistent: 12px, 14px, 10px
- ✅ Gaps между компонентами: 6px, 8px, 10px
- ✅ Dividers align'd correctly

**Typography:**
- ✅ Font sizes: 11px, 12px, 13px, 14px, 15px, 16px consistent
- ✅ Font weights: 400 (normal), 500 (medium), correct usage
- ✅ Line heights: 1.7 для voice (serif), 1.5 для sans

**Animations:**
- ✅ Drawer slide: 300ms ease-in-out
- ✅ Bottom sheet slide: 300ms ease-in-out
- ✅ Overlay fade: 200ms ease-in
- ✅ Button press: 150ms transition (if any)

**Touch Targets:**
- ✅ All buttons ≥ 44x44px tap zone
- ✅ Icons have padding around them
- ✅ No accidentally-clickable areas too close

**Dark Mode:**
- ✅ Colors update correctly (if dark mode implemented)
- ✅ Contrast maintained in dark mode
- ✅ No white text on light background in dark mode

### Part C: Browser/Device Testing

**Desktop (Chrome DevTools):**
- ✅ 375px (iPhone 12 Mini)
- ✅ 480px (Galaxy S9)
- ✅ 768px (iPad)
- ✅ 1024px (iPad Pro)
- ✅ 1920px (Desktop)

**Real Device (if available):**
- ✅ iPhone/Android 375px
- ✅ iPad 768px
- ✅ Desktop 1920px

**Orientation:**
- ✅ Portrait 375x812 (iPhone 12)
- ✅ Landscape 812x375 (iPhone 12)

### Part D: Regression Tests

**Ensure no regressions vs Sprint-38-Step-03:**
```
✓ Editor text input still works
✓ Assistant panel still functions
✓ Stats footer still updates
✓ No console errors
✓ No broken links
```

---

## Файлы для изменения

**Новые:**
1. [apps/studio/e2e/mobile-navigation.spec.ts](apps/studio/e2e/mobile-navigation.spec.ts) — E2E тесты

**Обновить:**
2. [apps/studio/e2e/responsive.spec.ts](apps/studio/e2e/responsive.spec.ts) — добавить мобильные viewport тесты
3. Все компоненты (Header, Sidebar, BottomSheet, etc.) — final polish

---

## Стоп-условие

✅ Все E2E тесты passing на мобильных viewport'ах  
✅ npm run test:e2e успешен  
✅ npm run build успешен  
✅ npm run validate успешен  
✅ Нет console errors на 375px, 768px, 1024px, 1920px  
✅ No horizontal scroll на основном контенте  
✅ Все touch targets ≥ 44x44px  
✅ Animations smooth (60fps)  
✅ Dark mode (if implemented) корректна  
✅ No regressions vs Sprint-38-Step-03  

---

## Acceptance Criteria

- [ ] E2E тесты покрывают drawer, header, bottom sheets, responsive behavior
- [ ] Все тесты passing
- [ ] Design polish: spacing, typography, colors consistent
- [ ] Touch targets accessible (≥ 44x44px)
- [ ] Animations smooth and performant
- [ ] Tested on 375px, 480px, 768px, 1024px, 1920px
- [ ] No console errors
- [ ] Dark mode working (if applicable)
- [ ] No regressions from previous sprints

