id: Sprint-13-Step-05-ARP
name: "ARP: реальный чат-механизм + консолидация переключателя помощников"
type: arp

## Что сделано

- **`AssistantPanel.tsx`** — полностью переписан. Была декоративная, никуда не подключённая
  карточка-заглушка (`onClick` отсутствовал); стала единственной функциональной AI-поверхностью:
  4 карточки-переключателя (`selectAssistantMode`), настоящая история чата на роль
  (`activeThreads[mode].messages`), поле ввода + кнопка "Спросить", "Начать заново" для
  Critic/Reader (`createThread`), кнопка "Вставить в сцену" на каждом ответе-ревизии
  Co-author/Editor. Responsive: `lg:` breakpoint (карточки+чат справа на `lg+`, снизу — уже
  строка ниже `lg`, максимум `max-h-96` с внутренним скроллом).
- **`EditorArea.tsx`** — `SceneImprove`, `MODE_INFO` (вместе со всем perception layer — фейковая
  фаза сцены, "consistency", явная ложь "памяти нет"), `ReviewItem`/`SEVERITY_BADGE` удалены
  целиком (по согласованному с Product Owner решению). Компонент вернулся к чистому
  редактированию сцены — заголовок, textarea, счётчик слов. `textareaRef` теперь входящий
  проп, не собственный `useRef`.
- **`page.tsx`** — `textareaRef` поднят сюда (нужен `AssistantPanel` как соседу, не потомку,
  для Critic/Reader-выделения), добавлена `getSelectedText()`, задеструктурированы
  `selectedScene`/`selectedChapter`/`workspace`/`selectAssistantMode`/`appendMessage`/
  `createThread`/`activeThreads` (уже существовали в контроллере, просто не читались отсюда —
  сам контроллер не тронут). Внешний layout сменён с постоянно горизонтального
  `flex flex-1 overflow-hidden` на `flex flex-1 flex-col overflow-hidden lg:flex-row`, чтобы
  `AssistantPanel` естественно уходил вниз на узких экранах.
- **`LineEditorPanel.tsx`** — payload `{ text: input }` → `{ sceneText: input, messages: [] }`.
- **`NewBookDialog.tsx`** — `Omit<Book,...>` в типе `onCreate` дополнен `"assistantThreads"`,
  синхронизирован с сигнатурой `createBook` в контроллере (была рассинхронизирована с Step 01).

## Принятые самостоятельно решения (сессия без отдельного Architect)

Все зафиксированы и обоснованы в самой Step Card (`Sprint-13-Step-05.md`, раздел "Принятые
решения") до начала реализации — включая согласованное с Product Owner отдельным вопросом
удаление perception layer. Кратко: канонический lowercase-тип режима вместо старых
capitalized UI-лейблов; `sceneText` для Editor/Co-author (вся сцена), `getSelectedText()` для
Critic/Reader (выделение или вся сцена, как было); пустое поле ввода не создаёт пустое
user-сообщение (сохраняет сегодняшний zero-typing UX); Critic-ответы парсятся в reviews при
рендере (`try/catch`, персистентные данные требуют защиты, которой не было у одноразового кода).

## Соответствие Scope

Изменены ровно 5 файлов из Allowed paths (`git status --short` подтверждает). `domain/`,
`storage/`, `ai/`, `app/api/`, `useWorkspaceController.ts` не тронуты.

## Validation

- **`npx tsc --noEmit`** — 0 ошибок (был 1 незапланированный проход: `outgoingMessages` изначально
  выводился как `readonly ChatMessage[]` из-за ветки тернарника без spread — исправлено явной
  типизацией + `[...messages]` в обеих ветках).
- **`npx eslint`** (5 файлов) — 0 ошибок, 0 предупреждений.
- **`npx prettier --check`** — чисто (после `--write`, автоформатирование новых блоков
  `AssistantPanel.tsx`).
- **`npm run build`** — успешно, все 5 API-роутов и `/` собраны штатно.
- **Живая проверка, часть 1 (pure-logic, без сети)** — `scratchpad/verify-step05-logic.mjs`,
  тела функций скопированы дословно из компонента: построение `outgoingMessages` (пустой ввод
  не мутирует и не аффектит историю; непустой — добавляет ровно одно сообщение в конец),
  `canSend` (Co-author разрешён с пустым текстом, остальные — нет), `parseReviews` (валидный
  JSON-массив, невалидный JSON, JSON-не-массив, обычная проза — 4 сценария). 13/13 PASS.
- **Живая проверка, часть 2 (реальный сервер)** — `npx next start` на порту 3417,
  `scratchpad/verify-step05-live.mjs` бьёт по тем же трём реальным роутам (`/api/coauthor`,
  `/api/line-editor`, `/api/critic`) ровно с той формой payload, которую теперь строит
  `AssistantPanel.tsx` (`sceneText`+`bookContext`+`messages`), включая реальный вызов Claude:
  Co-author с пустым `sceneText` и инструкцией в `messages` → 200, черновик реально отражает
  вокзал/туман из инструкции; Editor с непустым `sceneText` и пустым `messages` (сценарий
  "просто нажал Спросить") → 200; Critic с пустым `sceneText` → 400 (сервер отклоняет ровно то,
  что клиентский `canSend()` уже блокирует — client/server согласованы). 6/6 PASS. Сервер
  остановлен после проверки.

## Известные ограничения (не в скоупе, честно зафиксировано)

- Нет браузерной автоматизации в этой среде (постоянное, задокументированное ограничение) —
  визуальная проверка responsive-раскладки (`lg:` breakpoint) не выполнена кликом/ресайзом,
  только по коду (тот же CSS-паттерн, что уже используется и работает для Critic-панели с
  Sprint-08-Step-04).
- Полный редизайн "единого вида книги" (раздел 2 vision-документа) — отдельная, не
  спроектированная эпика, сознательно не в этом шаге (см. Forbidden paths карточки).
- `Sidebar.tsx` не стал responsive — известное, не новое ограничение.

## Изменённые файлы

`apps/studio/src/components/AssistantPanel.tsx`,
`apps/studio/src/components/EditorArea.tsx`, `apps/studio/src/app/page.tsx`,
`apps/studio/src/components/LineEditorPanel.tsx`,
`apps/studio/src/components/NewBookDialog.tsx` — полный diff через `git diff` до коммита.

## Stop Condition

Не закоммичено. Работаем без отдельной сессии Architect — жду подтверждения Product Owner.
