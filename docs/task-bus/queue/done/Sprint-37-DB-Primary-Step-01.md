id: Sprint-37-DB-Primary-Step-01
name: "ADR-0016: Database Primary Storage Architecture"
type: architecture

## Контекст

Sprint 24 (ADR-0012) ввела dual-mode хранилище: localStorage пишется первым, затем асинхронный PUT в `/api/workspace`. База данных является fallback, НЕ primary source of truth. Это привело к усложнённой логике в `workspaceStorage.ts` (SYNC_PENDING_KEY, race conditions, миграция на лету).

Спринт 37 делает базу данных первичным источником истины (primary source of truth), упрощая логику и убирая необходимость в SYNC_PENDING_KEY workaround.

## Scope

Allowed paths (ТОЛЬКО):
- docs/adr/ADR-0016-database-primary-storage.md (новый файл)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/storage/workspaceStorage.ts (это Step-03)
- apps/studio/src/workspace/useWorkspaceController.ts (это Step-04)
- apps/studio/src/repositories/** (это Step-02)
- Любые implementation-файлы на этом шаге

## Объектив

Решить в ADR:
1. **Database Primary Decision** — базу данных всегда опрашиваем первой для `books`, localStorage теперь только для ephemeral UI state (`activeBookId`, `selectedChapterId`, etc.)
2. **Ephemeral State Split** — чётко определить, какие поля Workspace остаются в localStorage (activeBookId, selectedChapterId, selectedSceneId, selectedCharacterId, selectedAssistantMode)
3. **Remove SYNC_PENDING_KEY** — больше не нужен, так как DB всегда primary
4. **Fallback Behavior** — что делать если база недоступна: для books — ошибка? или localStorage fallback только при первой загрузке? (уточнить)
5. **Data Migration Path** — как миграция данных из localStorage в БД происходит (на первой загрузке или явно?)
6. **Performance Consideration** — обосновать, что batch load + индексы (Step-02) даст приемлемую производительность

## Rules

1. **ADR структура:**
   - Context: текущее состояние (dual-mode ADR-0012), зачем меняемся
   - Decision: каждое решение выше (1-6)
   - Consequences: что упрощается, что осложняется
   - Related ADRs: ADR-0012, ADR-0003, ADR-0015

2. **Не гадать о реализации** — это Step-01, архитектурное решение, не код

3. **Fallback стратегия** — критично уточнить с Product Owner:
   - Вариант A: если DB недоступна, показать ошибку (strict database-only)
   - Вариант B: если DB недоступна, использовать localStorage fallback для books (hybrid)
   - Рекомендация: Вариант B сложнее, но безопаснее для пользователей

4. **Эфемерное состояние** — явно перечислить поля:
   - Остаются в localStorage: activeBookId, selectedChapterId, selectedSceneId, selectedCharacterId, selectedAssistantMode
   - Никогда не в БД: collapse/expand state (уже ephemeral в page.tsx)

## Validation

1. **ADR написан корректно:**
   - `npx tsc --noEmit` — нет ошибок (это текстовой файл, но проверим структуру документа)
   - Каждое Решение (Decision) конкретно и проверяемо
   - Последствия (Consequences) реалистичны

2. **git status:**
   ```
   ?? docs/adr/ADR-0016-database-primary-storage.md
   ```

## Output

Поместить ADR файл в `docs/adr/ADR-0016-database-primary-storage.md` с:
1. Все 6 решений выше
2. Clear Consequences раздел
3. Related ADRs
4. Примечание: "Accepted pending Product Owner approval of fallback strategy (Decision 4)"

## Stop Condition

Не коммитить без подтверждения Product Owner.
