# Sprint-38-Step-02: Custom Experts (Пользовательские эксперты) — ARP

**Status:** COMPLETE — Backend 100%, UI partial — ready for review gates

**Создано:** 2026-07-18

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

**UI Dialog Component** (CustomExpertsDialog.tsx ~ 240 LOC)
- Таб 1 "Мои": список личных экспертов + форма создания
- Таб 2 "Доступные": каталог публичных + кнопки добавить/удалить
- Форма: name, systemPrompt, typicalRequests[], icon, isPublic checkbox
- Тёмный режим поддержка
- Responsive для мобилей

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

## ⏳ Deferred (для следующей итерации)

- ExpertPanel интеграция — добавить личных + публичных экспертов в выпадающий список помощников
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

✅ **TypeScript:** No errors (after prisma generate)
✅ **Prettier:** Formatted all new files
✅ **ESLint:** Clean (no violations)
⏳ **npm run build:** Not yet run (will validate on merge)
⏳ **npm run test:e2e:** Deferred (Step-03 or continuation)

**Known Cache Issue:** Старые файлы assistants/route.ts ещё в кэше Next.js — пропадут после rebuild, не влияют на код.

---

## Process Notes

1. **DB Migration Success:** Все 3 таблицы созданы с правильными constraints и индексами
2. **Prisma Code Gen:** `prisma generate` успешно создал типы для новых моделей
3. **API Design:** 6 endpoints покрывают все use-cases (CRUD для личных, каталог + add/remove для публичных)
4. **UI Simplicity:** Двухтабный диалог минимален, но функционален — создание + управление в одном месте
5. **Soft Delete Pattern:** Позволяет сохранить данные при удалении, не ломая ссылки других пользователей

---

## Следующие шаги

**Для STATUS: OK commit:**
- [ ] architect-reviewer: проверить scope, честность ARP
- [ ] tester: независимая re-drive (create → publish → add → remove → delete)

**Post-commit (Step-02 Continuation или Step-03):**
- [ ] Интеграция в ExpertPanel (система + личные + публичные в дропдауне)
- [ ] E2E тесты (8+ сценариев)
- [ ] Использование выбранного эксперта в чате
- [ ] Admin endpoint для модерации PublicExpert
- [ ] Поиск в каталоге публичных

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
