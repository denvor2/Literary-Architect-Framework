# REVIEW — Sprint-30-Step-01 (ADR-0015)

## STATUS

PASS — все 5 вопросов Product Owner получили полные, самостоятельные решения; логическая согласованность хорошая; готово для Step 02–05. Шесть findings (low severity) — уточнения для реализации, не блокеры.

---

## SUMMARY (RU)

ADR-0015 логически согласован и архитектурно достаточен для разблокировки Step 02–05:

**Логическая согласованность:** ✓
- httpOnly cookie + автоматическое отправление cookies в API calls — согласовано (Decision 4, Consequences)
- Роли (Admin vs User) чётко разделены по scope: Admin — система, User — собственные книги (Decision 2)
- Миграция существующего пользователя понятна: id сохраняется, email ← 'admin@localhost', role ← 'admin', passwordHash ← null (Decision 6)
- Взаимосвязь с ADR-0012 (stopgap основание), ADR-0013 (гейтинг роли) верна

**Полнота решений:** ✓
Все 5 PO вопросов из Step Card получили явный, решающий ответ в ADR:
1. Хранение JWT: httpOnly cookie (Decision 4, rationale vs localStorage)
2. CAPTCHA: Google reCAPTCHA v3 (Decision 3, server-side validation)
3. Восстановление пароля Phase 1: admin-only reset (Decision 5)
4. Регистрация: открыта для всех + CAPTCHA (Decision 3)
5. Admin UI Phase 1: backend endpoints + SQL (Decision 5, Phase 2 отложена)

**Достаточность для зависимостей:**
- Step 02 (Prisma): Decision 7 явно описывает 4 новых поля + index, миграция ясна (с одним замечанием про type enum — см. Findings)
- Step 03 (Repository + Domain): User model, CRUD операции, findUserByEmail покрыты (с замечанием про bcrypt cost — см. Findings)
- Step 04 (API routes): 5 endpoints описаны (register/login/me/reset-password + logout упомянут в Consequences; с замечанием про logout spec — см. Findings)
- Step 05 (UI): implications httpOnly cookie для JS понятны (login/register/logout pages)

**Честность ARP:** ✓
- ADR полностью соответствует Step Card scope: "создать архитектурное решение, разрешив 5 открытых вопросов"
- Точно указано, что НЕ сделано: no Prisma migrations, no code, no Admin Panel UI, no email recovery Phase 2
- Stop Condition ясен: ждать PO OK перед Step 02

---

## FINDINGS (Low Severity — не блокируют, но требуют уточнения в Step 02–04)

### 1. Email validation regex not specified — admin@localhost edge case

**Issue:**
- Decision 3 требует "email must match basic email format (RFC 5321 simplified: local-part@domain)"
- Но точного regex или validation function в ADR нет
- Decision 6 (миграция) устанавливает email='admin@localhost'
- **Risk:** localhost технически не имеет TLD и может не пройти strict RFC 5321 валидацию
- Consequence: если Step 03/04 реализует strict RFC 5321, то попытка обновить профиль мигрированного пользователя может отклонить email='admin@localhost'

**Severity:** Low-Medium (зависит от строгости regex в Step 03)

**Recommendation:** 
Step 03 должен явно разрешить admin@localhost при валидации email (специальный case для bootstrapped account) ИЛИ использовать более свободный regex, который допускает localhost (уточнить у PO перед Step 03).

---

### 2. POST /api/auth/logout behavior not documented in Decision

**Issue:**
- Consequences упоминает 5 endpoints: "register, login, logout, me, reset-password"
- Но нет Decision section, описывающего /logout endpoint
- Behaviour не определён: response code (204 No Content vs 200 OK)? Clear httpOnly cookie? Что если already logged out?

**Severity:** Low

**Recommendation:**
Step 04 должен добавить решение в код с комментарием (например, "logout: clear auth_token cookie, return 204 No Content, idempotent") или запросить уточнение у PO перед реализацией.

---

### 3. bcrypt cost factor not mentioned in ADR

**Issue:**
- ARP в Validation разделе заявляет "Хеширование: bcrypt (cost 10)"
- Но ADR Decision 1 (User schema) описывает просто `passwordHash: string | null` без bcrypt параметров
- Decision 3 (регистрация) не упоминает bcrypt или cost factor

**Severity:** Low (cost 10 — стандарт для Node.js bcrypt, но должно быть документировано)

**Recommendation:**
Step 03 (Repository) должен явно использовать bcrypt.hash(..., 10) и документировать выбор cost=10 в коде (комментарий или .env constant).

---

### 4. Prisma schema type inconsistency — role field

**Issue:**
- Decision 2 говорит: "strict enum (`admin` | `user`), no third role"
- Decision 7 Prisma schema показывает: `role: String @default("user")`
- Должно быть: `role: Role @default(user)` где Role — enum в prisma schema

**Severity:** Low (рабочее, но not type-safe)

**Recommendation:**
Step 02 Prisma migration должна определить enum Role в schema:
```prisma
enum Role {
  admin
  user
}
model User {
  ...
  role Role @default(user)
  ...
}
```

---

### 5. CAPTCHA configuration for localhost — deployment guidance needed

**Issue:**
- ADR требует Google reCAPTCHA v3
- localhost не может быть зарегистрирован в Google Recaptcha Console
- Known Gap упоминает "Setup is operator responsibility, documented in deployment guide"
- Но guidance для локальной разработки отсутствует (mock CAPTCHA? bypass? different provider?)

**Severity:** Informational

**Recommendation:**
Step 04 или deployment guide должны описать:
- Локальная разработка: CAPTCHA_SECRET_KEY=dev_dummy или CAPTCHA_SKIP=true при NODE_ENV=development (с явным warning)
- Production: требуется реальная регистрация в Google Recaptcha Console

---

### 6. User.passwordHash nullable — clarity on Phase 1 flow

**Issue:**
- Decision 1 описывает `passwordHash: string | null` (nullable for resets)
- Decision 5 описывает admin-only reset: "Set passwordHash to null for the target user"
- Но не ясно: как пользователь логинится, если passwordHash = null?

**Severity:** Low (design is correct, but user flow could be clearer)

**Expected behavior (from Decision 5):**
- Admin performs reset → user.passwordHash = null
- Admin notifies user via out-of-band channel (email, Slack, etc.)
- User receives temporary password or password-reset link externally
- User logs in with temporary password OR receives reset link from Phase 2 system
- Question: в Phase 1, как именно пользователь получит новый пароль? ("Out-of-band" — это достаточное описание для Step 04 и Step 05?)

**Recommendation:**
Step 04 должен явно документировать: admin может установить passwordHash=null через /api/auth/reset-password, но Phase 1 не предоставляет автоматического механизма отправки временного пароля. Это operator's manual task (email, Slack, verbal, etc.). Phase 2 добавит email-based self-service.

---

## АРХИТЕКТУРНАЯ КОНСИСТЕНТНОСТЬ

✓ Соответствует ADR-0012 (single-user stopgap как основание для миграции)
✓ Соответствует ADR-0013 (роли используются для гейтинга Assistant Settings)
✓ Соответствует ADR-0003 (bcrypt, JWT доступны в Node.js stack)
✓ Следует evolutionary architecture (не проектирует OAuth/SSO до использования, не проектирует email recovery до SMTP)

---

## KNOWN GAPS — ПРИЗНАННЫЕ И ЯВНЫЕ

ADR явно перечисляет все отложенные на будущее фазы:
1. Гейтинг для User overrides (зависит от гейтинга в Step 03 или Sprint 31+)
2. Email-based password recovery Phase 2 (требует SMTP)
3. OAuth / SSO (отдельный ADR)
4. User self-registration approval flow (отдельный ADR)
5. Full Admin Panel UI (Step 05 или future sprint)
6. Refresh tokens и session timeout (может быть revisited после Phase 1)
7. CAPTCHA deployment configuration (operator responsibility)

Все явны и не блокируют Step 02–05 Phase 1.

---

## STOP CONDITION

✓ Clear: "Do NOT proceed with Step 02 until this ADR is accepted by Product Owner"

Текущий статус: ADR-0015 создан, все 5 PO вопросов разрешены. Готов к:
1. Проверке architect-reviewer (scope compliance, architectural honesty)
2. Проверке tester (нет функциональной части, только документация — QA может только проверить наличие файла и консистентность)
3. Утверждению Product Owner (STATUS: OK)

Затем Step 02 может начать Prisma миграцию.

---

## NEXT STEP

1. Документ готов к утверждению Product Owner
2. Перед Step 02: уточнить у PO
   - Email validation: разрешить ли admin@localhost, или более свободный regex?
   - CAPTCHA для localhost: mock в dev, или separate provider?
3. После PO OK: Step 02 (Prisma schema migration) может начать с учётом findings выше (особенно #4 — enum Role type)

---

## ПРИМЕЧАНИЕ ДЛЯ АРХИТЕКТОРА И STEP CARD'ОВ

ADR-0015 архитектурно завершена и не требует пересмотра. Findings выше — это практические уточнения для Steps 02–04, не изменения ADR. ADR остаётся как есть; Step Cards должны отнеситься к этим findings как к уточняющей context, а не к недостаткам ADR.
