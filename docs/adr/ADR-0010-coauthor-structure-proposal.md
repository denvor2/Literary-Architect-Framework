# ADR-0010: Co-author Structure Proposal

- **Status:** Accepted
- **Date:** 2026-07-10
- **Deciders:** Product Owner, Programmer (Executor)
- **Relates to:** [ADR-0008](ADR-0008-coauthor-expert-contract.md) (Co-author Expert Contract)

## Context

Co-author currently drafts or continues prose — a single scene at a time. Writers also need
help organizing their book: proposing chapter/scene structure before or during writing. This
ADR adds a "propose structure" mode to Co-author that returns a structured JSON proposal
(chapters with scenes and descriptions) instead of prose, which the user can accept via
checkboxes.

## Decision

### Proposal Schema

```typescript
type StructureProposal = {
  chapters: Array<{
    title: string;
    subtitle?: string;
    scenes: Array<{
      title: string;
      description: string;
    }>;
  }>;
};
```

The proposal is a flat tree: chapters contain scenes. Each scene has a title and a short
description (1-2 sentences explaining what happens). No `id` fields — IDs are assigned on
acceptance, not by the AI.

### Transmission Mechanism

Extend `/api/coauthor` with an optional `mode` parameter:
- `mode: undefined` or `mode: "draft"` — existing behavior (prose generation), fully backward
  compatible.
- `mode: "structure"` — new behavior: system prompt asks for a JSON `StructureProposal`,
  response is parsed as JSON.

The `mode` is forwarded from a new `coauthor_propose_structure` AI Bus operation type. The
existing `coauthor_draft` operation is unchanged.

### Response Format

- Success: `{ ok: true, proposal: StructureProposal }` (structured JSON, not a text string).
- Parse failure: `{ ok: false, error: "Co-author response was not valid JSON." }`, HTTP 500.

This differs from `coauthor_draft`'s `{ ok: true, result: string }` — the mode change
warrants a different response shape.

### AI Bus

New operation type:
```typescript
{
  type: "coauthor_propose_structure";
  payload: {
    bookContext: Book;
    messages: ChatMessage[];
  };
}
```

No `sceneText` — structure proposals operate on the whole book, not a scene. `aiBus.execute()`
calls `/api/coauthor` with `{ bookContext, messages, mode: "structure" }`.

### UI Flow

1. In Co-author mode, a "Предложить структуру" button appears next to the mode label.
2. Clicking it sends a `coauthor_propose_structure` operation.
3. The response is displayed as a collapsible tree: chapters (with titles) containing scenes
   (with titles and descriptions), each with a checkbox.
4. All checkboxes default to checked.
5. Two buttons: "Добавить выбранное" (adds checked items) and "Добавить всё" (adds all).
6. Acceptance maps proposals to real `Chapter`/`Scene` domain objects via workspace
   controller — new chapters get empty scenes with the proposed titles; scene descriptions
   are discarded (they were AI suggestions, not manuscript text).
7. Existing chapters are NOT marked in the proposal — the proposal is always a fresh
   suggestion for the whole book structure.

### Workspace Controller

New function `acceptStructureProposal(proposal: StructureProposal, selectedIndices: Set<string>)`:
- `selectedIndices` is a set of `"chapterIndex"` or `"chapterIndex-sceneIndex"` strings.
- For each selected chapter: create a `Chapter` with the proposed title/subtitle and its
  selected scenes (each as an empty `Scene` with the proposed title).
- Chapters not in the proposal's selection are skipped entirely.

## Consequences

- `/api/coauthor` gains a `mode` parameter — a small, contained change to one route.
- `StructureProposal` is a local type in the route and in the UI — not added to the domain
  model (it's an AI response shape, not a persisted entity).
- Scene descriptions from the proposal are discarded on acceptance — they served their purpose
  as AI guidance during proposal generation.

## Known Gaps

- No "mark existing chapters" in the proposal — the AI sees the current structure in
  `bookContext` but the proposal doesn't visually distinguish "already exists" from "new".
  Acceptable at this stage; revisit if users find it confusing.
- `selectedIndices` uses string keys, not typed indices — simple but not type-safe. The set
  is small and short-lived (one proposal acceptance), so this is acceptable.

## Review Trigger

Revisit when:
- Users need to merge proposals with existing structure (partial acceptance).
- Scene descriptions should be preserved (e.g. as scene notes).
- The proposal should mark which chapters/scenes already exist.
