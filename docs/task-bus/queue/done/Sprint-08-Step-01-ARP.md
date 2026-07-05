# ARP — Sprint-08-Step-01: Backend /api/critic (discovery implementation)

## STATUS

OK

## SUMMARY (RU)

Создан `apps/studio/src/app/api/critic/route.ts` — discovery-реализация по образцу
`line-editor/route.ts`: `POST { text: string }` → валидация (пусто/не строка →
`{ ok: false, error: "No text provided." }`, HTTP 400) → фиксированная модель
(`claude-sonnet-5`) и жёстко закодированный system-промпт, инструктирующий модель вернуть
ТОЛЬКО JSON-массив `reviews` (без markdown-обрамления, без пояснительного текста) → парсинг
ответа как JSON (с минимальной, встроенной, не абстрагированной защитой — срезание
возможных ```/```json code fence маркеров перед `JSON.parse`, так как без этого модель
иногда оборачивает ответ в markdown, несмотря на прямую инструкцию не делать этого) → при
неудачном парсинге возвращается `{ ok: false, error: "Critic response was not valid JSON." }`
(HTTP 500), без необработанного исключения наружу → при успехе `{ ok: true, reviews: [...] }`.
Ошибки времени выполнения (сеть/Anthropic) — тот же паттерн, что и в line-editor:
`error instanceof Error ? error.message : "Unknown error"`, HTTP 500.

`line-editor/route.ts`, `apps/studio/src/ai/**` и весь UI-код не тронуты.

## FILES MODIFIED

- `apps/studio/src/app/api/critic/route.ts` — новый файл (единственный).

## VALIDATION

- `npm run build` — успешно; маршрут `/api/critic` появился в списке маршрутов сборки
  наряду с `/api/line-editor` и `/api/test-connection`.
- `npm run lint` — чисто.
- `npx prettier --check` — соответствует стилю (после одного авто-фикса).
- `git status --short apps/studio/` → только `apps/studio/src/app/api/critic/` — новый,
  никакой другой путь в `apps/studio/` не изменён (line-editor, `ai/**`, UI — не тронуты).
- Живая проверка (`next start -p 3036`):
  - `curl -X POST /api/critic -d '{}'` → `{"ok":false,"error":"No text provided."}`, HTTP 400
    — подтверждено.
  - `curl -X POST /api/critic` с текстом, специально содержащим повтор слова
    ("walked into the walked into the room") и логическое противоречие сюжета (никогда не
    покидала Париж vs чёткие воспоминания о детстве в Токио; дракон "не настоящий" vs три
    главы его держат как домашнее животное) — модель вернула валидный JSON-массив из 6
    реальных находок с разумной категоризацией (Style/Plot/Characters/Pacing/General) и
    уровнями severity. Полный реальный ответ:
    ```json
    {"ok":true,"reviews":[
      {"category":"Style","severity":"high","comment":"The phrase 'walked into the walked into the room' contains a duplicated word, creating a jarring grammatical error that disrupts readability."},
      {"category":"Plot","severity":"high","comment":"It is stated Maria never left Paris, yet she suddenly has vivid childhood memories of Tokyo, creating an unexplained contradiction in her backstory."},
      {"category":"Plot","severity":"high","comment":"The dragon is described as not real, but the narrative also claims it has been treated as a normal house pet for three chapters, creating a logical inconsistency about the story's reality/fantasy rules."},
      {"category":"Characters","severity":"medium","comment":"Maria's sudden, unexplained memory of Tokyo suggests either an inconsistency in her characterization or an unaddressed supernatural element (e.g., false memories) that isn't acknowledged in the text."},
      {"category":"Pacing","severity":"low","comment":"The reference to 'the last three chapters' compresses significant unseen narrative development into a single aside, making the pacing feel rushed or summarized rather than shown."},
      {"category":"General","severity":"medium","comment":"The short passage combines multiple unresolved contradictions (location history, dragon's reality) without context, leaving the reader confused about basic world-building rules."}
    ]}
    ```
    Модель не обернула ответ в markdown code fence в этом прогоне — но защитный код на
    случай обёртки оставлен в реализации намеренно (см. Risks).

**Полное содержимое `route.ts`:**
```typescript
import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";

// Discovery implementation (Sprint-08-Step-01). Disposable — not a designed contract.
// Deliberately minimal: no shared types, no validation library, mirrors
// apps/studio/src/app/api/line-editor/route.ts's shape.
export async function POST(request: Request) {
  const body = await request.json();
  const text = body?.text;

  if (!text || typeof text !== "string") {
    return NextResponse.json(
      { ok: false, error: "No text provided." },
      { status: 400 },
    );
  }

  try {
    const client = getAnthropicClient();
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        'You are a literary critic. Analyze the text the user gives you and identify concrete issues across these categories: Plot, Characters, Pacing, Style, Dialogue, General. For each issue found, produce one entry with exactly these fields: "category" (one of "Plot", "Characters", "Pacing", "Style", "Dialogue", "General"), "severity" (one of "low", "medium", "high"), and "comment" (a short explanation of the issue). If you find no issues, return an empty array. Respond with ONLY a raw JSON array of such entries — no markdown code fences, no explanation, no text before or after the array.',
      messages: [{ role: "user", content: text }],
    });
    const block = message.content.find((item) => item.type === "text");
    const raw = block && block.type === "text" ? block.text : "";

    let reviews;
    try {
      const cleaned = raw
        .trim()
        .replace(/^```(?:json)?/i, "")
        .replace(/```$/, "")
        .trim();
      reviews = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { ok: false, error: "Critic response was not valid JSON." },
        { status: 500 },
      );
    }

    return NextResponse.json({ ok: true, reviews });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: 500 },
    );
  }
}
```

## RISKS

- **Одно отклонение от буквального минимализма Step Card, сделанное сознательно:** добавил
  3 строки, срезающие потенциальные markdown-обрамления (` ``` `/` ```json `) перед
  `JSON.parse`. Формально это чуть больше, чем "ничего сверх line-editor", но без этого
  живая проверка стала бы нестабильной (модели семейства Claude периодически оборачивают
  JSON-ответы в code fence, несмотря на прямую инструкцию не делать этого) — это не
  реиспользуемая библиотека валидации, а три строки инлайн-кода ровно под этот один
  эндпоинт, что, на мой взгляд, не нарушает "discovery, минимально" по духу, но фиксирую
  явно, так как Step Card прямо просил не добавлять ничего сверх необходимого минимума.
- Распарсенный `reviews` не проверяется на соответствие форме `{category, severity, comment}`
  — если модель вернёт валидный JSON другой формы, это тихо пройдёт как `ok: true` с
  неожиданным содержимым `reviews`. Соответствует Step Card ("без валидации через
  библиотеки"), но стоит явно зафиксировать как принятый риск discovery-этапа.
- Промпт зафиксирован жёстко, как и требовалось — не параметризован, не переиспользует
  ничего из `line-editor`'s промпта.

## SYSTEM STATE

Не закоммичено — Stop Condition Step Card требует `STATUS: OK` от Architect. Изменения:
новый `apps/studio/src/app/api/critic/route.ts`. Step Card и этот ARP лежат в
`docs/ai-bus/queue/active/Sprint-08-Step-01.md` /
`docs/ai-bus/queue/active/Sprint-08-Step-01-ARP.md`.

Также в `active/`, всё ещё без коммита и без REVIEW: `Add-Glossary.md` +
`Add-Glossary-ARP.md` (предыдущий Step Card в этой же серии, выполнен ранее в этом ответе).

## NEXT STEP

Жду `REVIEW.md` в `docs/ai-bus/queue/active/` — по одному на каждый из двух Step Card'ов, или
общий, если Architect сочтёт уместным (оба выполнены подряд без ожидания, как и было
разрешено).
