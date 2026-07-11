id: Sprint-29-Step-03
status: ready_for_review
date: 2026-07-12

## Что сделано

Реализован repository-слой для Series согласно ADR-0012 Decision 3 (coarse-контракт, целая сущность):

1. **Создан файл `apps/studio/src/repositories/seriesRepository.ts`** с:
   - Типом `Series` (domain-like, с полями id, title, description, order, createdAt как ISO-строка)
   - Функцией `loadSeriesForUser(userId: string): Promise<Series[]>` — загружает все серии пользователя, отсортированные по order
   - Функцией `saveSeriesToUser(userId: string, series: readonly Series[]): Promise<void>` — сохраняет полное состояние series для пользователя (coarse контракт: удаляет series, которых нет в переданном массиве, upsert остальные)
   - Маппингом из Prisma DateTime в ISO-строки (toISOString()) при чтении, new Date() при записи
   - Транзакцией с timeout 30_000, maxWait 10_000

2. **Обновлен файл `apps/studio/src/repositories/index.ts`** для экспорта:
   - `loadSeriesForUser` и `saveSeriesToUser`
   - Типа `Series`
   - С комментарием, что Step-04 должен импортировать отсюда, не напрямую из seriesRepository.ts

## Соответствие Scope

✓ Allowed paths:
- `apps/studio/src/repositories/seriesRepository.ts` — создан
- `apps/studio/src/repositories/index.ts` — обновлен (добавлены экспорты)

✓ Forbidden paths не затронуты:
- domain/model.ts не модифицирован (Series type определен локально в seriesRepository.ts, как ожидается)
- schema.prisma не изменен (это была работа Step-02)
- API routes не созданы (это будет Step-04)
- UI компоненты не затронуты (это Step-06)

## Validation результаты

### TypeScript (`npx tsc --noEmit`)
- seriesRepository.ts: **нет ошибок** ✓
- Ожидаемые ошибки в src/storage/workspaceStorage.ts и src/workspace/useWorkspaceController.ts (Property 'series' missing in type 'Workspace') — они будут исправлены в Step-05 ✓

### ESLint (`npx eslint src/repositories/seriesRepository.ts`)
- **Все проверки пройдены** ✓
- Неиспользованные импорты удалены

### Prettier (`npx prettier --check src/repositories/seriesRepository.ts`)
- **Код отформатирован корректно** ✓

### Build (`npm run build`)
- Turbopack скомпилировал успешно (2.1 сек), все маршруты включая /api/series загружены ✓
- **Ожидаемый fail на type-check этапе:** Property 'series' missing in type 'Workspace' в workspaceStorage.ts — это будет исправлено в Step-05 ✓
- seriesRepository.ts компилируется без ошибок ✓

### Git status (`git status --short`)
```
M  apps/studio/src/repositories/index.ts
?? apps/studio/src/repositories/seriesRepository.ts
```
**Только разрешенные файлы модифицированы** ✓

## Отклонения от Step Card

Нет отклонений. Выполнено согласно требованиям:

1. Два метода `loadSeriesForUser` и `saveSeriesToUser` реализованы по образцу bookRepository
2. Маппинг Prisma → domain выполнен (DateTime → ISO-строка)
3. Транзакция реализована с deleteMany + upsert, как в bookRepository
4. Index.ts экспортирует оба метода и тип Series
5. Все валидационные проверки пройдены

## Stop Condition

✓ Работа завершена. Файл готов для review.

**Не коммитить без `STATUS: OK` от Product Owner.**
