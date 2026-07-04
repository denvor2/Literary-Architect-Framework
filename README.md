# Literary Studio

**An AI-powered IDE for writers.**

Literary Studio pairs writers with a team of specialist AI Experts (Professional Roles) — Line
Editor, Developmental Editor, Style Editor, Continuity Checker, Fact Checker, and Research
Assistant — that work with a manuscript the way a human editorial team would.

## Vision

Writing is a craft, and craft benefits from expertise, not just generation. Literary Studio
exists to give every writer access to a full editorial team — available on demand, working
directly with the manuscript rather than in a side conversation.

Fiction is the first domain we're building for, because it's the richest testing ground for
developing editorial Experts — but the Expert system is designed to generalize across novels,
screenplays, non-fiction, articles, and technical documentation. See
[ADR-0002](docs/adr/ADR-0002-expert-contract-vision.md).

## Why Literary Studio?

Most AI writing tools are a chat box next to a blank page: general-purpose, stateless, and
disconnected from the manuscript's structure. Literary Studio is an **IDE, not a chatbot** —
Experts operate directly on the manuscript, hold context across the whole project, and are
each scoped to one editorial responsibility rather than "do anything."

## Design Principles

- AI augments the author, never replaces them.
- Architecture before features.
- Experts are modular.
- Evolutionary architecture — contracts are discovered from working examples, not designed
  upfront.
- Human review remains central.
- Security by design.

## Status

Early development. The Studio App (`apps/studio/`) is currently a bare Next.js scaffold; no AI
features are wired up yet. See [docs/reports/](docs/reports/) for sprint-by-sprint progress and
[docs/project/PROJECT_STATE.md](docs/project/PROJECT_STATE.md) for the current snapshot.

## Roadmap

Three phases — see [docs/vision/roadmap.md](docs/vision/roadmap.md) for the full breakdown:
**MVP** (local, single-user, first working Expert) → **Persistence & Orchestration** (accounts,
database, cloud sync, AI orchestration layer) → **Platform** (multi-user, plugin architecture,
publishing pipeline, story knowledge graph).

## Repository layout

This repository holds the whole Literary Studio ecosystem, not just the Studio App:

- `apps/studio/` — the Studio App (Next.js)
- `framework/` — the Expert/workflow/memory system powering the AI features
- `prompts/` — prompt templates used by the Framework
- `docs/` — architecture decisions (`adr/`), vision, sprint reports, and project docs
  (`project/`)
- `templates/`, `examples/`, `tests/`, `assets/` — supporting material

See [ADR-0001](docs/adr/ADR-0001-repository-structure.md) for why the app lives under `apps/`.

## Contributing

Active early-stage development with a small, fixed team. No external contribution process yet.
