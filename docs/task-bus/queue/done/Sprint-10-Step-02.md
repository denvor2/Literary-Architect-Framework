id: Sprint-10-Step-02
name: "UI: список персонажей в Sidebar + панель редактирования"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/components/Sidebar.tsx
- apps/studio/src/components/CharacterPanel.tsx (новый файл)
- apps/studio/src/app/page.tsx
- apps/studio/src/workspace/useWorkspaceController.ts (только два
  небольших дополнения, см. ниже — не переписывать остальное)

Forbidden paths:
- apps/studio/src/components/EditorArea.tsx
- apps/studio/src/ai/**, apps/studio/src/app/api/**
- apps/studio/src/domain/**, apps/studio/src/storage/** (уже готовы
  в Step 01, не трогать)

## Objective

### Sidebar.tsx

Добавить секцию "Characters" по образцу существующей секции "Chapters"
(тот же стиль: h2 uppercase label, список кнопок, пустое состояние
"No characters yet" по аналогии с "No chapters yet"). Плюс кнопка
"+ New Character" (вызывает onCreateCharacter). Список — по одному
пункту на персонажа, текст кнопки: character.name || "Untitled
Character" (имя может быть пустым сразу после создания). Клик по
персонажу вызывает onSelectCharacter(character.id). Подсветка
выбранного — тот же паттерн классов, что у chapter/scene (активный
фон zinc-200/zinc-800).

Новые пропсы: characters, selectedCharacterId, onSelectCharacter,
onCreateCharacter.

### CharacterPanel.tsx (новый компонент)

По аналогии с простотой EditorArea, но проще (без AI Bus, без
режимов). Пропсы: character (Character | undefined), onUpdate
(name/description/notes через updateCharacter), onDelete. Три
редактируемых поля (name — input, description — textarea, notes —
textarea), обновление на onChange (или onBlur — выбери, что
естественнее для textarea, опиши выбор в ARP). Кнопка "Удалить
персонажа" — вызывает onDelete, с простым window.confirm перед
удалением (тот же уровень защиты, что нигде пока не введён для
scenes — можно опустить confirm, если это будет несогласованно с
остальным UI; на твоё усмотрение, опиши в ARP).

### page.tsx

- Передать characters/selectedCharacterId/createCharacter/
  selectCharacter/updateCharacter/deleteCharacter из
  useWorkspaceController в Sidebar и в новый рендер CharacterPanel.
- Рендер: если selectedCharacterId установлен — показывать
  CharacterPanel вместо EditorArea; иначе — EditorArea как сейчас
  (простое тернарное условие в месте текущего рендера EditorArea).

### useWorkspaceController.ts — два точечных дополнения

- selectChapter(chapterId) — дополнительно устанавливает
  selectedCharacterId: null (взаимоисключающий выбор).
- selectScene(chapterId, sceneId) — то же самое.

Ничего больше в этом файле не менять — только эти два дополнения
внутри уже существующих функций.

## Rules

- Стилистически (Tailwind-классы) — максимально близко к уже
  существующему коду Sidebar.tsx, не изобретать новую палитру.
- Не трогай EditorArea.tsx, домен/хранение (уже готовы).
- Immutable-паттерн в контроллере — уже есть, не нарушать.

## Validation

- npm run build / npm run lint — чисто.
- Живая проверка в браузере: создать персонажа, ввести имя/описание/
  заметки, убедиться, что сохраняется (перезагрузка страницы —
  данные на месте), удалить персонажа, проверить переключение
  между Editor и CharacterPanel при выборе сцены/персонажа.
- Приложи изменённые/новые файлы целиком.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
