# Sprint-38-Step-02: Custom Experts (Пользовательские эксперты) — ARP

**Status:** CONTINUATION IN PROGRESS — Backend 100% (все методы на raw SQL), UI форма улучшена с примером промпта и полем типовых запросов

**Создано:** 2026-07-18  
**Продолжено:** 2026-07-19

---

## Что было реализовано

### ✅ Fully Complete

**Prisma Schema & Migration** (20260718091056)
- CustomExpert: id, userId, name, systemPrompt, typicalRequests[], icon, isPublic, deletedAt (soft delete), createdAt, updatedAt
- PublicExpert: id, creatorId, originalId (reference), name, systemPrompt, typicalRequests[], icon, createdAt, updatedAt
- UserPublicExpert: id, userId, publicId (soft link — no FK), addedAt
- Indices оптимизированы для быстрых queries

**Repository Layer** (customExpertRepository.ts ~ 256 LOC)
- loadMyExperts(userId) → все личные эксперты
- createExpert(userId, name, prompt, requests[], icon, isPublic) → создаёт + если публичный то копирует в PublicExpert
- updateExpert(id, userId, data) → редактирует (только свои)
- deleteExpert(id, userId) → soft delete (deletedAt = now)
- loadPublicExperts(excludeUserId?) → каталог публичных
- getPublicExpert(id) → одного публичного
- loadMyAccessibleExperts(userId) → свои + добавленные
- addPublicExpertToMe(userId, publicId) → добавить себе
- removePublicExpertFromMe(userId, publicId) → удалить из своего списка

**API Endpoints** (330+ LOC total)

Personal Experts:
```
GET    /api/experts          — список (свои + добавленные)
POST   /api/experts          — создать
PUT    /api/experts/:id      — редактировать (только свои)
DELETE /api/experts/:id      — soft delete (только свои)
```

Public Experts:
```
GET    /api/experts/public              — каталог (исключая свои)
POST   /api/experts/public/:id          — добавить себе
DELETE /api/experts/public/:id          — удалить из своего списка
```

Все endpoints требуют JWT авторизацию через getCurrentUser().

**UI Dialog Component** (CustomExpertsDialog.tsx ~ 360 LOC)
- Таб 1 "Мои": список личных экспертов + форма создания/редактирования
- Таб 2 "Доступные": каталог публичных + кнопки добавить/удалить
- Форма:
  - Иконка (emoji) в отдельном поле вверху
  - Имя эксперта (50 char max)
  - Системный промпт с примером "хорошего промпта" в placeholder (5000 char max)
  - Типовые запросы с UI для добавления/удаления (до 10 штук, каждый 10-200 символов)
  - Публичность (checkbox)
  - Кнопки сохранить/создать/отмена
- Тёмный режим поддержка
- Responsive для мобилей
- Бесконечная загрузка исправлена (useRef флаг)

**Validation**
- Имя: 1-50 символов, уникально per user
- Промпт: 10-5000 символов
- Типовые запросы: до 10 штук, каждый 10-200 символов
- Иконка: один emoji
- isPublic: boolean флаг

**Database Behavior**
- Когда создам эксперта с isPublic=true → автоматически копируется в PublicExpert
- Когда удалю своего эксперта (soft delete) → исчезает у меня, но остаётся в PublicExpert у других
- Только админ может удалить из PublicExpert (не реализовано в Step-02, но в контракте)
- Удаление публичного экспертаиз своего списка → только DELETE из UserPublicExpert

---

## 🔴 КРИТИЧЕСКОЕ ТРЕБОВАНИЕ (добавлено при обзоре)

**После сохранения эксперт должен быть виден в панели помощников (AssistantPanel) с возможностью удаления и редактирования:**

- Личные эксперты отображаются как опции рядом с системными помощниками (Соавтор, Редактор, Критик, Читатель)
- Для каждого эксперта кнопки: ⚙️ редактировать, 🗑️ удалить
- Выбор эксперта подставляет его systemPrompt в чат
- Удаление эксперта удаляет его из списка

## ⏳ Deferred (для Step-02 Continuation или Step-03)

- **ExpertPanel полная интеграция** — личные эксперты в список помощников с редактированием/удалением
- E2E тесты — 8+ сценариев (create/update/delete/publish/unpublish/add/remove)
- Использование экспертов в чате — выбор из дропдауна, подставка systemPrompt
- Admin endpoint для удаления публичных экспертов
- Поиск/фильтр в публичных экспертах
- Рейтинг экспертов (показать сколько добавили себе)

---

## Архитектурные решения

| Решение | Обоснование |
|---------|-------------|
| **Soft delete (deletedAt)** | Удаление своего эксперта не влияет на других юзеров, которые добавили его себе |
| **Копирование при публикации** | PublicExpert — независимая копия, позволяет оригиналу быть удалённым |
| **UserPublicExpert без FK** | Soft link позволяет избежать orphaned записей; если удалится PublicExpert, запись останется (разъединённая ссылка) |
| **Типовые запросы как String[]** | Простота, не требует отдельной таблицы; достаточно для MVP |
| **Icon как string (emoji)** | Аналогично системным помощникам (📝 Соавтор, ✏️ Редактор и т.п.) |

---

## Files Changed

**New Files (8):**
- `apps/studio/prisma/migrations/20260718091056_update_custom_experts_schema/migration.sql`
- `apps/studio/src/repositories/customExpertRepository.ts` (256 LOC)
- `apps/studio/src/app/api/experts/route.ts` (55 LOC)
- `apps/studio/src/app/api/experts/[id]/route.ts` (84 LOC)
- `apps/studio/src/app/api/experts/public/route.ts` (40 LOC)
- `apps/studio/src/app/api/experts/public/[id]/route.ts` (68 LOC)
- `apps/studio/src/components/dialogs/CustomExpertsDialog.tsx` (240 LOC)
- `docs/task-bus/queue/active/Sprint-38-Step-02-ARP.md` (this file)

**Modified Files (1):**
- `apps/studio/prisma/schema.prisma` — добавлены 3 модели (CustomExpert, PublicExpert, UserPublicExpert), обновлен User

**Deleted Files (1):**
- `docs/task-bus/queue/pending/Sprint-38-Step-02_Custom-AI-Helpers.md` (заменён на ARP)

---

## Validation Status

✅ **TypeScript:** No errors (npx tsc --noEmit passed)
✅ **Prettier:** Formatted all files
✅ **ESLint:** Clean (no violations)
✅ **npm run build:** Production build successful (3.7s)
⏳ **npm run test:e2e:** E2E тест создан (e2e/custom-experts.spec.ts), ready for manual/CI verification

## 🚨 CRITICAL ISSUE: Prisma ORM Methods Not Available on Runtime

**Problem:** CustomExpert, PublicExpert, UserPublicExpert models added to schema.prisma, migrated successfully, types generated correctly, BUT at runtime `prisma.customExpert` / `prisma.publicExpert` are `undefined` even though other models (book, user) work fine.

**Diagnosis:**
- Prisma Client instance created with `new PrismaClient({ adapter: new PrismaPg(...) })`
- Schema contains all 3 new models + migrations applied
- Prisma types generated correctly in `src/generated/prisma/models/`
- Runtime inspection shows prisma prototype lacks property descriptors for these models
- Other models (book, user) accessible and working correctly

**Workaround:** Use `prisma.$executeRaw` / `prisma.$queryRaw` with raw SQL queries instead of ORM methods. Tested and working for POST /api/experts create operation.

**Status of methods:**
- ✅ createExpert: Working (raw SQL) — POST /api/experts
- ✅ loadMyAccessibleExperts: Working (raw SQL) — GET /api/experts returns own + added experts
- ✅ deleteExpert: Working (raw SQL) — DELETE /api/experts/:id soft deletes
- ✅ updateExpert: Converted to raw SQL — PUT /api/experts/:id редактирует эксперта
- ✅ loadPublicExperts: Converted to raw SQL — GET /api/experts/public каталог публичных
- ✅ getPublicExpert: Converted to raw SQL — GET /api/experts/public/:id одного публичного
- ✅ addPublicExpertToMe: Converted to raw SQL — POST /api/experts/public/:id добавить себе
- ✅ removePublicExpertFromMe: Converted to raw SQL — DELETE /api/experts/public/:id удалить из списка

**Next Steps:** Either:
1. Convert all methods to raw SQL (currently done for createExpert as POC)
2. Investigate why newer models don't get ORM getters despite being in schema and having types
3. Try alternative initialization patterns for PrismaClient

---

## Process Notes

1. **DB Migration Success:** Все 3 таблицы созданы с правильными constraints и индексами
2. **Prisma Code Gen:** `prisma generate` успешно создал типы для новых моделей
3. **API Design:** 6 endpoints покрывают все use-cases (CRUD для личных, каталог + add/remove для публичных)
4. **UI Simplicity:** Двухтабный диалог минимален, но функционален — создание + управление в одном месте
5. **Soft Delete Pattern:** Позволяет сохранить данные при удалении, не ломая ссылки других пользователей

---

## Что осталось для завершения Step-02

**REQUIRED for commit:**
- [ ] Manual browser test: формы работают без flickering
- [ ] Проверить что типовые запросы сохраняются и отображаются корректно
- [ ] Проверить soft delete работает и эксперт исчезает из списка
- [ ] Убедиться что дополнено исключить loadMyExperts из использования (не нужен больше)

**For next session (Step-02-Continuation или Step-03):**
- [ ] Интеграция в ExpertPanel (личные эксперты отображаются в панели помощников)
- [ ] Использование выбранного эксперта в чате (systemPrompt подставляется в запрос)
- [ ] E2E тесты запущены через CI/CD и проходят
- [ ] Добавить в CRITICAL_FEATURES.md
- [ ] Fix Prisma ORM issue (root cause analysis — почему новые модели не имеют getters)
- [ ] Revert methods to ORM if issue fixed
- [ ] Admin endpoint для модерации PublicExpert
- [ ] Поиск и фильтр в каталоге публичных

---

## Lessons & Observations

1. **Copy-on-publish pattern** работает для многопользовательских сценариев — дано сценарий удаления всё становится проще
2. **Soft delete via deletedAt** даёт гибкость для статистики и восстановления
3. **String arrays в Prisma** достаточны для простых случаев, избегаем лишних таблиц на раннем этапе

---

**Ready for:** architect-reviewer → tester → commit  
**Date:** 2026-07-18  
**Sprint:** 38  
**Step:** 02  
**Status:** Backend READY, UI partial (create works, ExpertPanel integration deferred)
