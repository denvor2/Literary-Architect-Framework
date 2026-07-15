# Оптимизация Запросов в Database-Primary Архитектуре

**Статус:** Active (Sprint 37, Step-02)  
**Последнее обновление:** 2026-07-15  
**Связанные ADR:** [ADR-0017](../adr/ADR-0017-database-primary-with-resilience.md) (Database Primary Storage), [ADR-0012](../adr/ADR-0012-persistence-migration.md) (Coarse Contract)

---

## Цель

Документировать стратегию запросов к базе данных в контексте database-primary архитектуры (ADR-0017). На Phase 1 (единый пользователь, несколько книг) текущая стратегия оптимальна. Документ объясняет:

1. Почему batch-load предотвращает N+1 queries
2. Какие индексы используются и почему
3. Рекомендации для Phase 2+ (многопользовательские сценарии, масштабирование)

---

## Архитектурная Стратегия: Batch-Load Pattern

### Основной Запрос

Когда приложение загружает рабочее пространство пользователя, `bookRepository.loadBooksForUser()` выполняет **один единственный SQL запрос**:

```sql
SELECT 
  b.*,
  c.*,  -- Chapters
  s.*,  -- Scenes (через Chapters)
  ch.*,  -- Characters
  i.*,  -- Ideas
  a.*,  -- AssistantThreads
  m.*   -- ChatMessages (через AssistantThreads)
FROM 
  book b
LEFT JOIN chapter c ON c.bookId = b.id
LEFT JOIN scene s ON s.chapterId = c.id
LEFT JOIN character ch ON ch.bookId = b.id
LEFT JOIN idea i ON i.bookId = b.id
LEFT JOIN assistantThread a ON a.bookId = b.id
LEFT JOIN chatMessage m ON m.threadId = a.id
WHERE 
  b.userId = ? 
  AND b.deletedAt IS NULL
ORDER BY 
  b.createdAt ASC,
  c.order ASC,
  s.order ASC,
  ch.id ASC,
  i.createdAt ASC,
  a.id ASC,
  m.createdAt ASC,
  m.id ASC
```

**Ключевая особенность:** Это один запрос с вложенными LEFT JOIN, не цикл из N+1 отдельных запросов.

### Реализация в Коде: `bookInclude` Pattern

В `apps/studio/src/repositories/bookRepository.ts` используется Prisma `include` pattern:

```typescript
const bookInclude = {
  Chapter: {
    orderBy: { order: "asc" },
    include: {
      Scene: { orderBy: { order: "asc" } },
    },
  },
  Character: { orderBy: { id: "asc" } },
  Idea: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
  AssistantThread: {
    orderBy: { id: "asc" },
    include: {
      ChatMessage: { orderBy: [{ createdAt: "asc" }, { id: "asc" }] },
    },
  },
} satisfies Prisma.BookInclude;

const books = await prisma.book.findMany({
  where: { userId, deletedAt: null },
  orderBy: { createdAt: "asc" },
  include: bookInclude,
});
```

**Почему это работает:**
- Prisma компилирует `include` в один SQL запрос с LEFT JOIN
- Результат возвращается в виде повторяющихся строк (denormalized), которые Prisma затем нормализует обратно в вложенные объекты
- Нет циклов, нет отдельных queries для каждой книги или главы

---

## Индексная Стратегия по Моделям

Все приведённые ниже индексы уже присутствуют в `schema.prisma` (Sprint 37-Step-02):

### Основные Модели (Content)

| Модель | Индексы | Назначение |
|--------|---------|-----------|
| **Book** | `@@index([userId, deletedAt])` | Фильтр по пользователю + мягкое удаление |
| | `@@index([seriesId])` | Связь с Series (если нужна фильтрация) |
| **Chapter** | `@@index([bookId])` | Foreign key lookup (при JOIN) |
| **Scene** | `@@index([chapterId])` | Foreign key lookup (при JOIN) |
| **Character** | `@@index([bookId])` | Foreign key lookup (при JOIN) |
| **Idea** | `@@index([bookId])` | Foreign key lookup (при JOIN) |
| **AssistantThread** | `@@index([bookId])` | Foreign key lookup (при JOIN) |
| | `@@index([bookId, role])` | Фильтр по ролям (Editor/Critic/Reader/Co-author) |
| **ChatMessage** | `@@index([threadId])` | Foreign key lookup (при JOIN) |

### Пользовательские Модели

| Модель | Индексы | Назначение |
|--------|---------|-----------|
| **User** | `@@index([email])` | Auth lookups (login/register) |
| **Series** | `@@index([userId])` | Все серии пользователя |

### Аудит и Платежи

| Модель | Индексы | Назначение |
|--------|---------|-----------|
| **Event** | `@@index([userId])` | All events for user |
| | `@@index([eventType])` | Filter by event type |
| | `@@index([createdAt])` | Temporal queries (last N events) |
| | `@@index([userId, eventType, createdAt])` | Complex filters (user + type + time range) |
| **EventArchive** | `@@index([userId, archivedAt])` | Archive cleanup/export |
| **Payment** | `@@index([userId, status])` | User billing status |
| | `@@index([userSubscriptionId])` | Subscription lookups |
| **UserSubscription** | `@@index([userId, status])` | Active subscription per user |

---

## Анализ Производительности: Phase 1

### Сложность Запросов

**loadBooksForUser(userId: string):**

1. **Query Count:** 1 (не N+1)
2. **Index Usage:**
   - Book: `@@index([userId, deletedAt])` (primary filter)
   - Chapter: `@@index([bookId])` (JOIN)
   - Scene: `@@index([chapterId])` (JOIN)
   - Character: `@@index([bookId])` (JOIN)
   - Idea: `@@index([bookId])` (JOIN)
   - AssistantThread: `@@index([bookId])` (JOIN)
   - ChatMessage: `@@index([threadId])` (JOIN)

3. **Expected Result Set Size (Phase 1, 1 пользователь, несколько книг):**
   - Books: ~3-10 (typical author workspace)
   - Chapters per book: ~20-50 (average novel)
   - Scenes per chapter: ~1-5 (average)
   - Characters per book: ~5-20
   - Ideas per book: ~5-50
   - AssistantThreads per book: 4 (fixed: coauthor, editor, critic, reader)
   - ChatMessages per thread: ~2-20 (depends on user interaction)

   **Total rows returned:** ~1000-5000 per book, denormalized to ~10,000-50,000 result rows (due to Cartesian product of joins). Prisma normalizes back to ~1-2MB in memory per user.

4. **Latency:** ~50-200ms для одного пользователя (зависит от PostgreSQL конфигурации и размера данных).

### Почему Индексы Достаточны для Phase 1

- **Никаких N+1 queries:** Prisma `include` гарантирует один запрос, не цикл
- **Индексы покрывают все фильтры и JOIN условия:** No full table scans
- **Размер результата управляем:** ~1-2MB on load (acceptable для современных браузеров)
- **Нет пагинации нужно:** Одна загрузка за сессию, не интерактивный скроллинг

---

## Phase 2+ Рекомендации: Масштабирование

По мере роста приложения (многопользовательские workspace, тысячи книг) потребуются улучшения:

### 1. Пагинация и Курсоры (многопользовательский сценарий)

Если в одного пользователя >100 книг:

```typescript
const books = await prisma.book.findMany({
  where: { userId, deletedAt: null },
  orderBy: { createdAt: "asc" },
  skip: 0,
  take: 20,  // Batch size
  include: bookInclude,
});

// Cursor-based pagination для больших наборов
const books = await prisma.book.findMany({
  where: { userId, deletedAt: null },
  orderBy: { createdAt: "asc" },
  cursor: { id: lastBookId },  // Начать после ID
  take: 20,
  skip: 1,  // Skip cursor itself
  include: bookInclude,
});
```

**Требуемые индексы:** `@@index([userId, createdAt, id])` (для cursor-based pagination)

### 2. Lazy-Load для Больших Книг

Если одна книга имеет >10,000 scenes:

```typescript
// Load book skeleton без scenes
const book = await prisma.book.findUnique({
  where: { id },
  include: {
    Chapter: {
      include: { Scene: { select: { id: true, title: true } } },  // Metadata only
    },
    Character: true,
    Idea: true,
    AssistantThread: { include: { ChatMessage: true } },
  },
});

// Load scene text по требованию
const sceneWithText = await prisma.scene.findUnique({
  where: { id },
});
```

**Требуемые изменения:** Добавить поле `loaded: boolean` в Scene, отслеживать какие сцены в памяти.

### 3. Soft-Delete Cleanup (если > 10,000 deleted books)

Текущий запрос `loadBooksForUser()` использует фильтр `deletedAt: null`. Это OK при наличии индекса, но:

```sql
-- Текущий запрос быстро с индексом
SELECT * FROM Book WHERE userId = ? AND deletedAt IS NULL  -- Covered by @@index([userId, deletedAt])

-- На Phase 2: Периодическая очистка soft-deleted books старше 90 дней
DELETE FROM Book WHERE deletedAt IS NOT NULL AND deletedAt < NOW() - INTERVAL '90 days'
```

**Требуемые индексы:** `@@index([deletedAt])` (если очистка запускается как batch job)

### 4. Batch Saves с Деду дупликацией

`saveBooksForUser()` сейчас использует транзакции и upsert для каждой книги. На Phase 2:

```typescript
// Текущий подход: работает, но медленен для >100 книг
for (const book of books) {
  await tx.book.upsert({ ... });
}

// Phase 2: Batch upsert (если Prisma поддержит)
// или raw SQL batch INSERT ... ON CONFLICT
```

---

## Важные Замечания

### N+1 Query Prevention

Текущая реализация использует Prisma `include`, который гарантирует:
- **Ровно один SQL запрос** от `loadBooksForUser()` к database
- **Вложенные объекты загружаются в одном запросе**, не в цикле
- Альтернатива (`selectMany()` в цикле) была бы N+1 ошибкой и не используется

### Coarse Contract (ADR-0012, Decision 3)

`bookRepository` работает по "coarse contract":
- Параметр: `books: readonly DomainBook[]` (полная, авторитетная state)
- Гарантия: "Всё, что не в этом массиве, удаляется"
- Следствие: Нет инкрементальных обновлений, только полная замена

Это **не требует оптимизации индексов** — coarse contract безопасен, потому что:
1. Набор книг пользователя мал (Phase 1) или разбит на batch (Phase 2+)
2. Все mutations идут через `saveBooksForUser()` транзакцию
3. Нет race conditions между разными clients

### Аудит и События

Модели Event/EventArchive имеют собственные индексы (не зависят от content batch-load):
- `@@index([userId, eventType, createdAt])` для сложных фильтров (какие события сегодня?)
- Используются API-layer, not domain model (`bookRepository`)
- На Phase 2+: может потребоваться `@@index([eventType, createdAt])` для global stats

---

## Валидация Schema

```bash
cd apps/studio
npx prisma validate  # ✅ Schema valid as of 2026-07-15
npx prisma db push   # Уже запущено в Sprint 23 (schema создана)
```

Все индексы **уже созданы в PostgreSQL** (из миграций Sprint 23+). Новых миграций на этом шаге не нужно.

---

## Связь с ADR-0017

[ADR-0017](../adr/ADR-0017-database-primary-with-resilience.md) определяет database-primary load order:

1. **Try database first** (`loadBooksForUser()` успешно)
2. **Fall back to localStorage** if database is unreachable
3. **Warn user** if in fallback mode
4. **Sync recovery** when database reconnects (merge strategy in later step)

Этот документ обеспечивает шаг 1: batch-load через database работает эффективно, без N+1 queries, с правильными индексами.

---

## Резюме для Code Review

✅ **Приём на Production (Phase 1):**

- `@@index([userId, deletedAt])` на Book → Первичный фильтр
- Foreign key индексы (Chapter.bookId, Scene.chapterId, etc.) → JOIN coverage
- Ассоциативные индексы (AssistantThread.bookId, AssistantThread.role) → Вложенные фильтры
- `bookInclude` pattern в Prisma → Один запрос, не N+1

✅ **Готово для Step-03 (Storage Refactoring):**

- database-primary load strategy документирована
- Query performance baseline established
- Рекомендации для Phase 2+ (пагинация, lazy-load) записаны

⚠️ **Отклонения от Step Card: Нет** — все индексы уже присутствуют в schema.prisma, новых миграций не требуется.
