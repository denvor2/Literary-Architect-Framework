id: Sprint-32-Step-02
name: "Prisma schema + миграция: Event и EventArchive таблицы"
type: implementation

## Контекст

Step-01 (ADR-0017) заморозил архитектурное решение:
- Event таблица (универсальный audit trail)
- EventArchive таблица (архивные логи)
- eventType enum для всех типов событий
- Retention policy конфигурируется через environment

Этот step ИСКЛЮЧИТЕЛЬНО о схеме Prisma и миграции. Никакого TypeScript-кода,
никакого API-роута, никакого UI. Только:
1. Добавить enum EventType в apps/studio/prisma/schema.prisma
2. Добавить model Event (горячая таблица)
3. Добавить model EventArchive (архивная таблица)
4. Запустить prisma migrate dev --name add-event-logging
5. Проверить миграцию

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/prisma/schema.prisma (добавить enum и models)
- apps/studio/prisma/migrations/ (новая папка с миграцией)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/repositories/** (это Step-03)
- apps/studio/src/app/api/** (это Step-04/05)
- Любой UI-код (это Step-05)

## Rules

1. **Enum EventType** в schema.prisma:

```prisma
enum EventType {
  login_success
  login_failure
  logout
  register_success
  book_created
  book_updated
  book_deleted
  chapter_created
  chapter_updated
  chapter_deleted
  scene_created
  scene_updated
  scene_deleted
  ai_request_line_editor
  ai_request_critic
  ai_request_reader
  ai_request_coauthor
  subscription_created
  subscription_updated
  subscription_expired
  subscription_cancelled
  payment_created
  payment_completed
  payment_failed
}
```

2. **Model Event (горячая таблица):**

```prisma
model Event {
  id              String    @id @default(cuid())
  userId          String
  user            User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventType       EventType
  metadata        Json?     // контекст события, опционально
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@index([userId])
  @@index([eventType])
  @@index([createdAt])
  @@index([userId, eventType, createdAt])  // для быстрых запросов "события пользователя за период"
}
```

3. **Model EventArchive (архивная таблица):**

```prisma
model EventArchive {
  id              String    @id @default(cuid())
  userId          String    // денормализовано (пользователь может быть удалён)
  eventType       EventType
  metadata        Json?
  createdAt       DateTime  // когда событие произошло
  archivedAt      DateTime  @default(now())  // когда оно было переархивировано

  @@index([userId])
  @@index([eventType])
  @@index([createdAt])
  @@index([archivedAt])
}
```

4. **Update User model:**

Add relation to Event (in User model):
```prisma
model User {
  // ... existing fields ...
  events   Event[]  // один-ко-многим
}
```

5. **Миграция:**

Запустить из apps/studio/:
```bash
npx prisma migrate dev --name add-event-logging
```

Миграция должна:
- Создать enum для EventType (PostgreSQL)
- Создать таблицу event с полями и индексами
- Создать таблицу event_archive с полями и индексами
- Обновить schema.prisma (npx prisma generate)

## Validation

Все команды из apps/studio/:

1. **Запустить миграцию:**
```bash
npx prisma migrate dev --name add-event-logging
```
- Успешный запуск без ошибок
- Новая миграция в apps/studio/prisma/migrations/YYYYMMDD*/migration.sql

2. **Проверить типы:**
```bash
npx tsc --noEmit
```
- Event, EventArchive должны быть валидны в generated/prisma/client
- Никаких других ошибок

3. **Проверить миграцию вживую (если есть postgres):**
```bash
# В одной сессии:
psql literary_studio -c "\dt"  # должны быть таблицы event, event_archive
psql literary_studio -c "\d event"  # проверить структуру event
```

4. **Git status:**
```
M  apps/studio/prisma/schema.prisma
?? apps/studio/prisma/migrations/YYYYMMDD*/migration.sql
?? apps/studio/prisma/migrations/YYYYMMDD*/.migration_lock.toml
```

## Output

ARP файл в docs/task-bus/queue/active/, указать:
1. Полный вывод `npx prisma migrate dev --name add-event-logging`
2. Содержимое созданного migration.sql файла
3. Результат `npx tsc --noEmit`
4. Результат `psql literary_studio -c "\dt"` (если доступно)
5. Результат `git status --short`

## Stop Condition

Не коммитить без подтверждения Product Owner.
