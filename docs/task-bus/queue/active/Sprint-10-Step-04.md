id: Sprint-10-Step-04
name: "Fix: навигация обратно к книге + добавить createChapter + убрать мёртвую кнопку"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/workspace/useWorkspaceController.ts
- apps/studio/src/components/Sidebar.tsx
- apps/studio/src/components/EditorArea.tsx
- apps/studio/src/app/page.tsx

Forbidden paths:
- apps/studio/src/domain/**, apps/studio/src/storage/** (не нужны
  изменения схемы для этого шага)
- apps/studio/src/ai/**, apps/studio/src/app/api/**
- apps/studio/src/components/CharacterPanel.tsx (это Step 03,
  выполняется раньше — не пересекайся)

## Objective

### 1. Навигация назад к обзору книги

Сейчас после выбора Chapter/Scene нет способа вернуться к общему
виду книги (EditorArea уже умеет его показывать — финальный return в
компоненте, просто на него нет пути из UI).

useWorkspaceController.ts — добавить функцию selectBook():

```typescript
function selectBook() {
  setWorkspace((previous) => ({
    ...previous,
    selectedChapterId: null,
    selectedSceneId: null,
    selectedCharacterId: null,
  }));
}
```

Sidebar.tsx — сделать блок "Book" (сейчас просто <div><h2>Book</h2>
<p>{bookTitle}</p></div>) кликабельным: обернуть в <button> или
добавить onClick на существующий элемент, вызывающий onSelectBook
(новый проп). Подсветка активного состояния — когда ни
selectedChapterId, ни selectedSceneId, ни selectedCharacterId не
установлены (аналогично уже существующей логике подсветки chapter/
scene).

page.tsx — передать selectBook в Sidebar как onSelectBook.

### 2. Добавить главу

useWorkspaceController.ts — добавить createChapter() по аналогии с
createScene()/createCharacter() (нумерация id тем же способом:
chapters.length + 1, новая глава с одной пустой сценой — тот же
паттерн, что уже используется при createBook() для первой главы,
т.е. новая глава сразу содержит Scene 1, не создаётся пустой без
сцен):

```typescript
function createChapter() {
  setWorkspace((previous) => {
    const nextNumber = previous.chapters.length + 1;
    return {
      ...previous,
      chapters: [
        ...previous.chapters,
        {
          id: String(nextNumber),
          title: `Chapter ${nextNumber}`,
          scenes: [{ id: "1", title: "Scene 1", text: "" }],
        },
      ],
    };
  });
}
```

Sidebar.tsx — добавить кнопку "+ New Chapter" рядом с заголовком
секции "Chapters" (тот же визуальный паттерн, что уже сделан для
"+ New Character" в Sprint-10-Step-02), вызывает onCreateChapter.

page.tsx — передать createChapter в Sidebar как onCreateChapter.

### 3. Мёртвая кнопка "New Scene" в EditorArea.tsx (ветка !book)

Эта кнопка сейчас без onClick — на практике недостижима (книга
создаётся только через диалог New Book в шапке, не через эту кнопку).
Убрать кнопку из этой ветки полностью, оставить только текст-
подсказку (например, "Create your first book to get started" или
похожее — сформулируй сам, главное — не оставлять кликабельный
элемент, который ничего не делает).

## Rules

- Не трогай CharacterPanel.tsx, domain/**, storage/** — не в этом шаге.
- Стилистически — Tailwind-классы как везде рядом.
- Immutable-паттерн в контроллере — как везде.

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка: создать вторую главу — появляется в списке слева
  с новой пустой сценой; кликнуть "Book" в сайдбаре из состояния
  "выбрана сцена" — возврат к обзору книги; убедиться, что мёртвая
  кнопка убрана (или её больше нет в исходном коде для ветки !book).
- Приложи изменённые файлы целиком.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect. Выполняется ПОСЛЕ
Sprint-10-Step-03 (пересечение по useWorkspaceController.ts).
