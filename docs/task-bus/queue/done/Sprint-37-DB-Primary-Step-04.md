id: Sprint-37-DB-Primary-Step-04
name: "Refactor useWorkspaceController.ts: Await Database Primary Storage"
type: implementation

## Контекст

Step-03 переделала `workspaceStorage.ts` на database-primary. Step-04 адаптирует `useWorkspaceController.ts` для работы с этой новой логикой.

**Текущее состояние useWorkspaceController:**
- `restore` effect: `loadWorkspace()` async, `await`'s, приватизирует workspace state
- `persist` effect: `saveWorkspace()` async, вызывается на каждой мутации
- `onSaveError` и другие обработки ошибок

**Что меняется в Step-04:**
- `loadWorkspace()` теперь database-first (Step-03), но всё ещё async
- Fallback стратегия для DB-unavailable (зависит от Step-01)
- Ephemeral state остаётся в localStorage (Step-03 раздела)
- Все мутации (`createBook`, `updateBook`, etc.) всё ещё `await` `saveWorkspace()`

**Нет ломающихся изменений в API контроллера** — это обновление внутренней логики, не поверхности.

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/workspace/useWorkspaceController.ts (логика restore/persist effects)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/storage/workspaceStorage.ts (уже сделано в Step-03)
- apps/studio/src/app/api/workspace/route.ts
- Любые компоненты вроде page.tsx, EditorArea.tsx, etc.
- apps/studio/src/domain/workspace.ts

## Объектив

1. **Update restore effect:**
   - `await loadWorkspace()` остаётся async
   - Обработать случай если DB недоступна (в зависимости от fallback strategy из Step-01)
   - Если fallback=error: catch и показать ошибку в UI
   - Если fallback=hybrid: использовать empty books если DB fails

2. **Update persist effect:**
   - Остаётся `await saveWorkspace()`
   - На failure DB write: обработать в зависимости от fallback strategy
   - Ephemeral state (activeBookId, etc.) теперь управляется отдельно в Step-03

3. **Error handling:**
   - `onSaveError` callback — может ли это быть simplified?
   - Или полностью удалить SYNC_PENDING_KEY логику?

4. **Sync warning:**
   - `syncWarning` из Step-03 всё ещё нужен для UI warning
   - Убедиться что `getSyncWarning()` вызывается при необходимости

## Rules

1. **Не ломать API контроллера:**
   - `useWorkspaceController()` экспортирует те же функции
   - Никакой caller (page.tsx, components) не должен измениться

2. **Fallback strategy:**
   - Зависит от решения Product Owner в Step-01
   - Реализовать выбранный вариант (A: error, или B: hybrid fallback)

3. **Error boundaries:**
   - Убедиться что errors в restore/persist не crash app
   - Graceful degradation

## Validation

1. **TypeScript чисто:**
   ```bash
   npx tsc --noEmit
   ```

2. **ESLint чисто:**
   ```bash
   npx eslint src/workspace/useWorkspaceController.ts
   ```

3. **Prettier чисто:**
   ```bash
   npx prettier --check src/workspace/useWorkspaceController.ts
   ```

4. **Функции экспортированы:**
   - `useWorkspaceController()` остаётся главный экспорт
   - Типы остаются совместимы

5. **git status:**
   ```
   M  apps/studio/src/workspace/useWorkspaceController.ts
   ```

6. **npm run build:**
   - Должен компилироваться без ошибок
   - Может быть другие type errors в других файлах (не в области Step-04), но в самом useWorkspaceController.ts не должно быть

## Output

Обновлённый useWorkspaceController.ts с:
1. Database-primary aware restore effect
2. Proper error handling для DB unavailability
3. Fallback strategy реализована (в зависимости от Step-01)
4. Ephemeral state management чистая
5. API контроллера НЕ изменилась (для callers)

## Stop Condition

Не коммитить без подтверждения Product Owner.
