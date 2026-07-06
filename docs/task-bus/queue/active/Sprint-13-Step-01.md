id: Sprint-13-Step-01
name: "Домен-модель: диалоги помощников (assistantThreads) внутри Book + сохранение выбранного режима"
type: implementation

## ВАЖНО — прочитать перед началом, это изменение формы Book (как в Sprint 11 Step 01)

Не самый рискованный шаг проекта (это была мультикнижность), но того
же класса — меняется форма Book, требует аккуратной миграции через
normalizeBook(). Работай методично.

## Scope

Allowed paths:
- apps/studio/src/domain/model.ts
- apps/studio/src/domain/workspace.ts
- apps/studio/src/storage/workspaceStorage.ts
- apps/studio/src/workspace/useWorkspaceController.ts

Forbidden paths:
- apps/studio/src/components/** (UI — Step 04, не сейчас)
- apps/studio/src/app/page.tsx
- apps/studio/src/ai/**, apps/studio/src/app/api/**

## Objective

Единый механизм диалога для всех четырёх ролей (Co-author, Editor,
Critic, Reader) — по решению Product Owner. Co-author/Editor
работают с одним непрерывным диалогом; Critic/Reader могут иметь
несколько именованных диалогов ("Новый читатель" и т.п.) — но
структура данных одинакова для всех четырёх, разница только в том,
как UI её использует (это будет решаться в Step 04, не здесь).

### 1. model.ts — новые типы

```typescript
export type ChatMessage = {
  readonly role: "user" | "assistant";
  readonly content: string;
};

export type AssistantThread = {
  readonly id: string;
  readonly name: string;
  readonly messages: readonly ChatMessage[];
};

export type AssistantThreads = {
  readonly coauthor: readonly AssistantThread[];
  readonly editor: readonly AssistantThread[];
  readonly critic: readonly AssistantThread[];
  readonly reader: readonly AssistantThread[];
};
```

Добавить в Book:
```typescript
readonly assistantThreads: AssistantThreads;
```

### 2. workspace.ts — сохранение выбранного режима

Добавить в Workspace:
```typescript
selectedAssistantMode: "coauthor" | "editor" | "critic" | "reader";
```
(нижний регистр с дефисом/без — согласуй с уже существующим
AssistantMode в EditorArea.tsx на UI-стороне при Step 04; здесь,
в домен-слое, используй простой набор строковых значений, без
зависимости от UI-типов). Дефолт — "editor" (соответствует текущему
поведению по умолчанию в UI).

### 3. workspaceStorage.ts — normalizeBook() и миграция

Обновить normalizeBook(): каждая книга без assistantThreads (все
книги, сохранённые до этого шага) получает дефолт — по одному
пустому диалогу на каждую роль:

```typescript
function emptyThread(): AssistantThread {
  return { id: "1", name: "Диалог 1", messages: [] };
}

// внутри normalizeBook():
assistantThreads: book.assistantThreads ?? {
  coauthor: [emptyThread()],
  editor: [emptyThread()],
  critic: [emptyThread()],
  reader: [emptyThread()],
},
```

EMPTY_WORKSPACE (оба места — workspaceStorage.ts и
useWorkspaceController.ts) получает selectedAssistantMode: "editor".

### 4. useWorkspaceController.ts

createBook() — новая книга инициализируется с тем же дефолтом
assistantThreads (по одному пустому диалогу на роль), как в п.3.

Добавить функцию selectAssistantMode(mode: Workspace["selectedAssistantMode"])
— просто устанавливает selectedAssistantMode, ничего больше не
трогает. Экспортировать из хука.

НЕ добавляй пока функции для добавления сообщений в диалог/создания
новых диалогов — это Step 02/04, когда будет ясна форма backend-вызова.

## Rules

- Не трогай UI/page.tsx — это следующие шаги.
- Immutable-паттерн — как везде.
- normalizeBook() — единственное место, где живут дефолты (тот же
  принцип, что установлен в Sprint 11 после инцидента с book.tags).

## Validation

- npm run build — здесь допустимы ошибки в Forbidden paths
  (компоненты ещё не знают о новых полях) — опиши их явно в ARP,
  как это уже делалось в Sprint 11/12 для аналогичных ситуаций.
- Allowed paths должны компилироваться внутренне непротиворечиво.
- npm run lint на изменённых файлах — чисто.
- Живая проверка: смоделировать через реальный loadWorkspace() книгу
  БЕЗ assistantThreads (текущий формат) — убедиться, что после
  загрузки у неё есть все четыре роли с одним пустым диалогом
  каждая. Отдельно — книгу, где assistantThreads уже частично
  заполнены (например, только coauthor с реальными сообщениями) —
  убедиться, что существующие сообщения не теряются, а отсутствующие
  роли получают дефолт.
- git status --short — только 4 файла.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
