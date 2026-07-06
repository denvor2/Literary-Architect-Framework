# ARP — Sprint-12-Step-02

**Шаг:** /api/line-editor: добавить полный Book как контекст (для Editor)
**Статус выполнения:** Готово к ревью

## Что сделано

`apps/studio/src/app/api/line-editor/route.ts` — расширен с сохранением обратной совместимости.
Это изменение уже ратифицированного контракта (ADR-0004), сделано осознанно — будет
зафиксировано пересмотром ADR-0004 в Sprint-12-Step-05, как и указывал Step Card.

- **Валидация `text`** — без изменений (обязателен, не пустой).
- **`bookContext`** — новое, строго необязательное поле (`body?.bookContext`, без проверки
  типа/обязательности — если отсутствует, `userContent` равен просто `text`, байт-в-байт то же
  поведение, что было до этого шага).
- **Промпт** — дополнен, не переписан: если `bookContext` присутствует, он включается в
  сообщение модели с явной инструкцией "for consistency only ... do not use it to rewrite or
  expand the text beyond what is given below"; system-промпт дополнен аналогичным ограничением
  ("use it only to keep character names and established facts consistent — never use it to
  rewrite, extend, or add new content"). Если `bookContext` отсутствует — system-промпт по сути
  не меняет поведения (дополнительное предложение о контексте просто неприменимо).
- **Response** — без изменений: `{ ok: true, result: string } | { ok: false, error: string }`.

## Изменённый файл целиком

### apps/studio/src/app/api/line-editor/route.ts

```typescript
import { NextResponse } from "next/server";
import { getAnthropicClient } from "@/lib/ai/anthropic";

// Discovery implementation (Sprint-04-Step-05). Disposable — not a designed contract.
// Deliberately minimal: no shared types, no validation library, no reuse beyond the
// existing single Anthropic integration point.
//
// Sprint-12-Step-02: bookContext is optional, additive context for consistency (character
// names, established plot facts) only — it does not change what this Expert does (polish the
// grammar/style of `text`), and its absence produces the exact same request/behavior as
// before this step. This changes an already-ratified contract (ADR-0004) — revisited in
// Sprint-12-Step-05.
export async function POST(request: Request) {
  const body = await request.json();
  const text = body?.text;
  const bookContext = body?.bookContext;

  if (!text || typeof text !== "string") {
    return NextResponse.json(
      { ok: false, error: "No text provided." },
      { status: 400 },
    );
  }

  try {
    const client = getAnthropicClient();
    const userContent = bookContext
      ? `Book context, for consistency only (character names, established plot facts) — do not use it to rewrite or expand the text beyond what is given below:\n${JSON.stringify(bookContext, null, 2)}\n\nText to edit:\n${text}`
      : text;
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system:
        "You are a line editor. Fix grammar, punctuation, and word choice in the text the user gives you. Preserve the author's voice and meaning. Do not restructure the content. Return only the edited text, nothing else. If book context is provided, use it only to keep character names and established facts consistent — never use it to rewrite, extend, or add new content beyond the given text.",
      messages: [{ role: "user", content: userContent }],
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

## Валидация

```
npm run build → успешно (Compiled successfully)
npm run lint  → чисто
npx prettier --check → чисто
git status --short → ровно 1 файл (line-editor/route.ts, M) — единственный Allowed path;
                       coauthor/route.ts (Forbidden), critic/reader/route.ts, ai/**, UI не тронуты
```

### Живая проверка — все три сценария, реальные ответы

Поднял production build (`next start`, отдельный порт 4175), реальные `curl`-запросы.

**(а) Регрессия — запрос БЕЗ `bookContext`, тот же тест по духу, что в Sprint 04/08:**
```
curl -X POST /api/line-editor -d '{"text": "she dont know what to do, its very confusing
                                     situation for her and she dont like it at all"}'
→ {"ok":true,"result":"She doesn't know what to do; it's a very confusing situation for her,
                        and she doesn't like it at all."}
```
Поведение идентично дошаговому — обычная грамматическая правка, никакого структурного изменения.

**(б) + (в) — запрос С `bookContext`, содержащим персонажа с необычным именем ("Xylonnyx",
явно отмечено в заметке персонажа "Имя нельзя менять или упрощать"), текст с грамматическими
ошибками:**
```
curl -X POST /api/line-editor -d '{"text": "Xylonnyx walked into the room, and she dont know
                                     what to do, its very confusing.", "bookContext": {...}}'
→ {"ok":true,"result":"Xylonnyx walked into the room, and she didn't know what to do; it was
                        very confusing."}
```
Имя "Xylonnyx" сохранено буквально (не упрощено, не искажено) — контекст реально повлиял на
согласованность. Ответ остался полировкой того же одного предложения — Editor не начал
сочинять новые сцены/контент, несмотря на полный `bookContext` перед текстом (не превратился в
Co-author).

## Отклонения от Step Card

Нет.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
