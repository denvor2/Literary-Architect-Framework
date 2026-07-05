# ARP — Sprint-09-Step-04

**Шаг:** ADR-0006: ратификация контракта Reader Expert + закрытие Sprint 09
**Статус выполнения:** Готово к ревью

## Что сделано

1. **Создан `docs/adr/ADR-0006-reader-expert-contract.md`** — ратифицирует контракт Reader
   Expert тем же методом, что ADR-0004/0005: разделы Request/Response Schema, позиция в цепочке
   AI Bus v5, Product Role Mapping, Known Gaps, Consequences, Review Trigger — каждый пункт с
   цитатой файл+строка против уже работающего кода (`route.ts`, `operations.ts`, `aiBus.ts`,
   `EditorArea.tsx`).
2. **Обновлён `docs/product/DOMAIN_MODEL.md`** (только раздел Open Questions) — пункт про
   маппинг Product Role → AI Expert теперь отмечает Reader как разрешённый (наряду с Critic),
   со ссылкой на ADR-0006. Editor/Co-author остаются явно нерешёнными.
3. **Полностью переписан `docs/project/CURRENT_SPRINT.md`** — Sprint 09 описан как закрытый:
   цель, сводка по всем четырём шагам, две отдельные ad-hoc задачи очереди явно помечены как НЕ
   шаги Sprint 09 (Add-Vision-Doc, переименование AI Bus → Task Bus), Out of Scope, чеклист задач
   с реальными хэшами коммитов (`5418ff3`, `bb9df12`, `6ad8aac`), Definition of Done, Completed,
   Known Open Items (перенесены), Next Action — Sprint 10 не начат.
4. **Обновлён `docs/project/CURRENT_STEP.md`** — `id: Sprint-09-Step-04`, `status: done`.
5. **Обновлён `docs/project/PROJECT_STATE.md`**:
   - Current Sprint → Sprint 09 (закрыт), ссылка на CURRENT_SPRINT.md.
   - Новый пункт в Completed Milestones для Sprint 09, зеркалирующий стиль Sprint 08, с
     коммитами `5418ff3`/`bb9df12`/`6ad8aac` и ссылкой на ADR-0006.
   - Current Architecture: третий Expert (Reader) добавлен в описание интеграции и в цепочку
     AI Bus; маппинг Product Role → AI Expert обновлён (Reader теперь тоже 1:1).
   - Таблица Accepted ADRs: добавлена строка ADR-0006 (Accepted).
   - Current Priorities / Open Decisions / Next Milestone: "Sprint 09 scope" → "Sprint 10 scope"
     (Sprint 09 больше не открытый вопрос).

## Валидация

```
grep -n "ADR-0006" docs/project/PROJECT_STATE.md   → 5 совпадений (все ожидаемые разделы)
grep -n "Reader Expert" docs/adr/ADR-0006-reader-expert-contract.md → 2 совпадения (заголовок + Product Role Mapping)
git status --short → ровно 5 разрешённых файлов (M ×4, A ×1 новый ADR) + Step Card в active/;
                       apps/studio/** не затронут
```

## Отклонения от Step Card

Нет. Все правки строго в рамках Allowed paths; `apps/studio/**` не тронут (Forbidden paths
соблюдены).

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect, как того требует Step Card. Это
последний шаг Sprint 09; после ревью и коммита Sprint 09 будет закрыт, а Sprint 10 не начат без
отдельного решения Product Owner/Architect.

Жду REVIEW.md.
