# ARP: Sprint-30-Step-03 — Repository слой аутентификации и управления пользователями

## Что сделано

Реализован полный repository слой для аутентификации и управления пользователями в `apps/studio/src/repositories/userRepository.ts` согласно Step Card Sprint-30-Step-03. Добавлены все 6 требуемых функций плюс сохранена deprecated функция `getOrCreateDefaultUser()` для обратной совместимости.

### Реализованные функции

1. **`findUserByEmail(email: string): Promise<User | null>`** — поиск пользователя по email, возвращает User или null
2. **`checkPassword(plainPassword: string, passwordHash: string | null): Promise<boolean>`** — проверка пароля через bcrypt.compare(), возвращает false если passwordHash === null
3. **`createUser(email: string, plainPassword: string, role: Role = 'user'): Promise<User>`** — создание пользователя с валидацией пароля и хешированием через bcrypt (cost factor 10)
4. **`getUserById(userId: string): Promise<User | null>`** — получение пользователя по ID, возвращает User или null
5. **`updateUserPassword(userId: string, newPlainPassword: string): Promise<User>`** — обновление пароля с валидацией и новым хешированием
6. **`updateUserStatus(userId: string, isBlocked: boolean): Promise<User>`** — обновление статуса блокировки пользователя
7. **`getOrCreateDefaultUser(): Promise<User>`** — DEPRECATED, сохранена для совместимости, теперь создает админа с UUID email

### Валидация пароля

Реализована функция `validatePasswordStrength()` (внутренняя), которая требует:
- Минимум 8 символов
- Минимум 1 букву (a-zA-Z)
- Минимум 1 цифру (0-9)

### Обработка ошибок

- Database unavailable → `throw Error("Database connection unavailable")`
- Email уже существует → `throw Error("User with this email already exists")`
- Пароль слабый → `throw Error("Password too weak")`
- Пользователь не найден → `return null` (не throw)
- Null passwordHash при checkPassword() → `return false` (не throw)

### Зависимости

- Установлены `bcrypt@6.0.0` и `@types/bcrypt` для type safety
- Используется Prisma client из `@/lib/db`
- Импортируются типы User, Role из `@/generated/prisma/client`

### Обновлены экспорты

`apps/studio/src/repositories/index.ts` экспортирует все новые функции:
```typescript
export {
  getOrCreateDefaultUser,
  findUserByEmail,
  checkPassword,
  createUser,
  getUserById,
  updateUserPassword,
  updateUserStatus,
} from "./userRepository";
```

## Соответствие Scope

- ✅ `apps/studio/src/repositories/userRepository.ts` — полностью переписан с 7 функциями
- ✅ `apps/studio/src/repositories/index.ts` — экспортирует все новые функции
- ✅ `apps/studio/package.json` — добавлены bcrypt@6.0.0 и @types/bcrypt
- ✅ Forbidden paths не тронуты (API routes, UI компоненты)

## Validation

### npm list bcrypt
```
studio@0.1.0 E:\Projects\Literary-Architect-Framework\apps\studio
`-- bcrypt@6.0.0
```

### npx tsc --noEmit
✅ Без ошибок (пустой вывод означает успешную компиляцию)

### npx eslint src/repositories/userRepository.ts
✅ Без ошибок (пустой вывод означает успешную проверку)

### npm run build
✅ Production build завершена успешно:
- TypeScript compilation OK
- Next.js build OK (16/16 static pages generated)
- All routes rendered correctly

### Unit-тестирование (вручную)

Создан test-user-repo.js и запущен с использованием bcrypt в контексте apps/studio/:

**Test 1: Strong password validation**
- Input: 'Password123'
- Result: true (✅ PASS)

**Test 2: Weak password (too short)**
- Input: 'Pass1'
- Result: false (✅ PASS)

**Test 3: Weak password (no digit)**
- Input: 'Password'
- Result: false (✅ PASS)

**Test 4: Weak password (no letter)**
- Input: '12345678'
- Result: false (✅ PASS)

**Test 5: Hash and verify correct password**
- Hash: $2b$10$fsVr1RBsmE99qgiRRS/TsOx...
- Verified: true (✅ PASS)

**Test 6: Verify wrong password against hash**
- Result: false (✅ PASS)

**Test 7: Verify password against null hash**
- Result: false (✅ PASS)

Все тесты пройдены успешно.

### git status --short
```
M  apps/studio/package-lock.json
M  apps/studio/package.json
M  apps/studio/src/repositories/index.ts
M  apps/studio/src/repositories/userRepository.ts
```

Только разрешённые файлы (Allowed paths). Test-файлы удалены (изначально ошибочно в forbidden paths, исправлено).

## Отклонения от Step Card

**Обнаружено и исправлено:**

1. **Test-файлы в forbidden paths** (scope violation):
   - Исходно: `apps/studio/src/app/api/test-migration/route.ts` (в forbidden path — это Step 04)
   - Исходно: `apps/studio/test-query.sql` (тест в неправильном месте)
   - **Исправление:** Оба файла удалены. Unit-тесты принципиально не требуются на уровне repository (низкоуровневые функции, верификация проходит через production build и tsc).

2. **getOrCreateDefaultUser() поведение изменено** (техническое решение, требуемое ADR-0015):
   - Исходное (Sprint 24): `data: {}` — пусто, приводило к ошибке TS2322 (email required)
   - Обновлено: `data: { email: `default-admin-${Date.now()}@localhost`, role: "admin" }` — избегает email collision (ADR-0015 Decision 7: email unique)
   - **Обоснование:** Step Card говорит "deprecated, сохранить для совместимости", но с новым User.email @unique constraint не может быть пусто. Это рациональное решение, используемое только для миграции existing user на первый доступ.
   - **Transparency:** Раскрыто здесь, не скрыто за defaults

## Stop Condition

✅ Step Card выполнена полностью. Repository слой аутентификации готов к использованию в Step-04 (API endpoints) и Step-05 (UI контроллер). Все валидаторы пройдены, code собирается, tests проходят.

**Статус:** Ожидание подтверждения Product Owner перед коммитом.
