# ARP — Sprint-11-Step-05

**Шаг:** ADR-0007: мультикнижность (Workspace.books[]) + закрытие Sprint 11
**Статус выполнения:** Готово к ревью

## Что сделано

1. **`docs/adr/ADR-0007-multi-book-workspace.md`** (новый файл) — ратифицирует изменение
   мультикнижности тем же методом, что ADR-0004/0005/0006: из уже реализованного кода,
   построчные ссылки, не абстрактное проектирование. Разделы: Context (явно зафиксирован факт
   потери первой книги Product Owner, без смягчения формулировки), Decision (форма Workspace/
   Book, миграция данных, `normalizeBook()` как задокументированная обязательная практика на
   будущее, процессный урок про коллизию `selectBook()`), Consequences, Review Trigger.
2. **`docs/project/CURRENT_SPRINT.md`** — полностью переписан под закрытие Sprint 11: цель, честное
   summary всех 5 шагов + экстренного фикса `normalizeBook`, Out of Scope (серии книг,
   сворачиваемый вид, per-book selection — все со ссылкой на vision-документ), Tasks с реальными
   коммитами, Definition of Done (включая обе явно одобренные правки Forbidden paths), Known Open
   Items, Next Action.
3. **`docs/project/CURRENT_STEP.md`** — `id: Sprint-11-Step-05`, `status: done`.
4. **`docs/project/PROJECT_STATE.md`**:
   - Current Sprint → Sprint 11 (закрыт).
   - Новый пункт в Completed Milestones для Sprint 11, с реальными коммитами.
   - Current Architecture: новый пункт "Domain Model" — Workspace/Book форма изменена,
     `normalizeBook()`/`migrateIfNeeded()` описаны.
   - ADR-таблица: добавлена строка ADR-0007 (Accepted).
   - Known Risks: пункт о потере данных при создании книги отмечен как **решённый** в Sprint 11,
     с явной оговоркой, что уже потерянная книга не восстановлена задним числом.
   - Current Priorities / Open Decisions / Next Milestone: "Sprint 11 scope" заменено на
     "Sprint 12 scope" (не определён).

## Валидация

```
grep -n "ADR-0007" docs/project/PROJECT_STATE.md → множественные упоминания (Current Sprint,
                    Completed Milestones, Current Architecture, ADR-таблица, Known Risks)
grep -n "normalizeBook" docs/adr/ADR-0007-multi-book-workspace.md → раздел "normalizeBook() — a
                    recurring class of bug", код функции, Review Trigger — все найдены
git status --short → ровно 3 файла из Allowed paths (CURRENT_SPRINT.md, CURRENT_STEP.md,
                    PROJECT_STATE.md — все M) + новый ADR-0007 + Step Card в active/;
                    apps/studio/** не тронут
```

## Отклонения от Step Card

Нет. Только документация, метод ADR-0004/0005/0006 соблюдён, факт потери первой книги явно
зафиксирован без смягчения.

## Стоп-условие

Не коммичу — жду `REVIEW.md` со `STATUS: OK` от Architect.

Жду REVIEW.md.
