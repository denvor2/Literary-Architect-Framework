id: Fix-Chapter-Subtitle-Undefined-Input
name: "СРОЧНО: чинить controlled/uncontrolled warning для старых глав без subtitle"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/components/EditorArea.tsx

Forbidden paths:
- всё остальное

## Objective

Реальная ошибка в консоли, подтверждена скриншотом Product Owner:
"A component is changing a controlled input to be uncontrolled" на
`value={selectedChapter.subtitle}` в EditorArea.tsx (строка 664).

Причина: главы, созданные ДО Sprint-10-Step-05 (когда поля subtitle
у Chapter ещё не существовало), загружаются из localStorage без
этого поля — selectedChapter.subtitle оказывается undefined, а не
пустой строкой. Та же категория проблемы, что уже чинили в
Fix-Missing-Characters-In-Old-Saved-Workspace — только на этот раз
не на верхнем уровне Workspace, а внутри вложенного объекта Chapter
внутри массива chapters.

Исправление — точечное, на месте использования (не в
loadWorkspace() — там уместен только верхнеуровневый merge, который
уже есть; глубокая миграция вложенных полей — отдельная, более
сложная тема, не нужна для одного поля):

```typescript
<input
  value={selectedChapter.subtitle ?? ""}
  ...
/>
```

Это устраняет переключение controlled/uncontrolled для любых старых
данных, у которых нет subtitle, без изменения формы хранения.

Заодно (профилактически, раз уже здесь) — проверь value={
selectedChapter.title} чуть выше: title существовал у Chapter с
самого начала, поэтому для него эта проблема невозможна — оставь
как есть, без ?? "", просто убедись в этом при чтении файла.

## Rules

- Минимальное изменение — один input, один `?? ""`.
- Не трогай форму хранения/loadWorkspace — тема глубокой миграции
  вложенных полей закрыта для этой задачи.

## Validation

- npm run build / npm run lint — чисто.
- git status --short — только EditorArea.tsx.
- Живая проверка: вручную положить в localStorage главу без
  subtitle (через DevTools) — открыть её в EditorArea, ошибки в
  консоли быть не должно, поле Subtitle показывается пустым и
  редактируемым.
- Приложи изменённый фрагмент (достаточно нескольких строк вокруг
  для контекста).

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect. Приоритетная задача.
