id: Sprint-25-Step-03-ARP
name: "ARP: gear-настройки помощников (ADR-0013, заглушка single-user)"
type: arp

## Что сделано

Реализована имплементационная часть ADR-0013 (Accepted) — «gear»-иконка настройки на каждом из 4
режимов помощника (Соавтор/Редактор/Критик/Читатель), с одной новой Prisma-моделью на весь
инстанс (не per-Book, не per-User), append-семантикой промпт-suffix и полным отсутствием
UI-проверки прав (single-user-as-full-access, дословно по ADR-0013).

1. **`apps/studio/prisma/schema.prisma`** — новая модель `AssistantSettings` (`mode` —
   `@unique`, переиспользует уже существующий enum `AssistantRole`, `displayName String?`,
   `promptSuffix String?`, `typicalRequests String[] @default([])`, `updatedAt`). Одна строка на
   режим, максимум 4.
2. **`apps/studio/prisma/migrations/20260711091023_add_assistant_settings/`** — миграция
   `CreateTable "AssistantSettings"` + `CreateIndex` на `mode`. Сгенерирована и применена
   **только** против изолированной тестовой БД (см. раздел безопасности БД ниже) — против
   реальной `literary_studio` Product Owner не запускалась.
3. **`apps/studio/src/repositories/assistantSettingsRepository.ts`** (новый) — `getAssistantSettings(mode)`,
   `getAllAssistantSettings()`, `upsertAssistantSettings(mode, data)`. Тот же стиль, что
   `bookRepository.ts`/`userRepository.ts`: чистый Prisma-слой, никакого HTTP, никакой доменной
   связи. Отсутствие строки для режима — нормальное состояние (`null`), не ошибка.
4. **`apps/studio/src/repositories/index.ts`** — реэкспорт трёх функций + типа
   `AssistantSettingsRecord`, по тому же паттерну, что уже есть для `bookRepository`/`userRepository`.
5. **`apps/studio/src/app/api/assistant-settings/route.ts`** (новый) — тонкий REST-эндпоинт:
   `GET` возвращает карту всех 4 режимов (`null` для ещё не настроенных), `POST` принимает
   `{ mode, displayName, promptSuffix, typicalRequests }` и делает upsert. Намеренно **не** через
   AI Bus (`ai/aiBus.ts`/`ai/operations.ts` не тронуты вообще — это не AI-вызов, обычный CRUD).
   Без единой проверки прав — ровно требование ADR-0013.
6. **`apps/studio/src/app/api/critic/route.ts`, `reader/route.ts`, `line-editor/route.ts`
   (режим "editor"), `coauthor/route.ts`** — каждый читает свой `promptSuffix` через
   `getAssistantSettings(AssistantRole.<mode>)` и добавляет его **в конец** уже существующего
   системного промпта (после базового промпта + всех уже существующих суффиксов — subcategory у
   Critic, persona у Reader, structure/draft-развилка у Co-author) — ровно append, не replace, как
   того требует ADR-0013 (тот же паттерн, что `CRITIC_SUBCATEGORY_PROMPTS` поверх
   `CRITIC_BASE_PROMPT`, ADR-0009). Отказ БД при чтении настройки обёрнут в `try/catch` и тихо
   деградирует к «без кастомного suffix» (см. «Отклонения» — техническое решение, не в карточке
   буквально, но необходимое для обратной совместимости при недоступной БД).
7. **`apps/studio/src/components/AssistantPanel.tsx`**:
   - `GearButton` — маленькая шестерёнка `⚙`, оверлей в правом нижнem углу каждой из 4 квадратных
     иконок режима (не только у активного режима — буквально «на каждом режиме», как в Allowed
     paths карточки), `stopPropagation()`, чтобы клик не переключал режим.
   - `AssistantSettingsDialog` — модальное окно (тот же визуальный паттерн, что
     `NewBookDialog.tsx`): поле «Отображаемое имя», textarea «Дополнение к промпту», textarea
     «Типовые запросы» (по одному на строку). Сохранение через `POST /api/assistant-settings`.
   - `settingsMap`/`settingsDialogMode` — состояние компонента, загружается один раз через
     `useEffect` (`GET /api/assistant-settings`); ошибка запроса тихо деградирует к «все режимы
     без кастомизации» (тот же принцип graceful degradation, что на сервере).
   - `displayNameFor(mode)` — кастомное имя переопределяет `MODE_META[mode].label` везде, где имя
     показывается (иконка-кнопка `title`/`aria-label`, заголовок активного режима); при отсутствии
     кастомизации — ровно прежнее поведение.
   - Типовые запросы отрисованы как pill-кнопки над полем ввода (тот же UX-паттерн, что
     `CRITIC_SUBCATEGORIES`) — клик просто заполняет `input`, никакой новой AI Bus операции.
     Прокинуто и в общий чат, и в `ReaderPanel` (получил новый опциональный проп
     `typicalRequests?: string[]`, отсутствие — то же поведение, что раньше).

### Хранилище (соответствие ADR-0013)

Одна строка на `AssistantMode`, инстанс-wide — НЕ per Book, НЕ per User. `apps/studio/src/domain/**`
не тронут вообще (assistant-настройки сознательно не часть `Book`/`Workspace`).

### Ограничение реализации (соответствие ADR-0013)

Никакой UI-проверки прав нигде не добавлено — единственный текущий пользователь имеет полный
доступ к имени/промпту/типовым запросам всех 4 режимов напрямую. Никакая заглушечная система
прав/тарифов не строилась (буквальное требование карточки, не пересматривалось).

## Соответствие Scope

`git status --short` (полный, с пометкой принадлежности):

```
 M CLAUDE.md                                        — ПРЕДСУЩЕСТВУЮЩЕЕ, не моё
 M apps/studio/prisma/schema.prisma                 — МОЁ (Allowed)
 M apps/studio/src/app/api/coauthor/route.ts         — МОЁ (Allowed)
 M apps/studio/src/app/api/critic/route.ts           — МОЁ (Allowed)
 M apps/studio/src/app/api/line-editor/route.ts      — МОЁ (Allowed)
 M apps/studio/src/app/api/reader/route.ts           — МОЁ (Allowed)
 M apps/studio/src/components/AssistantPanel.tsx     — МОЁ (Allowed)
 M apps/studio/src/components/Header.tsx             — ПРЕДСУЩЕСТВУЮЩЕЕ, не моё
 M apps/studio/src/repositories/index.ts             — МОЁ (Allowed)
 M docs/project/CURRENT_SPRINT.md                    — ПРЕДСУЩЕСТВУЮЩЕЕ, не моё
 M docs/project/ROADMAP_18-27.md                     — ПРЕДСУЩЕСТВУЮЩЕЕ, не моё
 M docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md       — ПРЕДСУЩЕСТВУЮЩЕЕ, не моё
?? .claude/agents/docs-writer.md                     — ПРЕДСУЩЕСТВУЮЩЕЕ, не моё
?? .claude/agents/tester.md                          — ПРЕДСУЩЕСТВУЮЩЕЕ, не моё
?? .claude/agents/ui-specialist.md                   — ПРЕДСУЩЕСТВУЮЩЕЕ, не моё
?? .claude/settings.json                             — ПРЕДСУЩЕСТВУЮЩЕЕ, не моё
?? .claude/skills/literary-studio-ui-specialist/     — ПРЕДСУЩЕСТВУЮЩЕЕ, не моё
?? apps/studio/prisma/migrations/20260711091023_add_assistant_settings/ — МОЁ (Allowed, "миграция")
?? apps/studio/src/app/api/assistant-settings/       — МОЁ (Allowed)
?? apps/studio/src/repositories/assistantSettingsRepository.ts — МОЁ (Allowed)
?? docs/adr/ADR-0013-assistant-settings.md            — ПРЕДСУЩЕСТВУЮЩЕЕ (уже был Accepted до начала шага), не моё
?? docs/task-bus/queue/active/Sprint-25-Step-03.md    — перенос pending/ → active/ перед началом (по правилам)
?? docs/task-bus/queue/pending/Sprint-25-Step-05.md   — ПРЕДСУЩЕСТВУЮЩЕЕ, не моё
```

Все файлы, которые я реально создал/изменил, попадают в Allowed paths карточки. Все остальные
записи (`CLAUDE.md`, `Header.tsx`, `CURRENT_SPRINT.md`, `ROADMAP_18-27.md`,
`BOOK_LEVEL_ASSISTANTS_VISION.md`, `.claude/agents/*`, `.claude/settings.json`,
`.claude/skills/literary-studio-ui-specialist/`, `ADR-0013-assistant-settings.md`,
`Sprint-25-Step-05.md`) были уже в рабочем дереве **до** начала этого шага (проверено самым первым
`git status --short` в этой сессии, до единой правки) — не создавались и не редактировались мной,
судя по всему принадлежат параллельной/предыдущей работе. Не трогал их.

Forbidden paths карточки (`apps/studio/src/domain/**`, любая система прав/тарифов, рендер-ветки
самого чата Co-author/Editor/Critic/Reader) — не тронуты: логика отправки сообщений в
`AssistantPanel.tsx` не менялась, только добавлены gear-иконка/диалог/typical-request pill-кнопки.
`ai/operations.ts`/`ai/aiBus.ts` не тронуты — новая операция не потребовалась (обычный REST, как и
предпочла карточка).

## Validation

Все команды из `apps/studio/`:

- **`npx tsc --noEmit`** — чисто (exit code 0).
- **`npx eslint src`** — чисто (exit code 0).
- **`npx prettier --check "src/**/*.{ts,tsx}"`** — единственные warn — `src/app/api/test-connection/route.ts`
  и `src/storage/workspaceStorage.ts`, оба не тронуты мной (не в Allowed paths, предсуществующее
  форматирование). Все файлы, которые я менял, отдельно проверены —
  `All matched files use Prettier code style!`.
- **`npm run build`** — зелёный:
  ```
  ✓ Compiled successfully in 2.1s
    Finished TypeScript in 3.4s ...
  ✓ Generating static pages using 13 workers (12/12) in 657ms
  ```
  `/api/assistant-settings` присутствует в итоговой таблице роутов рядом с остальными.

### Безопасность БД (по прямому требованию координатора, инцидент Sprint-25-Step-01)

- Реальный `DATABASE_URL` (`apps/studio/.env`) указывает на `literary_studio` Product Owner —
  **не редактировался, не запускался против него ни один Prisma-command и ни один scratch-сервер**.
- Создана отдельная изолированная БД `literary_studio_step25_03_test` на том же локальном Postgres
  (`127.0.0.1:5432`, тот же паттерн, что у Sprint-25-Step-02) — миграция `npx prisma migrate dev`
  запущена с явным `DATABASE_URL`, указывающим только на неё.
- Живая проверка (Shape 1): `npx next start -p 3417` со scratch-портом, запущен с явным
  переопределением `DATABASE_URL` на ту же изолированную тестовую БД (переменная окружения
  процесса — `.env`/`.env.local` не редактировались).
- **После проверки:** тестовая БД `literary_studio_step25_03_test` удалена (`DROP DATABASE`).
  Реальная `literary_studio` проверена до и после — таблицы `AssistantSettings` в ней нет
  (`false`), количество строк `Book` не изменилось (4, как и было) — реальные данные Product
  Owner не были прочитаны и не были записаны ни разу за весь шаг.
- Scratch-сервер на порту 3417 остановлен (`taskkill` по PID, привязанному к порту), порт
  свободен (`curl` таймаутится, `netstat` не показывает `LISTENING`).

### Сценарий 1 — реальный HTTP + реальный Claude (`verify-step25-03.mjs`, scratchpad, не в репозитории)

```
PASS: 1. GET /api/assistant-settings starts empty for critic and reader
PASS: 2. POST /api/assistant-settings saves Critic's custom name/prompt/typical requests
PASS: 3. Custom displayName for Critic is readable back via GET (drives UI override)
PASS: 4a. /api/critic still returns ok:true + reviews[] array with custom suffix active
PASS: 4b. Real Claude response genuinely contains the custom promptSuffix's canary marker
PASS: 4c. Every review entry still has category/severity/comment (structured contract intact)
PASS: 5a. promptSuffix cleared via POST
PASS: 5b. With promptSuffix cleared, canary marker is genuinely absent
PASS: 6a. Reader still has no settings row (untouched by this step's exercise)
PASS: 6b. /api/reader (uncustomized mode) still returns plain prose, unchanged shape — regression
```

Кастомный `promptSuffix` требовал от Critic начать JSON-массив с фиксированной canary-записи
(`"comment": "CANARY-STEP25-03"`). Реальный ответ Claude **с** активным suffix:
```json
[
  { "category": "General", "severity": "low", "comment": "CANARY-STEP25-03" },
  { "category": "Plot", "severity": "medium", "comment": "Отрывок обрывается на ожидании без развития конфликта..." }
]
```
После обнуления `promptSuffix` (`POST` с `promptSuffix: null`) — реальный ответ **без** маркера,
структура `reviews[]` (category/severity/comment) осталась той же формы в обоих случаях. Это
доказывает: (а) кастомный промпт реально влияет на поведение модели, не просто "запрос ушёл", (б)
append не ломает machine-readable контракт Critic, (в) эффект вызван именно suffix, не случайностью
(маркер пропадает при его очистке). Reader (не кастомизирован в этом прогоне) вернул обычную прозу
("Знаете, с первых же строк меня зацепило это открытое настежь окно...") — без изменений формы
ответа, регрессии нет.

### Сценарий 2 — реальный браузер (Playwright, `channel: "chrome"`, системный Chrome — по
образцу `apps/studio/AGENTS.md`), тот же scratch-сервер/тестовая БД

```
PASS: 1. Exactly 4 gear buttons rendered (found 4)
PASS: 2. Settings dialog opens for Critic
PASS: 4a. Mode icon button now exposes the custom displayName as its aria-label/title
PASS: 4b. Header line for the selected mode shows the custom displayName
PASS: 5. Typical-request pill button fills the chat input (got: "Проверь диалоги")
```

Создана книга через реальный UI (в изолированной тестовой БД), открыт gear-диалог Критика,
сохранено кастомное имя «UI-Тест Критик» + promptSuffix + два типовых запроса — кастомное имя
реально заменило «Критик» и на иконке-кнопке (aria-label/title), и в заголовке активного режима;
клик по pill-кнопке типового запроса реально заполнил `<textarea>` чата.

## Отклонения от Step Card

1. **`try/catch` вокруг чтения `promptSuffix` в каждом из 4 Expert route.ts** — не указано в
   карточке буквально, но необходимо технически: без этого недоступность БД превратила бы простое
   отсутствие кастомизации в полный отказ (500) всех 4 AI-Expert'ов, что явно противоречит правилу
   карточки «отсутствие promptSuffix... должно давать РОВНО текущее поведение» — недоступность БД
   тоже должна деградировать к «текущему поведению», не к поломке.
2. **Типовые запросы в диалоге настроек — одна textarea (по строке на запрос)**, а не список с
   отдельными полями добавления/удаления — технический выбор простоты (Step Card говорит только
   «набор типовых запросов», не диктует форму ввода); функционально эквивалентно.
3. **Gear-иконка — маленькая оверлей-шестерёнка `⚙` в углу каждой из 4 квадратных иконок режима**
   (не отдельная видимая кнопка рядом) — технический выбор, продиктованный компактным размером
   существующих 40×40 квадратных кнопок режима (Sprint-25-Step-02); буквально удовлетворяет
   «gear-иконку на каждом режиме» из Allowed paths.
4. Предсуществующее незакоммиченное состояние рабочего дерева (см. раздел Scope выше) — не моё,
   не трогал.

## Stop Condition

Не закоммичено. Жду подтверждения Product Owner (`STATUS: OK`).
