id: Sprint-29-Step-03
name: "Repository layer: seriesRepository.ts с loadSeriesForUser/saveSeriesToUser"
type: implementation

## Контекст

Step-02 завершила Prisma schema + миграция. Step-03 создаёт чистый server-only repository-слой
поверх этой схемы, без HTTP и без UI, по образцу, уже использованному в Sprint-24 (ADR-0012).

Контракт построен по ADR-0012's Decision 3 (coarse, whole-tree операции):
- `loadSeriesForUser(userId: string): Promise<Series[]>`
- `saveSeriesToUser(userId: string, series: readonly Series[]): Promise<void>`

Это как bookRepository, но для Series.

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/repositories/seriesRepository.ts (новый файл)
- apps/studio/src/repositories/index.ts (добавить экспорт из seriesRepository.ts)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/domain/model.ts (не обновляется этим шагом)
- apps/studio/prisma/schema.prisma (это был Step-02)
- apps/studio/src/app/api/** (это Step-04)
- apps/studio/src/workspace/useWorkspaceController.ts (это Step-05)
- Любые UI-компоненты (это Step-06)

## Rules

1. **seriesRepository.ts — два метода:**

   ```typescript
   export async function loadSeriesForUser(userId: string): Promise<Series[]> {
     // prisma.series.findMany({ where: { userId }, orderBy: { order: "asc" } })
     // Маппинг из Prisma-сущности в domain Series
     // Все series для текущего пользователя, отсортированные по order
   }

   export async function saveSeriesToUser(
     userId: string,
     series: readonly Series[]
   ): Promise<void> {
     // Prisma-транзакция: deleteMany + upsert, как в bookRepository
     // Удалить series, которых нет в переданном массиве
     // Upsert остальные (create or update) по id
   }
   ```

2. **Domain-to-Prisma маппинг:**
   - Series.createdAt и updatedAt — строки ISO (toISOString()), как и в Book
   - Prisma DateTime — при чтении: `.toISOString()`, при записи: `new Date(series.createdAt)`
   - Поле order: Int, читается как есть (не нужно конвертации)

3. **index.ts экспорт:**
   Добавить в apps/studio/src/repositories/index.ts экспортирование этих двух функций,
   с комментарием о том, что Step-04 должен импортировать отсюда, не напрямую из
   seriesRepository.ts (внутреннее разбиение файлов — деталь реализации).

4. **Транзакция в saveSeriesToUser:**
   - Как в bookRepository: `prisma.$transaction(async (tx) => {...})`
   - Timeout: 30_000, maxWait: 10_000
   - Сначала deleteMany(where: { userId, id: { notIn: [ids из переданных series] } })
   - Затем upsert в цикле по каждой series, явно сохраняя order

## Validation

Все команды из apps/studio/:

1. **`npx tsc --noEmit`**
   - Ошибки в domain/model.ts (Step-03 не обновляет domain — это Step-03б, но там ошибки
     ожидаемы, так как domain используется)
   - Ошибки в useWorkspaceController.ts (не обновлена ещё, это Step-05)
   - В самом seriesRepository.ts НЕ должно быть ошибок

2. **`npx eslint src/repositories/seriesRepository.ts`** — чисто

3. **`npx prettier --check src/repositories/seriesRepository.ts`** — чисто

4. **`npm run build`**
   - Ожидается падение на useWorkspaceController.ts (как в Sprint-24-Step-05)
   - Но seriesRepository.ts должна скомпилироваться без ошибок

5. **`git status --short`** после завершения:
   ```
   M  apps/studio/src/repositories/index.ts
   ?? apps/studio/src/repositories/seriesRepository.ts
   ```

## Output

ARP файл в docs/task-bus/queue/active/, указать:
1. Содержимое seriesRepository.ts (функции + маппинги)
2. Результат tsc/eslint/prettier (все чисто)
3. Результат `npm run build` (ожидаемое падение на useWorkspaceController)
4. `git status --short`

## Stop Condition

Не коммитить без подтверждения Product Owner.
