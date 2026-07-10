id: Sprint-24-Step-03-ARP
name: "ARP: Repository-слой — CRUD через Prisma для доменных сущностей"
type: arp

## Что сделано

Создан новый серверный repository-слой поверх существующего Prisma-singleton (`@/lib/db`), без
HTTP и без UI, в новой директории `apps/studio/src/repositories/`:

- **`apps/studio/src/repositories/userRepository.ts`** — `getOrCreateDefaultUser(): Promise<User>`.
  Буквально по ADR-0012 Decision 1: `prisma.user.findFirst({ orderBy: { createdAt: "asc" } })` —
  первый существующий пользователь; если таблица `User` пуста — `prisma.user.create({ data: {} })`.
- **`apps/studio/src/repositories/bookRepository.ts`** —
  `loadBooksForUser(userId: string): Promise<Book[]>` и
  `saveBooksForUser(userId: string, books: readonly Book[]): Promise<void>`.
- **`apps/studio/src/repositories/index.ts`** — публичный барабан-экспорт всех трёх функций;
  комментарий фиксирует, что Sprint-24-Step-04 должен импортировать именно отсюда, а не напрямую
  из `userRepository`/`bookRepository` (внутреннее разбиение файлов — деталь реализации, как и
  разрешено Step Card).

### `loadBooksForUser`

Один запрос `prisma.book.findMany({ where: { userId }, include: {...} })` с вложенным `include`
для `chapters → scenes`, `characters`, `ideas`, `assistantThreads → messages`, затем маппинг в
domain-форму (`toDomainBook`/`toDomainAssistantThreads`/`toDomainAssistantThread`):

- `assistantThreads` — плоские строки Prisma (`role` как поле на каждой записи) группируются в
  domain-объект `{ coauthor: [...], editor: [...], critic: [...], reader: [...] }`, как требует
  Step Card.
- `AssistantThread.persona` — Prisma `string | null` → domain `persona?: string`: `null`
  разворачивается в **отсутствие ключа** `persona` в объекте (не `persona: undefined`), через
  условный spread `...(thread.persona !== null ? { persona: thread.persona } : {})`.
- `ChatMessage` — из Prisma-строки в domain-форму попадают только `role`/`content`; `id`,
  `createdAt`, `threadId` отбрасываются, как явно предписано Step Card.
- `Idea.createdAt` — в отличие от `ChatMessage`, это реальное domain-поле (клиент сам генерирует
  `new Date().toISOString()` при создании идеи, см. `useWorkspaceController.createIdea()`) —
  читается через `idea.createdAt.toISOString()`, без отбрасывания.

### `saveBooksForUser`

Одна интерактивная Prisma-транзакция (`prisma.$transaction(async (tx) => {...}, { maxWait:
10_000, timeout: 30_000 })`) на весь вызов. Внутри — по каждой сущности: `deleteMany` по
`id: { notIn: [текущие id из переданного дерева] }` (убирает то, чего больше нет), затем цикл
`upsert` по `id` для того, что осталось/добавилось:

1. `Book` — верхнеуровневый `deleteMany` по `userId` убирает удалённые книги целиком; благодаря
   `onDelete: Cascade` на `Chapter`/`Character`/`Idea`/`AssistantThread` (и далее вниз на
   `Scene`/`ChatMessage`) удаление `Book`-строки утаскивает за собой всё поддерево — отдельно
   чистить дочерние таблицы удалённых книг не потребовалось.
2. `Chapter`/`Scene` — `upsert` с явным `order: индекс_в_массиве` (в схеме `Chapter`/`Scene` уже
   есть поле `order Int @default(0)` ровно для этого; при чтении — `orderBy: { order: "asc" }`).
3. `Character`/`Idea` — `upsert` по `id`; `Idea.createdAt` пишется как есть из domain-значения
   (`new Date(idea.createdAt)`), не даётся сгенерироваться Prisma-дефолтом — иначе round-trip не
   совпал бы с исходным значением (в отличие от `ChatMessage`, где приемлемо и предписано именно
   дать сработать дефолту).
4. `AssistantThread` — domain `AssistantThreads` разворачивается в плоский список
   `{ role, thread }` по всем четырём ролям, затем `upsert` по `id` с `persona: thread.persona ??
   null` (обратное направление того же null↔undefined маппинга).
5. `ChatMessage` — так как domain `ChatMessage` не несёт `id` и не с чем сверять построчно,
   сообщения каждого треда при каждом сохранении заменяются целиком: `deleteMany({ where:
   { threadId } })`, затем `create` по каждому сообщению по порядку, оставляя `id`/`createdAt`
   Prisma-дефолту — буквально как предписывает Step Card.

## Соответствие Scope

Allowed paths по Step Card — только `apps/studio/src/repositories/**` (новая директория).
`git status --short` после завершения работы:

```
R  docs/task-bus/queue/pending/Sprint-24-Step-03.md -> docs/task-bus/queue/active/Sprint-24-Step-03.md
?? apps/studio/src/repositories/
```

`apps/studio/src/app/api/**`, `apps/studio/src/workspace/**`, `apps/studio/src/storage/**`,
`apps/studio/src/domain/**`, любой UI-код — не тронуты (Forbidden paths по Step Card). Domain-типы
(`Book`/`Chapter`/`Scene`/.../`AssistantThreads`) используются как есть, импортом из
`@/domain/model`, без изменений. Существующий Prisma-singleton `@/lib/db` использован как есть,
второй клиент не создавался.

## Validation

Все команды прогнаны из `apps/studio/`:

- **`npx tsc --noEmit`** — чисто, без вывода.
- **`npx eslint src/repositories`** — чисто, без вывода.
- **`npx prettier --check "src/repositories/**/*.ts"`** — при первом прогоне
  `bookRepository.ts` не прошёл (перенос строк), исправлено `npx prettier --write`; повторная
  проверка — `All matched files use Prettier code style!`.
- **`npm run build`** — успешная production-сборка (`✓ Compiled successfully`, TypeScript прошёл,
  все 6 API-роутов и статические страницы сгенерированы). Отдельно отмечаю (Step Card заранее
  допускала обратное, прецедент Sprint-13-Step-01): сборка **не упала**, несмотря на то что
  repository-слой пока нигде не используется — судя по всему, TypeScript compiler в этом проекте
  не ругается на неиспользуемые экспорты модуля сами по себе (в отличие от неиспользуемых
  локальных переменных), так что прецедент здесь не воспроизвёлся. Раз build зелёный, это не имеет
  практических последствий для этого шага, но фиксирую для истории, раз карточка явно просила об
  этом написать.
- **`npm run test:e2e`** — сознательно не запускался, по прямому указанию задания (не пересекаться
  с активным dev-сервером Product Owner на порту 3000).

### Живая проверка против реальной БД (без браузера и без dev-сервера)

Postgres поднят и здоров (`docker compose ps postgres` — `Up ... (healthy)`,
`literary-architect-framework-postgres-1`, порт 5432). Одноразовый скрипт вне репозитория:
`C:\Users\Bat\AppData\Local\Temp\claude\e--Projects-Literary-Architect-Framework\71698014-019f-42db-9e0c-480314f9a6bc\scratchpad\verify-repositories.ts`,
запущен через `npx tsx <путь>` с `cwd = apps/studio` (чтобы разрешились алиасы `@/*` из
`tsconfig.json`) и `DATABASE_URL=postgresql://literary:literary@127.0.0.1:5432/literary_studio`
(тот же контейнер/креды, что в `.env`; `127.0.0.1` вместо `localhost`, так как `localhost` на этой
машине резолвился в `::1` и упирался в `EACCES` — исключительно локальная деталь окружения
запуска скрипта, `apps/studio/.env` не менялся). Импортирует три публичные функции напрямую из
`apps/studio/src/repositories/index.ts` по абсолютному пути.

Сценарий и реальный вывод:

```
=== Sprint-24-Step-03 live verification ===
getOrCreateDefaultUser OK, userId = cmrfgi2sv0000ng78k9ecc10a
Book #1 round-trip OK: ceb27209-b786-4d82-9e1b-cbc0196cd491
Book #2 saved alongside Book #1, no id collisions. IDs: ceb27209-b786-4d82-9e1b-cbc0196cd491 d505c9d1-19df-4023-83d7-6d7699380c68
No id intersection between book1 and book2 entity ids.
Edit+resave (chapter deletion, persona null->undefined) round-trip OK.
=== ALL ASSERTIONS PASSED ===
USER_ID=cmrfgi2sv0000ng78k9ecc10a
BOOK1_ID=ceb27209-b786-4d82-9e1b-cbc0196cd491
BOOK2_ID=d505c9d1-19df-4023-83d7-6d7699380c68
```

Шаги, которые он реально проверил (с настоящим deep-equal сравнением JS-объектов, не строковым):

1. `getOrCreateDefaultUser()` вызван дважды — одинаковый `userId` оба раза.
2. `saveBooksForUser(userId, [])` — очистка перед тестом, `loadBooksForUser` вернул `[]`.
3. Книга №1 (2 главы по 2 сцены, непустой `assistantThreads.coauthor` с 3 сообщениями,
   `assistantThreads.reader` с `persona: "молодой читатель"` и 1 сообщением, `characters`,
   `ideas`) сохранена и прочитана обратно — результат совпал с исходником 1:1 (поле за полем,
   включая порядок глав/сцен/сообщений).
4. Книга №2 сохранена вместе с книгой №1 (`saveBooksForUser(userId, [book1, book2])`) — обе
   присутствуют, обе совпали с исходником после перечитывания; явная сверка множеств id
   (книга + главы + сцены) не пересекается между книгами.
5. Правка-и-пересохранение книги №1: удалена вторая глава целиком (2 сцены), у `reader`-треда
   `persona` убрана (стала `undefined` на domain-уровне) — после `saveBooksForUser` и повторного
   `loadBooksForUser` результат снова совпал 1:1 с ожидаемым; отдельно проверено, что `persona`
   на всех `reader`-тредах стала именно `undefined` (не осталась строкой, не превратилась в
   пустую строку).

### Подтверждение через `psql` (реальные строки в таблицах, не мок)

```
$ docker compose exec -T postgres psql -U literary -d literary_studio -c "\dt"
               List of relations
 Schema |        Name        | Type  |  Owner
--------+--------------------+-------+----------
 public | AssistantThread    | table | literary
 public | Book               | table | literary
 public | Chapter            | table | literary
 public | Character          | table | literary
 public | ChatMessage        | table | literary
 public | Idea               | table | literary
 public | Scene              | table | literary
 public | User               | table | literary
 public | _prisma_migrations | table | literary
(9 rows)

$ docker compose exec -T postgres psql -U literary -d literary_studio -c \
  "SELECT id, \"userId\", title, genre, array_length(tags,1) AS tags_len FROM \"Book\" \
   WHERE id IN ('ceb27209-b786-4d82-9e1b-cbc0196cd491','d505c9d1-19df-4023-83d7-6d7699380c68');"
                  id                  |          userId           |          title           |   genre    | tags_len
--------------------------------------+---------------------------+--------------------------+------------+----------
 ceb27209-b786-4d82-9e1b-cbc0196cd491 | cmrfgi2sv0000ng78k9ecc10a | Книга A — Тестовая книга | Фантастика |        2
 d505c9d1-19df-4023-83d7-6d7699380c68 | cmrfgi2sv0000ng78k9ecc10a | Книга B — Тестовая книга | Фантастика |        2
(2 rows)

$ docker compose exec -T postgres psql -U literary -d literary_studio -c \
  "SELECT c.title AS chapter, count(s.id) AS scenes FROM \"Chapter\" c \
   LEFT JOIN \"Scene\" s ON s.\"chapterId\"=c.id \
   WHERE c.\"bookId\"='ceb27209-b786-4d82-9e1b-cbc0196cd491' GROUP BY c.id, c.title;"
 chapter | scenes
---------+--------
 Глава 1 |      2
(1 row)
```

(результат снят **после** шага «правка-и-пересохранение» — подтверждает, что вторая глава реально
удалена из таблицы `Chapter`/`Scene`, не просто проигнорирована слоем чтения.)

```
$ docker compose exec -T postgres psql -U literary -d literary_studio -c \
  "SELECT role, name, persona, (SELECT count(*) FROM \"ChatMessage\" m WHERE m.\"threadId\"=t.id) AS msg_count \
   FROM \"AssistantThread\" t WHERE t.\"bookId\"='ceb27209-b786-4d82-9e1b-cbc0196cd491';"
   role   |       name       | persona | msg_count
----------+------------------+---------+-----------
 coauthor | Диалог 1         |         |         3
 editor   | Диалог 1         |         |         0
 reader   | Молодой читатель |         |         1
(3 rows)

$ docker compose exec -T postgres psql -U literary -d literary_studio -c \
  "SELECT id, persona IS NULL AS persona_is_null FROM \"AssistantThread\" \
   WHERE \"bookId\"='ceb27209-b786-4d82-9e1b-cbc0196cd491' AND role='reader';"
                  id                  | persona_is_null
--------------------------------------+-----------------
 70cf923d-d633-447c-9e72-62f37cc011dc | t
(1 row)

$ docker compose exec -T postgres psql -U literary -d literary_studio -c \
  "SELECT count(*) AS chapters_book2 FROM \"Chapter\" WHERE \"bookId\"='d505c9d1-19df-4023-83d7-6d7699380c68';"
 chapters_book2
----------------
              2
(1 row)
```

`persona_is_null = t` подтверждает, что `persona ?? null` реально записал `NULL` в столбец (не
пустую строку) — обратное направление null↔undefined маппинга работает и на уровне физических
байт в таблице, не только на уровне TypeScript-типов. `chapters_book2 = 2` подтверждает, что
правка книги №1 не затронула книгу №2 (никакой перекрёстной порчи между книгами одного
пользователя).

**Очистка после проверки:** тестовые книги удалены (`DELETE FROM "Book" WHERE "userId"=...`),
подтверждено каскадное удаление (`chapters=0, scenes=0, threads=0, messages=0` после). Тестовый
`User`-пользователь оставлен — по модели ADR-0012 это ровно тот единственный "default user",
которым будет пользоваться Step 04; специально его не удалял, чтобы не создавать иллюзию, что
`getOrCreateDefaultUser()` должен быть идемпотентен только в теории.

## Отклонения от Step Card

Технических отклонений от буквы Step Card нет. Три судейских решения, не зафиксированных явно ни
в Step Card, ни в ADR-0012 (в духе "discovery" — оставлены как реализационная деталь, а не
изобретены заново поверх принятого решения):

1. **Порядок `Character` и `AssistantThread` при чтении.** У обеих таблиц нет столбца `order` (в
   отличие от `Chapter`/`Scene`, где он в схеме уже есть) и нет естественного domain-поля вроде
   `Idea.createdAt`. Выбран `orderBy: { id: "asc" }` — детерминированный, но произвольный
   (не воспроизводит "порядок создания" содержательно, просто гарантирует стабильность между
   двумя последовательными чтениями). Если для UI важен порядок создания персонажей/тредов —
   это отдельный, не поднятый этим шагом вопрос (потребует добавления столбца в schema.prisma,
   что вне Allowed paths этого шага).
2. **Сортировка `ChatMessage` внутри треда.** Postgres `now()` (Prisma default для `createdAt`)
   возвращает одно и то же значение для всех операций внутри одной транзакции — то есть все
   сообщения, записанные одним вызовом `saveBooksForUser`, получают одинаковый `createdAt`.
   Компенсировано вторичной сортировкой по `id` (`orderBy: [{ createdAt: "asc" }, { id: "asc" }]`)
   — cuid генерируется на стороне клиента Prisma последовательно, в порядке вызовов `tx.chatMessage.create()`,
   поэтому лексикографически сохраняет порядок записи. Живая проверка (сценарий 3/5 выше, тред
   `coauthor` с 3 сообщениями "первое/первый ответ/второе") подтвердила, что порядок
   действительно сохраняется 1:1 при чтении.
3. **`Idea.createdAt` пишется явно, а не через Prisma-дефолт**, хотя общая формулировка Step Card
   ("дать Prisma сгенерировать id/createdAt по умолчанию") относится буквально только к
   `ChatMessage`. Для `Idea` это поле — реальное domain-значение (клиент проставляет его сам при
   создании идеи), поэтому дефолт здесь дал бы неверный round-trip; уточнено в разделе "Что
   сделано" выше.

Ни одно из трёх не меняет публичный контракт (`getOrCreateDefaultUser`/`loadBooksForUser`/
`saveBooksForUser`), от которого зависит Sprint-24-Step-04.

## Stop Condition

Не закоммичено. Жду подтверждения Product Owner (`STATUS: OK`) — Step Card прямо требует не
коммитить без него.
