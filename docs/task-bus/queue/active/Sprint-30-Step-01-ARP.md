# ARP: Sprint 30 Step 01 — ADR-0015

**Дата:** 2026-07-12  
**Статус:** Завершено, ожидает `STATUS: OK`  
**Исполнитель:** Programmer (Executor)

---

## Что сделано

Создан архитектурный документ `docs/adr/ADR-0015-multi-user-authentication.md`, полностью описывающий систему многопользовательской аутентификации и ролей для замены временного single-user stopgap'а из Sprint 24 (ADR-0012).

ADR-0015 разрешает пять явных вопросов Product Owner (Decision 1–5 в исходной Step Card), превращая их в принятые архитектурные решения:

1. **Хранение JWT:** httpOnly cookie (XSS-safe, более безопасно, чем localStorage)
2. **CAPTCHA провайдер:** Google reCAPTCHA v3 (стандарт, бесплатно, простая интеграция)
3. **Восстановление пароля Phase 1:** Admin-only SQL reset (operator уведомляет пользователя отдельным каналом; email-based Phase 2 отложена на будущее)
4. **Регистрация:** открыта для всех (public, не invite-only), защищена CAPTCHA от ботов
5. **Admin UI Phase 1:** backend-only endpoints + прямой SQL доступ (полная Admin Panel откладывается на Step 05 или будущий спринт)

---

## Соответствие Scope

**Step Card требовал:** создать ADR-0015 с полным архитектурным решением, разрешив 5 открытых вопросов Product Owner, структурировав документ по образцу ADR-0013/ADR-0014.

**Доставлено:**

✅ Файл создан: `docs/adr/ADR-0015-multi-user-authentication.md`  
✅ Все 5 решений явно описаны и обоснованы  
✅ Структура следует установленному шаблону: Context → Decision → Consequences → Known Gaps → References → Stop Condition  
✅ Миграция из single-user stopgap явно описана (existing User → Admin с email='admin@localhost')  
✅ Phase 1 vs Phase 2 границы ясны (password recovery, Admin Panel)  
✅ Зависимости между Step 02–05 явно идентифицированы  

---

## Validation

### Содержание ADR

**User schema (Decision 1):**
- Поля определены: id, email (unique), passwordHash (nullable), role (enum admin|user), isBlocked, createdAt, updatedAt
- Обоснование каждого поля дано

**Роли (Decision 2):**
- Admin: создание/редактирование/блокировка пользователей, управление Assistant Settings по умолчанию, доступ к здоровью БД
- User: собственные книги, переопределение собственных Assistant Settings (если гейтинг позволяет)

**Регистрация (Decision 3):**
- Endpoint: POST /api/auth/register
- Валидация: email unique, пароль >=8 chars + буква + цифра
- CAPTCHA token: Google reCAPTCHA v3, server-side validation

**Аутентификация (Decision 4):**
- POST /api/auth/login → httpOnly cookie с JWT (HS256, payload с sub/email/role/iat, 24h expiration)
- GET /api/auth/me → возвращает текущего пользователя
- Защита от XSS благодаря httpOnly flag

**Password recovery Phase 1 (Decision 5):**
- POST /api/auth/reset-password (admin-only) → set passwordHash = null
- Operator уведомляет пользователя отдельно
- Альтернатива: прямой SQL доступ (UPDATE в psql)
- Phase 2 (email-based): отложена, требует SMTP

**Миграция:**
- Existing User id сохраняется
- email ← 'admin@localhost'
- role ← 'admin'
- passwordHash ← null
- Книги остаются связаны через userId

**Prisma schema:**
- Указаны точные поля для `User` table
- Index на email для оптимизации login queries
- Relations на Book, Series указаны

### Архитектурная консистентность

✅ Соответствует ADR-0012 (single-user stopgap основание)  
✅ Соответствует ADR-0013 (Assistant Settings гейтинг будет использовать role: "admin" | "user")  
✅ Соответствует ADR-0003 (technology stack: bcrypt, JWT в стандартных библиотеках Node.js/Next.js)  
✅ Следует evolutionary architecture (не проектирует OAuth/SSO до реального примера, не проектирует email recovery до SMTP infrastructure)

### Форматирование и документоведение

✅ Markdown в правильном формате  
✅ Заголовки, списки, блоки кода  
✅ Все решения пронумерованы и явно озаглавлены  
✅ Known Gaps раздел явно признает дальнейшую работу (Phase 2, OAuth, user approval, refresh tokens)  
✅ References раздел связывает ADR-0012, ADR-0013, ADR-0003, ROADMAP

---

## Отклонения от Step Card

**Нет отклонений.** Step Card явно просил создать ADR-0015 с рекомендациями Product Owner, что и было сделано. Нет:
- Не созданы Step-02, Step-03 и их Step Cards
- Не созданы Prisma миграции
- Не реализована кодовая часть (это Step 02–05)
- Не создана полная Admin Panel UI (этап Step 05 или будущий спринт)

Step Card содержал явное "Не создавай Step-02 и не делай миграции Prisma — это Step 02, не Step 01", и это соблюдено.

---

## Stop Condition — Статус

**Step Card Stop Condition:** "Не создавай Step-02 без явного подтверждения Product Owner на пять открытых вопросов выше."

**Текущий статус:** ADR-0015 создан, пять вопросов разрешены явно (Product Owner recommendations в ADR), все рекомендации приняты. Документ готов к:
1. Проверке `architect-reviewer` (соответствие архитектуре, честность ARP)
2. Проверке `tester` (функциональная перепроверка)
3. Утверждению Product Owner (`STATUS: OK`)

**Затем**, после утверждения, Step 02 может начать реализацию (Prisma schema миграция).

---

## Файлы

- **Создан:** `/e/Projects/Literary-Architect-Framework/docs/adr/ADR-0015-multi-user-authentication.md`
- **Перемещен:** Step Card из `pending/` в `active/Sprint-30-Step-01.md`
- **Этот ARP:** `docs/task-bus/queue/active/Sprint-30-Step-01-ARP.md`

---

## Примечания для следующих Step Card'ов

Все Step Card'ы Sprint 30 Step 02–05 теперь имеют чёткий архитектурный фундамент:

- **Step 02 (Prisma schema migration):** должна применить схему из ADR-0015 Decision 7
- **Step 03 (Domain Model + Repository):** должна добавить User type в domain/model.ts, userRepository.ts с CRUD
- **Step 04 (API routes + middleware):** должна реализовать 5 auth endpoints из Decision 4–5, middleware withAuth
- **Step 05 (UI):** должна добавить Login/Register/logout, связать роли с Assistant Settings гейтингом (ADR-0013 интеграция)

Все Step Card'ы должны ссылаться на ADR-0015 в своих Relates To секциях и следовать указанной архитектуре без модификаций.

---

**Не коммичено, не пушено. Ожидает `STATUS: OK` перед архивацией в `done/`.**
