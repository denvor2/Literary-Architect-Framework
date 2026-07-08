id: Sprint-14-Step-03
name: "Ревизия ADR-0006 + закрытие Sprint 14, открытие Sprint 15"
type: architecture

## Scope

Allowed paths:
- `docs/adr/ADR-0006-reader-expert-contract.md`
- `docs/project/CURRENT_SPRINT.md`
- `docs/project/CURRENT_STEP.md`
- `docs/project/PROJECT_STATE.md`
- `docs/project/HANDOVER.md`

Forbidden paths:
- всё остальное (код не трогается — это чисто документальный шаг, по тому же принципу, что
  Sprint 12 Step 05).

## Objective

Зафиксировать в ADR-0006 опциональное поле `persona`, добавленное Step 01 (та же практика, что
ревизия ADR-0004 под `bookContext` в Sprint 12 Step 05 — постфактум, после того как код уже
написан и живо проверен). Закрыть Sprint 14, открыть Sprint 15 (систематическая локализация, по
`docs/vision/SPRINT_ROADMAP.md`).

## Output

ARP файлом в `docs/task-bus/queue/active/` + в чат.

## Stop Condition

Не коммитить без подтверждения Product Owner.
