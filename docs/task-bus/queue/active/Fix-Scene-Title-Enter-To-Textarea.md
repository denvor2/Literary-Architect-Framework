id: Fix-Scene-Title-Enter-To-Textarea
name: "UX: Enter в поле названия сцены переводит фокус на текст сцены"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/components/EditorArea.tsx

Forbidden paths:
- всё остальное

## Objective

Product Owner подтвердил: автофокус на названии сцены при создании
работает хорошо, но нет клавиатурного перехода к основному текстовому
полю после ввода названия — только мышью.

Добавить onKeyDown на input названия сцены: по нажатию Enter —
preventDefault() (в input Enter по умолчанию ничего не делает, так
как формы нет, но preventDefault на всякий случай, чтобы не было
неожиданного поведения) и перевести фокус на textarea текста сцены
через уже существующий textareaRef.

```typescript
<input
  value={selectedScene.title}
  onChange={...}
  onKeyDown={(event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      textareaRef.current?.focus();
    }
  }}
  placeholder="Scene title..."
  ...
/>
```

Tab НЕ трогать — оставить стандартный порядок браузера (дойдёт до
textarea естественным образом, просто на один шаг позже, через
кнопку "Фокус"/"Exit Focus") — намеренно не переопределяем tabIndex,
чтобы не портить доступность остальной навигации.

## Rules

- Минимальное изменение — один onKeyDown на одном input.
- Не трогай Tab-порядок/tabIndex.
- Убедись, что textareaRef действительно уже существует и доступен
  в этой области видимости (упоминается в предыдущих ARP как
  "unchanged: textareaRef") — если по какой-то причине его там нет
  в ожидаемом виде, опиши это в ARP вместо того, чтобы импровизировать.

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка: выделить название сцены (или создать новую — уже
  автофокус), нажать Enter — фокус переходит в textarea текста
  сцены, курсор готов к вводу.
- Приложи изменённый фрагмент.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
