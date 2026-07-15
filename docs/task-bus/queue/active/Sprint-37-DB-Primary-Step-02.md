id: Sprint-37-DB-Primary-Step-02
name: "Prisma Query Optimization: Indexes & Batch Load Strategy"
type: implementation

## Контекст

Step-01 уточнила архитектуру: база данных будет primary source of truth, loadWorkspace() будет опрашивать БД первой для всех books. Это означает, что каждая загрузка приложения будет выполнять большой query вроде:

```sql
SELECT book.*, chapters.*, scenes.*, characters.*, ideas.*, assistantThreads.*, chatMessages.*
FROM book WHERE userId = ? AND deletedAt IS NULL
```

На Phase 1 (единственный пользователь, несколько книг) это оптимально. Но нужно убедиться:
1. Индексы есть и правильные
2. Batch-load стратегия документирована
3. N+1 queries избежаны

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/prisma/schema.prisma (добавить/проверить индексы)
- docs/architecture/query-optimization.md (новый файл с документацией)

Forbidden paths (НИКЕГДА не трогать):
- apps/studio/src/repositories/bookRepository.ts (логика не меняется на этом шаге)
- apps/studio/src/storage/workspaceStorage.ts (это Step-03)
- Миграции (они создаются в Step-03 если нужны)

## Объектив

1. **Проверить текущие индексы** в schema.prisma:
   - Book: `@@index([userId, deletedAt])` — есть, хорошо
   - Chapter: `@@index([bookId])` — есть
   - Scene: `@@index([chapterId])` — есть
   - Character: `@@index([bookId])` — есть
   - Idea: `@@index([bookId])` — есть
   - AssistantThread: `@@index([bookId])` и `@@index([bookId, role])` — есть
   - ChatMessage: `@@index([threadId])` — есть

2. **Добавить недостающие индексы если нужны:**
   - Для массовых deletes по bookId (если нет, добавить composite indxes)

3. **Документировать query patterns** в новом файле docs/architecture/query-optimization.md:
   - Batch load: `bookRepository.loadBooksForUser()` делает ONE query с `include` nested relations (не N+1)
   - Объяснить `bookInclude` Prisma pattern
   - Примечание: на Phase 2+ может потребоваться pagination или lazy-load

## Rules

1. **Индексы в schema.prisma** — добавлять ТОЛЬКО если действительно нужны:
   - Для unique constraints, foreign keys, filter queries
   - НЕ добавлять "на всякий случай" (premature optimization)

2. **Batch strategy документирование:**
   - Описать текущий bookInclude pattern
   - Объяснить почему это избегает N+1
   - Примечание: на Phase 2 может понадобиться pagination/cursors

3. **Migration rules:**
   - Если добавляются новые индексы, НЕ создавать миграцию (это сделает Step-03)
   - Просто обновить schema.prisma

## Validation

1. **schema.prisma валиден:**
   ```bash
   cd apps/studio
   npx prisma validate
   ```

2. **docs/architecture/query-optimization.md существует:**
   - 1-2 страницы документации
   - Объясняет текущий batch-load pattern (bookInclude)
   - Даёт рекомендации для Phase 2+

3. **git status:**
   ```
   M  apps/studio/prisma/schema.prisma (если добавились индексы)
   ?? docs/architecture/query-optimization.md
   ```

## Output

1. Обновленный schema.prisma с индексами (если нужны)
2. docs/architecture/query-optimization.md с документацией по current batch-load strategy
3. Примечание о том, почему текущие индексы достаточны для Phase 1

## Stop Condition

Не коммитить без подтверждения Product Owner.
