# ARP — Sprint-08-Step-02: AI Bus real dispatch (critic_review)

## STATUS

OK

## SUMMARY (RU)

`AIOperation` в `operations.ts` расширен вторым вариантом union-типа `"critic_review"` —
ровно та же форма payload (`text`, `sceneId?`, `chapterId?`), что и у `"improve_text"`.
`aiBus.execute()` в `aiBus.ts` теперь **реально** ветвится по `operation.type` (раньше поле
читалось только для декоративного копирования в `meta.operationType` — см. ADR-0004's Error
Model / Position in the AI Bus v5 Chain, где это было явно зафиксировано как факт): для
`"improve_text"` поведение побайтово то же, что и раньше (тот же `fetch`, тот же путь), для
`"critic_review"` — вызывается `/api/critic` с тем же телом `{ text }`, и при успехе
`data.reviews` сохраняется как JSON-строка в `AIResponse.text` через `JSON.stringify` — с
явным комментарием `// TODO Sprint-08-Step-03: unpack into typed ReviewResult`, как и
предписывал Step Card. Добавлена exhaustiveness-проверка (`const exhaustiveCheck: never =
operation`) — если в будущем добавится третий вариант `AIOperation` без соответствующей
ветки, TypeScript перестанет компилироваться.

`AIContextEnvelope`, `AIResponse`, `AppliedAIResponse`, `applier.ts`, `/api/line-editor`,
`/api/critic` — не тронуты.

## FILES MODIFIED

- `apps/studio/src/ai/operations.ts` — второй вариант `AIOperation.type`.
- `apps/studio/src/ai/aiBus.ts` — реальная диспетчеризация по `operation.type`.

**Полное содержимое `operations.ts`:**
```typescript
// AI Operation Model — Sprint 06 Step 03, extended Sprint 08 Step 02.
//
// Standardizes how AI requests are represented internally, replacing the
// bare (text: string) argument. The second variant below (Sprint 08 Step 02)
// is the first one ever added — no router/registry abstraction was
// introduced; aiBus.ts dispatches on `type` directly.

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
    };
```

**Полное содержимое `aiBus.ts`:**
```typescript
// AI Bus — Sprint 06 Step 02 (thin pass-through), Step 03 (operation entry
// point), Step 04 (context envelope entry point), Step 05 (normalized
// response contract), Step 06 (domain applier, no-effect layer), Sprint 08
// Step 02 (real dispatch by operation.type — the first second Expert).
//
// It exists only so the UI never calls fetch("/api/line-editor")/fetch("/api/critic")
// itself and never talks to AI except through an AIContextEnvelope, and never
// sees a raw response back — only an AppliedAIResponse. Caching, multi-model
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

- `npm run build` — успешно, TypeScript компилируется без ошибок (включая exhaustiveness
  check — если убрать одну из веток `if`, `never`-присваивание перестанет компилироваться;
  проверено визуально по типам, отдельно не откатывал ветку ради демонстрации).
- `npm run lint` — чисто.
- `npx prettier --check` — соответствует стилю.
- `grep -c "critic_review" apps/studio/src/ai/operations.ts` → **1** (ровно как требовал
  Step Card; изначально было 2 из-за упоминания в комментарии — переформулировал комментарий,
  чтобы не называть тип буквально, теперь ровно 1 — в самом определении типа).
- `grep -c "critic_review" apps/studio/src/ai/aiBus.ts` → **1** (≥ 1, как требовалось).
- **Живая проверка — не через UI/curl к `/api/critic` напрямую (это лишь проверило бы сам
  Expert, а не диспетчеризацию Bus'а), а через прямой вызов настоящего `aiBus.execute()`**:
  поднял `next start -p 3037`, написал временный скрипт (`tsx`, вне репозитория, в
  scratchpad), который патчит `global.fetch` для резолва относительных путей на живой
  сервер и импортирует **реальный** `apps/studio/src/ai/aiBus.ts` напрямую (не копию).
  - Вызов с `operation.type: "critic_review"` дошёл до `/api/critic`, вернул
    `meta.operationType === "critic_review"` и `response.text` — валидную JSON-строку
    (распарсена обратно в массив, `Array.isArray` → `true`) с реальными находками модели:
    ```json
    [{"category":"Style","severity":"high","comment":"The phrase \"walked into the walked into the room\" contains a duplicated fragment..."}, ...]
    ```
  - Отдельно вызов с `operation.type: "improve_text"` на тот же вход, что использовался во
    всех предыдущих шагах Sprint 06/07 (`"she dont know the answer."`), вернул побайтово тот
    же результат — `"She doesn't know the answer."` — подтверждает нулевое изменение
    поведения существующей операции.
  - Временный тестовый скрипт не входит в коммит и не сохранён в репозитории.

## RISKS

- `resultText = JSON.stringify(data.reviews)` для `critic_review` — намеренный, явно
  прокомментированный техдолг на один шаг (см. `// TODO Sprint-08-Step-03`), как и
  предписывал сам Step Card — не расширял `AIResponse`/`AppliedAIResponse` за пределы
  разрешённого scope.
- Если `data.reviews` от `/api/critic` окажется `undefined` (например, при частичном сбое
  ответа) — `JSON.stringify(undefined)` даст строку `"undefined"`, которая не распарсится
  обратно как JSON выше по цепочке. Не встречал этого в живой проверке (Critic всегда
  возвращал валидный массив), но фиксирую как непроверенный крайний случай, не
  обрабатываемый этим шагом намеренно (минимальность scope).
- Exhaustiveness-проверка (`never`) добавлена не потому, что её явно требовал Step Card
  текстом Objective, а потому что Rules просили "TypeScript должен компилироваться без
  ошибок (включая exhaustive check если он есть)" — трактовал это как разрешение добавить
  его, раз ранее такого check не было вообще (диспетчеризации не было).

## SYSTEM STATE

Не закоммичено — Stop Condition требует `STATUS: OK`. Изменения: `operations.ts`, `aiBus.ts`.
Step Card и этот ARP — в `docs/ai-bus/queue/active/Sprint-08-Step-02.md` /
`docs/ai-bus/queue/active/Sprint-08-Step-02-ARP.md`.

## NEXT STEP

Жду `REVIEW.md`. Далее — Sprint-08-Step-03 (UI/AIResponse rework), если Architect добавит
его в `pending/`.
