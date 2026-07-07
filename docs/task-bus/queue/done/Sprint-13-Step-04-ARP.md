id: Sprint-13-Step-04-ARP
name: "ARP: Контроллер — мутации для сообщений/диалогов (appendMessage, createThread)"
type: arp

## Что сделано

`apps/studio/src/workspace/useWorkspaceController.ts` — добавлены две мутации и одно derived-значение,
дословно по спецификации Step Card:

- **`appendMessage(mode, message)`** — добавляет сообщение в ПОСЛЕДНИЙ элемент массива
  `assistantThreads[mode]` активной книги (immutable `.map`, остальные диалоги и роли не
  затронуты). No-op, если нет активной книги.
- **`createThread(mode)`** — добавляет новый пустой диалог (`{ id, name: "Диалог N", messages: [] }`)
  в конец массива `assistantThreads[mode]` активной книги — тот же паттерн, что у
  `createChapter`/`createCharacter` (immutable, поиск `activeBook`, no-op если книги нет).
- **`activeThreads`** — derived-значение (не мутация): последний элемент каждого из 4 массивов
  `assistantThreads` активной книги, `undefined` если нет активной книги.

Обе функции и `activeThreads` экспортированы из возвращаемого объекта хука (это было отдельно
исправлено после первого прохода — изначально функции были объявлены, но забыты в `return {}`,
поймано локальным `eslint` — `no-unused-vars`).

## Соответствие Scope

- Единственный изменённый файл: `apps/studio/src/workspace/useWorkspaceController.ts` (Allowed
  path).
- Forbidden paths (`components/**`, `page.tsx`, `domain/**`, `storage/**`, `ai/**`, `app/api/**`)
  не тронуты — подтверждено `git status --short`.

## Validation

- **`npx tsc --noEmit`** — 6 ошибок, все в Forbidden paths (`EditorArea.tsx` ×4, `LineEditorPanel.tsx`
  ×1, `NewBookDialog.tsx` ×1) — предсуществующие, унаследованы от Sprint-13-Step-03 (смена формы
  payload `text`→`sceneText`, UI ещё не обновлён). Подтверждено сравнением: `git stash` → тот же
  список из 6 ошибок без моего изменения → `git stash pop`. Мой файл (`useWorkspaceController.ts`)
  не даёт ни одной ошибки.
- **`npx eslint src/workspace/useWorkspaceController.ts`** — 0 ошибок, 0 предупреждений (после
  фикса про забытый `return`).
- **`npx prettier --check src/workspace/useWorkspaceController.ts`** — чисто (после
  `prettier --write`, автоформатирование новых блоков).
- **Живая проверка** — чисто-контроллерная мутация (та же логика, что `setWorkspace`-редьюсеры
  везде в файле), без React-рендера и без сети: тела `appendMessage`/`createThread`/производного
  `activeThreads` скопированы дословно в отдельный Node-скрипт
  (`scratchpad/verify-step04.mjs`, тот же класс техники, что применялась для прочих
  чисто-контроллерных мутаций) и прогнаны против fixture-воркспейса с двумя книгами/диалогами
  (critic с 2 диалогами, один уже с сообщением; coauthor с 1 диалогом). Проверены сценарии из
  Step Card:
  1. `appendMessage("critic", …)` добавляет сообщение именно в ПОСЛЕДНИЙ (2-й) диалог critic, не
     создавая новый, не трогая 1-й диалог critic и не трогая coauthor.
  2. `createThread("critic")` добавляет 3-й пустой диалог в конец; `activeThreads.critic` после
     этого указывает именно на новый (последний) диалог, а `activeThreads.coauthor`
     (однодиалоговая роль) не изменился.
  3. `appendMessage("coauthor", …)` (однодиалоговая роль) добавляет сообщение в `threads[0]` —
     подтверждает эквивалентность "последний = единственный" для Co-author/Editor.
  4. Исходный fixture-объект не мутирован (immutable-паттерн подтверждён).

  Результат: `ALL CHECKS PASS` (9/9 проверок).

## Отклонения от Step Card

Нет. Реализация — дословно по коду, приведённому в Step Card, плюс обязательный экспорт из
`return` (не был явно расписан в Step Card, но подразумевался фразой "Экспортировать обе из
хука").

## Известное состояние (не в скоупе этого шага)

`npx tsc --noEmit` для всего проекта по-прежнему красный из-за Forbidden paths — ожидаемо и
явно предсказано Step Card ("здесь по-прежнему могут быть ошибки в Forbidden paths — UI ещё не
знает про новые функции"). UI, использующий `appendMessage`/`createThread`/`activeThreads`, —
Step 05, не этот шаг.

## Изменённый файл целиком

См. `apps/studio/src/workspace/useWorkspaceController.ts` в рабочем дереве (не приложен инлайн
здесь — файл), полный diff доступен через `git diff` до коммита.

## Stop Condition

Не закоммичено — жду `STATUS: OK` от Architect.
