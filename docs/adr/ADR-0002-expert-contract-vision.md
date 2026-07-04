# ADR-0002: Expert Contract Vision

- **Status:** Proposed — vision only, not a binding specification
- **Date:** 2026-07-04
- **Deciders:** Product Owner, Chief Software Architect, Lead Software Engineer

## Context

Literary Studio's core differentiator is a system of AI Experts (Professional Roles) —
specialist personas such as Line Editor, Developmental Editor, Style Editor, Continuity
Checker, Fact Checker, and Research Assistant. The long-term vision covers multiple writing
domains (novels, short stories, screenplays, non-fiction, articles, educational materials,
technical documentation), with fiction as the first production-quality workflow because it
offers the richest domain for developing editorial Experts.

We are deliberately following an evolutionary architecture approach (confirmed for Sprint 03):
we do not design a concrete contract or interface before a working example has validated it.
This ADR exists to record *intent and constraints* ahead of that work, not to fix a schema.

## Decision

This ADR commits to the following vision-level principles, and explicitly defers the concrete
contract (interface shape, input/output schema, prompt template format, versioning scheme) to
a follow-up ADR written after the first real Expert is implemented.

**The first implementation discovers the contract; it does not implement a predefined one.**
The Line Editor (Sprint 04) is not "Expert #1 built to spec" — it is the mechanism by which the
spec is discovered. Its input/output shape, prompt structure, and integration points are
observations to be extracted afterward, not requirements to be satisfied beforehand.

1. **Generic and reusable.** The Expert system must not assume fiction-only usage. A
   domain-specific Expert (e.g. a screenplay-specific continuity checker) should be addable
   without changing the core architecture.
2. **Fiction first, by design not by accident.** The first production-quality workflow targets
   fiction because it is the richest domain to validate the Expert pattern against — not
   because the architecture is fiction-specific.
3. **Discover before codifying.** The concrete Expert Contract (data shapes, required fields,
   how prompts are located and versioned) will be extracted from the first working
   implementation — the Line Editor, planned for Sprint 04 — rather than designed
   speculatively. Nothing about the contract is decided until that implementation exists.
4. **This ADR will be superseded.** Once the Line Editor slice is validated, a follow-up ADR
   (e.g. "Expert Contract Specification") will record the discovered contract and supersede the
   vision recorded here.

## Architectural Principles

- **Discovery over specification.** Contracts earn their place in an ADR by surviving contact
  with a real implementation, not by anticipating one.
- **Domain-agnostic core.** Nothing in the Expert system's core may assume a specific writing
  domain (fiction, screenplay, non-fiction, etc.); domain knowledge lives inside an Expert, not
  in the mechanism that runs Experts.
- **Small number of Experts until the contract is ratified.** Additional Experts are not added
  purely to expand the catalog until a second implementation exists to cross-validate the
  contract discovered from the first.

## Expert Independence

- Each Expert is independently invocable and testable — no Expert depends on the internal
  behavior or state of another Expert.
- An Expert's internal prompt, reasoning strategy, and implementation details are private to
  that Expert; only its (eventual) contract-defined input/output is visible to the Studio App
  or other Experts.
- Removing or replacing one Expert must never require changes to another Expert's
  implementation — only to orchestration/workflow code, if any depends on it.

## Consequences

- Keeps the team from over-designing an abstraction before it has a real implementation to
  learn from — consistent with the project's evolutionary architecture approach.
- Means there is currently no enforced consistency across Experts, since none but the planned
  Line Editor exist yet. Acceptable short-term: the risk only compounds once a second Expert
  is added without a ratified contract, which is why extraction is scheduled for immediately
  after the first slice rather than left open-ended.
- Sets an expectation, visible in the repository, that Expert work in Sprint 04 is explicitly
  a contract-discovery exercise, not just a feature build.

## Review Trigger

Revisit (and supersede) this ADR when any of the following occurs:

- The Line Editor implementation (Sprint 04) is validated end-to-end.
- A second Expert is proposed before the Line Editor is validated — the contract must be
  ratified before a second Expert is built, not discovered twice independently.
- Any Expert needs to depend on another Expert's output, which would test the independence
  principle above.

## Follow-up

Superseding ADR to be written after Sprint 04's Line Editor implementation is validated.
