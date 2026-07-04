# Literary Studio — Roadmap

This roadmap reflects the phased architecture vision agreed by the Product Owner and Chief
Software Architect. It is a living document — later sprints will refine timing and scope
within each phase.

## Phase 1 — MVP (current)

Goal: prove the core loop — a writer works with AI Experts inside a simple, local, single-user
Studio App.

- Next.js, TypeScript, React, Tailwind CSS
- Local JSON storage (no database)
- Single-user, no authentication
- First Expert(s) implemented end-to-end, starting with fiction editing (Line Editor)

## Phase 2 — Persistence & Orchestration

Goal: move from a local single-user tool to a persisted, multi-session product.

- SQLite / PostgreSQL storage
- User accounts
- Cloud synchronization
- AI orchestration layer coordinating multiple Experts/workflows

## Phase 3 — Platform

Goal: Literary Studio as a collaborative, extensible platform.

- Multi-user collaborative editing
- Plugin architecture (third-party or domain-specific Experts)
- Publishing pipeline
- Story knowledge graph

## Notes

- Fiction is the first domain exercised end-to-end, but the Expert system (see
  [ADR-0002](../adr/ADR-0002-expert-contract-vision.md)) is intended to generalize to
  screenplays, non-fiction, articles, educational materials, and technical documentation.
- Phase boundaries are directional, not committed dates. Sprint-level plans will state what
  is actually in scope for the next sprint.
