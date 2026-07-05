# ARP — Sprint-09-Step-02: AI Bus — третий вариант reader_reaction

## STATUS

OK

## SUMMARY (RU)

`AIOperation` в `operations.ts` — третий вариант union: `"reader_reaction"`, тот же payload
`{ text, sceneId?, chapterId? }`, что и у двух существующих. `aiBus.execute()` — третья ветка
роутинга: `reader_reaction` → `/api/reader`, тот же `{ text }` на входе. В отличие от
`critic_review`, здесь **нет** `JSON.stringify`/TODO — `data.result` уже строка, кладётся в
`resultText` напрямую, как и предписывал Step Card («это отличие от critic_review осознанное
и не требует техдолга»). Exhaustiveness-check (`const exhaustiveCheck: never = operation`)
обновлён автоматически — TypeScript компилируется только потому, что все три варианта
покрыты веткой `if/else if/else`; если убрать любую из трёх, сборка упадёт на этой строке.

`/api/reader/route.ts`, `/api/critic/route.ts`, `/api/line-editor/route.ts`, UI — не тронуты.

## FILES MODIFIED

- `apps/studio/src/ai/operations.ts` — третий вариант `AIOperation.type`.
- `apps/studio/src/ai/aiBus.ts` — третья ветка диспетчеризации.

**Полное содержимое `operations.ts`:**
```typescript
// AI Operation Model — Sprint 06 Step 03, extended Sprint 08 Step 02 and
// Sprint 09 Step 02.
//
// Standardizes how AI requests are represented internally, replacing the
// bare (text: string) argument. Every added variant so far shares the same
// payload shape — no router/registry abstraction has been introduced;
// aiBus.ts dispatches on `type` directly.

export type AIOperation =
  | {
      type: "improve_text";
      payload: {
        text: string;
        sceneId?: string;
        chapterId?: string;
      };
    }
  | {
      type: "critic_review";
      payload: {
        text: string;
        sceneId?: string;
        chapterId?: string;
      };
    }
  | {
      type: "reader_reaction";
      payload: {
        text: string;
        sceneId?: string;
        chapterId?: string;
      };
    };
```

**Полное содержимое `aiBus.ts`:**
```typescript
// AI Bus — Sprint 06 Step 02 (thin pass-through), Step 03 (operation entry
// point), Step 04 (context envelope entry point), Step 05 (normalized
// response contract), Step 06 (domain applier, no-effect layer), Sprint 08
// Step 02 (real dispatch by operation.type — the first second Expert),
// Sprint 09 Step 02 (third Expert, third branch).
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
  const { text } = operation.payload;

  let resultText: string;

  if (operation.type === "improve_text") {
    const response = await fetch("/api/line-editor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    resultText = data.result;
  } else if (operation.type === "critic_review") {
    const response = await fetch("/api/critic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
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
    const response = await fetch("/api/reader", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    // No stringify/TODO needed here — this Expert's response is already a
    // plain string, the same shape AIResponse.text expects natively.
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

## VALIDATION

- `npm run build` — успешно, TypeScript без ошибок (exhaustiveness-check компилируется
  только при покрытии всех трёх вариантов веткой `if/else if/else`).
- `npm run lint` — чисто.
- `npx prettier --check` — соответствует стилю.
- `grep -c "reader_reaction" apps/studio/src/ai/operations.ts` → **1**.
- `grep -c "reader_reaction" apps/studio/src/ai/aiBus.ts` → **1** (≥ 1, как требовалось).
- **Живая проверка настоящего `aiBus.execute()`** (тот же метод, что в Sprint-08-Step-02):
  временный `tsx`-скрипт вне репозитория, патчащий `global.fetch` для резолва относительных
  путей на `next start -p 3041`, импортирующий реальный `aiBus.ts`:
  - `operation.type: "reader_reaction"` дошёл до `/api/reader`, `meta.operationType ===
    "reader_reaction"`, `response.text` — обычная строка (не JSON), на русском:
    *«Знаете, всего одна фраза, а меня уже как будто подхватило этим ветром вместе с
    Марией...»* (первые 200 символов, полный ответ длиннее).
  - Регрессия: `improve_text` вернул тот же результат, что во всех предыдущих шагах
    (`"She doesn't know the answer."`); `critic_review` по-прежнему возвращает
    JSON-строку, парсящуюся в массив (`Array.isArray` → `true`) — обе прежние ветки не
    сломаны.
- `git status --short apps/studio/` → только `operations.ts` и `aiBus.ts`; `route.ts`-файлы и
  UI не затронуты.

## RISKS

Не выявлены. Третий вариант добавлен по тому же паттерну, что и второй (Sprint 08 Step 02);
регрессия по обеим существующим операциям подтверждена живым вызовом, не только code review.

## SYSTEM STATE

Не закоммичено — Stop Condition требует `STATUS: OK`. Изменены `operations.ts`, `aiBus.ts`.
Step Card и этот ARP — в `docs/ai-bus/queue/active/Sprint-09-Step-02.md` /
`docs/ai-bus/queue/active/Sprint-09-Step-02-ARP.md`.

## NEXT STEP

Жду `REVIEW.md`.
