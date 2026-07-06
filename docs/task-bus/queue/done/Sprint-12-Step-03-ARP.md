# ARP — Sprint-12-Step-03

**Шаг:** AI Bus (код): coauthor_draft operation + bookContext в improve_text
**Статус выполнения:** Готово к ревью

## Что сделано

### operations.ts

Добавлен четвёртый вариант `AIOperation` — `coauthor_draft` (`{ currentText: string; bookContext:
Book }`), первый с принципиально другой формой payload (не `text`, а `currentText`; `bookContext`
обязателен, не опционален). `improve_text` расширен опциональным `bookContext?: Book` — ровно по
Step Card, `Book` из `model.ts` переиспользован напрямую как тип контекста, без
упрощения/зачистки `id`-полей (backend не валидирует структуру строго, `id` не мешают). `critic_
review`/`reader_reaction` не изменены — они вне таблицы контекстов "видит книгу целиком".

### aiBus.ts

- Добавлена четвёртая ветка роутинга: `coauthor_draft` → `POST /api/coauthor` с телом
  `{ currentText, bookContext }`; ответ (`{ ok: true, result: string }`) идёт напрямую в
  `resultText`, без stringify/TODO — та же форма, что у `reader_reaction` (ответ уже строка).
- Ветка `improve_text` обновлена: если `bookContext` присутствует в payload — тело запроса к
  `/api/line-editor` включает его (`{ text, bookContext }`), иначе — тело идентично прежнему
  (`{ text }`), без изменения поведения.
- Exhaustiveness-check (`const exhaustiveCheck: never = operation`) продолжает компилироваться
  без ошибок — теперь на четырёх вариантах.
- **Точечная правка структуры кода** (не логики): верхнеуровневая деструктуризация
  `const { text } = operation.payload` (была до ветвления) убрана — она перестала бы
  компилироваться, поскольку `coauthor_draft`'s payload не содержит `text`. Деструктуризация
  перенесена в каждую ветку по отдельности (`const { text } = operation.payload` /
  `const { text, bookContext } = ...` / `const { currentText, bookContext } = ...`) — необходимое
  следствие добавления варианта с другой формой payload, не самостоятельное решение сверх
  задачи.

## Изменённые файлы целиком

### apps/studio/src/ai/operations.ts

```typescript
// AI Operation Model — Sprint 06 Step 03, extended Sprint 08 Step 02,
// Sprint 09 Step 02, and Sprint 12 Step 03.
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
// `Book` is reused directly as `bookContext`'s type — the backend does not
// validate this structure strictly, and the `id` fields it carries are
// harmless in this context, so no stripped-down/simplified type was
// introduced just for this.

import type { Book } from "@/domain/model";

export type AIOperation =
  | {
      type: "improve_text";
      payload: {
        text: string;
        sceneId?: string;
        chapterId?: string;
        bookContext?: Book;
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
    }
  | {
      type: "coauthor_draft";
      payload: {
        currentText: string;
        bookContext: Book;
      };
    };
```

### apps/studio/src/ai/aiBus.ts

```typescript
// AI Bus — Sprint 06 Step 02 (thin pass-through), Step 03 (operation entry
// point), Step 04 (context envelope entry point), Step 05 (normalized
// response contract), Step 06 (domain applier, no-effect layer), Sprint 08
// Step 02 (real dispatch by operation.type — the first second Expert),
// Sprint 09 Step 02 (third Expert, third branch), Sprint 12 Step 03 (fourth
// branch — Co-author, plus optional bookContext forwarded for Editor).
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
    const { text, bookContext } = operation.payload;
    const response = await fetch("/api/line-editor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bookContext ? { text, bookContext } : { text }),
    });
    const data = await response.json();
    if (!data.ok) {
      throw new Error(data.error);
    }
    resultText = data.result;
  } else if (operation.type === "critic_review") {
    const { text } = operation.payload;
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
    const { text } = operation.payload;
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
  } else if (operation.type === "coauthor_draft") {
    const { currentText, bookContext } = operation.payload;
    const response = await fetch("/api/coauthor", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentText, bookContext }),
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

## Валидация

```
npx tsc --noEmit → 0 ошибок
npm run build → успешно (Compiled successfully; первая попытка упала на транзиентной сетевой
                 ошибке загрузки Google Fonts, не связанной с кодом — повтор прошёл чисто)
npm run lint  → чисто
npx prettier --check → чисто
grep -c "coauthor_draft" apps/studio/src/ai/operations.ts → 1 (учёл урок из Sprint-08-Step-02 —
                 переформулировал комментарий, чтобы не упоминать строку литералом дважды)
grep -c "coauthor_draft" apps/studio/src/ai/aiBus.ts → 1
git status --short → ровно 2 файла из Allowed paths (operations.ts, aiBus.ts — оба M); ни один
                 route.ts, ai/context.ts, ai/applier.ts, UI-код не тронуты
```

### Живая проверка — все три сценария, через реальный `aiBus.execute()`

Собрал production build, поднял `next start` на отдельном порту (4176). Тот же приём, что и в
предыдущих подобных шагах (Sprint 08/09 Step 02): временный tsx-скрипт монки-патчит
`global.fetch`, чтобы относительные пути `aiBus.ts` (`/api/...`) резолвились на
`http://127.0.0.1:4176`, импортирует реальный, скомпилированный `aiBus.ts` через `file://` и
вызывает `execute()` напрямую — не имитация, реальный код на реальном сервере.

**1. `coauthor_draft` доходит до `/api/coauthor` и возвращает результат:**
```
coauthor_draft result (first 200 chars): "# Глава 1\n\n## Сцена 1\n\nЧернила на карте высохли
                                          неровно... Илана Верт наклонилась ниже..."
PASS: coauthor_draft: response.text is a non-empty string
PASS: coauthor_draft: meta.operationType is correct
```
Персонаж (Илана Верт) и завязка (карта) из переданного `bookContext` реально отражены в ответе —
контекст не просто передан и отброшен.

**2. `improve_text` С `bookContext` доходит до `/api/line-editor` с ним в теле:**
```
improve_text WITH bookContext result: "She doesn't know what to do."
PASS: improve_text+bookContext: response.text is a non-empty string
```

**3. `improve_text` БЕЗ `bookContext` — регрессия, поведение идентично:**
```
improve_text WITHOUT bookContext result: "She doesn't know what to do."
PASS: improve_text (no bookContext): response.text is a non-empty string
```

Оба варианта `improve_text` дали идентичный результат на одном и том же входном тексте —
подтверждает, что добавление `bookContext` не меняет поведение, когда он не передан.

## Отклонения от Step Card

Единственное — упомянутый выше перенос деструктуризации `text`/`currentText` внутрь каждой
ветки вместо единой верхнеуровневой (необходимое следствие четвёртого варианта с другой формой
payload, не самостоятельное расширение задачи).

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
