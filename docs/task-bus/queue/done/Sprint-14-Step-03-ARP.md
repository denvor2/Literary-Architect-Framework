id: Sprint-14-Step-03-ARP
name: "ARP: ревизия ADR-0006 + закрытие Sprint 14, открытие Sprint 15"
type: arp

## Что сделано

- **ADR-0006** — добавлена секция "Revision (Sprint 14 Step 01/02)", фиксирующая `persona` и
  механизм именованных экземпляров (тот же принцип, что ревизия ADR-0004 под `bookContext` в
  Sprint 12 — постфактум, не переписывание). Точечно обновлены две строки в "Known Gaps"/"Still
  not decided" — помечены как resolved этой ревизией, с явной ссылкой, а не молча удалены.
  Честно зафиксирован известный пробел: секция Request/Response Schema самого ADR всё ещё
  описывает дореформенную форму `{ text }` (Sprint 09), не `sceneText`+`messages` (Sprint 13) —
  это никогда не было отражено в ADR, зафиксировано как отдельный, не блокирующий Known Gap, не
  исправлено этой ревизией (вне scope этой карточки).
- **`CURRENT_SPRINT.md`** — полностью переписан: Sprint 14 закрыт (полная сводка Steps 01-03,
  хэши коммитов), Sprint 15 открыт (Goal — систематическая локализация, два пункта: промпты
  Line Editor/Critic + аудит английского UI-текста, по `SPRINT_ROADMAP.md`). Заодно поправил
  собственную неточную формулировку про "closing summary в git history N коммитов назад" —
  сводка на самом деле инлайн в этом же файле, не нужно искать в истории.
- **`CURRENT_STEP.md`** — `Sprint-14-Step-03, status: done, next: []` (Sprint 15 ещё не
  разбит на Step Card'ы).
- **`PROJECT_STATE.md`** — Sprint 14 добавлен в Completed Milestones, Current Sprint переключён
  на Sprint 15, ADR-0006 в таблице помечен "revised Sprint 14", Domain Model bullet обновлён
  (persona field), Current Priorities/Open Decisions/Next Milestone приведены в соответствие.
- **`HANDOVER.md`** — Current Sprint/Current Status/Accepted ADRs/Immediate Next
  Task/Priorities — то же самое приведение в соответствие.

## Соответствие Scope

Изменены ровно 5 файлов из Allowed paths (`git status --short` подтверждает). Код не тронут —
чисто документальный шаг, как и требовалось.

## Validation

- Все пять файлов взаимно непротиворечивы: Sprint 14 везде "closed" с одинаковыми хэшами
  (`e41793e`, `49f27ca`), Sprint 15 везде "in progress, not yet scoped into Step Cards".
- `grep -n "Sprint 14" ...` по трём project-файлам — все совпадения атрибутивные/исторические
  ("Sprint 14 —", "revised Sprint 14" и т.п.), ни одно не заявляет Sprint 14 как текущее
  состояние.

## Отклонения от Step Card

Нет.

## Stop Condition

Не закоммичено. Жду подтверждения Product Owner.
