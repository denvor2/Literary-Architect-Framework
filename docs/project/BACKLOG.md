# Literary Studio — Backlog

A parking lot for future ideas already discussed, organized by category. Nothing here is
scheduled or committed — see [docs/vision/roadmap.md](../vision/roadmap.md) for what's actually
planned by phase. Categories with nothing discussed yet are left empty rather than filled with
invented features.

## Platform

- Multi-user collaborative editing (Phase 3).
- Plugin architecture for third-party or domain-specific Experts (Phase 3).
- AI orchestration layer coordinating multiple Experts (Phase 2).

## Writing

- Generalizing beyond fiction to non-fiction books, articles, and technical documentation (see
  [ADR-0002](../adr/ADR-0002-expert-contract-vision.md)).
- Educational materials as a distinct use case (e.g. classroom use), possibly with its own
  pricing or feature set — see [docs/vision/pricing.md](../vision/pricing.md) (placeholder).

## Publishing

- Publishing pipeline (Phase 3) — export/submit manuscripts to common platforms or formats.

## Illustration

_No ideas captured yet._

## AI Experts

- Core Experts: Line Editor, Developmental Editor, Style Editor, Continuity Checker, Fact
  Checker, Research Assistant.
- Domain-specific Experts beyond the core set (e.g. a screenplay-format checker, a
  dialogue-voice-consistency Expert, a genre-convention advisor).
- Expert "chaining" — running a manuscript through multiple Experts as a configurable pipeline.
- User-defined/custom Experts once the plugin architecture (Phase 3) exists.

## Marketplace

- Plugin marketplace for third-party Experts or workflows (Phase 3).

## Mobile App

_No ideas captured yet._

## Desktop App

_No ideas captured yet._

## Author Website

_No ideas captured yet._

## Analytics

_No ideas captured yet._

## World Building

- Story knowledge graph (Phase 3) — entities, timelines, and relationships extracted from a
  manuscript, usable by continuity- and fact-checking Experts.

## Screenwriting

- Screenplay as one of the long-term writing domains (see roadmap and ADR-0002).
- Screenplay-specific continuity checking mentioned as an example domain-specific Expert.

## Audiobooks

_No ideas captured yet._

## Research

- Research Assistant as one of the core Experts.
- `docs/research/` exists in the repository as a home for research notes, currently empty.

## Architecture Ideas

Future architectural experiments, kept separate from product features:

- Shared-package strategy across multiple `apps/` (e.g. npm workspaces), if a second app is
  ever added — see [ADR-0001](../adr/ADR-0001-repository-structure.md)'s Future Impact.

## Note

Ideas here should graduate to `docs/vision/roadmap.md` (with a phase assignment) or an ADR once
they're actually decided. This file supersedes the "Ideas" section previously started in
[docs/vision/ideas.md](../vision/ideas.md); that file now points here.
