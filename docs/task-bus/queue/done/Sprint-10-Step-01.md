id: Sprint-10-Step-01
name: "Домен-модель: сущность Character + хранение + мутации"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/domain/model.ts
- apps/studio/src/domain/workspace.ts
- apps/studio/src/storage/workspaceStorage.ts
- apps/studio/src/workspace/useWorkspaceController.ts

Forbidden paths:
- любой UI-компонент (это Step 02)
- apps/studio/src/ai/**, apps/studio/src/app/api/**

## Objective

Персонажи — новая сущность, без AI Expert'а на этом этапе (чистое
CRUD-расширение домен-модели, по тому же паттерну, что уже есть у
Scene/Chapter).

### model.ts

Добавить тип по образцу Scene:

```typescript
export type Character = {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly notes: string;
};
```

### workspace.ts

Добавить в Workspace:

```typescript
characters: readonly Character[];
selectedCharacterId: string | null;
```

Обновить импорт типа Character.

### workspaceStorage.ts

Обновить EMPTY_WORKSPACE — добавить characters: [], selectedCharacterId: null.
Никакой другой логики загрузки/сохранения не менять — тот же
straight-lift принцип, что уже описан в комментарии файла.

### useWorkspaceController.ts

Обновить EMPTY_WORKSPACE тем же образом. Добавить мутации по тому же
паттерну, что createScene/updateSceneText:

- createCharacter() — добавляет нового персонажа с пустыми полями и
  следующим порядковым id (тот же способ нумерации id, что уже
  используется для scenes).
- updateCharacter(characterId, fields) — обновляет name/description/
  notes выбранного персонажа (immutable update, .map() по аналогии с
  updateSceneText).
- deleteCharacter(characterId) — удаляет персонажа из списка (.filter()).
- selectCharacter(characterId) — устанавливает selectedCharacterId.

Добавить derived-значение selectedCharacter (по аналогии с
selectedChapter/selectedScene: characters.find(...)).

createBook() — не менять поведение по умолчанию (новая книга
создаётся без персонажей, characters: [] — это правильный дефолт,
явно укажи в реализации).

## Rules

- Никакого UI — только домен/хранение/контроллер.
- Immutable-паттерн (spread/map/filter), как везде в этом файле —
  никаких мутаций на месте.
- Не трогай существующие функции для Scene/Chapter — только добавление.

## Validation

- npm run build / npm run lint — чисто.
- git status --short — только 4 файла из Allowed paths.
- Приложи изменённые файлы целиком в ARP.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
