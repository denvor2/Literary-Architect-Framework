id: Sprint-34-Design-Step-04
name: "Mobile layout (<768px): Bottom tab navigation (Collection/Editor/Helpers)"
type: implementation

## Objective

Mobile-first layout с bottom tab navigation:
- Top bar: compact (☰ menu, logo, search, theme)
- Breadcrumb: Серия > Книга
- Formatting bar: B/I/U/H1
- Main area: fullscreen Editor (текущий tab)
- Bottom tabs: 📊 Коллекция | 📝 Редактор | 💬 Помощники
- Status bar: Слов, прогресс

Breakpoint: <768px

## Scope

### Allowed paths:
- apps/studio/src/app/page.tsx (tab state)
- Новый компонент: MobileBottomNav.tsx
- apps/studio/src/components/Sidebar.tsx (modal on mobile)
- apps/studio/src/components/AssistantPanel.tsx (modal on mobile)
- apps/studio/globals.css (@media (max-width: 768px))

## Validation

1. iPhone 12 (390px) — скриншот
2. iPhone 14 Pro Max (430px) — скриншот
3. Tabs переключаются (tap на tab → показать content)
4. Editor fullscreen на мобильном
5. Sidebar/Helpers открываются в modal
6. Status bar видим
7. Темная тема работает

## Output

ARP в docs/task-bus/queue/active/:
1. 6+ скриншотов (Collection tab, Editor tab, Helpers tab — light & dark)
2. GIF: tab switching
3. Результат build

## Stop Condition

Mobile выглядит как макет (3 tabs внизу).
