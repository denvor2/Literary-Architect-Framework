# Sprint-38-Step-04: Design Polish & Refinement

**Статус:** PENDING  
**Приоритет:** 🟡 СРЕДНИЙ  
**Зависит от:** Sprint-38-Step-01 (Stats), Sprint-38-Step-02-Continuation (Experts), Sprint-38-Step-03 (Mobile)

---

## Требование

После реализации Statistics, Custom Experts и Mobile Responsive нужно сделать финальный **polish** интерфейса:

1. 🌙 **Dark mode refinement** — улучшить контрастность, цвета, согласованность
2. 🎨 **Icons consistency** — lucide-react иконки везде (вместо эмодзи)
3. ♿ **Accessibility (a11y)** — ARIA labels, keyboard navigation, screen readers
4. ✨ **Visual polish** — spacing, shadows, borders, transitions

---

## Что нужно сделать

### Part A: Dark Mode Refinement

**Проверить цветовую схему на всех компонентах:**
- Контрастность текста: минимум 4.5:1 (WCAG AA)
- Цвета иконок: согласованные с текстом
- Backgrounds: zinc, not pure black (0, 0, 0)
- Borders: видимы в обе темы

**Инструмент:** Chrome DevTools → Inspect → Accessibility → Color Contrast Analyzer

### Part B: Icons Consistency

**Заменить оставшиеся эмодзи на lucide-react иконки:**
- Header: 🔍 → Search icon, ⚙️ → Settings icon
- Sidebar: ✏️ → Edit icon, 📝 → File icon
- Buttons: 🗑️ → Trash2 icon, ⚙️ → Settings icon, ✨ → Wand2 icon
- Chat: 📤 → Send icon, ❌ → X icon

**Стиль:** 18px (text-lg), consistent colors

### Part C: Accessibility (a11y)

**Обязательно:**
1. Все интерактивные элементы имеют `aria-label` или видимый текст
2. Кнопки имеют `:focus` state (outline или bg-change)
3. Form inputs имеют `<label>` элементы
4. Links отличаются от обычного текста (underline или color)
5. Images имеют `alt` текст
6. Heading hierarchy правильна (h1 → h2 → h3)

**Тестирование:**
- Chrome DevTools → Accessibility tree
- axe DevTools браузер расширение
- Keyboard-only навигация (Tab, Enter, Escape)

### Part D: Visual Polish

**Spacing & Layout:**
- Consistent gaps между элементами (gap-2, gap-3, gap-4)
- Padding на кнопках (px-3 py-1.5 или px-4 py-2)
- Margin на sections (mb-4, mt-6)

**Shadows & Borders:**
- Card shadows: shadow-sm или shadow (не shadow-2xl)
- Borders: border-zinc-200 light, border-zinc-800 dark
- Rounded corners: rounded или rounded-lg (не rounded-3xl)

**Transitions:**
- Hover effects: transition-colors duration-200
- Button clicks: active: scale-95 (не нужны long animations)

**Consistency checklist:**
- Все кнопки одного стиля (не mix styles)
- Все inputs одного стиля
- Все modals одного стиля
- Цвета: используй Tailwind palette (не custom colors)

---

## Файлы для проверки

**Обязательно:**
1. src/components/Header.tsx
2. src/components/Sidebar.tsx
3. src/components/EditorArea.tsx
4. src/components/AssistantPanel.tsx
5. src/components/dialogs/CustomExpertsDialog.tsx
6. src/app/page.tsx

**Опционально:**
- Любые другие компоненты с эмодзи или плохой a11y

---

## Стоп-условие (Definition of Done)

✅ Dark mode: контрастность ≥4.5:1 везде
✅ Icons: все эмодзи заменены на lucide-react
✅ a11y: все интерактивные элементы имеют ARIA labels
✅ a11y: keyboard navigation работает (Tab, Enter, Escape)
✅ Visual: spacing консистентно, shadows одного стиля
✅ npm run build проходит
✅ No TypeScript errors
✅ axe DevTools отчёт: 0 критических ошибок

---

## Acceptance Criteria

- [ ] Все кнопки имеют :focus state
- [ ] Все inputs имеют label элементы
- [ ] Контрастность текста ≥4.5:1 в обе темы
- [ ] Не осталось эмодзи (только иконки)
- [ ] Spacing согласован везде (gap-2/3/4, px-3/4, py-1.5/2)
- [ ] Shadows одного типа (shadow-sm или shadow)
- [ ] axe DevTools не находит критических ошибок
- [ ] Keyboard-only навигация работает
- [ ] Dark mode выглядит так же хорошо как light mode

---

## Примечание

Это не новый функционал — это polish существующего интерфейса. После этого шага приложение будет production-ready по дизайну и доступности.

