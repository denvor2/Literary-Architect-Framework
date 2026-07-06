id: Sprint-11-Step-01
name: "Мультикнижность: домен-модель Book[] + миграция старого Workspace"
type: implementation

## ВАЖНО — прочитать целиком перед началом, это самый рискованный шаг проекта

Это первое настоящее изменение ФОРМЫ Workspace с самого начала
проекта. Ошибка здесь может стереть данные пользователя. Работай
медленно, проверяй каждый шаг, не спеши к "готово".

## Scope

Allowed paths:
- apps/studio/src/domain/model.ts
- apps/studio/src/domain/workspace.ts
- apps/studio/src/storage/workspaceStorage.ts
- apps/studio/src/workspace/useWorkspaceController.ts

Forbidden paths:
- apps/studio/src/components/** (это Step 02, UI списка книг)
- apps/studio/src/app/page.tsx (обновится в Step 02 вместе с UI —
  если что-то ломается в типах из-за этого шага, зафиксируй как
  известный, временный disconnect между controller и UI, не решай
  сам, не трогая Forbidden paths)
- apps/studio/src/ai/**, apps/studio/src/app/api/**

## Objective

### 1. model.ts — Book получает id, chapters, characters

```typescript
export type Book = {
  readonly id: string;
  readonly title: string;
  readonly genre: string;
  readonly language: string;
  readonly premise: string;
  readonly chapters: readonly Chapter[];
  readonly characters: readonly Character[];
};
```

Scene/Chapter/Character — без изменений (уже есть).

### 2. workspace.ts — Workspace держит список книг, не одну

```typescript
export type Workspace = {
  books: readonly Book[];
  activeBookId: string | null;
  selectedChapterId: string | null;
  selectedSceneId: string | null;
  selectedCharacterId: string | null;
};
```

Поля chapters/characters/book убраны с уровня Workspace — теперь
только внутри конкретного Book в books[]. selectedChapterId и
остальные selection-поля остаются на уровне Workspace (не внутри
Book) — сознательное упрощение: при переключении между книгами
выбор сбрасывается (см. п.4), это MVP-поведение, не баг.

### 3. workspaceStorage.ts — миграция старого формата

Это критическая часть. Старый формат в localStorage (всё, что было
сохранено до этого шага):

```typescript
{ book: Book | null, chapters: Chapter[], characters: Character[],
  selectedChapterId, selectedSceneId, selectedCharacterId }
```

(старый Book без id/chapters/characters — они были отдельными полями
Workspace).

loadWorkspace() должен ОБНАРУЖИТЬ старый формат (наличие поля `book`
как объекта или null НА ВЕРХНЕМ УРОВНЕ распарсенных данных, отсутствие
поля `books`) и мигрировать:

```typescript
function migrateIfNeeded(parsed: any): Workspace {
  // New format already — nothing to migrate.
  if (Array.isArray(parsed.books)) {
    return { ...EMPTY_WORKSPACE, ...parsed };
  }
  // Old format: single `book` + top-level chapters/characters.
  if (parsed.book) {
    const migratedBook: Book = {
      id: "1",
      title: parsed.book.title ?? "",
      genre: parsed.book.genre ?? "",
      language: parsed.book.language ?? "",
      premise: parsed.book.premise ?? "",
      chapters: parsed.chapters ?? [],
      characters: parsed.characters ?? [],
    };
    return {
      books: [migratedBook],
      activeBookId: migratedBook.id,
      selectedChapterId: parsed.selectedChapterId ?? null,
      selectedSceneId: parsed.selectedSceneId ?? null,
      selectedCharacterId: parsed.selectedCharacterId ?? null,
    };
  }
  // No book at all (fresh/empty old data) — start clean in new format.
  return EMPTY_WORKSPACE;
}
```

Встрой эту логику в loadWorkspace() ПОСЛЕ JSON.parse, ДО возврата
результата. Оберни в тот же try/catch, что уже есть — если что-то в
migrateIfNeeded бросит исключение, откатывайся на EMPTY_WORKSPACE
(та же защита, что уже есть для всего loadWorkspace).

EMPTY_WORKSPACE (используется и здесь, и как дублирующая константа
в useWorkspaceController.ts — как сейчас) — новая форма:

```typescript
const EMPTY_WORKSPACE: Workspace = {
  books: [],
  activeBookId: null,
  selectedChapterId: null,
  selectedSceneId: null,
  selectedCharacterId: null,
};
```

### 4. useWorkspaceController.ts — все функции переписываются на активную книгу

Это самая объёмная часть. Общий принцип для КАЖДОЙ функции, которая
раньше читала/писала previous.chapters или previous.characters
напрямую — теперь она должна найти активную книгу через
previous.activeBookId, применить изменение к ЕЁ chapters/characters,
и положить обновлённую книгу обратно в массив books (immutable
map по books, как раньше делался map по chapters).

Пример полной трансформации на одной функции (createChapter) —
остальные (createScene, updateSceneText, updateSceneTitle,
selectChapter, selectScene, createCharacter, updateCharacter,
deleteCharacter, selectCharacter, updateChapter) переделай по ТОЧНО
ТОЙ ЖЕ схеме:

```typescript
function createChapter() {
  setWorkspace((previous) => {
    const activeBook = previous.books.find(
      (book) => book.id === previous.activeBookId,
    );
    if (!activeBook) return previous;
    const nextNumber = activeBook.chapters.length + 1;
    const newChapter: Chapter = {
      id: String(nextNumber),
      title: `Chapter ${nextNumber}`,
      subtitle: "",
      scenes: [{ id: "1", title: "Scene 1", text: "" }],
    };
    return {
      ...previous,
      books: previous.books.map((book) =>
        book.id === activeBook.id
          ? { ...book, chapters: [...book.chapters, newChapter] }
          : book,
      ),
      selectedChapterId: newChapter.id,
      selectedSceneId: null,
      selectedCharacterId: null,
    };
  });
}
```

### 5. createBook() — теперь ДОБАВЛЯЕТ, не заменяет

```typescript
function createBook(newBookData: Omit<Book, "id" | "chapters" | "characters">) {
  setWorkspace((previous) => {
    const nextNumber = previous.books.length + 1;
    const newBook: Book = {
      id: String(nextNumber),
      ...newBookData,
      chapters: [
        {
          id: "1",
          title: "Chapter 1",
          subtitle: "",
          scenes: [{ id: "1", title: "Scene 1", text: "" }],
        },
      ],
      characters: [],
    };
    return {
      ...previous,
      books: [...previous.books, newBook],
      activeBookId: newBook.id,
      selectedChapterId: null,
      selectedSceneId: null,
      selectedCharacterId: null,
    };
  });
}
```

Проверь сигнатуру, которую ожидает NewBookDialog (сейчас передаёт
объект типа Book целиком) — подстрой тип параметра createBook под
то, что реально приходит из диалога, не меняя сам NewBookDialog.tsx
(он вне Allowed paths этого шага; если для этого потребуется его
менять — останови и опиши проблему в ARP, не трогай самовольно).

### 6. Derived-значения

selectedChapter/selectedScene/selectedCharacter теперь должны
искать внутри активной книги, не в Workspace напрямую:

```typescript
const activeBook = books.find((book) => book.id === activeBookId);
const chapters = activeBook?.chapters ?? [];
const characters = activeBook?.characters ?? [];
const selectedChapter = chapters.find((c) => c.id === selectedChapterId);
// ...остальное как раньше, через chapters/characters (уже переменные,
// не workspace-поля напрямую)
```

Добавь новую функцию selectBook(bookId: string) — устанавливает
activeBookId, сбрасывает все три selection-поля в null.

## Rules

- НЕ трогай компоненты и page.tsx — это следующий шаг. Если типы
  контроллера станут несовместимы с текущим page.tsx — это ожидаемо
  и временно, опиши в ARP, не чини со стороны компонентов.
- Immutable-паттерн везде, как и раньше — ни одной мутации на месте.
- Возвращаемое значение useWorkspaceController() должно продолжать
  экспортировать книгу через `book` (для минимальной обратной
  совместимости на один шаг) — экспортируй activeBook под именем book
  ВРЕМЕННО, если это упростит переход, но явно закомментируй, что
  это временный алиас до Step 02. Если это только всё усложняет —
  не делай, просто честно опиши disconnect в ARP.

## Validation

- npm run build — здесь ДОПУСТИМЫ ошибки типов в page.tsx/компонентах
  (Forbidden paths, ещё не обновлены) — но сам домен/storage/
  controller файлы (Allowed paths) должны компилироваться
  внутренне непротиворечиво. Опиши в ARP точно, какие ошибки build
  выдаёт и почему они ожидаемы (должны быть только в файлах вне
  Allowed paths).
- npm run lint на изменённых файлах — чисто.
- **Живая проверка миграции — обязательна, не пропускай:** напиши
  временный tsx-скрипт (как в предыдущих подобных задачах), который
  мокает localStorage СТАРЫМ форматом (реальным, какой сейчас у
  Product Owner — book+chapters+characters на верхнем уровне) и
  вызывает реальный loadWorkspace() — убедись, что результат: один
  Book в books[] со всеми главами/персонажами на месте, activeBookId
  указывает на него, ничего не потеряно. Приложи полный вывод в ARP.
- git status --short — только 4 файла из Allowed paths.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат. Это большой шаг —
не сокращай ARP, опиши каждую переписанную функцию.

## Stop Condition

Не коммить до STATUS: OK от Architect. Если возникнет любая
неопределённость по поводу того, как поступить с данными
пользователя — ОСТАНОВИСЬ и спроси, не гадай.
