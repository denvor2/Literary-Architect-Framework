# ARP — Sprint-09-Step-01: Backend /api/reader (discovery implementation)

## STATUS

OK

## SUMMARY (RU)

Создан `apps/studio/src/app/api/reader/route.ts` — третий Expert, по образцу `line-editor`
(не `critic`): форма ответа `{ ok: true, result: string }` — цельная читательская реакция, не
структурированный массив. Валидация/ошибки — тот же паттерн, что у обоих существующих
Expert'ов (`{ ok: false, error: "No text provided." }` HTTP 400; `error instanceof Error ?
error.message : "Unknown error"` HTTP 500). Модель зафиксирована (`claude-sonnet-5`), промпт
не параметризован.

**Применена Поправка 1 из `Sprint-09-Vision-Amendments.md`:** системный промпт содержит явную
инструкцию отвечать на русском языке независимо от языка входного текста. Цитата из
промпта (`route.ts:25`): *"Respond in Russian, regardless of the language of the text you are
given, unless the user explicitly asks for another language."* Подтверждено и живой
проверкой — реальный ответ модели (см. VALIDATION) полностью на русском.

Промпт явно инструктирует модель реагировать как читатель (субъективные впечатления,
эмоциональная реакция, что зацепило/что смутило, ожидания от сюжета) и явно запрещает
грамматические правки (роль line-editor) и структурированную категоризированную оценку (роль
critic) — три Expert'а теперь тонально различимы на уровне промпта, не только по форме
ответа.

`line-editor/route.ts`, `critic/route.ts`, `ai/**`, UI — не тронуты.

## FILES MODIFIED

- `apps/studio/src/app/api/reader/route.ts` — новый файл (единственный).

**Полное содержимое:**
```typescript
import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";

// Discovery implementation (Sprint-09-Step-01). Disposable — not a designed contract.
// Deliberately minimal: no shared types, no validation library, mirrors
// apps/studio/src/app/api/line-editor/route.ts's shape — a reader's reaction is a whole
// piece of text, not a structured list like /api/critic.
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
        "You are a reader reacting to the text the user gives you — not an editor and not a literary critic. Do not comment on grammar, punctuation, or wording. Do not produce a structured, categorized assessment. Instead, share your subjective impressions as an engaged reader: what caught your attention, what confused or surprised you, how the pacing felt, what you expect or hope happens next. Write your reaction as flowing prose, in your own voice, not as a list. Respond in Russian, regardless of the language of the text you are given, unless the user explicitly asks for another language.",
      messages: [{ role: "user", content: text }],
    });
    const block = message.content.find((item) => item.type === "text");
    const result = block && block.type === "text" ? block.text : "";
    return NextResponse.json({ ok: true, result });
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

## VALIDATION

- `npm run build` — успешно; `/api/reader` появился в списке маршрутов рядом с `/api/critic`
  и `/api/line-editor`.
- `npm run lint` — чисто.
- `npx prettier --check` — соответствует стилю (после одного авто-фикса).
- `git status --short apps/studio/` → только `apps/studio/src/app/api/reader/` — новый;
  `line-editor/route.ts`, `critic/route.ts`, `ai/**`, UI не изменены.
- Живая проверка (`next start -p 3040`):
  - `curl -X POST /api/reader -d '{}'` → `{"ok":false,"error":"No text provided."}`, HTTP 400.
  - `curl -X POST /api/reader` с реальным текстом сцены (диалог на обрыве) вернул полный,
    связный ответ **на русском языке**, звучащий как впечатление читателя (что зацепило,
    что смущает, ожидания от сюжета), без единого пункта редактуры или категоризированной
    критики:
    > «Меня сразу зацепила эта последняя фраза — там есть какая-то настоящая
    > двусмысленность, не наигранная... Жду, что дальше раскроется — кто он, почему она
    > здесь, и что значит "не должен был приходить"...» (полный ответ — 5 абзацев, приведён
    > целиком в истории выполнения; сокращён здесь для читаемости ARP).

## RISKS

- Промпт написан на английском (как и `line-editor`/`critic`), с явной инструкцией отвечать
  по-русски — согласовано в `Sprint-09-Vision-Amendments.md`: ретроактивный перевод промптов
  Line Editor/Critic на русский явно не входит в текущий scope.
- Как и у `critic`, форма `result` не валидируется — это цельный текст, поэтому риск ниже,
  чем у структурированного `reviews` (нет JSON-парсинга, нет риска невалидного формата).

## SYSTEM STATE

Не закоммичено — Stop Condition требует `STATUS: OK`. Изменения: новый
`apps/studio/src/app/api/reader/route.ts`. Step Card и этот ARP — в
`docs/ai-bus/queue/active/Sprint-09-Step-01.md` /
`docs/ai-bus/queue/active/Sprint-09-Step-01-ARP.md`.

## NEXT STEP

Жду `REVIEW.md`. После этого — `Add-Vision-Doc` (следующая задача в `pending/`).
