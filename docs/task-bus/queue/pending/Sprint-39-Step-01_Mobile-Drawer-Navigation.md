# Sprint-39-Step-01: Mobile Drawer Navigation

**Статус:** PENDING  
**Приоритет:** 🔴 КРИТИЧЕСКИЙ  
**Зависит от:** Sprint-38-Step-03 (Mobile Responsive)

---

## Требование

На мобильных экранах (375px-768px) нужна удобная навигация по Sidebar без переключения между экранами. Текущий UX:

❌ **Сейчас:** Нужно переключать между Editor и Sidebar (теряется контекст)
✅ **Должно быть:** Sidebar выезжает как drawer слева, Editor остается виден

---

## Что нужно сделать

### Part A: Drawer State Management

**В page.tsx добавить:**
1. State для видимости drawer'а: `isSidebarOpen: boolean`
2. Toggle функция: `toggleSidebar()`
3. Close функция: `closeSidebar()`
4. Тригеры:
   - Hamburger button (в Header)
   - Клик на overlay (снаружи drawer'а)
   - Клик на элемент в Sidebar

### Part B: Drawer Component

**Создать или использовать:**
- `<Drawer>` компонент или модал для Sidebar на мобилях
- Position: `fixed left-0 top-0` на мобилях, `relative` на desktop (≥768px)
- Z-index: 40+ (выше контента)
- Backdrop (полупрозрачный overlay) за drawer'ом

### Part C: Responsive Behavior

**На мобилях (375px-640px):**
- Sidebar скрыта по умолчанию
- Hamburger меню видимо в Header
- При клике → drawer выезжает слева
- Drawer占 ~80% ширины экрана
- Overlay за drawer'ом (полупрозрачный)
- Клик на overlay → drawer закрывается

**На планшетах (768px+):**
- Sidebar видима (как в Step-38-Step-03)
- Drawer не используется
- Hamburger меню скрыто

### Part D: Animations

**Smooth transitions:**
- Drawer slide-in: 300ms ease-in-out
- Overlay fade: 200ms ease-in
- Button states: 150ms transition

### Part E: Accessibility

✅ Drawer закрывается на Escape
✅ Focus trap внутри drawer'а (когда открыт)
✅ ARIA labels: `aria-label="Navigation drawer"`, `aria-hidden` на overlay
✅ Keyboard navigation: Tab, Escape

---

## Файлы для изменения

**Обязательно:**
1. src/app/page.tsx — добавить state + handlers
2. src/components/Header.tsx — hamburger button на мобилях
3. src/components/Sidebar.tsx — условная обертка для drawer
4. src/components/Drawer.tsx — новый компонент (или переиспользовать модал)

**Опционально:**
- Анимации в tailwind.config.js (если нужны custom)

---

## Стоп-условие (Definition of Done)

✅ На 375px: Sidebar скрыта, hamburger видим
✅ На 375px: Hamburger открывает drawer
✅ На 375px: Drawer закрывается на Escape или клик overlay
✅ На 768px: Sidebar видима, hamburger скрыт
✅ На 1920px: Нет регрессий vs Sprint-38-Step-03
✅ Animations smooth (300ms)
✅ Focus management работает
✅ npm run build успешен
✅ E2E тесты: drawer open/close на 375px

---

## Acceptance Criteria

- [ ] На мобилях Sidebar недоступна без hamburger
- [ ] Hamburger button видим только на мобилях (<768px)
- [ ] Drawer slide-in/slide-out animations работают
- [ ] Drawer закрывается на Escape
- [ ] Overlay за drawer'ом работает (закрывает при клике)
- [ ] На 768px+ drawer скрыт, Sidebar видима
- [ ] Focus trap работает (Tab внутри drawer'а)
- [ ] Нет горизонтального скролла когда drawer открыт
- [ ] Transition smooth (не jarring)
- [ ] E2E тесты на drawer функционал

---

## Примечание

Это фундамент для удобной мобильной навигации. После этого можно добавлять Header меню и visualization фичи.

