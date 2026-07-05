id: Sprint-09-Step-02
name: "AI Bus (код-диспетчер): добавить AIOperation.type reader_reaction"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/ai/operations.ts
- apps/studio/src/ai/aiBus.ts

Forbidden paths:
- apps/studio/src/app/api/reader/route.ts (уже готов, не трогай)
- apps/studio/src/app/api/critic/route.ts
- apps/studio/src/app/api/line-editor/route.ts
- любой UI-код

## Objective

Третий вариант в union (по образцу Sprint-08-Step-02, где добавлялся
critic_review).

### operations.ts

```typescript
export type AIOperation =
  | { type: "improve_text"; payload: { text: string; sceneId?: string; chapterId?: string } }
  | { type: "critic_review"; payload: { text: string; sceneId?: string; chapterId?: string } }
  | { type: "reader_reaction"; payload: { text: string; sceneId?: string; chapterId?: string } }
```

### aiBus.ts

Добавить третью ветку роутинга: "reader_reaction" → /api/reader.
Формат вызова идентичен /api/critic (POST { text }). Ответ от
/api/reader: { ok: true, result: string } | { ok: false, error }.

Так как форма ответа /api/reader — уже string (не массив, как у
critic), результат кладётся в AIResponse.text напрямую, БЕЗ
JSON.stringify и без TODO-комментария — это отличие от critic_review
осознанное и не требует техдолга.

Обнови exhaustiveness-check (`const exhaustiveCheck: never = operation`)
— теперь должен покрывать все три варианта.

## Rules

- Минимальное изменение — только роутинг и новый тип в union.
- Не трогай AIResponse, context.ts, applier.ts, route.ts файлы.
- TypeScript должен компилироваться без ошибок (включая
  exhaustiveness-check).

## Validation

- npm run build — успешно.
- npm run lint — чисто.
- Живая проверка: aiBus.execute() с type: "reader_reaction" доходит
  до /api/reader и возвращает результат в .text как обычную строку
  (без JSON.parse на выходе).
- grep -c "reader_reaction" apps/studio/src/ai/operations.ts → 1
- grep -c "reader_reaction" apps/studio/src/ai/aiBus.ts → >= 1
- Приложи изменённые файлы целиком в ARP.

## Output

ARP файлом в docs/ai-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
