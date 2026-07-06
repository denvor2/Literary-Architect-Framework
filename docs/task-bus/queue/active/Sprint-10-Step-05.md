id: Sprint-10-Step-05
name: "Fix: автовыделение новой главы + панель редактирования главы (заголовок/подзаголовок) + кнопка New Scene в сайдбаре"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/domain/model.ts
- apps/studio/src/workspace/useWorkspaceController.ts
- apps/studio/src/components/Sidebar.tsx
- apps/studio/src/components/EditorArea.tsx
- apps/studio/src/app/page.tsx

Forbidden paths:
- apps/studio/src/components/CharacterPanel.tsx
- apps/studio/src/domain/workspace.ts, apps/studio/src/storage/**
  (Chapter — часть Workspace.chapters, схему Workspace менять не
  нужно, только тип Chapter в model.ts)
- apps/studio/src/ai/**, apps/studio/src/app/api/**

## Objective

Главы должны получить ту же полноту обращения, что уже есть у
Персонажей (Sprint-10-Step-02/03).

### 1. Автовыделение новой главы

useWorkspaceController.ts — createChapter() дополнительно
устанавливает selectedChapterId на id новой главы, и (по аналогии с
createCharacter) сбрасывает selectedSceneId/selectedCharacterId
в null:

```typescript
function createChapter() {
  setWorkspace((previous) => {
    const nextNumber = previous.chapters.length + 1;
    const newChapter = {
      id: String(nextNumber),
      title: `Chapter ${nextNumber}`,
      subtitle: "",
      scenes: [{ id: "1", title: "Scene 1", text: "" }],
    };
    return {
      ...previous,
      chapters: [...previous.chapters, newChapter],
      selectedChapterId: newChapter.id,
      selectedSceneId: null,
      selectedCharacterId: null,
    };
  });
}
```

### 2. Поле subtitle у Chapter

model.ts — добавить readonly subtitle: string в тип Chapter.

useWorkspaceController.ts — добавить updateChapter(chapterId, fields)
по аналогии с updateCharacter (Partial<Pick<Chapter, "title" |
"subtitle">>, immutable .map()).

### 3. Панель редактирования главы

Сейчас, когда выбрана Chapter, но не Scene, EditorArea показывает
только кнопку "New Scene". Добавить туда же (в это же состояние,
над кнопкой) редактируемые поля: Title (input) и Subtitle (input),
меняющие значение через onUpdateChapter (новый проп EditorArea,
проброшенный из page.tsx как updateChapter). Обновление — на
onChange (тот же выбор, что уже сделан для Character).

### 4. Кнопка "+ New Scene" в сайдбаре

Sidebar.tsx — добавить маленькую контурную кнопку "+ New Scene" на
уровне каждой главы (не одна общая, а по одной на главу — рядом с
заголовком главы или сразу под ним, на твоё усмотрение по
аккуратности вёрстки), вызывающую новый проп onCreateScene(chapterId).
Использовать тот же стиль кнопки, что "+ New Character"/"+ New
Chapter" (border, rounded-md, компактный padding — по
UI_STYLE_GUIDE.md).

useWorkspaceController.ts — createScene() уже существует, но
принимает контекст только через previous.selectedChapterId
(неявно, из состояния). Расширь её, чтобы принимать необязательный
chapterId явно: createScene(chapterId?: string) — если передан,
использовать его, если нет — fallback на previous.selectedChapterId
(текущее поведение для существующего вызова из EditorArea
сохраняется без изменений).

page.tsx — передать onCreateScene в Sidebar как обёртку над
createScene, принимающую chapterId.

## Rules

- Не трогай CharacterPanel.tsx.
- Immutable-паттерн — как везде.
- Не меняй Workspace.ts/storage — только Chapter в model.ts.

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка: создать главу — автоматически выделяется, видна
  форма Title/Subtitle; ввести текст — сохраняется; нажать "+ New
  Scene" на конкретной главе из сайдбара — сцена добавляется именно
  в эту главу (не в выбранную по умолчанию).
- Приложи изменённые файлы целиком.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect. Выполняется ПОСЛЕ
Fix-Scene-Highlight-Collision (пересечение по Sidebar.tsx).
