id: Sprint-08-Step-02
name: "AI Bus: добавить AIOperation.type critic_review"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/ai/operations.ts
- apps/studio/src/ai/aiBus.ts

Forbidden paths:
- apps/studio/src/app/api/critic/route.ts (уже готов, не трогай)
- apps/studio/src/app/api/line-editor/route.ts
- любой UI-код (это Step 03)
- apps/studio/src/ai/context.ts
- apps/studio/src/ai/response.ts
- apps/studio/src/ai/applier.ts

## Objective

Расширить AI Bus v5 для поддержки второго Expert (Critic).

### operations.ts

Добавить второй вариант в union-тип AIOperation:

```typescript
// было:
export type AIOperation =
  | { type: "improve_text"; payload: { text: string; sceneId?: string; chapterId?: string } }

// стало:
export type AIOperation =
  | { type: "improve_text"; payload: { text: string; sceneId?: string; chapterId?: string } }
  | { type: "critic_review"; payload: { text: string; sceneId?: string; chapterId?: string } }
```

### aiBus.ts

aiBus.execute() сейчас жёстко вызывает /api/line-editor для любой операции.
Добавить роутинг по operation.type:

- "improve_text" → /api/line-editor (текущее поведение, без изменений)
- "critic_review" → /api/critic

Формат вызова /api/critic идентичен /api/line-editor: POST { text }.
Ответ от /api/critic: { ok: true, reviews: [...] } или { ok: false, error: string }.

Важно: AIResponse и AppliedAIResponse сейчас заточены под текстовый
результат (поле text). Critic возвращает массив reviews, а не строку.
Это известное несоответствие — НЕ переделывай AIResponse/AppliedAIResponse
в рамках этого Step Card (они будут переработаны в Step 03 вместе с UI).

Пока что: для critic_review сохрани reviews как JSON-строку в
AIResponse.text (JSON.stringify(data.reviews)) — это временное решение,
явно помеченное комментарием "// TODO Sprint-08-Step-03: unpack into
typed ReviewResult". Это сознательный техдолг на один шаг, не надолго.

## Rules

- Минимальное изменение: только роутинг и новый тип в union.
- Не меняй AIResponse, AIContextEnvelope, applier.ts — только
  operations.ts и aiBus.ts.
- Не трогай /api/line-editor и /api/critic.
- TypeScript должен компилироваться без ошибок (включая exhaustive
  check если он есть).

## Validation

- npm run build — успешно, без TypeScript-ошибок.
- npm run lint — чисто.
- Живая проверка: вызови aiBus.execute() с type: "critic_review"
  напрямую (можно через временный тестовый curl или через
  DeveloperTools если доступно) — убедись, что доходит до /api/critic
  и возвращает reviews (пусть и в виде JSON-строки в .text).
- grep -c "critic_review" apps/studio/src/ai/operations.ts → 1
- grep -c "critic_review" apps/studio/src/ai/aiBus.ts → >= 1
- Приложи изменённые файлы целиком в ARP.

## Output

ARP файлом в docs/ai-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
