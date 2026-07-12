# Sprint-31-Step-02 REVIEW

STATUS: FIX

## SUMMARY (RU)

Scope нарушена: .claude/settings.json изменена вне Allowed paths. Более критично: Enum значения в миграции расходятся с ADR-0016 (PlanTier: free/pro/enterprise вместо free/premium/pro; PaymentStatus: succeeded вместо completed). ARP не раскрыла эти отклонения от заморозки архитектурного решения. Требуется явное согласие Product Owner на отклонение от ADR-0016.

## FINDINGS

### 1. SCOPE VIOLATION — Forbidden Path Touched
- **File:** `.claude/settings.json`
- **Issue:** Step Card явно ограничивает Allowed paths:
  - apps/studio/prisma/schema.prisma
  - apps/studio/prisma/migrations/ (создаётся автоматически)
  - task-bus/queue/active/ (перемещение карточек)
- **Violation:** .claude/settings.json изменена (git status показывает `M .claude/settings.json`)
  - Добавлены команды для логирования истории
  - Это не входит в scope Step-02
- **Fix:** Revert .claude/settings.json; используй `git checkout -- .claude/settings.json` перед коммитом

### 2. ARCHITECTURAL DEVIATION FROM ADR-0016 — UNDISCLOSED & CRITICAL
ADR-0016 (Tariff-Based Subscription Model, строка 1-4) был **явно создан чтобы заморозить архитектурное решение перед Step-02** (см. ADR-0016, строка 30-32 и Step Card строки 6-11).

#### Отклонение 1: PlanTier Enum
- **ADR-0016 Decision** (строка 46): `tier: enum ("free" | "premium" | "pro")`
- **Predefined Plans** (строка 70-75):
  - Free: tier="free"
  - **Premium**: tier="premium" (USD 9.99/month)
  - Pro: tier="pro" (USD 29.99/month)
- **Step Card** (строка 40-43):
  ```prisma
  enum PlanTier {
    free
    pro
    enterprise  // ← NOT in ADR-0016
  }
  ```
- **Миграция** (migration.sql, строка 2): `CREATE TYPE "PlanTier" AS ENUM ('free', 'pro', 'enterprise')`
- **Status:** Критическое отклонение. Замена "premium" на "enterprise" меняет бизнес-логику (какой план по цене идёт между Free и Pro?)

#### Отклонение 2: PaymentStatus Enum
- **ADR-0016 Decision** (строка 118): `status: enum ("pending" | "completed" | "failed" | "refunded")`
- **Step Card** (строка 53): uses "succeeded" (из ARP)
- **Миграция** (migration.sql, строка 5-8): `CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'succeeded', 'failed', 'refunded')`
- **Status:** Отклонение в терминологии. "completed" vs "succeeded" имеет значение для платёжных систем (Yookassa/Tbank возвращают "succeeded" in webhooks, ADR документирует "completed" для консистентности с domain model).

### 3. HONESTY OF DEVIATIONS — NOT DISCLOSED
- **ARP Section "Отклонения от Step Card"** (строка 131-140):
  ```
  Нет отклонений от требований Step Card. Выполнены точно:
  - ✓ Все 3 enum определены с точными значениями
  - ✓ Все 3 model определены с точными полями и индексами
  ```
- **Reality:** Есть отклонения от **ADR-0016**, которые ARP не раскрыла.
- **Issue:** ARP сравнила только со Step Card, но не проверила соответствие ADR-0016, на которую Step Card явно ссылается.

### 4. SCOPE — OTHERWISE COMPLIANT
- ✓ schema.prisma изменена правильно (3 enum, 3 model, User relations обновлены)
- ✓ миграция создана в правильной папке
- ✓ Foreign keys, indices, constraints установлены согласно Step Card
- ✓ TypeScript validation прошла (`npx tsc --noEmit` без ошибок)
- ✓ Build succeeded (`npm run build` успешно)

### 5. VALIDATION — APPEARS REAL
- ARP приводит вывод реальных команд (prisma migrate, tsc, npm run build)
- Вывод выглядит подлинным (консольный формат, timing данные)
- Проблемы:
  1. ARP не проверила alignment с ADR-0016, а только с Step Card
  2. .claude/settings.json изменён автоматически, не как часть Step Card

## NEXT STEP

Требуется явное решение Product Owner:

**Option 1:** Accept deviation from ADR-0016
- Enum PlanTier: free/pro/enterprise (вместо free/premium/pro)
- PaymentStatus: succeeded (вместо completed)
- Обновить ADR-0016 Decision section, чтобы отразить эти изменения
- Тогда ARP обновляет "Отклонения от Step Card" с явным обоснованием
- STATUS → OK

**Option 2:** Revert enum values to match ADR-0016
- Измени Step Card enum на free/premium/pro
- Переприменить миграцию с правильными enum значениями
- Переписать ARP
- STATUS → FIX (переимплементируй)

**Option 3:** Clarify in ADR-0016
- Если "enterprise" и "succeeded" - намеренные изменения, спроси Product Owner почему они не обновили ADR-0016 перед Step-02
- STOP до явного уточнения

**До того как повторно запустить этот Step:**
1. Удали .claude/settings.json из коммита (`git checkout -- .claude/settings.json`)
2. Получи явное решение от Product Owner по enum расхождениям
3. Обновляй либо ADR-0016, либо Step Card, чтобы они согласовывались
