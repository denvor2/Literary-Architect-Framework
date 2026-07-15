id: Sprint-37-DB-Primary-Step-03
name: "Refactor workspaceStorage.ts: Database Primary, Remove SYNC_PENDING_KEY"
type: implementation

## Контекст

Step-01 решила: база данных primary source of truth для `books`. Step-02 подтвердила индексы в порядке. Step-03 реализует это в `workspaceStorage.ts`:

**Текущая логика (ADR-0012 dual-mode):**
1. `loadWorkspace()` читает localStorage
2. Затем асинхронно опрашивает БД
3. Если БД пуста — возвращает localStorage (migration to DB)
4. Если БД не пуста — возвращает БД (но с SYNC_PENDING_KEY workaround для race conditions)
5. `saveWorkspace()` пишет localStorage ПЕРВЫМ, затем асинхронно PUT в БД

**Новая логика (database-primary):**
1. `loadWorkspace()` читает БД для `books`
2. Читает localStorage ТОЛЬКО для ephemeral UI state
3. Если БД недоступна → Fallback (strategy уточнит Product Owner в Step-01)
4. `saveWorkspace()` пишет БД (через `/api/workspace` PUT), затем обновляет ephemeral в localStorage
5. SYNC_PENDING_KEY удаляется — больше не нужен

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/storage/workspaceStorage.ts (полная переделка loadWorkspace()/saveWorkspace())
- apps/studio/prisma/schema.prisma (если Step-02 добавила индексы, этот файл уже изменён)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/workspace/useWorkspaceController.ts (это Step-04)
- apps/studio/src/app/api/workspace/route.ts (не трогать)
- apps/studio/src/repositories/bookRepository.ts (не трогать)
- Любые UI компоненты

## Объектив

1. **Simplify loadWorkspace():**
   - Удалить миграцию-на-лету (push old books to DB)
   - Удалить SYNC_PENDING_KEY логику
   - Иерархия: DB-first для books, localStorage-first для ephemeral
   - Pseudocode:
     ```
     const localEphemeral = readLocalWorkspace() // только ephemeral поля
     const dbBooks = await fetchBooksFromApi() // может быть null (DB недоступна)
     
     if (dbBooks === null) {
       // Fallback: что делать? (Decision 4 из Step-01)
       // Вариант A: throw error
       // Вариант B: return localEphemeral + empty books
     }
     
     return { books: dbBooks, ...localEphemeral }
     ```

2. **Simplify saveWorkspace():**
   - БД-первичный PUT: не возвращаться в localStorage synchronously
   - Хронология: PUT to DB, затем на успехе пиши ephemeral в localStorage
   - Pseudocode:
     ```
     const pushed = await pushBooksToApi(workspace.books)
     if (pushed) {
       writeLocalEphemeral(workspace) // только activeBookId, selectedChapterId, etc.
     } else {
       // DB write failed — что делать? (зависит от fallback strategy из Step-01)
     }
     ```

3. **Split localStorage reads/writes:**
   - `readLocalEphemeralState()` — читает ТОЛЬКО ephemeral поля
   - `writeLocalEphemeralState()` — пишет ТОЛЬКО ephemeral поля
   - Удалить `readLocalWorkspace()`, она больше не нужна (у неё была логика merge с DB)

4. **Remove SYNC_PENDING_KEY:**
   - Удалить `SYNC_PENDING_KEY` const
   - Удалить `readSyncPendingFlag()`, `writeSyncPendingFlag()`
   - Удалить все упоминания sync pending логики

5. **Keep getSyncWarning() если нужен:**
   - Этот export может быть полезен для `SyncWarningBanner.tsx`
   - Но теперь он просто tracks "db-unavailable" (нет "recovered-local-wins")

## Rules

1. **Fallback strategy из Step-01:**
   - Дождаться одобрения Product Owner на Step-01
   - Реализовать ВЫБРАННЫЙ вариант (A или B)
   - Задокументировать выбор в комментарии функции loadWorkspace()

2. **Коммит не содержит бизнес-логику:**
   - Это чистая refactor
   - Поведение остаётся идентично (плюс упрощение)

3. **Тип-сейфти:**
   - `npx tsc --noEmit` — должно быть чисто
   - Особенно внимательно: `Workspace` vs ephemeral-only state

## Validation

1. **TypeScript чисто:**
   ```bash
   npx tsc --noEmit
   ```

2. **ESLint чисто:**
   ```bash
   npx eslint src/storage/workspaceStorage.ts
   ```

3. **Prettier чисто:**
   ```bash
   npx prettier --check src/storage/workspaceStorage.ts
   ```

4. **Функции экспортированы:**
   - `loadWorkspace()` - экспортирует
   - `saveWorkspace()` - экспортирует
   - `getSyncWarning()` - экспортирует (или удаляется если Step-01 решит)

5. **Comments:**
   - Объяснить в комментарии loadWorkspace() fallback strategy
   - Примечание: "Больше не использует SYNC_PENDING_KEY, база данных primary"

6. **git status:**
   ```
   M  apps/studio/src/storage/workspaceStorage.ts
   ```

## Output

Обновлённый workspaceStorage.ts с:
1. Чистой database-first логикой loadWorkspace()
2. Чистой database-first логикой saveWorkspace()
3. Удалённой SYNC_PENDING_KEY логикой
4. Раздельными functions для ephemeral state
5. Clear comments о fallback strategy и почему primary=database

## Stop Condition

Не коммитить без подтверждения Product Owner.
