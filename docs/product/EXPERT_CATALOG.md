# Literary Studio — Visible Assistant Catalog

A product document describing the assistants a user sees in Literary Studio. This is not an
implementation document and not an AI Bus document — it contains no architecture, no API, and
no AI Expert mappings. Grounded in [PRODUCT_VISION.md](PRODUCT_VISION.md),
[DOMAIN_MODEL.md](DOMAIN_MODEL.md), and [USER_MODEL.md](USER_MODEL.md).

## 1. Purpose

Literary Studio presents a small number of understandable assistants instead of exposing its
internal AI architecture. A writer chooses between a handful of familiar creative roles — not
between technical capabilities.

## 2. Visible Assistants

### Co-author

- **Purpose:** helps the writer draft and develop new material together.
- **Typical tasks:** drafting a scene from an idea, continuing an unfinished passage,
  suggesting how a scene might unfold.
- **When to use:** starting a new Scene or Chapter, or stuck on how to continue one.
- **Expected output:** new or continued manuscript text, offered as a draft for the writer to
  accept, adapt, or discard.

### Editor

- **Purpose:** improves existing text, per the Core User Journey's "Editing" stage.
- **Typical tasks:** fixing grammar, punctuation, and word choice; improving clarity and flow.
- **When to use:** once a passage is drafted and the writer wants it polished.
- **Expected output:** an edited version of the passage, for the writer to review and accept
  or reject.

### Critic

- **Purpose:** evaluates the manuscript and gives feedback, per the Core User Journey's
  "Critic" stage.
- **Typical tasks:** assessing craft dimensions such as plot, characters, or pacing (see
  Progressive Disclosure, below).
- **When to use:** when the writer wants an assessment rather than a direct edit.
- **Expected output:** a Review (per `DOMAIN_MODEL.md`) — written feedback, not a changed
  manuscript.

### Reader

- **Purpose:** reacts to the manuscript the way an outside reader would, per the Core User
  Journey's "Beta readers" stage.
- **Typical tasks:** giving reactions and impressions as a reader would, not as a professional
  editor.
- **When to use:** when the writer wants to know how a real reader might experience the work.
- **Expected output:** reader-style reactions and impressions — a Review, not a changed
  manuscript.

## 3. Progressive Disclosure

Each Visible Assistant may later expose optional specializations without changing the user's
mental model. Example:

```
Critic
 ├── Plot
 ├── Characters
 ├── Style
 ├── Dialogue
 └── Logic
```

**This hierarchy is illustrative, not final.** Its purpose is to show the *kind* of optional
depth an assistant may offer — the specific branches shown here are not a commitment.

## 4. Internal Note

- Visible Assistants (Co-author, Editor, Critic, Reader) are product concepts.
- They may internally invoke one or more AI Experts.
- This document intentionally does not define those mappings — see `DOMAIN_MODEL.md`'s Open
  Questions for that unresolved territory.

## 5. Future Expansion

Additional assistants may appear later — for example, a Research Assistant, an Illustrator, a
Translator, or a Marketing Assistant — without changing existing workflows. Adding one does not
require the user to learn a new way of working with the ones already present.
