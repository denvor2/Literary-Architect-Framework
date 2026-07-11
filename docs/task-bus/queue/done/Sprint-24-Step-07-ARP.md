id: Sprint-24-Step-07-ARP
name: "ARP: workspaceStorage.ts — устранение потери несинхронизированных правок при восстановлении БД"
type: arp

## Что сделано

Изменён `apps/studio/src/storage/workspaceStorage.ts` (единственный Allowed path карточки).
Добавлен новый bookkeeping-механизм и переработана логика `loadWorkspace()`, без изменения
публичных async-сигнатур `loadWorkspace()`/`saveWorkspace()`:

1. **Флаг "локальные книги не подтверждены как синхронизированные"** — отдельный
   localStorage-ключ `literary-studio-db-sync-pending` (константа `SYNC_PENDING_KEY`),
   читаемый/пишемый только этим файлом через две новые внутренние функции
   `readSyncPendingFlag()`/`writeSyncPendingFlag()`. Никакого нового поля в
   `domain/model.ts`/`domain/workspace.ts` не добавлено — это чисто storage-слойный
   bookkeeping, как и требует карточка.
   - `saveWorkspace()`: флаг выставляется (`writeSyncPendingFlag(true)`) **до** первой попытки
     `pushBooksToApi()` (пессимистично — на случай падения вкладки посреди `fetch`), снимается
     только при подтверждённом успехе push.
   - Та же пара (выставить перед push / снять при успехе) применена и к push внутри
     `loadWorkspace()` — как в ветке миграции (БД пуста), так и в новой ветке реконсиляции
     (см. п.2).

2. **Исправлена `loadWorkspace()`:** при непустом результате БД —
   - если флаг НЕ выставлен → БД выигрывает, как и было (не регресс для второй
     вкладки/устройства, которое могло записать более новые данные).
   - если флаг ВЫСТАВЛЕН → побеждают ЛОКАЛЬНЫЕ `books`; сразу же выполняется одна попытка
     push (реконсиляция) в БД; при успехе флаг снимается и выставляется
     `syncWarning = "recovered-local-wins"`. При неудаче реконсиляции исключение не бросается
     (тот же best-effort принцип) — флаг остаётся выставленным для следующей попытки. Никакой
     очереди повторов/поллинга не добавлено (осознанно, по Rules карточки и ADR-0012 Known
     Gaps).

3. **Экспортирован сигнал статуса синхронизации:**
   ```ts
   export type SyncWarning = "db-unavailable" | "recovered-local-wins";
   export function getSyncWarning(): SyncWarning | null
   ```
   `syncWarning` — module-level переменная (явно разрешённая форма по Rules карточки), не
   персистится в localStorage (сигнал про текущую вкладку/сессию, не про переживание
   перезагрузки). `"db-unavailable"` — level-сигнал: выставляется при неудаче
   `fetchBooksFromApi()`/`pushBooksToApi()` (обе функции доработаны, чтобы отражать исход
   каждого своего вызова — по ADR-0012 Decision 5, "на каждый вызов, не только при старте
   сессии"), автоматически снимается следующим успешным вызовом любой из них.
   `"recovered-local-wins"` — одноразовое сообщение: `getSyncWarning()` сбрасывает его в `null`
   сразу после первого чтения (потребление), что и требует Objective 3 карточки ("не
   постоянный статус"). `useWorkspaceController.ts` этот сигнал не читает — по Forbidden paths
   карточки, это задел для Sprint-24-Step-08.

## Соответствие Scope

Allowed paths — только `apps/studio/src/storage/workspaceStorage.ts`. Итоговый `git status
--short`:

```
 M apps/studio/src/storage/workspaceStorage.ts
 M apps/studio/src/workspace/useWorkspaceController.ts
R  docs/task-bus/queue/pending/Sprint-24-Step-06.md -> docs/task-bus/queue/active/Sprint-24-Step-06.md
 D docs/task-bus/queue/pending/Sprint-24-Step-04.md
 D docs/task-bus/queue/pending/Sprint-24-Step-05.md
?? docs/task-bus/queue/active/Sprint-24-Step-05-ARP.md
?? docs/task-bus/queue/active/Sprint-24-Step-05.md
?? docs/task-bus/queue/active/Sprint-24-Step-06-ARP.md
?? docs/task-bus/queue/active/Sprint-24-Step-07.md
?? docs/task-bus/queue/pending/Sprint-24-Step-08.md
```

`M .../useWorkspaceController.ts` — унаследовано от Step 06 (Forbidden path этой карточки, не
тронут ни разу за эту сессию). `D pending/Step-04/05`, `?? active/Step-05*`, `?? active/Step-06-ARP.md`,
`?? pending/Step-08.md` — унаследованы от предыдущих шагов, не мои действия. Единственное моё
изменение кода — `M apps/studio/src/storage/workspaceStorage.ts`; единственное моё изменение
task-bus — перенос `pending/Sprint-24-Step-07.md` → `active/Sprint-24-Step-07.md` перед началом
работы (untracked-файл, `git mv` не применим — перемещён обычным `mv`, что и отражено как
изменение пути в `??`-строке). Никакой домен (`domain/**`), `repositories/**`, `app/api/**` и
UI-код не тронуты.

## Validation

Все команды — из `apps/studio/`:

- **`npx tsc --noEmit`** — чисто, без вывода (код завершения 0).
- **`npx eslint src/storage/workspaceStorage.ts`** и **`npm run lint`** (весь проект) — чисто,
  без единого предупреждения.
- **`npx prettier --check src/storage/workspaceStorage.ts`** — `All matched files use Prettier
  code style!`.
- **`npm run build`** — успешно:
  ```
  ✓ Compiled successfully in 2.2s
    Running TypeScript ...
    Finished TypeScript in 3.9s ...
  ✓ Generating static pages using 12 workers (11/11) in 702ms
  ```
  `/api/workspace` присутствует в итоговой таблице роутов.

### Живая проверка — техника

Как и в Step 05/06, `npm run test:e2e` не запускался (тот же жёстко закреплённый
`playwright.config.ts`: `baseURL`/`webServer` на `localhost:3000`, файл вне Allowed paths).
Вместо этого — два дополняющих друг друга прогона:

**Shape 2 (чистая логика, без сети)** — тело новых функций (`readSyncPendingFlag`,
`writeSyncPendingFlag`, `getSyncWarning`, логика `syncWarning` внутри
`fetchBooksFromApi`/`pushBooksToApi`) скопировано дословно в изолированный Node-скрипт
(`verify-step07-logic.mjs`, только в scratchpad, не в репозитории) с мок-`window.localStorage` —
проверяет именно контракт `getSyncWarning()` (level vs. одноразовый сигнал), который UI пока не
читает и потому не наблюдаем через браузер:

```
PASS: флаг выставлен -> readSyncPendingFlag() === true
PASS: флаг снят -> readSyncPendingFlag() === false
PASS: флаг снят -> ключ реально удалён из localStorage (getItem === null)
PASS: push неуспешен -> getSyncWarning() === 'db-unavailable'
PASS: 'db-unavailable' НЕ одноразовый -> повторный getSyncWarning() снова возвращает его
PASS: следующий успешный push -> getSyncWarning() === null (авто-очистка)
PASS: первый вызов после реконсиляции -> 'recovered-local-wins'
PASS: второй вызов сразу после -> null (одноразовое сообщение потреблено)

8 PASS, 0 FAIL
```

**Shape 1 (реальный сервер, реальный браузер, реальная — но изолированная — БД)**: та же техника,
что Step 06 обосновал и применил (не повторяю обоснование дословно, оно то же самое) —

- **Изоляция сервера:** `npx next start -p 3421` прямо из `apps/studio/`, `DATABASE_URL` передан
  только как переменная окружения этого конкретного процесса
  (`...literary_studio_step07_test...`), реальный `apps/studio/.env` не редактировался.
- **Изоляция БД:** отдельная логическая база `literary_studio_step07_test` в том же контейнере
  Postgres (`CREATE DATABASE`, `prisma migrate deploy` той же миграцией `20260710202615_init`),
  удалена (`DROP DATABASE`) по завершении.
- Скрипт (`verify-step07.mjs`, временно скопирован в `apps/studio/` как
  `.scratch-verify-step07.mjs` — единственный практический способ подключить локальный пакет
  `@playwright/test` из ESM-скрипта в этом окружении — и удалён сразу после прогона,
  `git status --short` до/после подтверждает отсутствие следов) реально: запускает headless
  системный Chrome (`chromium.launch({ channel: "chrome" })`, как в `playwright.config.ts`),
  кликает по настоящим кнопкам, печатает текст в настоящий `<textarea>` посимвольно, реально
  перезагружает страницу, реально останавливает/восстанавливает контейнер Postgres
  (`docker compose stop/start postgres`), проверяет фактическое содержимое БД через `psql`.

### Сценарий 1 — флаг выставлен → локальная (более новая) версия должна победить

Подготовка: книга "Книга A" создана через реальный UI, в сцену введён `"Текст v1 (в БД)."`,
подтверждено `psql`, что он реально долетел до БД, флаг синхронизации после этого снят (`null`).
Затем через `page.evaluate` напрямую (не через `saveWorkspace()`) текст сцены в `localStorage`
заменён на более новый, и флаг синхронизации выставлен в `"1"` — эмуляция "правка внесена, пока
БД была недоступна, `saveWorkspace()` не подтвердил push":

```
PASS: setup: v1-текст реально долетел до тестовой БД
PASS: setup: после успешного push флаг sync-pending снят (null)
PASS: сценарий 1: после перезагрузки textarea показывает ЛОКАЛЬНУЮ (v2) версию, не БД (v1)
PASS: сценарий 1: реконсиляция реально протолкнула v2 в БД
PASS: сценарий 1: флаг sync-pending снят после успешной реконсиляции
```

`loadWorkspace()` реально вернул локальную (v2) версию вместо устаревшей БД (v1); реконсиляция
реально протолкнула v2 в БД (подтверждено `psql`); флаг снят.

### Сценарий 2 — тот же конфликт, но флаг НЕ выставлен → БД должна победить (не регресс)

Тот же локально-БД конфликт (локальный текст заменён на v3), но флаг синхронизации явно снят
перед перезагрузкой (эмуляция "локальное состояние уже было подтверждённо синхронизировано
ранее"):

```
PASS: сценарий 2: после перезагрузки textarea показывает БД-версию (v2), не локальную v3 -> не регресс
PASS: сценарий 2: БД не изменилась (осталась v2, локальная v3 отброшена)
```

Поведение "БД выигрывает при непустом результате и отсутствии несинхронизированных правок"
сохранено буквально таким же, как до этого шага.

### Сценарий 3 — полный цикл: остановка Postgres → правка → восстановление → перезагрузка

```
Container literary-architect-framework-postgres-1 Stopping
Container literary-architect-framework-postgres-1 Stopped
PASS: postgres реально остановлен (docker compose ps пуст по сервису)
   localhost:3000 (вкладка Product Owner) во время простоя postgres -> 200
PASS: localhost:3000 не задет остановкой тестового postgres
PASS: сценарий 3: textarea реально содержит правку, набранную при недоступной БД
PASS: сценарий 3: флаг sync-pending выставлен (push не прошёл, БД недоступна)
Container literary-architect-framework-postgres-1 Starting
Container literary-architect-framework-postgres-1 Started
PASS: postgres снова healthy после docker compose start
   БД сразу после восстановления (до перезагрузки страницы), Scene.text = "Текст v2 ЛОКАЛЬНЫЙ, новее (правка при недоступной БД)."
   textarea после восстановления БД + перезагрузки: "Текст v2 ЛОКАЛЬНЫЙ, новее (правка при недоступной БД). ПРАВКА ВО ВРЕМЯ ПРОСТОЯ БД (сценарий 3)."
PASS: сценарий 3 (ГЛАВНОЕ): правка, набранная при недоступной БД, СОХРАНИЛАСЬ после восстановления+перезагрузки (не потеряна, в отличие от Step 06)
   psql Scene.text после восстановления + перезагрузки = "Текст v2 ЛОКАЛЬНЫЙ, новее (правка при недоступной БД). ПРАВКА ВО ВРЕМЯ ПРОСТОЯ БД (сценарий 3)."
PASS: сценарий 3: БД реально реконсилирована — теперь содержит offline-правку, а не устаревший v2
PASS: сценарий 3: флаг sync-pending снят после успешной реконсиляции
   localhost:3000 (вкладка Product Owner) после восстановления postgres -> 200
PASS: localhost:3000 всё ещё отвечает 200 после всего цикла

16 PASS, 0 FAIL
```

**Явная разница со Step 06:** в живой проверке Step 06 (см. её ARP, сценарий 3) ровно тот же
цикл действий заканчивался фразой "правка потеряна... восстановление возможно только если БД
пуста". Здесь тот же цикл (правка, набранная при `docker compose stop postgres`, восстановление,
перезагрузка) заканчивается тем, что БД после восстановления содержит устаревший текст ("v2", до
offline-правки) до перезагрузки — и уже сразу после перезагрузки и `textarea`, и `psql`
показывают offline-правку ("v2 + ПРАВКА ВО ВРЕМЯ ПРОСТОЯ..."), то есть правка **сохранена**, а не
потеряна. Это прямое подтверждение исправления найденного в Step 06 бага.

### Постусловия и уборка

- **`localhost:3000` (вкладка Product Owner) не останавливался и не перезапускался** —
  `fetch`-проверки до, во время остановки тестового Postgres и после восстановления неизменно
  возвращали `200` (см. отметки в логах сценария 3 выше).
- **Postgres в healthy-состоянии по завершении:** `docker compose ps postgres` → `Up ... (healthy)`.
- **Реальная БД `literary_studio` не тронута:** `SELECT COUNT(*) FROM "Book"` = 0 (как и до
  начала работы), `SELECT COUNT(*) FROM "User"` = 1 (тот же дефолтный пользователь). Все
  тестовые операции ушли исключительно в `literary_studio_step07_test`, которая полностью
  удалена (`DROP DATABASE`) по завершении.
- Scratch-сервер на порту 3421 остановлен (`taskkill` по PID), порт свободен (`netstat`).
- Временные файлы (`.scratch-verify-step07.mjs`), скопированные внутрь `apps/studio/`
  исключительно для разрешения пакета `@playwright/test`, удалены сразу после использования;
  `git status --short` подтверждает отсутствие следов в рабочем дереве.

## Отклонения от Step Card

Технических отклонений от буквы контракта (форма флага, момент его выставления/снятия, форма
`SyncWarning`, неизменность публичных сигнатур) нет. Зафиксированные технические решения,
оставленные на усмотрение реализации самой карточкой:

1. **Форма `getSyncWarning()`** — строковый литеральный union из двух значений плюс module-level
   переменная, а не объект/enum. Явно разрешено формулировкой карточки ("точная форма — на
   усмотрение реализации").
2. **`"db-unavailable"` реализован как level-сигнал** (устанавливается/снимается на каждый вызов
   `fetchBooksFromApi()`/`pushBooksToApi()`, а не только внутри `loadWorkspace()`/`saveWorkspace()`
   напрямую) — минимальное расширение per ADR-0012 Decision 5 ("на каждый вызов, не только при
   старте сессии"), не отдельное от Objective 3 требование, но естественное прочтение фразы
   "последний вызов ... не удался".
3. **Флаг также снимается в ветке миграции** (БД пуста, `localWorkspace.books.length > 0`) при
   успешном push — карточка явно требовала этого только для реконсиляционной ветки (п.2
   Objective), но семантика флага ("подтверждены ли локальные `books` как синхронизированные")
   одинаково применима и здесь; иначе после успешной миграции флаг остался бы ошибочно
   выставленным до следующего органического `saveWorkspace()`. Не меняет публичный контракт,
   не расширяет scope за пределы `loadWorkspace()`/`saveWorkspace()` — тот же файл, та же функция.
4. Та же методологическая особенность живой проверки, что в Step 05/06: изолированная тестовая
   БД (`literary_studio_step07_test`) вместо прямого использования `literary_studio`, по той же
   причине (единственный общий пользователь, ADR-0012 Decision 1).

## Stop Condition

Не закоммичено. Ждём подтверждения Product Owner (`STATUS: OK`).
