id: Sprint-11-Step-02
name: "Мультикнижность: UI списка книг + устранение временного алиаса book"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/components/Sidebar.tsx
- apps/studio/src/components/NewBookDialog.tsx
- apps/studio/src/app/page.tsx
- apps/studio/src/workspace/useWorkspaceController.ts (только удаление
  временного алиаса `book` и переименование в `activeBook` — не
  трогай остальную логику мутаций)

Forbidden paths:
- apps/studio/src/components/EditorArea.tsx, CharacterPanel.tsx
- apps/studio/src/domain/**, apps/studio/src/storage/**
- apps/studio/src/ai/**, apps/studio/src/app/api/**

## Objective

### 1. Исправить NewBookDialog.tsx (известная ошибка компиляции из Step 01)

`NewBookDialogProps.onCreate` сейчас типизирован как `(book: Book) =>
void`. Поменять на `(book: Omit<Book, "id" | "chapters" |
"characters">) => void` — сам вызов внутри компонента уже передаёт
объект правильной формы (без id/chapters/characters), меняется
только объявление типа.

### 2. Sidebar.tsx — список книг вместо одной

Заменить текущий единственный блок "Book" (заголовок + название +
"+ New Book") на список, по образцу уже существующих Chapters/
Characters:

```
BOOK                              + New Book
Первая книга          ← активная, подсвечена
Вторая книга
```

Каждая книга — кнопка, вызывающая `onSelectBook(book.id)`. Активная
книга подсвечена тем же паттерном, что везде (`bg-zinc-200`/
`dark:bg-zinc-800`), с условием `book.id === activeBookId`.
"+ New Book" — без изменений, тот же стиль и вызов `onNewBook`.

Проп `bookTitle` (одиночный) заменяется на `books` (массив) и
`activeBookId` — обнови SidebarProps соответственно.

### 3. page.tsx — логика клика по активной книге = вернуться к обзору

Клик по книге, которая УЖЕ активна, должен вести себя как старое
поведение Sprint 10 ("вернуться к обзору книги"), а не быть
no-op'ом. Клик по НЕактивной книге — переключает. Реализуй это как
обёртку в page.tsx (не в Sidebar — Sidebar не должен знать про
deselectAll, только про сам факт клика):

```typescript
function handleSelectBook(bookId: string) {
  if (bookId === activeBookId) {
    deselectAll();
  } else {
    selectBook(bookId);
  }
}
```

Передать `handleSelectBook` в Sidebar как `onSelectBook`. Передать
`books`/`activeBookId` вместо `bookTitle`.

`<EditorArea book={...}>` — использовать `activeBook` (переименованный
из временного алиаса `book`, см. п.4) вместо прежнего `book`.

### 4. useWorkspaceController.ts — убрать временный алиас

Убрать:
```typescript
// Sprint-11-Step-01 TEMPORARY ALIAS...
const book = activeBook ?? null;
```
Экспортировать `activeBook` напрямую (уже вычисляется в хуке) вместо
`book`. Обнови return-объект хука: `book` → `activeBook`. Больше
никакой логики в этом файле не трогай.

## Rules

- Не трогай EditorArea.tsx/CharacterPanel.tsx — их пропы (`book={...}`)
  меняются со стороны page.tsx (какое значение передаётся), не со
  стороны их собственных объявлений типов (те остаются `book?: Book
  | null`, просто теперь получают `activeBook` под тем же именем
  пропа).
- Immutable-паттерн — как везде.
- Стиль кнопок — по UI_STYLE_GUIDE.md, консистентно с Chapters/
  Characters.

## Validation

- npx tsc --noEmit → 0 ошибок во всём проекте (обе ранее ожидаемые
  ошибки из Step 01 должны исчезнуть).
- npm run lint / npx prettier --check → чисто.
- git status --short — только 4 файла из Allowed paths.
- Живая проверка: создать вторую книгу — обе видны в списке, активная
  подсвечена; кликнуть на неактивную — переключается, её главы/
  персонажи показываются; кликнуть на уже активную (из состояния
  "выбрана сцена") — возврат к обзору книги, а не no-op; создать
  третью книгу — не стирает предыдущие две.
- Приложи изменённые файлы целиком.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
