id: Sprint-11-Step-04
name: "Book: Genre/Language как select везде + новые поля (tags, аннотации)"
type: implementation

## Scope

Allowed paths:
- apps/studio/src/domain/model.ts
- apps/studio/src/workspace/useWorkspaceController.ts
- apps/studio/src/components/NewBookDialog.tsx
- apps/studio/src/components/EditorArea.tsx
- apps/studio/src/app/page.tsx

Forbidden paths:
- apps/studio/src/components/Sidebar.tsx, CharacterPanel.tsx
- apps/studio/src/domain/workspace.ts, apps/studio/src/storage/**
- apps/studio/src/ai/**, apps/studio/src/app/api/**

## Objective

Product Owner нашёл несостыковку: Genre (Жанр) — выпадающий список
при создании книги (NewBookDialog), но обычный текст при
редактировании (EditorArea, Sprint-11-Step-03). Language (Язык)
теперь тоже становится выпадающим списком, по тому же решению.

Плюс — новые поля Book, по уже зафиксированному в vision-документе
направлению (Book-level поля): Tags (Теги), краткая и полная
аннотации.

### 1. model.ts — новые поля Book

```typescript
export type Book = {
  readonly id: string;
  readonly title: string;
  readonly genre: string;
  readonly language: string;
  readonly premise: string;
  readonly shortAnnotation: string;
  readonly fullAnnotation: string;
  readonly tags: readonly string[];
  readonly chapters: readonly Chapter[];
  readonly characters: readonly Character[];
};
```

### 2. NewBookDialog.tsx — Language становится select

Уже есть `GENRES` (массив, `<select>`). Добавить аналогично
`LANGUAGES` — короткий, разумный список (например: Russian, English,
Ukrainian, Belarusian, Kazakh — не нужно исчерпывающего списка всех
языков мира для MVP, просто рабочий набор + не забудь, что "Russian"
уже был дефолтом). Заменить `<input type="text">` для Language на
`<select>` по образцу Genre.

Экспортировать оба массива (`GENRES`, `LANGUAGES`) из файла — они
понадобятся в EditorArea.tsx для того же выпадающего списка в форме
редактирования (не дублировать список, импортировать оттуда).

Сами Tags/аннотации — НЕ добавлять в диалог создания (оставить
диалог компактным: Title/Genre/Language/Premise, как сейчас) — новые
поля заполняются позже, через форму редактирования книги. `createBook`
в контроллере инициализирует их пустыми (`tags: []`,
`shortAnnotation: ""`, `fullAnnotation: ""`).

### 3. EditorArea.tsx — обзор книги

- Genre/Language — заменить `<input>` на `<select>` с опциями из
  `GENRES`/`LANGUAGES` (импортированных из NewBookDialog.tsx).
- Добавить три новых поля после Premise: Tags (текстовое поле,
  значения через запятую — простейшее решение для MVP, без
  выделенного UI тегов-чипов; при onChange разбивать по запятой в
  массив строк, тримить пробелы, отфильтровывать пустые), Short
  Annotation (textarea, компактнее Premise), Full Annotation
  (textarea, побольше).
- Все — через `onUpdateBook`, тот же паттерн, что уже есть.

### 4. useWorkspaceController.ts

`updateBook`'s `Pick` расширить: `"title" | "genre" | "language" |
"premise" | "shortAnnotation" | "fullAnnotation" | "tags"`.

`createBook` — новая книга инициализируется с `tags: []`,
`shortAnnotation: ""`, `fullAnnotation: ""` (как и предписано в п.2).

## Rules

- Не дублируй список GENRES/LANGUAGES — один источник правды,
  импортируется в EditorArea.
- Диалог создания книги остаётся компактным — новые поля только в
  форме редактирования.
- Immutable-паттерн — как везде.

## Validation

- npx tsc --noEmit → 0 ошибок.
- npm run lint / prettier --check → чисто.
- Живая проверка: создать книгу (Genre/Language — теперь оба списком),
  открыть обзор, заполнить Tags/аннотации, сохраняется, переживает
  перезагрузку.
- Приложи изменённые файлы целиком.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
