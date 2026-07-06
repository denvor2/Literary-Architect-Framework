id: Sprint-12-Step-03
name: "AI Bus (код): coauthor_draft operation + bookContext в improve_text"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/ai/operations.ts
- apps/studio/src/ai/aiBus.ts

Forbidden paths:
- apps/studio/src/app/api/** (все готовы, не трогай)
- любой UI-код

## Objective

Расширить AI Bus v5 для Co-author (новая операция) и Editor
(расширенный контекст) — по образцу того, как раньше добавлялся
critic_review/reader_reaction.

### operations.ts

Добавить четвёртый вариант в union, и расширить payload
improve_text — используем сам тип Book из model.ts напрямую как
bookContext (без упрощения/зачистки id — backend не валидирует
структуру строго, id в контексте не мешают, лишняя трансформация
не нужна):

```typescript
import type { Book } from "@/domain/model";

export type AIOperation =
  | { type: "improve_text"; payload: { text: string; sceneId?: string; chapterId?: string; bookContext?: Book } }
  | { type: "critic_review"; payload: { text: string; sceneId?: string; chapterId?: string } }
  | { type: "reader_reaction"; payload: { text: string; sceneId?: string; chapterId?: string } }
  | { type: "coauthor_draft"; payload: { currentText: string; bookContext: Book } }
```

(critic_review/reader_reaction — без изменений, они не входят в
таблицу контекстов "видит книгу целиком", остаются как есть).

### aiBus.ts

Добавить четвёртую ветку роутинга: "coauthor_draft" → /api/coauthor,
тело запроса { currentText, bookContext }. Ответ /api/coauthor:
{ ok: true, result: string } — как у improve_text, результат
напрямую в AIResponse.text, без техдолга/TODO (форма уже строка,
как у reader_reaction).

Ветка "improve_text" — обновить, чтобы передавать bookContext в
теле запроса к /api/line-editor, если он присутствует в payload
(просто добавить поле к телу запроса, остальная логика не меняется).

Обновить exhaustiveness-check — теперь четыре варианта.

## Rules

- Не трогай ни один route.ts — все уже готовы (Step 01/02).
- critic_review/reader_reaction — не расширять контекстом, они вне
  этой таблицы.
- TypeScript должен компилироваться без ошибок (exhaustiveness-check
  включительно).

## Validation

- npm run build / npx tsc --noEmit → 0 ошибок.
- npm run lint — чисто.
- Живая проверка: aiBus.execute() с type: "coauthor_draft" доходит
  до /api/coauthor и возвращает результат; type: "improve_text" с
  bookContext в payload — доходит до /api/line-editor с bookContext
  в теле; type: "improve_text" БЕЗ bookContext — поведение идентично
  (регрессия).
- grep -c "coauthor_draft" operations.ts → 1, aiBus.ts → >= 1.
- Приложи изменённые файлы целиком.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
