id: Sprint-32-Step-01
name: "ADR-0017: Архитектура логирования и аудита"
type: adr

## Контекст

Sprint 30 завершил многопользовательскую систему (привязка логов к User).
Sprint 31 добавил биллинг (события платежей, смены тариф, автоматический откат).

Теперь Sprint 32 должен реализовать комплексную систему логирования и аудита:
- Логировать события аутентификации (успешный вход, ошибка входа)
- Логировать операции с книгами (создание, обновление, удаление книги/главы/сцены)
- Логировать AI-запросы (эксперт, время выполнения)
- Логировать биллинг-события (платёж, смена тариф, автооткат)
- Разделение горячих логов (текущий период) и архивных (история)
- Стратегия хранения и удаления логов (retention policy)

Этот ADR замораживает архитектурное решение до того, как Step-02 начнёт писать Prisma-схему.

## Decision

### 1. Модель событий (Event model)

Универсальная таблица для всех типов логов:

```
Event {
  id: string (CUID)
  userId: string (FK to User)
  eventType: string (enum: login_success, login_failure, book_created, ...)
  metadata: object (JSON, опционально — контекст события)
  createdAt: DateTime (indexed)
  updatedAt: DateTime
}
```

**eventType перечисление:**
Аутентификация: login_success, login_failure, logout, register_success
Книги: book_created, book_updated, book_deleted
Главы: chapter_created, chapter_updated, chapter_deleted
Сцены: scene_created, scene_updated, scene_deleted
AI: ai_request_line_editor, ai_request_critic, ai_request_reader, ai_request_coauthor
Биллинг: subscription_created, subscription_updated, subscription_expired, subscription_cancelled, payment_created, payment_completed, payment_failed

### 2. Стратегия hot/archive: Две таблицы

EVENT_HOT: события за последние 30 дней (конфигурируемо)
- Полностью индексирована
- Используется для UI

EVENT_ARCHIVE: события старше 30 дней
- Заполняется ежедневным cron job (Step-06)
- Удаляется по retention policy

### 3. Retention Policy

Рекомендуемая политика:
- EVENT_HOT: 30 дней (EVENT_HOT_RETENTION_DAYS=30)
- EVENT_ARCHIVE: 730 дней (2 года, EVENT_ARCHIVE_RETENTION_DAYS=730)
- После 2 лет: hard-delete или экспорт (определяется PO)

### 4. Repository контракт (Step-03)

```typescript
export async function logEvent(userId: string, eventType: string, metadata?: Record<string, any>): Promise<Event>
export async function getUserEventLog(userId: string, startDate: Date, endDate: Date, eventTypes?: string[]): Promise<Event[]>
export async function getSystemEventLog(startDate: Date, endDate: Date, eventTypes?: string[], userId?: string): Promise<Event[]>
export async function archiveOldEvents(olderThanDays: number): Promise<{ movedCount: number }>
export async function deleteArchivedEvents(olderThanDays: number): Promise<{ deletedCount: number }>
```

### 5. API endpoints (Step-05)

GET /api/audit/events/me — логи текущего пользователя
GET /api/audit/events (ADMIN ONLY) — все логи системы
GET /api/audit/events/stats (ADMIN ONLY) — статистика

### 6. Открытые вопросы для Product Owner

1. Hot/Archive: две таблицы или одна с флагом archived?
   - Рекомендация: две таблицы
2. Retention: 730 дней для archive или другое?
   - Рекомендация: 730 дней (2 года)
3. User-self-service: могут ли пользователи видеть свои логи?
   - Рекомендация: да, GET /api/audit/events/me (последние 30 дней)
4. Детальность: логировать все поля или только ключевые?
   - Рекомендация: только ключевые (title, genre, status)
5. Archive compression: удалять ли из hot при переносе в archive?
   - Рекомендация: да, удалять (чистое разделение)

## Stop Condition

Не создавать Step-02 без подтверждения Product Owner.
