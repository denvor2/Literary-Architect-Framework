id: Sprint-35-Menu-Step-02
name: "Edit меню: Undo, Redo, Cut/Copy/Paste, Delete, Select All"
type: implementation

## Objective

Реализовать **Edit** меню:

```
✏️ Правка
├── ↶ Отмена (Ctrl+Z)            → undo() [if available, else disabled]
├── ↷ Повтор (Ctrl+Y)            → redo() [if available, else disabled]
├── ─────────────────
├── ✂️ Вырезать (Ctrl+X)         → browser cut (focus on editor)
├── 📋 Копировать (Ctrl+C)       → browser copy
├── 📌 Вставить (Ctrl+V)         → browser paste
├── ─────────────────
├── 🗑️ Удалить (Del)             → delete activeBook (with confirm)
├── ─────────────────
└── ✓ Выделить всё (Ctrl+A)      → select all text in editor
```

## Scope

### Allowed paths:
- apps/studio/src/components/Header.tsx (Edit menu)
- apps/studio/src/app/page.tsx (pass callbacks)
- apps/studio/src/hooks/useWorkspaceController.ts (check undo/redo availability)

### Forbidden:
- Реализовать undo/redo (если их нет — disable пункты)

## Implementation

**Undo/Redo:**
- Проверить есть ли `workspaceController.undo()` и `.redo()`
- Если не реализованы → disabled (серый цвет)
- Если реализованы → enabled

**Cut/Copy/Paste:**
- Работают браузерные события
- Enabled если editor в фокусе
- Disabled если focus не в textarea

**Delete:**
- Удалить activeBook
- Confirm dialog: "Удалить книгу '[название]'?"

**Select All (Ctrl+A):**
- Выделить весь текст в editor
- Работает если focus в textarea

## Validation

1. Меню Edit открывается
2. Undo/Redo disabled (если нет в workspace)
3. Delete activeBook работает (с confirm)
4. Ctrl+X / Ctrl+C / Ctrl+V браузерные
5. Ctrl+A выделяет текст

## Output

ARP в docs/task-bus/queue/active/:
1. Скриншоты Edit меню (enabled/disabled states)
2. Скриншот Delete с confirm dialog
3. Результат build

## Stop Condition

Edit меню готово (Undo/Redo disabled if not impl, остальное работает).
