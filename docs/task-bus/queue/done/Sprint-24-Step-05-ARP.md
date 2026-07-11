id: Sprint-24-Step-05-ARP
name: "ARP: workspaceStorage.ts — dual-mode (БД первична, localStorage — fallback и бэкап) + разовый перенос существующих данных"
type: arp

## Что сделано

Изменён `apps/studio/src/storage/workspaceStorage.ts` (единственный Allowed path карточки).
`loadWorkspace()`/`saveWorkspace()` стали асинхронными (`Promise`), внутренняя логика — по
ADR-0012 (Decision 2, 5, 6):

- **`readLocalWorkspace()`** — переименованная без изменений внутренняя копия старого тела
  `loadWorkspace()` (тот же `try/catch`, тот же `migrateIfNeeded`). Единственный источник
  эфемерных полей (`activeBookId`/`selectedChapterId`/`selectedSceneId`/`selectedCharacterId`/
  `selectedAssistantMode`) и фолбэк-источник `books`.
- **`fetchBooksFromApi()`** — `GET /api/workspace`; возвращает `books` (в т.ч. пустой массив —
  это отдельный от "недоступно" исход) или `null` при любой неудаче (сеть, не-2xx,
  `ok:false`/битое тело). Никогда не бросает исключение наружу.
- **`pushBooksToApi(books)`** — `PUT /api/workspace` c `{ books }`; возвращает `boolean`, тоже
  никогда не бросает исключение.
- **`loadWorkspace()`**: сначала `readLocalWorkspace()`, затем `fetchBooksFromApi()`.
  `null` → отдать localStorage-результат целиком (фолбэк, как до Sprint 24). Непустой массив
  → `books` из БД (через `normalizeBook` на каждую), эфемерные поля — из localStorage. Пустой
  массив и непустые `localWorkspace.books` → разовый перенос: `pushBooksToApi(localWorkspace.books)`
  (результат переноса не влияет на то, что возвращается — `localWorkspace` уже нормализован и
  корректен независимо от исхода PUT).
- **`saveWorkspace(workspace)`**: первая строка функции, до какого-либо `await`, —
  `window.localStorage.setItem(...)` (буквально то же самое, что было раньше) — гарантированно
  выполняется синхронно в момент вызова, даже если вызывающий код не сделает `await` (что и
  происходит сегодня в `useWorkspaceController.ts` до Step 06). Затем best-effort
  `await pushBooksToApi(workspace.books)`, результат не прокидывается наружу и не бросает
  исключение.

`migrateIfNeeded`/`normalizeBook`/`normalizeAssistantThreads`/`emptyThread`/`EMPTY_WORKSPACE` —
не изменены по существу (Rules запрещают), только продолжают применяться внутри новой логики.

## Соответствие Scope

Allowed paths — только `apps/studio/src/storage/workspaceStorage.ts`; `git status --short`
после завершения работы:

```
 M apps/studio/src/storage/workspaceStorage.ts
 D docs/task-bus/queue/pending/Sprint-24-Step-04.md
 D docs/task-bus/queue/pending/Sprint-24-Step-05.md
?? docs/task-bus/queue/active/Sprint-24-Step-05.md
```

Строка `D docs/task-bus/queue/pending/Sprint-24-Step-04.md` — не моя правка: это уже было в
рабочем дереве до начала этой сессии (файл Step-04 физически перемещён в `done/` в предыдущей
сессии, но перемещение никогда не коммитилось — тот же класс ситуации, что HANDOVER.md описывает
про Sprint 20-23). Не трогал этот файл ни в какую сторону — вне Allowed/Forbidden paths этой
карточки, не моё дело исправлять. `D pending/Sprint-24-Step-05.md` + `?? active/Sprint-24-Step-05.md`
— мой перенос карточки в `active/` перед началом работы, как требует процесс. Ни
`apps/studio/src/workspace/useWorkspaceController.ts` (Forbidden — это Sprint-24-Step-06), ни
`apps/studio/src/repositories/**`, ни `apps/studio/src/app/api/**`, ни какой-либо UI-код не
тронуты.

## Validation

Все команды — из `apps/studio/`.

- **`npx tsc --noEmit`** (весь проект) — ровно одна ошибка, **ожидаемая и явно предсказанная
  Step Card**:
  ```
  src/workspace/useWorkspaceController.ts(56,18): error TS2345: Argument of type
  'Promise<Workspace>' is not assignable to parameter of type 'SetStateAction<Workspace>'.
  ```
  Это строка `setWorkspace(loadWorkspace())` — вызывающий код `useWorkspaceController.ts`
  (Forbidden path, чинится Sprint-24-Step-06, не раньше) не обновлён под новую асинхронную
  сигнатуру. Второй вызов (`saveWorkspace(workspace)`, строка 65, без `await`) ошибки не даёт —
  TypeScript не ругается на вызов функции, возвращающей `Promise<void>`, без `await`, когда
  результат просто отбрасывается. Сам `workspaceStorage.ts` — без единой ошибки.
- **`npm run lint`** (`eslint`, весь проект, включая изменённый файл) — чисто, без вывода.
- **`npx prettier --check src/storage/workspaceStorage.ts`** — `All matched files use Prettier
  code style!`, без правок.
- **`npm run build`** — падает, как и предсказано картой, на той же строке
  `useWorkspaceController.ts:56:18` ("Failed to type check"). Это конфликт версий контрактов
  между Step 05 (этот шаг, меняет сигнатуру) и Step 06 (следующий шаг, ещё не выполнен, должен
  обновить единственный вызывающий код) — тот же приём промежуточного состояния, что уже
  использовался в Sprint-11/13 согласно Rules этой карточки. Не исправлял — `useWorkspaceController.ts`
  вне Allowed paths.

### Живая проверка — выбор техники и обоснование

Использована техника, отличная от буквального Shape 1 skill'а `literary-studio-live-verify`, по
двум связанным причинам, обе зафиксированы здесь как технические решения, а не отклонения от
Step Card:

1. **`npm run build` в реальном репозитории недоступен** (см. выше — ожидаемое падение на
   `useWorkspaceController.ts`), значит обычный сценарий "`next build && next start` на
   scratch-порту" из `literary-studio-run` не даёт рабочего продакшн-сервера в реальном
   рабочем дереве прямо сейчас — это прямое следствие самого Step Card, не проблема реализации.
2. **БД в проекте по ADR-0012 Decision 1 — один дефолтный пользователь на всё приложение,
   без какой-либо изоляции между "моим тестовым сервером" и сервером Product Owner на
   `localhost:3000`** — они указывают на одну и ту же таблицу `Book` в одной и той же базе
   `literary_studio`. Простой запуск ещё одного сервера на scratch-порту (как в
   Sprint-24-Step-04) даёт изоляцию процессов, но не изоляцию данных: любой мой `PUT
   /api/workspace` в рамках проверки сценариев 1-3 (перенос книги, книга из БД и т.д.) писал бы
   в ту же самую таблицу, где рано или поздно окажутся реальные книги Product Owner (уже сейчас
   `literary_studio` пуста по `Book`, но его открытая вкладка на 3000 использует этот же файл
   через Turbopack hot-reload и синхронно, без `await`, вызывает `saveWorkspace()` — первая
   строка которой немедленно пишет в его реальный localStorage, а затем best-effort
   `pushBooksToApi()` фонового `await` реально уходит в `literary_studio`, независимо от того,
   ждёт ли вызывающий код промис). Тестовые данные вроде `step05-scn2-DB`/`step05-scn1-book`,
   записанные в ту же таблицу, что и его реальные книги, создавали бы риск гонки/перезаписи его
   данных моим тестовым PUT (последняя запись побеждает, ADR-0012 Decision 5) — недопустимо.

**Решение:** полная изоляция через отдельную БД, а не просто отдельный порт.

- Создана вторая логическая база в том же контейнере Postgres — `literary_studio_test`
  (`CREATE DATABASE literary_studio_test;`), схема применена той же миграцией Prisma
  (`prisma migrate deploy`, `20260710202615_init`) — та же схема, та же СУБД, тот же контейнер,
  просто отдельные данные.
- Собран и запущен полностью отдельный экземпляр приложения во временной директории
  `e:\_ls-scratch-test-copy` (не внутри репозитория — `git status` репозитория её не видит),
  указывающий через собственный `.env` на `literary_studio_test`. Единственная правка внутри
  этой одноразовой копии (никогда не применённая к реальному репозиторию) — тот же
  однострочный `await`-фикс в копии `useWorkspaceController.ts`, необходимый исключительно
  чтобы копия вообще собралась (`next build` требует полного тайпчека всего проекта, не только
  изменённого файла); реальный `apps/studio/src/workspace/useWorkspaceController.ts` в
  репозитории не тронут — подтверждено `git status --short` (см. выше) и повторным `git diff`
  после уборки.
- `node_modules` подключён через Windows junction (`mklink /J`), сама копия собрана и запущена
  как обычный продакшн-сервер (`next build && next start -p 3418`) — то есть реальный HTTP,
  реальный Next.js, реальный Prisma, реальный Postgres, только на изолированных данных; это не
  мок сети и не мок ответа — единственное отличие от "чистого" Shape 1 в том, что тестовая база
  отдельная от продакшн-базы, о чём Step Card прямо не говорит, но что необходимо при
  единственном общем пользователе (ADR-0012 Decision 1) для защиты данных Product Owner.
- Для самих трёх сценариев использована техника, ближе к Shape 2 skill'а: код `loadWorkspace()`/
  `saveWorkspace()`/их внутренних хелперов скопирован **дословно** (не переписан) в
  Node-скрипт (`verify-workspace-storage.mjs`, scratchpad, не в репозитории), с двумя
  минимально необходимыми окружательными шимами (оба явно не являются моком сети/ответа):
  `window.localStorage` — in-memory реализация интерфейса `Storage` (в Node нет `window`);
  и обёртка `fetch`, резолвящая относительный путь `"/api/workspace"` (тот же паттерн, что уже
  используется в `apps/studio/src/ai/aiBus.ts` — `fetch("/api/line-editor")` и т.д.) в
  `http://127.0.0.1:3418/api/workspace` — браузер это делает автоматически через `location`,
  Node не имеет такого понятия, поэтому только базовый URL подставляется, сам HTTP-запрос уходит
  по-настоящему на реальный сервер.

### Сценарий 1 — БД пуста, localStorage содержит книгу

Перед проверкой подтверждено `SELECT COUNT(*) FROM "Book"` на `literary_studio_test` = 0.

```
=== Сценарий 1: БД пуста, localStorage содержит книгу ===
loadWorkspace() #1 -> {"bookIds":["step05-scn1-book"],"activeBookId":"step05-scn1-book","selectedChapterId":"some-chapter-id"}
PASS: первый loadWorkspace() вернул книгу из localStorage (миграция)
PASS: эфемерное поле selectedChapterId сохранилось из localStorage
loadWorkspace() #2 -> {"bookIds":["step05-scn1-book"]}
PASS: повторный loadWorkspace() вернул ровно одну книгу (не дублирует)

--- Итог: PASS=3 FAIL=0 ---
```

Прямая проверка через `psql` после обоих вызовов — ровно одна строка, без дублей:

```
$ docker compose exec -T postgres psql -U literary -d literary_studio_test -c 'SELECT id, title FROM "Book";'
        id        |   title
------------------+------------
 step05-scn1-book | Сценарий 1
(1 row)
```

### Сценарий 2 — БД содержит книгу, отличную от localStorage

БД предварительно заполнена прямым `PUT` книгой `step05-scn2-DB` ("Из БД"); localStorage-мок
содержит другую книгу, `step05-scn2-LOCAL` ("Из localStorage"):

```
=== Сценарий 2: БД содержит книгу, отличную от localStorage ===
PASS: прямой PUT для заполнения БД книгой 'Из БД' успешен
loadWorkspace() -> {"bookIds":["step05-scn2-DB"]}
PASS: результат — книга из БД ('step05-scn2-DB'), не из localStorage
PASS: содержимое книги (title) реально пришло из БД, не подделка статус-кода

--- Итог: PASS=3 FAIL=0 ---
```

```
$ docker compose exec -T postgres psql -U literary -d literary_studio_test -c 'SELECT id, title FROM "Book";'
       id       | title
----------------+-------
 step05-scn2-DB | Из БД
(1 row)
```

Проверено содержимое (`title`), не только код ответа/id — реальный `book.title`, пришедший из
БД, а не эхо входных тестовых данных localStorage.

### Сценарий 3 — недоступность БД, затем восстановление

`docker compose stop postgres` (контейнер полностью остановлен — `docker compose ps postgres`
после стопа не показывает ни одной строки):

```
$ curl -s -w "\nHTTP_STATUS=%{http_code}\n" http://127.0.0.1:3418/api/workspace
{"ok":false,"error":"\nInvalid `prisma.user.findFirst()` invocation:\n\n\nCan't reach database server at 127.0.0.1:5432"}
HTTP_STATUS=500
```

Реальная, не сфабрикованная ошибка Prisma — именно тот 5xx-сигнал, на который рассчитан
`fetchBooksFromApi()`/`pushBooksToApi()`. Скрипт:

```
PASS: loadWorkspace() не бросил исключение при недоступной БД
PASS: loadWorkspace() вернул данные из localStorage-фолбэка
PASS: saveWorkspace() не бросил исключение при недоступной БД
PASS: saveWorkspace() всё равно обновил localStorage несмотря на недоступность БД

--- Итог: PASS=4 FAIL=0 ---
```

Восстановление: `docker compose start postgres`, дождался `Up ... (healthy)`
(`docker compose ps postgres`, health-check прошёл с первой попытки опроса). После этого:

```
PASS: после восстановления БД saveWorkspace() успешно долетел до БД (подтверждено повторным GET)

--- Итог: PASS=1 FAIL=0 ---
```

(Здесь вызывается настоящий `saveWorkspace()`, не внутренний хелпер напрямую — соответствие
формулировке Step Card "следующий saveWorkspace() успешно долетает до БД"; успех подтверждён
не только возвращаемым `boolean`, а повторным независимым `GET`.)

```
$ docker compose exec -T postgres psql -U literary -d literary_studio_test -c 'SELECT id, title FROM "Book";'
          id           |          title
-----------------------+-------------------------
 step05-scn3-recovered | После восстановления БД
(1 row)
```

### Постусловия и уборка

- **Postgres в рабочем состоянии:** `docker compose ps postgres` после всей проверки —
  `Up ... (healthy)`, порт `5432` слушает.
- **Реальная БД `literary_studio` не тронута:** `SELECT COUNT(*) FROM "Book"` = 0 (столько же,
  сколько до начала проверки), `SELECT COUNT(*) FROM "User"` = 1 (тот же дефолтный
  пользователь) — все тестовые операции ушли исключительно в изолированную
  `literary_studio_test`, которая по завершении удалена (`DROP DATABASE literary_studio_test;`).
- **`localhost:3000` (вкладка Product Owner) не останавливался и не перезапускался** — проверено
  `curl` до, во время (включая момент остановки Postgres) и после всей проверки: неизменно
  `200`. Как и предупреждено в задании, его вкладка в это время могла визуально сломаться
  из-за смены сигнатуры `loadWorkspace()`/`saveWorkspace()` на асинхронную (сам процесс сервера
  и порт при этом не трогались) — это ожидаемо и согласовано, чинится Sprint-24-Step-06.
- Scratch-сервер на порту 3418 остановлен (`taskkill` по PID, привязанному к порту), порт
  свободен (проверено `netstat`).
- Временная директория `e:\_ls-scratch-test-copy` удалена целиком **после** отдельного,
  осторожного удаления Windows junction на `node_modules` обычным `rmdir` (без `/S`) —
  специально в такой последовательности, чтобы гарантированно не задеть реальный
  `apps/studio/node_modules` (junction только "прокалывает" в него — рекурсивное удаление через
  junction снесло бы реальные файлы; после удаления junction'а содержимое `apps/studio/node_modules`
  подтверждено (369 записей, как до начала работы)). Сопутствующий одноразовый junction/копия в
  scratchpad-директории тоже удалены той же безопасной последовательностью.

## Отклонения от Step Card

Технических отклонений от буквы контракта (сигнатуры, поведение обеих функций) нет. Одно
осознанное методологическое расширение техники живой проверки относительно skill'а
`literary-studio-live-verify`, зафиксированное здесь, а не молча:

1. **Изолированная тестовая база данных вместо прямого использования `literary_studio`.**
   Skill описывает "scratch-порт сервера" как достаточную изоляцию, но не учитывает
   специфику ADR-0012 Decision 1 (один дефолтный пользователь на всё приложение, без
   мульти-тенантности) — при единственном общем пользователе изоляция процессов (порт) не
   даёт изоляции данных (таблица `Book` одна на всех). Учитывая, что у Product Owner в это
   время была открыта реальная сессия с реальными (пусть пока и не мигрированными в БД)
   данными, посчитал прямую запись тестовых книг в `literary_studio` неприемлемым риском и
   создал отдельную БД в том же контейнере Postgres специально для этой проверки, удалённую
   по завершении. Это техническое, не продуктовое решение — не меняет ничего в реализации
   самого `workspaceStorage.ts`, только в том, как я его проверял.
2. **Не удалось использовать `npm run dev`/`npm run build && npx next start` в самом
   репозитории напрямую** — второй `next dev` в той же директории блокируется самим Next.js
   ("Another next dev server is already running", с PID сервера Product Owner), а
   `next build` ожидаемо падает на Forbidden-path файле. Обошёл через одноразовую копию
   приложения во временной директории вне репозитория (см. Validation выше) — сама
   проверяемая логика (`loadWorkspace`/`saveWorkspace`/их хелперы) при этом использована
   дословно из реального отредактированного файла, а не из копии.

## Stop Condition

Не закоммичено. Жду подтверждения Product Owner (`STATUS: OK`) — Step Card прямо требует не
коммитить без него; по словам Product Owner, подтверждение будет объединённым вместе со
Sprint-24-Step-06.
