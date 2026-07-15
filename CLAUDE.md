# CLAUDE.md

This file is loaded automatically at the start of every Claude Code session in this
repository. `apps/studio/CLAUDE.md` is separate and unrelated in purpose — it only carries
Next.js framework-version guardrails for that one application. This file carries project-wide
context and is not duplicated there.

## Project

**Literary Studio** — an AI-powered IDE for writers, not a chat-based writing tool. Specialist
AI Experts (Professional Roles) operate directly on a manuscript. Fiction is the first domain;
the architecture is designed to generalize to screenplays, non-fiction, articles, and technical
documentation. See [README.md](README.md).

## Roles

- **Product Owner** (Денис Воробьев) — product vision, priorities, scope approval.
- **Architect** — architectural review, long-term technical direction.
- **Programmer (Executor)** — implementation, documentation, risk-flagging.

Architect and Programmer (Executor) are roles, not fixed AI models — see
[PROJECT_CHARTER.md](docs/project/PROJECT_CHARTER.md)'s Role/Model Binding note. This file is
auto-loaded specifically by the Claude Code CLI, which is a fact about that tool's session
bootstrap, not a statement that the Programmer role is permanently bound to Claude.

## Subagents

Six project subagents formalize the roles above so work survives a single session running out
of budget (this has already happened once — Sprint 20-23 landed uncommitted-but-working when the
executing session hit its limit; a follow-up session recovered it). Defined in `.claude/agents/`:

| Situation | Subagent |
|---|---|
| A Step Card exists (in `pending/` or `active/`) and needs implementing | `step-executor` |
| An ARP is ready in `active/` and needs a verdict before commit | `architect-reviewer` |
| An ARP is ready in `active/` and needs independent functional re-verification | `tester` |
| A roadmap line/idea has no Step Card yet | `sprint-planner` |
| A UI/usability pass on an `apps/studio` component (review or implement) | `ui-specialist` |
| A Step Card was just committed, or a sprint just closed, and docs need syncing | `docs-writer` |

### Standing review pipeline (Product Owner decision, 2026-07-11)

Every completed Step Card goes through **both** `architect-reviewer` and `tester` before
`STATUS: OK`/commit — not either/or. `architect-reviewer` judges scope compliance, architectural
consistency, and honesty of the ARP's own prose; `tester` doesn't trust that prose and
independently re-drives the change on a fresh server to confirm it actually behaves as claimed.
Additionally, `ui-specialist` reviews design consistency **once per sprint** (not per step) —
normally as that sprint's own last Step Card, not a gate on every individual step.

Rules for using them:

- **A subagent does not see this conversation.** Always pass the Step Card's id or file path
  (and, for `architect-reviewer`/`tester`, the ARP's path too) explicitly in the prompt — plus
  enough background (which sprint, why now) that it doesn't have to guess. Do not assume "it'll
  figure it out."
- **Delegation does not relax the Stop Condition.** No subagent commits, pushes, or archives a
  card to `done/` — that stays a session/human action taken only after an explicit `STATUS: OK`,
  the same single point of accountability this project has used for every commit so far.
- **Don't wrap trivial edits in a Step Card + subagent** — a one-file, one-line fix is faster and
  clearer done directly.
- **A subagent that hits a genuine product ambiguity** (not a technical implementation choice)
  stops and reports it rather than guessing — the same "resolve technical ambiguity yourself,
  escalate product decisions" split already used throughout this project's history.

Three project skills support this workflow (`.claude/skills/`): `literary-studio-run` (how to
start/drive `apps/studio`), `literary-studio-live-verify` (this project's standing
no-mocks verification technique, required by every Step Card's Validation section), and
`literary-studio-ui-specialist` (the app's actual UI/design system, used by `ui-specialist`).

## Documentation Hierarchy

Authoritative, in this order:

1. [README.md](README.md)
2. [docs/project/PROJECT_CHARTER.md](docs/project/PROJECT_CHARTER.md)
3. [docs/project/PROJECT_STATE.md](docs/project/PROJECT_STATE.md)
4. [docs/project/CURRENT_SPRINT.md](docs/project/CURRENT_SPRINT.md)
5. [docs/project/HANDOVER.md](docs/project/HANDOVER.md)
6. [docs/project/DEVELOPMENT_WORKFLOW.md](docs/project/DEVELOPMENT_WORKFLOW.md)
7. [docs/adr/](docs/adr/)
8. [docs/reports/](docs/reports/)

If a decision isn't recorded here, it isn't decided — conversation history is not authoritative.

---

## 🚨 OUTPUT LANGUAGE RULE (SPRINT 06+)

All ARP outputs, logs, summaries, validation reports, and step descriptions
must be written in **Russian**.

Exceptions:
- Code blocks
- Identifiers (file names, variables, API routes)
- Technical symbols

This rule is mandatory unless explicitly overridden.

---

## Sprint Context

- Sprint 05: UI + Editor + AI integration + persistence (completed, UI stable)
- Sprint 06: Architecture refactor (Domain Model → Operation Layer → AI Bus v5)

IMPORTANT:
Sprint 06 does NOT introduce new user-facing features.
It restructures internal architecture while preserving identical UI behavior.

Any change that affects UI behavior is considered a violation unless explicitly approved.

---

## Evolutionary Architecture

Contracts are discovered from working examples, not designed upfront.

Do not design generic abstractions before they are validated by real usage.

See [ADR-0002](docs/adr/ADR-0002-expert-contract-vision.md).

---

## How to Work Here

- Read HANDOVER.md first in new sessions.
- Prefer smallest validated step over large redesign.
- Do not expand scope without explicit approval.
- If assumptions break: stop and escalate.
- Keep documentation synchronized with reality.
- **Don't ask for per-command confirmation on routine git/bash operations already within an
  approved Step Card's scope** (status checks, running validation commands, starting/stopping a
  scratch server, moving a card between `pending/`/`active/`, etc.) — Product Owner decision,
  2026-07-11, to cut down on unnecessary friction. This does not relax anything genuinely
  critical/irreversible (commit, push, delete, force-anything) — those still stop and confirm,
  same as always.

---

## Architecture Rule (SPRINT 06 CRITICAL)

During Sprint 06:

- UI must NOT directly evolve AI logic
- AI must NOT depend on UI state shape
- All AI calls should eventually pass through AI Bus v5
- Domain Model is the single source of truth for Book/Chapter/Scene

Temporary coupling is allowed only during migration steps — not as final state.

---

## Testing & Quality (SPRINT 35+ MANDATORY)

**Every Step Card must:**

1. **Have E2E tests if user-facing** — if feature touches UI, it needs Playwright test
   - Path: `apps/studio/e2e/feature-name.spec.ts`
   - Run: `npm run test:e2e e2e/feature-name.spec.ts`

2. **Update CRITICAL_FEATURES.md** — if function is user-visible and core
   - Add row to table in `docs/project/CRITICAL_FEATURES.md`
   - Mark status: ✅ VERIFIED (only after live testing confirms)
   - Link to E2E test file

3. **Pass `npm run validate` before commit**
   - Runs: format check → type check → lint → build → E2E tests
   - All must pass. Zero failures allowed.

4. **Prevent regressions via tests**
   - Breaking a user-facing feature = test failure on CI
   - Tests fail = PR cannot merge
   - This catches deletions/breaks BEFORE they reach main

**Sprint Closure Checklist:**
- [ ] All Step Cards have E2E tests (if UI-touching)
- [ ] All tests passing locally (`npm run test:e2e`)
- [ ] All critical features added to CRITICAL_FEATURES.md
- [ ] Live QA testing done (human verification)
- [ ] No regressions vs. previous sprint

See [CRITICAL_FEATURES.md](docs/project/CRITICAL_FEATURES.md) for tracked functions.