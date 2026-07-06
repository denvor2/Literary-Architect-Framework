id: Sprint-10-Step-06
name: "Fix: автовыделение новой сцены + редактируемое название сцены"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/workspace/useWorkspaceController.ts
- apps/studio/src/components/EditorArea.tsx

Forbidden paths:
- apps/studio/src/components/Sidebar.tsx, CharacterPanel.tsx
- apps/studio/src/domain/**, apps/studio/src/storage/**
- apps/studio/src/ai/**, apps/studio/src/app/api/**

## Objective

Та же парность, что уже сделана для Chapter (Step-05) и Character
(Step-02/03) — теперь для Scene. Product Owner подтвердил в браузере:
сцена создаётся, но не выделяется автоматически, и её название
нельзя изменить. Отдельное важное уточнение от Product Owner:
название сцены — служебное, для навигации в сайдбаре, не попадает в
текст книги (это не заголовок главы или книги) — тем не менее должно
быть редактируемым, просто это не "контент", а метка для писателя.

### 1. Автовыделение новой сцены

useWorkspaceController.ts — createScene(chapterId?) дополнительно
устанавливает selectedSceneId на id новой сцены и selectedChapterId
на targetChapterId (тот, в который добавлена сцена — важно: если
сцена создана кнопкой в сайдбаре для НЕ текущей выбранной главы,
после создания должна выделиться именно та глава и та сцена, куда
её добавили, а не остаться на прежнем выборе):

```typescript
function createScene(chapterId?: string) {
  setWorkspace((previous) => {
    const targetChapterId = chapterId ?? previous.selectedChapterId;
    if (!targetChapterId) return previous;
    const targetChapter = previous.chapters.find(
      (chapter) => chapter.id === targetChapterId,
    );
    if (!targetChapter) return previous;
    const nextNumber = targetChapter.scenes.length + 1;
    const newSceneId = String(nextNumber);
    return {
      ...previous,
      chapters: previous.chapters.map((chapter) =>
        chapter.id === targetChapterId
          ? {
              ...chapter,
              scenes: [
                ...chapter.scenes,
                { id: newSceneId, title: `Scene ${nextNumber}`, text: "" },
              ],
            }
          : chapter,
      ),
      selectedChapterId: targetChapterId,
      selectedSceneId: newSceneId,
      selectedCharacterId: null,
    };
  });
}
```

### 2. Редактируемое название сцены

useWorkspaceController.ts — добавить updateSceneTitle(chapterId,
sceneId, title) по аналогии с updateSceneText (immutable .map() по
chapters → scenes).

EditorArea.tsx — в ветке "выбраны и Chapter, и Scene" (основной вид
редактирования текста) заменить статичный заголовок названия сцены
(если сейчас это текст/heading) на редактируемый input — тот же
визуальный подход, что уже сделан для Chapter title (border,
compact, но менее акцентный по размеру шрифта — название сцены
служебное, не должно визуально доминировать так же, как заголовок
главы). Обновление — через onChange, вызывающий новый проп
onUpdateSceneTitle(chapterId, sceneId, title).

page.tsx — передать updateSceneTitle в EditorArea как
onUpdateSceneTitle.

## Rules

- Не трогай Sidebar.tsx — название сцены там уже корректно
  отображается (scene.title), просто теперь оно будет обновляться
  из другого места.
- Не путай название сцены (служебное, навигационное) с текстом сцены
  (содержимое книги, уже редактируется через существующий textarea) —
  это два разных поля, оба остаются редактируемыми, независимо друг
  от друга.
- Immutable-паттерн — как везде.

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка: создать сцену в конкретной главе через кнопку в
  сайдбаре — она автоматически выделяется (и глава, и сцена);
  изменить название сцены в EditorArea — обновляется и в самом
  EditorArea, и в списке слева (Sidebar), сохраняется после
  перезагрузки страницы.
- Приложи изменённые файлы целиком.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
