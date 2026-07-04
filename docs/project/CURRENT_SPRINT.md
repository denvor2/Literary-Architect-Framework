# Current Sprint

**Sprint 04 — First Working Expert** (closing)

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress. History lives in `docs/reports/SPRINT-04.md`, not here.

- **Status:** Closing — substantially complete; three items implemented/delivered but not yet
  committed (see Remaining Uncommitted Work). Recorded honestly here rather than marked done by
  fiat.
- **Phase:** Phase 1 (MVP)

## Goal

Build the first complete vertical slice of Literary Studio: one working Expert, the Line
Editor. This was intentionally a contract-discovery exercise — the Expert Contract was not
designed first; it was extracted from this implementation. See
[ADR-0002](../adr/ADR-0002-expert-contract-vision.md).

## In Scope

- Sprint 04 planning docs (this file, `docs/reports/SPRINT-04.md`).
- Repository-level `CLAUDE.md`.
- Anthropic SDK installation, `.env.example`, and a secrets convention.
- A minimal Claude connection test (Browser → Next.js API route → Anthropic → response).
- The Line Editor Expert: minimal UI, minimal prompt, minimal API route, minimal config.
- An Expert Contract extraction (successor to ADR-0002) — from what the Line Editor actually
  required.
- (Emerged during the sprint, not originally listed) A Literary Studio product documentation
  suite: Product Vision, Domain Model, User Model, Expert Catalog, Book Lifecycle, MVP Scope.
- (Emerged during the sprint, not originally listed) AI Bus v4: a step-based execution protocol
  layered on top of this workflow, now frozen as canonical infrastructure.

## Out of Scope

- A generic Expert framework, plugins, workflows, or orchestration.
- Any second Expert.
- Authentication, database, deployment.

## Tasks (Development Strategy)

- [x] Step 1: Create `CURRENT_SPRINT.md` for Sprint 04; create `SPRINT-04.md` report template.
- [ ] Step 2: Create repository-level `CLAUDE.md` — **implemented, not yet committed.**
- [x] Step 3: Install the Anthropic SDK; create `.env.example`; define the secrets convention —
      committed `19ab4c6`.
- [x] Step 4: Build the simplest possible connection test ("Test Claude Connection" button) —
      committed `75e92ae`, live-validated with a real Anthropic response.
- [ ] Step 5: Implement the Line Editor Expert (minimal UI / prompt / API route / config) —
      **implemented and live-validated with a real Anthropic response, not yet committed.**
- [ ] Step 6: Extract the Expert Contract from the Line Editor implementation — **extraction
      delivered as an ARP; not yet persisted as a superseding ADR.**
- [x] Step 7 (A–F): Literary Studio product documentation suite — all six documents committed
      (`13aed34`, `2acdea6`, `5e94746`, `f91d6aa`).

## Definition of Done

- Each step above is validated (build/run, manual check) before moving to the next.
- No step's implementation anticipates a later step's requirements — architecture follows what
  is built, not the reverse.
- Documentation (this file, `SPRINT-04.md`, `PROJECT_STATE.md`) stays in sync with what is
  actually done.
- Product Owner and Chief Software Architect review before commit, per the process established
  in Sprint 03.

## Sprint Success Criteria

- A user can click "Test Claude Connection" in the Studio App and see a real response from
  Claude. — **Met, live-validated.**
- A user can submit text through a minimal UI and get it back edited by the Line Editor Expert.
  — **Met, live-validated** (code not yet committed — see below).
- The Expert Contract proposal is written from what the Line Editor implementation actually
  required — not designed in advance. — **Met** (extraction delivered; not yet persisted as an
  ADR).

## Completed

- Step 1: Sprint 04 planning documents created.
- Step 3: Anthropic SDK, `.env.example`, secrets convention — committed and validated.
- Step 4: Connection test — committed and live-validated.
- Step 7 (A–F): Product documentation suite — committed in full.
- AI Bus v4 established as the project's canonical execution protocol (frozen; no further
  evolution planned absent a real deficiency).

## Remaining Uncommitted Work (carried into Sprint 05 unless closed first)

- **Step 2:** root `CLAUDE.md` exists in the working tree but has never been committed.
- **Step 5:** the Line Editor implementation (`apps/studio/src/app/api/line-editor/route.ts`,
  `apps/studio/src/components/LineEditorPanel.tsx`, and the `page.tsx` wiring) is implemented
  and was live-validated with a real Anthropic response, but has never been committed. Under
  this project's repository-first discipline, this work is not safely "done" until it is.
- **Step 6:** the Expert Contract extraction was delivered in full as an ARP (request/response
  schema, error model, prompt contract, deterministic behavior — all directly observed from the
  Step 5 code) but was never persisted as the superseding ADR that ADR-0002 calls for.
- A stray, unrelated edit to `docs/project/BACKLOG.md` (the AUTO-001 backlog entry from earlier
  in the sprint) also remains uncommitted.

These were deliberately **not** committed as part of this closeout: the closeout's own
instructions scoped commits to documentation named explicitly (product docs, project-state
docs), and application code changes were explicitly out of scope for this task. Recording the
gap here, rather than silently treating the sprint as fully closed.

## Next Action

Recommend opening Sprint 05 to begin Literary Studio MVP implementation using AI Bus v4 as a
fixed platform — while carrying the three items above forward as immediate first actions,
since they represent already-completed, already-validated work that only needs to be committed
and (for Step 6) formalized as an ADR.
