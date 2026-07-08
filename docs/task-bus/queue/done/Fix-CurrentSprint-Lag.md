id: Fix-CurrentSprint-Lag
name: "СРОЧНО (процесс): CURRENT_SPRINT.md/CURRENT_STEP.md вводят в заблуждение mid-sprint"
type: implementation

## Scope

Allowed paths:
- docs/project/CURRENT_SPRINT.md
- docs/project/CURRENT_STEP.md
- docs/task-bus/BOOTSTRAP.md

Forbidden paths:
- всё остальное

## Objective

Обнаружена структурная проблема процесса (не разовый баг): по
конвенции CURRENT_SPRINT.md/CURRENT_STEP.md обновляются только на
закрывающем шаге спринта — значит, в ЛЮБОЙ момент между спринтами
(как сейчас, Sprint 13 Step 04 из 6 done) они показывают ПРЕДЫДУЩИЙ
закрытый спринт как текущее состояние, ничего не зная о реально
идущей работе. Это уже минимум дважды за сегодня создало реальную
путаницу — в том числе у совершенно новой сессии Architect,
пытавшейся сделать bootstrap.

Level 2 в BOOTSTRAP.md ("Current Work" — именно эти два файла)
перестаёт быть надёжным источником ровно тогда, когда он нужнее
всего — в середине активного спринта.

### 1. Немедленно актуализировать CURRENT_SPRINT.md/CURRENT_STEP.md

Обновить оба файла, чтобы отражали реальное состояние: Sprint 13
(единый чат-механизм), Steps 01-04 закрыты и запушены, Step 05 (UI)
следующий, ещё не начат. Свериться с git log / docs/task-bus/queue/done/
как источником истины (та же методология, что уже использовалась в
Fix-Stale-HANDOVER).

### 2. Изменить саму конвенцию — обновлять CURRENT_STEP.md на КАЖДОМ шаге, не только на закрытии спринта

CURRENT_STEP.md по смыслу должен отражать "какой Step Card сейчас
последний завершённый/активный" — а не только финальное состояние
спринта. Предложение: каждый Step Card, закрывающийся через REVIEW
STATUS: OK, должен включать обновление CURRENT_STEP.md как часть
своего NEXT STEP (id последнего done-шага, status: done, next:
[следующий id]) — это дёшево (одна строка YAML) и устраняет весь
класс этой проблемы на будущее.

CURRENT_SPRINT.md можно оставить с текущей конвенцией (обновляется
на закрытии спринта, содержит полное summary) — но добавить в него
ОДНУ строку в духе "Sprint N in progress, see CURRENT_STEP.md for
latest completed step" вместо того, чтобы показывать предыдущий
спринт как будто он единственная правда.

### 3. Добавить предупреждение в BOOTSTRAP.md

В Level 2 явно указать: "CURRENT_SPRINT.md reflects the state as of
the last sprint CLOSE — mid-sprint, check CURRENT_STEP.md (updated
per-step, see below) and docs/task-bus/queue/done/ for the true
latest state."

## Rules

- Только эти три файла.
- Не переписывай остальную структуру BOOTSTRAP.md — точечное
  добавление предупреждения.

## Validation

- CURRENT_SPRINT.md/CURRENT_STEP.md отражают Sprint 13 Step 04 done,
  Step 05 next — сверено с git log.
- BOOTSTRAP.md содержит явное предупреждение про lag CURRENT_SPRINT.md.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect. Приоритетная задача — это
процессная проблема, уже создавшая путаницу дважды за сегодня.
