# Task Bus Queue — File-Based Handoff Protocol

Purpose-built for exchanging step/task files between the Architect and the Programmer
(Executor) through git alone — no server, no polling, no external infrastructure. This is a
documentation-only protocol, consistent with the standing limitation already recorded in
[TASK_BUS_V4.md](../TASK_BUS_V4.md)'s Risk Registry ("no technical enforcement exists for any rule
in this document"): nothing here adds tooling.

Architect and Programmer (Executor) are roles, not fixed AI models — see
`docs/project/PROJECT_CHARTER.md`'s Role/Model Binding note. Either role may be picked up by
whichever session (human or AI) is currently assigned to it.

## What moves through the queue

A single task/Step Card file per unit of work — the same kind of artifact already described by
`STEP_CARD_TEMPLATE.yml` and `PROMPT_TEMPLATE.md`. The queue does not duplicate ARP content or
review content: those continue to live in the conversation and in the existing `docs/task-bus/`
and `docs/reports/` documents. The queue only carries the task descriptor through its
lifecycle, to avoid the Task Bus Documentation Fragmentation risk already registered in
`TASK_BUS_V4.md`.

## Folders

- **`pending/`** — the Architect places a task file here when it is ready for the Programmer
  to pick up next.
- **`active/`** — the Programmer moves the file here (via `git mv`) in the same commit that
  begins work on it. At most one file should be in `active/` at a time — this mirrors the
  Single Active Step Rule already established for the wider protocol.
- **`done/`** — once the task's ARP has been delivered and the Architect has issued
  `STATUS: OK`, the Programmer moves the file here. `done/` is append-only: a file, once
  placed here, is never edited or removed — it is a historical record, the same discipline
  already applied to `EXECUTION_LOG.md`.

## Protocol

1. Architect adds a task file to `pending/`, commits.
2. Programmer, starting work, runs `git mv pending/<file> active/<file>` as part of the commit
   that begins the step — this is the signal that the step is now in progress.
3. Programmer completes the step and commits its ARP as a file alongside the Step Card in
   `active/` (e.g. `Sprint-07-Step-01-ARP.md`) — this is what makes the exchange work through
   git alone, without a human relaying ARP text back to the Architect.
4. Architect reviews the ARP file in `active/` and commits a `REVIEW.md` into the same
   `active/` folder, containing `STATUS: OK / FIX / STOP` per `REVIEW_FORMAT.md`. See
   Programmer Response to Review, below, for what happens next.
5. Only once `STATUS: OK` has been acted on does the Step Card, its ARP, and `REVIEW.md` move
   together to `done/` — see below. Until then, everything stays in `active/`.

Naming convention: reuse the existing Step Card id scheme, e.g. `Sprint-07-Step-01.md`,
`Sprint-07-Step-01-ARP.md`, `Sprint-07-Step-01-REVIEW.md` if more than one review needs to
coexist in history; a plain `REVIEW.md` is sufficient while only one Step Card is ever active
at a time (see Single Active Step Rule, above).

## Programmer Response to Review

После завершения работы над Step Card и коммита ARP в `queue/active/`, Programmer при
следующем запуске (или явно попросив об этом) проверяет `queue/active/` на появление файла
`REVIEW.md`.

- Если `REVIEW.md` отсутствует — Step Card ещё не рассмотрен, ожидание продолжается, новую
  работу не начинать.
- Если `REVIEW.md` присутствует со `STATUS: OK` — Programmer выполняет commit по правилам
  Standing Commit Policy (`TASK_BUS_V4.md`) и перемещает Step Card + ARP + `REVIEW.md` в
  `queue/done/` в том же коммите.
- Если `STATUS: FIX` — Programmer читает `NEXT STEP` из `REVIEW.md`, вносит исправления поверх
  текущей активной работы (Step Card не меняется, только его исполнение), коммитит обновлённый
  ARP в `queue/active/` поверх старого (append, не перезаписывая историю предыдущих попыток —
  см. `EXECUTION_LOG.md`'s "additive, never rewritten" принцип).
- Если `STATUS: STOP` — Programmer останавливает работу и не предпринимает никаких действий до
  явного решения человека; это единственный случай, где `REVIEW.md` сам по себе не является
  достаточным основанием для продолжения.

Это не отменяет право Architect или Product Owner вмешаться в любой момент — это лишь снимает
необходимость человека вручную передавать текст REVIEW обратно Programmer'у, когда обмен идёт
через git.

## What this protocol is not

- Not a replacement for ARP content, review content, or `CURRENT_SPRINT.md`/`CURRENT_STEP.md` —
  those remain the record of *what was decided and done*; the queue only records *whose turn it
  currently is*.
- Not automated — there is no script watching these folders. Whoever is starting a session
  checks folder state via `git status` / `git log`, the same repository-first discipline used
  everywhere else in this project.
