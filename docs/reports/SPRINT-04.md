# Sprint 04 Report

**Project:** Literary Studio
**Sprint:** 04 — First Working Expert
**Date:** 2026-07-04
**Roles:** Product Owner (Денис Воробьев), Chief Software Architect (ChatGPT), Lead Software Engineer (Claude)

## Sprint Goal

Build the first complete vertical slice of Literary Studio — one working Expert, the Line
Editor — as a contract-discovery exercise per
[ADR-0002](../adr/ADR-0002-expert-contract-vision.md). Not a framework. Not multiple Experts.

## Completed Work

- **ADR-0003 (Technology Stack Strategy)** drafted, accepted, and its consequences synced into
  `PROJECT_STATE.md`, `HANDOVER.md`, `roadmap.md`, and `security.md`.
- **Project Bootstrap ("Bootstrap A")**: Prettier + ESLint alignment, the default Create Next
  App landing page replaced with a minimal branded Literary Studio shell, metadata updated,
  unused starter assets removed. Committed `f912f38`.
- **Anthropic SDK integration (Step 3)**: SDK installed, `.env.example` created, secrets
  convention defined (`.env.local`, server-only access via a single Route Handler integration
  point). Committed `19ab4c6`.
- **Claude connection test (Step 4)**: a minimal "Test Claude Connection" button, wired through
  a Next.js Route Handler to the Anthropic SDK. Committed `75e92ae`, later live-validated with
  a real Claude response.
- **Line Editor discovery implementation (Step 5)**: minimal UI, minimal hardcoded prompt,
  minimal API route, reusing the existing single Anthropic integration point. Live-validated
  with a real Claude response on a sample passage. **Not yet committed** (see Risks).
- **Expert Contract extraction (Step 6)**: request/response schema, error model, prompt
  contract, and deterministic-behavior characteristics extracted directly from the Step 5 code
  and delivered as a full ARP. **Not yet persisted as the superseding ADR** ADR-0002 calls for.
- **AI Bus v4**: a step-based execution protocol (Roles, Step Cards, Bridge to Sprint planning,
  Execution Log, Binding/Closure rules) was designed, revised through a Protocol Debt Review,
  and frozen as canonical infrastructure. No further evolution is planned absent a real
  deficiency surfacing in future sprints.
- **Literary Studio product documentation suite (Step 7A–7F)**: Product Vision, Domain Model,
  User Model, Expert Catalog (Visible Assistants), Book Lifecycle, and MVP Scope — six
  documents, all committed (`13aed34`, `2acdea6`, `5e94746`, `f91d6aa`).
- **Live end-to-end validation**: both the Test Connection and Line Editor flows were exercised
  against the real Anthropic API with a real API key, confirming the full
  Browser → Route Handler → Anthropic → Response path works.

## Architectural Decisions

- **ADR-0003 (Technology Stack Strategy)** — accepted. Fixes language/runtime, frontend,
  persistence, AI integration approach, and deployment targets for the project.
- **No Expert Contract ADR yet.** Per ADR-0002's evolutionary approach, the contract was
  deliberately not designed before the Line Editor existed. It has now been extracted from a
  real, live-validated implementation — but writing the superseding ADR is deferred to
  immediately after this sprint closes, not bundled into this closeout.
- **AI Bus v4 frozen.** Established as the project's execution protocol; per explicit
  instruction, no further protocol evolution unless a real deficiency is exposed by future
  sprint execution.

## Project Structure

Net new since Sprint 03: `apps/studio/src/lib/ai/anthropic.ts` (single Anthropic integration
point), `apps/studio/src/app/api/test-connection/route.ts` and `.../api/line-editor/route.ts`
(Route Handlers), `apps/studio/src/components/TestConnectionButton.tsx` and
`LineEditorPanel.tsx` (client components), `apps/studio/.env.example`; `docs/ai-bus/` (the full
AI Bus v4 protocol); `docs/product/` (the six-document product suite). Full current tree is
maintained in `docs/project/HANDOVER.md`, not duplicated here.

## Remaining Work

- Commit root `CLAUDE.md` (Step 2 — exists in the working tree, never committed).
- Commit the Line Editor implementation (Step 5 — implemented and live-validated, never
  committed).
- Write and commit the superseding Expert Contract ADR (Step 6 — extraction complete,
  formalization pending).
- Reconcile a stray, unrelated uncommitted edit to `docs/project/BACKLOG.md` (the AUTO-001
  entry from earlier in the sprint).
- Backfill remaining Sprint 02 context (pricing, detailed security requirements) — carried
  forward from Sprint 03, still open.

## Risks

- **Repository-first discipline was not fully honored this sprint.** Three real, validated
  deliverables (Step 2, Step 5, Step 6) exist only in the working tree or in conversation, not
  in committed history — the same failure mode AI Bus v4's Bootstrap-B/C finding was meant to
  prevent going forward. This sprint shows the risk recurring even after the rule was written
  down, which is itself worth noting.
- ADR-0002 remains formally `Proposed` and unratified. A second Expert must not be started
  before the Expert Contract extraction is written up as its superseding ADR.
- Sprint 02's pricing and detailed security requirements remain undocumented in-repo,
  unchanged from Sprint 03.

## Recommendations

- Treat committing the three pending Step 2/5/6 deliverables as the first action of Sprint 05,
  not an afterthought — they are already done in substance and only need to become durable.
- Write the Expert Contract ADR from the existing extraction before any second Expert is
  planned, per ADR-0002's Review Trigger.
- Keep AI Bus v4 frozen as instructed; do not let routine Sprint 05 friction become an excuse
  to reopen protocol design without a genuine, demonstrated deficiency.

## Sprint Outcome

Sprint 04 delivered a working, live-validated Anthropic integration (Test Connection and Line
Editor), extracted a real Expert Contract from that implementation rather than designing one in
advance, produced and froze a step-based execution protocol (AI Bus v4), and produced a
complete product-documentation foundation for Literary Studio (vision, domain model, user
model, assistant catalog, book lifecycle, MVP scope). It closes with three already-complete
items not yet committed — a known, explicitly recorded gap rather than a silently accepted one.

## Lessons Learned

- Live validation with a real API key surfaced things a mocked/graceful-failure check could
  not — worth treating as a required step before considering any AI-integration work closed, not
  an optional nice-to-have.
- A written repository-first rule (AI Bus v4's Repository-First Enforcement) did not, by
  itself, prevent new uncommitted-but-complete work from accumulating in the same sprint that
  wrote the rule — process discipline needs a closing checklist, not just a stated principle,
  to actually catch this.
- Separating product documentation (`docs/product/`) from architecture documentation
  (`docs/adr/`, `docs/ai-bus/`) let product-vision work proceed independently and quickly
  without waiting on or blocking the Expert Contract/AI Bus threads, and vice versa.

## Proposed Sprint 05 Goals

1. Commit the three pending Sprint 04 deliverables (`CLAUDE.md`, Line Editor implementation,
   Expert Contract ADR) as the opening actions of the sprint.
2. Begin Literary Studio MVP implementation per `docs/product/MVP_SCOPE.md`, using AI Bus v4 as
   a fixed, frozen execution platform.
3. Resolve the stray `BACKLOG.md` edit left over from Sprint 04.
