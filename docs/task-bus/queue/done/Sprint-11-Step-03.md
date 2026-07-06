id: Sprint-11-Step-03
name: "Редактируемые данные книги в обзоре (title/genre/language/premise)"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/workspace/useWorkspaceController.ts
- apps/studio/src/components/EditorArea.tsx
- apps/studio/src/app/page.tsx

Forbidden paths:
- apps/studio/src/components/Sidebar.tsx, CharacterPanel.tsx,
  NewBookDialog.tsx
- apps/studio/src/domain/**, apps/studio/src/storage/**
- apps/studio/src/ai/**, apps/studio/src/app/api/**

## Objective

Product Owner подтвердил в браузере: список книг/переключение/
возврат к обзору — всё работает. Не хватает: обзор книги (финальная
ветка EditorArea, когда не выбрана ни глава, ни сцена, ни персонаж)
сейчас показывает title/genre/language/premise статичным текстом —
никогда не было редактируемым, даже в эпоху одной книги. Привести к
той же парности, что уже есть у Chapter/Character/Scene.

### 1. useWorkspaceController.ts — updateBook

```typescript
function updateBook(
  bookId: string,
  fields: Partial<Pick<Book, "title" | "genre" | "language" | "premise">>,
) {
  setWorkspace((previous) => ({
    ...previous,
    books: previous.books.map((book) =>
      book.id === bookId ? { ...book, ...fields } : book,
    ),
  }));
}
```

Экспортировать из хука вместе с остальными.

### 2. EditorArea.tsx — обзор книги становится редактируемым

В финальной ветке (ни chapter, ни scene не выбраны — сейчас там
`<h1>{book.title}</h1>`, `<p>{book.genre} · {book.language}</p>`,
условный `<p>{book.premise}</p>`, затем список Chapters) — заменить
статичный текст на редактируемые поля:

- Title — input, крупный шрифт (как заголовок сейчас, text-2xl
  font-semibold), placeholder "Book title..."
- Genre и Language — два отдельных input поменьше в одной строке
  (flex gap), вместо текущего объединённого "{genre} · {language}"
- Premise — textarea (не input, там может быть длинный текст),
  всегда видима (не условно, как сейчас через `{book.premise &&
  ...}`) — раз это теперь редактируемое поле, оно должно быть видно
  и когда пустое, с placeholder "What is this book about?"

Обновление каждого поля — через onChange, вызывающий новый проп
onUpdateBook(book.id, { <field>: value }).

Список Chapters ниже — без изменений.

### 3. page.tsx — проброс

Передать updateBook в EditorArea как onUpdateBook.

## Rules

- Не трогай Sidebar.tsx/NewBookDialog.tsx/CharacterPanel.tsx.
- Immutable-паттерн — как везде.
- Стиль полей — консистентно с уже отредактированными Chapter
  title/subtitle (border, rounded-md, padding).

## Validation

- npm run build / npm run lint / prettier --check — чисто.
- Живая проверка: выбрать книгу (обзор без выбранной главы),
  изменить title/genre/language/premise — сохраняется, видно в
  Sidebar (для title) после изменения, переживает перезагрузку
  страницы.
- Приложи изменённые файлы целиком.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
