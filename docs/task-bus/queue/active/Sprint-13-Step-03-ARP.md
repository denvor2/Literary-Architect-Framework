# ARP: Sprint-13-Step-03

**Step Card:** AI Bus (код): операции получают messages + переименование text/currentText в
sceneText
**Тип:** implementation (AI Bus, 2 файла)
**Исполнитель:** Programmer (Executor)

## Что сделано

### `apps/studio/src/ai/operations.ts` (файл целиком)

```typescript
// AI Operation Model — Sprint 06 Step 03, extended Sprint 08 Step 02,
// Sprint 09 Step 02, Sprint 12 Step 03, and Sprint 13 Step 03.
//
// Standardizes how AI requests are represented internally, replacing the
// bare (text: string) argument. aiBus.ts dispatches on `type` directly —
// no router/registry abstraction has been introduced.
//
// Sprint-12-Step-03: `improve_text` gained an optional `bookContext` (for
// Editor consistency, ADR-0004 revisited); the fourth variant below is the
// first with a genuinely different payload shape (`currentText` instead of
// `text`, `bookContext` required not optional) — `critic_review`/
// `reader_reaction` are unaffected, they are outside the "sees the whole
// book" context table.
//
// Sprint-13-Step-03: `text`/`currentText` renamed `sceneText` across all
// four variants (matches the backend's Sprint-13-Step-02 schema); every
// variant gained a required `messages: ChatMessage[]` — the server is
// stateless (ADR-0004), so the caller must always pass the full
// conversation history, even if empty.
//
// `Book` is reused directly as `bookContext`'s type — the backend does not
// validate this structure strictly, and the `id` fields it carries are
// harmless in this context, so no stripped-down/simplified type was
// introduced just for this.

import type { Book, ChatMessage } from "@/domain/model";

export type AIOperation =
  | {
      type: "improve_text";
      payload: {
        sceneText: string;
        sceneId?: string;
        chapterId?: string;
        bookContext?: Book;
        messages: ChatMessage[];
      };
    }
  | {
      type: "critic_review";
      payload: {
        sceneText: string;
        sceneId?: string;
        chapterId?: string;
        messages: ChatMessage[];
      };
    }
  | {
      type: "reader_reaction";
      payload: {
        sceneText: string;
        sceneId?: string;
        chapterId?: string;
        messages: ChatMessage[];
      };
    }
  | {
      type: "coauthor_draft";
      payload: {
        sceneText: string;
        bookContext: Book;
        messages: ChatMessage[];
      };
    };
```

### `apps/studio/src/ai/aiBus.ts` (файл целиком)

```typescript
// AI Bus — Sprint 06 Step 02 (thin pass-through), Step 03 (operation entry
// point), Step 04 (context envelope entry point), Step 05 (normalized
// response contract), Step 06 (domain applier, no-effect layer), Sprint 08
// Step 02 (real dispatch by operation.type — the first second Expert),
// Sprint 09 Step 02 (third Expert, third branch), Sprint 12 Step 03 (fourth
// branch — Co-author, plus optional bookContext forwarded for Editor),
// Sprint 13 Step 03 (sceneText renaming + messages forwarded to every
// route, matching each route's Sprint-13-Step-02 schema).
//
// It exists only so the UI never calls fetch() on an Expert route itself and
// never talks to AI except through an AIContextEnvelope, and never sees a
// raw response back — only an AppliedAIResponse. Caching, multi-model
// dispatch, and provider abstraction do not exist here yet.
//
// `envelope.context` and `AppliedAIResponse.domain` are deliberately
// unread/unused for logic below — Step 04/06 introduced the data shapes
// only. `flags.isSceneAware` is hardcoded false: no scene-aware behavior
// exists yet.

import type { AIContextEnvelope } from "./context";
import type { AppliedAIResponse } from "./applier";

export async function execute(
  envelope: AIContextEnvelope,
): Promise<AppliedAIResponse> {
  const { operation } = envelope;

  let resultText: string;

  if (operation.type === "improve_text") {
    const { sceneText, bookContext, messages } = operation.payload;
    const response = await fetch("/api/line-editor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        bookContext
          ? { sceneText, bookContext, messages }
          : { sceneText, messages },
      ),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    resultText = data.result;
  } else if (operation.type === "critic_review") {
    const { sceneText, messages } = operation.payload;
    const response = await fetch("/api/critic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sceneText, messages }),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    // TODO Sprint-08-Step-03: unpack into typed ReviewResult instead of
    // stringifying into AIResponse.text — AIResponse/AppliedAIResponse are
    // still shaped for a single text result and are not reworked here.
    resultText = JSON.stringify(data.reviews);
  } else if (operation.type === "reader_reaction") {
    const { sceneText, messages } = operation.payload;
    const response = await fetch("/api/reader", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sceneText, messages }),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    // No stringify/TODO needed here — this Expert's response is already a
    // plain string, the same shape AIResponse.text expects natively.
    resultText = data.result;
  } else if (operation.type === "coauthor_draft") {
    const { sceneText, bookContext, messages } = operation.payload;
    const response = await fetch("/api/coauthor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sceneText, bookContext, messages }),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    // Same as reader_reaction — /api/coauthor's response is already a plain
    // string, no stringify/TODO needed.
    resultText = data.result;
  } else {
    const exhaustiveCheck: never = operation;
    throw new Error(
      `Unknown operation type: ${JSON.stringify(exhaustiveCheck)}`,
    );
  }

  return {
    response: {
      text: resultText,
      meta: {
        operationType: operation.type,
      },
    },
    domain: envelope.context,
    flags: {
      isSceneAware: false,
    },
  };
}
```

Изменения строго по Step Card: `text`/`currentText` → `sceneText` во всех четырёх вариантах;
`messages: ChatMessage[]` добавлено как обязательное поле во всех четырёх; `critic_review`/
`reader_reaction` по-прежнему без `bookContext`; exhaustiveness-check (`never`) не тронут — как
и раньше, покрывает все четыре варианта автоматически. `JSON.stringify(data.reviews)` для
`critic_review` не тронут, как явно требовал Step Card.

## Валидация

```
npx prettier --write operations.ts aiBus.ts → unchanged
npx eslint operations.ts aiBus.ts           → чисто
npx tsc --noEmit                            → 0 ошибок в Allowed paths; ошибки ТОЛЬКО в
  Forbidden paths (ожидаемо, Step 04):
    - EditorArea.tsx:246,280,311,346 — использует старые имена полей (`text`/`currentText`)
      при вызове aiBus.execute(), ещё не знает про `sceneText`/`messages`.
    - LineEditorPanel.tsx:25 — та же причина (использует `text`).
    - NewBookDialog.tsx:51 — не новая, унаследована от Sprint-13-Step-01 (assistantThreads),
      не связана с этим шагом и не усугублена им.
grep -c "messages" operations.ts → 5
grep -c "messages" aiBus.ts      → 10
```

**Живая проверка** — реальный `aiBus.execute()` (прямой `import()` через tsx, `global.fetch`
монки-патчен на реальный `next dev` сервер на порту 3000, тот же, что использовался в Step 02),
для всех четырёх операций, с реалистичным `messages` (3 реплики user/assistant/user) — как и
уточнял Step Card, здесь важно только подтвердить, что `aiBus.ts` правильно прокидывает поля
до `route.ts` с новыми именами, не заново доказывать, что backend "помнит" историю (это уже
подтверждено в Step 02):

- **`improve_text` (с `bookContext`)** → тело запроса к `/api/line-editor` содержит
  `sceneText`/`bookContext`/`messages` (3 реплики), поля `text` нет вовсе; ответ — непустая
  строка.
- **`improve_text` (без `bookContext`)** → `bookContext` в теле запроса отсутствует полностью
  (не `undefined`-ключ, а именно отсутствует), `messages` присутствует как пустой массив —
  подтверждает, что "messages обязательно, даже пустое" соблюдено, и что опциональность
  `bookContext` (Sprint 12) не сломана.
- **`critic_review`** → тело запроса к `/api/critic` содержит `sceneText`/`messages`, поля
  `bookContext` нет вовсе (таблица контекстов соблюдена); ответ — валидный JSON-массив внутри
  `resultText` (через существующий `JSON.stringify(data.reviews)`, не тронутый).
- **`reader_reaction`** → тело запроса к `/api/reader` содержит `sceneText`/`messages`, без
  `bookContext`; ответ — непустая строка.
- **`coauthor_draft`** → тело запроса к `/api/coauthor` содержит `sceneText`/`bookContext`/
  `messages`, поля `currentText` нет вовсе; ответ — непустая строка.

Все проверки — ALL CHECKS PASS.

`git status --short` → только 2 изменённых файла (`operations.ts`, `aiBus.ts`, плюс сам Step
Card, перемещённый в `active/`) — `apps/studio/src/app/api/**` не тронут (все четыре
route.ts из Step 02 остались нетронутыми), UI не тронут.

## Отклонения от Step Card

Нет.

## Stop Condition

Не закоммичено — жду `REVIEW.md` со `STATUS: OK` от Architect.
