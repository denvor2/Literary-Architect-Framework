id: Sprint-12-Step-01
name: "Backend: /api/coauthor (discovery, полный Book как контекст)"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/app/api/coauthor/route.ts (новый файл)

Forbidden paths:
- apps/studio/src/app/api/line-editor/route.ts (это Step 02, не сейчас)
- apps/studio/src/app/api/critic/route.ts, apps/studio/src/app/api/reader/route.ts
- apps/studio/src/ai/**
- любой UI-код

## Objective

Первый по-настоящему генеративный Expert — пишет/продолжает текст,
не оценивает существующий (в отличие от Critic/Reader) и не
редактирует (в отличие от Editor). По таблице контекстов,
согласованной с Product Owner: Co-author видит книгу ЦЕЛИКОМ (все
главы, сцены, персонажи, метаданные), не только текущую сцену —
первый Expert с таким объёмом контекста.

**Без памяти между вызовами** (тот же принцип, что у всех
предыдущих Expert'ов, ADR-0004) — контекст книги передаётся целиком
при КАЖДОМ вызове, не сохраняется на сервере. Чат-механизм
(сохранение истории обмена) — отдельный, следующий Sprint, не этот.

По образцу /api/line-editor (discovery-реализация): создай POST
/api/coauthor:

Request:
```typescript
{
  currentText: string;       // текущий текст сцены, над которой работает
                              // (может быть пустым — тогда это черновик с нуля)
  bookContext: {
    title: string;
    genre: string;
    language: string;
    premise: string;
    shortAnnotation: string;
    fullAnnotation: string;
    tags: string[];
    chapters: Array<{
      title: string;
      subtitle: string;
      scenes: Array<{ title: string; text: string }>;
    }>;
    characters: Array<{
      name: string;
      description: string;
      notes: string;
    }>;
  };
}
```

(bookContext — упрощённая, без id полей структура, повторяющая форму
Book/Chapter/Scene/Character из model.ts — сериализация целиком, id
не нужны модели, только для внутренней логики UI).

Валидация: если currentText отсутствует/не строка, или bookContext
отсутствует/не объект — { ok: false, error: "..." }, HTTP 400 — тот
же паттерн, что у остальных Expert'ов, конкретное сообщение по
тому, что именно не так.

Success response: { ok: true, result: string } — result — это
предложенный текст (черновик/продолжение сцены). Та же форма ответа,
что у Line Editor (не структура reviews[], как у Critic).

Failure (runtime exception): { ok: false, error: string }, HTTP 500
— тот же паттерн, что везде.

Системный промпт — жёстко закодирован, инструктирует модель:
действовать как соавтор-писатель, а не критик/редактор; учитывать
ВСЮ книгу (сюжет, персонажей, стиль, уже написанные главы) при
продолжении/написании текущей сцены; продолжать текущий текст, если
он не пуст, или начать с нуля по контексту, если пуст; отвечать на
русском (тот же принцип, что уже введён для Reader в Sprint 9).

Модель: claude-sonnet-5, зафиксирована, не параметризуется.

## Rules

- Discovery-реализация: минимально, без абстракций, как у остальных
  route.ts файлов.
- Не трогай другие route.ts, ai/**, UI.

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка: curl -X POST /api/coauthor с реалистичным
  bookContext (минимум 1 глава, 1-2 персонажа, премиз) и пустым
  currentText — приложи полный реальный ответ модели в ARP (черновик
  должен явно отражать заданных персонажей/премиз, не быть
  generic-текстом, который бы получился без контекста — это и есть
  проверка, что контекст реально используется, а не просто
  принимается и игнорируется).
- Отдельно — с непустым currentText, проверь, что ответ продолжает
  именно этот текст, не игнорирует его.
- curl без bookContext → 400 с конкретным сообщением.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
