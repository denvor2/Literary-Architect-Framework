id: Sprint-35-Menu-Step-03
name: "View меню: Focus Mode, Theme (Light/Dark), Fullscreen"
type: implementation

## Objective

Реализовать **View** меню:

```
👁️ Вид
├── 🔍+ Увеличить шрифт (Ctrl++)    → fontSize 17px → 18px
├── 🔍- Уменьшить шрифт (Ctrl+-)   → fontSize 17px → 16px
├── ─────────────────
├── ☀️ Светлая тема                 → set theme='light' (show ● if active)
├── ☾ Тёмная тема                   → set theme='dark' (show ● if active)
```

## Scope

### Allowed paths:
- apps/studio/src/components/Header.tsx (View menu)
- apps/studio/src/app/page.tsx (theme/focusMode state)
- apps/studio/globals.css (theme variables)

### Forbidden:
- API changes
- Новые компоненты

**Font Size:**
- State: `fontSize: number` (default 17) в page.tsx
- Store в Editor/EditorArea component
- Ctrl++ → fontSize++
- Ctrl+- → fontSize--
- Min: 12px, Max: 24px
- Persist в localStorage: `"literary-studio:font-size"`

**Theme:**
- State: `theme: 'light' | 'dark'` в page.tsx
- Set на `<html>` element: `data-theme="light"` или `data-theme="dark"`
- Persist в localStorage: `"literary-studio:theme"`
- Radio indicator (● если active)

## Validation

1. Увеличить/Уменьшить шрифт работает (fontSize меняется)
2. Шрифт не идёт ниже 12px и выше 24px
3. Persist: refresh page → same fontSize
4. Theme toggle работает (● indicator, colors меняются)
5. Persist: refresh page → same theme
6. Dark mode colors правильные
7. Ctrl++ и Ctrl+- работают глобально

## Output

ARP в docs/task-bus/queue/active/:
1. Скриншоты View меню
2. Скриншоты Focus Mode вкл/выкл (editor изменения)
3. Скриншоты Theme toggle (light/dark)
4. Результат build

## Stop Condition

View меню готово (все 3 пункта работают).
