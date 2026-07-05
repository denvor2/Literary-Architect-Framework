# ARP — Relocate STANDING-PROMPT.md out of queue/pending/

## STATUS

OK

## SUMMARY

`STANDING-PROMPT.md` was mistakenly placed in `docs/ai-bus/queue/pending/` — per
`docs/ai-bus/queue/README.md`, that folder is reserved for Step Card files (consumable task
descriptors that move through `pending/ → active/ → done/`), not standing procedural
documents. `STANDING-PROMPT.md` is the same kind of document as `docs/ai-bus/BOOTSTRAP.md` —
read once per session, not consumed/moved. Relocated it to `docs/ai-bus/STANDING-PROMPT.md`,
alongside `BOOTSTRAP.md` and `AI_BUS_V4.md`. Added a one-line reference to it in
`BOOTSTRAP.md`'s Role Notes → Programmer (Executor) session, pointing to it as required
reading before checking the queue — without duplicating its content, matching how that same
section already references `CLAUDE.md`/`HANDOVER.md`.

Note: the file was never committed at its original location (`git status` showed it as
untracked, `??`), so this is a plain move + new add from git's perspective, not a tracked
rename — the effect (file no longer in `pending/`, now lives in `docs/ai-bus/`) is the same.

## FILES MODIFIED

- `docs/ai-bus/STANDING-PROMPT.md` — relocated from `docs/ai-bus/queue/pending/`, content
  unchanged.
- `docs/ai-bus/BOOTSTRAP.md` — one line added to the Programmer (Executor) session bullet in
  Role Notes, referencing `STANDING-PROMPT.md`.

## VALIDATION

```
$ ls docs/ai-bus/ | grep -i standing
STANDING-PROMPT.md

$ ls -a docs/ai-bus/queue/pending/
.
..
.gitkeep
```
`pending/` now contains only `.gitkeep` — no procedural documents left in it.

```
$ grep -n "STANDING-PROMPT" docs/ai-bus/BOOTSTRAP.md
39:  session. Before checking `docs/ai-bus/queue/`, also read
40:  [STANDING-PROMPT.md](STANDING-PROMPT.md) — the queue pickup/ARP/Review routine.
```

## RISKS

None identified — pure documentation relocation and a one-line cross-reference; no code, no
Step Card lifecycle affected (`active/`'s existing `Sprint-07-Step-02-Close.md` and its ARP
are untouched by this change).

## SYSTEM STATE

To be committed as `docs/ai-bus: relocate STANDING-PROMPT.md out of queue/pending/
(procedural doc, not a Step Card)`, containing exactly: `docs/ai-bus/STANDING-PROMPT.md`
(new location) and `docs/ai-bus/BOOTSTRAP.md` (one-line reference added).

## NEXT STEP

Awaiting Architect review. No open Step Card is affected by this change.
