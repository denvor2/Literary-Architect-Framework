# Current Sprint

**Sprint 03 — First Implementation Sprint** (wrapping up, pending final Architecture Review
and commit)

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress. History lives in `docs/reports/SPRINT-NN.md`, not here.

- **Status:** In Review (Architecture Review pass complete, awaiting sign-off)
- **Phase:** Phase 1 (MVP)

## Goal

Bootstrap the first working piece of the Literary Studio application using an evolutionary
architecture approach: get a real, running Studio App in place, and produce the repository's
first architectural documentation — before designing any Expert contracts.

## In Scope

- Studio App scaffold, build, and dev server validation.
- First architectural documentation (ADRs, README, vision, project docs).

## Out of Scope

- AI integration (Anthropic SDK), Experts, workflows, prompts.
- Authentication, database, deployment.

## Tasks

- [x] Scaffold the Studio App (`apps/studio/`) with Next.js, TypeScript, Tailwind, App Router.
- [x] Verify production build succeeds.
- [x] Verify the development server runs and serves the default page.
- [x] Review generated files (`apps/studio/CLAUDE.md`, `apps/studio/AGENTS.md`).
- [x] Write Sprint 03 report.
- [x] Architecture Review pass #1: ADR-0001, ADR-0002, README rewrite, `docs/vision/`.
- [x] Architecture Review pass #2: strengthen ADRs, sync Sprint 03 report, add
      `docs/project/` (this file included).
- [x] Architecture Review pass #3: refinement pass across `docs/project/` (Scope, Quality
      Values, Non-Goals, Open Decisions, Success Criteria, and similar additions).
- [ ] Final Architecture Review sign-off and Git commit.

## Definition of Done

- Studio App builds and runs locally — confirmed.
- No application functionality (AI integration, UI changes, auth, database) introduced this
  sprint — confirmed out of scope.
- All documentation produced this sprint is internally consistent (terminology, links,
  no outdated statements) — pending final consistency pass.
- Product Owner and Chief Software Architect have reviewed and approved before commit.

## Sprint Success Criteria

- `npm run build` and `npm run dev` both succeed in `apps/studio/`.
- Every document created or edited this sprint links correctly and uses consistent
  terminology (see [HANDOVER.md](HANDOVER.md)).
- Repository state matches what Sprint 03's report claims — no stale statements.

## Completed

- Working Studio App scaffold, build, and dev server.
- ADR-0001 (Repository Structure) and ADR-0002 (Expert Contract Vision).
- Rewritten README as public product vision (IDE framing, Design Principles).
- `docs/vision/` (roadmap, pricing placeholder, security placeholder, ideas).
- `docs/project/` (charter, state, this file, backlog, handover, workflow).
- Sprint 03 report, twice revised to stay in sync with the above.

## Deferred

- Repository-level `CLAUDE.md`.
- Anthropic SDK integration and the Line Editor Expert (Sprint 04).
- `.env` / secrets convention.
- Backfilling actual Sprint 02 pricing and security decisions.

## Lessons (so far)

- Architecture Review before commit catches stale statements a single-pass write misses (see
  the full [Lessons Learned](../reports/SPRINT-03.md#lessons-learned) in the Sprint 03 report).

## Next Action

Await Architecture Review sign-off from the Product Owner and Chief Software Architect. On
approval: commit Sprint 03 as a single reviewed change, then open Sprint 04.
