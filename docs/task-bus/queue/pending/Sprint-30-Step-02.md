id: Sprint-30-Step-02
name: "Prisma schema + миграция: User.role, User.email, User.passwordHash, User.isBlocked"
type: implementation

## Контекст

Step-01 (ADR-0015) заморозил архитектурное решение:
- Две роли: admin, user
- Пользователь имеет email, passwordHash, role, isBlocked
- Существующий пользователь становится admin@localhost без пароля

Этот step ИСКЛЮЧИТЕЛЬНО о схеме Prisma и миграции. Никакого TypeScript-кода, никакого 
API-маршрута, никакого контроллера, никакого UI. Только:
1. Добавить новые поля в User model (email, passwordHash, role, isBlocked)
2. Добавить enum Role с двумя значениями (admin, user)
3. Установить default-значения для существующей записи
4. Запустить prisma migrate dev --name add-auth-fields
5. Проверить, что миграция создалась и может быть применена

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/prisma/schema.prisma (добавить enum Role, расширить User model)
- apps/studio/prisma/migrations/ (новая папка с миграцией, создаётся автоматически)

Forbidden paths (НИКОГДА не трогать):
- apps/studio/src/repositories/** (это Step-03)
- apps/studio/src/app/api/** (это Step-04)
- apps/studio/src/workspace/useWorkspaceController.ts (это Step-05)
- apps/studio/src/components/** (это Step-05)
- Любой TypeScript-код

## Rules

1. **Schema.prisma только:** User model должен содержать:
   ```prisma
   model User {
     id        String   @id @default(cuid())
     email     String   @unique               // NEW
     passwordHash String?                      // NEW, nullable для migration period
     role      Role     @default(user)         // NEW, enum значение
     isBlocked Boolean  @default(false)        // NEW
     createdAt DateTime @default(now())
     books     Book[]
     series    Series[]
   }
   
   enum Role {
     admin
     user
   }
   ```

2. **Обоснование null для passwordHash:**
   - Существующему пользователю (админ) не устанавливается пароль в миграции
   - passwordHash остаётся null до тех пор, пока админ не установит его через восстановление (future)
   - Step-03 будет проверять: if (user.passwordHash === null) => throw error for password check
   - Это временное состояние для админа, который был создан до этого спринта

3. **Миграция:** запустить `prisma migrate dev --name add-auth-fields` из apps/studio/
   - Миграция должна создаться в apps/studio/prisma/migrations/
   - Название файла вроде `20260712XXXXXX_add_auth_fields/migration.sql`
   - SQL должна:
     - ALTER TABLE "User" ADD COLUMN "email" TEXT NOT NULL UNIQUE
     - ALTER TABLE "User" ADD COLUMN "passwordHash" TEXT
     - ALTER TABLE "User" ADD COLUMN "role" "Role" NOT NULL DEFAULT 'user'
     - ALTER TABLE "User" ADD COLUMN "isBlocked" BOOLEAN NOT NULL DEFAULT false
     - UPDATE "User" SET email='admin@localhost', role='admin' WHERE (SELECT COUNT(*) FROM "User") = 1
       (или более точно: первому по createdAt)

4. **Enum Role:** создаётся в schema.prisma один раз, используется как User.role type.
   Значения: admin, user (нижний регистр, как ассоциировано).

## Validation

Все команды из apps/studio/:

1. **`npx prisma migrate dev --name add-auth-fields`**
   - Успешный запуск без ошибок
   - Новая миграция должна быть создана в apps/studio/prisma/migrations/
   - Prisma client перегенерирован

2. **`npx tsc --noEmit`**
   - Ошибки ожидаются в reposito​ries/ и api/ маршрутах (они ещё не использют новые поля)
   - Никаких других ошибок синтаксиса в schema

3. **Проверка миграции вживую (если доступен postgres):**
   - psql literary_studio -c "\d "User"" => должны быть колонки email, passwordHash, role, isBlocked
   - SELECT email, role FROM "User" LIMIT 1; => 'admin@localhost', 'admin'

4. **`git status --short`** после завершения:
   - Только файлы из Allowed paths:
   ```
   M  apps/studio/prisma/schema.prisma
   ?? apps/studio/prisma/migrations/20260712XXXXXX_add_auth_fields/migration.sql
   ```
   - Никаких изменений в других папках

## Output

ARP файл в docs/task-bus/queue/active/, указать:
1. Точный вывод `npx prisma migrate dev --name add-auth-fields`
2. Содержимое созданного migration.sql файла
3. Результат `npx tsc --noEmit` (перечислить ожидаемые ошибки)
4. Результат `git status --short`
5. Если доступен postgres: вывод SELECT email, role FROM "User"; (подтверждение миграции)

## Stop Condition

Не коммитить без подтверждения Product Owner.
