# Literary Studio — User Model

Describes what the user believes exists — not what is implemented. Grounded in
[PRODUCT_VISION.md](PRODUCT_VISION.md) and [DOMAIN_MODEL.md](DOMAIN_MODEL.md). Contains no UI
design, no architecture, no implementation detail.

## 1. Design Principle

**The interface exposes simple creative roles. The internal AI Expert system is an
implementation detail.**

Everything below follows from this one principle.

## 2. User Mental Model

How a writer perceives the system, in the writer's own terms:

- I write a book.
- I ask for help.
- I choose who should help me.
- I receive advice.
- I decide whether to apply it.

The writer never needs to think in terms of "Experts," prompts, or any underlying mechanism.
They think in terms of a book, and people (or people-like helpers) who read and respond to it.

## 3. Visible Assistants

The only assistants visible to the user, per `PRODUCT_VISION.md`'s MVP Scope:

- Co-author
- Editor
- Critic
- Readers

These are not mapped to any implementation here — see `DOMAIN_MODEL.md`'s Terminology
Resolution for that boundary. From the user's side, these are simply the people they can ask
for help.

## 4. Progressive Disclosure

**Default:** the user clicks "Critic" (or another Visible Assistant) and receives help. Nothing
more is required.

**Optional:** a user who wants more control may later choose a specific angle of feedback —
for example:

- Plot
- Characters
- Style
- Logic
- Dialogue
- Pacing

This finer-grained choice is illustrative of the *kind* of optional depth the interface may
offer, not a finalized list.

Advanced options are always optional. They must never be required to complete the default
workflow, and their absence must never block a user who only wants to click "Critic" and
receive help.

## 5. Internal Boundary

- Product Roles (Co-author, Editor, Critic, Readers) are part of the user experience.
- AI Experts (the internal capabilities that realize a Product Role) are an implementation
  detail.
- Users are not required to understand, see, or reason about AI Experts at any point.

## 6. Future Expansion

Future assistants may be added over time. Adding one must not change the user's mental
model described in Section 2 — a new assistant is simply one more person to ask for help, not
a reason to learn a new way of thinking about the system.

This document is implementation-agnostic and stays that way regardless of how the underlying
AI Expert system evolves.
