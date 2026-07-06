id: Fix-Assistant-Button-Label-Ask
name: "Кнопка помощника: единая подпись 'Спросить' вместо названия режима"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/components/EditorArea.tsx

Forbidden paths:
- всё остальное

## Objective

Product Owner уточнил решение из предыдущего фикса (Fix-Assistant-
Button-Label): показывать название режима на кнопке избыточно — оно
уже видно в выпадающем списке над кнопкой. Единая подпись для всех
режимов: "Спросить".

Найти:
```typescript
{status === "loading" ? info.preamble : mode}
```

Заменить на:
```typescript
{status === "loading" ? info.preamble : "Спросить"}
```

## Rules

- Минимальное изменение — только текст кнопки.
- Не трогай остальную логику/вёрстку.

## Validation

- npm run build / npm run lint / prettier --check — чисто.
- Живая проверка: кнопка показывает "Спросить" независимо от
  выбранного режима в списке.
- Приложи изменённый фрагмент.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
