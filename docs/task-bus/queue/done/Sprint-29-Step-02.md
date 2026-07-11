id: Sprint-29-Step-02
name: "Prisma schema + миграция: Series таблица и Book.seriesId"
type: implementation

## Контекст

Step-01 (ADR-0014) заморозил архитектурное решение:
- Series таблица с полями: id, userId, title, description, createdAt, updatedAt, order
- Book.seriesId — опциональная nullable ссылка на Series (many-to-one)
- Каскадное удаление: Series удаляется, Book теряют seriesId

Этот step ИСКЛЮЧИТЕЛЬНО о схеме Prisma и миграции. Никакого TypeScript-кода, никакого
API-роута, никакого UI. Только:
1. Добавить model Series в apps/studio/prisma/schema.prisma
2. Добавить seriesId в model Book
3. Запустить `prisma migrate dev --name add-series`
4. Проверить, что миграция создалась и может быть применена

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/prisma/schema.prisma (добавить Series model, добавить seriesId в Book)
- apps/studio/prisma/migrations/ (новая папка с миграцией, создаётся автоматически prisma)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/domain/model.ts (это Step-03)
- apps/studio/src/repositories/** (это Step-03)
- apps/studio/src/app/api/** (это Step-04)
- apps/studio/src/workspace/useWorkspaceController.ts (это Step-05)
- Любые UI-компоненты (это Step-06)

## Rules

1. **Schema.prisma только:** Prisma model Series должна содержать:
   - id String @id @default(cuid()) — уникальный идентификатор
   - userId String (обязательное) — владелец серии, ссылка на User
   - user User @relation(...) с onDelete: Cascade — если User удаляется, Series удаляется
   - title String — название серии
   - description String @default("") — описание (опциональное)
   - order Int @default(0) — порядок в UI (по умолчанию 0, пока не переделывается в Step-05)
   - createdAt DateTime @default(now())
   - updatedAt DateTime @updatedAt
   - books Book[] (обратная ссылка через Book.series, для удобства запросов)

2. **Book расширяется:**
   - seriesId String? (nullable, опциональная ссылка)
   - series Series? @relation(fields: [seriesId], references: [id], onDelete: SetNull)
   
   **Важно:** onDelete: SetNull, не Cascade. Когда Series удаляется, книги остаются, но
   теряют seriesId.

3. **Индексы:**
   - На Book: @@index([seriesId]) для быстрого поиска "все книги в серии X"
   - На Series: @@index([userId]) для быстрого поиска "все серии пользователя Y"
   - На Series: @@index([userId, order]) если будет сортировка по пользователю + порядку

4. **Миграция:** запустить `prisma migrate dev --name add-series` из apps/studio/
   - Миграция должна создаться в apps/studio/prisma/migrations/
   - Название файла вроде `20260712XXXXXX_add_series/migration.sql`
   - Файл миграции должен содержать CREATE TABLE series, ALTER TABLE book ADD seriesId

## Validation

Все команды из apps/studio/:

1. **`npx prisma migrate dev --name add-series`**
   - Успешный запуск без ошибок
   - Новая миграция должна быть создана в apps/studio/prisma/migrations/
   - Schema.prisma обновлена (npx prisma generate)

2. **`npx tsc --noEmit`**
   - Должны быть ошибки в domain/model.ts и useWorkspaceController.ts (ожидаемо — они не
     обновлены этим шагом, это Step-03/05)
   - Никаких других ошибок, связанных с Prisma-схемой

3. **Проверка миграции вживую (без полного npm run dev):**
   - Если у вас есть запущенный postgres, можно проверить `psql literary_studio -c "\dt"` и
     убедиться, что таблица series есть, и в table book есть колонка seriesId
   - Или просто проверить, что файл миграции создан и содержит CREATE TABLE series

4. **`git status --short`** после завершения:
   - Только файлы из Allowed paths:
     ```
     M  apps/studio/prisma/schema.prisma
     ?? apps/studio/prisma/migrations/20260712XXXXXX_add_series/migration.sql
     ?? apps/studio/prisma/migrations/20260712XXXXXX_add_series/.migration_lock.toml
     ```
   - Никаких изменений в других папках

## Output

ARP файл в docs/task-bus/queue/active/, указать:
1. Точный вывод `npx prisma migrate dev --name add-series`
2. Содержимое созданного migration.sql файла
3. Результат `npx tsc --noEmit` (перечислить ожидаемые ошибки в domain/model.ts)
4. Результат `git status --short`

## Stop Condition

Не коммитить без подтверждения Product Owner.
