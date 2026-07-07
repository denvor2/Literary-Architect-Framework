id: Fix-Stale-HANDOVER-ARP
name: "ARP: HANDOVER.md актуализирован (Sprint 06/07 → реальное состояние Sprint 13)"
type: arp

## Что сделано

`docs/project/HANDOVER.md` — только факты, структура документа (заголовки, порядок разделов) не
менялась.

Источник истины — `git log` (не `PROJECT_STATE.md`/`CURRENT_SPRINT.md`: оба сами оказались
устаревшими на момент выполнения, см. ниже) плюс `docs/task-bus/queue/done/Sprint-13-Step-0{1,2,3}.md`
для точных формулировок того, что каждый шаг сделал.

Изменённые разделы:

- **Current Sprint** — было "Sprint 06 closed, Sprint 07 not scoped"; стало: Sprint 13 в процессе,
  Steps 01-03 закоммичены (с кратким описанием каждого), Step 04 — active, ожидает ревью. Явно
  отмечено расхождение: `CURRENT_SPRINT.md` сам ещё не обновлён после Sprint 12 closing — `git log`
  и `docs/task-bus/queue/done/` названы более актуальным источником до тех пор, пока это не
  исправлено (это отдельная задача, не в скоупе этого шага).
- **Architecture** — пункт про "Expert Contract deliberately not yet designed" (ссылка только на
  ADR-0002) был не просто устаревшим фактом, а активно вводящим в заблуждение: контракт давно
  ратифицирован (ADR-0004) и переиспользован для Critic/Reader/Co-author (ADR-0005/0006/0008).
  Переписан, чтобы отразить это.
- **Current Status** — полностью пересобран по факту: 4 живых AI-эксперта (было — только Line
  Editor), multi-book Workspace (Sprint 11), `assistantThreads` (Sprint 13 Step 01), новая форма
  AI Bus payload `sceneText`+`messages` (Step 03) с явным указанием, что UI ещё не обновлён (Step 05)
  и поэтому `tsc --noEmit` сейчас краснеет в разрешённых для того шага файлах — это ожидаемо, не
  регрессия. Также снят "Known gap" про `LineEditorPanel.tsx` в обход AI Bus — он резолвнут ещё в
  Sprint 07 Step 02 (подтверждено грепом по коду: `aiBus.execute()` используется, прямого `fetch`
  нет).
- **Accepted ADRs** — таблица дополнена ADR-0004…0008 (сверено с `docs/adr/` — файлы существуют,
  статусы взяты из `PROJECT_STATE.md`'s таблицы, которая для этого раздела осталась точной).
- **Immediate Next Task** / **Current Priorities** — переписаны под реальное состояние (Step 04
  ожидает ревью → Step 05 UI wiring следующий → бэклог pricing/security). Пункт про
  "формализовать Expert Contract как ADR, замена ADR-0002" убран как уже выполненный.
- **Important Rules** / **Avoid** — тот же принцип, что в Architecture: убрана буквальная
  инструкция "не добавляй второго эксперта, пока Line Editor не откроет контракт" (контракт давно
  открыт, добавлено ещё 3 эксперта после Line Editor) — оставлен общий принцип evolutionary
  architecture (применим к будущим, ещё не построенным возможностям), убрана только
  историческая, уже неверная частность.

## Соответствие Scope

- Единственный изменённый файл: `docs/project/HANDOVER.md` (Allowed path).
- Структура документа (заголовки, их порядок, "First Five Minutes", "Working Style", "If You Are
  Unsure", "Repository Structure" и т.д.) не тронута — только фактическое содержание конкретных
  разделов, как требует Rules Step Card'а.

## Validation

- `grep -n "Sprint 06\|Sprint 07" docs/project/HANDOVER.md` → 3 совпадения, все — историческая
  атрибуция ("Sprint 06 architecture", "since Sprint 07 Step 02", "updated at Sprint 06
  closeout"), ни одно не утверждает Sprint 06/07 как текущее состояние. Соответствует критерию
  Step Card'а буквально ("не содержит Sprint 06/07 как текущее состояние" — не "не содержит
  строку вообще").
- `git log` сверен как источник истины (см. выше) — конкретно, `git log --oneline -20` и
  содержимое `docs/task-bus/queue/done/Sprint-13-Step-0{1,2,3}.md`.
- `git status --short` — только `docs/project/HANDOVER.md` в изменённых файлах (плюс сама эта
  задача, перемещённая в `active/`, как обычно).

## Отклонения от Step Card

Одно, содержательное — Step Card просил актуализировать факты, не структуру. Я расширил правку на
разделы "Architecture"/"Important Rules"/"Avoid" сверх изначально названных в Objective
(там явно назывались только "Sprint 06/07 as current state"). Причина: эти три раздела содержали
не устаревшую дату, а действующую, но фактически неверную директиву ("не добавляй второго
эксперта") — оставить её как есть значило бы, что новая сессия прочитает буквальный запрет,
который проект уже нарушил трижды (Critic/Reader/Co-author). Посчитал это тем же классом дрейфа,
который просила исправить задача, а не выходом за Objective — но явно flag'аю как решение,
принятое по ходу, а не буквально из текста карточки.

## Stop Condition

Не закоммичено — жду `STATUS: OK` от Architect.
