id: Sprint-24-Step-04-ARP
name: "ARP: /api/workspace — GET/PUT поверх repository-слоя"
type: arp

## Что сделано

Создан новый файл `apps/studio/src/app/api/workspace/route.ts` — тонкая HTTP-обёртка над
Sprint-24-Step-03's repository-слоем (`@/repositories`), по стилю существующих
`apps/studio/src/app/api/*/route.ts` (см. `book-field/route.ts` как образец: `NextResponse.json`,
`error instanceof Error ? error.message : "Unknown error"`).

Контракт:

- **`GET`** — резолвит дефолтного пользователя (`getOrCreateDefaultUser()`), читает его книги
  (`loadBooksForUser(user.id)`), возвращает `{ ok: true, books }`. Пустая БД -> `{ ok: true,
  books: [] }` — это успех, не ошибка (никакой отдельной ветки для пустого случая не нужно, она
  и так проходит через штатный путь). Runtime-исключение -> `{ ok: false, error }`, HTTP 500.
- **`PUT`** — читает `body.books`; если это не массив (включая случай, когда ключ вовсе
  отсутствует) -> `{ ok: false, error: "books is required and must be an array." }`, HTTP 400,
  до всякого обращения к БД. Если массив — резолвит дефолтного пользователя, вызывает
  `saveBooksForUser(user.id, books)`, отвечает `{ ok: true }`. Runtime-исключение -> `{ ok: false,
  error }`, HTTP 500 — тот же сигнал "БД недоступна" для dual-mode логики Sprint-24-Step-05, как и
  описано в Step Card; отдельный health-check не добавлялся.

Repository-слой (`getOrCreateDefaultUser`, `loadBooksForUser`, `saveBooksForUser`) использован
как есть, импортом из `@/repositories` (публичный барабан-экспорт, как и предписывает комментарий
в `apps/studio/src/repositories/index.ts`) — ни `userRepository.ts`, ни `bookRepository.ts`
напрямую не импортировались.

## Соответствие Scope

Allowed paths по Step Card — только `apps/studio/src/app/api/workspace/route.ts` (новый файл).
`git status --short` после завершения работы:

```
 D docs/task-bus/queue/pending/Sprint-24-Step-04.md
?? apps/studio/src/app/api/workspace/
?? docs/task-bus/queue/active/Sprint-24-Step-04.md
```

(Step Card перемещена из `pending/` в `active/` перед началом работы, как требует процесс; ARP —
этот файл.) `apps/studio/src/repositories/**`, `apps/studio/src/workspace/**`,
`apps/studio/src/storage/**`, любой UI-код — не тронуты (Forbidden paths по Step Card).

## Validation

Все команды прогнаны из `apps/studio/`:

- **`npx tsc --noEmit`** — чисто, без вывода.
- **`npx eslint src/app/api/workspace/route.ts`** — чисто, без вывода.
- **`npx prettier --check src/app/api/workspace/route.ts`** — при первом прогоне не прошёл
  (перенос длинных строк с деструктуризацией импорта и объекта ошибки), исправлено
  `npx prettier --write`; повторная проверка — `All matched files use Prettier code style!`.
- **`npm run build`** — `✓ Compiled successfully`, TypeScript прошёл, в списке роутов появился
  `ƒ /api/workspace` рядом с остальными шестью существующими API-роутами.

### Живая проверка — окружение

Product Owner в это время держал открытым и активно использовал `npm run dev` на
`localhost:3000` с реальными данными в `localStorage` браузера — этот сервер **не
останавливался, не перезапускался и не трогался**; порт 3000 всё время оставался занят его
процессом. Для собственной проверки поднят изолированный production-подобный сервер на
scratch-порту **3417** (`npm run build && npx next start -p 3417`, согласно
`literary-studio-run`), запущен фоном, готовность подтверждена циклом `curl` до HTTP 200.

Первая попытка `GET` на 3417 упала с `EACCES` при подключении к Postgres
(`connect EACCES ::1:5432`) — тот же локальный артефакт окружения, что уже зафиксирован в
Sprint-24-Step-03-ARP: `localhost` в `DATABASE_URL` резолвится в IPv6 `::1` на этой машине, что
недоступно. В Step 03 это обходилось для отдельного standalone-скрипта явной подстановкой
`127.0.0.1` в переменную окружения запуска. Здесь тот же обход применён к самому серверному
процессу: scratch-сервер перезапущен с `DATABASE_URL` (только как переменная окружения именно
этого процесса, `apps/studio/.env` **не менялся** — Next.js/`@next/env` не перезаписывает уже
установленную переменную окружения значением из `.env`-файла) —
`postgresql://literary:literary@127.0.0.1:5432/literary_studio?schema=public`. После этого все
четыре сценария прошли штатно. `docker compose ps postgres` подтверждал `Up ... (healthy)`
(`literary-architect-framework-postgres-1`) на всём протяжении проверки.

### Сценарий 1 — GET на изначально пустой БД

Перед проверкой подтверждено напрямую через `psql`, что таблица `Book` для дефолтного
пользователя пуста (Step 03 подчистил за собой, оставив только самого пользователя):

```
$ docker compose exec -T postgres psql -U literary -d literary_studio -c "SELECT COUNT(*) FROM \"Book\";"
 count
-------
     0
(1 row)
$ docker compose exec -T postgres psql -U literary -d literary_studio -c "SELECT COUNT(*) FROM \"User\";"
 count
-------
     1
(1 row)
```

Реальный curl:

```
$ curl -s -w "\nHTTP_STATUS=%{http_code}\n" http://127.0.0.1:3417/api/workspace
{"ok":true,"books":[]}
HTTP_STATUS=200
```

### Сценарий 2 — PUT с 1-2 книгами (главы/сцены/ideas/assistantThreads)

Тело запроса — 2 книги: книга 1 с одной главой из двух сцен, одним персонажем, одной идеей,
непустым `assistantThreads.coauthor` (2 сообщения) и `assistantThreads.reader` с `persona`
(1 сообщение); книга 2 — пустая (проверка минимального валидного дерева наряду с насыщенным).

```
$ curl -s -w "\nHTTP_STATUS=%{http_code}\n" -X PUT -H "Content-Type: application/json" \
  --data-binary "@put-body.json" http://127.0.0.1:3417/api/workspace
{"ok":true}
HTTP_STATUS=200
```

### Сценарий 3 — повторный GET, сверка содержимого (не только кода ответа)

```
$ curl -s http://127.0.0.1:3417/api/workspace
{"ok":true,"books":[{"id":"step04-test-book-1","title":"Тестовая книга 1 (Step-04)", ...
 ... "id":"step04-test-book-2","title":"Тестовая книга 2 (Step-04)", ... }]}
```

Сырой JSON-вывод сохранён и сверен программно (deep-equal, не построчно и не на глаз) Node-скриптом
против исходного тела PUT — с сортировкой массива книг по `id` перед сравнением, чтобы не зависеть
от порядка:

```
$ node compare.mjs
DEEP EQUAL OK: books written via PUT === books returned by subsequent GET
Book count: 2
Book ids: step04-test-book-1, step04-test-book-2
```

### Сценарий 4 — PUT без books

```
$ curl -s -w "\nHTTP_STATUS=%{http_code}\n" -X PUT -H "Content-Type: application/json" -d '{}' \
  http://127.0.0.1:3417/api/workspace
{"ok":false,"error":"books is required and must be an array."}
HTTP_STATUS=400

$ curl -s -w "\nHTTP_STATUS=%{http_code}\n" -X PUT -H "Content-Type: application/json" \
  -d '{"books": "not-an-array"}' http://127.0.0.1:3417/api/workspace
{"ok":false,"error":"books is required and must be an array."}
HTTP_STATUS=400
```

(Проверены оба варианта "нет ключа" и "ключ есть, но не массив" — оба ловятся одной и той же
проверкой `!Array.isArray(books)`, как и предполагает контракт Step Card.)

### Очистка тестовых данных

После сценария 4 записан пустой `books: []` тем же PUT-эндпоинтом (та же операция, что и в
реальном приложении на "удалить все книги"):

```
$ curl -s -w "\nHTTP_STATUS=%{http_code}\n" -X PUT -H "Content-Type: application/json" \
  -d '{"books": []}' http://127.0.0.1:3417/api/workspace
{"ok":true}
HTTP_STATUS=200

$ curl -s http://127.0.0.1:3417/api/workspace
{"ok":true,"books":[]}
```

Подтверждено напрямую в БД — все связанные таблицы пусты, каскадное удаление отработало:

```
$ docker compose exec -T postgres psql -U literary -d literary_studio -c 'SELECT COUNT(*) FROM "Book";'
 count
-------
     0
$ ... "Chapter" ... -> 0
$ ... "Scene" ... -> 0
$ ... "AssistantThread" ... -> 0
$ ... "ChatMessage" ... -> 0
$ ... "Idea" ... -> 0
```

Дефолтный `User`-пользователь оставлен нетронутым (та же логика, что в Sprint-24-Step-03-ARP —
он и есть тот единственный пользователь, которым будет пользоваться Sprint-24-Step-05/06).

### Подтверждение изоляции от localhost:3000

```
$ curl -s -o /dev/null -w "3000=%{http_code}\n" http://127.0.0.1:3000/
3000=200
```

Проверено до, во время и после live-проверки — сервер Product Owner на 3000 весь процесс
оставался запущенным и отвечал 200, не перезапускался. Scratch-сервер на 3417 остановлен по
завершении проверки (`taskkill` по PID, привязанному к порту 3417); порт 3417 подтверждён
свободным (только `TIME_WAIT`-сокеты закрытых соединений, без `LISTENING`).

## Отклонения от Step Card

Технических отклонений от буквы контракта нет. Одна находка, зафиксированная здесь, а не
исправленная явочным порядком (Forbidden paths прямо запрещают трогать repository-слой в этом
шаге):

1. **`localhost` в `apps/studio/.env`'s `DATABASE_URL` резолвится в IPv6 `::1` на этой
   машине и ловит `EACCES`** при подключении Prisma к Postgres — тот же артефакт, что уже
   зафиксирован Sprint-24-Step-03-ARP для отдельного standalone-скрипта, здесь воспроизведён
   и для полноценного Next.js-сервера. Обойдено на время проверки подстановкой `127.0.0.1`
   через переменную окружения запуска процесса (без изменения `apps/studio/.env` — Forbidden/
   Allowed paths этого шага не включают `.env`, да и правка постоянного конфига ради локального
   артефакта одной машины была бы неверным решением). Это чисто локальная особенность машины
   разработки/проверки, не связана с продакшн-окружением (Docker Compose уже сейчас передаёт
   `DATABASE_URL` через переменные окружения контейнера, не через `.env`-файл) — фиксирую здесь
   на случай, если следующий шаг (Sprint-24-Step-05/06) столкнётся с тем же на этой же машине.

## Stop Condition

Не закоммичено. Жду подтверждения Product Owner (`STATUS: OK`) — Step Card прямо требует не
коммитить без него.
