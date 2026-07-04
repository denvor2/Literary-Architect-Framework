# Literary Studio — Product Vision

This document formalizes the product vision as established by the Architect. It contains no
implementation details, UI mockups, database design, or API design — those belong to later,
separate documents once this vision is approved.

## 1. Product Mission

Literary Studio is an AI-powered IDE for writers.

## 2. Product Vision (1 Year)

- A fully featured writing IDE — the primary environment where a writer does their work, not
  an add-on bolted onto another tool.
- An AI team of specialists collaborating with the writer, not a single generic assistant.
- A project-oriented workflow — writers work within Book Projects, not isolated documents.
- A subscription-based product.
- Persistent storage of the writer's projects.
- Ongoing collaboration with AI experts across the full lifecycle of a manuscript, not a
  one-off tool invocation.

## 3. Target Users

- **Beginner writer** — is starting their first serious writing project and needs structure
  and guidance as much as editing help; likely to lean most heavily on the AI team to
  understand what a finished, professional manuscript should look like.
- **Active amateur writer** — writes regularly and has completed or nearly completed work, but
  lacks access to a professional editorial team; values quality feedback and a consistent
  project workflow across multiple works.
- **Professional author with many unfinished manuscripts** — has more in-progress projects
  than they can bring to completion alone; needs a project-oriented environment that helps
  manage and advance multiple books in parallel, with AI collaborators standing in for the
  editorial team a traditional publishing deal would otherwise provide.

## 4. Core User Journey

```
Create Book
   ↓
Fill project information
   ↓
Create chapters
   ↓
Create scenes
   ↓
Collaborate with AI Co-author
   ↓
Editing
   ↓
Critic
   ↓
Beta readers
   ↓
Iterative improvements
   ↓
Final manuscript
```

A writer starts by creating a Book project and describing it, then builds it out structurally
through chapters and scenes. Drafting happens in collaboration with an AI Co-author. The draft
then moves through Editing and Critic passes, and through Beta Readers for outside-style
feedback. Feedback from any of these stages can send the writer back to iterate before the
manuscript is considered final.

## 5. MVP Scope

**Included:**
- Book projects
- Chapters
- Scenes
- Co-author
- Editor
- Critic
- 3–4 Readers

**Explicitly excluded from MVP:**
- Illustrations
- Merchandise
- Publishing integrations

## 6. Localization

Russian is the primary language of the MVP. The architecture must support multilingual
localization from the beginning, even though MVP delivery targets Russian first.
