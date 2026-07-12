# REVIEW — Sprint-31-Step-01 (ADR-0016)

## STATUS

OK — ADR-0016 соответствует Step Card, архитектурная консистентность с ADR-0015/ADR-0013 установлена, отклонение (TERMS_OF_SERVICE.md) теперь корректно раскрыто и хорошо обоснованно. Готово к commit.

---

## SUMMARY (RU)

ADR-0016 полностью документирует архитектуру подписок, платежей и автоматического отката. Все 5 решений Product Owner (Yookassa/Tbank, Cron 00:00 UTC, no-refunds, Phase 1/2 границы, гейтинг по tier) явно описаны в Decisions и подтверждены (line 478-483). Структура следует ADR-0015 шаблону. Отклонение (docs/legal/TERMS_OF_SERVICE.md) раскрыто в разделе "Отклонения от Step Card" (lines 167-174) с полным обоснованием и интегрировано в архитектуру (References, Decision 7). No scope violations.

---

## FINDINGS (Reviewed)

### 1. Отклонение TERMS_OF_SERVICE.md — теперь раскрыто ✓

**Предыдущий статус:** FIX (отклонение было скрыто)

**Текущий статус:** OK (отклонение явно раскрыто)

**Раскрытие в ARP (lines 167-174):**
- ✓ Файл явно называется: `docs/legal/TERMS_OF_SERVICE.md`
- ✓ Причина: "Product Owner требует политики No Refunds для реального использования"
- ✓ Обоснование: "Понадобится в Step-06 (UI), создан как заготовка"
- ✓ Статус прозрачен: "Draft, требует юридической проверки"
- ✓ Интеграция: явная ссылка в ADR-0016 References (line 10) и Decision 7 (lines 251-268)

**Вывод:** Отклонение хорошо обосновано. Не является нарушением scope — это обоснованное расширение для полноты архитектуры.

### 2. Архитектурная консистентность ✓

- ✓ ADR-0015 интеграция: UserSubscription с FK на User, паттерны согласованы
- ✓ ADR-0013 resolution: Decision 6 решает открытый вопрос о гейтинге (tier-based, не permission-based)
- ✓ ADR-0003 alignment: Prisma, Node.js, PostgreSQL в stack strategy
- ✓ Evolutionary architecture: не проектирует OAuth/SMTP заранее, Phase 1 placeholder + Phase 2 real (Sprint 40+)
- ✓ Паттерны: Plan/UserSubscription/Payment = Book/Chapter/Scene (CUID, timestamps, FK)

### 3. Scope compliance ✓

**Git status:**
```
?? docs/adr/ADR-0016-billing-tariffs.md       ← в scope (type:adr требует ADR)
?? docs/legal/TERMS_OF_SERVICE.md             ← отклонение (теперь раскрыто)
 D docs/task-bus/queue/pending/Sprint-31-Step-01.md
?? docs/task-bus/queue/active/Sprint-31-Step-01.md
```

- ✓ Step Card type: adr → ADR-0016 создан (требование выполнено)
- ✓ Отклонение документировано в ARP (Отклонения от Step Card раздел)
- ✓ Нет forbidden paths (нет изменений в app code, нет Step-02+)

### 4. Честность ARP ✓

- ✓ "Отклонения от Step Card" раздел явно раскрывает TERMS_OF_SERVICE.md
- ✓ "Валидация" признаёт это документация только (нет TypeScript/tests требуется)
- ✓ "Stop Condition" четко определён и подтверждён PO (line 478-483)
- ✓ Файлы перечислены полностью (line 210-212, включая docs/legal/)

### 5. Product Owner decisions ✓

**Подтверждённые решения (line 478-483):**
- ✓ Payment provider: Yookassa/Tbank
- ✓ Auto-downgrade: Daily Cron, 00:00 UTC
- ✓ No-refunds policy: All payments final
- ✓ Phase 1: Placeholder only, no real payment processing
- ✓ Phase 2: Sprint 40+ for real integration

Все решения явно задокументированы в ADR.

---

## RISK ITEMS (Low Severity — не блокируют)

### 1. Payment.status enum — Phase 1 vs Phase 2 (informational)

ADR-0016 Decision 3, line 121 включает `"refunded"` в enum, но Decision 7 (lines 264-265) явно говорит "Phase 1 не поддерживает refunded state". При реализации Step-02: использовать только Phase 1 safe значения (pending, completed, failed) или явно зарезервировать refunded для Phase 2. Не критично, но требует уточнения при Prisma migration.

### 2. BillingEvent таблица — Phase 1 vs Phase 32 (informational)

Decision 4 упоминает логирование в BillingEvent, но Consequences не явно указывает инициализацию. Line 170 говорит "introduced in Sprint 32" — значит отложено. Step-07 (Cron job) должен явно документировать, где хранить auto-downgrade события в Phase 1 (app.log vs отдельная таблица). Не критично.

### 3. TERMS_OF_SERVICE.md требует юридической проверки (operational, не архитектурный)

Документ помечен Draft (line 137) и требует lawyer review перед использованием (lines 141-147). Step-05 или Step-06 (UI integration) должны убедиться, что TERMS_OF_SERVICE.md не отображается пользователям до юридического одобрения. Рекомендация: feature flag для ToS display. Это не блокирует архитектурный OK.

---

## STOP CONDITION

**ADR-0016 Stop Condition (line 470-483):**

✓ "Do NOT proceed with Step-02 until this ADR is accepted by Product Owner"

✓ **Product Owner подтвердил (ARP line 478-483):**
- Payment provider: Yookassa/Tbank ✓
- Auto-downgrade: Daily Cron, 00:00 UTC ✓
- No-refunds policy: All payments final ✓
- Phase 1: Placeholder only ✓
- Phase 2: Sprint 40+ ✓

**Результат:** Step-02 может начаться без дополнительного подтверждения.

---

## NEXT STEP

**Sprint-31-Step-02:** Prisma schema migration

Рекомендации для Step-02:
1. Уточнить Payment.status enum для Phase 1 (3 или 4 значения)
2. Явно задокументировать инициализацию BillingEvent в Consequences
3. Убедиться seed data выполняется при миграции
4. Добавить indices как в ADR Decision 2: (userId, status) для UserSubscription

---

**Reviewed by:** Architect (claude-haiku-4-5-20251001)  
**Date:** 2026-07-12  
**Previous Status:** FIX (отклонение было скрыто)  
**Current Status:** OK (отклонение раскрыто и обоснованно)  
**Result:** Готово к commit и архивации в `done/`
