id: Sprint-10-Step-03
name: "Fix: автовыделение нового персонажа + автофокус на имени + поле photoUrl"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/domain/model.ts
- apps/studio/src/workspace/useWorkspaceController.ts
- apps/studio/src/components/CharacterPanel.tsx

Forbidden paths:
- apps/studio/src/components/Sidebar.tsx, EditorArea.tsx, page.tsx
- apps/studio/src/ai/**, apps/studio/src/app/api/**
- apps/studio/src/storage/**

## Objective

### Баг 1 — новый персонаж не выделяется автоматически

Сейчас createCharacter() добавляет персонажа, но не выбирает его —
пользователь видит форму предыдущего выбранного персонажа. Исправить
createCharacter() в useWorkspaceController.ts: одновременно с
добавлением персонажа устанавливать selectedCharacterId на id
только что созданного персонажа, и (по симметрии с selectCharacter,
Sprint-10-Step-02) сбрасывать selectedChapterId/selectedSceneId в null.

```typescript
function createCharacter() {
  setWorkspace((previous) => {
    const nextNumber = previous.characters.length + 1;
    const newCharacter: Character = {
      id: String(nextNumber),
      name: "",
      description: "",
      notes: "",
      photoUrl: "",
    };
    return {
      ...previous,
      characters: [...previous.characters, newCharacter],
      selectedCharacterId: newCharacter.id,
      selectedChapterId: null,
      selectedSceneId: null,
    };
  });
}
```

### Баг 2 — автофокус на поле "Name" при выборе/создании персонажа

В CharacterPanel.tsx: при смене character.id (включая переход на
только что созданного) — автоматически ставить фокус курсора в
поле Name. Использовать useRef + useEffect с зависимостью от
character?.id (не от всего объекта character, чтобы не срабатывать
на каждое изменение текста при вводе).

### Новое поле — photoUrl

model.ts: добавить readonly photoUrl: string в тип Character (по
аналогии с остальными полями — просто ссылка на изображение,
никакой загрузки файлов/base64 не реализовывать сейчас — это
осознанно минимальный первый шаг, дальше видно будет по
пользовательскому тестированию).

useWorkspaceController.ts: updateCharacter — расширить тип fields
до Partial<Pick<Character, "name" | "description" | "notes" |
"photoUrl">>.

CharacterPanel.tsx: добавить поле ввода URL (обычный input,
placeholder "Ссылка на изображение..."), с onChange → onUpdate.
Если photoUrl не пустой — показать превью <img> над остальными
полями (просто img с classNam'ом на разумный максимальный размер,
object-cover, скруглённые углы — в духе остального интерфейса). Если
пустой — ничего не показывать (не показывать плейсхолдер-заглушку).

Названия полей UI — на английском, как остальной интерфейс сейчас
(локализация — Sprint 14, не сейчас, по решению Product Owner).

## Rules

- Не трогай Sidebar.tsx/EditorArea.tsx/page.tsx.
- Не реализовывай загрузку файлов — только текстовое поле URL.
- useEffect для автофокуса — только по character?.id, не по всему
  объекту character (иначе будет перехватывать фокус при каждом
  нажатии клавиши).

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка в браузере: создать персонажа — форма пустая,
  курсор в Name сразу. Ввести URL картинки — превью появляется.
  Переключиться на другого персонажа и обратно — данные корректные,
  фокус на Name при каждом переключении.
- Приложи изменённые файлы целиком.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
