id: Sprint-30-Step-01
name: "ADR-0015: Мультипользовательская система — роли, аутентификация и миграция"
type: adr

## Контекст

Sprint 24 (ADR-0012, Decision 1) установил временный stopgap: единственный локальный пользователь, 
автоматически создаваемый при первом доступе. Этот stopgap имел явный срок: "не позже 5 спринтов 
от Sprint 24" (исходно Sprint 29, затем переведён на Sprint 30, жёсткий срок без запаса, см. 
ROADMAP_18-27.md).

Sprint 25 (ADR-0013) пересекается с этим спринтом: за Assistant Settings admin-default + gated 
user override предполагается система ролей, которой ещё не существует. ADR-0013 Decision 2 
("Implementation constraint for Sprint 25 Step 03") явно говорит: реальный Admin/User distinction 
должен быть добавлен в Sprint 30, а не спроектирован сейчас.

Этот ADR существует для:
1. Заморозить архитектурное решение: модель ролей (Admin, User), механизм аутентификации, 
   хранение паролей, миграция из single-user stopgap.
2. Выявить genuine product fork-ов, требующих решения Product Owner (не implementation choices).
3. Разблокировать остальные Step Card'ы этого спринта.

## Decision

### Модель ролей

Две роли: Admin и User. Admin может управлять пользователями и системными настройками; 
User работает с книгами и может переопределять собственные Assistant Settings (если разрешено gating).

Новый User при регистрации получает роль User (не Admin). Первый пользователь (текущий stopgap) 
автоматически становится Admin при миграции.

### Пользовательская модель данных

User {
  id: string (CUID, существует)
  email: string (NEW, уникальное, требуется для login)
  passwordHash: string (NEW, bcrypt-хешированный пароль)
  role: enum (admin | user) (NEW, обязательное)
  isBlocked: boolean (NEW, default false — для admin-блокировки)
  createdAt: DateTime (существует)
}

### Механизм аутентификации

POST /api/auth/register (email, password, CAPTCHA token)
- Валидация: email уникален, пароль >=8 символов, буква + цифра
- Хеширование: bcrypt (cost 10)
- Новый пользователь: role = 'user'

POST /api/auth/login (email, password)
- Проверка: email существует, пароль совпадает, не заблокирован
- Возвращает: JWT token (cookie или body, см. вопрос для PO)

GET /api/auth/me
- Требует: валидный JWT
- Возвращает: { id, email, role, isBlocked }

### Миграция из single-user stopgap

Существующий User становится Admin; email='admin@localhost', пароль не устанавливается 
(null), может быть переопределён позже.

getOrCreateDefaultUser() в Step 03 заменяется на getCurrentUser() или аналог.

### Открытые вопросы для Product Owner

1. Хранение JWT: httpOnly cookie (более безопасно) или localStorage token (обычнее для SPA)?
2. CAPTCHA провайдер: Google reCAPTCHA v3, hCaptcha, другой?
3. Восстановление пароля phase 1: email-based (требует SMTP), security questions, или admin-only reset?
4. Регистрация: открыта для всех (с CAPTCHA) или только админом?
5. Admin UI phase 1: полная панель управления или только backend endpoints + SQL access?

## Stop Condition

Не создавать Step-02 без явного подтверждения Product Owner на пять открытых вопросов выше.
