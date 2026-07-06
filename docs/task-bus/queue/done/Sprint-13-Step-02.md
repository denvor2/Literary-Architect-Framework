id: Sprint-13-Step-02
name: "Backend: все четыре route.ts принимают историю сообщений (messages)"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/app/api/coauthor/route.ts
- apps/studio/src/app/api/line-editor/route.ts
- apps/studio/src/app/api/critic/route.ts
- apps/studio/src/app/api/reader/route.ts

Forbidden paths:
- apps/studio/src/ai/**
- любой UI-код
- apps/studio/src/domain/**, apps/studio/src/storage/**

## Objective

Единый принцип для всех четырёх: сервер остаётся stateless (ADR-0004,
без изменений) — вся история диалога приходит от клиента при КАЖДОМ
вызове в поле `messages`, ничего не сохраняется на сервере между
вызовами.

### Общая форма запроса (все четыре route.ts)

```typescript
{
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  sceneText?: string;    // текущий текст сцены (см. пер-route ниже)
  bookContext?: object;  // как и раньше — coauthor: обязателен;
                          // editor: опционален; critic/reader: не
                          // используется вообще (вне таблицы контекстов)
}
```

Валидация `messages`: должен быть массивом (может быть пустым — это
первое сообщение в новом диалоге), каждый элемент — объект с `role`
("user"/"assistant") и `content` (string). При некорректной форме —
400 с конкретным сообщением, тот же паттерн, что уже есть для
остальных полей.

### Подробный пример — /api/coauthor (сделай именно так)

```typescript
if (!Array.isArray(body?.messages)) {
  return NextResponse.json(
    { ok: false, error: "messages must be an array." },
    { status: 400 },
  );
}
// ... (аналогичная точечная проверка каждого элемента — role/content;
// не переусложняй, простая проверка typeof, без библиотек валидации)

const bookContext = body?.bookContext;
if (typeof bookContext !== "object" || bookContext === null) {
  return NextResponse.json(
    { ok: false, error: "bookContext is required and must be an object." },
    { status: 400 },
  );
}

const sceneText = body?.sceneText ?? "";

// Собери Anthropic messages: сначала контекстное сообщение (книга +
// текущий текст сцены, как раньше было единственным user-сообщением),
// затем — реальная история диалога поверх него.
const contextMessage = {
  role: "user" as const,
  content: `Book context...\n${JSON.stringify(bookContext, null, 2)}\n\nCurrent scene text:\n${sceneText}`,
};
const anthropicMessages = [contextMessage, ...body.messages];

const message = await client.messages.create({
  model: "claude-sonnet-5",
  max_tokens: 1024,
  system: "...", // обнови system-промпт: теперь это диалог, а не
                  // одноразовый запрос — явно инструктируй модель
                  // вести связный разговор с автором о сцене,
                  // учитывая всю предыдущую историю сообщений;
                  // если messages пуст — первое сообщение
                  // (contextMessage) само по себе достаточно для
                  // начала (модель может, например, предложить
                  // с чего начать, если пользователь ничего не
                  // спросил явно)
  messages: anthropicMessages,
});
```

Response — БЕЗ ИЗМЕНЕНИЙ по форме: `{ ok: true, result: string } |
{ ok: false, error: string }` (result — это ответ ассистента на
последнее сообщение, не весь диалог — накопление истории и её
хранение остаются на стороне клиента/домен-слоя, не сервера).

### Line Editor (Editor)

Та же схема, `bookContext` остаётся опциональным (как в Sprint 12).
`sceneText` — это то, что раньше называлось `text`, обязателен как
и раньше (Editor всегда работает с конкретным текстом, не пишет с
нуля). System-промпт дополнить: теперь может быть диалог о правках,
не только одноразовая полировка — но базовая задача (полировка
текста, не сочинительство) остаётся неизменной, контекст только для
согласованности, как и было решено в Sprint 12.

### Critic / Reader

Та же схема, но БЕЗ bookContext (они вне таблицы контекстов — не
добавляй его, даже опционально). `sceneText` — обязателен (как
раньше `text`). System-промпт дополнить упоминанием диалога — модель
может отвечать на уточняющие вопросы про уже данную оценку/реакцию,
не только выдавать первичный отзыв.

## Rules

- Не трогай ai/**, UI, domain/**, storage/** — только четыре route.ts.
- Response форма не меняется ни для одного route.ts.
- Не переусложняй валидацию messages — простые проверки типов,
  без библиотек.

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка на КАЖДОМ из четырёх: (а) messages = [] (первое
  сообщение диалога) — получить осмысленный первый ответ; (б)
  messages с 2-3 репликами (user/assistant чередуются) — получить
  ответ, учитывающий предыдущий обмен, не игнорирующий его; (в)
  messages в неверной форме → 400 с конкретным сообщением.
- Приложи реальные ответы по всем четырём route.ts в ARP — это
  большой объём проверки, не сокращай.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
