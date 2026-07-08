id: Sprint-15-Step-01-ARP
name: "ARP: помощники отвечают на языке текущей книги, не жёстко на русском"
type: arp

## Пересмотр в процессе (важно для истории)

Первая версия этого ARP (не закоммичена) добавляла жёстко "отвечай на русском" в Line
Editor/Critic. Product Owner поправил: раз книга может быть на разных языках (`Book.language`),
все четыре Expert'а должны отвечать на языке КОНКРЕТНОЙ книги, не жёстко на русском — это
касается и Reader/Co-author, у которых уже стояло жёсткое "Respond in Russian" (реальный,
ранее не замеченный изъян: книга на английском заставила бы Co-author писать сцены по-русски).
Переделано полностью до коммита.

## Что сделано

- **`line-editor/route.ts`**, **`coauthor/route.ts`** — оба уже получают `bookContext` (весь
  `Book`), язык берётся оттуда: `bookContext?.language ?? "Russian"` /
  `bookContext.language ?? "Russian"`. Line Editor: следует языку книги только в ответах на
  follow-up-вопросы — сама отредактированная сцена остаётся на языке оригинала (никогда не
  переводится, иначе редактура превратилась бы в перевод). Co-author: следует языку книги
  полностью (черновик сцены — это и есть его "ответ").
- **`critic/route.ts`**, **`reader/route.ts`** — новое опциональное поле `bookLanguage: string`
  в теле запроса (дефолт `"Russian"`, если не передано). Сознательно НЕ весь `bookContext` —
  Critic/Reader остаются scene/selection-scoped по дизайну ADR-0008, `bookLanguage` — минимальное
  добавление, не расширяющее их scope. Critic: `comment` — на языке книги, `category`/`severity`
  — прежние английские enum-значения (не тронуты).
- **`ai/operations.ts`** — `critic_review`/`reader_reaction` payload получили опциональный
  `bookLanguage?: string`.
- **`ai/aiBus.ts`** — прокидывает `bookLanguage` в тело запроса, если задан.
- **`AssistantPanel.tsx`** — `ReaderPanel` получил новый проп `bookLanguage` (из `book.language`),
  передаёт его в `reader_reaction`; критик-ветка основного `handleSend` — туда же
  `bookLanguage: book.language`. `improve_text`/`coauthor_draft` не тронуты — уже шлют весь
  `bookContext`, бэкенд сам берёт язык оттуда.

## Соответствие Scope

Изменены ровно 7 файлов из Allowed paths (`git status --short` подтверждает):
`line-editor/route.ts`, `critic/route.ts`, `reader/route.ts`, `coauthor/route.ts`,
`ai/operations.ts`, `ai/aiBus.ts`, `AssistantPanel.tsx`. `domain/`,
`useWorkspaceController.ts`, `page.tsx` не тронуты.

## Validation

- **`npx tsc --noEmit`** — 0 ошибок (один промежуточный проход: `book.language` в
  `handleSend`-замыканиях требовал `book!` — TS не сужает `Book | null` через границу вложенной
  функции так же, как в теле компонента; исправлено, паттерн `book!` уже использовался в
  соседних ветках этого же файла).
- **`npx eslint`**, **`npx prettier --check`** — чисто.
- **`npm run build`** — успешно.
- **Живая проверка (реальный сервер + реальный Claude)** — `npx next start` на порту 3421,
  `scratchpad/verify-sprint15-step01b-live.mjs`, **12/12 PASS**:
  1. Line Editor, книга `language: "English"`, английский текст без follow-up → результат
     остался английским ("The old man walked slowly...").
  2. Line Editor, та же книга + follow-up-вопрос по-английски → ответ на английском, НЕ на
     русском ("Walk" is the base form of the verb...").
  3. Co-author, книга `language: "English"`, пустая сцена + инструкция по-английски → реальный
     черновик на английском ("The snow came early that year...") — не на русском, как было бы
     до этого шага.
  4. Reader, `bookLanguage: "Ukrainian"` → реальная реакция модели на украинском ("Ой, а це
     справді затягує...").
  5. Critic, `bookLanguage: "Ukrainian"` → `comment` на украинском ("Використано розповідний
     прийом..."), `category`/`severity` — прежние английские enum (`"Style"`/`"medium"`).
  6. Reader без `bookLanguage` вообще → дефолт на русском (обратная совместимость с поведением
     до этого шага подтверждена, не только предположена).

Это не просто "сервер принял параметр" — реальные ответы модели действительно на трёх разных
языках (английский, украинский, русский-по-умолчанию) в зависимости от `bookLanguage`.

## Отклонения от Step Card

Нет (Step Card сама была переписана до реализации, отражает финальный scope).

## Stop Condition

Не закоммичено. Жду подтверждения Product Owner.
