# Sprint-32-Step-01 — ADR-0017: Архитектура логирования и аудита (ARP)

## Резюме

Разработан и документирован ADR-0017, определяющий архитектуру комплексной системы логирования и аудита для Literary Studio. ADR описывает универсальную модель событий (23 типа событий), стратегию разделения горячих/архивных логов (две таблицы), политику хранения (30 дней в hot, 730 дней в archive), repository контракт (5 функций), и API endpoints (3 read-only endpoint). ADR замораживает архитектурное решение перед тем, как Step-02 начнёт реализацию Prisma-схемы.

**Статус:** ✅ **ADR-0017 УТВЕРЖДЁН Product Owner** 

Все 5 открытых вопросов решены (2026-07-12):
1. ✅ Две таблицы (hot + archive) — APPROVED
2. ✅ 730 дней retention — APPROVED
3. ✅ Users видят свои логи (сокращённо, только necessary) — APPROVED
4. ✅ Login events: timestamp, IP, country, browser — APPROVED
5. ✅ Удалять из hot при переносе — APPROVED

**Готово к Step-02: Prisma migration**

---

## Решение архитектурных вопросов (ADR-0017)

### 1. Модель событий (Event Model)

**Решение:** Универсальная таблица `Event` со следующей структурой:

```typescript
Event {
  id: string                    // CUID
  userId: string (FK)           // Foreign key to User (Sprint 30)
  eventType: string             // enum-like string (одна из 23 типов)
  metadata: JSON (опционально)  // Контекст события (ключевые поля)
  createdAt: DateTime (indexed)
  updatedAt: DateTime
}
```

**23 типа событий:**

- **Аутентификация (4):** `login_success`, `login_failure`, `logout`, `register_success`
- **Книги (3):** `book_created`, `book_updated`, `book_deleted`
- **Главы (3):** `chapter_created`, `chapter_updated`, `chapter_deleted`
- **Сцены (3):** `scene_created`, `scene_updated`, `scene_deleted`
- **AI-запросы (4):** `ai_request_line_editor`, `ai_request_critic`, `ai_request_reader`, `ai_request_coauthor`
- **Биллинг (6, из Sprint 31):** `subscription_created`, `subscription_updated`, `subscription_expired`, `subscription_cancelled`, `payment_created`, `payment_completed`, `payment_failed`

**Рекомендация:** ✅ Одна универсальная таблица лучше нескольких специализированных:
- Упрощает запросы "все события пользователя"
- Легче добавлять новые типы событий
- Единая стратегия индексирования
- Единая стратегия архивирования/удаления

---

### 2. Стратегия hot/archive: Две таблицы

**Решение:** Разделить логи на две физические таблицы:

| Таблица | Назначение | Индексы | Использование |
|---------|-----------|---------|----------------|
| `EVENT_HOT` | События за последние 30 дней | Полные (userId, eventType, createdAt) | UI, аналитика в реальном времени |
| `EVENT_ARCHIVE` | События старше 30 дней | Минимальные (userId, createdAt) | Историческое хранилище, экспорт |

**Процесс:**
1. **Ежедневный cron job (Step-06):** перемещает события старше 30 дней из `EVENT_HOT` в `EVENT_ARCHIVE`
2. **Удаление:** события в `EVENT_ARCHIVE` удаляются согласно retention policy (см. ниже)

**Рекомендация:** ✅ Две таблицы лучше одной таблицы с флагом `archived`:
- Финально разделённые данные (нет `WHERE archived = false` на каждом запросе)
- `EVENT_HOT` остаётся быстрой и лёгкой для индексирования
- `EVENT_ARCHIVE` можно оптимизировать отдельно (например, сжатие, секционирование)
- Если понадобится переносить архив на другое хранилище (S3, другая БД), архитектура это поддерживает

---

### 3. Retention Policy

**Решение:** 
- **EVENT_HOT:** 30 дней (конфигурируемо через `EVENT_HOT_RETENTION_DAYS=30`)
- **EVENT_ARCHIVE:** 730 дней / 2 года (конфигурируемо через `EVENT_ARCHIVE_RETENTION_DAYS=730`)
- **После 2 лет:** hard-delete ИЛИ экспорт в long-term storage (определяется Product Owner)

**Пример:**
```
День 1 (2026-07-12):   Событие логируется в EVENT_HOT
День 31 (2026-08-11):  Это событие старше 30 дней → перемещается в EVENT_ARCHIVE
День 731 (2028-07-12): Это событие старше 730 дней в archive → удаляется (hard-delete) или экспортируется
```

**Рекомендация:** ✅ 730 дней (2 года) рекомендуется:
- Соответствует типовым требованиям налогообложения/аудита (многие юрисдикции требуют 2-летнего хранения финансовых записей)
- Хватает для расследования инцидентов (старые incidents редко требуют более чем 1 год история)
- Уменьшает storage costs (30-дневный hot остаётся компактным)

---

## 5 открытых вопросов для Product Owner

### Вопрос 1: Hot/Archive структура — две таблицы или одна таблица с флагом?

**Два подхода:**

**Вариант A: Две физические таблицы (РЕКОМЕНДУЕТСЯ)**
```sql
CREATE TABLE event_hot (
  id CUID PRIMARY KEY,
  userId UUID FK,
  eventType VARCHAR(50),
  metadata JSON,
  createdAt TIMESTAMP INDEXED
  -- Индексы: (userId, eventType, createdAt)
);

CREATE TABLE event_archive (
  id CUID PRIMARY KEY,
  userId UUID FK,
  eventType VARCHAR(50),
  metadata JSON,
  createdAt TIMESTAMP INDEXED
  -- Индексы: только (userId, createdAt)
);
```

**Вариант B: Одна таблица с флагом archived**
```sql
CREATE TABLE event (
  id CUID PRIMARY KEY,
  userId UUID FK,
  eventType VARCHAR(50),
  metadata JSON,
  archived BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP INDEXED
  -- Индексы: (archived, createdAt)
);
```

**Анализ:**

| Критерий | Две таблицы | Одна таблица |
|----------|-----------|-------------|
| Скорость запросов `EVENT_HOT` | ✅ Быстро (маленькая таблица) | ⚠️ WHERE archived=false на каждом |
| Индексирование | ✅ Оптимально для каждой | ⚠️ Компромисс |
| Сложность операций архивирования | ⚠️ INSERT SELECT + DELETE | ✅ UPDATE archived=true |
| Будущее: миграция архива в S3/другую БД | ✅ Легко | ❌ Сложно |
| Хранилище | ✅ Эффективно (маленькая hot) | ⚠️ Вся история в одной таблице |

**РЕКОМЕНДАЦИЯ:** ✅ **Две таблицы**
- `EVENT_HOT` остаётся быстрой и узкой
- `EVENT_ARCHIVE` логически отделена и может быть оптимизирована отдельно
- Подход соответствует лучшим практикам больших систем логирования (ELK Stack, Splunk, etc.)

---

### Вопрос 2: Retention policy — 730 дней для archive или другое значение?

**Варианты:**

| Вариант | Дни | Соответствие | Хранилище |
|---------|-----|--------------|-----------|
| Минимальный | 90 | Краткое хранилище, соответствует GDPR "минимум необходимый" | ~5 GB/месяц |
| **Рекомендуемый** | **730** | **Налоговые требования (2 года), расследование инцидентов** | **~60 GB/месяц** |
| Максимальный | 1825 | 5-летнее хранилище, полный аудит track | ~150 GB/месяц |

**РЕКОМЕНДАЦИЯ:** ✅ **730 дней (2 года)**
- Соответствует типовым требованиям налоговой отчётности для SaaS-сервисов
- Достаточно для исторического анализа и расследований
- После 2 лет: hard-delete ИЛИ экспорт (осталось решить с PO)

---

### Вопрос 3: User self-service — могут ли пользователи видеть свои логи?

**Два подхода:**

**Вариант A: Да, users могут видеть свои логи (РЕКОМЕНДУЕТСЯ)**
- **Endpoint:** `GET /api/audit/events/me`
- **Параметры:** `?startDate=...&endDate=...&eventTypes=...`
- **Доступ:** только события текущего пользователя, только last 30 дней
- **Назначение:** пользователи могут отследить свои операции (для прозрачности, отчёты)

**Вариант B: Нет, только админы видят логи**
- **Упростить:** логирование остаётся только для внутреннего аудита
- **Недостаток:** пользователи не могут проверить историю своих действий

**РЕШЕНИЕ PRODUCT OWNER:** ✅ **Да, пользователи видят свои логи (Вариант A), но ТОЛЬКО необходимая информация**
- Повышает доверие ("я вижу, что система логирует")
- Соответствует GDPR: пользователь имеет право на access to personal data
- Улучшает UX: пользователи могут отследить когда произошла ошибка/потеря данных
- Ограничения безопасности: только 30 дней, только свои события
- **НОВОЕ:** UI показывает только essential поля (eventType, createdAt, status), НЕ всю metadata
  * Для user-facing UI: скрыть техническую metadata (IP, браузер и т.д.)
  * API `/api/audit/events/me` все равно вернёт полную data, но UI фильтрует display

---

### Вопрос 4: Logging detail — логировать все поля или только ключевые?

**Два подхода:**

**Вариант A: Только ключевые поля (РЕКОМЕНДУЕТСЯ)**
```json
{
  "book_updated": {
    "bookId": "...",
    "title": "...",      // старое значение
    "titleNew": "...",   // новое значение
    "genre": "...",
    "timestamp": "2026-07-12T10:00:00Z"
  }
}
```

**Вариант B: Все поля (full diff)**
```json
{
  "book_updated": {
    "bookId": "...",
    "before": { /* все поля книги */ },
    "after": { /* все поля книги */ },
    "timestamp": "2026-07-12T10:00:00Z"
  }
}
```

**Анализ:**

| Критерий | Ключевые | Все |
|----------|----------|-----|
| Размер БД (годовой) | ~5 GB | ~50 GB |
| Скорость архивирования | ✅ Быстро | ⚠️ Медленно |
| Полезность для аудита | ✅ Достаточно | ✅ Максимум |
| GDPR compliance | ✅ Минимум данных | ⚠️ Максимум (PII) |

**РЕКОМЕНДАЦИЯ:** ✅ **Только ключевые поля (Вариант A)**
- Меньше хранилища
- Быстрее обработка
- Соответствует GDPR: минимум персональных данных
- Достаточно для аудита и отследивания изменений
- Если понадобятся детали: можно всегда добавить full diff позже

**Ключевые поля по типу события (PRODUCT OWNER решение):**
- `login_success`, `login_failure`: **timestamp, ipAddress, country, userAgent (browser)**
- `register_success`: email, role
- `logout`: timestamp
- `book_*`: bookId, title, genre, status
- `chapter_*`: chapterId, bookId, title
- `scene_*`: sceneId, chapterId, title
- `ai_request_*`: expertType, tokenCount, durationMs, status
- `subscription_*`: planId, status, startDate, endDate
- `payment_*`: amount, status, provider

---

### Вопрос 5: Archive compression — удалять ли из hot при переносе в archive?

**Два подхода:**

**Вариант A: Удалять из hot (РЕКОМЕНДУЕТСЯ)**
```sql
-- Cron job (ежедневно):
INSERT INTO event_archive 
  SELECT * FROM event_hot WHERE createdAt < now() - interval '30 days';

DELETE FROM event_hot 
  WHERE createdAt < now() - interval '30 days';
```

**Вариант B: Не удалять из hot (копировать)**
```sql
-- Cron job (ежедневно):
INSERT INTO event_archive 
  SELECT * FROM event_hot WHERE createdAt < now() - interval '30 days';

-- Оставить в event_hot (не удалять)
```

**Анализ:**

| Критерий | Удалять | Не удалять |
|----------|---------|-----------|
| Размер `EVENT_HOT` | ✅ ~30 дней всегда | ⚠️ Растёт постоянно |
| Скорость запросов | ✅ Быстро (маленькая таблица) | ⚠️ Медленнеет со временем |
| Занятое место | ✅ Минимум | ❌ ~730/30 = 24x больше |
| Сложность восстановления | ⚠️ Если нужна история — только из archive | ✅ Можно восстановить из hot |

**РЕКОМЕНДАЦИЯ:** ✅ **Удалять из hot при переносе в archive (Вариант A)**
- `EVENT_HOT` остаётся тонкой и быстрой (всегда ~30 дней)
- Чистое разделение: hot для реальных операций, archive для истории
- Если запрос за более чем 30 дней — идёт в `EVENT_ARCHIVE` (явная семантика)
- Экономит storage (не храним дубликаты)

---

## Контракт Repository (Step-03)

Архитектура определяет 5 функций repository слоя для работы с событиями:

```typescript
// Repository contract for Event logging
export async function logEvent(
  userId: string,
  eventType: string,
  metadata?: Record<string, any>
): Promise<Event>

export async function getUserEventLog(
  userId: string,
  startDate: Date,
  endDate: Date,
  eventTypes?: string[]
): Promise<Event[]>

export async function getSystemEventLog(
  startDate: Date,
  endDate: Date,
  eventTypes?: string[],
  userId?: string
): Promise<Event[]>

export async function archiveOldEvents(
  olderThanDays: number
): Promise<{ movedCount: number }>

export async function deleteArchivedEvents(
  olderThanDays: number
): Promise<{ deletedCount: number }>
```

**Назначение:**
1. `logEvent` — основной entry point для логирования событий
2. `getUserEventLog` — получить события конкретного пользователя (для `/api/audit/events/me`)
3. `getSystemEventLog` — получить все события системы (для админ-панели)
4. `archiveOldEvents` — cron job переносит события > 30 дней в archive
5. `deleteArchivedEvents` — cron job удаляет события > 730 дней из archive

**Реализация:** Step-03

---

## API Endpoints (Step-05)

Архитектура определяет 3 read-only API endpoint для доступа к логам:

### 1. GET /api/audit/events/me (Protected, User)
```
Получить события текущего пользователя за последние 30 дней
Параметры: ?startDate=...&endDate=...&eventTypes=...
Ответ: { events: Event[], total: number }
```

### 2. GET /api/audit/events (Protected, Admin Only)
```
Получить все события системы (все пользователи)
Параметры: ?userId=...&startDate=...&endDate=...&eventTypes=...
Ответ: { events: Event[], total: number, pagination: {...} }
```

### 3. GET /api/audit/events/stats (Protected, Admin Only)
```
Статистика: события по типам, по пользователям
Параметры: ?startDate=...&endDate=...
Ответ: { 
  eventsByType: { [eventType]: count },
  eventsByUser: { [userId]: count },
  mostActiveUsers: [...],
  totalEvents: number
}
```

**Реализация:** Step-05

---

## Зависимости

### Зависит от:
- ✅ **Sprint 30 (ADR-0015):** Multi-user auth system — Event.userId должен ссылаться на User table
- ✅ **Sprint 31 (ADR-0016):** Billing system — 6 из 23 типов событий относятся к биллингу (subscription_*, payment_*)

### Не требует:
- ✅ Никаких изменений в domain model (Book/Chapter/Scene остаются как есть)
- ✅ Никаких изменений в AI Bus или операциях

### Подготавливает:
- ✅ **Step-02:** Prisma migration (Event таблицы)
- ✅ **Step-03:** Repository layer (eventRepository.ts)
- ✅ **Step-04:** Application layer (логирование в бизнес-логике)
- ✅ **Step-05:** API endpoints
- ✅ **Step-06:** Cron jobs (архивирование/удаление)

---

## Отклонения от Step Card

**Нет отклонений.** ADR-0017 полностью соответствует требованиям Step Card:
- ✅ Документирована архитектура с 23 типами событий
- ✅ Предложена и мотивирована стратегия hot/archive (две таблицы)
- ✅ Рекомендована retention policy (30 дней hot, 730 дней archive)
- ✅ Определён repository контракт (5 функций)
- ✅ Определены API endpoints (3 read-only endpoint)
- ✅ Явно представлены 5 Product Owner вопросов с рекомендациями

---

## Что дальше (Stop Condition)

**Это Step-01: Архитектурное решение (только ADR, БЕЗ кода).**

Следующие шаги (только после утверждения этого ADR):
1. **Step-02:** Prisma schema migration (Event таблицы)
2. **Step-03:** Repository layer (eventRepository.ts — 5 функций)
3. **Step-04:** Integration in business logic (логирование операций)
4. **Step-05:** API endpoints (/api/audit/*)
5. **Step-06:** Cron jobs (архивирование и удаление)
6. **Step-07:** UI для админ-панели (просмотр логов)

**STOP CONDITION:**
Не создавать Step-02 без явного решения Product Owner по всем 5 вопросам выше.

---

## Соответствие Scope

✅ **Allowed paths — используются:**
- `docs/adr/ADR-0017-logging-audit-architecture.md` (создан)
- `docs/task-bus/queue/active/Sprint-32-Step-01.md` (moved from pending)
- Никаких других файлов не модифицировались

✅ **Forbidden paths — НЕ трогались:**
- `apps/studio/` (БЕЗ изменений — это только архитектура)
- `docs/task-bus/queue/done/` (ничего не архивируется без STATUS: OK)

---

## Валидация

✅ **Архитектурная документация:**
- ✅ ADR-0017 полна и логична
- ✅ 5 Product Owner вопросов ясно представлены
- ✅ Каждый вопрос имеет анализ и рекомендацию
- ✅ Зависимости правильно идентифицированы
- ✅ Stop Condition ясен

✅ **Соответствие CLAUDE.md:**
- ✅ Язык: Russian ✓
- ✅ Без кода (это архитектура)
- ✅ Честный анализ без гадания

---

## Статус: ГОТОВО К REVIEW

✅ ADR-0017 готов  
✅ 5 PO вопросов задокументированы с рекомендациями  
✅ Repository контракт определён  
✅ API endpoints спланированы  
✅ Зависимости правильны  
✅ Stop Condition ясен  

**Ожидание:** Product Owner approval на 5 открытых вопросов перед Step-02.

**Не коммитируется:** Файл ожидает `STATUS: OK` перед коммитом и архивом в done/.
