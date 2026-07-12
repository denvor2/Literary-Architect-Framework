id: Sprint-32-Step-03
name: "Repository слой: аудит-логирование и архивирование"
type: implementation

## Контекст

Step-02 завершил Prisma-схему (Event, EventArchive models). Теперь repository-слой
должен предоставить функции для записи логов, чтения, и архивирования.

Эти функции будут использованы в Step-04 (интеграция в маршруты) и Step-06 (cron job).

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/repositories/auditRepository.ts (новый файл)
- apps/studio/src/repositories/index.ts (экспортировать новые функции)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/app/api/** (это Step-04/05)
- apps/studio/src/domain/model.ts (это Step-04)
- Любой UI-код (это Step-05)
- apps/studio/src/billing/** (это Step-04 интеграция)

## Rules

1. **Функции в auditRepository.ts:**

```typescript
// Записать событие в Event таблицу
export async function logEvent(
  userId: string,
  eventType: string,
  metadata?: Record<string, unknown>
): Promise<Event>
// - userId: обязательно, FK to User
// - eventType: например 'login_success', 'book_created', ...
// - metadata: JSON, опционально (контекст события)
// - Throws если userId не существует или DB unavailable

// Получить события пользователя за диапазон дат
export async function getUserEventLog(
  userId: string,
  startDate: Date,
  endDate: Date,
  eventTypes?: string[]
): Promise<Event[]>
// - Возвращает события пользователя между startDate и endDate
// - eventTypes: опциональный фильтр (только эти типы)
// - Возвращает Event[] упорядоченный по createdAt DESC

// Получить события системы (админ-видимость)
export async function getSystemEventLog(
  startDate: Date,
  endDate: Date,
  eventTypes?: string[],
  userId?: string
): Promise<Event[]>
// - Возвращает события системы за диапазон
// - userId: опциональный фильтр (только этого пользователя)
// - eventTypes: опциональный фильтр (только эти типы)
// - Возвращает Event[] упорядоченный по createdAt DESC

// Получить статистику событий за период
export async function getEventStats(
  startDate: Date,
  endDate: Date,
  userId?: string
): Promise<Array<{ eventType: string; count: number }>>
// - Возвращает подсчёт событий по типам
// - userId: опциональный фильтр
// - Результат отсортирован по count DESC

// Переместить события из Event в EventArchive (старше N дней)
export async function archiveOldEvents(
  olderThanDays: number
): Promise<{ movedCount: number }>
// - Находит события в Event таблице старше N дней
// - Копирует их в EventArchive
// - Удаляет из Event
// - Возвращает количество перемещённых событий
// - Idempotent: можно вызывать несколько раз, не создавая дубли

// Удалить события из archive старше N дней
export async function deleteArchivedEvents(
  olderThanDays: number
): Promise<{ deletedCount: number }>
// - Находит события в EventArchive таблице, архивированные >N дней назад
// - Удаляет их
// - Возвращает количество удалённых событий

// Получить количество логов в Event таблице
export async function getHotEventCount(): Promise<number>
// - Возвращает количество записей в Event
// - Используется для мониторинга размера таблицы
```

2. **Обработка ошибок:**
- Если Prisma DB unavailable: throw Error("Database connection unavailable")
- Если userId не существует: throw Error("User not found")
- Если logEvent() выбросит ошибку при вставке: логировать, не молча падать
- Если архивирование выбросит ошибку: логировать (console.error), вернуть 0

3. **Индексирование для перформанса:**
- Query getUserEventLog: используется индекс (userId, eventType, createdAt)
- Query getSystemEventLog: используется индекс (eventType, createdAt)
- Query archiveOldEvents: используется индекс (createdAt) для быстрого поиска старых

4. **Логирование сложных операций:**
- archiveOldEvents(): логировать количество перемещённых событий
- deleteArchivedEvents(): логировать количество удалённых событий
- Ошибки в любой операции логировать через console.error

## Validation

Все команды из apps/studio/:

1. **Типы:**
```bash
npx tsc --noEmit
```
- Должны быть валидны все типы Event, EventType в auditRepository.ts
- Должна импортироваться prisma из @/lib/db

2. **Linting:**
```bash
npx eslint src/repositories/auditRepository.ts
```
- Никаких ошибок

3. **Ручное тестирование (если есть postgres):**
```bash
# Создать событие
psql literary_studio << SQL
  INSERT INTO "Event" ("id", "userId", "eventType", "metadata", "createdAt", "updatedAt")
  VALUES ('evt_test', 'user_1', 'login_success', '{"email":"test@example.com"}', now(), now());
SQL

# Проверить, что событие записалось
psql literary_studio -c "SELECT * FROM \"Event\" WHERE id = 'evt_test';"
```

4. **Git status:**
```
M  apps/studio/src/repositories/index.ts
A  apps/studio/src/repositories/auditRepository.ts
```

## Output

ARP файл в docs/task-bus/queue/active/, указать:
1. Полный текст auditRepository.ts (все функции)
2. Обновлённый export-список из repositories/index.ts
3. Результат `npx tsc --noEmit`
4. Результат `npx eslint src/repositories/auditRepository.ts`
5. Если доступен тестовый db: результат проверки вставки события

## PostgreSQL Performance & Maintenance

Рекомендации для production:

1. **Vacuum Strategy:**
   - Event таблица будет расти быстро (все события из Auth, AI, Billing)
   - Рекомендуется включить `autovacuum` (включен по умолчанию в PostgreSQL)
   - Для больших таблиц (>10M rows): настроить `autovacuum_vacuum_scale_factor` на 0.01 (1% вместо 20%)
   - Периодически запускать manual vacuum: `VACUUM ANALYZE event;`

2. **Индексирование:**
   - @@index([userId, eventType, createdAt]) используется для типичных запросов
   - Дополнительный индекс на archivedAt для EventArchive для очистки

3. **Partitioning (Future):**
   - Если Event таблица превысит 100M rows, рассмотреть time-based partitioning по createdAt
   - Это может быть Phase 2 optimization

## Stop Condition

Не коммитить без подтверждения Product Owner.
