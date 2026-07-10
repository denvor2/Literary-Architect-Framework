id: Sprint-24-Step-02-ARP
name: "ARP: глобально уникальные id для Chapter/Scene/Character/Idea/AssistantThread"
type: arp

## Что сделано

В `apps/studio/src/workspace/useWorkspaceController.ts` заменена генерация id для НОВЫХ
сущностей на `crypto.randomUUID()` во всех шести функциях, перечисленных в Objective Step Card,
плюс в `createBook()` — седьмое место правки, добавленное в рамках этого же шага после
подтверждения родительской сессией (см. ниже, раздел "Дополнение: `createBook()`").

- **`createChapter()`** — `id` новой главы: `String(nextNumber)` → `crypto.randomUUID()`;
  заодно `id` её единственной начальной сцены (`"1"` → `crypto.randomUUID()`) — та же коллизия
  того же класса, создаваемая той же функцией в том же вызове.
- **`createScene()`** — `newSceneId`: `String(nextNumber)` → `crypto.randomUUID()`.
- **`createCharacter()`** — `id` нового персонажа: `String(nextNumber)` → `crypto.randomUUID()`;
  `nextNumber` удалён как переменная (использовался только для id, нигде больше в функции не
  фигурировал — иначе остался бы неиспользуемым и не прошёл бы ESLint).
- **`createIdea()`** — `id`: `String(Date.now())` → `crypto.randomUUID()`, как явно
  предписано Step Card ("та же проблема класса... заменить на ту же схему для единообразия").
- **`createThread()`** — `id` нового диалога: `String(nextNumber)` → `crypto.randomUUID()`;
  `nextNumber` сохранён — используется отдельно для фолбэка имени (`` `Диалог ${nextNumber}` ``).
- **`acceptStructureProposal()`** — `id` каждой новой главы и каждой новой сцены (оба случая:
  выбранные сцены предложения и дефолтная "Scene 1", когда сцены не выбраны) — везде
  `crypto.randomUUID()` вместо позиционных `String(...)`; параметр индекса `i` у
  `selectedScenes.map` удалён как более не используемый.

`Book.id` не тронут — как прямо предписано Rules Step Card и подтверждено родительской сессией
(ADR-0012, раздел 4: `Book.id` уже фактически уникален, не часть найденной коллизии).

### Дополнение: `createBook()` (седьмое место правки)

Первая версия этого ARP флагировала `createBook()` как отдельное наблюдение в разделе
"Отклонения", не расширяя scope самостоятельно: эта функция не входит в исходный список из шести
функций Objective Step Card, но создаёт начальную главу (`id: "1"`), начальную сцену внутри неё
(`id: "1"`) и по одному начальному диалогу на каждую из четырёх ролей (`id: "1"` для
`coauthor`/`editor`/`critic`/`reader`) — для КАЖДОЙ новой книги. Родительская сессия проверила
это наблюдение и подтвердила: это реальный пробел, а не самовольное расширение scope, — и явно
поручила исправить в рамках этого же шага (`createBook()` — самый частый путь создания новой
книги в приложении, кнопка "Новая книга"; ровно тот сценарий, который Step Card называет как
блокирующий отказ).

**`createBook()`** — заменены три места генерации `"1"` на `crypto.randomUUID()`:
- `id` начальной главы (`chapters[0].id`);
- `id` начальной сцены внутри неё (`chapters[0].scenes[0].id`);
- `id` каждого из четырёх начальных диалогов в `assistantThreads`
  (`coauthor`/`editor`/`critic`/`reader`).

`Book.id` в этой же функции (`String(nextNumber)`) осознанно НЕ тронут — то же обоснование, что
и выше (ADR-0012, Decision 4). Больше ничего в `createBook()` не менялось.

## Соответствие Scope

Allowed paths по Step Card — только `apps/studio/src/workspace/useWorkspaceController.ts`.
Изменён ровно этот один файл. `git status --short` после завершения работы:

```
 M apps/studio/src/workspace/useWorkspaceController.ts
R  docs/task-bus/queue/pending/Sprint-24-Step-02.md -> docs/task-bus/queue/active/Sprint-24-Step-02.md
```

`apps/studio/src/domain/**`, `apps/studio/src/storage/**`, `apps/studio/src/repositories/**`,
`apps/studio/src/app/api/**`, любой `components/**` — не тронуты (Forbidden paths по Step Card).
Форма данных не менялась — `id` остаётся `string` (тип не менялся, значение теперь UUID-строка
вместо маленького числа), immutable-паттерн (`{...previous, ...}` / `.map()`) сохранён без
изменений везде, где он уже был.

## Validation

Все команды перепрогнаны из `apps/studio/` после добавления правки `createBook()`:

- **`npx tsc --noEmit`** — чисто, без вывода.
- **`npx eslint src`** — чисто, без вывода.
- **`npx prettier --check "src/workspace/useWorkspaceController.ts"`** — после правки
  `createBook()` строка со стартовым диалогом `coauthor` превысила лимит длины и была
  переформатирована через `npx prettier --write` (перенесена на 3 строки, как остальные три роли
  остались в одну строку — стандартное поведение Prettier для соседних объектов разной длины).
  Повторная проверка того же файла — чисто.
- **`npx prettier --check "src/**/*.{ts,tsx}"`** (по всему проекту) — те же 7 файлов с
  предсуществующими расхождениями формата, что и в первой версии этого ARP
  (`src/ai/operations.ts`, `src/app/api/book-field/route.ts`, `src/app/api/coauthor/route.ts`,
  `src/app/api/critic/route.ts`, `src/app/api/test-connection/route.ts`,
  `src/components/AssistantPanel.tsx`, `src/components/EditorArea.tsx`) — `useWorkspaceController.ts`
  в списке отсутствует, т.е. чист; этот шаг их не трогал и не расширял дрейф.
- **`npm run build`** — успешная production-сборка (`✓ Compiled successfully`, TypeScript
  прошёл, статические страницы и все 6 API-роутов сгенерированы).
- **`npm run test:e2e`** — сознательно НЕ запускался (то же ограничение, что и в первой версии
  этого ARP, повторно подтверждено родительской сессией): у Product Owner прямо сейчас открыт и
  активно используется dev-сервер на `localhost:3000` с реальными тестовыми данными в
  `localStorage` браузера; Playwright поднимает собственный сервер и мог бы столкнуться портами
  или состоянием с этой активной сессией.

### Живая проверка (pure-reducer script, без браузера — по указанию заказчика этого запуска)

Приложение не запускалось и DevTools не использовался (чтобы не мешать активной сессии Product
Owner на порту 3000). Вместо этого — стандартная для проекта техника
`literary-studio-live-verify`: тела всех семи изменённых функций (шесть исходных + `createBook()`,
добавленная в рамках этого же шага) скопированы дословно (только `setWorkspace((previous) =>
{...})` заменён на прямой вызов `(previous) => {...}`, так как здесь нет React state) в отдельный
Node-скрипт вне репозитория:
`C:\Users\Bat\AppData\Local\Temp\claude\e--Projects-Literary-Architect-Framework\71698014-019f-42db-9e0c-480314f9a6bc\scratchpad\live-verify-sprint24-step02.mjs`.
`crypto.randomUUID()` — тот же самый глобальный API в Node 22 и в браузере, без импорта.

Сценарий (расширен по сравнению с первой версией этого ARP — добавлен второй блок, покрывающий
`createBook()`):

1. Две книги (`book-1`, `book-2`, предзаполненные seed-данными — эмулируют уже существующие в БД
   книги), в каждой — `createChapter()` → `createScene()` → `createCharacter()` → `createIdea()`
   → `createThread("coauthor")`; для `book-2` дополнительно `acceptStructureProposal()`.
2. Отдельный, независимый workspace с нуля (без seed-данных): `createBook()` вызывается дважды
   подряд — ровно то, что происходит при двух нажатиях кнопки "Новая книга" — и проверяются id
   стартовой главы/сцены/диалогов обеих получившихся книг.

Реальный вывод:

```
=== Sprint-24-Step-02 live verification (pure-reducer) ===
book1 chapter ids: [ '470ffd51-72f5-402f-8bf6-bb352ad559f8' ]
book1 scene ids (chapter 0): [
  'f537ae79-0ccf-4d27-80a5-4626e90c1df7',
  '32643dc6-ae42-45f7-b6e3-2922136ff2b5'
]
book1 character ids: [ '96060ac1-f829-441a-9b7a-a6bac598cffa' ]
book1 idea ids: [ 'a1301892-c2cf-46ed-be90-8143c626787b' ]
book1 coauthor thread ids: [ 'seed-1', 'b36533ca-9dcf-43e4-8b2f-49b2ee3d7984' ]
---
book2 chapter ids: [
  '2fd45b86-09b7-4ae3-b2c2-b39cbd5ded75',
  '14920400-4a6f-466f-ae4c-f8e9a79f14c1'
]
book2 scene ids (chapter 0, createScene): [
  '9edf8cfe-2231-44a7-bc4f-5395e0e8143a',
  'a17dc37d-479e-41d6-a5ff-d5c031f6ecc5'
]
book2 acceptStructureProposal chapter id: 14920400-4a6f-466f-ae4c-f8e9a79f14c1 scene ids: [ '3dc0b210-fbaa-4ace-af02-cad025d31f17' ]
book2 character ids: [ 'c86511ae-0315-42ed-8982-9e067d9ad3d3' ]
book2 idea ids: [ 'ac3ee80f-7e62-4d81-9705-c5ca0948675b' ]
book2 coauthor thread ids: [ 'seed-1', 'a11ca4ac-c8ef-42ba-9813-2b56bb33a4e6' ]
---
OK: chapter ids differ across books: "470ffd51-72f5-402f-8bf6-bb352ad559f8" vs "2fd45b86-09b7-4ae3-b2c2-b39cbd5ded75"
OK: scene ids differ across books: "32643dc6-ae42-45f7-b6e3-2922136ff2b5" vs "a17dc37d-479e-41d6-a5ff-d5c031f6ecc5"
OK: character ids differ across books: "96060ac1-f829-441a-9b7a-a6bac598cffa" vs "c86511ae-0315-42ed-8982-9e067d9ad3d3"
OK: idea ids differ across books: "a1301892-c2cf-46ed-be90-8143c626787b" vs "ac3ee80f-7e62-4d81-9705-c5ca0948675b"
OK: thread ids differ across books: "b36533ca-9dcf-43e4-8b2f-49b2ee3d7984" vs "a11ca4ac-c8ef-42ba-9813-2b56bb33a4e6"
OK: new chapter ids are real UUIDs (not String(1)/String(2))
OK: new scene ids are real UUIDs
OK: acceptStructureProposal chapter/scene ids are real UUIDs
OK: character ids are real UUIDs
OK: idea ids are real UUIDs (not String(Date.now()))
OK: thread ids are real UUIDs
---
createBook() book1 id: 1 chapter id: a7a3a9ae-3e10-44fc-951a-d9ff6a7eb204 scene id: e5b20223-7c83-4ab7-b657-f591e9e5d1aa
createBook() book1 thread ids: {
  coauthor: 'e02a76fa-9712-4762-866a-de0feaffeee8',
  editor: '65d400db-e720-44c5-994f-eb7f34231497',
  critic: 'c9dba613-a1d1-4e00-aeb5-92180d33c536',
  reader: 'a3bb618f-6d3a-4874-82c7-27c5a4da9860'
}
createBook() book2 id: 2 chapter id: 3a9b2ce0-4045-46f1-880d-ca9508fb10e9 scene id: 3e71b940-242a-4bcb-b961-199ed80f7ce5
createBook() book2 thread ids: {
  coauthor: 'dc9269e3-3a07-4b28-bbf9-064a943fca3d',
  editor: '2049e0b4-98c0-4ea2-bf56-0ab5c8b44bc4',
  critic: 'e4fff8b8-1edd-4816-835f-88869fee77ab',
  reader: '822b736a-c78f-4e0c-985e-fbfaec998ad9'
}
---
OK: createBook() Book.id still differs across books (untouched, expected): "1" vs "2"
OK: createBook() starting chapter ids differ across books: "a7a3a9ae-3e10-44fc-951a-d9ff6a7eb204" vs "3a9b2ce0-4045-46f1-880d-ca9508fb10e9"
OK: createBook() starting scene ids differ across books: "e5b20223-7c83-4ab7-b657-f591e9e5d1aa" vs "3e71b940-242a-4bcb-b961-199ed80f7ce5"
OK: createBook() starting "coauthor" thread ids differ across books: "e02a76fa-9712-4762-866a-de0feaffeee8" vs "dc9269e3-3a07-4b28-bbf9-064a943fca3d"
OK: createBook() starting "editor" thread ids differ across books: "65d400db-e720-44c5-994f-eb7f34231497" vs "2049e0b4-98c0-4ea2-bf56-0ab5c8b44bc4"
OK: createBook() starting "critic" thread ids differ across books: "c9dba613-a1d1-4e00-aeb5-92180d33c536" vs "e4fff8b8-1edd-4816-835f-88869fee77ab"
OK: createBook() starting "reader" thread ids differ across books: "a3bb618f-6d3a-4874-82c7-27c5a4da9860" vs "822b736a-c78f-4e0c-985e-fbfaec998ad9"
OK: createBook() starting chapter ids are real UUIDs (not String(1) for both books)
OK: createBook() starting scene ids are real UUIDs (not String(1) for both books)
OK: createBook() starting thread ids (all 4 roles, both books) are real UUIDs
=== done ===
```

Это прямое подтверждение факта, который Validation Step Card требует проверить через DevTools
(тот же самый JSON-путь `books.map(b => b.chapters.map(c => c.id))`, только собранный вручную
из результата reducer-вызовов, а не прочитанный из `localStorage` браузера): id глав/сцен второй
книги реально не совпадают с id первой (раньше оба были бы `"1"`), плюс явно проверена форма
значения (реальный UUID regex, а не просто "не равно"). Дополнительно подтверждён исходный
блокирующий сценарий Step Card напрямую: две книги, созданные подряд через `createBook()` (кнопка
"Новая книга") — то есть без вызова `createChapter()`/`createScene()`/`createThread()` вообще, —
получают разные id стартовой главы, сцены и всех четырёх диалогов; `Book.id` при этом остаётся
`"1"`/`"2"` (несовпадающий, но по другой, уже принятой ADR-0012 причине — не трогается этим
шагом).

## Отклонения от Step Card

Нет открытых отклонений. Первая версия этого ARP флагировала `createBook()` как отдельное
наблюдение, вынесенное на явное решение Product Owner (не самовольное расширение Scope, а вопрос
"чинить сейчас в рамках этого шага или отдельным follow-up Step Card"). Родительская сессия
проверила наблюдение, подтвердила его как реальный пробел этого же шага (не как новый scope) и
поручила исправить здесь же — см. раздел "Дополнение: `createBook()`" выше. Вопрос закрыт в
рамках этой же карточки, отдельный follow-up Step Card не требуется.

Итоговый список мест правки (семь функций, все — в
`apps/studio/src/workspace/useWorkspaceController.ts`): `createChapter()`, `createScene()`,
`createCharacter()`, `createIdea()`, `createThread()`, `acceptStructureProposal()`,
`createBook()`.

## Stop Condition

Не закоммичено. Жду подтверждения Product Owner (`STATUS: OK`) — Step Card прямо требует не
коммитить без него.
