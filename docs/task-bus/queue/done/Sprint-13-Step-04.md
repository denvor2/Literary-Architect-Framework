id: Sprint-13-Step-04
name: "Контроллер: мутации для сообщений/диалогов (appendMessage, createThread)"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/workspace/useWorkspaceController.ts

Forbidden paths:
- apps/studio/src/components/** (UI — Step 05, не сейчас)
- apps/studio/src/app/page.tsx
- apps/studio/src/domain/**, apps/studio/src/storage/** (типы уже
  готовы в Step 01, не трогай)
- apps/studio/src/ai/**, apps/studio/src/app/api/**

## Objective

Архитектурное упрощение (согласовано): "активный" диалог для
Critic/Reader — просто ПОСЛЕДНИЙ элемент массива threads для этой
роли, не нужен отдельный activeThreadId в Workspace. "Начать заново"
добавляет новый пустой диалог в конец массива, автоматически
становясь активным. Для Co-author/Editor — всегда работаем с
threads[0] (единственный, непрерывный).

### 1. appendMessage(mode, message)

```typescript
function appendMessage(
  mode: "coauthor" | "editor" | "critic" | "reader",
  message: ChatMessage,
) {
  setWorkspace((previous) => {
    const activeBook = previous.books.find(
      (book) => book.id === previous.activeBookId,
    );
    if (!activeBook) return previous;
    const threads = activeBook.assistantThreads[mode];
    const lastIndex = threads.length - 1;
    const updatedThreads = threads.map((thread, index) =>
      index === lastIndex
        ? { ...thread, messages: [...thread.messages, message] }
        : thread,
    );
    return {
      ...previous,
      books: previous.books.map((book) =>
        book.id === activeBook.id
          ? {
              ...book,
              assistantThreads: {
                ...book.assistantThreads,
                [mode]: updatedThreads,
              },
            }
          : book,
      ),
    };
  });
}
```

### 2. createThread(mode)

Добавляет новый пустой диалог в конец массива для указанной роли
(активной книги) — по тому же принципу, что createChapter/
createCharacter (immutable, поиск activeBook, no-op если книги нет):

```typescript
function createThread(mode: "coauthor" | "editor" | "critic" | "reader") {
  setWorkspace((previous) => {
    const activeBook = previous.books.find(
      (book) => book.id === previous.activeBookId,
    );
    if (!activeBook) return previous;
    const threads = activeBook.assistantThreads[mode];
    const nextNumber = threads.length + 1;
    const newThread: AssistantThread = {
      id: String(nextNumber),
      name: `Диалог ${nextNumber}`,
      messages: [],
    };
    return {
      ...previous,
      books: previous.books.map((book) =>
        book.id === activeBook.id
          ? {
              ...book,
              assistantThreads: {
                ...book.assistantThreads,
                [mode]: [...threads, newThread],
              },
            }
          : book,
      ),
    };
  });
}
```

Экспортировать обе из хука. Также экспортировать derived-значение
для удобства UI в Step 05 — активный диалог для каждой роли активной
книги (последний элемент массива):

```typescript
const activeThreads = activeBook
  ? {
      coauthor: activeBook.assistantThreads.coauthor.at(-1),
      editor: activeBook.assistantThreads.editor.at(-1),
      critic: activeBook.assistantThreads.critic.at(-1),
      reader: activeBook.assistantThreads.reader.at(-1),
    }
  : undefined;
```

(Экспортировать `activeThreads` из return-объекта хука.)

## Rules

- Не трогай UI/page.tsx/domain/storage/ai/api — только этот файл.
- Immutable-паттерн — как везде.
- Не добавляй ничего сверх двух функций + одного derived-значения —
  остальное (какая роль сейчас активна и т.п.) уже есть с Step 01
  (selectedAssistantMode/selectAssistantMode).

## Validation

- npm run build — здесь по-прежнему могут быть ошибки в Forbidden
  paths (UI ещё не знает про новые функции) — опиши явно.
- Allowed path (этот единственный файл) должен компилироваться
  внутренне непротиворечиво.
- npm run lint — чисто.
- Живая проверка (без сети — чистая работа с React state, тот же
  класс проверки, что для остальных чисто-контроллерных мутаций):
  appendMessage добавляет сообщение именно в последний диалог роли,
  не создавая новый и не трогая другие роли/диалоги; createThread
  добавляет новый диалог в конец, activeThreads после этого
  указывает на него же (последний элемент).
- Приложи изменённый файл целиком.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
