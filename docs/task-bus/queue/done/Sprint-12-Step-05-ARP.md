# ARP: Sprint-12-Step-05

**Step Card:** ADR-0008: Co-author Expert Contract + пересмотр ADR-0004 + закрытие Sprint 12
**Тип:** implementation (только документация)
**Исполнитель:** Programmer (Executor)

## Что сделано

### 1. `docs/adr/ADR-0008-coauthor-expert-contract.md` (новый файл)

Ратифицирован контракт Co-author Expert по методу ADR-0004/0005/0006/0007 — из уже
работающего кода, с построчными ссылками, а не абстрактным проектированием:

- **Request/Response Schema** — `POST /api/coauthor { currentText: string, bookContext: object
  }` → `{ ok: true, result: string } | { ok: false, error }`. Со ссылками на
  `route.ts:9-47`. Зафиксировано ключевое отличие от Line Editor: `currentText` может быть
  пустым (черновик с нуля), `bookContext` обязателен (не опционален, как у `improve_text`).
- **Первый по-настоящему генеративный Expert** — производит Revision, а не Review; UI
  переиспользует тот же превью-блок (Original/Improved + "Заменить текст"), что и Editor, именно
  поэтому, а не как недосмотр.
- **Первый Expert, получающий Book целиком** — добавлена таблица контекста по каждому Expert'у
  (Line Editor / Critic / Reader / Co-author) с обоснованием, зафиксированная прямо в этом ADR,
  как и требовал Step Card.
- **Позиция в цепочке AI Bus v5** — четвёртый вариант `AIOperation` (`coauthor_draft`), новая
  ветка `aiBus.execute()`, и явно отмечено, что добавление этого варианта потребовало убрать
  общий `const { text } = operation.payload` наверху `aiBus.execute()` — структурное, а не
  логическое следствие.
- **Product Role Mapping** — Co-author (UI) → Co-author Expert, впервые однозначное
  соответствие; резолвит `DOMAIN_MODEL.md`'s Open Question, висевший с самого создания
  документа.
- **Known Gaps, Consequences, Review Trigger** — по тому же формату, что и предыдущие ADR.

### 2. `docs/adr/ADR-0004-expert-contract-specification.md` — добавлен раздел, существующее не
переписано

- Добавлена аннотация 2026-07-06 (по образцу уже существующей 2026-07-05) со ссылкой на новый
  раздел и на ADR-0008.
- Добавлен раздел **"Revision (Sprint 12): optional `bookContext`"** в конец документа (после
  Review Trigger) — что изменилось (`route.ts:14-16`), обратная совместимость (при отсутствии
  `bookContext` запрос идентичен), что НЕ изменилось (задача Editor осталась полировкой,
  промпт явно запрещает расширять текст за пределы данного), ссылка на live-verification
  Sprint-12-Step-02/04, и уточнение к разделу "Scope: One Expert" — теперь верно только для
  Editor/Critic/Reader, не для всех четырёх видимых режимов.

### 3. `docs/product/DOMAIN_MODEL.md` — обновлены Open Questions

- Co-author теперь резолвится в Co-author Expert (ADR-0008) — первый генеративный Expert,
  получающий книгу целиком.
- Editor (Line Editor, ADR-0004) отмечен как теперь опционально получающий книжный контекст —
  без изменения задачи.
- Вопрос "не является ли Editor составным из нескольких Expert'ов ADR-0002" остаётся открытым,
  как и был — это не входило в scope этого шага.

### 4. `docs/vision/BOOK_LEVEL_ASSISTANTS_VISION.md` — добавлен раздел 15

- Итоги Sprint 12 (что сделано на уровне backend/контракта, что сознательно не тронуто на
  уровне UI).
- Перенос в Sprint 13 единым куском: консолидация переключателя помощников, сохранение
  выбранного режима, чат-механизм — с обоснованием, почему не дробится на два шага (одна и та
  же UI-поверхность).
- Находки браузерного тестирования: баг метки кнопки (найден и исправлен двумя экстренными
  шагами), английская служебная информация в `MODE_INFO` (отложена до Sprint 14, ссылка на уже
  существующее решение в разделе 6).

### 5. Закрытие Sprint 12

- **`CURRENT_SPRINT.md`** — полностью переписан для закрытия Sprint 12: все 5 шагов + оба
  экстренных фикса (`Fix-Assistant-Button-Label`, `Fix-Assistant-Button-Label-Ask` — оба
  указаны честно, а не свёрнуты в один пункт) с реальными хэшами коммитов; Out of Scope;
  Definition of Done; Known Open Items; Next Action (Sprint 13 не заскопирован).
- **`CURRENT_STEP.md`** — `id: Sprint-12-Step-05, status: done, next: []`.
- **`PROJECT_STATE.md`** — Current Sprint → Sprint 12 (closed); новый пункт Completed
  Milestones с полным описанием и хэшами коммитов; строка ADR-0008 в таблице ADR (Accepted),
  строка ADR-0004 помечена "revised Sprint 12"; Current Architecture — Co-author добавлен как
  четвёртый Expert, описано разделение payload-форм в `aiBus.execute()`, Product Role → AI
  Expert mapping — все четыре роли теперь 1:1; Current Priorities/Open Decisions/Next Milestone
  → Sprint 13 (не заскопирован).

## Валидация

```
grep -n "ADR-0008" docs/project/PROJECT_STATE.md          → 7 совпадений, OK
grep -n "Co-author Expert" docs/adr/ADR-0008-coauthor-expert-contract.md → 2 совпадения, OK
grep -n "Sprint 12" docs/adr/ADR-0004-expert-contract-specification.md  → 5 совпадений, OK
git status --short → только файлы из Scope (плюс сам Step Card в active/), apps/studio/**
не тронут.
```

## Отклонения от Step Card

Нет. Все правки — только в перечисленных в Scope файлах; код (`apps/studio/**`) не тронут.

## Stop Condition

Не закоммичено — жду `REVIEW.md` со `STATUS: OK` от Architect, как того требует Step Card.
