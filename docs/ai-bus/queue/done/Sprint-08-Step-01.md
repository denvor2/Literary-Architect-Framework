id: Sprint-08-Step-01
name: "Backend: /api/critic (discovery implementation)"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/app/api/critic/route.ts (новый файл)

Forbidden paths:
- apps/studio/src/app/api/line-editor/route.ts (не трогать)
- apps/studio/src/ai/** (это Step 02, не сейчас)
- любой UI-код (это Step 03)

## Objective

По образцу /api/line-editor (discovery-реализация, Sprint-04-Step-05,
disposable — не готовый контракт) создай POST /api/critic:

Request: { text: string } — принимает произвольный фрагмент текста
(не обязательно целую Scene).

Валидация: если text отсутствует или не строка — { ok: false,
error: "No text provided." }, HTTP 400 (тот же паттерн, что у
line-editor).

Success response:
{
  ok: true,
  reviews: [
    { category: "Plot" | "Characters" | "Pacing" | "Style" | "Dialogue" | "General",
      severity: "low" | "medium" | "high",
      comment: string }
  ]
}

Failure (runtime exception): { ok: false, error: string }, HTTP 500 —
тот же паттерн error instanceof Error ? error.message : "Unknown error".

Модель и системный промпт — зафиксированы жёстко, как у Line Editor
(не параметризуются). Промпт должен явно инструктировать модель
вернуть ТОЛЬКО JSON-массив reviews в указанной форме, без
дополнительного текста вокруг (одна из главных задач этого шага —
подобрать формулировку, при которой модель надёжно возвращает валидный
JSON). Используй тот же клиент (getAnthropicClient()), что и
line-editor.

Распарси ответ модели как JSON; если парсинг не удался — верни
{ ok: false, error: "..." } с понятным сообщением (не бросай
необработанное исключение наружу).

## Rules

- Discovery-реализация: минимально, без переиспользуемых абстракций,
  без валидации через библиотеки — как это сделано в line-editor/route.ts.
- Не трогай line-editor, AI Bus, UI.
- Не добавляй авторизацию, rate-limiting и прочее сверх минимума.

## Validation

- npm run build / npm run lint (apps/studio) — чисто.
- Живая проверка: curl -X POST localhost:PORT/api/critic с текстом,
  содержащим явную проблему (например, повторяющееся слово или
  нелогичный сюжетный поворот) — приложи реальный ответ модели в ARP.
- curl без text → подтверди 400 + { ok: false, error: "No text provided." }.
- Приложи содержимое route.ts целиком в ARP.

## Output

ARP файлом в docs/ai-bus/queue/active/ (см. STANDING-PROMPT.md) + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
