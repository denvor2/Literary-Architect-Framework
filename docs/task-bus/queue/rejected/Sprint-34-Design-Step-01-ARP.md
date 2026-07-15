id: Sprint-34-Design-Step-01-ARP
date: 2026-07-14
status: COMPLETE

# Sprint-34-Design-Step-01: Audit Desktop Layout (1200px+) — ARP

## Что сделано

Проведён аудит текущего Desktop UI (1200px+) без изменений кода.

### Анализ структуры 3-колоночного layout

**Текущее состояние: ✅ СООТВЕТСТВУЕТ целевому layout**

```
┌─────────────────────────────────────────────────────────────┐
│ Header (h-14, flex, gap-4)                                  │
├──────────┬──────────────────────────┬──────────────────────┤
│          │                          │                      │
│ Sidebar  │      EditorArea          │  AssistantPanel      │
│ w-64     │      flex-1              │  flex-1              │
│ shrink-0 │      p-8                 │  p-4                 │
│ p-4      │                          │  border-l-1          │
│          │                          │                      │
└──────────┴──────────────────────────┴──────────────────────┘
```

**Подтверждено в коде:**
- Header: `h-14` (56px), flex row, gap-4 ✓
- Sidebar: `w-64 shrink-0` (256px), `p-4` (16px) ✓
- Editor: `flex-1`, `p-8` (32px) ✓
- Assistant: `flex-1`, `border-l` (1px separator) ✓
- Responsive: `lg:flex-row` на 1024px ✓

---

## Gaps выявлены (без code changes)

### HIGH Priority (требуют внимания перед Step-02)

| # | Gap | Где | Почему |
|---|-----|-----|--------|
| 1 | Header меню (File/Edit/View/Help) не реализованы | Header.tsx | Планируется Step-35 |
| 2 | Sidebar spacing: item gap слишком мал (gap-1 = 4px) | Sidebar.tsx | Нужен gap-2 (8px) для комфорта |
| 3 | Нет видимых focus states в inputs | EditorArea | WCAG требует focus-ring |
| 4 | Dark mode не проверена визуально | globals.css | Требуется live verify |
| 5 | Button touch targets (h-10 w-10) малы на мобильных | AssistantPanel | Step-04 (mobile) |

### MEDIUM Priority (улучшения)

| # | Gap | Где | Почему |
|---|-----|-----|--------|
| 6 | Editor padding p-8 (32px) может быть избыточным | EditorArea | Рассмотреть p-6 |
| 7 | Input field padding inconsistent (px-3 py-2 vs px-2 py-1) | EditorArea | Стандартизировать |
| 8 | Assistant panel width не явно задана | AssistantPanel | Добавить lg:w-80 |
| 9 | Sidebar section gap = 0 (no spacing between sections) | Sidebar | Добавить gap-2 |
| 10 | Divider слишком тонкий (w-1.5 = 6px) | page.tsx | Рассмотреть w-2 |

---

## TODO для Steps 02-07

### Step-02: Desktop Layout Fix
- [ ] Увеличить Sidebar item gap: gap-1 → gap-2 (4px → 8px)
- [ ] Добавить gap между major sections: gap-0 → gap-2
- [ ] Добавить focus:ring-1 focus:ring-zinc-400 на inputs
- [ ] Пересмотреть Editor padding: p-8 → p-6 (проверить на скриншоте)
- [ ] Стандартизировать input field padding на px-3 py-2

### Step-03: Tablet Layout (768-1024px)
- [ ] Hamburger меню для Sidebar collapse
- [ ] Responsive Assistant Panel width

### Step-04: Mobile Layout (<768px)
- [ ] Bottom tab navigation (Collection/Editor/Helpers)
- [ ] Увеличить button touch targets: h-10 w-10 → h-11 w-11

### Step-05: Dark Mode Polish
- [ ] Live verify контрастность на dark mode
- [ ] Проверить border colors в темном режиме
- [ ] Убедиться focus states видны на обоих режимах

### Step-06: Icons & Accessibility
- [ ] Audit иконок (lucide-react)
- [ ] Добавить ARIA labels
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Lighthouse score 90+

---

## Валидация

### Структура Layout ✓
- Header: `h-14` (56px)
- Sidebar: `w-64` (256px)
- Editor: `flex-1` (растягивается)
- Assistant: `flex-1` (правая колонка)
- Divider: `w-1.5` (6px, gray border)

### Spacing & Padding ✓ (но требует улучшений)
- Header gap: `gap-4` (16px) — OK
- Sidebar padding: `p-4` (16px) — OK, но items gap мал
- Editor padding: `p-8` (32px) — большой, рассмотреть p-6
- Assistant padding: `p-4` (16px) — OK

### Typography ✓
- Logo: `text-lg font-semibold` — OK
- Headings: `text-2xl font-semibold` — OK
- Body: `text-sm` — OK
- Иерархия правильная

### Colors ✓ (но требует визуальной verify)
- Light: zinc-50, white, zinc-200 borders — OK
- Dark: black, zinc-950, zinc-800 borders — требует verify

---

## Отклонения от Step Card

**Нет отклонений.**

Step Card требовал только аудит текущего состояния без code changes — требование выполнено. Никаких модификаций кода не сделано.

---

## Status

**READY FOR REVIEW**

ARP содержит полный аудит без code changes. Gaps идентифицированы для Step-02-07 с конкретными TODO.
