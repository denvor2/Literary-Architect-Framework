# Literary Studio — Domain Model

Formalizes the domain language of Literary Studio, grounded strictly in
[PRODUCT_VISION.md](PRODUCT_VISION.md) and existing repository documentation. This is not an
implementation document — it does not describe React, Next.js, APIs, the database, prompts, or
AI Bus internals. Where a term has no grounding in existing documentation, that is stated
explicitly rather than filled in with an invented definition.

## Terminology Resolution (from Step 07A)

Step 07A left an open terminology divergence between the product-facing vocabulary in
`PRODUCT_VISION.md` (Co-author, Editor, Critic, Readers) and the AI Expert vocabulary already
established in `README.md` / `PROJECT_CHARTER.md` / [ADR-0002](../adr/ADR-0002-expert-contract-vision.md)
(Line Editor, Developmental Editor, Style Editor, Continuity Checker, Fact Checker, Research
Assistant). This document resolves it as follows, per this task's instruction:

- **Product Role** — a user-facing concept (Editor, Critic, Reader, Co-author). This is what a
  writer sees and interacts with.
- **AI Expert** — an internal implementation capability (Line Editor, Developmental Editor,
  Style Editor, Continuity Checker, Fact Checker, Research Assistant, per ADR-0002). Not
  user-facing.
- **A Product Role may use one or more AI Experts.** The mapping is many-to-one at minimum;
  nothing in existing documentation specifies an exact, fixed mapping (see Open Questions).
- This document's term **"AI Role"** (below) is the same concept as **Product Role** — two
  names have been in circulation since Step 07A. This document adopts **Product Role** as the
  canonical term going forward and treats "AI Role" as a retired synonym.

## The Ten Terms

### 1. User

A writer using Literary Studio. Per `PRODUCT_VISION.md`'s three personas: beginner writer,
active amateur writer, and professional author with many unfinished manuscripts. A User owns
one or more Books.

### 2. Book

The top-level project container, per `PRODUCT_VISION.md`'s Core User Journey ("Create Book →
Fill project information"). Holds project information and a structure of Chapters. Called
"Book project" in `PRODUCT_VISION.md`'s MVP Scope.

### 3. Chapter

A structural subdivision of a Book, per the Core User Journey ("Create chapters"). Contains
Scenes.

### 4. Scene

A structural subdivision of a Chapter, per the Core User Journey ("Create scenes"). Listed
explicitly in `PRODUCT_VISION.md`'s MVP Scope. The most granular structural unit named in
existing documentation.

### 5. Block

**Not grounded in any existing document.** `PRODUCT_VISION.md` and all other reviewed
documentation stop at Scene as the smallest structural unit. This document does not invent a
definition — see Explicit Assumptions and Open Questions.

### 6. Workspace

**Not grounded in any existing document** under this exact term. `README.md` frames Literary
Studio as an "AI-powered IDE for writers," which implies some notion of a workspace by
analogy to IDE conventions, but no repository document defines what a Workspace is or how it
relates to a User or a Book. See Explicit Assumptions and Open Questions.

### 7. AI Role

See Terminology Resolution, above — this document treats "AI Role" as a retired synonym for
**Product Role**: a user-facing role such as Editor, Critic, Reader, or Co-author, per
`PRODUCT_VISION.md`'s MVP Scope and Core User Journey.

### 8. AI Expert

An internal implementation capability — Line Editor, Developmental Editor, Style Editor,
Continuity Checker, Fact Checker, Research Assistant — per ADR-0002 and `README.md`. Not
user-facing. A Product Role is realized by invoking one or more AI Experts (see Terminology
Resolution).

### 9. Review

Not named explicitly as a noun in `PRODUCT_VISION.md`, but inferred directly from the Core
User Journey's "Critic" and "Beta readers" stages: the feedback or assessment a Product Role
produces about a Scene, Chapter, or Book. A Review does not itself change manuscript content —
it is input to a subsequent Revision.

### 10. Revision

Also inferred directly from the Core User Journey, specifically its "Iterative improvements"
stage: a resulting change to manuscript content (at Scene, Chapter, or Book level) made in
response to a Review or to Co-author/Editor collaboration. Distinct from Review: a Review
assesses; a Revision changes.

## Relationships (grounded only)

- A **User** owns one or more **Books**.
- A **Book** contains **Chapters**; a **Chapter** contains **Scenes**. (Block's place in this
  hierarchy, if any, is not established — see Open Questions.)
- A **Product Role** (Editor, Critic, Reader, Co-author) is invoked by a User against a Book,
  Chapter, or Scene.
- A **Product Role** is realized by one or more **AI Experts**; AI Experts are not directly
  addressable by the User.
- A **Review** is produced by a Product Role (most directly, Critic or Reader, per the Core
  User Journey) and refers to a Scene, Chapter, or Book.
- A **Revision** follows a Review or a Co-author/Editor collaboration and results in changed
  Scene, Chapter, or Book content.

## Open Questions

- What is a **Block**? No existing document defines it, its relationship to Scene, or whether
  it is a sub-unit (e.g. a paragraph) or something else entirely.
- What is a **Workspace**, and how does it relate to User and Book — is it per-Book, per-User,
  or a separate concept altogether?
- Which specific **AI Expert(s)** does each **Product Role** use? **Resolved for Critic**
  ([ADR-0005](../adr/ADR-0005-critic-expert-contract.md)), **Reader**
  ([ADR-0006](../adr/ADR-0006-reader-expert-contract.md)), **Editor**
  ([ADR-0004](../adr/ADR-0004-expert-contract-specification.md)), and **Co-author**
  ([ADR-0008](../adr/ADR-0008-coauthor-expert-contract.md)): all four now map 1:1 to their own
  Expert (`/api/critic`, `/api/reader`, `/api/line-editor`, `/api/coauthor` respectively) —
  whether "Editor" ought to eventually be Line Editor + Developmental Editor + Style Editor
  together, rather than Line Editor alone, remains unspecified by any existing document, but the
  Product Role no longer lacks a mapping. As of Sprint 12, Editor's Expert (Line Editor) also
  optionally receives the whole Book as context, for consistency only — it does not gain
  drafting/generative capability by doing so (see ADR-0004's Sprint 12 revision section and
  ADR-0008's per-Expert context-scope table).
- **"Co-author" is resolved** ([ADR-0008](../adr/ADR-0008-coauthor-expert-contract.md)): a new
  Expert, `/api/coauthor`, was added specifically because the six AI Experts named in ADR-0002
  (Line Editor, Developmental Editor, Style Editor, Continuity Checker, Fact Checker, Research
  Assistant) are all editorial/review-oriented and none performed original drafting. Co-author
  is the first genuinely generative Expert and the first to receive the whole Book (all
  chapters, scenes, characters, and metadata) as context, not just the current Scene.
- Similarly, **"Reader" (3–4 Readers per MVP scope)** has no grounded mapping to any existing
  AI Expert.
- Does a Review always produce exactly one Revision, or can multiple Reviews accumulate before
  a single Revision is made? Not specified anywhere.

## Explicit Assumptions

- Block is assumed, for the purpose of this document only, to be a sub-unit of a Scene (e.g. a
  paragraph) — this is **not confirmed by any existing document** and should not be treated as
  decided.
- Workspace is assumed, for the purpose of this document only, to be the environment in which a
  User works on their Book(s) — **not confirmed by any existing document**.
- "AI Role" and "Product Role" are assumed to be the same concept under two names (see
  Terminology Resolution) rather than two distinct concepts — this is a resolution proposed by
  this document, not a previously-recorded decision.

## Out of Scope

- Any implementation detail (React, Next.js, APIs, database schema, prompts, AI Bus internals).
- A concrete mapping of Product Roles to specific AI Experts (see Open Questions).
- A definition of Block or Workspace beyond the explicit assumptions stated above.
- Any new feature not already named in `PRODUCT_VISION.md` or existing repository
  documentation.
