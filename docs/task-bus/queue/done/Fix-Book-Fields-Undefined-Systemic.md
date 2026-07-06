id: Fix-Book-Fields-Undefined-Systemic
name: "СРОЧНО: normalizeBook — системный фикс для tags/shortAnnotation/fullAnnotation на старых книгах"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/storage/workspaceStorage.ts

Forbidden paths:
- всё остальное

## Objective

Краш подтверждён скриншотом: `book.tags.join(", ")` на `undefined` —
книги, созданные ДО Sprint-11-Step-04 (когда поля tags/shortAnnotation/
fullAnnotation у Book не существовало), уже лежат в НОВОМ формате
`books[]` (не старом single-book формате) — ветка `migrateIfNeeded`
для "уже новый формат" просто мерджит `data` как есть, не проверяя
поля ВНУТРИ каждой книги массива.

Это третий случай одного и того же класса проблемы (были characters
на Workspace, chapter.subtitle, теперь book.tags) — вместо ещё одной
точечной правки в одном месте использования, ввести системную защиту
один раз.

Добавить `normalizeBook`:

```typescript
function normalizeBook(book: Partial<Book>): Book {
  return {
    id: book.id ?? "",
    title: book.title ?? "",
    genre: book.genre ?? "",
    language: book.language ?? "",
    premise: book.premise ?? "",
    shortAnnotation: book.shortAnnotation ?? "",
    fullAnnotation: book.fullAnnotation ?? "",
    tags: book.tags ?? [],
    chapters: book.chapters ?? [],
    characters: book.characters ?? [],
  };
}
```

Применить в ДВУХ местах migrateIfNeeded:

1. Ветка "уже новый формат" (`Array.isArray(data.books)`) — вместо
   простого мерджа, применить `.map(normalizeBook)` к каждой книге
   массива:
   ```typescript
   if (Array.isArray(data.books)) {
     return {
       ...EMPTY_WORKSPACE,
       ...(data as Partial<Workspace>),
       books: data.books.map((book) => normalizeBook(book as Partial<Book>)),
     };
   }
   ```
2. Ветка миграции старого формата — заменить ручную конструкцию
   `migratedBook` на `normalizeBook({ id: "1", title: oldBook.title,
   ..., chapters: data.chapters, characters: data.characters })` —
   тот же результат, но через единую функцию, не дублируя дефолты
   в двух местах.

Это централизует "что делать с недостающими полями книги" в одном
месте — если в будущем добавится ещё одно поле Book и кто-то забудет
обновить normalizeBook, дефект будет проявляться сразу и однотипно
(отсутствующее поле), а не как труднообъяснимый краш в случайном
компоненте месяцы спустя.

## Rules

- Минимальное изменение — только workspaceStorage.ts.
- Не трогай компоненты — они не должны сами защищаться от undefined
  для полей Book, раз есть normalizeBook на входе.

## Validation

- npm run build / npm run lint / prettier --check — чисто.
- Живая проверка: смоделировать через реальный loadWorkspace() книгу
  в новом books[]-формате БЕЗ полей tags/shortAnnotation/
  fullAnnotation (ровно тот случай, что вызвал краш) — убедиться, что
  все три поля получают дефолт. Отдельно проверить, что старый
  single-book формат продолжает мигрировать корректно (регрессия
  на уже пройденный тест из Sprint-11-Step-01).
- git status --short — только workspaceStorage.ts.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect. Приоритетная задача.
