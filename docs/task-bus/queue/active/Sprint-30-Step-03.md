id: Sprint-30-Step-03
name: "Repository слой: аутентификация и управление пользователями"
type: implementation

## Контекст

Step-02 завершил Prisma-схему. Теперь repository-слой должен предоставить функции для:
- Поиска пользователя по email
- Проверки пароля
- Создания нового пользователя с хешированием пароля
- Проверки роли пользователя
- Обновления статуса пользователя (заблокировка)

Эти функции будут использованы в Step-04 (API endpoints) и Step-05 (контроллер).

## Scope

Allowed paths (ТОЛЬКО):
- apps/studio/src/repositories/userRepository.ts (полностью переписать/расширить)
- apps/studio/src/repositories/index.ts (экспортировать новые функции)
- apps/studio/package.json (если нужна зависимость bcrypt; проверить, что она есть)

Forbidden paths (НИКОГДА не трогать):
- Приватные key-файлы для JWT или CAPTCHA (они идут в .env.local, не в код)
- apps/studio/src/app/api/** (это Step-04)
- Любой UI-код (это Step-05)

## Rules

1. **Новые функции в userRepository.ts:**

   ```typescript
   // Найти пользователя по email (требуется для login)
   export async function findUserByEmail(email: string): Promise<User | null>
   
   // Проверить пароль (требуется для login)
   export async function checkPassword(plainPassword: string, passwordHash: string | null): Promise<boolean>
   
   // Создать пользователя (требуется для регистрации)
   export async function createUser(email: string, plainPassword: string, role: 'admin' | 'user'): Promise<User>
   
   // Получить пользователя по ID (требуется для auth middleware)
   export async function getUserById(userId: string): Promise<User | null>
   
   // Обновить статус пользователя (заблокировать/разблокировать)
   export async function updateUserStatus(userId: string, isBlocked: boolean): Promise<User>
   
   // Обновить пароль пользователя (требуется для восстановления)
   export async function updateUserPassword(userId: string, newPlainPassword: string): Promise<User>
   ```

2. **Хеширование пароля (bcrypt):**
   - npm install bcrypt (если ещё не установлен)
   - import * as bcrypt from 'bcrypt'
   - При создании: bcrypt.hash(plainPassword, 10) => passwordHash
   - При проверке: bcrypt.compare(plainPassword, passwordHash) => boolean
   - Если passwordHash === null (админ до миграции): return false, не throw

3. **Замена getOrCreateDefaultUser():**
   - СОХРАНИТЬ функцию, но отметить как deprecated в комментарии
   - Она больше не вызывается напрямую из API-маршрутов
   - Step-04 вместо неё будет использовать getCurrentUser() через middleware

4. **Обработка ошибок:**
   - Если Prisma database unavailable: throw Error("Database connection unavailable")
   - Если email уже существует при createUser: throw Error("User with this email already exists")
   - Если пользователь не найден: return null (не throw)

## Validation

Все команды из apps/studio/:

1. **`npm list bcrypt`**
   - Должна показать версию bcrypt (обычно ^5.1.0 или выше)

2. **`npx tsc --noEmit`**
   - Никаких ошибок в userRepository.ts
   - Типы User, Role должны правильно импортироваться из @/generated/prisma/client

3. **Unit-тестирование (минимальное, вручную):**
   - Если тестовый db доступен, проверить вживую:
     - createUser('test@example.com', 'Password123') => должна создать User с role='user'
     - findUserByEmail('test@example.com') => должна вернуть созданного пользователя
     - checkPassword('Password123', passwordHash) => true
     - checkPassword('WrongPassword', passwordHash) => false
     - checkPassword('anything', null) => false (админ без пароля)

4. **`git status --short`** после завершения:
   ```
   M  apps/studio/src/repositories/userRepository.ts
   M  apps/studio/src/repositories/index.ts
   M  apps/studio/package.json (если bcrypt был добавлен)
   ```

## Output

ARP файл в docs/task-bus/queue/active/, указать:
1. Полный текст обновлённой userRepository.ts (новые функции)
2. Обновлённый export-список из repositories/index.ts
3. Результат `npm list bcrypt`
4. Результат `npx tsc --noEmit`
5. Если доступен тестовый db: результаты вручную проверки (createUser, findUserByEmail, checkPassword)

## Stop Condition

Не коммитить без подтверждения Product Owner.
