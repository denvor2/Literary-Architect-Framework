# ADR-0001: Repository Structure

- **Status:** Accepted
- **Date:** 2026-07-04
- **Deciders:** Product Owner, Chief Software Architect, Lead Software Engineer

## Context

The repository was seeded in Sprint 01 as a monorepo skeleton (`framework/`, `prompts/`,
`docs/`, `templates/`, `examples/`, `tests/`, `assets/`) intended to hold the entire Literary
Studio ecosystem — architecture, prompts, Expert personas, editorial workflows, memory
schemas, documentation — not just application code. Literary Studio is explicitly not "one
app": it is an ecosystem in which one or more delivery applications (starting with a Next.js
Studio App) sit alongside the Framework that powers them.

In Sprint 03 we needed to add the first real application and had to decide where it lives
relative to those ecosystem-level directories, in a way that would still hold up once a second
application (e.g. a CLI, an admin tool, a Phase 3 plugin host) is added.

## Decision

Application code lives under `apps/<app-name>/`, sibling to `framework/`, `prompts/`, `docs/`,
etc. The first application is `apps/studio/`.

This keeps the ecosystem/delivery boundary explicit at the top level of the repository, rather
than letting one application's tooling conventions (its own `app/`, `public/`, config files)
occupy the repository root and implicitly become "the" project. As a secondary, practical
note: this also sidesteps `create-next-app`'s refusal to scaffold into a non-empty directory,
since the repository root already contains the Sprint 01 ecosystem folders.

## Architectural Principles

- **Ecosystem before application.** The repository models the whole Literary Studio ecosystem;
  any single application is one consumer of it, not its container.
- **Delivery is replaceable; the Framework is not.** Applications under `apps/` may be added,
  rewritten, or retired: the Framework, prompts, and architecture decisions are the durable
  layer.
- **No implicit root ownership.** No single application's build tooling should occupy the
  repository root, where it would compete with `framework/`, `prompts/`, and `docs/` for
  meaning.

## Future Impact

- Phase 2/3 apps (e.g. an admin tool, a CLI, a plugin host) can be added as further
  `apps/<name>/` directories without restructuring anything decided here.
- If multiple apps need to share code (e.g. Expert-invocation logic), a shared-package strategy
  (npm workspaces or similar) will be introduced under this same `apps/` boundary rather than
  by moving application code back to the root.
- Keeps the door open for the Framework itself to be published or consumed independently of
  any one application, since it was never coupled to `apps/studio/`'s location.

## Consequences

**Positive**

- Clean separation between the "ecosystem" layer (architecture, prompts, Experts, workflows,
  memory schemas, docs) and the "delivery" layer (application code).
- Room to add further apps later (CLI tools, admin interfaces, etc. in Phase 2/3) without
  restructuring.
- Next.js internals (`node_modules`, `.next`, framework-specific config) stay isolated from
  the rest of the repository.

**Negative / deferred**

- Introduces a layer of nesting (`apps/studio/...`) rather than a flat root.
- Shared-code strategy across multiple apps is not addressed now — deferred until a second app
  actually exists (see Future Impact).

## Alternatives Considered

- **Scaffold Next.js directly at the repository root.** Rejected: the root is already
  non-empty with ecosystem folders, and mixing Next.js's own root-level conventions
  (`app/`, `public/`, config files) with `framework/`, `prompts/`, `docs/` would blur the
  boundary between the ecosystem and a specific application.

## Review Trigger

Revisit this ADR when any of the following occurs:

- A second application is added under `apps/`.
- Two applications need to share code, requiring a workspace/package strategy.
- The Framework needs to be consumed outside of any single application (e.g. published as a
  package, or run as a standalone service).
