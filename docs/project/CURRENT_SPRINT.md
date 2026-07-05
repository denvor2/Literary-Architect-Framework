# Current Sprint

**Sprint 06 — Architecture Refactor (Domain Model → Operation Layer → AI Bus v5)** — **closed**

This file is a living document, replaced at the start of every sprint — it describes only the
sprint in progress. History lives in `docs/reports/SPRINT_06_REPORT.md`, not here.

- **Status:** Closed. All nine steps completed, validated, and committed (`f82f650`, "Sprint
  06: Architecture Foundation").
- **Phase:** Phase 1 (MVP)
- **Sprint 07:** Not started. No scope has been defined yet.

## Goal

Introduce a domain-driven architecture (`UI → Workspace Controller → Workspace → AI Bus v5 →
Operation → Context → Response → Applied Response → API`) underneath the existing, frozen
Sprint 05 UI — without changing any user-visible behavior. This was an internal architecture
sprint, not a feature sprint.

## In Scope

- Domain Model extraction (`Book`, `Chapter`, `Scene`, `Workspace`).
- AI Bus v5: Operation Model, Context Envelope, Response Normalization, Domain Applier.
- Persistence boundary (`workspaceStorage.ts`).
- Workspace Controller extraction (`useWorkspaceController`), reducing `page.tsx` to
  orchestration-only composition.

## Out of Scope (held constant all sprint)

- Any UI redesign or new user-facing feature.
- Changes to `/api/line-editor` (request, response, or prompt).
- Multi-model routing, scene-aware generation, memory injection — explicitly deferred, not
  implemented.

## Tasks (Development Strategy)

- [x] Step 01: Domain Model Lock — `domain/model.ts` created; local type duplication removed
      from `EditorArea.tsx`, `page.tsx`, `Sidebar.tsx`, `NewBookDialog.tsx`.
- [x] Step 02: AI Bus Introduction (read-only proxy layer) — `ai/aiBus.ts` created;
      `EditorArea.tsx` routed through it instead of a direct `fetch`.
- [x] Step 03: Operation Model Introduction — `ai/operations.ts` (`AIOperation`); `aiBus.execute`
      takes an operation instead of a bare string.
- [x] Step 04: Context Envelope Introduction — `ai/context.ts` (`AIContextEnvelope`); context
      data carried but deliberately unread by the bus.
- [x] Step 05: Response Normalization Layer — `ai/response.ts` (`AIResponse`); bus returns a
      structured object instead of a raw string.
- [x] Step 06: Domain Applier (no-effect layer) — `ai/applier.ts` (`AppliedAIResponse`);
      `domain`/`flags` present but not used for logic yet.
- [x] Step 07: Persistence Boundary — `storage/workspaceStorage.ts`
      (`loadWorkspace`/`saveWorkspace`); `localStorage` calls removed from `page.tsx`.
- [x] Step 08: Workspace Domain Extraction — `Workspace` type moved to `domain/workspace.ts`;
      dependency direction corrected (`workspaceStorage.ts` no longer imports from `page.tsx`).
- [x] Step 09: Workspace Controller Extraction — `workspace/useWorkspaceController.ts`;
      `page.tsx` reduced from 174 to 67 lines.

## Definition of Done

- Each step validated by `npm run build`, `npm run lint`, `prettier --check`, a grep-based
  migration check, and a live `next start` HTTP check before moving to the next.
- No step changed `/api/line-editor` or any user-visible behavior.
- Architect Review (ARP) delivered and approved for each step before proceeding.

## Sprint Success Criteria

- The UI behaves identically before and after the refactor — **met**, confirmed at every step.
- `/api/line-editor` request/response contract unchanged — **met**, confirmed at every step.
- `page.tsx` reduced to orchestration-only composition — **met** (174 → 67 lines).
- Domain Model is the single source of truth for `Book`/`Chapter`/`Scene`/`Workspace` — **met**.

## Completed

- All nine steps above, delivered as Architect Review Packages (ARP), approved, and committed
  in a single commit: `f82f650` ("Sprint 06: Architecture Foundation").
- Sprint 06 final closeout report: `docs/reports/SPRINT_06_REPORT.md`.

## Known Open Items (carried forward, not part of Sprint 06 scope)

- `LineEditorPanel.tsx` still calls `/api/line-editor` directly, bypassing the AI Bus —
  flagged since Step 02, explicitly out of scope for every step (each step restricted changes
  to specific named files).
- `ADR-0002` (Expert Contract Vision) remains `Proposed`, not yet ratified as a superseding ADR
  — unrelated to Sprint 06, carried over from Sprint 04.

## Next Action

Sprint 07 has not been started and has no defined scope. Scoping it is a Product
Owner / Chief Software Architect decision, not yet made.
