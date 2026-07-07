id: Fix-Stale-HANDOVER
name: "СРОЧНО: HANDOVER.md устарел (говорит Sprint 06/07, реально Sprint 13)"
type: implementation

## Scope

Allowed paths:
- docs/project/HANDOVER.md

Forbidden paths:
- всё остальное

## Objective

Обнаружено новой сессией Claude Code при bootstrap: HANDOVER.md
утверждает "Sprint 06 closed, Sprint 07 not scoped" — реально Sprint
13 в процессе (Step 03 закрыт, Step 04 в очереди). Это реальный
дрейф документации (не мисматч окружения, в отличие от пустой
очереди pending/ в свежем клоне — то отдельная, уже объяснённая
история).

Обновить HANDOVER.md, чтобы он отражал актуальное состояние —
свериться с PROJECT_STATE.md/CURRENT_SPRINT.md как источником
истины (сейчас они тоже могут быть не идеально свежими на момент
выполнения этой задачи — сверься с последним коммитом в git log,
не только с текстом этих файлов, если есть расхождение).

## Rules

- Только HANDOVER.md.
- Не переписывай структуру документа — только актуализируй факты
  о текущем состоянии проекта.

## Validation

- HANDOVER.md больше не содержит "Sprint 06"/"Sprint 07" как
  текущее состояние.
- git log сверен как источник истины для формулировки актуального
  спринта/шага.

## Output

ARP файлом в docs/task-bus/queue/active/ + в чат.

## Stop Condition

Не коммить до STATUS: OK от Architect.
