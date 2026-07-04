# ADR-0003: Technology Stack Strategy

- **Status:** Accepted
- **Date:** 2026-07-04
- **Deciders:** Product Owner, Chief Software Architect, Lead Software Engineer

## Context

Sprint 04 is about to introduce the project's first real runtime dependency (the Anthropic
SDK), and later sprints will add persistence, an ORM, and UI components. Until now, technology
choices were made one at a time, in the sprint that needed them (e.g. Next.js in Sprint 03).
That was appropriate while the repository held no dependencies at all, but it does not scale:
without a stated stack and the principles behind it, each future sprint would re-litigate
language, runtime, database, and AI-integration choices independently, risking an
inconsistent, ad-hoc technology footprint in a project explicitly meant to evolve correctly
over years.

This ADR exists to fix the stack and the principles governing it *before* Sprint 04 installs
anything, so that Step 3 onward (Anthropic SDK, and every dependency after it) has an
architectural basis to point to instead of an implicit one.

## Decision

Adopt the following stack and deployment targets as the project's technological foundation.

**Language & Runtime**

- TypeScript
- Node.js

**Frontend**

- React
- Next.js
- Tailwind CSS
- shadcn/ui

**Persistence**

- PostgreSQL
- Prisma (ORM)

**AI Integration**

- Official provider SDKs only (starting with the Anthropic SDK in Sprint 04).
- No orchestration frameworks (e.g. LangChain, LlamaIndex) — see Alternatives Considered.
- A thin internal abstraction layer over provider SDKs is expected to emerge eventually, once a
  second provider or a real integration pattern exists to extract it from — it is not designed
  or built now, consistent with [ADR-0002](ADR-0002-expert-contract-vision.md)'s evolutionary
  approach.

**Deployment Targets**

The same project must run without architectural changes on: Windows, Linux, Docker Compose,
VPS, a dedicated server, and cloud hosting.

## Rationale

Each choice is justified against the same seven principles, not against the technology in
isolation:

1. **Open First.** PostgreSQL, Prisma, React, Next.js, and shadcn/ui are all open-source.
   shadcn/ui in particular is copied into the repository rather than pulled in as a proprietary
   component-library dependency, keeping UI code fully owned and inspectable.
2. **Standards First.** TypeScript, Node.js, React, and Tailwind are each the dominant,
   broadly-taught approach in their category — none require domain-specific knowledge beyond
   what's already common in web development.
3. **Local First.** The full stack (Next.js dev server, Postgres via Docker, Prisma migrations)
   runs entirely on a developer's machine with no required cloud dependency, matching Phase 1's
   single-user, local-first MVP.
4. **Cloud Ready.** Every element of the stack has mature, well-documented deployment paths to
   managed cloud services (e.g. managed Postgres, containerized Next.js) without a rewrite.
5. **LLM Agnostic.** Committing only to official provider SDKs — with no orchestration
   framework baked in — keeps the door open to additional AI providers later without
   unwinding a framework-specific integration.
6. **Evolutionary Architecture.** The AI-integration abstraction layer is named as a direction,
   not built — it will be extracted from real usage, the same discipline already established
   for the Expert Contract in ADR-0002.
7. **Boring Technology.** Every choice here is mature and widely adopted in production
   elsewhere. The explicit rejection of LangChain/LlamaIndex-style orchestration frameworks is
   the clearest expression of this principle: they are fashionable for AI projects right now,
   but add abstraction and dependency surface the project does not yet need.

## Alternatives Considered

- **LangChain / LlamaIndex-style orchestration frameworks.** Rejected. These add a heavy
  abstraction layer and dependency surface before even one Expert has been validated —
  directly contradicting both Evolutionary Architecture and Boring Technology. Official SDKs
  are sufficient for a single provider and a single Expert.
- **SQLite as the Phase 2 database**, as `docs/vision/roadmap.md` currently phrases it
  ("SQLite / PostgreSQL"). Superseded by PostgreSQL alone: SQLite doesn't meet Cloud Ready
  the same way across all six deployment targets (in particular concurrent access under Docker
  Compose/VPS/cloud), and standardizing on one database avoids a later migration between the
  two. `docs/vision/roadmap.md` should be updated to reflect this — see the impact analysis
  below.
- **Other ORMs** (Drizzle, TypeORM, raw SQL). Prisma was chosen for maturity, a
  TypeScript-first schema workflow, and broad community support — Boring Technology and
  Standards First both favor it over newer or lower-level alternatives.
- **Other component libraries** (MUI, Chakra UI). Rejected in favor of shadcn/ui specifically
  because it is copied into the repository as source rather than installed as a runtime
  dependency, which better satisfies Open First and avoids a UI-framework lock-in.
- **A non-Next.js frontend** (Remix, plain Vite+React). Not revisited — Next.js was already
  adopted in [ADR-0001](ADR-0001-repository-structure.md) and Sprint 03, and nothing in this
  ADR's principles argues against it.

## Consequences

**Positive**

- Every future dependency decision (Sprint 04 onward) can be checked against this ADR instead
  of being re-argued from scratch.
- The stack is deliberately unexciting and well-documented, reducing onboarding cost for any
  future contributor, human or AI.
- Deployment portability is a first-class constraint from the start, rather than discovered as
  a problem when a specific deployment target is actually needed.

**Negative / deferred**

- PostgreSQL and Prisma are heavier than Phase 1 actually needs — Phase 1 continues to use
  local JSON storage per the roadmap, so this ADR's database decision sits unused until Phase 2
  begins. That gap is intentional, not an inconsistency.
- The AI-integration abstraction layer is named but not designed. Until a second provider or a
  second integration pattern exists, there is no enforced consistency for how future AI calls
  are made beyond "use the official SDK directly" — an accepted short-term risk, mirroring
  ADR-0002's Expert Contract gap.
- Introducing Docker/Postgres as a local dependency is deferred to whenever Phase 2 actually
  starts; Sprint 04 is not affected by this (it only introduces the Anthropic SDK).

## Future Evolution

- The AI-integration abstraction layer should be extracted once a second AI provider, or a
  second Expert with a materially different integration need, actually exists — not before.
- Additional deployment mechanics (e.g. an orchestrator like Kubernetes) may be layered on top
  of the Docker Compose/VPS/cloud targets later without revising this ADR, since none of the
  approved technologies are incompatible with containerized orchestration.
- If a future requirement genuinely needs multi-step agentic orchestration beyond what a thin
  SDK wrapper can express, that must be proposed as a superseding ADR — not introduced
  piecemeal inside an Expert's implementation.

## Review Trigger

Revisit this ADR when any of the following occurs:

- A second AI provider is introduced (triggers designing the abstraction layer named above).
- An Expert or workflow need reveals that official SDKs alone are insufficient.
- PostgreSQL or Prisma prove inadequate for a concrete Phase 2 milestone.
- A deployment target outside the approved list (Windows, Linux, Docker Compose, VPS,
  dedicated server, cloud) becomes required.
