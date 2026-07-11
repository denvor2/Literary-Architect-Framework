id: Sprint-26-Step-01
name: "Скрыть кнопку Фокус (Focus Mode)"
type: feature

## Контекст

Product Owner решил скрыть кнопку "Фокус" по умолчанию. Функциональность остаётся в коде,
но кнопка удаляется из UI (для возможности восстановления в будущем, если понадобится).

## Scope

Allowed paths:
- apps/studio/src/components/EditorArea.tsx
- apps/studio/src/app/globals.css (если нужны стили)

Forbidden paths:
- Никакой логики `isFocusMode` не удаляется, только кнопка (UI)
- `onToggleFocusMode` callback остаётся неиспользованным до восстановления

## Rules

- Удалить кнопку "Фокус" / "Выйти из фокуса" из UI (строки 332-337 в EditorArea.tsx)
- Логика Focus Mode остаётся нетронутой в коде (для восстановления)
- Кнопка "Свернуть/Развернуть" реквизиты остаётся

## Validation

- npx tsc --noEmit - чисто
- npx eslint src - чисто
- npm run build - чисто
- Живая проверка (npm run dev): кнопка не видна, реквизиты показываются с кнопкой Свернуть

## Output

ARP файлом в docs/task-bus/queue/active/.

## Stop Condition

Не коммитить без подтверждения Product Owner.
